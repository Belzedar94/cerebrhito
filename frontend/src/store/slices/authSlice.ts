import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import api from '@/services/api';

interface User {
  id: string;
  email: string;
  name: string;
  role: 'parent' | 'professional';
  specialization?: string;
  license_number?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  user: null,
  token: typeof window !== 'undefined' ? localStorage.getItem('token') : null,
  loading: false,
  error: null,
};

export const signIn = createAsyncThunk(
  'auth/signIn',
  async (credentials: { email: string; password: string }) => {
    const response = await api.post('/api/auth/signin', credentials);
    const { token, user } = response.data;

    localStorage.setItem('token', token);

    return { token, user };
  }
);

export const signUp = createAsyncThunk(
  'auth/signUp',
  async (userData: {
    email: string;
    password: string;
    name: string;
    role: 'parent' | 'professional';
    specialization?: string;
    license_number?: string;
  }) => {
    const response = await api.post('/api/auth/signup', userData);
    const { token, user } = response.data;

    localStorage.setItem('token', token);

    return { token, user };
  }
);

export const signOut = createAsyncThunk('auth/signOut', async () => {
  await api.post('/api/auth/signout');
  localStorage.removeItem('token');
});

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (userData: Partial<User>) => {
    const response = await api.put('/api/auth/profile', userData);

    return response.data;
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearError: state => {
      state.error = null;
    },
  },
  extraReducers: builder => {
    // Sign In
    builder
      .addCase(signIn.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signIn.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(signIn.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to sign in';
      });

    // Sign Up
    builder
      .addCase(signUp.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(signUp.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(signUp.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to sign up';
      });

    // Sign Out
    builder.addCase(signOut.fulfilled, state => {
      state.user = null;
      state.token = null;
    });

    // Update Profile
    builder
      .addCase(updateProfile.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(updateProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update profile';
      });
  },
});

export const { clearError } = authSlice.actions;
export default authSlice.reducer;
