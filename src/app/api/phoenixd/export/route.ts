import { NextRequest, NextResponse } from 'next/server';

const PHOENIXD_BASE_URL = process.env.NEXT_PUBLIC_PHOENIXD_URL || 'http://localhost:9740';
const PHOENIXD_USERNAME = process.env.NEXT_PUBLIC_PHOENIXD_USERNAME || 'phoenix';
const PHOENIXD_PASSWORD = process.env.NEXT_PUBLIC_PHOENIXD_PASSWORD || 'your-phoenix-password';

export async function POST(request: NextRequest) {
  try {
    // Parse the form data from the request
    const formData = await request.formData();
    const params = new URLSearchParams();

    // Convert FormData to URLSearchParams for PhoenixD
    formData.forEach((value, key) => {
      params.append(key, value.toString());
    });

    // Make the request to PhoenixD export endpoint
    const response = await fetch(`${PHOENIXD_BASE_URL}/export`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${PHOENIXD_USERNAME}:${PHOENIXD_PASSWORD}`).toString('base64')}`,
      },
      body: params,
    });

    if (!response.ok) {
      // If PhoenixD export fails, return error but don't crash
      console.error('PhoenixD export failed:', response.status, response.statusText);
      return NextResponse.json(
        { error: 'Export endpoint not available', fallback: true },
        { status: 404 }
      );
    }

    // Get the CSV content type and data
    const contentType = response.headers.get('content-type') || 'text/csv';
    const csvData = await response.text();

    // Return the CSV data with proper headers
    return new NextResponse(csvData, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Disposition': 'attachment; filename="phoenix-export.csv"',
      },
    });

  } catch (error) {
    console.error('Export API error:', error);

    // Return error response for client-side fallback
    return NextResponse.json(
      {
        error: 'Export failed',
        message: 'PhoenixD export endpoint not available, use local export',
        fallback: true
      },
      { status: 500 }
    );
  }
}