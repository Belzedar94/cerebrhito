import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import api from '@/services/api';

interface Activity {
  id: string;
  name: string;
  description: string;
  category: string;
  min_age_months: number;
  max_age_months: number;
  duration_minutes: number;
  materials_needed?: string[];
  skills_developed: string[];
  difficulty_level: 'easy' | 'medium' | 'hard';
  indoor: boolean;
  supervision_required: boolean;
  created_at: string;
  updated_at: string;
}

interface ActivityLog {
  id: string;
  child_id: string;
  activity_id: string;
  completed_at: string;
  duration_minutes: number;
  notes?: string;
  enjoyment_level?: number;
  difficulty_experienced?: number;
  media_urls?: string[];
  created_at: string;
}

interface ActivitiesState {
  activities: Activity[];
  selectedActivity: Activity | null;
  activityLogs: Record<string, ActivityLog[]>; // Keyed by child_id
  suggestedActivities: Activity[];
  loading: boolean;
  error: string | null;
}

const initialState: ActivitiesState = {
  activities: [],
  selectedActivity: null,
  activityLogs: {},
  suggestedActivities: [],
  loading: false,
  error: null,
};

export const fetchActivities = createAsyncThunk('activities/fetchActivities', async () => {
  const response = await api.get('/api/activities');
  return response.data;
});

export const fetchActivityById = createAsyncThunk(
  'activities/fetchActivityById',
  async (activityId: string) => {
    const response = await api.get(`/api/activities/${activityId}`);
    return response.data;
  }
);

export const createActivity = createAsyncThunk(
  'activities/createActivity',
  async (activityData: Omit<Activity, 'id' | 'created_at' | 'updated_at'>) => {
    const response = await api.post('/api/activities', activityData);
    return response.data;
  }
);

export const fetchActivityLogs = createAsyncThunk(
  'activities/fetchActivityLogs',
  async (childId: string) => {
    const response = await api.get(`/api/activities/child/${childId}`);
    return { childId, logs: response.data };
  }
);

export const logActivity = createAsyncThunk(
  'activities/logActivity',
  async (logData: Omit<ActivityLog, 'id' | 'created_at'>) => {
    const response = await api.post('/api/activities/log', logData);
    return response.data;
  }
);

export const fetchSuggestedActivities = createAsyncThunk(
  'activities/fetchSuggestedActivities',
  async (childId: string) => {
    const response = await api.get(`/api/activities/child/${childId}/suggestions`);
    return response.data;
  }
);

const activitiesSlice = createSlice({
  name: 'activities',
  initialState,
  reducers: {
    selectActivity: (state, action) => {
      state.selectedActivity = state.activities.find(activity => activity.id === action.payload) || null;
    },
    clearSelectedActivity: (state) => {
      state.selectedActivity = null;
    },
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch Activities
    builder
      .addCase(fetchActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.activities = action.payload;
      })
      .addCase(fetchActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch activities';
      });

    // Fetch Activity by ID
    builder
      .addCase(fetchActivityById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedActivity = action.payload;
        const index = state.activities.findIndex(activity => activity.id === action.payload.id);
        if (index !== -1) {
          state.activities[index] = action.payload;
        } else {
          state.activities.push(action.payload);
        }
      })
      .addCase(fetchActivityById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch activity';
      });

    // Create Activity
    builder
      .addCase(createActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createActivity.fulfilled, (state, action) => {
        state.loading = false;
        state.activities.push(action.payload);
        state.selectedActivity = action.payload;
      })
      .addCase(createActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create activity';
      });

    // Fetch Activity Logs
    builder
      .addCase(fetchActivityLogs.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchActivityLogs.fulfilled, (state, action) => {
        state.loading = false;
        state.activityLogs[action.payload.childId] = action.payload.logs;
      })
      .addCase(fetchActivityLogs.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch activity logs';
      });

    // Log Activity
    builder
      .addCase(logActivity.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(logActivity.fulfilled, (state, action) => {
        state.loading = false;
        const logs = state.activityLogs[action.payload.child_id] || [];
        state.activityLogs[action.payload.child_id] = [...logs, action.payload];
      })
      .addCase(logActivity.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to log activity';
      });

    // Fetch Suggested Activities
    builder
      .addCase(fetchSuggestedActivities.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSuggestedActivities.fulfilled, (state, action) => {
        state.loading = false;
        state.suggestedActivities = action.payload;
      })
      .addCase(fetchSuggestedActivities.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch suggested activities';
      });
  },
});

export const { selectActivity, clearSelectedActivity, clearError } = activitiesSlice.actions;
export default activitiesSlice.reducer;