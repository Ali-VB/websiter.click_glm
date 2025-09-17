# Manual Testing Guide for websiter.click

This guide provides step-by-step instructions for manually testing the websiter.click application, covering client flow, admin sign-in/sign-up, dashboard access, and project creation.

## Prerequisites

Before testing, ensure you have:
- Access to the application at the deployed URL or local development environment
- Test email accounts for client and admin roles
- Supabase database access for verifying data
- Browser developer tools for debugging

## 1. Client Flow Testing

### 1.1 Landing Page Testing

1. **Navigate to the home page**
   - Verify the page loads correctly
   - Check all navigation links (Features, How It Works, Pricing, Contact)
   - Verify the "Get Started" button redirects to `/onboarding`
   - Verify the "Log In" button redirects to `/login`
   - Verify the "Sign Up" button redirects to `/signup`

2. **Test responsive design**
   - Test on desktop, tablet, and mobile viewports
   - Verify all elements display properly and are accessible

### 1.2 Client Sign-up Testing

1. **Navigate to `/signup`**
   - Verify the sign-up form loads correctly
   - Check all form fields (Full Name, Email, Password, Confirm Password)

2. **Test form validation**
   - Submit the form without filling any fields - verify validation errors
   - Enter an invalid email format - verify email validation error
   - Enter a password less than 8 characters - verify password length error
   - Enter mismatched passwords - verify password match error

3. **Test successful sign-up**
   - Fill all fields with valid data
   - Submit the form
   - Verify success message appears
   - Verify redirection to login page after 3 seconds

4. **Test email verification**
   - Check the test email inbox for verification email
   - Click the verification link
   - Verify account is verified (try logging in)

### 1.3 Client Login Testing

1. **Navigate to `/login`**
   - Verify the login form loads correctly
   - Check all form fields (Email, Password)

2. **Test form validation**
   - Submit the form without filling any fields - verify validation errors
   - Enter an invalid email format - verify email validation error

3. **Test login with unverified account**
   - Try to login with an account that hasn't been verified
   - Verify error message about email verification
   - Test "Resend Verification Email" functionality

4. **Test successful login**
   - Enter valid credentials for a verified account
   - Submit the form
   - Verify redirection to `/dashboard`

5. **Test invalid credentials**
   - Enter incorrect password
   - Verify "Invalid email or password" error message
   - Enter non-existent email
   - Verify "Invalid email or password" error message

### 1.4 Client Dashboard Testing

1. **Navigate to `/dashboard` (after login)**
   - Verify the dashboard loads correctly
   - Check all navigation tabs (Projects, Timeline, Assets, Support, Account, Invoices)

2. **Test Projects tab**
   - Verify project statistics display correctly
   - Check project status overview
   - Test "New Project" button redirects to `/onboarding`
   - If projects exist, verify they display in the table
   - Test "View" button for each project

3. **Test Timeline tab**
   - Verify project timeline displays correctly
   - Check project status indicators
   - Verify timeline events show for each project

4. **Test Assets tab**
   - Verify asset upload component displays
   - If no projects exist, verify message about creating a project first
   - If projects exist, test asset upload functionality

5. **Test Support tab**
   - Verify support ticket statistics display
   - Check ticket filters
   - Test "New Ticket" button
   - If tickets exist, verify they display in the list

6. **Test Account tab**
   - Verify account settings display
   - Check profile information section
   - Test password management section
   - Check notification preferences
   - Verify security settings
   - Check danger zone section

7. **Test Invoices tab**
   - Verify invoice list displays
   - If no invoices exist, verify appropriate message
   - If invoices exist, verify they display in the table
   - Test "Pay Now" button for pending invoices
   - Test "View Details" button for each invoice
   - Test "Download PDF" button

### 1.5 Project Creation Testing (Onboarding)

1. **Navigate to `/onboarding`**
   - Verify the onboarding form loads correctly
   - Check step indicator at the top

2. **Test Step 1: Package Selection**
   - Verify all package options display
   - Test selecting each package
   - Verify price updates based on selection
   - Test "Next" button with and without selection

3. **Test Step 2: Additional Features**
   - Verify all add-on options display
   - Test selecting/deselecting add-ons
   - Verify price updates based on selections
   - Test "Next" and "Previous" buttons

4. **Test Step 3: Website Inspiration**
   - Verify design style options
   - Test selecting a design style
   - Test entering reference websites
   - Verify color scheme options
   - Test selecting a color scheme
   - Verify layout preference options
   - Test selecting a layout preference
   - Test form validation for required fields
   - Test "Next" and "Previous" buttons

5. **Test Step 4: Domain & Hosting**
   - Verify domain options
   - Test selecting a domain option
   - Verify hosting options
   - Test selecting a hosting option
   - Test form validation for required fields
   - Test "Next" and "Previous" buttons

6. **Test Step 5: Maintenance & Support**
   - Verify maintenance plan options
   - Test selecting a maintenance plan
   - Test form validation for required fields
   - Test "Next" and "Previous" buttons

7. **Test Step 6: Account Creation**
   - Verify account creation form
   - Test form validation for all fields
   - Test password confirmation matching
   - Verify project summary displays
   - Test "Previous" button
   - Test "Create Project" button with valid data

8. **Test Project Submission**
   - Submit the completed onboarding form
   - Verify loading state during submission
   - Verify redirection to dashboard after successful creation
   - Verify new project appears in the dashboard

## 2. Admin Sign-in/Sign-up Testing

### 2.1 Admin Sign-up

