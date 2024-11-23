import { jest } from '@jest/globals';
import { SupabaseClient } from '@supabase/supabase-js';
import { CacheService } from '../../services/cache';
import { logger } from '../../utils/logger';

// Mock Supabase client
export const mockSupabaseClient = {
  auth: {
    signUp: jest.fn(),
    signIn: jest.fn(),
    signOut: jest.fn(),
    refreshSession: jest.fn(),
    resetPasswordForEmail: jest.fn(),
    updateUser: jest.fn(),
    getUser: jest.fn(),
    getSession: jest.fn()
  },
  from: jest.fn().mockReturnThis(),
  select: jest.fn().mockReturnThis(),
  insert: jest.fn().mockReturnThis(),
  update: jest.fn().mockReturnThis(),
  delete: jest.fn().mockReturnThis(),
  eq: jest.fn().mockReturnThis(),
  in: jest.fn().mockReturnThis(),
  match: jest.fn().mockReturnThis(),
  gte: jest.fn().mockReturnThis(),
  lte: jest.fn().mockReturnThis(),
  order: jest.fn().mockReturnThis(),
  limit: jest.fn().mockReturnThis(),
  single: jest.fn(),
  execute: jest.fn()
} as unknown as jest.Mocked<SupabaseClient>;

// Mock Redis client
export const mockRedisClient = {
  connect: jest.fn(),
  quit: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  exists: jest.fn(),
  expire: jest.fn(),
  ttl: jest.fn(),
  scan: jest.fn(),
  keys: jest.fn(),
  mget: jest.fn(),
  mset: jest.fn(),
  pipeline: jest.fn(),
  multi: jest.fn(),
  exec: jest.fn(),
  flushDb: jest.fn(),
  info: jest.fn(),
  on: jest.fn(),
  configSet: jest.fn()
};

// Mock Cache service
export const mockCacheService = {
  init: jest.fn(),
  dispose: jest.fn(),
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
  clearPattern: jest.fn(),
  getOrSet: jest.fn(),
  mget: jest.fn(),
  mset: jest.fn(),
  clear: jest.fn(),
  getStats: jest.fn(),
  exists: jest.fn(),
  ttl: jest.fn(),
  keys: jest.fn(),
  generateKey: jest.fn()
} as unknown as jest.Mocked<CacheService>;

// Mock Groq client
export const mockGroqClient = {
  chat: {
    completions: {
      create: jest.fn()
    }
  }
};

// Mock ElevenLabs client
export const mockElevenLabsClient = {
  textToSpeech: jest.fn(),
  getVoices: jest.fn(),
  getModels: jest.fn()
};

// Mock logger
export const mockLogger = {
  error: jest.fn(),
  warn: jest.fn(),
  info: jest.fn(),
  debug: jest.fn(),
  http: jest.fn()
} as unknown as jest.Mocked<typeof logger>;

// Mock request object
export const mockRequest = () => {
  const req: any = {
    body: {},
    query: {},
    params: {},
    headers: {},
    cookies: {},
    ip: '127.0.0.1',
    method: 'GET',
    path: '/',
    originalUrl: '/',
    protocol: 'http',
    secure: false,
    xhr: false,
    get: jest.fn()
  };
  return req;
};

// Mock response object
export const mockResponse = () => {
  const res: any = {
    status: jest.fn().mockReturnThis(),
    json: jest.fn().mockReturnThis(),
    send: jest.fn().mockReturnThis(),
    end: jest.fn().mockReturnThis(),
    setHeader: jest.fn().mockReturnThis(),
    getHeader: jest.fn(),
    cookie: jest.fn().mockReturnThis(),
    clearCookie: jest.fn().mockReturnThis(),
    locals: {},
    headersSent: false
  };
  return res;
};

// Mock next function
export const mockNext = jest.fn();

// Mock file object
export const mockFile = (overrides = {}) => ({
  fieldname: 'file',
  originalname: 'test.jpg',
  encoding: '7bit',
  mimetype: 'image/jpeg',
  buffer: Buffer.from('test'),
  size: 4,
  ...overrides
});

// Mock user object
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

// Mock child object
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

// Mock activity object
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

// Mock milestone object
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

// Mock activity log object
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

// Mock milestone tracking object
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

// Mock media object
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

// Mock AI chat history object
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

// Mock notification object
export const mockNotification = (overrides = {}) => ({
  id: '123e4567-e89b-12d3-a456-426614174008',
  user_id: '123e4567-e89b-12d3-a456-426614174000',
  title: 'Test Notification',
  message: 'Test notification message',
  read_at: null,
  created_at: new Date().toISOString(),
  ...overrides
});

// Mock error object
export const mockError = (overrides = {}) => ({
  code: 'TEST_ERROR',
  message: 'Test error message',
  details: null,
  stack: new Error().stack,
  ...overrides
});