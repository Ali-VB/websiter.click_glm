import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { AssetStorage } from '@/lib/storage';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.substring(7);

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;
    const assetType = formData.get('assetType') as string;
    const description = formData.get('description') as string;

    if (!file || !projectId || !assetType) {
      return NextResponse.json({ error: 'Missing required fields: file, projectId, or assetType' }, { status: 400 });
    }

    console.log("📤 Starting asset upload:", {
      projectId,
      fileName: file.name,
      fileSize: file.size,
      assetType,
      description,
      userId: user.id
    });

    const result = await AssetStorage.uploadAsset(
      {
        projectId,
        file,
        assetType,
        description,
        userId: user.id
      },
      userSupabase
    );

    console.log("📤 Asset upload result:", result);

    if (!result.success) {
      console.error("❌ Asset upload failed:", result.error);
      return NextResponse.json({ error: result.error }, { status: 400 });
    }

    return NextResponse.json({
      message: 'File uploaded successfully',
      asset: result.asset
    });
  } catch (error) {
    console.error('Unexpected error in asset upload:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized: Missing or invalid token' }, { status: 401 });
    }
    const token = authHeader.substring(7);

    const userSupabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    });

    const { data: { user }, error: authError } = await userSupabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized: Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const projectId = searchParams.get('projectId');

    let result;
    if (projectId) {
      // Get assets for specific project
      result = await AssetStorage.getProjectAssets(projectId, userSupabase);
    } else {
      // Get all assets for the user
      result = await AssetStorage.getUserAssets(user.id, userSupabase);
    }

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: 500 });
    }

    return NextResponse.json({
      assets: result.assets
    });
  } catch (error) {
    console.error('Unexpected error in asset fetch:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
