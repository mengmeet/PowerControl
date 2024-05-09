import os
from ec import EC
from config import logging, PRODUCT_NAME
from config import FAN_HWMON_LIST, FAN_EC_CONFIG
import decky_plugin
from settings import SettingsManager


class FanConfig:

    def __init__(self):
        # HWMON配置变量
        self.is_found_hwmon = False  # 是否找到风扇hwmon
        self.fan_name = "FAN"  # 风扇在图表中显示的名字
        self.hwmon_name = None  # 风扇hwmon名字
        self.hwmon_mode = 0  # 风扇模式
        self.hwmon_enable_path = None  # 风扇自动控制hwmon地址
        self.hwmon_enable_second_path = None  # 风扇写入自动控制hwmon地址(次要)
        self.hwmon_manual_val = 1  # 手动模式写到自动控制hwmon地址的数值
        self.hwmon_auto_val = 0  # 自动模式写到自动控制hwmon地址的数值
        self.hwmon_pwm_path = None  # 风扇写入转速hwmon地址
        self.hwmon_mode1_pwm_path = []  # 风扇写入转速和对应温度hwmon地址列表(模式1)
        self.hwmon_mode1_auto_val = []  # 风扇写入转速和对应温度hwmon地址列表(模式1)
        self.hwmon_input_path = None  # 风扇读取转速hwmon地址

        # EC配置变量
        self.is_ec_configured = False  # 是否配置好风扇ec
        self.manual_offset = None  # 风扇自动控制ec地址
        self.pwm_write_offset = None  # 风扇写入转速ec地址
        self.pwm_read_offset = None  # 风扇读取转速ec地址

        # ECRAM配置变量
        self.ram_reg_addr = None  # 风扇ecRam寄存器地址
        self.ram_reg_data = None  # 风扇ecRam寄存器数据
        self.ram_manual_offset = None  # 风扇自动控制ecRam地址
        self.ram_pwm_write_offset = None  # 风扇写入转速ecRam地址
        self.ram_pwm_read_offset = None  # 风扇读取转速ecRam地址
        self.ram_pwm_read_length = 0  # 风扇实际转速值长度 0为需要通过计算获得转速

        # 其他变量
        self.pwm_write_max = 0  # 风扇最大转速写入值
        self.pwm_value_max = 0  # 风扇最大转速读取数值
        self.temp_mode = 0  # 使用cpu或者gpu温度

        self.latest_fanRPM = -1


