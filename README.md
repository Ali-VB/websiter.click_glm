# websiter.click

A modern web application for ordering and managing custom website development projects. Built with Next.js, Supabase, and Stripe.

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
  - [Running the Application](#running-the-application)
- [Project Structure](#project-structure)
- [API Endpoints](#api-endpoints)
- [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Project Overview

websiter.click is a comprehensive platform that allows clients to order custom websites through an intuitive onboarding process. The application provides both client-facing and admin interfaces to manage the entire website development lifecycle, from initial order to project completion and ongoing support.

## Key Features

### Client Features
- **Onboarding Wizard**: Step-by-step process for ordering websites with package selection, add-ons, design preferences, domain configuration, and maintenance plans
- **Client Dashboard**: Track project status, upload assets, view invoices, and manage support tickets
- **Asset Management**: Upload and manage project assets with organized storage
- **Billing & Invoices**: View invoice history and download PDF copies
- **Support System**: Create and track support tickets with communication history
- **Account Management**: Update account settings and notification preferences

### Admin Features
- **Project Management**: View and manage all projects with status tracking and detailed information
- **Client Management**: Manage client accounts with internal notes and communication history
- **Invoice Management**: Create, view, and manage invoices with approval workflows
- **Support Ticket System**: Manage and resolve client support tickets
- **Contact Form Inbox**: View and manage public contact form submissions
- **Broadcast Notifications**: Send notifications to clients
- **System Administration**: Monitor system statistics and configure settings

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Payment Processing**: Stripe
- **Testing**: Jest, React Testing Library
- **Development Tools**: ESLint, Prettier

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm, yarn, pnpm, or bun
- Supabase account
- Stripe account

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd websiter.click_glm
   ```

2. Install dependencies:
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

### Environment Variables

Create a `.env.local` file in the root directory with the following environment variables:

```env
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe Configuration
STRIPE_SECRET_KEY=your_stripe_secret_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
```

Replace the placeholder values with your actual Supabase and Stripe credentials.

### Database Setup

1. Create a new project in your Supabase dashboard.
2. Run the SQL schema located in [`supabase/schema.sql`](supabase/schema.sql) in your Supabase SQL editor to set up the required tables.
3. Apply any migrations from the [`supabase/migrations/`](supabase/migrations/) directory if needed.

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

2. Open [http://localhost:3000](http://localhost:3000) in your browser to view the application.

## Project Structure

```
src/
├── app/                    # Next.js app directory
│   ├── api/               # API routes
│   │   ├── admin/         # Admin-specific API endpoints
│   │   ├── auth/          # Authentication endpoints
│   │   ├── assets/        # Asset management endpoints
│   │   ├── contact/       # Contact form endpoints
│   │   ├── invoices/      # Invoice management endpoints
│   │   ├── onboarding/    # Onboarding process endpoints
│   │   ├── projects/      # Project management endpoints
│   │   ├── stripe/        # Stripe integration endpoints
│   │   └── support/       # Support system endpoints
│   ├── admin/             # Admin dashboard pages
│   ├── contact/           # Contact form page
│   ├── dashboard/         # Client dashboard pages
│   ├── login/             # Login page
│   ├── onboarding/        # Onboarding wizard pages
│   └── signup/            # Signup page
├── components/            # Reusable React components
│   ├── ui/                # shadcn/ui components
│   └── AssetUpload.tsx    # Asset upload component
└── lib/                   # Utility libraries and helpers
    ├── auth-helpers.ts    # Authentication helper functions
    ├── middleware.ts      # Request middleware
    ├── storage.ts         # Storage utilities
    ├── stripe.ts          # Stripe integration utilities
    ├── supabase.ts        # Supabase client configuration
    ├── tax.ts             # Tax calculation utilities
    └── utils.ts           # General utility functions
```

## API Endpoints

### Authentication
- `POST /api/auth/login` - User login
- `POST /api/auth/signup` - User registration
- `POST /api/auth/resend-verification` - Resend email verification

### Onboarding
- `POST /api/onboarding` - Submit onboarding data

### Invoices
- `GET /api/invoices` - Get client invoices
- `GET /api/admin/invoices` - Get all invoices (admin)
- `PUT /api/admin/invoices/[id]` - Update invoice status (admin)

### Stripe Integration
- `POST /api/stripe/checkout-session` - Create Stripe checkout session
- `POST /api/stripe/webhook` - Handle Stripe webhooks

### Support
- `GET /api/support` - Get client support tickets
- `POST /api/support` - Create support ticket
- `POST /api/support/[id]/replies` - Add reply to support ticket

### Admin
- `GET /api/admin/invoices` - Get all invoices
- `PUT /api/admin/invoices/[id]` - Update invoice
- `GET /api/admin/support` - Get all support tickets
- `POST /api/admin/support` - Create support ticket (admin)
- `PUT /api/admin/support/[id]` - Update support ticket (admin)

## Testing

The project uses Jest and React Testing Library for testing.

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with coverage
npm run test:coverage
```

### Test Structure

- Unit tests are located alongside the files they test (e.g., `utils.test.ts`)
- Integration tests are located in `src/__tests__/integration/`
- Component tests are located in `src/components/__tests__/`

## Deployment

### Building for Production

```bash
npm run build
```

### Starting Production Server

```bash
npm start
```

### Environment Variables for Production

Ensure all environment variables are set in your production environment. Do not commit sensitive information to version control.

### Deployment Platforms

The application can be deployed to any platform that supports Next.js applications, such as:

- Vercel (recommended)
- Netlify
- AWS Amplify
- DigitalOcean App Platform

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Commit Convention

This project follows conventional commit messages:

- `feat:` A new feature
- `fix:` A bug fix
- `docs:` Documentation only changes
- `style:` Changes that do not affect the meaning of the code
- `refactor:` A code change that neither fixes a bug nor adds a feature
- `test:` Adding missing tests or correcting existing tests
- `chore:` Changes to the build process or auxiliary tools

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
