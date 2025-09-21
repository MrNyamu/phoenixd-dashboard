import { NextRequest, NextResponse } from 'next/server';

const PHOENIXD_BASE_URL = process.env.NEXT_PUBLIC_PHOENIXD_URL || 'http://localhost:9740';
const PHOENIXD_USERNAME = process.env.NEXT_PUBLIC_PHOENIXD_USERNAME || 'phoenix';
const PHOENIXD_PASSWORD = process.env.NEXT_PUBLIC_PHOENIXD_PASSWORD || 'your-phoenix-password';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  try {
    const path = resolvedParams.path.join('/');
    const url = `${PHOENIXD_BASE_URL}/${path}`;

    console.log(`🚀 Proxying GET request to: ${url}`);

    const auth = Buffer.from(`${PHOENIXD_USERNAME}:${PHOENIXD_PASSWORD}`).toString('base64');

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`❌ PhoenixD API Error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        {
          error: `PhoenixD API Error: ${response.status} ${response.statusText}`,
          details: await response.text()
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ PhoenixD API Success: /${path}`);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ PhoenixD Proxy Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to PhoenixD',
        details: error.message,
        phoenixdUrl: PHOENIXD_BASE_URL,
        username: PHOENIXD_USERNAME,
        passwordSet: !!PHOENIXD_PASSWORD
      },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const resolvedParams = await params;
  try {
    const path = resolvedParams.path.join('/');
    const url = `${PHOENIXD_BASE_URL}/${path}`;

    console.log(`🚀 Proxying POST request to: ${url}`);

    const body = await request.text();
    const auth = Buffer.from(`${PHOENIXD_USERNAME}:${PHOENIXD_PASSWORD}`).toString('base64');

    // Determine content type based on the request
    const contentType = request.headers.get('content-type') || 'application/json';

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': contentType,
      },
      body: body || undefined,
    });

    if (!response.ok) {
      console.error(`❌ PhoenixD API Error: ${response.status} ${response.statusText}`);
      return NextResponse.json(
        {
          error: `PhoenixD API Error: ${response.status} ${response.statusText}`,
          details: await response.text()
        },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log(`✅ PhoenixD API Success: /${path}`);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ PhoenixD Proxy Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to connect to PhoenixD',
        details: error.message
      },
      { status: 500 }
    );
  }
}