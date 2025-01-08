#!/bin/bash

WRITE_PATH="$1"
WRITE_VALUE="$2"

if [[ "$WRITE_PATH" == /sys/class/drm/card*/device/power_dpm_force_performance_level ]]; then
    GPU=$(grep -H 0x8086 /sys/class/drm/card?/device/vendor 2>/dev/null | head -n1 | sed 's/\/device\/vendor:.*//')
    GPU_MIN_FREQ="$GPU/gt_min_freq_mhz"
    GPU_MAX_FREQ="$GPU/gt_max_freq_mhz"
    GPU_MIN_LIMIT="$(cat $GPU/gt_RPn_freq_mhz)"
    GPU_MAX_LIMIT="$(cat $GPU/gt_RP0_freq_mhz)"
    echo "setting intel gpu $GPU to [$WRITE_VALUE]" | systemd-cat -t p-steamos-priv-write -p warning
    if [[ "$WRITE_VALUE" == "auto" ]]; then
        echo "$GPU_MIN_LIMIT" >"$GPU_MIN_FREQ"
        echo "$GPU_MAX_LIMIT" >"$GPU_MAX_FREQ"
        echo "commit: $GPU_MIN_LIMIT -> $GPU_MIN_FREQ" | systemd-cat -t p-steamos-priv-write -p warning
        echo "commit: $GPU_MAX_LIMIT -> $GPU_MAX_FREQ" | systemd-cat -t p-steamos-priv-write -p warning
    fi
    exit 0
fi

if [[ "$WRITE_PATH" == /sys/class/drm/card*/device/pp_od_clk_voltage ]]; then
    GPU=$(grep -H 0x8086 /sys/class/drm/card?/device/vendor 2>/dev/null | head -n1 | sed 's/\/device\/vendor:.*//')
    GPU_MIN_FREQ="$GPU/gt_min_freq_mhz"
    GPU_MAX_FREQ="$GPU/gt_max_freq_mhz"
    GPU_MIN_LIMIT="$(cat $GPU/gt_RPn_freq_mhz)"
    GPU_MAX_LIMIT="$(cat $GPU/gt_RP0_freq_mhz)"
    echo "commit: GPU -> $WRITE_VALUE" | systemd-cat -t p-steamos-priv-write -p warning
    if [[ "$WRITE_VALUE" =~ "s 0" ]]; then
        min_freq=$(echo "$WRITE_VALUE" | sed 's/.*s 0 //')
        if [[ "$(cat $GPU_MAX_FREQ)" -lt "$min_freq" ]]; then
            echo "commit: $GPU_MAX_FREQ -> $min_freq" | systemd-cat -t p-steamos-priv-write -p warning
            echo "$min_freq" >"$GPU_MAX_FREQ"
        fi
        if [[ "$min_freq" -lt "$GPU_MIN_LIMIT" ]]; then
            min_freq="$GPU_MIN_LIMIT"
        fi
        if [[ "$min_freq" -gt "$GPU_MAX_LIMIT" ]]; then
            min_freq="$GPU_MIN_LIMIT"
        fi
        echo "commit: $min_freq -> $GPU_MIN_FREQ" | systemd-cat -t p-steamos-priv-write -p warning
        echo "$min_freq" >"$GPU_MIN_FREQ"
    fi
    if [[ "$WRITE_VALUE" =~ "s 1" ]]; then
        max_freq=$(echo "$WRITE_VALUE" | sed 's/.*s 1 //')
        if [[ "$max_freq" -gt "$GPU_MAX_LIMIT" ]]; then
            max_freq="$GPU_MAX_LIMIT"
        fi
        echo "commit: $max_freq -> $GPU_MAX_FREQ" | systemd-cat -t p-steamos-priv-write -p warning
        echo "$max_freq" >"$GPU_MAX_FREQ"
    fi
    exit 0
fi
