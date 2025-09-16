import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AssetUpload from '../AssetUpload';
import '@testing-library/jest-dom';

// Mock the fetch function
global.fetch = jest.fn();

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};
global.localStorage = localStorageMock as unknown as Storage;

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

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Setup default localStorage mock
    localStorageMock.getItem.mockReturnValue(JSON.stringify({
      access_token: 'test-token',
      refresh_token: 'test-refresh-token',
    }));
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

    expect(screen.getByText('Upload Files')).toBeInTheDocument();
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

    const uploadButton = screen.getByText('Upload Files');
    expect(uploadButton).toBeDisabled();
  });

  it('enables upload button when required fields are selected', async () => {
    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    // Select asset type
    const imagesOption = screen.getByText('Images');
    await userEvent.click(imagesOption);

    // Add a file
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    const uploadButton = screen.getByText('Upload Files');
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
      expect(screen.getByText('13 bytes')).toBeInTheDocument(); // Size of the test file
    });
  });

  it('fetches assets when project is selected', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assets: mockAssets }),
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
        '/api/assets?projectId=project-1',
        expect.objectContaining({
          method: 'GET',
          headers: expect.objectContaining({
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });
  });

  it('displays uploaded assets', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assets: mockAssets }),
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
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assets: [] }),
    });

    // Mock successful upload response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'File uploaded successfully' }),
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    // Select asset type
    const imagesOption = screen.getByText('Images');
    await userEvent.click(imagesOption);

    // Add a file
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    // Click upload button
    const uploadButton = screen.getByText('Upload Files');
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith(
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
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assets: [] }),
    });

    // Mock successful upload response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'File uploaded successfully' }),
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    // Select asset type
    const imagesOption = screen.getByText('Images');
    await userEvent.click(imagesOption);

    // Add a file
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    // Click upload button
    const uploadButton = screen.getByText('Upload Files');
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Successfully uploaded 1 file(s)')).toBeInTheDocument();
    });
  });

  it('displays error message when upload fails', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assets: [] }),
    });

    // Mock failed upload response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: 'Upload failed' }),
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    // Select asset type
    const imagesOption = screen.getByText('Images');
    await userEvent.click(imagesOption);

    // Add a file
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    // Click upload button
    const uploadButton = screen.getByText('Upload Files');
    await userEvent.click(uploadButton);

    await waitFor(() => {
      expect(screen.getByText('Some files failed to upload. Please try again.')).toBeInTheDocument();
    });
  });

  it('resets form after successful upload', async () => {
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ assets: [] }),
    });

    // Mock successful upload response
    (fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ message: 'File uploaded successfully' }),
    });

    render(<AssetUpload projects={mockProjects} />);

    // Select project
    const projectSelect = screen.getByLabelText('Select Project');
    await userEvent.selectOptions(projectSelect, 'project-1');

    // Select asset type
    const imagesOption = screen.getByText('Images');
    await userEvent.click(imagesOption);

    // Add a file
    const fileInput = screen.getByLabelText('Upload Files');
    const file = new File(['test content'], 'test.jpg', { type: 'image/jpeg' });
    await userEvent.upload(fileInput, file);

    // Add description
    const descriptionTextarea = screen.getByPlaceholderText('Add a description for the files you\'re uploading...');
    await userEvent.type(descriptionTextarea, 'Test description');

    // Click upload button
    const uploadButton = screen.getByText('Upload Files');
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
      
      // Create a drag event with the file
      const dragEvent = new Event('drop', { bubbles: true });
      Object.defineProperty(dragEvent, 'dataTransfer', {
        value: {
          files: [file],
        },
      });

      // Dispatch the drag events
      fireEvent.dragOver(dropArea);
      fireEvent.drop(dropArea, dragEvent);

      await waitFor(() => {
        expect(screen.getByText('test.jpg')).toBeInTheDocument();
      });
    }
  });
});