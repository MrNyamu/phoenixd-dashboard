import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Get Phoenix configuration
    const phoenixUrl = process.env.NEXT_PUBLIC_PHOENIXD_URL || 'http://localhost:9740';
    const phoenixPassword = process.env.NEXT_PUBLIC_PHOENIXD_PASSWORD || 'fde55dd7d7d6aaff91b4724b619b3ea7d070ecccac4d22d9ea05bc1a3bdf4e61';

    console.log('🚀 Proxying GET request to:', `${phoenixUrl}/getinfo`);

    // Make request to PhoenixD - using getinfo since ping doesn't exist
    const response = await fetch(`${phoenixUrl}/getinfo`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${phoenixPassword}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      console.error('❌ PhoenixD API Error:', response.status, response.statusText);
      return NextResponse.json(
        { error: `PhoenixD API Error: ${response.status} ${response.statusText}` },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('✅ PhoenixD API Success: /getinfo (ping equivalent)');

    // Return a simplified ping-like response with dummy node ID
    const dummyNodeId = process.env.NEXT_PUBLIC_DUMMY_NODE_ID || '02ab3c4d5e6f7890123456789abcdef1234567890abcdef1234567890abcdef12';
    return NextResponse.json({
      status: 'ok',
      nodeId: dummyNodeId,
      blockHeight: data.blockHeight,
      version: data.version
    });
  } catch (error: any) {
    console.error('❌ Ping API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}