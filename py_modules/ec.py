import time

import portio
from config import logger

EC_CMD_STATUS_REGISTER_PORT = 0x66
EC_DATA_REGISTER_PORT = 0x62
EC_IBF_BIT = 1
EC_OBF_BIT = 0
RD_EC = 0x80  # Read Embedded Controller
WR_EC = 0x81  # Write Embedded Controller

# for register in [EC_DATA_REGISTER_PORT, EC_CMD_STATUS_REGISTER_PORT]:
#    status = portio.ioperm(register, 1, 1)
status = portio.iopl(3)


class EC:
    @staticmethod
    def Wait(port, flag, value):
        for i in range(200):
            data = portio.inb(port)
            if ((data >> flag) & 0x1) == value:
                condition = True
                break
            time.sleep(0.001)

    @staticmethod
    def Read(address: int):
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_IBF_BIT, 0)
        portio.outb(RD_EC, EC_CMD_STATUS_REGISTER_PORT)
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_IBF_BIT, 0)
        portio.outb(address, EC_DATA_REGISTER_PORT)
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_OBF_BIT, 1)
        result = portio.inb(EC_DATA_REGISTER_PORT)
        logger.debug(f"ECRead  address:{hex(address)} value:{result}")
        return result

    @staticmethod
    def ReadLonger(address: int, length: int):
        sum = 0
        for len in range(length):
            value = EC.Read(address + len)
            sum = (sum << 8) + value
            # logger.debug(f"count={len} sum={sum} address={address+len} value={value}")
        logger.debug(f"ECReadLonger  address:{hex(address)} value:{sum}")
        return sum

    @staticmethod
    def Write(address: int, data: int):
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_IBF_BIT, 0)
        portio.outb(WR_EC, EC_CMD_STATUS_REGISTER_PORT)
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_IBF_BIT, 0)
        portio.outb(address, EC_DATA_REGISTER_PORT)
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_IBF_BIT, 0)
        portio.outb(data, EC_DATA_REGISTER_PORT)
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_IBF_BIT, 0)
        logger.debug(f"ECWrite  address:{hex(address)} value:{data}")

    @staticmethod
    def RamWrite(comm_port: int, data_port: int, address: int, data: int):
        high_byte = (address >> 8) & 0xFF
        low_byte = address & 0xFF
        portio.outb(0x2E, comm_port)
        portio.outb(0x11, data_port)
        portio.outb(0x2F, comm_port)
        portio.outb(high_byte, data_port)

        portio.outb(0x2E, comm_port)
        portio.outb(0x10, data_port)
        portio.outb(0x2F, comm_port)
        portio.outb(low_byte, data_port)

        portio.outb(0x2E, comm_port)
        portio.outb(0x12, data_port)
        portio.outb(0x2F, comm_port)
        portio.outb(data, data_port)
        logger.debug(
            f"ECRamWrite high_byte={hex(high_byte)} low_byte={hex(low_byte)} address:{hex(address)} value:{data}"
        )

    @staticmethod
    def RamRead(comm_port: int, data_port: int, address: int):
        high_byte = (address >> 8) & 0xFF
        low_byte = address & 0xFF
        portio.outb(0x2E, comm_port)
        portio.outb(0x11, data_port)
        portio.outb(0x2F, comm_port)
        portio.outb(high_byte, data_port)

        portio.outb(0x2E, comm_port)
        portio.outb(0x10, data_port)
        portio.outb(0x2F, comm_port)
        portio.outb(low_byte, data_port)

        portio.outb(0x2E, comm_port)
        portio.outb(0x12, data_port)
        portio.outb(0x2F, comm_port)
        data = portio.inb(data_port)
        logger.debug(
            f"ECRamRead high_byte={hex(high_byte)} low_byte={hex(low_byte)} address:{hex(address)} value:{data}"
        )
        return data

    @staticmethod
    def RamReadLonger(reg_addr: int, reg_data: int, address: int, length: int):
        sum = 0
        for len in range(length):
            value = EC.RamRead(reg_addr, reg_data, address + len)
            sum = (sum << 8) + value
            # logger.debug(f"count={len} sum={sum} address={address+len} value={value}")
        logger.debug(f"ECReadLonger  address:{hex(address)} value:{sum}")
        return sum

    def PrintAll():
        print("", "\t", end="")
        for z in range(0xF + 1):
            print(hex(z), "\t", end="")
        print()
        for x in range(0xF + 1):
            for y in range(0xF + 1):
                if y == 0x00:
                    print(hex(x), "\t", end="")
                print(EC.Read((x << 4) + y), "\t", end="")
            print()
