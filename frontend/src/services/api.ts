import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '@/store';

export const api = createApi({
  baseQuery: fetchBaseQuery({ 
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  endpoints: (builder) => ({
    getActivities: builder.query<Activity[], void>({
      query: () => 'activities',
    }),
    getMilestones: builder.query<Milestone[], void>({
      query: () => 'development/milestones',
    }),
    scheduleActivity: builder.mutation<ActivityLog, ScheduleActivityData>({
      query: (data) => ({
        url: 'activities/schedule',
        method: 'POST',
        body: data,
      }),
    }),
    updateActivityLog: builder.mutation<ActivityLog, { logId: string; data: UpdateActivityLogData }>({
      query: ({ logId, data }) => ({
        url: `activities/log/${logId}`,
        method: 'PUT',
        body: data,
      }),
    }),
    getUpcomingActivities: builder.query<ActivityLog[], string>({
      query: (childId) => `activities/child/${childId}/upcoming`,
    }),
    getCompletedActivities: builder.query<ActivityLog[], string>({
      query: (childId) => `activities/child/${childId}/completed`,
    }),
    generateSuggestions: builder.query<Activity[], string>({
      query: (childId) => `activities/child/${childId}/suggestions`,
    }),
  }),
});

export const {
  useGetActivitiesQuery,
  useGetMilestonesQuery,
  useScheduleActivityMutation,
  useUpdateActivityLogMutation,
  useGetUpcomingActivitiesQuery,
  useGetCompletedActivitiesQuery,
  useGenerateSuggestionsQuery,
} = api;

