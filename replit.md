# Minecraft AFK Bot

## Overview
A Node.js bot that keeps a Minecraft server (Aternos or similar) online 24/7 by automatically joining and performing anti-AFK actions.

## Architecture
- **Runtime**: Node.js 20
- **Package Manager**: npm
- **Entry Point**: `index.js`
- **Config**: `settings.json`

## Key Files
- `index.js` — Main bot logic + Express web dashboard on port 5000
- `settings.json` — Server IP, bot credentials, anti-AFK, Discord webhook settings
- `leaveRejoin.js` — Handles periodic leave/rejoin cycles

## Features
- Anti-AFK movements (circle walk, look around, random jump)
- Auto-auth for servers using login plugins
- Auto-reconnect with exponential backoff
- Discord webhook notifications for connect/disconnect events
- Web dashboard at port 5000 showing bot status

## Running
```bash
npm start
```

## Deployment
- Target: VM (always running)
- Port: 5000
- Run command: `node index.js`
