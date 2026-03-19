// Fan config type
export interface FanConfig {
    fan_max_rpm?: number;
    fan_name?: string;
    fan_hwmon_mode?: number;
    fan_default_curve?: { pwm_value: number; temp_value: number }[];
    fan_pwm_write_max?: number;
    fan_fixed_temps?: number[];
    [key: string]: unknown;
}
