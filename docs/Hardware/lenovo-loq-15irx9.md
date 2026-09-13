# 💻 Hardware Profile: Lenovo LOQ 2024/2025

**Role:** Primary Workstation  
**Status:** Aquired  

---

## 🎯 Selection Rationale
Choosing a machine is a balance between raw performance and build longevity. While other models in this price bracket offered higher-tier GPUs (e.g., RTX 5050), I opted for the LOQ for specific engineering reasons:

*   **Chassis Integrity:** I prioritized thermal management and structural rigidity. A superior chassis ensures better airflow, which directly impacts sustained performance and hardware longevity.
*   **Thermal Headroom:** By selecting the LOQ chassis, I am trading a marginal GPU tier increase for a more stable, cooler-running system.
*   **Longevity Strategy:** My goal is to maintain this machine for the long term. A robust build reduces the risk of the structural degradation (hinges/chassis fatigue) I experienced with my previous workstation.

---

## ⚙️ Specifications
| Component | Specification |
| :--- | :--- |
| **CPU** | Intel Core i7-13650HX (6 P-cores, 8 E-cores, 20 Threads) |
| **GPU** | NVIDIA RTX 4050 Laptop GPU (6GB GDDR6 VRAM) |
| **RAM** | 16GB DDR5 |
| **Storage** | 512GB NVMe PCIe 4.0 SSD |
| **Display** | 144Hz IPS Panel |
| **Battery** | 63Whr |

---

## 📋 Maintenance & Configuration Log

### Phase 1: Clean Slate
* [ ] **OS Clean Install:** Perform a fresh Windows 11 installation to strip manufacturer bloatware and achieve a "factory-clean" state. (failed)
* [x] **System Debloat:** Apply custom scripts to disable telemetry and non-essential background processes.

### Phase 2: Linux Experimentation  (Paused due to low storage, of 512GB)
* [ ] **Fedora Workstation Deployment:** Partition the SSD to install Fedora Workstation.
* [ ] **Workflow Evaluation:** Transition daily tasks to Linux to test stability, resource efficiency, and software compatibility compared to the Windows environment.
* [ ] **Long-term Assessment:** Determine if Fedora meets the requirements for a daily driver to replace the Windows-dominant workflow.

---

## Battery Optimization & Low-Level Tuning

**Goal:** Overcome high-TDP hardware limits (50W–100W+ envelope) and factory firmware restrictions to maximize efficiency and extend operational runtime during unplugged sessions.

## Technical Challenges & Bottlenecks
| Component | Hardware Constraint |
| :--- | :--- |
| **CPU:** i7-13650HX | Substantial baseline power draw; aggressive stock boost parameters accelerate battery drainage. |
| **Display:** 144Hz Panel | High refresh rate increases baseline display engine power workloads. |
| **Battery:** 63Whr | Restricted capacity requires aggressive low-power state management to achieve acceptable endurance. |
| **Firmware Limitations** | Lenovo OEM firmware locks custom fan curves out of the native "Silent" mode (forcing a constant ~2,000 RPM idle fan speed unplugged). Custom fan curves are only natively executable under AC power. |

## Implemented Solutions
* **Power Settings (ThrottleStop):**
  * **Undervolt:** -135mv constant on Core and Cache. E-Cores kept at 0 mv for stability.
  * **V/F Point Customization:** Tuned specific Voltage/Frequency points across individual profiles to optimize voltage scaling under load.
    ![V/F Point Customization](TS_V/F.png)
  * **Profile 4 (Battery / Power Saver):** Programmed strict power constraints (PL1/PL2 restricted to **25W/30W** with a 56-second turbo time limit) and maxed out Speed Shift EPP to **255**. This successfully dropped system idle power draw from **8–9W down to 6.6–7W**.
  * **Profile 1 (High Performance):** Capped AC performance profile PL1/PL2 power limits at **50W** to rein in thermal throttling while retaining multi-core responsiveness.
* **Thermal Architecture & Fan Management (Lenovo Legion Toolkit):**
  * Engineered a custom fan curve mapping out acoustics and thermal dissipation thresholds for AC operation. 
  * *Note:* Because firmware blocks custom fan profiles on battery mode (forcing stock Silent mode's constant ~2,000 RPM), AC profile tuning achieves superior acoustic zero-RPM states when thermal loads permit, outperforming rigid OEM profiles.
* **Real-World Endurance Metrics:**
  * Post-optimization, battery runtime improved dramatically from an initial **0.5–1 hour** window up to **2–2.5 hours** under mixed daily workflows (Edge browser with 3–4 tabs, Discord, and media playback), and reaching roughly **3 hours** under strict idle states.

---
*Last Updated: 2026-06-17*
