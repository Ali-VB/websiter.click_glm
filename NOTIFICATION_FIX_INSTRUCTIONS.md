# Fix Notification Buttons - Simple Instructions

## Problem
The notification "mark as read" (✓) and "delete" (X) buttons are not working due to database RLS (Row Level Security) policies blocking access.

## Solution
Run the `fix-rls-policies.sql` script in your Supabase SQL Editor.

## Step-by-Step Instructions

### 1. Open Supabase Dashboard
- Go to your Supabase project dashboard
- Navigate to the **SQL Editor** tab

### 2. Run the Fix Script
- Copy the contents of `fix-rls-policies.sql` file
- Paste it into the SQL Editor
- Click **Run** to execute the script

### 3. Verify the Fix
The script will:
- ✅ Drop old problematic RLS policies
- ✅ Create new proper RLS policies using `client_id = auth.uid()`
- ✅ Grant correct permissions
- ✅ Test the policies with your actual notification IDs
- ✅ Show the current policies for verification

### 4. Test the Buttons
After running the script:
1. Go to your notifications page: `http://localhost:3000/dashboard/notifications`
2. Click the **checkmark icon** (✓) to mark a notification as read
3. Click the **X icon** to delete a notification
4. Both should work instantly without page refresh

## Expected Results
- No more 404 errors in console
- Buttons work immediately
- UI updates without page refresh
- Notifications can be marked as read and deleted

## What the Script Does
1. **Drops all existing policies** to remove conflicts
2. **Creates new policies** that properly match `client_id` with `auth.uid()`
3. **Adds DELETE policy** (was missing before)
4. **Grants proper permissions** to authenticated users
5. **Tests the fix** with your actual notification data

## If Issues Persist
If the buttons still don't work after running the script:
1. Check the SQL Editor output for any errors
2. Refresh your browser page
3. Try the buttons again

The fix should resolve the notification functionality completely.
