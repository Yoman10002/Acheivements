# Sunshine and Moonlight Setup

This repository documents the configuration for streaming from a Dell Inspiron 15 3542 (Host) to a Samsung Galaxy Tab S9 FE+ (Client) using Sunshine and Moonlight.

## Overview

To enable low-latency game streaming, we utilize:

* **Sunshine:** An open-source, self-hosted game stream host for Moonlight. It serves as the server-side application that captures your desktop and streams it over the network.
* **Moonlight:** An open-source game streaming client. It receives the stream from the Sunshine host, allowing you to play your PC games or access your desktop interface directly on your tablet.

## Remote Connectivity (Tailscale)

Because these are local services that do not natively expose themselves to the public internet, a secure connection method is required for remote access. 

I have implemented **Tailscale** to create a private mesh VPN. This allows the Samsung Tab S9 FE+ to securely reach the Inspiron's local IP address from anywhere in the world, effectively bypassing the need for complex port forwarding or public IP exposure.

## Performance & Limitations

Due to the age of the Inspiron 15 3542 hardware, significant optimization was required to achieve a playable experience.

* **Bitrate:** Limited to **5 Mbps** to accommodate the older wireless and processing capabilities of the host.
* **Resolution:** Reduced to **360p** on both the host and client to decrease the encoding load on the laptop's CPU/iGPU.
* **Encoder:** **Intel QuickSync** as it was the only usable encoder.
* **Tested Software:** Successfully tested with *Sniper Elite V2 (Original)* in 360p.

While performance is inevitably impacted by the older hardware, the setup remains functional and serves as an impressive proof-of-concept for remote play on legacy devices.

### Primary Workstation: Lenovo LOQ 15irx9

Following the success of the initial proof-of-concept, I transitioned to a more powerful workstation to enhance the remote streaming experience:

* **Bitrate:** 15 Mbps (leveraging the superior bandwidth of Wi-Fi 6E).
* **Resolution:** 1080p (matching the native capabilities of the hardware).
* **Codec:** NVEC
* **Tested Software:** *Minecraft*, *Roblox (Midnight Racing: Tokyo, Rivals)*, and *Call of Duty: Modern Warfare 2 (Original)*.

#### Performance Analysis

* **Strengths:** The system delivers a seamless, highly responsive experience. It handles high-fidelity environments, such as high-graphics settings in *Midnight Racing: Tokyo*, Minecraft with BSL shaders, and high-quality profiles in *Call of Duty: Modern Warfare 2*, with ease.
* **Limitations:** I have encountered intermittent network instability, specifically with *Minecraft*. To maintain fluidity, I occasionally drop the resolution to 720p. These fluctuations are expected when operating over a wireless connection rather than a hardwired Ethernet link.


---

### Prerequisites
* **Host:** Dell Inspiron 15 3542/LOQ 15irx9 running [Sunshine](https://app.lizardbyte.dev/).
* **Client:** Samsung Galaxy Tab S9 FE+ running [Moonlight](https://moonlight-stream.org/).
* **Network:** [Tailscale](https://tailscale.com/) installed and authenticated on both devices.

### Setup Steps
1. Install and configure **Sunshine** on the Inspiron 15 3542 (Host).
2. Install the **Moonlight** app on the Tab S9 FE+ (Client).
3. Connect both devices to the same **Tailscale** network.
4. Open Moonlight on your Client and enter the Tailscale IP address of your Host to pair the devices.

*Updated on 6/15/2026*
