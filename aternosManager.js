const Aternos = require('aternos-unofficial-api');
const path = require('path');
const fs = require('fs');

const USERNAME = process.env.ATERNOS_USERNAME || '';
const PASSWORD = process.env.ATERNOS_PASSWORD || '';

let cachedCookies = null;
let cachedServerId = null;
let isStarting = false;
let lastStartAttempt = 0;
const START_COOLDOWN = 3 * 60 * 1000; // 3 minutes between start attempts

async function login() {
    console.log('[Aternos] Logging in...');
    const cookies = await Aternos.loginToAternos(USERNAME, PASSWORD);
    cachedCookies = cookies;
    console.log('[Aternos] Logged in successfully.');
    return cookies;
}

async function getServerId(cookies) {
    if (cachedServerId) return cachedServerId;
    console.log('[Aternos] Fetching server list...');
    const { servers } = await Aternos.getServerList(cookies);
    if (!servers || servers.length === 0) {
        throw new Error('No Aternos servers found on this account.');
    }
    const target = servers.find(s => s.name && s.name.toLowerCase() === 'lyanbois') || servers[0];
    cachedServerId = target.id;
    console.log(`[Aternos] Found server: ${target.name} (ID: ${cachedServerId})`);
    return cachedServerId;
}

async function startServer() {
    if (!USERNAME || !PASSWORD) {
        console.log('[Aternos] Credentials not configured, skipping auto-start.');
        return false;
    }

    if (isStarting) {
        console.log('[Aternos] Server start already in progress, skipping.');
        return 'waiting';
    }

    const now = Date.now();
    if (now - lastStartAttempt < START_COOLDOWN) {
        const remaining = Math.round((START_COOLDOWN - (now - lastStartAttempt)) / 1000);
        console.log(`[Aternos] Cooldown active, waiting ${remaining}s before next start attempt.`);
        return 'cooldown';
    }

    isStarting = true;
    lastStartAttempt = now;

    try {
        // Clear stale cookies so we get a fresh login if needed
        const cookiesFile = path.join(process.cwd(), 'aternos-cookies.json');
        if (fs.existsSync(cookiesFile)) {
            try {
                const age = now - fs.statSync(cookiesFile).mtimeMs;
                if (age > 12 * 60 * 60 * 1000) {
                    fs.unlinkSync(cookiesFile);
                    cachedCookies = null;
                    console.log('[Aternos] Cleared stale cookies, will re-login.');
                }
            } catch (e) {}
        }

        const cookies = cachedCookies || await login();
        const serverId = await getServerId(cookies);

        console.log('[Aternos] Sending start command to server...');
        const result = await Aternos.manageServer(cookies, serverId, 'start');
        console.log(`[Aternos] Start result: ${JSON.stringify(result)}`);

        if (result && result.success) {
            console.log('[Aternos] Server is starting! Will reconnect in ~3 minutes.');
            return 'started';
        } else {
            const msg = result?.message || '';
            const isAlreadyStarting = msg.toLowerCase().includes('queue') ||
                msg.toLowerCase().includes('starting') ||
                msg.toLowerCase().includes('loading') ||
                msg.toLowerCase().includes('not offline');
            if (isAlreadyStarting) {
                console.log(`[Aternos] Server is already starting/queued — will wait for it to come up.`);
                return 'waiting';
            }
            console.log(`[Aternos] Start failed: ${msg}`);
            return false;
        }
    } catch (err) {
        console.log(`[Aternos] Error starting server: ${err.message}`);
        // Clear cached credentials on auth errors
        if (err.message && err.message.includes('Authentication')) {
            cachedCookies = null;
            cachedServerId = null;
            const cookiesFile = path.join(process.cwd(), 'aternos-cookies.json');
            if (fs.existsSync(cookiesFile)) fs.unlinkSync(cookiesFile);
        }
        return false;
    } finally {
        isStarting = false;
    }
}

module.exports = { startServer };
