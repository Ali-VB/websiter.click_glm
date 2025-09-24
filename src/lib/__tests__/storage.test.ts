import { AssetStorage, type AssetUploadOptions, type Asset, type AssetUploadResult } from '../storage';
import { supabase } from '../supabase';

// Mock the Supabase client
jest.mock('../supabase', () => ({
  supabase: {
    storage: {
      from: jest.fn(),
    },
    from: jest.fn(),
  },
}));

const mockSupabase = supabase as jest.Mocked<typeof supabase>;

// Define mock types
interface MockStorage {
  upload: jest.Mock;
  getPublicUrl: jest.Mock;
  remove: jest.Mock;
  createSignedUrl: jest.Mock;
}

interface MockDb {
  insert: jest.Mock;
  select: jest.Mock;
  eq: jest.Mock;
  delete: jest.Mock;
  order: jest.Mock;
  single: jest.Mock;
}

describe('AssetStorage', () => {
  let mockStorage: MockStorage;
  let mockDb: MockDb;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Create mock storage
    mockStorage = {
      upload: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
      createSignedUrl: jest.fn(),
    };

    // Create mock database
    mockDb = {
      insert: jest.fn(),
      select: jest.fn(),
      eq: jest.fn(),
      delete: jest.fn(),
      order: jest.fn(),
      single: jest.fn(),
    };

    // Setup Supabase mocks
    (mockSupabase.storage.from as jest.Mock).mockReturnValue(mockStorage);
    (mockSupabase.from as jest.Mock).mockReturnValue(mockDb);
  });

  describe('uploadAsset', () => {
    it('should successfully upload an asset', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const options: AssetUploadOptions = {
        projectId: 'project-123',
        file: mockFile,
        assetType: 'image',
        description: 'Test image',
        userId: 'user-123',
      };

      const mockUploadData = { path: 'user-123/123456-test.jpg' };
      const mockUrlData = { publicUrl: 'https://example.com/user-123/123456-test.jpg' };
      const mockAssetData: Asset = {
        id: 'asset-123',
        project_id: 'project-123',
        file_name: 'test.jpg',
        file_url: 'https://example.com/user-123/123456-test.jpg',
        asset_type: 'image',
        uploaded_by: 'user-123', // This property is not in the table, but in the Asset type, so we keep it for the expected result
        description: 'Test image',
        created_at: '2023-01-01T00:00:00Z',
      };

      mockStorage.upload.mockResolvedValue({ data: mockUploadData, error: null });
      mockStorage.getPublicUrl.mockReturnValue({ data: { publicUrl: mockUrlData.publicUrl } });
      mockDb.insert.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.single.mockResolvedValue({ data: mockAssetData, error: null });

      // Act
      const result = await AssetStorage.uploadAsset(options);

      // Assert
      expect(result.success).toBe(true);
      expect(result.asset).toEqual(mockAssetData);
      expect(mockStorage.upload).toHaveBeenCalledWith(
        expect.stringMatching(/user-123\/\d+-.*\.jpg/),
        mockFile,
        { cacheControl: '3600', upsert: false }
      );
      expect(mockStorage.getPublicUrl).toHaveBeenCalledWith(expect.stringMatching(/user-123\/\d+-.*\.jpg/));
      expect(mockDb.insert).toHaveBeenCalledWith({
        project_id: 'project-123',
        user_id: 'user-123',
        file_name: 'test.jpg',
        file_path: expect.any(String),
        file_url: 'https://example.com/user-123/123456-test.jpg',
        asset_type: 'image',
        description: 'Test image',
      });
    });

    it('should return error when file size exceeds limit', async () => {
      // Arrange
      const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' }); // 11MB
      const options: AssetUploadOptions = {
        projectId: 'project-123',
        file: largeFile,
        assetType: 'image',
        userId: 'user-123',
      };

      // Act
      const result = await AssetStorage.uploadAsset(options);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('File size exceeds the 10MB limit');
      expect(mockStorage.upload).not.toHaveBeenCalled();
    });

    it('should return error when file type is not supported', async () => {
      // Arrange
      const unsupportedFile = new File(['test'], 'test.exe', { type: 'application/exe' });
      const options: AssetUploadOptions = {
        projectId: 'project-123',
        file: unsupportedFile,
        assetType: 'executable',
        userId: 'user-123',
      };

      // Act
      const result = await AssetStorage.uploadAsset(options);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('File type not supported');
      expect(mockStorage.upload).not.toHaveBeenCalled();
    });

    it('should return error when upload fails', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const options: AssetUploadOptions = {
        projectId: 'project-123',
        file: mockFile,
        assetType: 'image',
        userId: 'user-123',
      };

      mockStorage.upload.mockResolvedValue({ data: null, error: { message: 'Upload failed' } });

      // Act
      const result = await AssetStorage.uploadAsset(options);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to upload file');
      expect(mockStorage.getPublicUrl).not.toHaveBeenCalled();
      expect(mockDb.insert).not.toHaveBeenCalled();
    });

    it('should return error when database insert fails and clean up uploaded file', async () => {
      // Arrange
      const mockFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' });
      const options: AssetUploadOptions = {
        projectId: 'project-123',
        file: mockFile,
        assetType: 'image',
        userId: 'user-123',
      };

      const mockUploadData = { path: 'user-123/123456-test.jpg' };
      const mockUrlData = { publicUrl: 'https://example.com/user-123/123456-test.jpg' };

      mockStorage.upload.mockResolvedValue({ data: mockUploadData, error: null });
      mockStorage.getPublicUrl.mockReturnValue({ data: { publicUrl: mockUrlData.publicUrl } });
      mockStorage.remove.mockResolvedValue({ data: null, error: null });
      mockDb.insert.mockReturnValue(mockDb);
      mockDb.select.mockReturnValue(mockDb);
      mockDb.single.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      // Act
      const result = await AssetStorage.uploadAsset(options);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toContain('Failed to save asset information');
      expect(mockStorage.remove).toHaveBeenCalledWith([expect.stringMatching(/user-123\/\d+-.*\.jpg/)]);
    });
  });

  describe('getProjectAssets', () => {
    it('should successfully get project assets', async () => {
      // Arrange
      const projectId = 'project-123';
      const mockAssets: Asset[] = [];

      mockDb.select.mockReturnValue(mockDb);
      mockDb.eq.mockReturnValue(mockDb);
      mockDb.order.mockResolvedValue({ data: mockAssets, error: null });

      // Act
      const result = await AssetStorage.getProjectAssets(projectId, mockSupabase as any);

      // Assert
      expect(result.success).toBe(true);
      expect(result.assets).toEqual(mockAssets);
    });

    it('should return error when database query fails', async () => {
      // Arrange
      const projectId = 'project-123';

      mockDb.select.mockReturnValue(mockDb);
      mockDb.eq.mockReturnValue(mockDb);
      mockDb.order.mockResolvedValue({ data: null, error: { message: 'Database error' } });

      // Act
      const result = await AssetStorage.getProjectAssets(projectId, mockSupabase as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to fetch assets');
    });
  });

  describe('deleteAsset', () => {
    const assetId = 'asset-123';
    const filePath = 'user-123/12345-test.jpg';

    it('should successfully delete an asset', async () => {
      // Arrange
      mockStorage.remove.mockResolvedValue({ error: null });
      mockDb.delete.mockReturnValue(mockDb);
      mockDb.eq.mockResolvedValue({ error: null });

      // Act
      const result = await AssetStorage.deleteAsset(assetId, filePath, mockSupabase as any);

      // Assert
      expect(result.success).toBe(true);
      expect(mockStorage.remove).toHaveBeenCalledWith([filePath]);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.eq).toHaveBeenCalledWith('id', assetId);
    });

    it('should return error when database delete fails', async () => {
      // Arrange
      mockStorage.remove.mockResolvedValue({ error: null }); // Storage deletion succeeds
      mockDb.delete.mockReturnValue(mockDb);
      mockDb.eq.mockResolvedValue({ error: { message: 'Database error' } });

      // Act
      const result = await AssetStorage.deleteAsset(assetId, filePath, mockSupabase as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to delete asset from database');
      expect(mockStorage.remove).toHaveBeenCalledWith([filePath]); // Storage remove is still called
    });

    it('should still succeed if storage delete fails but db delete succeeds', async () => {
      // Arrange
      mockStorage.remove.mockResolvedValue({ error: { message: 'Storage error' } });
      mockDb.delete.mockReturnValue(mockDb);
      mockDb.eq.mockResolvedValue({ error: null });

      // Act
      const result = await AssetStorage.deleteAsset(assetId, filePath, mockSupabase as any);

      // Assert
      expect(result.success).toBe(true);
      expect(mockStorage.remove).toHaveBeenCalledWith([filePath]);
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockDb.eq).toHaveBeenCalledWith('id', assetId);
    });
  });

  describe('getSignedUrl', () => {
    it('should successfully create a signed URL', async () => {
      // Arrange
      const filePath = 'project-123/test.jpg';
      const expiresIn = 60;
      const mockSignedUrl = 'https://example.com/signed-url';

      mockStorage.createSignedUrl.mockResolvedValue({
        data: { signedUrl: mockSignedUrl },
        error: null,
      });

      // Act
      const result = await AssetStorage.getSignedUrl(filePath, expiresIn, mockSupabase as any);

      // Assert
      expect(result.success).toBe(true);
      expect(result.signedUrl).toBe(mockSignedUrl);
      expect(mockStorage.createSignedUrl).toHaveBeenCalledWith(filePath, expiresIn);
    });

    it('should return error when signed URL creation fails', async () => {
      // Arrange
      const filePath = 'project-123/test.jpg';

      mockStorage.createSignedUrl.mockResolvedValue({
        data: null,
        error: { message: 'Signed URL error' },
      });

      // Act
      const result = await AssetStorage.getSignedUrl(filePath, 60, mockSupabase as any);

      // Assert
      expect(result.success).toBe(false);
      expect(result.error).toBe('Failed to create signed URL');
    });
  });
});