1. **Navigate to `/signup`**
   - Fill the sign-up form with admin details
   - After successful sign-up, manually update the user's role to 'admin' in the Supabase database
   - Verify the account has admin privileges

### 2.2 Admin Login

1. **Navigate to `/login`**
   - Enter admin credentials
   - Verify successful login
   - Verify redirection to admin dashboard (if implemented) or client dashboard
   - Test accessing admin routes directly (e.g., `/admin/projects`)

### 2.3 Admin Dashboard Testing

1. **Navigate to `/admin/projects`**
   - Verify the admin projects page loads correctly
   - Check sidebar navigation
   - Verify project filters work correctly
   - Test project list display
   - Test "View Details" button for projects

2. **Test other admin sections**
   - Navigate to `/admin/clients` - verify client management
   - Navigate to `/admin/invoices` - verify invoice management
   - Navigate to `/admin/support` - verify support ticket management
   - Navigate to `/admin/contacts` - verify contact submissions
   - Navigate to `/admin/notifications` - verify broadcast notifications
   - Navigate to `/admin/system` - verify system administration

## 3. Cross-Functional Testing

### 3.1 Email Verification Flow

1. **Test verification email**
   - Sign up as a new user
   - Check email for verification link
   - Click verification link
   - Verify account is now verified
   - Test login with verified account

2. **Test resend verification**
   - Try to login with unverified account
   - Click "Resend Verification Email"
   - Check email for new verification link
   - Click verification link
   - Verify account is now verified

### 3.2 Password Management

1. **Test password reset**
   - Navigate to login page
   - Click "Forgot your password?" link
   - Enter email address
   - Check email for reset link
   - Follow reset link and set new password
   - Verify login with new password works

### 3.3 Session Management

1. **Test session persistence**
   - Login as a user
   - Close browser
   - Reopen browser and navigate to dashboard
   - Verify user is still logged in

2. **Test logout**
   - Login as a user
   - Click "Log Out" button
   - Verify redirection to home page
   - Try to access dashboard directly - verify redirect to login

### 3.4 Role-Based Access

1. **Test admin access**
   - Login as admin
   - Access admin routes - verify access
   - Access client routes - verify access

2. **Test client access**
   - Login as client
   - Access client routes - verify access
   - Try to access admin routes - verify access denied

### 3.5 Error Handling

1. **Test 404 pages**
   - Navigate to non-existent routes
   - Verify appropriate 404 page displays

2. **Test API error handling**
   - Use browser dev tools to monitor API calls
   - Trigger API errors (e.g., invalid data submission)
   - Verify appropriate error messages display

## 4. Data Validation

### 4.1 Database Verification

After completing tests, verify data in Supabase:

1. **Check clients table**
   - Verify new client records are created correctly
   - Check role field is set properly

2. **Check projects table**
   - Verify new project records are created correctly
   - Check all fields are populated with expected data

3. **Check invoices table**
   - Verify invoice records are created when expected
   - Check invoice amounts and status

### 4.2 Form Data Validation

1. **Test input sanitization**
   - Try submitting forms with HTML/JavaScript in text fields
   - Verify data is sanitized properly

2. **Test field length limits**
   - Try submitting data that exceeds field limits
   - Verify appropriate validation errors

## 5. Performance Testing

1. **Test page load times**
   - Use browser dev tools to measure load times
   - Verify all pages load within acceptable timeframes

2. **Test form submission**
   - Time form submissions
   - Verify responses are received within acceptable timeframes

## 6. Browser Compatibility

Test the application in multiple browsers:
- Chrome
- Firefox
- Safari
- Edge

Verify consistent functionality and appearance across all browsers.

## 7. Mobile Responsiveness

Test the application on various mobile devices and screen sizes:
- Smartphones (iOS and Android)
- Tablets
- Small screens

Verify all elements are accessible and functional on mobile devices.

## 8. Accessibility Testing

1. **Test keyboard navigation**
   - Navigate through the site using only keyboard
   - Verify all interactive elements are accessible

2. **Test screen reader compatibility**
   - Use a screen reader to navigate the site
   - Verify all content is properly announced

3. **Test color contrast**
   - Verify text has sufficient contrast against backgrounds
   - Check color-coded information has non-color alternatives

## 9. Security Testing

1. **Test XSS prevention**
   - Try submitting forms with potential XSS vectors
   - Verify scripts are not executed

2. **Test CSRF protection**
   - Verify forms include CSRF tokens
   - Test form submissions without tokens

3. **Test session security**
   - Verify session cookies have appropriate flags
   - Test session expiration

## 10. Reporting Issues

When documenting issues found during testing, include:
1. Clear description of the issue
2. Steps to reproduce
3. Expected behavior
4. Actual behavior
5. Screenshots or recordings if applicable
6. Browser/device information
7. Error messages from console or network requests

## Test Checklist

- [ ] Landing page loads correctly
- [ ] Navigation links work properly
- [ ] Client sign-up works with valid data
- [ ] Client sign-up validation works correctly
- [ ] Email verification process works
- [ ] Client login works with valid credentials
- [ ] Client login validation works correctly
- [ ] Client dashboard loads and displays correctly
- [ ] All dashboard tabs function properly
- [ ] Project creation (onboarding) works end-to-end
- [ ] Admin sign-up and login work
- [ ] Admin dashboard and sections function properly
- [ ] Role-based access control works
- [ ] Error handling works correctly
- [ ] Data is properly saved to database
- [ ] Application works across different browsers
- [ ] Application is responsive on mobile devices
- [ ] Accessibility features work correctly
- [ ] Security measures are in place and working