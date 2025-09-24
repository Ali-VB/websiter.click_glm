import { supabase as globalSupabase } from './supabase';
import type { SupabaseClient } from '@supabase/supabase-js';

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
  static async uploadAsset(
    options: AssetUploadOptions,
    supabaseClient?: SupabaseClient
  ): Promise<AssetUploadResult> {
    const supabase = supabaseClient || globalSupabase;
    try {
      const { projectId, file, assetType, description, userId } = options;

      // Validate file size (10MB limit)
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        return {
          success: false,
          error: `File size exceeds the 10MB limit. Your file is ${this.formatFileSize(file.size)}`
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
          error: `File type not supported. Your file is ${file.type}. Supported formats: JPG, PNG, GIF, WEBP, PDF, DOC, DOCX`
        };
      }

      // Generate a unique file name with timestamp and random string
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 15);
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${timestamp}-${randomString}.${fileExt}`;

      console.log('Uploading file:', {
        originalName: file.name,
        fileName: fileName,
        size: file.size,
        type: file.type,
        projectId: projectId
      });

      // Upload file to Supabase Storage with retry logic
      let uploadAttempts = 0;
      const maxUploadAttempts = 3;
      let uploadError: Error | null = null;

      while (uploadAttempts < maxUploadAttempts) {
        try {
          const { data: uploadData, error: uploadErr } = await supabase.storage
            .from('project-assets')
            .upload(fileName, file, {
              cacheControl: '3600',
              upsert: false
            });

          if (uploadErr) {
            uploadError = uploadErr;
            uploadAttempts++;
            console.log(`Upload attempt ${uploadAttempts} failed:`, uploadErr);
            if (uploadAttempts < maxUploadAttempts) {
              // Wait before retrying
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            console.log('File uploaded successfully:', uploadData);
            uploadError = null;
            break;
          }
        } catch (err) {
          uploadError = err as Error;
          uploadAttempts++;
          console.log(`Upload attempt ${uploadAttempts} threw error:`, err);
          if (uploadAttempts < maxUploadAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (uploadError) {
        console.error('All upload attempts failed:', uploadError);
        return {
          success: false,
          error: `Failed to upload file after ${maxUploadAttempts} attempts: ${uploadError.message || 'Unknown error'}`
        };
      }

      // Get public URL for the uploaded file
      const { data: urlData } = supabase.storage
        .from('project-assets')
        .getPublicUrl(fileName);

      console.log('Generated public URL:', urlData.publicUrl);

      // Save asset information to the database with retry logic
      let dbAttempts = 0;
      const maxDbAttempts = 3;
      let dbError: Error | null = null;
      let assetData: Asset | null = null;

      while (dbAttempts < maxDbAttempts) {
        try {
          const { data: asset, error: assetErr } = await supabase
            .from('project_assets')
            .insert({
              project_id: projectId,
              user_id: userId,
              file_name: file.name,
              file_path: fileName,
              asset_type: assetType
            })
            .select()
            .single();

          if (assetErr) {
            dbError = assetErr;
            dbAttempts++;
            console.log(`Database save attempt ${dbAttempts} failed:`, assetErr);
            if (dbAttempts < maxDbAttempts) {
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } else {
            console.log('Asset saved to database:', asset);
            assetData = asset as Asset;
            dbError = null;
            break;
          }
        } catch (err) {
          dbError = err as Error;
          dbAttempts++;
          console.log(`Database save attempt ${dbAttempts} threw error:`, err);
          if (dbAttempts < maxDbAttempts) {
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }
      }

      if (dbError) {
        console.error('All database save attempts failed:', dbError);
        // Attempt to clean up the uploaded file
        try {
          await supabase.storage.from('project-assets').remove([fileName]);
        } catch (cleanupError) {
          console.error('Failed to cleanup uploaded file:', cleanupError);
        }
        
        return {
          success: false,
          error: `Failed to save asset information after ${maxDbAttempts} attempts: ${dbError.message || 'Unknown error'}`
        };
      }

      return {
        success: true,
        asset: assetData || undefined
      };
    } catch (error) {
      console.error('Unexpected error in asset upload:', error);
      return {
        success: false,
        error: `An unexpected error occurred: ${error.message || 'Unknown error'}`
      };
    }
  }

  /**
   * Format file size in human readable format
   */
  private static formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  }

  /**
   * Get all assets for a specific project
   */
  static async getProjectAssets(projectId: string, supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient || globalSupabase;
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
  static async deleteAsset(assetId: string, filePath: string, supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient || globalSupabase;
    try {
      // Delete from storage first to avoid orphaned files
      const { error: storageError } = await supabase.storage
        .from('project-assets')
        .remove([filePath]);

      if (storageError) {
        // Log the error, but don't block DB deletion if the file is already gone (e.g., "Not Found" error)
        console.error('Error deleting asset from storage:', storageError);
        // In a production app, you might want to check for specific errors here and handle them.
      }

      // Delete from database
      const { error: dbError } = await supabase
        .from('project_assets')
        .delete()
        .eq('id', assetId);

      if (dbError) {
        console.error('Error deleting asset from database:', dbError);
        return { success: false, error: 'Failed to delete asset from database' };
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
  static async getSignedUrl(filePath: string, expiresIn = 60, supabaseClient?: SupabaseClient) {
    const supabase = supabaseClient || globalSupabase;
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
