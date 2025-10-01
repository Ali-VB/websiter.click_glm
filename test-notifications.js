// Simple test script to verify notification system
const fetch = require('node-fetch');

async function testNotifications() {
  console.log('Testing notification system...');
  
  // Test 1: Create a broadcast notification as admin
  console.log('\n1. Testing broadcast notification creation...');
  
  try {
    // First, get an admin token (you'll need to replace this with a real token)
    const adminLoginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@example.com',
        password: 'password123'
      })
    });
    
    if (!adminLoginResponse.ok) {
      console.log('❌ Admin login failed. Skipping broadcast test.');
      return;
    }
    
    const adminData = await adminLoginResponse.json();
    const adminToken = adminData.token;
    
    console.log('✅ Admin login successful');
    
    // Get list of clients to send notification to
    const clientsResponse = await fetch('http://localhost:3001/api/clients', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    
    if (clientsResponse.ok) {
      const clientsData = await clientsResponse.json();
      const clientIds = clientsData.clients?.slice(0, 2).map(c => c.id) || [];
      
      if (clientIds.length > 0) {
        console.log(`✅ Found ${clientIds.length} clients to send notifications to`);
        
        // Send broadcast notification
        const broadcastResponse = await fetch('http://localhost:3001/api/admin/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_ids: clientIds,
            title: 'Test Broadcast Notification',
            message: 'This is a test broadcast notification to verify the system is working.',
            type: 'system'
          })
        });
        
        if (broadcastResponse.ok) {
          const broadcastData = await broadcastResponse.json();
          console.log('✅ Broadcast notification sent successfully');
          console.log(`   - Sent to ${clientIds.length} clients`);
          console.log(`   - Created ${broadcastData.count} notifications`);
        } else {
          const errorData = await broadcastResponse.json();
          console.log('❌ Broadcast notification failed:', errorData.message);
        }
      } else {
        console.log('❌ No clients found to send notifications to');
      }
    } else {
      console.log('❌ Failed to fetch clients list');
    }
    
    // Test 2: Check if notifications appear in client dashboard
    console.log('\n2. Testing client notification retrieval...');
    
    // Login as a client (you'll need to replace with real client credentials)
    const clientLoginResponse = await fetch('http://localhost:3001/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'client@example.com',
        password: 'password123'
      })
    });
    
    if (clientLoginResponse.ok) {
      const clientData = await clientLoginResponse.json();
      const clientToken = clientData.token;
      
      console.log('✅ Client login successful');
      
      // Get client notifications
      const notificationsResponse = await fetch('http://localhost:3001/api/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${clientToken}`,
        },
      });
      
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        console.log('✅ Client notifications retrieved successfully');
        console.log(`   - Total notifications: ${notificationsData.notifications.length}`);
        console.log(`   - Unread notifications: ${notificationsData.notifications.filter(n => !n.read).length}`);
        
        if (notificationsData.notifications.length > 0) {
          console.log('   - Latest notification:', notificationsData.notifications[0].title);
        }
      } else {
        const errorData = await notificationsResponse.json();
        console.log('❌ Failed to retrieve client notifications:', errorData.message);
      }
    } else {
      console.log('❌ Client login failed. Skipping client notification test.');
    }
    
    console.log('\n✅ Notification system test completed!');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testNotifications();
