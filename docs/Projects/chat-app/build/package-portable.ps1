# Builds ChatServer-Portable.zip for download / copy to other PCs
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
$dist = Join-Path $root "dist"
$stage = Join-Path $dist "ChatServer"
$zipPath = Join-Path $dist "ChatServer-Portable.zip"

if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory -Force -Path $stage | Out-Null

# Copy app files (exclude node_modules, data, dist)
$exclude = @("node_modules", "dist", "data", ".git")
Get-ChildItem $root -Force | Where-Object {
  $_.Name -notin $exclude
} | ForEach-Object {
  Copy-Item $_.FullName -Destination $stage -Recurse -Force
}

# Ensure data folder placeholder
New-Item -ItemType Directory -Force -Path (Join-Path $stage "data") | Out-Null

# Launcher batch
@'
@echo off
title Chat Server
cd /d "%~dp0"
echo Starting Chat Server...
if exist "node\node.exe" (
  set PATH=%~dp0node;%PATH%
)
call npm install --omit=dev 2>nul
if errorlevel 1 (
  echo npm install failed. Install Node.js from https://nodejs.org
  pause
  exit /b 1
)
start http://localhost:3000
start http://localhost:3000/dashboard
node start.js
pause
'@ | Set-Content -Path (Join-Path $stage "Start Chat Server.bat") -Encoding ASCII

# README in package
@'
Chat Server — Portable Package
==============================
1. Double-click "Start Chat Server.bat"
2. Chat: http://localhost:3000
3. Dashboard: http://localhost:3000/dashboard (default password in .env)

Requires Node.js on the PC OR run build-installer.ps1 with Inno Setup for full installer.
'@ | Set-Content -Path (Join-Path $stage "README-PACKAGE.txt") -Encoding UTF8

# Zip
if (Test-Path $zipPath) { Remove-Item $zipPath -Force }
Compress-Archive -Path $stage -DestinationPath $zipPath -Force
Write-Host "Created: $zipPath"
