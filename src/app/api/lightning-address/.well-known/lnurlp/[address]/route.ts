import { NextRequest, NextResponse } from 'next/server';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ address: string }> }
) {
  try {
    const resolvedParams = await params;
    const { address } = resolvedParams;

    // Validate Lightning Address format (user@domain)
    const addressRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!addressRegex.test(address)) {
      return NextResponse.json(
        { status: 'ERROR', reason: 'Invalid Lightning Address format' },
        { status: 400 }
      );
    }

    const [username, domain] = address.split('@');
    const baseUrl = `${request.nextUrl.protocol}//${request.nextUrl.host}`;

    // LNURL-pay response according to specification
    const lnurlpayResponse = {
      callback: `${baseUrl}/api/lightning-address/callback`,
      maxSendable: 100000000, // 100k sats in millisats
      minSendable: 1000, // 1 sat in millisats
      metadata: JSON.stringify([
        ['text/plain', `Payment to ${address}`],
        ['text/long-desc', `Lightning payment to Lightning Address ${address}`]
      ]),
      tag: 'payRequest',
      allowsNostr: false,
      commentAllowed: 144
    };

    return NextResponse.json(lnurlpayResponse, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error: any) {
    console.error('Lightning Address LNURL-pay error:', error);
    return NextResponse.json(
      { status: 'ERROR', reason: 'Internal server error' },
      { status: 500 }
    );
  }
}