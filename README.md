# PhoenixD Client

A modern, feature-rich web interface for managing your PhoenixD Lightning Network node. Built with Next.js, TypeScript, and Tailwind CSS, this client provides an intuitive dashboard for monitoring node activity, managing Lightning channels, creating invoices, and handling payments.

## ✨ Features

### 📊 Real-time Dashboard
- **Node Monitoring**: Live statistics including wallet balance, active channels, and total liquidity
- **Channel Management**: View and monitor Lightning channel status with real-time updates
- **Transaction History**: Track recent payments and invoice activity
- **Auto-refresh**: Configurable automatic data refresh for real-time monitoring

### ⚡ Lightning Operations
- **Quick Invoice Creation**: Generate Lightning invoices directly from the dashboard
- **QR Code Integration**: Automatic QR code generation for all invoices with copy/download functionality
- **Payment Management**: Send and receive Lightning payments with full transaction tracking
- **LNURL Support**: Complete LNURL-pay and LNURL-withdraw integration

### 🎨 Modern UI/UX
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Dark/Light Mode**: Full theme support with system preference detection
- **Smooth Animations**: Enhanced user experience with Framer Motion animations
- **Interactive Charts**: Real-time data visualization with Recharts

### 🔐 Security & Performance
- **Type Safety**: Full TypeScript implementation for robust development
- **Real-time Updates**: WebSocket integration for live data synchronization
- **Error Handling**: Comprehensive error states and user feedback
- **Performance Optimized**: Built with Next.js 15 and Turbopack for fast development

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Running PhoenixD instance

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd phoenixd/apps/phoenixd-client
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   ```

3. **Environment Configuration**
   Copy the example environment file and configure your settings:
   ```bash
   cp .env.example .env.local
   ```

   Then edit `.env.local` with your actual PhoenixD configuration:
   ```env
   NEXT_PUBLIC_PHOENIXD_URL=http://localhost:9740
   NEXT_PUBLIC_PHOENIXD_USERNAME=phoenix
   NEXT_PUBLIC_PHOENIXD_PASSWORD=your-actual-phoenixd-password
   PHOENIXD_WEBHOOK_SECRET=your-webhook-secret
   ```

   **Important**: Never commit `.env.local` to version control!

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 Key Features in Detail

### Quick Invoice Creation with QR Codes
The dashboard now includes a streamlined invoice creation widget that:
- ✅ Generates Lightning invoices instantly
- ✅ Creates scannable QR codes automatically
- ✅ Supports both fixed and variable amount invoices
- ✅ Includes copy, download, and share functionality
- ✅ Shows invoice details and expiration times
- ✅ Provides real-time status updates

### Dashboard Components
- **Wallet Balance**: Real-time balance with fee credits display
- **Channel Statistics**: Active channels count and capacity metrics
- **Liquidity Monitoring**: Total inbound/outbound liquidity tracking
- **Recent Activity**: Latest transactions and invoice statuses

### Payment Management
- **Receive Payments**: Create invoices with optional amounts and descriptions
- **Send Payments**: Pay Lightning invoices and BOLT11 payment requests
- **Transaction History**: Complete payment tracking with status updates
- **LNURL Integration**: Support for Lightning addresses and LNURL protocols

## 🛠️ Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, Framer Motion for animations
- **Charts**: Recharts for data visualization
- **QR Codes**: qrcode library for invoice QR generation
- **Icons**: Lucide React for consistent iconography
- **State Management**: Zustand for application state
- **HTTP Client**: Axios for API communication

## 📁 Project Structure

```
src/
├── app/                    # Next.js app directory
├── components/            # React components
│   ├── Dashboard.tsx      # Main dashboard with QR invoice creation
│   ├── QRCodeGenerator.tsx # QR code generation component
│   ├── QRCodeDisplay.tsx  # QR code display with modal
│   ├── ReceivePayment.tsx # Payment reception interface
│   └── ...
├── hooks/                 # Custom React hooks
├── stores/               # Zustand state management
├── lib/                  # Utility functions
└── types/                # TypeScript type definitions
```

## 🔧 Available Scripts

- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build production application
- `npm run start` - Start production server
- `npm run lint` - Run ESLint for code quality
- `npm run type-check` - Run TypeScript type checking
- `npm run format` - Format code with Prettier

## 🐳 Docker Support

The application includes Docker support for easy deployment:

```bash
# Build Docker image
npm run docker:build

# Run container
npm run docker:run
```

## 🌐 API Integration

The client connects to PhoenixD through a proxy API located at `/api/phoenixd/[...path]`. This handles:
- Authentication with PhoenixD
- Request forwarding and response handling
- Error management and logging
- CORS and security headers

## 📊 Monitoring & Analytics

### Real-time Metrics
- Node connectivity status
- Channel state monitoring
- Payment success rates
- Liquidity utilization

### Visual Analytics
- Liquidity trend charts
- Channel distribution pie charts
- Transaction volume graphs
- Historical performance data

## 🔒 Security Considerations

### Environment Variables
- **Never commit sensitive data** like passwords or API keys to version control
- Use `.env.local` for development and environment variables for production
- The `.env.example` file provides a template with explanations

### Sensitive Data Protection
- PhoenixD passwords and webhook secrets are stored in environment variables only
- Lightning address data is excluded from version control
- API credentials are proxy-protected through Next.js API routes

### Best Practices
- Always use HTTPS in production
- Implement proper CORS policies
- Use strong, unique passwords for PhoenixD authentication
- Regular security updates for dependencies
- Input validation and sanitization on all user inputs
- Error boundary implementation to prevent information leakage

### Production Security
- Use a secrets management service for sensitive configuration
- Enable rate limiting on API endpoints
- Monitor for unusual access patterns
- Regular security audits and dependency updates

## 🎨 UI Components

### Reusable Components
- **StatCard**: Animated metric displays
- **QRCodeGenerator**: Full-featured QR code creation
- **AnimatedPresence**: Smooth component transitions
- **LoadingStates**: Consistent loading indicators
- **ErrorBoundaries**: Graceful error handling

## 📱 Responsive Design

The application is fully responsive and optimized for:
- Desktop computers (1920px+)
- Laptops and tablets (768px - 1919px)
- Mobile devices (320px - 767px)

## 🔄 State Management

Uses Zustand for lightweight, efficient state management:
- Phoenix node connection status
- Wallet balance and channel data
- Transaction history
- UI preferences and settings

## 🧪 Development

### Code Quality
- TypeScript for type safety
- ESLint for code linting
- Prettier for code formatting
- Husky for git hooks (if configured)

### Performance
- Next.js optimization features
- Lazy loading for components
- Image optimization
- Bundle analysis tools

## 📄 License

This project is part of the PhoenixD Lightning Network implementation.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

For issues and support:
- Check the GitHub issues
- Review PhoenixD documentation
- Join the Lightning Network community discussions

---

**Note**: This client requires a running PhoenixD instance. Make sure your Phoenix node is properly configured and accessible before using this interface.