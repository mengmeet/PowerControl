export interface CPUCoreTypeInfo {
  count: number;
  cpus: number[];
  max_freq_khz: number;
  min_freq_khz: number;
}

export interface CPUCoreInfo {
  is_heterogeneous: boolean;
  vendor: string;
  architecture_summary: string;
  core_types: Record<string, CPUCoreTypeInfo>;
}

export interface CPULogicalCoreUI {
  logical_id: number;
  core_id: number;
  core_type: string;
  is_smt_thread: boolean;
  can_offline: boolean;
}

export interface CPUTopologyForUI {
  cores: CPULogicalCoreUI[];
  core_types: string[];
  is_heterogeneous: boolean;
}
