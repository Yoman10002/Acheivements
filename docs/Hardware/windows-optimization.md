# Windows Optimization Log

## Overview
* **Machine:** Dell Inspiron 15 3542 (i3-4005U / 8GB RAM)
* **OS:** Windows 11 21H2
* **Objective:** Reduce system latency and resolve aggressive BIOS throttling.

---

## 1. System Debloating
* **The Problem:** Excessive background processes (Telemetry, Cortana, bloatware) consuming limited CPU cycles and RAM.
* **The Solution:** 
    * Performed system-wide debloating via PowerShell and service configuration.
    * Manually disabled non-essential services via `services.msc`.
* **Result:** Reduced idle RAM usage to **2.7GB–3GB**; eliminated background CPU spikes.

## 2. Power & Thermal Management (BD PROCHOT)
* **The Problem:** Hardware wear on the charging port resulted in the identification pin failing to make contact. The Dell BIOS responded by triggering an aggressive **BD PROCHOT** (Bi-Directional Processor Hot) signal, locking the CPU frequency to 800MHz.
* **The Solution:**
    * Deployed **ThrottleStop** to override the BIOS power-state management.
    * Unchecked the **BD PROCHOT** box to bypass the false thermal throttling signal.
* **Result:** Restored full CPU clock speeds and normal operating performance.

---
*Last Updated: 2026-05-28*
