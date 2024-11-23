import { vi } from 'vitest';

// Mock API client
export const mockApiClient = {
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn()
};

// Mock auth context
export const mockAuthContext = {
  user: {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@example.com',
    full_name: 'Test User',
    role: 'parent',
    subscription_type: 'free'
  },
  loading: false,
  error: null,
  signIn: vi.fn(),
  signUp: vi.fn(),
  signOut: vi.fn(),
  resetPassword: vi.fn(),
  updatePassword: vi.fn(),
  updateProfile: vi.fn()
};

// Mock user data
export const mockUser = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174000',
  email: 'test@example.com',
  full_name: 'Test User',
  role: 'parent',
  subscription_type: 'free',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Mock child data
export const mockChild = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174001',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  name: 'Test Child',
  date_of_birth: '2020-01-01',
  gender: 'male',
  profile_data: {},
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Mock activity data
export const mockActivity = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174002',
  name: 'Test Activity',
  description: 'Test activity description',
  min_age_months: 12,
  max_age_months: 24,
  duration_minutes: 30,
  category: 'physical',
  tags: ['test', 'activity'],
  ai_generated: false,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Mock milestone data
export const mockMilestone = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174003',
  name: 'Test Milestone',
  description: 'Test milestone description',
  min_age_months: 12,
  max_age_months: 24,
  category: 'physical',
  importance: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Mock activity log data
export const mockActivityLog = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174004',
  child_id: '123e4567-e89b-12d3-a456-426614174001',
  activity_id: '123e4567-e89b-12d3-a456-426614174002',
  status: 'pending',
  scheduled_for: new Date().toISOString(),
  completed_at: null,
  notes: null,
  duration_minutes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Mock milestone tracking data
export const mockMilestoneTracking = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174005',
  child_id: '123e4567-e89b-12d3-a456-426614174001',
  milestone_id: '123e4567-e89b-12d3-a456-426614174003',
  achieved_at: null,
  notes: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Mock media data
export const mockMedia = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174006',
  child_id: '123e4567-e89b-12d3-a456-426614174001',
  type: 'photo',
  file_path: '/test/path/image.jpg',
  file_size: 1024,
  mime_type: 'image/jpeg',
  analysis_data: null,
  embedding: null,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...overrides
});

// Mock AI chat history data
export const mockAIChatHistory = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174007',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  child_id: '123e4567-e89b-12d3-a456-426614174001',
  message: 'Test message',
  response: 'Test response',
  embedding: null,
  created_at: new Date().toISOString(),
  ...overrides
});

// Mock notification data
export const mockNotification = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174008',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Notification',
  message: 'Test notification message',
  read_at: null,
  created_at: new Date().toISOString(),
  ...overrides
});

// Mock error data
export const mockError = (overrides = {}) => ({
  code: 'TEST_ERROR',
  message: 'Test error message',
  details: null,
  ...overrides
});

// Mock file data
export const mockFile = (overrides = {}) => ({
  name: 'test.jpg',
  type: 'image/jpeg',
  size: 1024,
  lastModified: Date.now(),
  ...overrides
});

// Mock form data
export const mockFormData = () => {
  const formData = new FormData();
  formData.append = vi.fn();
  formData.delete = vi.fn();
  formData.get = vi.fn();
  formData.getAll = vi.fn();
  formData.has = vi.fn();
  formData.set = vi.fn();
  return formData;
};

// Mock event handlers
export const mockEventHandlers = {
  onClick: vi.fn(),
  onChange: vi.fn(),
  onSubmit: vi.fn(),
  onKeyDown: vi.fn(),
  onFocus: vi.fn(),
  onBlur: vi.fn(),
  onMouseEnter: vi.fn(),
  onMouseLeave: vi.fn()
};

// Mock window methods
export const mockWindow = {
  location: {
    href: 'http://localhost:3000',
    pathname: '/',
    search: '',
    hash: '',
    assign: vi.fn(),
    replace: vi.fn()
  },
  localStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  sessionStorage: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  },
  scrollTo: vi.fn(),
  alert: vi.fn(),
  confirm: vi.fn(),
  prompt: vi.fn()
};