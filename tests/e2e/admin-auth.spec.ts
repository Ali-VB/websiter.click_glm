import { test, expect } from '@playwright/test';

test.describe('Admin Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.clear();
    });
  });

  test('should redirect to login when accessing admin without authentication', async ({ page }) => {
    await page.goto('/admin');
    await expect(page).toHaveURL('/login');
  });

  test('should show admin login form', async ({ page }) => {
    await page.goto('/login');
    await expect(page.locator('h1')).toContainText('Login');
    await expect(page.locator('input[type="email"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button[type="submit"]')).toBeVisible();
  });

  test('should handle invalid login credentials', async ({ page }) => {
    await page.goto('/login');
    
    // Fill in invalid credentials
    await page.fill('input[type="email"]', 'invalid@example.com');
    await page.fill('input[type="password"]', 'wrongpassword');
    await page.click('button[type="submit"]');
    
    // Wait for response and check for error message
    await page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.status() === 500
    );
    
    // Check if error message appears (this might need adjustment based on actual UI)
    await expect(page.locator('text=An error occurred during login')).toBeVisible({ timeout: 10000 });
  });

  test('should successfully login with admin credentials and redirect to admin dashboard', async ({ page }) => {
    await page.goto('/login');
    
    // Intercept login API call to verify it works
    const loginResponse = page.waitForResponse(response => 
      response.url().includes('/api/auth/login') && response.status() === 200
    );
    
      // Fill in admin credentials (these should be valid test credentials)
      await page.fill('input[type="email"]', 'admin@websiter.click');
      await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for successful login response
    const response = await loginResponse;
    const responseData = await response.json();
    expect(responseData.success).toBe(true);
    
    // Verify redirect to admin dashboard
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
    
    // Verify admin dashboard elements are visible
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
    await expect(page.locator('text=Total Clients')).toBeVisible();
    await expect(page.locator('text=Active Projects')).toBeVisible();
    await expect(page.locator('text=Pending Invoices')).toBeVisible();
    await expect(page.locator('text=Support Tickets')).toBeVisible();
  });

  test('should store authentication token in localStorage', async ({ page }) => {
    await page.goto('/login');
    
    // Login with admin credentials
    await page.fill('input[type="email"]', 'admin@websiter.click');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for navigation to admin dashboard
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
    
    // Check if auth token is stored in localStorage
    const authToken = await page.evaluate(() => {
      return localStorage.getItem('supabase.auth.token');
    });
    
    expect(authToken).not.toBeNull();
    if (authToken) {
      const tokenData = JSON.parse(authToken);
      expect(tokenData.access_token).toBeDefined();
    }
  });

  test('should maintain authentication across page refreshes', async ({ page }) => {
    // First login
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@websiter.click');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for admin dashboard
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
    
    // Refresh the page
    await page.reload();
    
    // Should still be on admin dashboard (not redirected to login)
    await expect(page).toHaveURL('/admin');
    await expect(page.locator('h1')).toContainText('Admin Dashboard');
  });

  test('should handle logout correctly', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[type="email"]', 'admin@websiter.click');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for admin dashboard
    await expect(page).toHaveURL('/admin', { timeout: 10000 });
    
    // Click logout button
    await page.click('text=Log Out');
    
    // Should redirect to home page
    await expect(page).toHaveURL('/');
    
    // Try to access admin again - should redirect to login
    await page.goto('/admin');
    await expect(page).toHaveURL('/login');
  });

  test('should handle expired/invalid tokens', async ({ page }) => {
    // Manually set an invalid token
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('supabase.auth.token', JSON.stringify({
        access_token: 'invalid_token',
        refresh_token: 'invalid_refresh',
        expires_at: Date.now() - 1000 // Expired
      }));
    });
    
    // Try to access admin
    await page.goto('/admin');
    
    // Should redirect to login due to invalid token
    await expect(page).toHaveURL('/login');
  });
});
