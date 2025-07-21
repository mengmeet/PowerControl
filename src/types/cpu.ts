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