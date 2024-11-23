import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { api } from '@/services/api';

interface Child {
  id: string;
  name: string;
  birth_date: string;
  gender: 'male' | 'female' | 'other';
  notes?: string;
  medical_conditions?: string[];
  allergies?: string[];
  user_id: string;
  created_at: string;
  updated_at: string;
}

interface ChildrenState {
  children: Child[];
  selectedChild: Child | null;
  loading: boolean;
  error: string | null;
}

const initialState: ChildrenState = {
  children: [],
  selectedChild: null,
  loading: false,
  error: null,
};

export const fetchChildren = createAsyncThunk(
  'children/fetchChildren',
  async () => {
    const response = await api.get('/api/children');

    return response.data;
  }
);

export const fetchChildById = createAsyncThunk(
  'children/fetchChildById',
  async (childId: string) => {
    const response = await api.get(`/api/children/${childId}`);

    return response.data;
  }
);

export const createChild = createAsyncThunk(
  'children/createChild',
  async (
    childData: Omit<Child, 'id' | 'user_id' | 'created_at' | 'updated_at'>
  ) => {
    const response = await api.post('/api/children', childData);

    return response.data;
  }
);

export const updateChild = createAsyncThunk(
  'children/updateChild',
  async ({
    childId,
    childData,
  }: {
    childId: string;
    childData: Partial<Child>;
  }) => {
    const response = await api.put(`/api/children/${childId}`, childData);

    return response.data;
  }
);

const childrenSlice = createSlice({
  name: 'children',
  initialState,
  reducers: {
    selectChild: (state, action) => {
      state.selectedChild =
        state.children.find(child => child.id === action.payload) || null;
    },
    clearSelectedChild: state => {
      state.selectedChild = null;
    },
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Fetch Children
    builder
      .addCase(fetchChildren.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChildren.fulfilled, (state, action) => {
        state.loading = false;
        state.children = action.payload;
      })
      .addCase(fetchChildren.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch children';
      });

    // Fetch Child by ID
    builder
      .addCase(fetchChildById.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchChildById.fulfilled, (state, action) => {
        state.loading = false;
        state.selectedChild = action.payload;
        const index = state.children.findIndex(
          child => child.id === action.payload.id
        );

        if (index !== -1) {
          state.children[index] = action.payload;
        } else {
          state.children.push(action.payload);
        }
      })
      .addCase(fetchChildById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to fetch child';
      });

    // Create Child
    builder
      .addCase(createChild.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createChild.fulfilled, (state, action) => {
        state.loading = false;
        state.children.push(action.payload);
        state.selectedChild = action.payload;
      })
      .addCase(createChild.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to create child';
      });

    // Update Child
    builder
      .addCase(updateChild.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateChild.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.children.findIndex(
          child => child.id === action.payload.id
        );

        if (index !== -1) {
          state.children[index] = action.payload;
        }

        if (state.selectedChild?.id === action.payload.id) {
          state.selectedChild = action.payload;
        }
      })
      .addCase(updateChild.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update child';
      });
  },
});

export const { selectChild, clearSelectedChild, clearError } =
  childrenSlice.actions;
export default childrenSlice.reducer;
