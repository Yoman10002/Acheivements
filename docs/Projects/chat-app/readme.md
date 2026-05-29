# 💬 Self-Hosted Chat Server

A lightweight, local-first chat application designed for personal use and private communication.

## 🚀 Key Features
* **User Management:** Secure account registration with unique 8-character IDs.
* **Social:** Friend requests and 1-on-1 direct messaging.
* **Community:** Public chat rooms for group discussions.
* **Admin Dashboard:** Full control over server resources, including memory limits, worker thread management, and storage trimming.
* **Portability:** Built-in tools to generate portable ZIPs or `.exe` installers.

## ⚙️ Configuration
The server behavior is managed via an `.env` file (not included in this repository):

| Setting | Description |
| :--- | :--- |
| `MEMORY_MB` | Node.js heap capacity. |
| `WORKER_THREADS` | Processor thread allocation for capacity estimation. |
| `STORAGE_PATH` | Local directory for database storage (supports external drives). |
| `MAX_CONNECTIONS` | Concurrent user capacity. |
| `MAX_STORAGE_MB` | Storage cap before automatic data trimming. |

## 🛠️ Usage
1. `npm install`
2. `npm start`
3. Access at `http://localhost:3000` (Default Admin: `admin123`)

## 📦 Deployment & Portability
### Generate Portable Package
From the Dashboard: **Download tab** → **Build Portable Package** → **Download ZIP**.

### Build Full Installer (.exe)
1. Install **Inno Setup 6**.
2. Run the build command:
```bash
   npm run build:installer
   # Or via PowerShell:
   .\build\build-installer.ps1
