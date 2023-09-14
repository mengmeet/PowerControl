 #!/bin/bash

function get_gpu_device()
{
    for gpu_device in /sys/class/drm/card?/device; do
        if [ -d "$gpu_device" ]; then
            echo "$gpu_device"
            return
        fi
    done
}

gpu_device=$(get_gpu_device)
    

function set_cpu_Freq()
{
    cpu_index=$1
    let cpu_freq=$2
    if(($cpu_index==0));then
        cpu_isOnLine=1
    else
        cpu_isOnLine=$(cat /sys/devices/system/cpu/cpu${cpu_index}/online)
    fi
    if(($cpu_freq==0));then
        if((cpu_isOnLine==0));then
            sudo echo 1 > "/sys/devices/system/cpu/cpu${cpu_index}/online"
            sudo echo "schedutil" > "/sys/devices/system/cpu/cpu${cpu_index}/cpufreq/scaling_governor"
            sudo echo 0 > "/sys/devices/system/cpu/cpu${cpu_index}/online"
        else
            sudo echo "schedutil" > "/sys/devices/system/cpu/cpu${cpu_index}/cpufreq/scaling_governor"
        fi
    else
        if((cpu_isOnLine==0));then
            sudo echo 1 > "/sys/devices/system/cpu/cpu${cpu_index}/online"
            sudo echo "userspace" > "/sys/devices/system/cpu/cpu${cpu_index}/cpufreq/scaling_governor"
            sudo echo $cpu_freq > "/sys/devices/system/cpu/cpu${cpu_index}/cpufreq/scaling_max_freq"
            sudo echo 0 > "/sys/devices/system/cpu/cpu${cpu_index}/online"
        else
            sudo echo "userspace" > "/sys/devices/system/cpu/cpu${cpu_index}/cpufreq/scaling_governor"
            sudo echo $cpu_freq > "/sys/devices/system/cpu/cpu${cpu_index}/cpufreq/scaling_max_freq"
        fi
    fi
}

function get_cpu_nowFreq()
{
    cpu_index=$1
    echo "$(cat /sys/devices/system/cpu/cpufreq/policy${cpu_index}/scaling_cur_freq)"
}

function get_cpu_AvailableFreq()
{
    echo "$(cat /sys/devices/system/cpu/cpufreq/policy0/scaling_available_frequencies)"
}

function set_cpu_online()
{
    cpu_index=$1
    cpu_online=$2
    echo $cpu_online > "/sys/devices/system/cpu/cpu${cpu_index}/online"
}

function get_cpuID()
{
    cat /proc/cpuinfo | grep "model name" | sed -n '1p'| cut -d : -f 2 | xargs
}

function set_cpu_tdp()
{
    ryzenadj_path=$1
    let slow=$2*1000
    let fast=$3*1000
    sudo $ryzenadj_path --stapm-limit=$fast --fast-limit=$fast --slow-limit=$fast --tctl-temp=90
    sudo echo "${ryzenadj_path}  --stapm-limit=${fast} --fast-limit=${fast}   --slow-limit=${slow}" >>  /tmp/powerControl_sh.log
}

function set_clock_limits()
{
    let min=$1
    let max=$2
    if(($min==0 || $max==0));then
        sudo echo "auto" > "${gpu_device}/power_dpm_force_performance_level"
    else
        sudo echo "manual" > "${gpu_device}/power_dpm_force_performance_level"
        sudo echo "s 0 ${min}" > "${gpu_device}/pp_od_clk_voltage"
        sudo echo "s 1 ${max}" > "${gpu_device}/pp_od_clk_voltage"
        sudo echo "c" > "${gpu_device}/pp_od_clk_voltage"
    fi
    sudo echo "gpu_clock_limit "$1 $2 >> /tmp/powerControl_sh.log
}

function get_gpuFreqMin()
{
    sudo echo "manual"> "${gpu_device}/power_dpm_force_performance_level"
    echo "$(sudo cat ${gpu_device}/pp_od_clk_voltage|grep -a "SCLK:"|awk '{print $2}'|sed -e 's/Mhz//g'|xargs)"
}

function get_gpuFreqMax()
{
    sudo echo "manual" > "${gpu_device}/power_dpm_force_performance_level"
    echo "$(sudo cat ${gpu_device}/pp_od_clk_voltage|grep -a "SCLK:"|awk '{print $3}'|sed -e 's/Mhz//g'|xargs)"
}

function set_gpu_flk()
{
    flk=$1
    index=$(((1600-$flk)/400))
    now_mode=$(cat ${gpu_device}/power_dpm_force_performance_level)
    if [[ "$now_mode"!="manual" ]];then
        sudo echo "manual" > "${gpu_device}/power_dpm_force_performance_level"
        sudo echo "$index" > "${gpu_device}/pp_dpm_fclk"
    else
        sudo echo "$index" > "${gpu_device}/pp_dpm_fclk"
    fi
    sudo echo "gpu_flk_limit " $index >> /tmp/powerControl_sh.log
}

function check_clock_limits()
{
    mode=$1
    now_mode=$(cat ${gpu_device}/power_dpm_force_performance_level)
    if [[ "$now_mode"!="$mode" ]];then
        if(( "$1" == "manual"));then
            sudo echo "manual" > "${gpu_device}/power_dpm_force_performance_level"
            sudo echo "s 0 $2" > "${gpu_device}/pp_od_clk_voltage"
            sudo echo "s 1 $3" > "${gpu_device}/pp_od_clk_voltage"
            sudo echo "c" > "${gpu_device}/pp_od_clk_voltage"
        else
            sudo echo "auto" > "${gpu_device}/power_dpm_force_performance_level"
        fi
    fi
}

function set_cpu_boost()
{
    boost=$1
    boost_path="/sys/devices/system/cpu/cpufreq/boost"
    amd_pstate_path="/sys/devices/system/cpu/amd_pstate/status"\

    if [ -f "${amd_pstate_path}" ]; then
        echo "passive" > "${amd_pstate_path}"
    fi

    if (($boost == 1)); then
        echo 1 > "${boost_path}"
    else
        echo 1 > "${boost_path}"
        echo 0 > "${boost_path}"
    fi
}

function get_language()
{
    language_path=$1
    sudo cat $language_path|grep language|sed -n '1p'|xargs|cut  -d " " -f  2
}


 if [ -n "$1" ]; then
    case "$1" in
    set_cpu_online)set_cpu_online $2 $3;;
    set_cpu_Freq)set_cpu_Freq $2 $3;;
    get_cpu_nowFreq)get_cpu_nowFreq $2;;
    get_cpu_AvailableFreq)get_cpu_AvailableFreq $2 $3;;
    set_cpu_tdp)set_cpu_tdp $2 $3 $4;;
    set_clock_limits)set_clock_limits $2 $3;;
    set_cpu_boost)set_cpu_boost $2;;
    check_clock_limits)check_clock_limits $2 $3 $4;;
    set_gpu_flk)set_gpu_flk $2;;
    get_cpuID)get_cpuID;;
    get_language)get_language $2;;
    get_gpuFreqMin)get_gpuFreqMin;;
    get_gpuFreqMax)get_gpuFreqMax;;
    *)sudo echo $1 $2 $3 $4>>  /tmp/powerControl_sh.log;;
    esac
fi
