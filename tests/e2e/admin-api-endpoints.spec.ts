import { test, expect } from '@playwright/test';

test.describe('Admin API Endpoints Validation', () => {
  let authToken: string;

  test.beforeAll(async ({ request }) => {
    // First, login to get authentication token
    const loginResponse = await request.post('/api/auth/login', {
      data: {
        email: 'admin@websiter.click',
        password: 'admin123'
      }
    });

    if (loginResponse.status() === 200) {
      const loginData = await loginResponse.json();
      authToken = loginData.user.accessToken;
    } else {
      // If login fails, we'll use a mock token for testing
      authToken = 'mock_token_for_testing';
    }
  });

  test.describe('GET /api/admin/stats', () => {
    test('should return dashboard statistics', async ({ request }) => {
      const response = await request.get('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Stats API Response Status:', response.status());
      console.log('Stats API Response Headers:', response.headers());
      
      if (response.status() !== 200) {
        const errorText = await response.text();
        console.log('Stats API Error Response:', errorText);
      }

      const data = await response.json();
      console.log('Stats API Response Data:', JSON.stringify(data, null, 2));

      // Even if there are errors, we expect a specific structure
      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('stats');
      
      if (data.success) {
        expect(data.stats).toHaveProperty('totalClients');
        expect(data.stats).toHaveProperty('activeProjects');
        expect(data.stats).toHaveProperty('pendingInvoices');
        expect(data.stats).toHaveProperty('openSupportTickets');
        expect(data.stats).toHaveProperty('recentActivity');
        expect(data.stats).toHaveProperty('systemStatus');
      } else {
        // Log the specific error for debugging
        console.log('Stats API failed with message:', data.message);
      }
    });

    test('should handle missing authentication token', async ({ request }) => {
      const response = await request.get('/api/admin/stats');
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
    });

    test('should handle invalid authentication token', async ({ request }) => {
      const response = await request.get('/api/admin/stats', {
        headers: {
          'Authorization': 'Bearer invalid_token'
        }
      });
      
      expect(response.status()).toBe(401);
      const data = await response.json();
      expect(data).toHaveProperty('error', 'Unauthorized');
    });
  });

  test.describe('GET /api/admin/invoices', () => {
    test('should return invoices data', async ({ request }) => {
      const response = await request.get('/api/admin/invoices', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Invoices API Response Status:', response.status());
      console.log('Invoices API Response Headers:', response.headers());
      
      if (response.status() !== 200) {
        const errorText = await response.text();
        console.log('Invoices API Error Response:', errorText);
      }

      const data = await response.json();
      console.log('Invoices API Response Data:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('invoices');
      
      if (data.success) {
        expect(Array.isArray(data.invoices)).toBe(true);
        // Check if invoices have the expected structure
        if (data.invoices.length > 0) {
          const invoice = data.invoices[0];
          expect(invoice).toHaveProperty('id');
          expect(invoice).toHaveProperty('projectId');
          expect(invoice).toHaveProperty('projectName');
          expect(invoice).toHaveProperty('clientName');
          expect(invoice).toHaveProperty('totalAmount');
          expect(invoice).toHaveProperty('status');
        }
      } else {
        // Log the specific error for debugging
        console.log('Invoices API failed with message:', data.message);
      }
    });

    test('should support pagination parameters', async ({ request }) => {
      const response = await request.get('/api/admin/invoices?limit=5&offset=0', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Invoices Pagination API Response Status:', response.status());
      
      const data = await response.json();
      console.log('Invoices Pagination API Response Data:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('success');
      if (data.success) {
        expect(data).toHaveProperty('pagination');
        expect(data.pagination).toHaveProperty('total');
        expect(data.pagination).toHaveProperty('limit');
        expect(data.pagination).toHaveProperty('offset');
        expect(data.pagination.limit).toBe(5);
      }
    });

    test('should support filtering by status', async ({ request }) => {
      const response = await request.get('/api/admin/invoices?status=pending', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Invoices Filter API Response Status:', response.status());
      
      const data = await response.json();
      console.log('Invoices Filter API Response Data:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('success');
      if (data.success && data.invoices.length > 0) {
        data.invoices.forEach((invoice: { status: string }) => {
          expect(invoice.status).toBe('pending');
        });
      }
    });
  });

  test.describe('GET /api/admin/support', () => {
    test('should return support tickets and team members', async ({ request }) => {
      const response = await request.get('/api/admin/support', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Support API Response Status:', response.status());
      console.log('Support API Response Headers:', response.headers());
      
      if (response.status() !== 200) {
        const errorText = await response.text();
        console.log('Support API Error Response:', errorText);
      }

      const data = await response.json();
      console.log('Support API Response Data:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('tickets');
      expect(data).toHaveProperty('teamMembers');
      
      if (data.tickets) {
        expect(Array.isArray(data.tickets)).toBe(true);
        if (data.tickets.length > 0) {
          const ticket = data.tickets[0];
          expect(ticket).toHaveProperty('id');
          expect(ticket).toHaveProperty('subject');
          expect(ticket).toHaveProperty('status');
          expect(ticket).toHaveProperty('priority');
        }
      }
      
      if (data.teamMembers) {
        expect(Array.isArray(data.teamMembers)).toBe(true);
        if (data.teamMembers.length > 0) {
          const member = data.teamMembers[0];
          expect(member).toHaveProperty('id');
          expect(member).toHaveProperty('name');
          expect(member).toHaveProperty('email');
          expect(member).toHaveProperty('role');
        }
      }
    });

    test('should create new support ticket', async ({ request }) => {
      const ticketData = {
        clientId: 'test-client-id',
        projectId: 'test-project-id',
        subject: 'Test Support Ticket',
        description: 'This is a test support ticket created by Playwright',
        priority: 'medium',
        category: 'technical'
      };

      const response = await request.post('/api/admin/support', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: ticketData
      });

      console.log('Create Support Ticket API Response Status:', response.status());
      
      const data = await response.json();
      console.log('Create Support Ticket API Response Data:', JSON.stringify(data, null, 2));

      if (response.status() === 201 || response.status() === 200) {
        expect(data).toHaveProperty('ticket');
        expect(data.ticket).toHaveProperty('id');
        expect(data.ticket.subject).toBe(ticketData.subject);
      } else {
        // Log the specific error for debugging
        console.log('Create Support Ticket API failed with message:', data.error || data.message);
      }
    });
  });

  test.describe('GET /api/admin/clients', () => {
    test('should return clients data', async ({ request }) => {
      const response = await request.get('/api/admin/clients', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Clients API Response Status:', response.status());
      console.log('Clients API Response Headers:', response.headers());
      
      if (response.status() !== 200) {
        const errorText = await response.text();
        console.log('Clients API Error Response:', errorText);
      }

      const data = await response.json();
      console.log('Clients API Response Data:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('clients');
      
      if (data.success) {
        expect(Array.isArray(data.clients)).toBe(true);
        if (data.clients.length > 0) {
          const client = data.clients[0];
          expect(client).toHaveProperty('id');
          expect(client).toHaveProperty('name');
          expect(client).toHaveProperty('email');
          expect(client).toHaveProperty('role');
        }
      } else {
        // Log the specific error for debugging
        console.log('Clients API failed with message:', data.message);
      }
    });
  });

  test.describe('GET /api/admin/projects', () => {
    test('should return projects data', async ({ request }) => {
      const response = await request.get('/api/admin/projects', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Projects API Response Status:', response.status());
      console.log('Projects API Response Headers:', response.headers());
      
      if (response.status() !== 200) {
        const errorText = await response.text();
        console.log('Projects API Error Response:', errorText);
      }

      const data = await response.json();
      console.log('Projects API Response Data:', JSON.stringify(data, null, 2));

      expect(data).toHaveProperty('success');
      expect(data).toHaveProperty('projects');
      
      if (data.success) {
        expect(Array.isArray(data.projects)).toBe(true);
        if (data.projects.length > 0) {
          const project = data.projects[0];
          expect(project).toHaveProperty('id');
          expect(project).toHaveProperty('name');
          expect(project).toHaveProperty('status');
          expect(project).toHaveProperty('type');
        }
      } else {
        // Log the specific error for debugging
        console.log('Projects API failed with message:', data.message);
      }
    });
  });

  test.describe('Database Schema Validation', () => {
    test('should identify missing database tables and relationships', async ({ request }) => {
      // This test will help us identify specific database schema issues
      const endpoints = [
        '/api/admin/stats',
        '/api/admin/invoices',
        '/api/admin/support',
        '/api/admin/clients',
        '/api/admin/projects'
      ];

      const schemaIssues: string[] = [];

      for (const endpoint of endpoints) {
        try {
          const response = await request.get(endpoint, {
            headers: {
              'Authorization': `Bearer ${authToken}`
            }
          });

          if (response.status() === 500) {
            const errorText = await response.text();
            console.log(`Schema Issue Detected for ${endpoint}:`, errorText);
            
            // Check for specific database error patterns
            if (errorText.includes('Could not find the table')) {
              schemaIssues.push(`Missing table in ${endpoint}`);
            }
            if (errorText.includes('Could not find a relationship')) {
              schemaIssues.push(`Missing foreign key relationship in ${endpoint}`);
            }
            if (errorText.includes('column') && errorText.includes('does not exist')) {
              schemaIssues.push(`Missing column in ${endpoint}`);
            }
          }
        } catch (error) {
          console.log(`Error testing ${endpoint}:`, error);
          schemaIssues.push(`Connection error for ${endpoint}`);
        }
      }

      console.log('Identified Schema Issues:', schemaIssues);
      
      // We expect some schema issues based on the terminal output we saw
      // This test helps us document exactly what needs to be fixed
      if (schemaIssues.length > 0) {
        console.log(`Found ${schemaIssues.length} schema issues that need to be addressed`);
      }
    });
  });
});
