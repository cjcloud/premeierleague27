import { NextRequest, NextResponse } from 'next/server';
import { PL_API_BASE, PL_API_HEADERS } from '@/lib/api';

export async function GET(request: NextRequest) {
  // Extract the path and query parameters from the request
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint') || 'standings';
  // Always use live=false as requested
  const live = 'false';

  try {
    // Make the request to the Premier League API from the server side.
    // Season is centralised in src/lib/api.ts (PL_API_BASE).
    const apiUrl = `${PL_API_BASE}/${endpoint}?live=${live}`;
    console.log('Requesting Premier League API URL:', apiUrl);

    const apiResponse = await fetch(
      apiUrl,
      {
        headers: PL_API_HEADERS,
        cache: 'no-store',
      }
    );

    if (!apiResponse.ok) {
      return NextResponse.json(
        { error: `Premier League API returned ${apiResponse.status}` },
        { status: apiResponse.status }
      );
    }

    const data = await apiResponse.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching from Premier League API:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Premier League API' },
      { status: 500 }
    );
  }
}
