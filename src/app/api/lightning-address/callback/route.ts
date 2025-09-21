import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

const PHOENIXD_BASE_URL = process.env.NEXT_PUBLIC_PHOENIXD_URL || 'http://localhost:9740';
const PHOENIXD_USERNAME = process.env.NEXT_PUBLIC_PHOENIXD_USERNAME || 'phoenix';
const PHOENIXD_PASSWORD = process.env.NEXT_PUBLIC_PHOENIXD_PASSWORD || '';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const amount = searchParams.get('amount');
    const comment = searchParams.get('comment');
    const nostr = searchParams.get('nostr');

    // Validate required parameters
    if (!amount) {
      return NextResponse.json(
        { status: 'ERROR', reason: 'Missing amount parameter' },
        { status: 400 }
      );
    }

    const amountMsat = parseInt(amount);
    if (isNaN(amountMsat) || amountMsat < 1000 || amountMsat > 100000000) {
      return NextResponse.json(
        { status: 'ERROR', reason: 'Invalid amount. Must be between 1000 and 100000000 millisats' },
        { status: 400 }
      );
    }

    // Generate unique external ID for tracking
    const externalId = crypto.randomBytes(16).toString('hex');

    // Create invoice through PhoenixD
    const phoenixResponse = await fetch(`${PHOENIXD_BASE_URL}/createinvoice`, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${Buffer.from(`${PHOENIXD_USERNAME}:${PHOENIXD_PASSWORD}`).toString('base64')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        amountMsat,
        description: comment ? `Lightning Address payment: ${comment}` : 'Lightning Address payment',
        externalId,
        expirySeconds: 3600 // 1 hour expiry
      })
    });

    if (!phoenixResponse.ok) {
      console.error('PhoenixD create invoice failed:', await phoenixResponse.text());
      return NextResponse.json(
        { status: 'ERROR', reason: 'Failed to create invoice' },
        { status: 500 }
      );
    }

    const invoice = await phoenixResponse.json();

    // LNURL-pay callback response
    const callbackResponse = {
      status: 'OK',
      pr: invoice.serialized, // Lightning invoice (BOLT11)
      routes: [],
      successAction: {
        tag: 'message',
        message: 'Payment sent successfully! Thank you for using Lightning Address.'
      }
    };

    return NextResponse.json(callbackResponse, {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET',
        'Access-Control-Allow-Headers': 'Content-Type'
      }
    });

  } catch (error: any) {
    console.error('Lightning Address callback error:', error);
    return NextResponse.json(
      { status: 'ERROR', reason: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  // Handle POST requests the same way as GET for LNURL-pay compatibility
  return GET(request);
}