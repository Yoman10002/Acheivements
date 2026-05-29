# Chat App — Self-Hosted Server

Run a chat server on your own PC with accounts, friends, direct messages, and an admin dashboard.

## Quick start

```bash
npm install
npm start
```

- **Chat:** http://localhost:3000  
- **Dashboard:** http://localhost:3000/dashboard (default password: `admin123`)

## Features

- **Accounts** — register with any display name; each user gets a unique 8-character **User ID** (e.g. `A7K2M9X1`)
- **Friends** — add others by User ID; accept requests
- **Direct messages** — chat 1-on-1 with friends
- **Rooms** — public chat rooms
- **Themes** — light / dark toggle (saved in browser)
- **Dashboard** — memory limit, worker threads, storage path (USB/other drive), capacity estimates, user kick, purge
- **Portable package** — build ZIP or `.exe` installer from the dashboard

## Configuration (`.env`)

| Setting | Default | Description |
|---------|---------|-------------|
| `MEMORY_MB` | 256 | Node.js heap cap (restart required) |
| `WORKER_THREADS` | 1 | Used for capacity estimate (restart required) |
| `STORAGE_PATH` | `./data` | Database folder — USB, D: drive, etc. |
| `MAX_CONNECTIONS` | 50 | Max online users |
| `MAX_STORAGE_MB` | 500 | Storage cap before auto-trim |

## Download / install on another PC

**From dashboard:** Download tab → **Build Portable Package** → **Download ZIP**

**Full installer (.exe):** Install [Inno Setup 6](https://jrsoftware.org/isinfo.php), then:

```powershell
npm run build:installer
# or
.\build\build-installer.ps1
```

Output: `dist\ChatServer-Portable.zip` and `dist\ChatServer-Setup.exe`

## Internet access (Cloudflare Tunnel)

```bash
cloudflared tunnel --url http://localhost:3000
```
