import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface Milestone {
  id: string;
  name: string;
  description: string;
  category: string;
  min_age_months: number;
  max_age_months: number;
  indicators: string[];
  supporting_activities?: string[];
  professional_notes?: string;
  created_at: string;
  updated_at: string;
}

interface MilestoneTracking {
  id: string;
  child_id: string;
  milestone_id: string;
  achieved_at: string;
  notes?: string;
  observed_indicators: string[];
  media_urls?: string[];
  professional_id?: string;
  created_at: string;
}

interface DevelopmentReport {
  milestones_achieved: number;
  milestones_pending: number;
  progress_by_category: Record<string, number>;
  recent_achievements: MilestoneTracking[];
  upcoming_milestones: Milestone[];
}

interface DevelopmentState {
  milestones: Milestone[];
  selectedMilestone: Milestone | null;
  milestoneTracking: Record<string, MilestoneTracking[]>; // Keyed by child_id
  developmentReports: Record<string, DevelopmentReport>; // Keyed by child_id
  loading: boolean;
  error: string | null;
}

const initialState: DevelopmentState = {
  milestones: [],
  selectedMilestone: null,
  milestoneTracking: {},
  developmentReports: {},
  loading: false,
  error: null,
};

export const fetchMilestones = createAsyncThunk('development/fetchMilestones', async () => {
  const response = await api.get('/api/development/milestones');
  return response.data;
});

export const fetchMilestoneById = createAsyncThunk(
  'development/fetchMilestoneById',
  async (milestoneId: string) => {
    const response = await api.get(`/api/development/milestones/${milestoneId}`);
    return response.data;
  }
);

export const createMilestone = createAsyncThunk(
  'development/createMilestone',
  async (milestoneData: Omit<Milestone, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post('/api/development/milestones', milestoneData);
    return response.data;
  }
);

export const fetchMilestoneTracking = createAsyncThunk(
  'development/fetchMilestoneTracking',
  async (childId: string) => {
    const response = await api.get(`/api/development/child/${childId}/milestones`);
    return { childId, tracking: response.data };
  }
);

export const trackMilestone = createAsyncThunk(
  'development/trackMilestone',
  async (trackingData: Omit<MilestoneTracking, 'id' | 'created_at'>) => {
    const response = await api.post('/api/development/milestones/track', trackingData);
    return response.data;
  }
);

export const fetchDevelopmentReport = createAsyncThunk(
  'development/fetchDevelopmentReport',
  async (childId: string) => {
    const response = await api.get(`/api/development/child/${childId}/report`);
    return { childId, report: response.data };
  }
);

const developmentSlice = createSlice({
  name: 'development',
  initialState,
  reducers: {
    selectMilestone: (state, action) => {
      state.selectedMilestone = state.milestones.find(milestone => milestone.id === action.payload) || null;
    },
    clearSelectedMilestone: (state) => {
      state.selectedMilestone = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Milestones
    builder
      .addCase(fetchMilestones.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMilestones.fulfilled, (state, action) => {
        state.loading = false;
        state.milestones = action.payload;
      })
      .addCase(fetchMilestones.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch milestones';
      });

    // Fetch Milestone by ID
    builder
      .addCase(fetchMilestoneById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMilestoneById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedMilestone = action.payload;
        const index = state.milestones.findIndex(milestone => milestone.id === action.payload.id);
        if (index !== -1) {
          state.milestones[index] = action.payload;
        } else {
          state.milestones.push(action.payload);
        }
      })
      .addCase(fetchMilestoneById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch milestone';
      });

    // Create Milestone
    builder
      .addCase(createMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createMilestone.fulfilled, (state, action) => {
        state.loading = false;
        state.milestones.push(action.payload);
        state.selectedMilestone = action.payload;
      })
      .addCase(createMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create milestone';
      });

    // Fetch Milestone Tracking
    builder
      .addCase(fetchMilestoneTracking.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMilestoneTracking.fulfilled, (state, action) => {
        state.loading = false;
        state.milestoneTracking[action.payload.childId] = action.payload.tracking;
      })
      .addCase(fetchMilestoneTracking.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch milestone tracking';
      });

    // Track Milestone
    builder
      .addCase(trackMilestone.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(trackMilestone.fulfilled, (state, action) => {
        state.loading = false;
        const tracking = state.milestoneTracking[action.payload.child_id] || [];
        state.milestoneTracking[action.payload.child_id] = [...tracking, action.payload];
      })
      .addCase(trackMilestone.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to track milestone';
      });

    // Fetch Development Report
    builder
      .addCase(fetchDevelopmentReport.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDevelopmentReport.fulfilled, (state, action) => {
        state.loading = false;
        state.developmentReports[action.payload.childId] = action.payload.report;
      })
      .addCase(fetchDevelopmentReport.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch development report';
      });
  },
});

export const { selectMilestone, clearSelectedMilestone, clearError } = developmentSlice.actions;
export default developmentSlice.reducer;