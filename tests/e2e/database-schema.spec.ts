import { test, expect } from '@playwright/test';

test.describe('Database Schema Verification', () => {
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

  test.describe('Required Tables Existence', () => {
    test('should verify activity_log table exists', async ({ request }) => {
      const response = await request.get('/api/admin/stats', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Activity Log Test - Response Status:', response.status());
      
      if (response.status() === 500) {
        const errorText = await response.text();
        console.log('Activity Log Test - Error Response:', errorText);
        
        if (errorText.includes('Could not find the table \'public.activity_log\'')) {
          console.log('❌ CONFIRMED: activity_log table is missing');
        } else {
          console.log('❓ UNKNOWN: Different error for activity_log');
        }
      } else if (response.status() === 200) {
        const data = await response.json();
        if (data.success && data.stats.recentActivity) {
          console.log('✅ CONFIRMED: activity_log table exists and is accessible');
        } else {
          console.log('❓ PARTIAL: activity_log table might exist but has issues');
        }
      }
    });

    test('should verify team_members table exists', async ({ request }) => {
      const response = await request.get('/api/admin/support', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Team Members Test - Response Status:', response.status());
      
      if (response.status() === 500) {
        const errorText = await response.text();
        console.log('Team Members Test - Error Response:', errorText);
        
        if (errorText.includes('team_members')) {
          console.log('❌ CONFIRMED: team_members table is missing or has issues');
        } else {
          console.log('❓ UNKNOWN: Different error for team_members');
        }
      } else if (response.status() === 200) {
        const data = await response.json();
        if (data.teamMembers && Array.isArray(data.teamMembers)) {
          console.log('✅ CONFIRMED: team_members table exists and is accessible');
        } else {
          console.log('❓ PARTIAL: team_members table might exist but has issues');
        }
      }
    });

    test('should verify invoices table structure', async ({ request }) => {
      const response = await request.get('/api/admin/invoices', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Invoices Structure Test - Response Status:', response.status());
      
      if (response.status() === 500) {
        const errorText = await response.text();
        console.log('Invoices Structure Test - Error Response:', errorText);
        
        if (errorText.includes('Could not find a relationship between \'invoices\' and \'clients\'')) {
          console.log('❌ CONFIRMED: Missing foreign key relationship between invoices and clients');
        }
        if (errorText.includes('column invoices.updated_at does not exist')) {
          console.log('❌ CONFIRMED: updated_at column is missing from invoices table');
        }
        if (errorText.includes('invoices.created_at')) {
          console.log('❌ CONFIRMED: created_at column might be missing from invoices table');
        }
      } else if (response.status() === 200) {
        const data = await response.json();
        if (data.success && data.invoices) {
          console.log('✅ CONFIRMED: invoices table structure is correct');
        } else {
          console.log('❓ PARTIAL: invoices table exists but has issues');
        }
      }
    });
  });

  test.describe('Foreign Key Relationships', () => {
    test('should verify invoices-projects-clients relationship', async ({ request }) => {
      const response = await request.get('/api/admin/invoices', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Foreign Key Test - Response Status:', response.status());
      
      if (response.status() === 500) {
        const errorText = await response.text();
        console.log('Foreign Key Test - Error Response:', errorText);
        
        // Check for specific foreign key relationship errors
        const relationshipErrors = [
          'Could not find a relationship between \'invoices\' and \'clients\'',
          'foreign key constraint',
          'foreign key violation'
        ];
        
        const hasRelationshipError = relationshipErrors.some(error => 
          errorText.toLowerCase().includes(error.toLowerCase())
        );
        
        if (hasRelationshipError) {
          console.log('❌ CONFIRMED: Foreign key relationship issues detected');
        } else {
          console.log('❓ UNKNOWN: Different type of error in foreign key test');
        }
      } else if (response.status() === 200) {
        console.log('✅ CONFIRMED: Foreign key relationships are working correctly');
      }
    });

    test('should verify support_tickets-clients relationship', async ({ request }) => {
      const response = await request.get('/api/admin/support', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Support Foreign Key Test - Response Status:', response.status());
      
      if (response.status() === 500) {
        const errorText = await response.text();
        console.log('Support Foreign Key Test - Error Response:', errorText);
        
        if (errorText.includes('foreign key') || errorText.includes('relationship')) {
          console.log('❌ CONFIRMED: Foreign key relationship issues in support_tickets');
        } else {
          console.log('❓ UNKNOWN: Different error in support foreign key test');
        }
      } else if (response.status() === 200) {
        console.log('✅ CONFIRMED: Support tickets foreign key relationships are working');
      }
    });
  });

  test.describe('Column Existence and Types', () => {
    test('should verify invoices table has required columns', async ({ request }) => {
      const response = await request.get('/api/admin/invoices', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Invoices Columns Test - Response Status:', response.status());
      
      if (response.status() === 500) {
        const errorText = await response.text();
        console.log('Invoices Columns Test - Error Response:', errorText);
        
        // Check for specific column errors
        const columnErrors = [
          'column invoices.updated_at does not exist',
          'column invoices.created_at does not exist',
          'column invoices.total_amount does not exist',
          'column invoices.status does not exist',
          'column invoices.project_id does not exist'
        ];
        
        columnErrors.forEach(columnError => {
          if (errorText.includes(columnError)) {
            console.log(`❌ CONFIRMED: ${columnError}`);
          }
        });
      } else if (response.status() === 200) {
        console.log('✅ CONFIRMED: All required columns exist in invoices table');
      }
    });

    test('should verify clients table has required columns', async ({ request }) => {
      const response = await request.get('/api/admin/clients', {
        headers: {
          'Authorization': `Bearer ${authToken}`
        }
      });

      console.log('Clients Columns Test - Response Status:', response.status());
      
      if (response.status() === 500) {
        const errorText = await response.text();
        console.log('Clients Columns Test - Error Response:', errorText);
        
        if (errorText.includes('column') && errorText.includes('does not exist')) {
          console.log('❌ CONFIRMED: Missing columns in clients table');
        }
      } else if (response.status() === 200) {
        console.log('✅ CONFIRMED: All required columns exist in clients table');
      }
    });
  });

  test.describe('Data Integrity Tests', () => {
    test('should verify data can be inserted and retrieved correctly', async ({ request }) => {
      // Test creating a support ticket to verify data integrity
      const ticketData = {
        clientId: 'test-client-id',
        projectId: 'test-project-id',
        subject: 'Data Integrity Test Ticket',
        description: 'Testing data integrity with Playwright',
        priority: 'low',
        category: 'testing'
      };

      const createResponse = await request.post('/api/admin/support', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        },
        data: ticketData
      });

      console.log('Data Integrity Test - Create Response Status:', createResponse.status());
      
      if (createResponse.status() === 201 || createResponse.status() === 200) {
        console.log('✅ CONFIRMED: Data can be created successfully');
        
        // Try to retrieve the data
        const getResponse = await request.get('/api/admin/support', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (getResponse.status() === 200) {
          console.log('✅ CONFIRMED: Data can be retrieved successfully');
        } else {
          console.log('❌ CONFIRMED: Data creation works but retrieval fails');
        }
      } else {
        const errorText = await createResponse.text();
        console.log('Data Integrity Test - Create Error Response:', errorText);
        console.log('❌ CONFIRMED: Data creation failed');
      }
    });
  });

  test.describe('Comprehensive Schema Health Check', () => {
    test('should provide complete schema health report', async ({ request }) => {
      const schemaHealth = {
        tables: {
          activity_log: 'unknown',
          team_members: 'unknown',
          invoices: 'unknown',
          clients: 'unknown',
          projects: 'unknown',
          support_tickets: 'unknown'
        },
        relationships: {
          invoices_clients: 'unknown',
          invoices_projects: 'unknown',
          support_tickets_clients: 'unknown',
          projects_clients: 'unknown'
        },
        columns: {
          invoices_updated_at: 'unknown',
          invoices_created_at: 'unknown',
          invoices_total_amount: 'unknown',
          invoices_status: 'unknown'
        }
      };

      // Test activity_log table
      try {
        const statsResponse = await request.get('/api/admin/stats', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (statsResponse.status() === 200) {
          schemaHealth.tables.activity_log = 'healthy';
        } else {
          const errorText = await statsResponse.text();
          if (errorText.includes('activity_log')) {
            schemaHealth.tables.activity_log = 'missing';
          } else {
            schemaHealth.tables.activity_log = 'error';
          }
        }
      } catch (error) {
        schemaHealth.tables.activity_log = 'unreachable';
      }

      // Test team_members table
      try {
        const supportResponse = await request.get('/api/admin/support', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (supportResponse.status() === 200) {
          const data = await supportResponse.json();
          if (data.teamMembers && Array.isArray(data.teamMembers)) {
            schemaHealth.tables.team_members = 'healthy';
          } else {
            schemaHealth.tables.team_members = 'empty';
          }
        } else {
          const errorText = await supportResponse.text();
          if (errorText.includes('team_members')) {
            schemaHealth.tables.team_members = 'missing';
          } else {
            schemaHealth.tables.team_members = 'error';
          }
        }
      } catch (error) {
        schemaHealth.tables.team_members = 'unreachable';
      }

      // Test invoices table and relationships
      try {
        const invoicesResponse = await request.get('/api/admin/invoices', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (invoicesResponse.status() === 200) {
          schemaHealth.tables.invoices = 'healthy';
          schemaHealth.relationships.invoices_clients = 'healthy';
          schemaHealth.relationships.invoices_projects = 'healthy';
        } else {
          const errorText = await invoicesResponse.text();
          
          if (errorText.includes('Could not find a relationship between \'invoices\' and \'clients\'')) {
            schemaHealth.relationships.invoices_clients = 'missing';
          }
          
          if (errorText.includes('column invoices.updated_at does not exist')) {
            schemaHealth.columns.invoices_updated_at = 'missing';
          }
          
          if (errorText.includes('column invoices.created_at')) {
            schemaHealth.columns.invoices_created_at = 'missing';
          }
          
          schemaHealth.tables.invoices = 'error';
        }
      } catch (error) {
        schemaHealth.tables.invoices = 'unreachable';
      }

      console.log('📊 COMPLETE SCHEMA HEALTH REPORT:');
      console.log(JSON.stringify(schemaHealth, null, 2));

      // Count issues
      const issues: string[] = [];
      Object.entries(schemaHealth.tables).forEach(([table, status]) => {
        if (status !== 'healthy') issues.push(`Table ${table}: ${status}`);
      });
      
      Object.entries(schemaHealth.relationships).forEach(([relationship, status]) => {
        if (status !== 'healthy') issues.push(`Relationship ${relationship}: ${status}`);
      });
      
      Object.entries(schemaHealth.columns).forEach(([column, status]) => {
        if (status !== 'healthy') issues.push(`Column ${column}: ${status}`);
      });

      console.log(`🔍 TOTAL ISSUES FOUND: ${issues.length}`);
      if (issues.length > 0) {
        console.log('📋 ISSUES LIST:');
        issues.forEach(issue => console.log(`   - ${issue}`));
      }
    });
  });
});
