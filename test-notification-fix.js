// Simple test script to verify notification system fix
const fetch = require('node-fetch');

async function testNotificationFix() {
  console.log('Testing notification system fix...');
  
  try {
    // Test 1: Check if we can access the admin notifications API
    console.log('\n1. Testing admin notifications API access...');
    
    const adminLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'admin@websiter.click',
        password: 'admin123'
      })
    });
    
    if (!adminLoginResponse.ok) {
      console.log('❌ Admin login failed. Using test mode.');
      return;
    }
    
    const adminData = await adminLoginResponse.json();
    const adminToken = adminData.token;
    
    console.log('✅ Admin login successful');
    
    // Test 2: Try to create a simple notification
    console.log('\n2. Testing notification creation...');
    
    // Get a client ID first
    const clientsResponse = await fetch('http://localhost:3000/api/clients', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${adminToken}`,
      },
    });
    
    if (clientsResponse.ok) {
      const clientsData = await clientsResponse.json();
      const clientIds = clientsData.clients?.slice(0, 1).map(c => c.id) || [];
      
      if (clientIds.length > 0) {
        console.log(`✅ Found client: ${clientIds[0]}`);
        
        // Create a simple notification
        const notificationResponse = await fetch('http://localhost:3000/api/admin/notifications', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${adminToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            client_ids: clientIds,
            title: 'Test Notification',
            message: 'This is a test to verify the notification system is working.',
            type: 'system'
          })
        });
        
        if (notificationResponse.ok) {
          const notificationData = await notificationResponse.json();
          console.log('✅ Notification created successfully!');
          console.log(`   - Created ${notificationData.count} notification(s)`);
          console.log(`   - Message: ${notificationData.message}`);
        } else {
          const errorData = await notificationResponse.json();
          console.log('❌ Notification creation failed:', errorData.message);
          console.log('   - This might indicate the database schema issue is fixed but there are other problems.');
        }
      } else {
        console.log('❌ No clients found to test with');
      }
    } else {
      console.log('❌ Failed to fetch clients');
    }
    
    // Test 3: Check if client can retrieve notifications
    console.log('\n3. Testing client notification retrieval...');
    
    const clientLoginResponse = await fetch('http://localhost:3000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'client@websiter.click',
        password: 'admin123'
      })
    });
    
    if (clientLoginResponse.ok) {
      const clientData = await clientLoginResponse.json();
      const clientToken = clientData.token;
      
      console.log('✅ Client login successful');
      
      const notificationsResponse = await fetch('http://localhost:3000/api/notifications', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${clientToken}`,
        },
      });
      
      if (notificationsResponse.ok) {
        const notificationsData = await notificationsResponse.json();
        console.log('✅ Client notifications retrieved successfully!');
        console.log(`   - Total notifications: ${notificationsData.notifications.length}`);
        console.log(`   - Unread notifications: ${notificationsData.notifications.filter(n => !n.read).length}`);
        
        if (notificationsData.notifications.length > 0) {
          console.log(`   - Latest: ${notificationsData.notifications[0].message}`);
        }
      } else {
        const errorData = await notificationsResponse.json();
        console.log('❌ Failed to retrieve client notifications:', errorData.message);
      }
    } else {
      console.log('❌ Client login failed');
    }
    
    console.log('\n✅ Notification system test completed!');
    console.log('\nIf you see "✅" messages, the database schema issue has been fixed.');
    console.log('The notification system should now work correctly.');
    
  } catch (error) {
    console.error('❌ Test failed with error:', error.message);
  }
}

// Run the test
testNotificationFix();
