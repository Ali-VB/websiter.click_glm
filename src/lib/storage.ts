import { supabase } from './supabase';

export interface AssetUploadOptions {
  projectId: string;
  file: File;
  assetType: string;
  description?: string;
  userId: string;
}

export interface Asset {
  id: string;
  project_id: string;
  file_name: string;
  file_url: string;
  asset_type: string;
  uploaded_by: string;
  description: string | null;
  created_at: string;
}

export interface AssetUploadResult {
  success: boolean;
  asset?: Asset;
  error?: string;
}

export class AssetStorage {
  /**
   * Upload a file to Supabase Storage and save metadata to the database
   */
  static async uploadAsset(options: AssetUploadOptions): Promise<AssetUploadResult> {
    try {
      const { projectId, file, assetType, description, userId } = options;

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: 'File size exceeds the 10MB limit'
        };
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 
        'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      ];
      
      if (!allowedTypes.includes(file.type)) {
        return {
          success: false,
          error: 'File type not supported. Supported formats: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX'
        };
      }

      // Generate a unique file name
      const fileExt = file.name.split('.').pop();
      const fileName = `${projectId}/${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;

      // Upload file to Supabase Storage
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('project-assets')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) {
        console.error('Error uploading file:', uploadError);
        return {
          success: false,
          error: 'Failed to upload file'
        };
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      // Save asset information to the database
      const { data: assetData, error: assetError } = await supabase
        .from('project_assets')
        .insert({
          project_id: projectId,
          file_name: file.name,
          file_url: urlData.publicUrl,
          asset_type: assetType,
          uploaded_by: userId,
          description: description || null
        })
        .select()
        .single();

      if (assetError) {
        console.error('Error saving asset information:', assetError);
        // Attempt to clean up the uploaded file
        await supabase.storage.from('project-assets').remove([fileName]);
        
        return {
          success: false,
          error: 'Failed to save asset information'
        };
      }

      return {
        success: true,
        asset: assetData
      };
    } catch (error) {
      console.error('Unexpected error in asset upload:', error);
      return {
        success: false,
        error: 'An unexpected error occurred'
      };
    }
  }

  /**
   * Get all assets for a specific project
   */
  static async getProjectAssets(projectId: string) {
    try {
      const { data: assets, error } = await supabase
        .from('project_assets')
        .select('*')
        .eq('project_id', projectId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching assets:', error);
        return { success: false, error: 'Failed to fetch assets' };
      }

      return { success: true, assets };
    } catch (error) {
      console.error('Unexpected error in asset fetch:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Delete an asset from storage and database
   */
  static async deleteAsset(assetId: string, projectId: string, fileName: string) {
    try {
      // Delete from database
      const { error: dbError } = await supabase
        .from('project_assets')
        .delete()
        .eq('id', assetId);

      if (dbError) {
        console.error('Error deleting asset from database:', dbError);
        return { success: false, error: 'Failed to delete asset from database' };
      }

      // Delete from storage
      const filePath = `${projectId}/${fileName}`;
      const { error: storageError } = await supabase.storage
        .from('project-assets')
        .remove([filePath]);

      if (storageError) {
        console.error('Error deleting asset from storage:', storageError);
        return { success: false, error: 'Failed to delete asset from storage' };
      }

      return { success: true };
    } catch (error) {
      console.error('Unexpected error in asset deletion:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }

  /**
   * Get a signed URL for temporary access to a private asset
   */
  static async getSignedUrl(filePath: string, expiresIn = 60) {
    try {
      const { data, error } = await supabase.storage
        .from('project-assets')
        .createSignedUrl(filePath, expiresIn);

      if (error) {
        console.error('Error creating signed URL:', error);
        return { success: false, error: 'Failed to create signed URL' };
      }

      return { success: true, signedUrl: data.signedUrl };
    } catch (error) {
      console.error('Unexpected error creating signed URL:', error);
      return { success: false, error: 'An unexpected error occurred' };
    }
  }
}