# Build portable ZIP + Inno Setup .exe installer (if iscc is installed)
$ErrorActionPreference = "Stop"
$root = Split-Path $PSScriptRoot -Parent
Set-Location $root

Write-Host "=== Building portable ZIP ==="
& "$PSScriptRoot\package-portable.ps1"

$iscc = @(
  "${env:ProgramFiles(x86)}\Inno Setup 6\ISCC.exe",
  "${env:ProgramFiles}\Inno Setup 6\ISCC.exe"
) | Where-Object { Test-Path $_ } | Select-Object -First 1

if ($iscc) {
  Write-Host "=== Building Setup.exe with Inno Setup ==="
  & $iscc "$PSScriptRoot\installer.iss"
  Write-Host "Installer: $root\dist\ChatServer-Setup.exe"
} else {
  Write-Host ""
  Write-Host "Inno Setup not found. Portable ZIP is ready."
  Write-Host "Install Inno Setup 6 from https://jrsoftware.org/isinfo.php"
  Write-Host "Then run: build\build-installer.ps1"
  Write-Host ""
  Write-Host "Alternative: distribute dist\ChatServer-Portable.zip"
}
