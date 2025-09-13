# API Contracts for websiter.click

This document outlines the API endpoints for the application.

## Auth

- `POST /api/auth/signup`: Create a new user account.
- `POST /api/auth/login`: Log in a user.
- `POST /api/auth/logout`: Log out a user.

## Onboarding

- `POST /api/onboarding`: Submit the onboarding form and create a new project.

## Invoices

- `GET /api/invoices`: Get all invoices for the logged-in client.
- `GET /api/admin/invoices`: Get all invoices for the admin.
- `PUT /api/admin/invoices/:id`: Update an invoice (for admin approval).

## Stripe

- `POST /api/stripe/checkout-session`: Create a Stripe checkout session for an invoice.
- `POST /api/stripe/webhook`: Handle Stripe webhook events.

## Notifications

- `GET /api/notifications`: Get all notifications for the logged-in client.
