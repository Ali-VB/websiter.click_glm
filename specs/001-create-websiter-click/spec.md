# Feature Specification: websiter.click Ordering Platform

**Feature Branch**: `001-create-websiter-click`  
**Created**: 2025-09-13  
**Status**: Draft  
**Input**: User description: "A self-service ordering platform for professional websites named websiter.click."

---

## Overview

websiter.click is a self-service ordering platform for professional websites. Clients can choose a package, select add-ons, and submit a request online without meetings. The system automatically generates a draft invoice but requires developer review and approval before payment.

The platform is designed for freelance developers who want to package their services into predictable products while keeping full control over scope, pricing, and approvals. Clients benefit from a clear, guided onboarding wizard and a lightweight dashboard for tracking progress.

**Tagline**: "Website, Simplified"

**Value Proposition**: Order your professional website like you’d order anything online: simple, transparent, and entirely on your terms.

---

## User Scenarios & Testing

### Primary User Story
A potential client visits websiter.click, starts the onboarding wizard, and selects a website package and several add-ons. They provide their design preferences and contact information. At the final step, they create an account and receive a confirmation email. After verifying their email, they can access a dashboard where they see their project status and a draft invoice marked as "Pending Developer Approval". The developer is notified, reviews the invoice, makes an adjustment, and approves it. The client then receives a notification, sees a "Pay Invoice" button on their dashboard, and completes the payment via Stripe. The project status is updated to "Active".

### Acceptance Scenarios
1. **Given** a client is on the landing page, **When** they complete the onboarding wizard, **Then** a project is created with a draft invoice and payment is not requested.
2. **Given** a project is pending developer approval, **When** the developer edits and approves the invoice, **Then** the client is notified and presented with an option to pay.
3. **Given** an invoice has been approved, **When** the client pays the invoice via Stripe, **Then** the project status is updated to "Active" and a payment confirmation is sent.
4. **Given** a user requests data deletion, **When** the GDPR endpoint is triggered, **Then** their personal data is verifiably deleted or anonymized.
5. **Given** any page on the platform, **When** viewed on a mobile device, **Then** the layout is responsive and all interactive elements are tappable.

### Edge Cases
- What happens if a user abandons the onboarding wizard midway through? (The data should be discarded).
- How does the system handle a failed payment from Stripe? (The invoice should remain "approved" but "unpaid").
- What happens if a user tries to access the dashboard without verifying their email? (They should be prompted to verify their email).

---

## Requirements

### Functional Requirements
- **FR-001**: System MUST allow clients to select a base website package from a predefined list.
- **FR-002**: System MUST allow clients to select one or more optional add-ons.
- **FR-003**: System MUST allow clients to input design preferences, including inspiration URLs and notes.
- **FR-004**: System MUST allow clients to specify their domain and hosting preferences.
- **FR-005**: System MUST allow clients to choose a monthly maintenance plan.
- **FR-006**: System MUST require clients to create an account (Name, Email, Password) to finalize an order.
- **FR-007**: System MUST send an email verification link upon account creation.
- **FR-008**: System MUST automatically generate a draft invoice based on the client's selections.
- **FR-009**: The draft invoice status MUST be `submitted_for_review` and not be payable by the client.
- **FR-010**: System MUST provide an admin portal for developers to review, edit, and approve invoices.
- **FR-011**: System MUST notify the client via email and in-app notification when their invoice is approved.
- **FR-012**: The client dashboard MUST display a "Pay Invoice" button only after developer approval.
- **FR-013**: System MUST process payments in CAD using Stripe.
- **FR-014**: System MUST update invoice status based on Stripe webhooks (e.g., `draft` → `approved` → `paid`).
- **FR-015**: System MUST provide a client dashboard to view project status and invoices.
- **FR-016**: System MUST provide an admin-facing inbox to view and reply to messages from the public contact form.
- **FR-017**: System MUST allow admins to broadcast notifications to all clients.

### Non-Functional Requirements
- **NFR-001**: All prices MUST be displayed in CAD.
- **NFR-002**: The application MUST be deployable on Netlify.
- **NFR-003**: The UI MUST be built with shadcn/ui and Tailwind CSS, following the specified design guidance.
- **NFR-004**: The system MUST use a PostgreSQL database (e.g., Supabase).
- **NFR-005**: Authentication MUST support email/password.
- **NFR-006**: The system MUST provide GDPR-compliant endpoints for data deletion, anonymization, and export.
- **NFR-007**: The architecture MUST support localization for English and French.
- **NFR-008**: All server-side secrets MUST be managed securely and not exposed to the client.
- **NFR-009**: Access to admin routes MUST be restricted by role-based access control.

### Key Entities
- **Client**: Represents a user who can place an order. Attributes: Name, Email, Phone (optional).
- **Project**: Represents a website order. Attributes: Status (e.g., `submitted_for_review`, `active`), Website Type, Design Preferences, Add-ons, Domain Info, Maintenance Plan. Linked to a Client and an Invoice.
- **Invoice**: Represents the financial record of an order. Attributes: Status (e.g., `draft`, `approved`, `paid`), Line Items (base package, add-ons, maintenance), Total Amount (CAD). Linked to a Project.
- **Notification**: Represents a message for a user. Attributes: Message Content, Read Status, Target User.

---

## MVP Scope
- Public Landing Page
- Client Onboarding Wizard (Steps A–F)
- Draft Invoice generation (visible to developer only)
- Admin review, edit, and approval of invoices
- Client Dashboard showing project status and invoices
- Stripe payments (CAD) after invoice approval
- In-app and email notifications for key events (onboarding, approval, payment)
- Public contact form feeding into an admin-only inbox
- Supabase for Auth (email/password) and Database
- Deployment on Netlify

---

## Review & Acceptance Checklist
*GATE: Automated checks run during main() execution*

### Content Quality
- [ ] No implementation details (languages, frameworks, APIs)
- [ ] Focused on user value and business needs
- [ ] Written for non-technical stakeholders
- [ ] All mandatory sections completed

### Requirement Completeness
- [ ] No [NEEDS CLARIFICATION] markers remain
- [ ] Requirements are testable and unambiguous  
- [ ] Success criteria are measurable
- [ ] Scope is clearly bounded
- [ ] Dependencies and assumptions identified

---
