import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase";
import { createClient } from '@supabase/supabase-js';
import { requireAdminFromToken } from "@/lib/auth-helpers";

// Helper function to format file size
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const supabase = createServerClient();

    // Force use service role client to bypass RLS
    console.log("🔧 Using service role client to bypass RLS...");
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in environment");
      return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    // Use separate queries to avoid relationship conflicts
    const { data: assets, error } = await serviceClient
      .from("project_assets")
      .select(`
        *,
        project:projects(id, name, client_id)
      `)
      .order("created_at", { ascending: false });

    // If we got assets, fetch client information separately
    let assetsWithClients = assets || [];
    if (assets && assets.length > 0) {
      // Get unique user_ids
      const userIds = [...new Set(assets.map(a => a.user_id).filter(Boolean))];

      if (userIds.length > 0) {
        const { data: clients } = await serviceClient
          .from("clients")
          .select("id, name, email")
          .in("id", userIds);

        // Create a map of client data for quick lookup
        const clientMap: Record<string, { id: string; name: string; email: string }> = {};
        clients?.forEach(client => {
          clientMap[client.id] = client;
        });

        // Attach client info to each asset
        assetsWithClients = assets.map(asset => ({
          ...asset,
          client: clientMap[asset.user_id] || null
        }));
      } else {
        assetsWithClients = assets;
      }
    }

    console.log("🔧 Service role query result:", {
      assetsCount: assets?.length || 0,
      clientsCount: assetsWithClients?.length || 0,
      error,
      sampleAsset: assetsWithClients?.[0] || null
    });

    if (error) {
      console.error("❌ Service role query failed:", error);
      return NextResponse.json({ error: "Failed to fetch assets with service role" }, { status: 500 });
    }

    // Transform assets to match ClientAsset interface
    const transformedAssets = assetsWithClients?.map(asset => {
      const fileName = asset.file_name || asset.file_path?.split('/').pop() || 'Unknown File';
      const fileExtension = fileName.split('.').pop() || '';
      const fileSize = asset.file_size || 0; // Default to 0 if null

      return {
        id: asset.id,
        client_id: asset.user_id || '',
        client_name: asset.client?.name || 'Unknown Client',
        client_email: asset.client?.email || 'Unknown Email',
        project_id: asset.project_id,
        project_name: asset.project?.name || 'Unknown Project',
        file_name: fileName,
        file_type: asset.asset_type || 'unknown',
        file_extension: fileExtension,
        file_size: fileSize,
        file_size_formatted: fileSize > 0 ? formatFileSize(fileSize) : '0 B',
        mime_type: asset.file_path?.includes('jpg') || asset.file_path?.includes('png') ? `image/${fileExtension}` : `application/${fileExtension}`,
        storage_path: asset.file_path || '',
        download_url: asset.file_path || '', // Will be used for download
        is_public: false,
        folder_id: null,
        folder_name: null,
        tags: [],
        description: null,
        metadata: {},
        created_at: asset.created_at,
        updated_at: asset.updated_at
      };
    }) || [];

    return NextResponse.json({
      assets: transformedAssets,
      folders: [],
      storageUsage: [],
      recommendations: [],
      stats: {
        total_assets: transformedAssets.length,
        total_size: transformedAssets.reduce((acc, asset) => acc + (asset.file_size || 0), 0),
        total_clients: 0,
        file_type_distribution: [],
        storage_usage_by_client: []
      }
    });
  } catch (error) {
    console.error("Unexpected error in admin assets API:", error);
    return NextResponse.json({ 
      error: "An unexpected error occurred",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    // For download functionality - get download URL
    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('assetId');
    const action = searchParams.get('action');

    console.log("POST request:", { action, assetId });

    if (action === 'download' && assetId) {
      // Use standardized authentication
      const authError = await requireAdminFromToken(request);
      if (authError) {
        console.error("Auth error:", authError);
        return authError;
      }

      console.log("Auth successful, using service role client...");

      const serviceClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      );

      console.log("Service client created");

      // Get asset details
      console.log("Fetching asset details...");
      const { data: asset, error } = await serviceClient
        .from("project_assets")
        .select("*")
        .eq("id", assetId)
        .single();

      if (error || !asset) {
        console.error("Asset not found:", { assetId, error });
        return NextResponse.json({ error: "Asset not found" }, { status: 404 });
      }

      console.log("Found asset:", { id: asset.id, file_path: asset.file_path, file_name: asset.file_name });

      // Test: Try to list files in the same folder
      console.log("Testing file listing in folder...");
      const folder = asset.file_path.split('/')[0];
      const { data: folderFiles, error: folderError } = await serviceClient.storage
        .from('project-assets')
        .list(folder);

      console.log("Folder listing result:", { folder, folderFiles, folderError });

      // Create authenticated download URL
      console.log("Creating download URL...");
      const { data, error: signedUrlError } = await serviceClient.storage
        .from('project-assets')
        .createSignedUrl(asset.file_path, 3600); // 1 hour expiry

      if (signedUrlError) {
        console.error("Error creating signed URL:", signedUrlError);
        
        // If file not found in storage, it might have been deleted but database record remains
        if (signedUrlError.message?.includes('Object not found') || signedUrlError.message?.includes('404')) {
          console.log("⚠️ File not found in storage, but database record exists");
          return NextResponse.json({
            error: "File not found in storage. The file may have been deleted but the database record still exists.",
            details: "The asset record exists in the database but the actual file is missing from storage.",
            asset: {
              id: asset.id,
              file_name: asset.file_name,
              file_path: asset.file_path
            }
          }, { status: 404 });
        }
        
        return NextResponse.json({
          error: `Failed to create download URL: ${signedUrlError.message}`
        }, { status: 500 });
      }

      if (data && data.signedUrl) {
        console.log("✅ Signed URL created successfully");
        return NextResponse.json({
          success: true,
          downloadUrl: data.signedUrl,
          fileName: asset.file_name || asset.file_path?.split('/').pop() || 'download'
        });
      }

      // Fallback: Try to create a download endpoint that serves the file
      console.log("Creating proxy download endpoint...");
      const downloadUrl = `/api/admin/assets/download?file=${encodeURIComponent(asset.file_path)}&name=${encodeURIComponent(asset.file_name || 'download')}`;

      return NextResponse.json({
        success: true,
        downloadUrl: downloadUrl,
        fileName: asset.file_name || asset.file_path?.split('/').pop() || 'download'
      });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Unexpected error in POST admin assets API:", {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({
      error: "An unexpected error occurred",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    // Use standardized authentication
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const assetId = searchParams.get('id');

    if (!assetId) {
      console.error("❌ DELETE request missing asset ID");
      return NextResponse.json({ error: "Asset ID is required" }, { status: 400 });
    }

    console.log("🗑️ Starting asset deletion:", { assetId });

    // Force use service role client to bypass RLS (consistent with GET method)
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("❌ SUPABASE_SERVICE_ROLE_KEY not found in environment");
      return NextResponse.json({ error: "Service role key not configured" }, { status: 500 });
    }

    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    console.log("🔧 Using service role client for deletion");

    // First get the asset details to find the file path
    console.log("🔍 Fetching asset details for deletion...");
    const { data: asset, error: fetchError } = await serviceClient
      .from("project_assets")
      .select("file_path, file_name, user_id")
      .eq("id", assetId)
      .single();

    if (fetchError) {
      console.error("❌ Error fetching asset for deletion:", { assetId, fetchError });
      return NextResponse.json({ 
        error: "Asset not found", 
        details: fetchError.message 
      }, { status: 404 });
    }

    if (!asset) {
      console.error("❌ Asset not found:", { assetId });
      return NextResponse.json({ error: "Asset not found" }, { status: 404 });
    }

    console.log("✅ Found asset for deletion:", { 
      id: assetId, 
      file_path: asset.file_path, 
      file_name: asset.file_name 
    });

    // Delete from storage if file_path exists
    if (asset.file_path) {
      console.log("🗑️ Deleting file from storage:", asset.file_path);
      const { error: storageError } = await serviceClient.storage
        .from("project-assets")
        .remove([asset.file_path]);

      if (storageError) {
        console.error("⚠️ Error deleting file from storage:", storageError);
        // Continue with database deletion even if storage deletion fails
        // Log the error but don't fail the operation
      } else {
        console.log("✅ File deleted from storage successfully");
      }
    } else {
      console.log("⚠️ No file_path found for asset, skipping storage deletion");
    }

    // Delete from database
    console.log("🗑️ Deleting asset from database...");
    const { error: deleteError } = await serviceClient
      .from("project_assets")
      .delete()
      .eq("id", assetId);

    if (deleteError) {
      console.error("❌ Error deleting asset from database:", deleteError);
      return NextResponse.json({ 
        error: "Failed to delete asset from database", 
        details: deleteError.message 
      }, { status: 500 });
    }

    console.log("✅ Asset deleted successfully from database");
    
    return NextResponse.json({
      success: true,
      message: "Asset deleted successfully",
      deletedAsset: {
        id: assetId,
        file_name: asset.file_name,
        file_path: asset.file_path
      }
    });
  } catch (error) {
    console.error("❌ Unexpected error in delete asset API:", {
      error: error,
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    return NextResponse.json({
      error: "An unexpected error occurred",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
