import { revalidatePath } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get the path to revalidate from the query
    const { searchParams } = new URL(request.url);
    const path = searchParams.get('path');

    if (!path) {
      return NextResponse.json(
        { success: false, message: 'Path parameter is required' },
        { status: 400 }
      );
    }

    // Revalidate the provided path
    revalidatePath(path);
    
    console.log(`[Revalidation] Successfully revalidated path: ${path}`);
    
    return NextResponse.json({
      success: true,
      message: `Successfully revalidated path: ${path}`,
      revalidated: true,
      timestamp: Date.now()
    });
  } catch (error) {
    console.error('Error during revalidation:', error);
    return NextResponse.json(
      { success: false, message: 'Failed to revalidate path' },
      { status: 500 }
    );
  }
}
