import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetUpload from '../AssetUpload';
import '@testing-library/jest-dom';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});
global.localStorage = localStorageMock as unknown as Storage;

// Mock the AssetStorage utility
jest.mock('@/lib/storage');
import { AssetStorage } from '@/lib/storage';

describe('AssetUpload Component', () => {
  const mockProjects = [
    { id: 'project-1', name: 'Project 1' },
    { id: 'project-2', name: 'Project 2' },
  ];

  const mockAssets = [
    {
      id: 'asset-1',
      file_name: 'test-image.jpg',
      file_url: 'https://example.com/test-image.jpg',
      asset_type: 'images',
      description: 'Test image',
      created_at: '2023-01-01T00:00:00Z',
    },
    {
      id: 'asset-2',
      file_name: 'test-document.pdf',
      file_url: 'https://example.com/test-document.pdf',
      asset_type: 'documents',
      description: 'Test document',
      created_at: '2023-01-02T00:00:00Z',
    },
  ];

  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup default localStorage mock
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === "supabase.auth.token") {
        return JSON.stringify({
          access_token: 'test-token',
          refresh_token: 'test-refresh-token',
        });
      }
      return null;
    });

    // Spy on global.fetch and provide a default mock implementation
    fetchSpy = jest.spyOn(global, 'fetch').mockImplementation((url, options) => {
      // Default successful response for any fetch call not specifically mocked in a test
      return Promise.resolve({
        ok: true,
        json: async () => ({}), // Return empty object by default
      } as Response);
    });
    
    // Setup default AssetStorage mocks
    (AssetStorage.uploadAsset as jest.Mock).mockResolvedValue({
      success: true,
      asset: {
        id: 'test-asset-id',
        project_id: 'project-1',
        file_name: 'test.jpg',
        file_url: 'https://example.com/test.jpg',
        asset_type: 'images',
        uploaded_by: 'user-id',
        description: null,
        created_at: '2023-01-01T00:00:00Z',
      }
    });
    (AssetStorage.getProjectAssets as jest.Mock).mockResolvedValue({
      success: true,
      assets: mockAssets,
    });
  });

  afterEach(() => {
    fetchSpy.mockRestore(); // Restore original fetch after each test
  });

  it('renders the component with project selection', () => {
    render(<AssetUpload projects={mockProjects} />);

    expect(screen.getByText('Select Project')).toBeInTheDocument();
    expect(screen.getByText('Choose a project...')).toBeInTheDocument();
    expect(screen.getByText('Project 1')).toBeInTheDocument();
    expect(screen.getByText('Project 2')).toBeInTheDocument();
  });

  it('renders asset type selection', () => {
    render(<AssetUpload projects={mockProjects} />);

    expect(screen.getByText('Asset Type')).toBeInTheDocument();
    expect(screen.getByText('Images')).toBeInTheDocument();
    expect(screen.getByText('Documents')).toBeInTheDocument();
    expect(screen.getByText('Logos')).toBeInTheDocument();
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders file upload area', () => {
    render(<AssetUpload projects={mockProjects} />);

    expect(screen.getByLabelText('Upload Files')).toBeInTheDocument();
    expect(screen.getByText('Drag & drop files here')).toBeInTheDocument();
    expect(screen.getByText('or click to browse')).toBeInTheDocument();
    expect(screen.getByText('Supported formats: JPG, PNG, PDF, DOC, DOCX (Max 10MB)')).toBeInTheDocument();
  });

  it('renders file description textarea', () => {
    render(<AssetUpload projects={mockProjects} />);

    expect(screen.getByText('Description (Optional)')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Add a description for the files you\'re uploading...')).toBeInTheDocument();
  });

  it('disables upload button when required fields are missing', () => {
    render(<AssetUpload projects={mockProjects} />);

    const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
    expect(uploadButton).toBeDisabled();
  });

  it('enables upload button when required fields are selected', async () => {
    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    // Select asset type - click on the div containing the Images text
    const imagesOption = screen.getByText('Images').closest('div');
    if (imagesOption) {
      await userEvent.click(imagesOption);
    }

    // Add a file
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
    expect(uploadButton).not.toBeDisabled();
  });

  it('displays selected files', async () => {
    render(<AssetUpload projects={mockProjects} />);

    // Add a file
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    await waitFor(() => {
      expect(screen.getByText('test.jpg')).toBeInTheDocument();
      expect(screen.getByText('12 bytes')).toBeInTheDocument(); // Size of the test file
    });
  });

  it('fetches assets when project is selected', async () => {
    fetchSpy.mockImplementation((url, options) => {
      if (url === '/api/assets?projectId=project-1' && options?.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ assets: mockAssets }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/assets?projectId=project-1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
      expect(screen.getByText('Uploaded Assets')).toBeInTheDocument();
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });
  });

  it('displays uploaded assets', async () => {
    fetchSpy.mockImplementation((url, options) => {
      if (url === '/api/assets?projectId=project-1' && options?.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ assets: mockAssets }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    await waitFor(() => {
      expect(screen.getByText('Uploaded Assets')).toBeInTheDocument();
      expect(screen.getByText('test-image.jpg')).toBeInTheDocument();
      expect(screen.getByText('test-document.pdf')).toBeInTheDocument();
    });
  });

  it('uploads files when upload button is clicked', async () => {
    // Mock fetch for getting assets and upload
    fetchSpy.mockImplementation((url, options) => {
      if (url === '/api/assets?projectId=project-1' && options?.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ assets: [] }),
        } as Response);
      }
      if (url === '/api/assets' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'File uploaded successfully' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    // Select asset type - click on the div containing the Images text
    const imagesOption = screen.getByText('Images').closest('div');
    if (imagesOption) {
      await userEvent.click(imagesOption);
    }

    // Add a file
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    // Click upload button
    const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(fetchSpy).toHaveBeenCalledWith(
        '/api/assets',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  it('displays success message when upload is successful', async () => {
    // Mock fetch for getting assets and upload
    fetchSpy.mockImplementation((url, options) => {
      if (url === '/api/assets?projectId=project-1' && options?.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ assets: [] }),
        } as Response);
      }
      if (url === '/api/assets' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'File uploaded successfully' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    // Select asset type - click on the div containing the Images text
    const imagesOption = screen.getByText('Images').closest('div');
    if (imagesOption) {
      await userEvent.click(imagesOption);
    }

    // Add a file
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    // Click upload button
    const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Successfully uploaded 1 file(s)')).toBeInTheDocument();
    });
  });

  it('displays error message when upload fails', async () => {
    // Mock fetch for getting assets and upload
    fetchSpy.mockImplementation((url, options) => {
      if (url === '/api/assets?projectId=project-1' && options?.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ assets: [] }),
        } as Response);
      }
      if (url === '/api/assets' && options?.method === 'POST') {
        return Promise.resolve({
          ok: false,
          json: async () => ({ error: 'Upload failed' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    // Select asset type - click on the div containing the Images text
    const imagesOption = screen.getByText('Images').closest('div');
    if (imagesOption) {
      await userEvent.click(imagesOption);
    }

    // Add a file
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    // Click upload button
    const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Some files failed to upload. Please try again.')).toBeInTheDocument();
    });
  });

  it('resets form after successful upload', async () => {
    // Mock fetch for getting assets and upload
    fetchSpy.mockImplementation((url, options) => {
      if (url === '/api/assets?projectId=project-1' && options?.method === 'GET') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ assets: [] }),
        } as Response);
      }
      if (url === '/api/assets' && options?.method === 'POST') {
        return Promise.resolve({
          ok: true,
          json: async () => ({ message: 'File uploaded successfully' }),
        } as Response);
      }
      return Promise.resolve({
        ok: true,
        json: async () => ({}),
      } as Response);
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    // Select asset type - click on the div containing the Images text
    const imagesOption = screen.getByText('Images').closest('div');
    if (imagesOption) {
      await userEvent.click(imagesOption);
    }

    // Add a file
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    // Add description
    const descriptionTextarea = screen.getByPlaceholderText('Add a description for the files you\'re uploading...');
    await userEvent.type(descriptionTextarea, 'Test description');

    // Click upload button
    const uploadButton = screen.getByRole('button', { name: 'Upload Files' });
    await userEvent.click(uploadButton);

    await waitFor(() => {
      // Check that form is reset
      expect(screen.queryByText('test.jpg')).not.toBeInTheDocument();
      expect(descriptionTextarea).toHaveValue('');
    });
  });

  it('handles drag and drop file upload', async () => {
    render(<AssetUpload projects={mockProjects} />);

    // Get the drop area
    const dropArea = screen.getByText('Drag & drop files here').closest('div');

    if (dropArea) {
      // Create a file to drop
      const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
      
      // Create a mock dataTransfer object
      const dataTransfer = {
        files: [file],
      };

      // Create a drag event with the file using a more realistic approach
      const dragEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: dataTransfer,
        enumerable: true,
        writable: false,
      });

      // Dispatch the drag events
      fireEvent.dragOver(dropArea);
      fireEvent(dropArea, dragEvent);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });
    }
  });
});