import { NextRequest } from 'next/server';
import { POST, GET } from '../route';
import { supabase } from '@/lib/supabase';

// Mock the supabase module
jest.mock('@/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(),
        getPublicUrl: jest.fn(),
        remove: jest.fn(),
      })),
    },
    from: jest.fn(() => ({
      insert: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      order: jest.fn(),
      delete: jest.fn(),
    })),
  },
}));

describe('Assets API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /api/assets', () => {
    it('should return 401 if authorization header is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/assets', {
        method: 'POST',
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized: Missing or invalid token');
    });

    it('should return 401 if token is invalid', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const request = new NextRequest('http://localhost:3000/api/assets', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized: Invalid token');
    });

    it('should return 400 if required fields are missing', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      const formData = new FormData();
      formData.append('file', new File(['content'], 'test.txt', { type: 'text/plain' }));
      // Missing projectId and assetType

      const request = new NextRequest('http://localhost:3000/api/assets', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing required fields: file, projectId, or assetType');
    });

    it('should return 400 if file size exceeds limit', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      // Create a large file (11MB)
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', largeFile);
      formData.append('projectId', 'project-id');
      formData.append('assetType', 'documents');

      const request = new NextRequest('http://localhost:3000/api/assets', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File size exceeds the 10MB limit');
    });

    it('should return 400 if file type is not supported', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      const unsupportedFile = new File(['content'], 'test.exe', { type: 'application/x-msdownload' });
      const formData = new FormData();
      formData.append('file', unsupportedFile);
      formData.append('projectId', 'project-id');
      formData.append('assetType', 'documents');

      const request = new NextRequest('http://localhost:3000/api/assets', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('File type not supported. Supported formats: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX');
    });

    it('should successfully upload a valid file', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      // Mock storage upload
      const mockUpload = jest.fn().mockResolvedValue({
        data: { path: 'project-id/file-name' },
        error: null,
      });
      const mockGetPublicUrl = jest.fn().mockReturnValue({
        data: { publicUrl: 'https://example.com/file-url' },
      });
      const mockInsert = jest.fn().mockReturnValue({
        select: jest.fn().mockReturnValue({
          single: jest.fn().mockResolvedValue({
            data: {
              id: 'asset-id',
              project_id: 'project-id',
              file_name: 'test.txt',
              file_url: 'https://example.com/file-url',
              asset_type: 'documents',
              uploaded_by: 'user-id',
              description: null,
              created_at: '2023-01-01T00:00:00Z',
            },
            error: null,
          }),
        }),
      });

      (supabase.storage.from as jest.Mock).mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      });

      (supabase.from as jest.Mock).mockReturnValue({
        insert: mockInsert,
      });

      const validFile = new File(['content'], 'test.txt', { type: 'text/plain' });
      const formData = new FormData();
      formData.append('file', validFile);
      formData.append('projectId', 'project-id');
      formData.append('assetType', 'documents');

      const request = new NextRequest('http://localhost:3000/api/assets', {
        method: 'POST',
        headers: {
          Authorization: 'Bearer valid-token',
        },
        body: formData,
      });

      const response = await POST(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.message).toBe('File uploaded successfully');
      expect(data.asset).toEqual({
        id: 'asset-id',
        project_id: 'project-id',
        file_name: 'test.txt',
        file_url: 'https://example.com/file-url',
        asset_type: 'documents',
        uploaded_by: 'user-id',
        description: null,
        created_at: '2023-01-01T00:00:00Z',
      });

      expect(mockUpload).toHaveBeenCalledWith('project-id/test.txt', validFile, {
        cacheControl: '3600',
        upsert: false,
      });
      expect(mockInsert).toHaveBeenCalledWith({
        project_id: 'project-id',
        file_name: 'test.txt',
        file_url: 'https://example.com/file-url',
        asset_type: 'documents',
        uploaded_by: 'user-id',
        description: null,
      });
    });
  });

  describe('GET /api/assets', () => {
    it('should return 401 if authorization header is missing', async () => {
      const request = new NextRequest('http://localhost:3000/api/assets?projectId=project-id', {
        method: 'GET',
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized: Missing or invalid token');
    });

    it('should return 401 if token is invalid', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: null },
        error: { message: 'Invalid token' },
      });

      const request = new NextRequest('http://localhost:3000/api/assets?projectId=project-id', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer invalid-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(401);
      expect(data.error).toBe('Unauthorized: Invalid token');
    });

    it('should return 400 if projectId is missing', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      const request = new NextRequest('http://localhost:3000/api/assets', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing projectId parameter');
    });

    it('should return assets for a valid project', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      const mockAssets = [
        {
          id: 'asset-id-1',
          project_id: 'project-id',
          file_name: 'test1.txt',
          file_url: 'https://example.com/file1-url',
          asset_type: 'documents',
          uploaded_by: 'user-id',
          description: 'Test file 1',
          created_at: '2023-01-01T00:00:00Z',
        },
        {
          id: 'asset-id-2',
          project_id: 'project-id',
          file_name: 'test2.jpg',
          file_url: 'https://example.com/file2-url',
          asset_type: 'images',
          uploaded_by: 'user-id',
          description: 'Test file 2',
          created_at: '2023-01-02T00:00:00Z',
        },
      ];

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: mockAssets,
            error: null,
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest('http://localhost:3000/api/assets?projectId=project-id', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.assets).toEqual(mockAssets);
      expect(mockSelect).toHaveBeenCalledWith('*');
      expect(mockSelect().eq).toHaveBeenCalledWith('project_id', 'project-id');
      expect(mockSelect().eq().order).toHaveBeenCalledWith('created_at', { ascending: false });
    });

    it('should return 500 if there is an error fetching assets', async () => {
      (supabase.auth.getUser as jest.Mock).mockResolvedValue({
        data: { user: { id: 'user-id' } },
        error: null,
      });

      const mockSelect = jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({
          order: jest.fn().mockResolvedValue({
            data: null,
            error: { message: 'Database error' },
          }),
        }),
      });

      (supabase.from as jest.Mock).mockReturnValue({
        select: mockSelect,
      });

      const request = new NextRequest('http://localhost:3000/api/assets?projectId=project-id', {
        method: 'GET',
        headers: {
          Authorization: 'Bearer valid-token',
        },
      });

      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to fetch assets');
    });
  });
});