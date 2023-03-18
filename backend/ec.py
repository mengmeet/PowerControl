import portio
import time
import os
import asyncio
from config import logging
EC_CMD_STATUS_REGISTER_PORT = 0x66
EC_DATA_REGISTER_PORT = 0x62
EC_IBF_BIT = 1
EC_OBF_BIT = 0
RD_EC = 0x80
WR_EC = 0x81

for register in [EC_DATA_REGISTER_PORT, EC_CMD_STATUS_REGISTER_PORT]:
    status = portio.ioperm(register, 1, 1)

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
        logging.debug(f"ECRead  address:{hex(address)} value:{result}")
        return result

    @staticmethod
    def ReadLonger(address:int,length:int):
        sum=0
        for len in range(length):
            value = EC.Read(address+len)
            sum = (sum<<8) + value
            #logging.debug(f"count={len} sum={sum} address={address+len} value={value}")
        logging.debug(f"ECReadLonger  address:{hex(address)} value:{sum}")
        return sum


    @staticmethod
    def Write(address:int,data:int):
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_IBF_BIT, 0)
        portio.outb(WR_EC, EC_CMD_STATUS_REGISTER_PORT)
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_IBF_BIT, 0)
        portio.outb(address, EC_DATA_REGISTER_PORT)
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_IBF_BIT, 0)
        portio.outb(data, EC_DATA_REGISTER_PORT)
        EC.Wait(EC_CMD_STATUS_REGISTER_PORT, EC_IBF_BIT, 0)
        logging.debug(f"ECWrite  address:{hex(address)} value:{data}")
    
    def PrintAll():
        print("","\t",end="")
        for z in range(0xf+1):
            print(hex(z),"\t",end="")
        print()
        for x in range(0xf+1):
            for y in range(0xf+1):
                if y==0x00:
                    print(hex(x),"\t",end="")
                print(EC.Read((x<<4)+y),"\t",end="")
            print()
