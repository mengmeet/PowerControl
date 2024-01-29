[English](https://github.com/mengmeet/PowerControl/blob/main/README_en.md)
# PowerControl
用于[decky-loader](https://github.com/SteamDeckHomebrew/decky-loader)的插件  
为安装了[holoiso](https://github.com/theVakhovskeIsTaken/holoiso)的手持设备提供性能设置调整  

## 手动安装

1. 安装[decky-loader](https://github.com/SteamDeckHomebrew/decky-loader)
2. 下载[Releases](https://github.com/Gawah/PowerControl/releases)页面的PowerControl.tar.gz
3. 调整插件目录权限 `chmod -R 777 ${HOME}/homebrew/plugins`
4. 解压到/home/xxxx/homebrew/plugins/下
5. 重启 decky-loader, `sudo systemctl restart plugin_loader.service`
6. 进入游戏模式，即可在decky页面使用该插件

## 一键安装
```
curl -L https://raw.githubusercontent.com/mengmeet/PowerControl/main/install.sh | sh
```

## 功能
1. 开关睿频
2. 开关超线程
3. 调整物理核心开启数量
4. 限制TDP
5. 固定GPU频率
6. 自动GPU频率
7. 风扇控制


## 性能调整范围预设
> 以下为各个芯片对应的预设TDP

|      芯片        | TDP | 
| --------------- | ---- |
| AMD 3050e       | 12 W |
| AMD 4800U 4500U | 25 W | 
| AMD 5560U       | 18 W |
| AMD 5700U       | 28 W |
| AMD 5800U 5825U | 30 W |
| AMD 6800U       | 40 W |
| AMD 7840U       | 40 W |
| AMD 7735U       | 40 W |
| AMD 7735HS      | 45 W |
| 其他             | 18 W |

> 以下为各个机型对应的预设TDP(覆盖芯片预设)和风扇适配情况(已适配：经过测试可以正常使用|待验证：未经测试不确定是否存在问题|未适配：隐藏风扇设置选项，等待适配后开放 )

|      机型        | TDP | 风扇适配 | 
| --------------- | ---- | ------ |
| AYA AIR         | 18 W | 待验证 |
| AYA AIR 1S      | 25 W | 未适配 |
| AYA AIR Pro     | 20 W | 待验证 |
| AYA AIR Plus    | 30 W | 未适配 | 
| AYANEO 2        | 30 W | 待验证 |
| AYANEO 2S       | 30 W | 待验证 |
| AYANEO GEEK     | 30 W | 待验证 |
| AYANEO GEEK 1S  | 30 W | 待验证 |
| ONEXPLAYER Mini | 30 W | 待验证 |
| AYA NEXT        | 35 W | 未适配 |
| ONEXPLAYER Mini Pro  | 40 W | 待验证 |
| AOKZOE A1 AR07       | 40 W | 待验证 |
| ONEXPLAYER 2 ARP23   | 45 W | 已适配 |
| GPD WINMAX2     | 45 W | 待验证 |
| GPD WIN4     | 45 W | 待验证 |
| GPD WIN Mini     | 30 W | 已适配 |
| ROG Ally        | 40 W | 未适配 |

**TDP调整基于ryzenadj,因此只支持ryzenadj支持的cpu列表.如有未列出的cpu或者给出的范围数值不正确,请在[issues](https://github.com/Gawah/PowerControl/issues)提交**

## 支持
可以加入我们的qq群:487945399反馈问题，或者在[issues](https://github.com/Gawah/PowerControl/issues)提交

## Reference
[decky-loader](https://github.com/SteamDeckHomebrew/decky-loader)  
[vibrantDeck](https://github.com/libvibrant/vibrantDeck)  
[decky-plugin-template](https://github.com/SteamDeckHomebrew/decky-plugin-template)  
[RyzenAdj](https://github.com/FlyGoat/RyzenAdj)  
