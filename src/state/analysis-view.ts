import { create } from 'zustand';

export type SectorBenchmark = 'average' | 'median' | 'best';
export type ConsistencyMetric = 'sd' | 'mad' | 'iqr' | 'range';

type AnalysisViewState = {
  sectorBenchmark: SectorBenchmark;
  consistencyMetric: ConsistencyMetric;
  selectedDriver: string | null;
  setSectorBenchmark: (benchmark: SectorBenchmark) => void;
  setConsistencyMetric: (metric: ConsistencyMetric) => void;
  setSelectedDriver: (driver: string | null) => void;
};

export const useAnalysisViewStore = create<AnalysisViewState>((set) => ({
  sectorBenchmark: 'median',
  consistencyMetric: 'sd',
  selectedDriver: null,
  setSectorBenchmark: (sectorBenchmark) => set({ sectorBenchmark }),
  setConsistencyMetric: (consistencyMetric) => set({ consistencyMetric }),
  setSelectedDriver: (selectedDriver) => set({ selectedDriver }),
}));
