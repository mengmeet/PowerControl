import logging
import subprocess
import glob
import os
from helpers import get_homebrew_path
from enum import Enum

#日志配置
LOG_LOCATION = "/tmp/PowerControl_py.log"
logging.basicConfig(
    level = logging.INFO,
    filename = LOG_LOCATION,
    format="[%(asctime)s | %(filename)s:%(lineno)s:%(funcName)s] %(levelname)s: %(message)s",
    filemode = 'w',
    force = True)

#路径配置
try:
    HOMEBREW_PATH = get_homebrew_path()   
    SH_PATH="{}/plugins/PowerControl/backend/sh_tools.sh".format(HOMEBREW_PATH)
    RYZENADJ_PATH="{}/plugins/PowerControl/bin/ryzenadj".format(HOMEBREW_PATH)
    GPU_DEVICE_PATH = glob.glob("/sys/class/drm/card?/device")[0]
    GPUFREQ_PATH = "{}/pp_od_clk_voltage".format(GPU_DEVICE_PATH)
    GPULEVEL_PATH = "{}/power_dpm_force_performance_level".format(GPU_DEVICE_PATH)
except Exception as e:
    logging.error(f"路径配置异常|{e}")

#设备信息获取配置
try:
    cpuinfo_path = "/proc/cpuinfo"
    cpuinfo = open(cpuinfo_path, "r").read()
    CPU_ID = cpuinfo.split("model name")[1].split(":")[1].split("\n")[0].strip()
    PRODUCT_NAME = open("/sys/devices/virtual/dmi/id/product_name", "r").read().strip()
    logging.info(f"CPU_ID: {CPU_ID}, PRODUCT_NAME: {PRODUCT_NAME}")
except Exception as e:
    logging.error(f"设备信息配置异常|{e}")

#TDP上限配置
try:
    TDP_LIMIT_CONFIG_PRODUCT={
        "AIR":18,
        "AIR 1S":25,
        "AIR 1S Limited":20,
        "AIR Pro":20,
        "AIR Plus":30,
        "AYANEO 2":30,
        "GEEK":30,
        "GEEK 1S":30,
        "AYANEO 2S":30,
        "ONEXPLAYER Mini":30,
        "NEXT":35,
        "ONEXPLAYER Mini Pro":40,
        "AOKZOE A1 AR07":40,
        "ONEXPLAYER 2 ARP23":45,
        "ONEXPLAYER F1":35,
        "ONEXPLAYER F1 EVA-01":35,
        "G1619-04":45,     #GPD WINMAX2
        "G1618-04":45,     #GPD WIN4
        "G1617-01":30,    #GPD WIN mini
        "ROG Ally RC71L_RC71L":30,
        "ROG Ally RC71L":30,
        "Jupiter":20,
    }
    TDP_LIMIT_CONFIG_CPU={
        "7735HS":65,
        "7735U":40,
        "7735":45,
        "5560U":18,
        "5700U":28,
        "5800U":30,
        "5825U":30,
        "6800U":40,
        "4800U":25,
        "4500U":25,
        "3050e":12,
        "Z1 Extreme":40,
        "7840HS": 65,
        "7840U": 40,
        "7840": 45,
    }
except Exception as e:
    logging.error(f"TDP配置异常|{e}")

