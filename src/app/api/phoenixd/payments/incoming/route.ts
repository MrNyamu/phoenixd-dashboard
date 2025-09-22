import { NextRequest, NextResponse } from 'next/server';

const PHOENIXD_BASE_URL = process.env.NEXT_PUBLIC_PHOENIXD_URL || 'http://localhost:9740';
const PHOENIXD_USERNAME = process.env.NEXT_PUBLIC_PHOENIXD_USERNAME || 'phoenix';
const PHOENIXD_PASSWORD = process.env.NEXT_PUBLIC_PHOENIXD_PASSWORD || 'your-phoenix-password';

export async function GET(request: NextRequest) {
  try {
    const url = `${PHOENIXD_BASE_URL}/payments/incoming`;

    console.log(`🚀 Fetching incoming payments from: ${url}`);

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
    console.log(`✅ PhoenixD Incoming Payments Success: ${data.length} payments found`);

    return NextResponse.json(data);

  } catch (error: any) {
    console.error('❌ PhoenixD Incoming Payments Error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch incoming payments from PhoenixD',
        details: error.message,
        phoenixdUrl: PHOENIXD_BASE_URL,
        username: PHOENIXD_USERNAME,
        passwordSet: !!PHOENIXD_PASSWORD
      },
      { status: 500 }
    );
  }
}