English | [简体中文](./README.md)

# PowerControl

[![](https://img.shields.io/github/downloads/mengmeet/PowerControl/total.svg)](https://gitHub.com/mengmeet/PowerControl/releases) [![](https://img.shields.io/github/downloads/mengmeet/PowerControl/latest/total)](https://github.com/mengmeet/PowerControl/releases/latest) [![](https://img.shields.io/github/v/release/mengmeet/PowerControl)](https://github.com/mengmeet/PowerControl/releases/latest)

Plugin for [decky-loader](https://github.com/SteamDeckHomebrew/decky-loader)  
Provide performance settings adjustments for handheld

## Manual installation

1. Install [decky-loader](https://github.com/SteamDeckHomebrew/decky-loader)
2. Download PowerControl.zip from [Releases](https://github.com/Gawah/PowerControl/releases)
3. Enable "Developer mode" inside Decky UI (Decky-Loader -> Settings -> General -> Developer mode)
4. Navigate to the Developer section and click "Browse" on "Install Plugin from ZIP file", locate and select the PowerControl.zip and then install it.

## Automatic installation
```
curl -L https://raw.githubusercontent.com/mengmeet/PowerControl/main/install.sh | sh
```

## Function
1. CPU Boost
2. SMT
3. Set the number of cores to enable
4. TDP
5. GPU frequency
6. Auto GPU frequency
7. Fan control

## Supported devices
- Most AMD Ryzen CPU
- Some Intel CPU (experimental, tested with GPD WIN3)

## Reference
[decky-loader](https://github.com/SteamDeckHomebrew/decky-loader)  
[vibrantDeck](https://github.com/libvibrant/vibrantDeck)  
[decky-plugin-template](https://github.com/SteamDeckHomebrew/decky-plugin-template)  
[RyzenAdj](https://github.com/FlyGoat/RyzenAdj)  