#风扇配置
try:
    '''
        #风扇hwmon配置示范
        "hwmon目录下name文件内容":[{
            "fan_name":"Fan",   #显示在风扇中的名字
            "pwm_mode":0, #写入的模式 0.普通模式(对单个文件写入) 1.rog掌机特殊模式(对多个文件写入同样的数值)
            "pwm_enable":{
                "manual_value": 1,  #手动控制时写入的数值
                "auto_value": 0,    #自动控制时写入的数值
                "pwm_enable_path":"pwm1_enable"    #写入数值的文件路径(数值模式)
            },
            "pwm_write":{
                "pwm_write_max":{
                    "default":100,
                    "product_name1":255,
                    "product_name2":64
                },     #写入转速最大值(根据不同产品名写入不同的最大值，没有则使用默认)
                "pwm_write_path":"pwm1",   #写入转速路径
                "pwm_mode1_write_path":[
                    {"pwm_write":"xxxxxxxxxx","temp_write":"xxxxxxxx"}, #写入转速和温度的文件名
                    {"pwm_write":"xxxxxxxxx","temp_write":"xxxxxxxx"}
                    .....
                ]   #模式1写入转速曲线的路径
                 "pwm_mode1_default_value":[
                    {"pwm_write_value":"3","temp_write_value":"39"},
                    {"pwm_write_value":"3","temp_write_value":"40"}
                ]  #模式1处于auto时写入的值
            },
            "pwm_input":{
                "hwmon_label":"oxpec",   #读转速的hwmon标签(读取转速和写入转速可能不在同一个hwmon)
                "pwm_read_path":"fan1_input"    #读取转速的文件名
            }
            "temp_mode":0   #温度使用哪个数据  0.cpu温度(不可用时切换到gpu温度)  1.gpu温度(不可用时切换到cpu温度)
        },{第二个风扇..},{.....}
        ],
    '''
    #风扇驱动配置
    FAN_HWMON_LIST={
        "oxpec":[{
            "fan_name":"Fan",
            "pwm_mode":0,
            "pwm_enable":{
                "manual_value": 1,
                "auto_value": 0,
                "pwm_enable_path":"pwm1_enable"
            },
            "pwm_write":{
                "pwm_write_max":{
                    "default":255,
                    "ONEXPLAYER F1":255,
                    "ONEXPLAYER F1 EVA-01":255
                },
                "pwm_write_path":"pwm1"
            },
            "pwm_input":{
                "hwmon_label":"oxpec",
                "pwm_read_path":"fan1_input",
                "pwm_read_max": 5030
            },
            "temp_mode":0
        }],

        "asus_custom_fan_curve":[{
            "fan_name":"CPU Fan",
            "pwm_mode":1,
            "pwm_enable":{
                "manual_value": 1,
                "auto_value": 2,
                "pwm_enable_path":"pwm1_enable"
            },
            "pwm_write":{
                "pwm_write_max":{
                    "default":255,
                    "ROG Ally RC71L_RC71L":255
                }, 
                "pwm_mode1_write_path":[
                    {"pwm_write":"pwm1_auto_point1_pwm","temp_write":"pwm1_auto_point1_temp"},
                    {"pwm_write":"pwm1_auto_point2_pwm","temp_write":"pwm1_auto_point2_temp"},
                    {"pwm_write":"pwm1_auto_point3_pwm","temp_write":"pwm1_auto_point3_temp"},
                    {"pwm_write":"pwm1_auto_point4_pwm","temp_write":"pwm1_auto_point4_temp"},
                    {"pwm_write":"pwm1_auto_point5_pwm","temp_write":"pwm1_auto_point5_temp"},
                    {"pwm_write":"pwm1_auto_point6_pwm","temp_write":"pwm1_auto_point6_temp"},
                    {"pwm_write":"pwm1_auto_point7_pwm","temp_write":"pwm1_auto_point7_temp"},
                    {"pwm_write":"pwm1_auto_point1_pwm","temp_write":"pwm1_auto_point8_temp"}
                ],
                "pwm_mode1_auto_value":[
                    {"pwm_write_value":3,"temp_write_value":39},
                    {"pwm_write_value":3,"temp_write_value":40},
                    {"pwm_write_value":3,"temp_write_value":50},
                    {"pwm_write_value":3,"temp_write_value":60},
                    {"pwm_write_value":10,"temp_write_value":70},
                    {"pwm_write_value":38,"temp_write_value":80},
                    {"pwm_write_value":77,"temp_write_value":90},
                    {"pwm_write_value":115,"temp_write_value":100}
                ]
            },
            "pwm_input":{
                "hwmon_label":"asus",
                "pwm_read_path":"fan1_input",
                "pwm_read_max":8200       
            },
            "temp_mode":0 
        },{
            "fan_name":"GPU Fan",
            "pwm_mode":1,
            "pwm_enable":{
                "manual_value": 1,
                "auto_value": 2,
                "pwm_enable_path":"pwm2_enable"
            },
            "pwm_write":{
                "pwm_write_max":{
                    "default":255
                },
                "pwm_mode1_write_path":[
                    {"pwm_write":"pwm2_auto_point1_pwm","temp_write":"pwm2_auto_point1_temp"},
                    {"pwm_write":"pwm2_auto_point2_pwm","temp_write":"pwm2_auto_point2_temp"},
                    {"pwm_write":"pwm2_auto_point3_pwm","temp_write":"pwm2_auto_point3_temp"},
                    {"pwm_write":"pwm2_auto_point4_pwm","temp_write":"pwm2_auto_point4_temp"},
                    {"pwm_write":"pwm2_auto_point5_pwm","temp_write":"pwm2_auto_point5_temp"},
                    {"pwm_write":"pwm2_auto_point6_pwm","temp_write":"pwm2_auto_point6_temp"},
                    {"pwm_write":"pwm2_auto_point7_pwm","temp_write":"pwm2_auto_point7_temp"},
                    {"pwm_write":"pwm2_auto_point1_pwm","temp_write":"pwm2_auto_point8_temp"}
                ],
                "pwm_mode1_auto_value":[
                    {"pwm_write_value":3,"temp_write_value":39},
                    {"pwm_write_value":3,"temp_write_value":40},
                    {"pwm_write_value":3,"temp_write_value":50},
                    {"pwm_write_value":3,"temp_write_value":60},
                    {"pwm_write_value":10,"temp_write_value":70},
                    {"pwm_write_value":38,"temp_write_value":80},
                    {"pwm_write_value":77,"temp_write_value":90},
                    {"pwm_write_value":115,"temp_write_value":100}
                ]
            },
            "pwm_input":{
                "hwmon_label":"asus",
                "pwm_read_path":"fan2_input",
                "pwm_read_max":8200       
            },
            "temp_mode":0
        }],

        "steamdeck_hwmon":[{
            "fan_name":"Fan",
            "pwm_mode":0, #0.写入数值 1.写入曲线
            "pwm_enable":{
                "manual_value": 1,  #手动控制写入的数值
                "auto_value": 0,    #自动控制写入的数值
                "pwm_enable_path":"fan1_target"    #写入数值的文件路径
            },
             "pwm_write":{
                "pwm_write_max":7300,
                "pwm_write_path":"fan1_target"
            },
            "pwm_input":{
                "hwmon_label":"steamdeck_hwmon",
                "pwm_read_path":"fan1_input",
                "pwm_read_max":7309
            },
            "temp_mode":0
        }]
    }
    '''
        #风扇ec配置示范
        if PRODUCT_NAME in (
            "ONEXPLAYER 2 ARP23",   #/sys/devices/virtual/dmi/id/product_name 内容
        ):
        FAN_EC_CONFIG=[{
            "FAN_MANUAL_OFFSET":0x4a,    #风扇自动控制ec地址
            "FAN_RPMWRITE_OFFSET":0x4b, #风扇写入转速ec地址
            "FAN_RPMREAD_OFFSET":0x58,  #风扇读取转速ec地址

            "FAN_RAM_REG_ADDR":0x4E,    #风扇ecRam寄存器地址
            "FAN_RAM_REG_DATA":0x4F,     #风扇ecRam寄存器数据
            "FAN_RAM_MANUAL_OFFSET":0x44a,  #风扇自动控制ecRam地址
            "FAN_RAM_RPMWRITE_OFFSET":0x44b,    #风扇写入转速ecRam地址
            "FAN_RAM_RPMREAD_OFFSET":0x1809,    #风扇读取转速ecRam地址
            "FAN_RAM_RPMREAD_LENGTH":0,  #风扇实际转速值长度 0为需要通过计算获得转速

            "FAN_RPMWRITE_MAX":184, #风扇最大转速ec写入值
            "FAN_RPMVALUE_MAX":5000  #风扇最大转速数值
        },{第二个风扇},{....}]

    '''
    #风扇ec配置 
    FAN_EC_CONFIG=[]

    if PRODUCT_NAME in (
        "ONEXPLAYER 2 ARP23",
        ):
        FAN_EC_CONFIG=[{
            "FAN_MANUAL_OFFSET":0x4a,
            "FAN_RPMWRITE_OFFSET":0x4b,
            "FAN_RPMREAD_OFFSET":0x58,

            "FAN_RAM_REG_ADDR":0x4E,
            "FAN_RAM_REG_DATA":0x4F,
            "FAN_RAM_MANUAL_OFFSET":0x44a,
            "FAN_RAM_RPMWRITE_OFFSET":0x44b,
            "FAN_RAM_RPMREAD_OFFSET":0x1809,
            "FAN_RAM_RPMREAD_LENGTH":0,

            "FAN_RPMWRITE_MAX":184,
            "FAN_RPMVALUE_MAX":5000
        }]
    elif PRODUCT_NAME in (
        "AIR",
        "AIR Pro",
        ):
        FAN_EC_CONFIG=[{
            "FAN_MANUAL_OFFSET":0x4a,
            "FAN_RPMWRITE_OFFSET":0x4b,
            "FAN_RPMREAD_OFFSET":0x76,

            "FAN_RAM_REG_ADDR":0x4E,
            "FAN_RAM_REG_DATA":0x4F,
            "FAN_RAM_MANUAL_OFFSET":0x44a,
            "FAN_RAM_RPMWRITE_OFFSET":0x44b,
            "FAN_RAM_RPMREAD_OFFSET":0x1809,
            "FAN_RAM_RPMREAD_LENGTH":0,

            "FAN_RPMWRITE_MAX":255,
            "FAN_RPMVALUE_MAX":5811
        }]
    elif PRODUCT_NAME in (
        "AYANEO 2",
        "AYANEO 2S",
        "GEEK",
        "GEEK 1S",
        ):
        FAN_EC_CONFIG=[{
            "FAN_MANUAL_OFFSET":0x4a,
            "FAN_RPMWRITE_OFFSET":0x4b,
            "FAN_RPMREAD_OFFSET":0x76,

            "FAN_RAM_REG_ADDR":0x4E,
            "FAN_RAM_REG_DATA":0x4F,
            "FAN_RAM_MANUAL_OFFSET":0x44a,
            "FAN_RAM_RPMWRITE_OFFSET":0x44b,
            "FAN_RAM_RPMREAD_OFFSET":0x1809,
            "FAN_RAM_RPMREAD_LENGTH":0,

            "FAN_RPMWRITE_MAX":255,
            "FAN_RPMVALUE_MAX":5530
        }]
    elif PRODUCT_NAME in (
        "ONEXPLAYER Mini Pro",
        "AOKZOE A1 AR07",
        ):
        FAN_EC_CONFIG=[{
            "FAN_MANUAL_OFFSET":0x4a,
            "FAN_RPMWRITE_OFFSET":0x4b,
            "FAN_RPMREAD_OFFSET":0x76,

            "FAN_RAM_REG_ADDR":0x4E,
            "FAN_RAM_REG_DATA":0x4F,
            "FAN_RAM_MANUAL_OFFSET":0x44a,
            "FAN_RAM_RPMWRITE_OFFSET":0x44b,
            "FAN_RAM_RPMREAD_OFFSET":0x1809,
            "FAN_RAM_RPMREAD_LENGTH":0,

            "FAN_RPMWRITE_MAX":255,
            "FAN_RPMVALUE_MAX":4968
        }]
    elif PRODUCT_NAME in (
        "G1618-04",
        ):
        FAN_EC_CONFIG=[{
            "FAN_RAM_REG_ADDR":0x2E,
            "FAN_RAM_REG_DATA":0x2F,
            "FAN_RAM_MANUAL_OFFSET":0xC311,
            "FAN_RAM_RPMWRITE_OFFSET":0xC311,
            "FAN_RAM_RPMREAD_OFFSET":0x880,
            "FAN_RAM_RPMREAD_LENGTH":2,

            "FAN_RPMWRITE_MAX":127,
            "FAN_RPMVALUE_MAX":4968
        }]
    elif PRODUCT_NAME in (
        "G1619-04",
        ):
        FAN_EC_CONFIG=[{
            "FAN_RAM_REG_ADDR":0x4E,
            "FAN_RAM_REG_DATA":0x4F,
            "FAN_RAM_MANUAL_OFFSET":0x275,
            "FAN_RAM_RPMWRITE_OFFSET":0x1809,
            "FAN_RAM_RPMREAD_OFFSET":0x218,
            "FAN_RAM_RPMREAD_LENGTH":2,

            "FAN_RPMWRITE_MAX":184,
            "FAN_RPMVALUE_MAX":4968
        }]
    elif PRODUCT_NAME in (
        "G1617-01",
        ):
        FAN_EC_CONFIG=[{
            "FAN_RAM_REG_ADDR":0x4E,
            "FAN_RAM_REG_DATA":0x4F,
            "FAN_RAM_MANUAL_OFFSET":0x47A,
            "FAN_RAM_RPMWRITE_OFFSET":0x47A,
            "FAN_RAM_RPMREAD_OFFSET":0x478,
            "FAN_RAM_RPMREAD_LENGTH":2,

            "FAN_RPMWRITE_MAX":244,
            "FAN_RPMVALUE_MAX":6700
        }]
    
except Exception as e:
    logging.error(f"风扇配置异常|{e}")
