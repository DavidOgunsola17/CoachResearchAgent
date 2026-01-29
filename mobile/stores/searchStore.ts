import { create } from 'zustand';

export interface CoachProfile {
  name: string;
  position: string;
  email: string;
  phone: string;
  twitter: string;
  school: string;
  sport: string;
  school_logo_url: string;
}

export type SearchStage =
  | 'idle'
  | 'discovering'
  | 'extracting'
  | 'normalizing'
  | 'complete'
  | 'error';

interface SearchState {
  school: string;
  sport: string;
  results: CoachProfile[];
  stage: SearchStage;
  error: string | null;
  selectedIndices: Set<number>;
  savedCoachKeys: Set<string>;

  setSchool: (school: string) => void;
  setSport: (sport: string) => void;
  search: (apiUrl: string) => Promise<void>;
  toggleSelect: (index: number) => void;
  selectAll: () => void;
  clearSelection: () => void;
  toggleSaved: (coach: CoachProfile) => void;
  isSaved: (coach: CoachProfile) => boolean;
  reset: () => void;
}

function coachKey(c: CoachProfile): string {
  return `${c.name}|${c.school}|${c.position}`.toLowerCase();
}

// Simulate staged progress while the single API call runs
function stageTimer(
  set: (partial: Partial<SearchState>) => void,
): () => void {
  let cancelled = false;

  const run = async () => {
    set({ stage: 'discovering' });
    await delay(8000);
    if (cancelled) return;
    set({ stage: 'extracting' });
    await delay(15000);
    if (cancelled) return;
    set({ stage: 'normalizing' });
  };
  run();

  return () => {
    cancelled = true;
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

export const useSearchStore = create<SearchState>((set, get) => ({
  school: '',
  sport: '',
  results: [],
  stage: 'idle',
  error: null,
  selectedIndices: new Set(),
  savedCoachKeys: new Set(),

  setSchool: (school) => set({ school }),
  setSport: (sport) => set({ sport }),

  search: async (apiUrl: string) => {
    const { school, sport } = get();
    set({ results: [], stage: 'discovering', error: null, selectedIndices: new Set() });

    const cancelStages = stageTimer(set as any);

    try {
      const res = await fetch(`${apiUrl}/api/search/coaches/dev`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ school_name: school, sport_name: sport }),
        signal: AbortSignal.timeout(120000), // 2 minutes instead of default
      });

      cancelStages();

      if (!res.ok) {
        const body = await res.text();
        set({ stage: 'error', error: body || `Request failed (${res.status})` });
        return;
      }

      const data: CoachProfile[] = await res.json();

      // Filter out coaches missing email and phone (per user requirement)
      const filtered = data.filter((c) => c.email || c.phone);

      set({ results: filtered, stage: 'complete' });
    } catch (e: any) {
      cancelStages();
      set({
        stage: 'error',
        error: e?.message ?? 'Network error. Please check your connection and try again.',
      });
    }
  },

  toggleSelect: (index) => {
    const next = new Set(get().selectedIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    set({ selectedIndices: next });
  },

  selectAll: () => {
    const all = new Set(get().results.map((_, i) => i));
    set({ selectedIndices: all });
  },

  clearSelection: () => set({ selectedIndices: new Set() }),

  toggleSaved: (coach) => {
    const key = coachKey(coach);
    const next = new Set(get().savedCoachKeys);
    if (next.has(key)) {
      next.delete(key);
    } else {
      next.add(key);
    }
    set({ savedCoachKeys: next });
  },

  isSaved: (coach) => {
    return get().savedCoachKeys.has(coachKey(coach));
  },

  reset: () =>
    set({
      school: '',
      sport: '',
      results: [],
      stage: 'idle',
      error: null,
      selectedIndices: new Set(),
    }),
}));
