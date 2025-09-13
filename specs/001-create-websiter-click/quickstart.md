# Quickstart for websiter.click

This guide explains how to set up and run the project locally.

## Prerequisites

- Node.js (v20.x)
- npm
- Supabase account
- Stripe account

## Setup

1. **Clone the repository**

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   - Create a `.env.local` file in the root of the project.
   - Add your Supabase and Stripe API keys:
     ```
     NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
     NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
     STRIPE_SECRET_KEY=your-stripe-secret-key
     ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open the application**
   - Open [http://localhost:3000](http://localhost:3000) in your browser.
