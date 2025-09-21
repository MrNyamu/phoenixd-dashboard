import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const payload = await request.text();
    const signature = request.headers.get('x-phoenixd-signature') || '';

    // Get webhook secret from environment
    const webhookSecret = process.env.PHOENIXD_WEBHOOK_SECRET;

    if (!webhookSecret) {
      console.error('PHOENIXD_WEBHOOK_SECRET not configured');
      return NextResponse.json(
        { error: 'Webhook secret not configured' },
        { status: 500 }
      );
    }

    // Verify webhook authenticity
    const expectedSignature = crypto
      .createHmac('sha256', webhookSecret)
      .update(payload)
      .digest('hex');

    const providedSignature = signature.replace('sha256=', '');

    if (expectedSignature !== providedSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      );
    }

    // Parse and process webhook payload
    const event = JSON.parse(payload);

    console.log('🔔 PhoenixD Webhook Event Received:', {
      type: event.type || 'unknown',
      timestamp: new Date().toISOString(),
      data: event
    });

    // Handle different event types
    switch (event.type) {
      case 'payment_received':
        console.log(`💰 Payment Received: ${event.amount_msat / 1000} sats`);
        break;
      case 'payment_sent':
        console.log(`💸 Payment Sent: ${event.amount_msat / 1000} sats`);
        break;
      case 'channel_opened':
        console.log(`🔗 Channel Opened: ${event.channel_id}`);
        break;
      case 'channel_closed':
        console.log(`❌ Channel Closed: ${event.channel_id}`);
        break;
      case 'balance_updated':
        console.log(`📊 Balance Updated: ${event.balance_sat} sats`);
        break;
      default:
        console.log(`📬 Unknown Event Type: ${event.type}`);
    }

    // Here you could:
    // 1. Update a database
    // 2. Send notifications to connected clients via WebSocket
    // 3. Trigger other application logic
    // 4. Cache the latest state

    return NextResponse.json({
      status: 'success',
      message: 'Webhook processed successfully'
    });

  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Failed to process webhook' },
      { status: 500 }
    );
  }
}

// Handle webhook registration/configuration
export async function GET() {
  return NextResponse.json({
    status: 'ready',
    message: 'PhoenixD webhook endpoint is ready',
    endpoint: '/api/webhook',
    methods: ['POST'],
    authentication: 'HMAC-SHA256 with webhook secret'
  });
}