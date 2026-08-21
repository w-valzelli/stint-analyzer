import { create } from 'zustand';

export type SectorBenchmark = 'average' | 'median' | 'best';
export type ConsistencyMetric = 'sd' | 'mad' | 'iqr' | 'range';
export type ConsistencyMode = 'sectors' | 'laps';

type AnalysisViewState = {
  sectorBenchmark: SectorBenchmark;
  consistencyMetric: ConsistencyMetric;
  consistencyMode: ConsistencyMode;
  selectedDriver: string | null;
  setSectorBenchmark: (benchmark: SectorBenchmark) => void;
  setConsistencyMetric: (metric: ConsistencyMetric) => void;
  setConsistencyMode: (mode: ConsistencyMode) => void;
  setSelectedDriver: (driver: string | null) => void;
};

export const useAnalysisViewStore = create<AnalysisViewState>((set) => ({
  sectorBenchmark: 'median',
  consistencyMetric: 'sd',
  consistencyMode: 'sectors',
  selectedDriver: null,
  setSectorBenchmark: (sectorBenchmark) => set({ sectorBenchmark }),
  setConsistencyMetric: (consistencyMetric) => set({ consistencyMetric }),
  setConsistencyMode: (consistencyMode) => set({ consistencyMode }),
  setSelectedDriver: (selectedDriver) => set({ selectedDriver }),
}));