class FanManager:
    def __init__(self):
        self.settings = SettingsManager(
            name="fans_config",
            settings_directory=decky_plugin.DECKY_PLUGIN_SETTINGS_DIR,
        )
        self.fan_config_list: list[FanConfig] = []  # 记录每一个风扇的配置
        self.cpu_temp_path = ""  # CPU温度路径
        self.gpu_temp_path = ""  # GPU温度路径
        self.parse_fan_configuration()  ##转化风扇配置
        self.device_init_quirks()  # 设备特殊初始化

    # 自动更新风扇最大值
    def update_fan_max_value(self, cpu_temp: int):
        for index, fan_config in enumerate(self.fan_config_list):
            current_rpm = self.get_fanRPM(index)
            max_value = fan_config.pwm_value_max
            cup_temp = cpu_temp if cpu_temp > 0 else self.get_fanTemp(index)
            # 如果 current_rpm 和 fan_config.FAN_RPMVALUE_MAX 相差大于 5%, 则更新 max_value
            if (
                cup_temp > 75000 and (max_value - max_value) / int(max_value) > 0.05
            ) or (int(current_rpm) - max_value) / int(max_value) > 0.05:
                logging.info(
                    f"cup_temp {cup_temp}, 风扇{index} 当前转速已达到最大值, 更新最大值: {max_value} -> {current_rpm}"
                )
                fan_config.pwm_value_max = current_rpm
                self.settings.setSetting(f"fan{index}_max", current_rpm)

    # 转化风扇配置
    def parse_fan_configuration(self):
        hwmon_path = "/sys/class/hwmon"
        hwmon_files = os.listdir(hwmon_path)
        name_path_map = {}

        # 转化hwmon信息
        for file in hwmon_files:
            path = hwmon_path + "/" + file
            name = open(path + "/name").read().strip()
            name_path_map[name] = path
            if name == "amdgpu":
                self.gpu_temp_path = path + "/temp1_input"
            # if(name == "k10temp" or name == "acpitz"):
            #     self.FAN_CPUTEMP_PATH = path + "/temp1_input"

            # 优先读取 k10temp
            if not self.cpu_temp_path and name == "k10temp":
                self.cpu_temp_path = path + "/temp1_input"
            if not self.cpu_temp_path and name == "acpitz":
                self.cpu_temp_path = path + "/temp1_input"

        for hwmon_name in FAN_HWMON_LIST:
            if hwmon_name not in name_path_map:
                continue
            for hwmon_config in FAN_HWMON_LIST[hwmon_name]:
                try:
                    fc = FanConfig()
                    fc.is_found_hwmon = True
                    fc.hwmon_name = hwmon_name
                    fc.fan_name = hwmon_config["fan_name"]
                    fc.hwmon_mode = hwmon_config["pwm_mode"]

                    fan_pwm_enable = hwmon_config["pwm_enable"]
                    fc.hwmon_manual_val = fan_pwm_enable["manual_value"]
                    fc.hwmon_auto_val = fan_pwm_enable["auto_value"]
                    fc.hwmon_enable_path = (
                        name_path_map[hwmon_name]
                        + "/"
                        + fan_pwm_enable["pwm_enable_path"]
                    )
                    fc.hwmon_enable_second_path = (
                        name_path_map[hwmon_name]
                        + "/"
                        + fan_pwm_enable["pwm_enable_second_path"]
                        if "pwm_enable_second_path" in fan_pwm_enable
                        else None
                    )

                    black_list = (
                        hwmon_config["black_list"]
                        if (
                            "black_list" in hwmon_config
                            and hwmon_config["black_list"] != None
                        )
                        else []
                    )

                    fan_pwm_write = hwmon_config["pwm_write"]
                    pwm_write_max = fan_pwm_write["pwm_write_max"]
                    if PRODUCT_NAME in pwm_write_max:
                        fc.pwm_write_max = pwm_write_max[PRODUCT_NAME]
                    else:
                        fc.pwm_write_max = pwm_write_max["default"]
                    if fc.hwmon_mode == 0:
                        fc.hwmon_pwm_path = (
                            name_path_map[hwmon_name]
                            + "/"
                            + fan_pwm_write["pwm_write_path"]
                            if "pwm_write_path" in fan_pwm_write
                            and fan_pwm_write["pwm_write_path"] != ""
                            else None
                        )
                    elif fc.hwmon_mode == 1:
                        pwm_mode1_write_path = (
                            fan_pwm_write["pwm_mode1_write_path"]
                            if "pwm_mode1_write_path" in fan_pwm_write
                            else []
                        )
                        for point in pwm_mode1_write_path:
                            point_info = {
                                "pwm_write": name_path_map[hwmon_name]
                                + "/"
                                + point["pwm_write"],
                                "temp_write": name_path_map[hwmon_name]
                                + "/"
                                + point["temp_write"],
                            }
                            if os.path.exists(
                                point_info["pwm_write"]
                            ) and os.path.exists(point_info["temp_write"]):
                                fc.hwmon_mode1_pwm_path.append(point_info)
                        pwm_mode1_auto_value = (
                            fan_pwm_write["pwm_mode1_auto_value"]
                            if "pwm_mode1_auto_value" in fan_pwm_write
                            else []
                        )
                        for value in pwm_mode1_auto_value:
                            value_info = {
                                "pwm_write_value": value["pwm_write_value"],
                                "temp_write_value": value["temp_write_value"],
                            }
                            fc.hwmon_mode1_auto_val.append(value_info)

                    fan_pwm_input = hwmon_config["pwm_input"]
                    fan_hwmon_label_input = fan_pwm_input["hwmon_label"]
                    fc.hwmon_input_path = (
                        name_path_map[fan_hwmon_label_input]
                        + "/"
                        + fan_pwm_input["pwm_read_path"]
                    )
                    fc.fan_value_max = (
                        fan_pwm_input["pwm_read_max"]
                        if "pwm_read_max" in fan_pwm_input
                        else 0
                    )
                    max_value_from_settings = self.settings.getSetting(
                        f"fan{len(self.fan_config_list)}_max"
                    )
                    fc.pwm_value_max = (
                        max_value_from_settings
                        if (
                            max_value_from_settings != None
                            and max_value_from_settings > fc.fan_value_max
                        )
                        else fc.fan_value_max
                    )
                    fc.temp_mode = hwmon_config["temp_mode"]
                    self.fan_config_list.append(fc)
                except:
                    logging.error(
                        f"获取风扇({hwmon_name})hwmon信息失败:", exc_info=True
                    )

        # 若已获取到风扇hwmon信息 并且 PRODUCT_NAME 不在 black_list 则不再获取风扇ec信息
        if len(self.fan_config_list) > 0 and PRODUCT_NAME not in black_list:
            logging.info(
                f"已获取到风扇hwmon信息:{[config.hwmon_name for config in self.fan_config_list]}"
            )
        else:
            logging.info(f"未获取到风扇hwmon信息,开始获取风扇ec信息")
            self.fan_config_list.clear()
            # 转化ec信息
            for ec_info in FAN_EC_CONFIG if FAN_EC_CONFIG != None else []:
                try:
                    fc = FanConfig()
                    # EC配置变量
                    fc.manual_offset = (
                        ec_info["manual_offset"] if "manual_offset" in ec_info else None
                    )  # 风扇自动控制ec地址
                    fc.pwm_write_offset = (
                        ec_info["rpmwrite_offset"]
                        if "rpmwrite_offset" in ec_info
                        else None
                    )  # 风扇写入转速ec地址
                    fc.pwm_read_offset = (
                        ec_info["rpmread_offset"]
                        if "rpmread_offset" in ec_info
                        else None
                    )  # 风扇读取转速ec地址
                    # ECRAM配置变量
                    fc.ram_reg_addr = (
                        ec_info["ram_reg_addr"] if "ram_reg_addr" in ec_info else None
                    )  # 风扇ecRam寄存器地址
                    fc.ram_reg_data = (
                        ec_info["ram_reg_data"] if "ram_reg_data" in ec_info else None
                    )  # 风扇ecRam寄存器数据
                    fc.ram_manual_offset = (
                        ec_info["ram_manual_offset"]
                        if "ram_manual_offset" in ec_info
                        else None
                    )  # 风扇自动控制ecRam地址
                    fc.ram_pwm_write_offset = (
                        ec_info["ram_rpmwrite_offset"]
                        if "ram_rpmwrite_offset" in ec_info
                        else None
                    )  # 风扇写入转速ecRam地址
                    fc.ram_pwm_read_offset = (
                        ec_info["ram_rpmread_offset"]
                        if "ram_rpmread_offset" in ec_info
                        else None
                    )  # 风扇读取转速ecRam地址
                    fc.ram_pwm_read_length = (
                        ec_info["ram_rpmread_length"]
                        if "ram_rpmread_length" in ec_info
                        else 0
                    )  # 风扇实际转速值长度 0为需要通过计算获得转速
                    # 其他变量
                    fc.pwm_write_max = (
                        ec_info["rpm_write_max"] if "rpm_write_max" in ec_info else 0
                    )  # 风扇最大转速写入值

                    # 风扇最大转速读取数值
                    fc.fan_value_max = (
                        ec_info["rpm_value_max"] if "rpm_value_max" in ec_info else 0
                    )
                    max_value_from_settings = self.settings.getSetting(
                        f"fan{len(self.fan_config_list)}_max"
                    )
                    logging.info(
                        f"max_value_from_settings:{max_value_from_settings}, fan_config.fan_value_max:{fc.fan_value_max}"
                    )
                    fc.pwm_value_max = (
                        max_value_from_settings
                        if (
                            max_value_from_settings != None
                            and max_value_from_settings > fc.fan_value_max
                        )
                        else fc.fan_value_max
                    )
                    logging.info(f"fan_config.FAN_RPMVALUE_MAX:{fc.pwm_value_max}")

                    fc.hwmon_manual_val = (
                        ec_info["enable_manual_value"]
                        if "enable_manual_value" in ec_info
                        else 1
                    )
                    fc.hwmon_auto_val = (
                        ec_info["enable_auto_value"]
                        if "enable_auto_value" in ec_info
                        else 0
                    )
                    fc.temp_mode = 0
                    # 判断是否配置好ec(控制地址、读和写至少各有一种方法,最大写入和最大读取必须有配置数值)
                    fc.is_ec_configured = (
                        (fc.manual_offset != None or fc.ram_manual_offset != None)
                        and (
                            fc.pwm_write_offset != None
                            or fc.ram_pwm_write_offset != None
                        )
                        and (
                            fc.pwm_read_offset != None or fc.ram_pwm_read_offset != None
                        )
                        and (fc.pwm_write_max != 0 and fc.pwm_value_max != 0)
                    )
                    if fc.is_ec_configured:
                        self.fan_config_list.append(fc)
                    logging.info(f"fan_config_list to json {fc.__dict__}")
                except:
                    logging.error(f"获取风扇({hwmon_name})ec信息失败:", exc_info=True)

    # 设备特殊初始化
    def device_init_quirks(self):
        # 遍历所有风扇配置
        for fan_config in self.fan_config_list:
            try:
                # ecram配置
                FAN_IS_EC_CONFIGURED = fan_config.is_ec_configured
                FAN_RAM_REG_ADDR = fan_config.ram_reg_addr
                FAN_RAM_REG_DATA = fan_config.ram_reg_data
                # 有配置ec并且是win4
                if FAN_IS_EC_CONFIGURED and PRODUCT_NAME == "G1618-04":
                    # Initialize GPD WIN4 EC
                    ec_chip_id = EC.RamRead(FAN_RAM_REG_ADDR, FAN_RAM_REG_DATA, 0x2000)
                    if ec_chip_id == 0x55:
                        ec_chip_ver = EC.RamRead(
                            FAN_RAM_REG_ADDR, FAN_RAM_REG_DATA, 0x1060
                        )
                        ec_chip_ver |= 0x80
                        EC.RamWrite(
                            FAN_RAM_REG_ADDR, FAN_RAM_REG_DATA, 0x1060, ec_chip_ver
                        )
            except:
                logging.error("设备特殊初始化失败:", exc_info=True)

    def get_fanRPM(self, index: int):
        try:
            if index > len(self.fan_config_list) - 1:
                logging.error(
                    f"风扇下标越界 index:{index} len:{len(self.fan_config_list)}"
                )
                return 0

            fc = self.fan_config_list[index]

            # HWMON 读取
            if fc.is_found_hwmon:
                return self.__get_fanRPM_HWMON(fc)

            # ECIO 读取
            if fc.is_ec_configured:
                return self.__get_fanRPM_ECIO(fc)

            # ECRAM 读取
            if fc.ram_pwm_read_offset:
                return self.__get_fanRPM_ECRAM(fc)
        except:
            logging.error(f"获取风扇转速异常:", exc_info=True)
            return 0

    def __get_fanRPM_HWMON(self, fc: FanConfig):
        try:
            hwmon_input_path = fc.hwmon_input_path
            fanRPM = int(open(hwmon_input_path).read().strip())
            logging.debug(
                f"使用hwmon数据 当前机型:{PRODUCT_NAME} hwmon地址:{hwmon_input_path} 风扇转速:{fanRPM}"
            )
            return fanRPM
        except:
            logging.error(f"使用hwmon获取风扇转速异常:", exc_info=True)
            return 0

    def __get_fanRPM_ECIO(self, fc: FanConfig):
        try:
            rpm_read_offset = fc.pwm_read_offset
            fanRPM = EC.ReadLonger(rpm_read_offset, 2)
            logging.debug(
                f"使用ECIO数据 当前机型:{PRODUCT_NAME} EC地址:{hex(rpm_read_offset)} 风扇转速:{fanRPM}"
            )
            return fanRPM
        except:
            logging.error(f"获取风扇转速异常:", exc_info=True)
            return 0

    def __get_fanRPM_ECRAM(self, fc: FanConfig):
        try:
            ram_read_offset = fc.ram_pwm_read_offset
            ram_reg_addr = fc.ram_reg_addr
            ram_reg_data = fc.ram_reg_data
            ram_rpm_read_length = fc.ram_pwm_read_length
            rpm_write_max = fc.pwm_write_max
            rpm_value_max = fc.pwm_value_max
            ram_manual_offset = fc.ram_manual_offset

            if ram_rpm_read_length > 0:
                fanRPM = EC.RamReadLonger(
                    ram_reg_addr, ram_reg_data, ram_read_offset, ram_rpm_read_length
                )
            else:
                fanRPM = int(
                    EC.RamRead(ram_reg_addr, ram_reg_data, ram_read_offset)
                    * rpm_value_max
                    / rpm_write_max
                )
            logging.debug(
                f"使用ECRAM数据 当前机型:{PRODUCT_NAME} EC_ADDR:{hex(ram_reg_addr)} EC_DATA={hex(ram_reg_data)} EC地址:{hex(ram_read_offset)} 风扇转速:{fanRPM}"
            )
            fanIsManual = EC.RamRead(ram_reg_addr, ram_reg_data, ram_manual_offset)
            logging.debug(
                f"使用ECRAM数据 读取EC地址:{hex(ram_manual_offset)} 风扇控制位:{fanIsManual}"
            )
            return fanRPM
        except:
            logging.error(f"获取风扇转速异常:", exc_info=True)
            return 0

    def get_fanIsAuto(self, index: int):
        try:
            if index < len(self.fan_config_list):
                is_found_hwmon = self.fan_config_list[index].is_found_hwmon
                hwmon_mode = self.fan_config_list[index].hwmon_mode
                hwmon_pwm_enable_path = self.fan_config_list[index].hwmon_enable_path
                hwmon_pwm_enable_second_path = self.fan_config_list[
                    index
                ].hwmon_enable_second_path
                enable_auto_value = self.fan_config_list[index].hwmon_auto_val
                try:
                    if is_found_hwmon and hwmon_mode == 0:
                        if (
                            not os.path.exists(hwmon_pwm_enable_path)
                            and hwmon_pwm_enable_second_path != None
                            and os.path.exists(hwmon_pwm_enable_second_path)
                        ):
                            hwmon_pwm_enable_path = hwmon_pwm_enable_second_path
                        fanIsManual = int(open(hwmon_pwm_enable_path).read().strip())
                        logging.debug(
                            f"使用hwmon数据 读取hwmon地址:{hwmon_pwm_enable_path} 风扇是否控制:{fanIsManual == enable_auto_value}"
                        )
                        # return not fanIsManual
                        return fanIsManual == enable_auto_value
                except:
                    logging.error(f"使用hwmon获取风扇状态异常:", exc_info=True)

                # ECRAM 读取
                ram_manual_offset = self.fan_config_list[index].ram_manual_offset
                ram_reg_addr = self.fan_config_list[index].ram_reg_addr
                ram_reg_data = self.fan_config_list[index].ram_reg_data
                logging.debug(f"ram_manual_offset:{ram_manual_offset}")
                try:
                    if ram_manual_offset:
                        fanIsManual = EC.RamRead(
                            ram_reg_addr, ram_reg_data, ram_manual_offset
                        )
                        logging.info(
                            f"使用ECRAM数据 读取EC地址:{hex(ram_manual_offset)} 风扇是否控制:{fanIsManual == enable_auto_value}"
                        )
                        return fanIsManual == enable_auto_value
                except:
                    logging.error(f"使用ECRAM获取风扇状态异常:", exc_info=True)

                # ECIO 读取
                manual_offset = self.fan_config_list[index].ram_manual_offset
                try:
                    if manual_offset:
                        fanIsManual = EC.Read(manual_offset)
                        logging.debug(
                            f"使用ECIO数据 读取EC地址:{hex(manual_offset)} 风扇是否控制:{fanIsManual == enable_auto_value}"
                        )
                        return fanIsManual == enable_auto_value
                except:
                    logging.error(f"使用ECIO获取风扇状态异常:", exc_info=True)

                return False
            else:
                logging.debug(
                    f"风扇下标越界 index:{index} len:{len(self.fan_config_list)}"
                )
                return False
        except:
            logging.error(f"获取风扇状态异常:", exc_info=True)
            return False

    def set_fanAuto(self, index: int, value: bool):
        logging.debug(
            f"set_fanAuto index:{index} value:{value}, len:{len(self.fan_config_list)}"
        )
        try:
            if index < len(self.fan_config_list):
                is_found_hwmon = self.fan_config_list[index].is_found_hwmon
                hwmon_mode = self.fan_config_list[index].hwmon_mode
                hwmon_pwm_enable_path = self.fan_config_list[index].hwmon_enable_path
                hwmon_pwm_enable_second_path = self.fan_config_list[
                    index
                ].hwmon_enable_second_path
                hwmon_pwm_path = self.fan_config_list[index].hwmon_pwm_path
                hwmon_mode1_pwm_path = self.fan_config_list[index].hwmon_mode1_pwm_path
                enable_manual_value = self.fan_config_list[index].hwmon_manual_val
                enable_auto_value = self.fan_config_list[index].hwmon_auto_val
                mode1_auto_value = self.fan_config_list[index].hwmon_mode1_auto_val
                try:
                    if is_found_hwmon and hwmon_mode == 0:
                        if (
                            not os.path.exists(hwmon_pwm_enable_path)
                            and hwmon_pwm_enable_second_path != None
                            and os.path.exists(hwmon_pwm_enable_second_path)
                        ):
                            hwmon_pwm_enable_path = hwmon_pwm_enable_second_path

                        if value:
                            fanIsManual = (
                                enable_auto_value if value else enable_manual_value
                            )
                        elif (
                            not value and hwmon_pwm_path == hwmon_pwm_enable_path
                        ):  # 手动模式且控制位地址和写风扇转速的地址一样，跳过控制位写入，防止覆盖风扇转速
                            logging.debug(
                                f"写入hwmon_eanble地址:{hwmon_pwm_enable_path} 写入hwmon_pwm地址:{hwmon_pwm_enable_path} 地址相同跳过写入控制位"
                            )
                            return False
                        else:
                            fanIsManual = enable_manual_value

                        # GPD 设备没有实际的单独的控制位。但是在oxpec中有控制位，写入手动控制时会将转速设置为 70%。所以添加判断，只在需要时写入控制位
                        currentFanIsManual = int(
                            open(hwmon_pwm_enable_path).read().strip()
                        )
                        if currentFanIsManual == fanIsManual:
                            logging.debug(
                                f"currentFanIsManual:{currentFanIsManual} fanIsManual:{fanIsManual} 无需写入"
                            )
                            return True

                        open(hwmon_pwm_enable_path, "w").write(str(fanIsManual))
                        logging.debug(
                            f"写入hwmon数据 写入hwmon地址:{hwmon_pwm_enable_path} 写入风扇是否控制:{fanIsManual}"
                        )
                        return True

                    elif is_found_hwmon and hwmon_mode == 1 and value:
                        fanIsManual = enable_manual_value
                        for index, mode1_pwm_path in enumerate(hwmon_mode1_pwm_path):
                            if index >= len(mode1_auto_value):
                                break
                            # 写入转速
                            fanWriteValue = mode1_auto_value[index]["pwm_write_value"]
                            pwm_path = mode1_pwm_path["pwm_write"]
                            open(pwm_path, "w").write(str(fanWriteValue))
                            # 写入温度
                            temp = mode1_auto_value[index]["temp_write_value"]
                            temp_path = mode1_pwm_path["temp_write"]
                            open(temp_path, "w").write(str(temp))
                            logging.debug(
                                f"写入hwmon数据 写入hwmon转速地址:{pwm_path} 风扇转速写入值:{fanWriteValue} 温度地址:{temp_path} 温度大小:{temp}"
                            )
                        open(hwmon_pwm_enable_path, "w").write(str(fanIsManual))
                        logging.debug(
                            f"写入hwmon数据 写入hwmon地址:{hwmon_pwm_enable_path} 写入风扇是否控制:{fanIsManual}"
                        )
                        return True
                except:
                    logging.error(f"使用hwmon写入风扇状态异常:", exc_info=True)

                # ECRAM 写入
                ram_manual_offset = self.fan_config_list[index].ram_manual_offset
                ram_rpm_write_offset = self.fan_config_list[index].ram_pwm_write_offset
                ram_reg_addr = self.fan_config_list[index].ram_reg_addr
                ram_reg_data = self.fan_config_list[index].ram_reg_data
                try:
                    if ram_manual_offset:
                        if (
                            not value and ram_manual_offset == ram_rpm_write_offset
                        ):  # 手动模式且控制位地址和写风扇转速的地址一样，跳过控制位写入，防止覆盖风扇转速
                            return False
                        fanIsManual = (
                            enable_auto_value if value else enable_manual_value
                        )
                        EC.RamWrite(
                            ram_reg_addr, ram_reg_data, ram_manual_offset, fanIsManual
                        )
                        logging.info(
                            f"写入ECRAM数据 写入EC地址:{hex(ram_manual_offset)} 写入风扇是否控制:{fanIsManual}"
                        )
                        return True
                except:
                    logging.error(f"使用ECRAM写入风扇状态异常:", exc_info=True)

                # ECIO 写入
                manual_offset = self.fan_config_list[index].manual_offset
                rpm_write_offset = self.fan_config_list[index].pwm_write_offset
                try:
                    if manual_offset:
                        if (
                            not value and manual_offset == rpm_write_offset
                        ):  # 手动模式且控制位地址和写风扇转速的地址一样，跳过控制位写入，防止覆盖风扇转速
                            return False
                        fanIsManual = (
                            enable_auto_value if value else enable_manual_value
                        )
                        EC.Write(manual_offset, fanIsManual)
                        logging.debug(
                            f"写入ECIO数据 写入EC地址:{hex(manual_offset)} 写入风扇是否控制:{fanIsManual}"
                        )
                        return True
                except:
                    logging.error(f"使用ECIO写入风扇状态异常:", exc_info=True)
            else:
                logging.debug(
                    f"风扇下标越界 index:{index} len:{len(self.fan_config_list)}"
                )
            return False
        except:
            logging.error(f"写入风扇状态异常:", exc_info=True)
            return False

    def set_fanPercent(self, index: int, value: int):
        try:
            if index < len(self.fan_config_list):
                is_found_hwmon = self.fan_config_list[index].is_found_hwmon
                hwmon_mode = self.fan_config_list[index].hwmon_mode
                rpm_write_max = self.fan_config_list[index].pwm_write_max
                hwmon_pwm_path = self.fan_config_list[index].hwmon_pwm_path
                hwmon_mode1_pwm_path = self.fan_config_list[index].hwmon_mode1_pwm_path
                enable_manual_value = self.fan_config_list[index].hwmon_manual_val
                hwmon_pwm_enable_path = self.fan_config_list[index].hwmon_enable_path
                hwmon_pwm_enable_second_path = self.fan_config_list[
                    index
                ].hwmon_enable_second_path
                try:
                    if is_found_hwmon and hwmon_mode == 0:
                        if (
                            not os.path.exists(hwmon_pwm_enable_path)
                            and hwmon_pwm_enable_second_path != None
                            and os.path.exists(hwmon_pwm_enable_second_path)
                        ):
                            hwmon_pwm_enable_path = hwmon_pwm_enable_second_path

                        fanWriteValue = max(
                            min(int(value / 100 * rpm_write_max), rpm_write_max), 0
                        )
                        currentVal = int(open(hwmon_pwm_path).read().strip())
                        # 转速相差小于5%时不写入
                        if (
                            currentVal > 0
                            and abs(currentVal - fanWriteValue) / currentVal < 0.05
                        ):
                            logging.info(
                                f"当前风扇转速{currentVal} 与目标转速{fanWriteValue} 相差小于5% 不写入"
                            )
                            return True
                        open(hwmon_pwm_path, "w").write(str(fanWriteValue))
                        logging.debug(
                            f"写入hwmon数据 写入hwmon地址:{hwmon_pwm_path} 风扇转速百分比{value} 风扇最大值{rpm_write_max} 风扇转速写入值:{fanWriteValue}"
                        )
                        return True
                    if is_found_hwmon and hwmon_mode == 1:
                        fanWriteValue = max(
                            min(int(value / 100 * rpm_write_max), rpm_write_max), 0
                        )
                        temp = 10
                        addTemp = int(100 / len(hwmon_mode1_pwm_path))
                        if hwmon_mode1_pwm_path:
                            for mode1_pwm_path in hwmon_mode1_pwm_path:
                                # 写入转速
                                pwm_path = mode1_pwm_path["pwm_write"]
                                open(pwm_path, "w").write(str(fanWriteValue))
                                # 写入温度
                                temp = temp + addTemp
                                temp_path = mode1_pwm_path["temp_write"]
                                open(temp_path, "w").write(str(temp))
                                logging.debug(
                                    f"写入hwmon数据 写入hwmon转速地址:{pwm_path} 风扇转速百分比{value} 风扇最大值{rpm_write_max} 风扇转速写入值:{fanWriteValue} 温度地址:{temp_path} 温度大小:{temp}"
                                )
                        fanIsManual = enable_manual_value

                        open(hwmon_pwm_enable_path, "w").write(str(fanIsManual))
                        logging.debug(
                            f"写入hwmon数据 写入hwmon地址:{hwmon_pwm_enable_path} 写入风扇是否控制:{fanIsManual}"
                        )
                        return True
                except:
                    logging.error("使用hwmon写入风扇转速异常:", exc_info=True)

                ram_reg_addr = self.fan_config_list[index].ram_reg_addr
                ram_reg_data = self.fan_config_list[index].ram_reg_data
                ram_rpm_write_offset = self.fan_config_list[index].ram_pwm_write_offset
                try:
                    if ram_rpm_write_offset:
                        fanWriteValue = max(
                            min(int(value / 100 * rpm_write_max), rpm_write_max), 0
                        )
                        EC.RamWrite(
                            ram_reg_addr,
                            ram_reg_data,
                            ram_rpm_write_offset,
                            fanWriteValue,
                        )
                        logging.info(
                            f"写入ECRAM数据 写入EC地址:{hex(ram_rpm_write_offset)} 风扇转速百分比{value} 风扇最大值{rpm_write_max} 风扇转速写入值:{fanWriteValue}"
                        )
                        return True
                except:
                    logging.error("使用ECRAM写入风扇转速异常:", exc_info=True)

                rpm_write_offset = self.fan_config_list[index].pwm_write_offset
                try:
                    if rpm_write_offset:
                        fanWriteValue = max(
                            min(int(value / 100 * rpm_write_max), rpm_write_max), 0
                        )
                        EC.Write(rpm_write_offset, fanWriteValue)
                        logging.debug(
                            f"写入ECIO数据 写入EC地址:{hex(rpm_write_offset)} 风扇转速百分比{value} 风扇最大值{rpm_write_max} 风扇转速写入值:{fanWriteValue}"
                        )
                        return True
                except:
                    logging.error("使用ECIO写入风扇转速异常:", exc_info=True)
            else:
                logging.error(
                    f"风扇下标越界 index:{index} len:{len(self.fan_config_list)}"
                )
            return False
        except:
            logging.error(f"写入风扇转速异常:", exc_info=True)
            return False

    def get_fanTemp(self, index: int):
        try:
            if index < len(self.fan_config_list):
                if self.fan_config_list[index].temp_mode == 0:
                    cpu_temp = self.get_cpuTemp()
                    if cpu_temp == -1:
                        gpu_temp = self.get_gpuTemp()
                        return gpu_temp
                    return cpu_temp
                elif self.fan_config_list[index].temp_mode == 1:
                    gpu_temp = self.get_gpuTemp()
                    if gpu_temp == -1:
                        cpu_temp = self.get_gpuTemp()
                        return cpu_temp
                    return gpu_temp
                else:
                    logging.error(f"未知的温度来源配置:", exc_info=True)
            else:
                logging.debug(
                    f"风扇下标越界 index:{index} len:{len(self.fan_config_list)}"
                )
            return 0
        except:
            logging.error(f"获取温度异常:", exc_info=True)
            return 0

    def get_gpuTemp(self):
        try:
            if self.gpu_temp_path == "":
                hwmon_path = "/sys/class/hwmon"
                hwmon_files = os.listdir(hwmon_path)
                for file in hwmon_files:
                    path = hwmon_path + "/" + file
                    name = open(path + "/name").read().strip()
                    if name == "amdgpu":
                        self.gpu_temp_path = path + "/temp1_input"
            temp = int(open(self.gpu_temp_path).read().strip())
            logging.debug(f"获取gpu温度:{temp}")
            return temp
        except Exception as e:
            logging.error(f"获取gpu温度异常:{e}")
            return -1

    def get_cpuTemp(self):
        try:
            if os.path.exists(self.cpu_temp_path):
                temp = int(open(self.cpu_temp_path).read().strip())

                self.update_fan_max_value(temp)
            else:
                temp = -1
            logging.debug(f"获取cpu温度: path:{self.cpu_temp_path} temp:{temp}")
            return temp
        except Exception as e:
            logging.error(f"获取cpu温度异常:{e}")
            return -1

    def get_fanConfigList(self):
        try:
            if len(self.fan_config_list) > 0:
                logging.debug(f"机型已适配fan 当前机型:{PRODUCT_NAME}")
                config_list = []
                for config in self.fan_config_list:
                    fan_name = config.fan_name
                    fan_max_rpm = config.pwm_value_max
                    fan_hwmon_mode = config.hwmon_mode
                    config_list.append(
                        {
                            "fan_name": fan_name,
                            "fan_max_rpm": fan_max_rpm,
                            "fan_hwmon_mode": fan_hwmon_mode,
                        }
                    )
                return config_list
            else:
                logging.debug(f"机型未适配fan 当前机型:{PRODUCT_NAME}")
            return []
        except Exception as e:
            logging.error(f"获取机型适配异常:{e}")
            return []


fanManager = FanManager()
