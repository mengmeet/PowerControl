import subprocess
import shutil
import time
import re
from typing import Optional, List, Tuple

from config import logger
from .power_device import PowerDevice
from utils import get_env  # Import environment variable cleanup function

# PowerStation DBus service information
DBUS_SERVICE_NAME = "org.shadowblip.PowerStation"
DBUS_BASE_PATH = "/org/shadowblip/Performance/GPU"
DBUS_CARD_PREFIX = "card"
DBUS_GPU_INTERFACE = "org.shadowblip.GPU"
DBUS_GPU_CARD_INTERFACE = "org.shadowblip.GPU.Card"
DBUS_TDP_INTERFACE = "org.shadowblip.GPU.Card.TDP"

# Command execution constants
COMMAND_TIMEOUT = 5.0  # Command execution timeout (seconds)
CACHE_TIMEOUT = 30.0  # GPU card path cache timeout (seconds)


class PowerStationDevice(PowerDevice):
    def __init__(self):
        super().__init__()
        self._gpu_card_path: Optional[str] = None
        self._card_path_timestamp: float = 0
        self._last_error_time: float = 0
        self._error_cooldown: float = 10.0  # Error cooldown time

    def _check_busctl_available(self) -> bool:
        """
        Check if busctl tool is available

        Returns:
            bool: True if busctl is available
        """
        return shutil.which("busctl") is not None

    def _run_busctl_command(self, args: List[str]) -> Tuple[bool, str]:
        """
        Execute busctl command and return result

        Args:
            args (List[str]): busctl command arguments

        Returns:
            Tuple[bool, str]: (success, output)
        """
        cmd = ["busctl"] + args

        try:
            logger.debug(f"Executing busctl command: {' '.join(cmd)}")

            # Use get_env() to clear LD_LIBRARY_PATH
            env = get_env()

            result = subprocess.run(
                cmd, capture_output=True, text=True, timeout=COMMAND_TIMEOUT, env=env
            )

            success = result.returncode == 0
            output = result.stdout.strip() if success else result.stderr.strip()

            if not success:
                logger.debug(
                    f"Busctl command failed with return code {result.returncode}: {output}"
                )

            return success, output

        except subprocess.TimeoutExpired:
            logger.error(f"Busctl command timeout after {COMMAND_TIMEOUT}s")
            return False, "Command timeout"
        except Exception as e:
            logger.error(f"Busctl command execution failed: {e}")
            return False, str(e)

    def supports_power_station(self) -> bool:
        """
        Check if PowerStation functionality is supported

        Returns:
            bool: True if busctl is available and PowerStation service is running
        """
        # Error cooldown mechanism
        current_time = time.time()
        if current_time - self._last_error_time < self._error_cooldown:
            return False

        try:
            return self._check_dbus_service()
        except Exception as e:
            logger.debug(f"PowerStation service check failed: {e}")
            self._last_error_time = current_time
            return False

    def _parse_busctl_property(self, output: str) -> Optional[float]:
        """
        Parse busctl get-property output

        Args:
            output (str): busctl command output, format like "d 15.000000"

        Returns:
            Optional[float]: Parsed value, None if failed
        """
        try:
            # busctl output format: "d 15.000000" (type + value)
            parts = output.strip().split(maxsplit=1)
            if len(parts) >= 2 and parts[0] == "d":
                return float(parts[1])
        except (ValueError, IndexError) as e:
            logger.error(f"Failed to parse busctl property output '{output}': {e}")
        return None

    def _parse_busctl_string_property(self, output: str) -> Optional[str]:
        """
        Parse busctl get-property string output

        Args:
            output (str): busctl command output, format like 's "discrete"'

        Returns:
            Optional[str]: Parsed string value, None if failed
        """
        try:
            # busctl string output format: 's "discrete"'
            parts = output.strip().split(maxsplit=1)
            if len(parts) >= 2 and parts[0] == "s":
                return parts[1].strip('"')
        except (ValueError, IndexError) as e:
            logger.error(f"Failed to parse busctl string output '{output}': {e}")
        return None

    def _parse_busctl_array(self, output: str) -> List[str]:
        """
        Parse busctl call returned object path array

        Args:
            output (str): busctl command output

        Returns:
            List[str]: Parsed card name list
        """
        cards = []
        try:
            # busctl object path array output format: ao 2 "/path1" "/path2"
            # Extract all quoted paths
            path_pattern = r'"/[^"]*"'
            matches = re.findall(path_pattern, output)

            for match in matches:
                path = match.strip('"')
                # Extract card name from path
                if DBUS_BASE_PATH in path:
                    card_name = path.replace(DBUS_BASE_PATH + "/", "")
                    if card_name.startswith(DBUS_CARD_PREFIX):
                        cards.append(card_name)

            logger.debug(f"Parsed GPU cards from busctl output: {cards}")

        except Exception as e:
            logger.error(f"Failed to parse busctl array output '{output}': {e}")

        return cards

    def _check_dbus_service(self) -> bool:
        """
        Check if PowerStation DBus service is running

        Returns:
            bool: True if service is available
        """
        if not self._check_busctl_available():
            logger.debug("busctl not available")
            return False

        success, output = self._run_busctl_command(["list"])
        if success:
            return DBUS_SERVICE_NAME in output

        return False

    def get_power_info(self) -> str:
        """
        Get power information

        Returns:
            str: String containing current TDP, min/max TDP info
        """
        if not self.supports_power_station():
            return self.fallback_get_power_info()

        try:
            current_tdp = self._get_tdp_property("TDP")
            min_tdp = self._get_tdp_property("MinTdp")
            max_tdp = self._get_tdp_property("MaxTdp")
            max_boost = self._get_tdp_property("MaxBoost")

            return (
                f"PowerStation TDP Info:\n"
                f"Current TDP: {current_tdp:.0f}W\n"
                f"TDP Range: {min_tdp:.0f}W - {max_tdp:.0f}W\n"
                f"Max Boost: {max_boost:.0f}W"
            )
        except Exception as e:
            logger.error(f"Failed to get PowerStation power info: {e}")
            return self.fallback_get_power_info()

    def get_tdpMax(self) -> int:
        """
        Get maximum TDP value

        Returns:
            int: Maximum TDP value (watts)
        """
        if not self.supports_power_station():
            return self.fallback_get_tdpMax()

        try:
            max_tdp = self._get_tdp_property("MaxTdp")
            return int(max_tdp)
        except Exception as e:
            logger.error(f"Failed to get max TDP from PowerStation: {e}")
            return self.fallback_get_tdpMax()

    def _find_gpu_card_path(self) -> str:
        """
        Find appropriate GPU card path with caching mechanism

        Returns:
            str: GPU card DBus path

        Raises:
            Exception: No suitable GPU card found
        """
        current_time = time.time()

        # Check if cache is valid
        if (
            self._gpu_card_path
            and current_time - self._card_path_timestamp < CACHE_TIMEOUT
        ):
            return self._gpu_card_path

        # Re-discover GPU cards
        try:
            if not self._check_dbus_service():
                raise Exception("PowerStation service not available")

            cards = self._query_gpu_cards()
            if not cards:
                raise Exception("No GPU cards found")

            card_path = self._select_appropriate_card(cards)

            # Update cache
            self._gpu_card_path = card_path
            self._card_path_timestamp = current_time

            logger.info(f"Selected GPU card path: {card_path}")
            return card_path

        except Exception as e:
            logger.error(f"Failed to find GPU card path: {e}")
            # Clear invalid cache
            self._gpu_card_path = None
            self._card_path_timestamp = 0
            raise

    def _query_gpu_cards(self) -> List[str]:
        """
        Query all available GPU cards

        Returns:
            List[str]: GPU card name list
        """
        cmd_args = [
            "call",
            DBUS_SERVICE_NAME,
            DBUS_BASE_PATH,
            DBUS_GPU_INTERFACE,
            "EnumerateCards",
        ]

        success, output = self._run_busctl_command(cmd_args)
        if success:
            cards = self._parse_busctl_array(output)
            logger.debug(f"Found GPU cards: {cards}")
            return cards

        logger.error("Failed to query GPU cards")
        return []

    def _select_appropriate_card(self, cards: List[str]) -> str:
        """
        Select appropriate GPU card from list, prefer discrete GPU

        Args:
            cards (List[str]): GPU card name list

        Returns:
            str: Selected GPU card path
        """
        if not cards:
            raise Exception("No GPU cards available")

        # First try to find discrete GPU
        for card in cards:
            try:
                card_path = f"{DBUS_BASE_PATH}/{card}"
                gpu_class = self._get_card_class(card_path)

                if gpu_class and gpu_class.lower() == "discrete":
                    logger.info(f"Found discrete GPU: {card}")
                    return card_path

            except Exception as e:
                logger.debug(f"Failed to check GPU class for {card}: {e}")
                continue

        # If no discrete GPU found, use first available
        first_card = cards[0]
        card_path = f"{DBUS_BASE_PATH}/{first_card}"
        logger.info(f"Using first available GPU: {first_card}")
        return card_path

    def _get_card_class(self, card_path: str) -> Optional[str]:
        """
        Get GPU card Class property

        Args:
            card_path (str): GPU card path

        Returns:
            Optional[str]: GPU type ("discrete" or "integrated")
        """
        cmd_args = [
            "get-property",
            DBUS_SERVICE_NAME,
            card_path,
            DBUS_GPU_CARD_INTERFACE,
            "Class",
        ]

        success, output = self._run_busctl_command(cmd_args)
        if success:
            return self._parse_busctl_string_property(output)

        return None

    def set_tdp(self, tdp: int) -> None:
        """
        Set TDP value

        Args:
            tdp (int): Target TDP value (watts)
        """
        if not self.supports_power_station():
            return self.fallback_set_tdp(tdp)

        try:
            # Validate TDP range
            min_tdp = int(self._get_tdp_property("MinTdp"))
            max_tdp = int(self._get_tdp_property("MaxTdp"))

            if not (min_tdp <= tdp <= max_tdp):
                logger.warning(f"TDP {tdp}W is outside range [{min_tdp}W, {max_tdp}W]")
                tdp = max(min_tdp, min(max_tdp, tdp))
                logger.info(f"Clamped TDP to {tdp}W")

            # Set TDP
            self._set_tdp_property("TDP", float(tdp))

            # Set max boost
            max_boost = self._get_tdp_property("MaxBoost")
            self._set_tdp_property("Boost", max_boost)

            logger.info(f"Successfully set PowerStation TDP to {tdp}W")

        except Exception as e:
            logger.error(f"Failed to set PowerStation TDP: {e}")
            self.fallback_set_tdp(tdp)

    def _get_tdp_property(self, property_name: str) -> float:
        """
        Get TDP related property value

        Args:
            property_name (str): Property name (TDP, MinTdp, MaxTdp, MaxBoost)

        Returns:
            float: Property value

        Raises:
            Exception: Failed to get property
        """
        card_path = self._find_gpu_card_path()

        cmd_args = [
            "get-property",
            DBUS_SERVICE_NAME,
            card_path,
            DBUS_TDP_INTERFACE,
            property_name,
        ]

        success, output = self._run_busctl_command(cmd_args)
        if success:
            value = self._parse_busctl_property(output)
            if value is not None:
                logger.debug(f"Got {property_name}: {value}")
                return value

        raise Exception(f"Failed to get {property_name}")

    def _set_tdp_property(self, property_name: str, value: float) -> None:
        """
        Set TDP related property value

        Args:
            property_name (str): Property name
            value (float): Property value

        Raises:
            Exception: Failed to set property
        """
        card_path = self._find_gpu_card_path()

        cmd_args = [
            "set-property",
            DBUS_SERVICE_NAME,
            card_path,
            DBUS_TDP_INTERFACE,
            property_name,
            "d",  # double type
            str(value),
        ]

        success, output = self._run_busctl_command(cmd_args)
        if success:
            logger.debug(f"Set {property_name} to {value}")
            return

        raise Exception(f"Failed to set {property_name} to {value}: {output}")

    def set_tdp_unlimited(self) -> None:
        """
        Set TDP to maximum value (unlimited)
        """
        if not self.supports_power_station():
            return self.fallback_set_tdp_unlimited()

        try:
            max_tdp = int(self._get_tdp_property("MaxTdp"))
            self.set_tdp(max_tdp)
            logger.info(f"Set PowerStation TDP to unlimited ({max_tdp}W)")
        except Exception as e:
            logger.error(f"Failed to set unlimited TDP: {e}")
            self.fallback_set_tdp_unlimited()

    def fallback_get_power_info(self) -> str:
        """Fallback method when PowerStation is not available"""
        logger.info("Using fallback method for get_power_info")
        return super().get_power_info()

    def fallback_get_tdpMax(self) -> int:
        """Fallback method when PowerStation is not available"""
        logger.info("Using fallback method for get_tdpMax")
        return super().get_tdpMax()

    def fallback_set_tdp(self, tdp: int) -> None:
        """Fallback method when PowerStation is not available"""
        logger.info("Using fallback method for set_tdp")
        return super().set_tdp(tdp)

    def fallback_set_tdp_unlimited(self) -> None:
        """Fallback method when PowerStation is not available"""
        logger.info("Using fallback method for set_tdp_unlimited")
        return super().set_tdp_unlimited()

    def _handle_command_error(self, error: Exception, operation: str) -> None:
        """
        Unified command error handling

        Args:
            error (Exception): Caught exception
            operation (str): Description of operation being performed
        """
        if "timeout" in str(error).lower():
            logger.warning(f"PowerStation command timeout during {operation}")
        elif "not found" in str(error).lower():
            logger.warning(f"PowerStation service not available during {operation}")
        else:
            logger.error(f"PowerStation command error during {operation}: {error}")

        # Clear cache to force re-discovery
        self._gpu_card_path = None
        self._card_path_timestamp = 0
