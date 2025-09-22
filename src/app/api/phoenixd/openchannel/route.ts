import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    // Get form data
    const formData = await request.formData();
    const nodeId = formData.get('nodeId') as string;
    const amountSat = formData.get('amountSat') as string;
    const host = formData.get('host') as string;

    if (!nodeId || !amountSat) {
      return NextResponse.json(
        { error: 'Missing required parameters: nodeId and amountSat' },
        { status: 400 }
      );
    }

    // Get Phoenix configuration
    const phoenixUrl = process.env.NEXT_PUBLIC_PHOENIXD_URL || 'http://localhost:9740';
    const phoenixPassword = process.env.NEXT_PUBLIC_PHOENIXD_PASSWORD || 'fde55dd7d7d6aaff91b4724b619b3ea7d070ecccac4d22d9ea05bc1a3bdf4e61';

    // Prepare the request to PhoenixD
    const phoenixEndpoint = `${phoenixUrl}/openchannel`;
    const requestBody = new URLSearchParams({
      nodeId: nodeId,
      amountSat: amountSat,
      ...(host && { host: host })
    });

    console.log('🚀 Opening channel:', {
      endpoint: phoenixEndpoint,
      nodeId: nodeId.substring(0, 20) + '...',
      amountSat,
      host: host || 'auto-discover'
    });

    // Make request to PhoenixD
    const response = await fetch(phoenixEndpoint, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`:${phoenixPassword}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ PhoenixD channel creation failed:', {
        status: response.status,
        error: errorText
      });

      return NextResponse.json(
        { error: `PhoenixD error: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();

    console.log('✅ Channel creation successful:', {
      nodeId: nodeId.substring(0, 20) + '...',
      amountSat,
      result: result
    });

    return NextResponse.json({
      success: true,
      message: 'Channel creation initiated successfully',
      data: result
    });

  } catch (error: any) {
    console.error('❌ Channel creation API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}