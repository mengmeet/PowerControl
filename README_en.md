# PowerControl
Plugin for [decky-loader](https://github.com/SteamDeckHomebrew/decky-loader)  
Provide performance settings adjustments for handheld installed with [holoiso](https://github.com/theVakhovskeIsTaken/holoiso)

## Manual installation

1. Install [decky-loader](https://github.com/SteamDeckHomebrew/decky-loader)
2. Download PowerControl.tar.gz from [Releases](https://github.com/Gawah/PowerControl/releases)
3. Modify directory permissions `chmod -R 777 ${HOME}/homebrew/plugins`
4. Extract to /home/xxxx/homebrew/plugins/
5. Restart decky-loader, `sudo systemctl restart plugin_loader.service`

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


## Reference
[decky-loader](https://github.com/SteamDeckHomebrew/decky-loader)  
[vibrantDeck](https://github.com/libvibrant/vibrantDeck)  
[decky-plugin-template](https://github.com/SteamDeckHomebrew/decky-plugin-template)  
[RyzenAdj](https://github.com/FlyGoat/RyzenAdj)  
