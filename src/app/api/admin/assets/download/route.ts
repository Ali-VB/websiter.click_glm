import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { requireAdminFromToken } from '@/lib/auth-helpers';

export async function GET(request: NextRequest) {
  try {
    // Use standardized authentication
    const authError = await requireAdminFromToken(request);
    if (authError) {
      return authError;
    }

    const { searchParams } = new URL(request.url);
    const filePath = searchParams.get('file');
    const fileName = searchParams.get('name');

    if (!filePath) {
      return NextResponse.json({ error: "File path is required" }, { status: 400 });
    }

    console.log("Download request:", { filePath, fileName });

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

    // Get the file from storage
    const { data, error } = await serviceClient.storage
      .from('project-assets')
      .download(filePath);

    if (error) {
      console.error("Error downloading file:", error);
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    if (!data) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    // Get file info to determine content type
    const fileExtension = filePath.split('.').pop()?.toLowerCase();
    const contentType = getContentType(fileExtension);

    // Convert blob to array buffer
    const arrayBuffer = await data.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Return the file with proper headers
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': `attachment; filename="${encodeURIComponent(fileName || 'download')}"`,
        'Cache-Control': 'no-cache',
      },
    });

  } catch (error) {
    console.error("Unexpected error in download:", error);
    return NextResponse.json({ error: "An unexpected error occurred" }, { status: 500 });
  }
}

function getContentType(extension?: string): string {
  const contentTypes: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
    'pdf': 'application/pdf',
    'doc': 'application/msword',
    'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'txt': 'text/plain',
    'zip': 'application/zip',
    'rar': 'application/x-rar-compressed',
  };

  return contentTypes[extension || ''] || 'application/octet-stream';
}