# Supabase RLS Authentication Fix Guide

## Problem Summary
Supabase Row Level Security (RLS) policies were silently blocking writes from API routes, causing notification action buttons to appear to work but changes not persisting after page reload.

## Root Cause
The issue was caused by improper authentication context in server-side Supabase clients used in API routes. When API routes manually extracted bearer tokens and called `supabase.auth.getUser(token)` for verification, they were using the generic `supabase` client instance for database operations. This client didn't have the proper session context established for RLS policies, so when RLS policies checked `auth.uid()`, it returned NULL and the policies correctly denied the operations.

## Symptoms
- API calls return 200 OK success status
- Database operations (UPDATE/DELETE) silently fail to modify any rows
- Changes appear to work in UI due to local state updates
- Changes don't persist after page reload
- RLS policies are syntactically correct but failing due to client authentication issue

## The Fix
### Key Change: Use `createServerClient(token)` instead of generic `supabase` client

**Before (Broken):**
```typescript
import { supabase } from '@/lib/supabase';

// Manual token extraction and verification
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

// Database operations use generic client (NO SESSION CONTEXT)
const { error } = await supabase
  .from('notifications')
  .delete()
  .eq('id', notificationId)
  .eq('client_id', user.id); // Redundant due to RLS
```

**After (Fixed):**
```typescript
import { createServerClient } from '@/lib/supabase';

// Create authenticated server client with proper session context
const supabase = createServerClient(token);
const { data: { user }, error: authError } = await supabase.auth.getUser(token);

// Database operations use authenticated client (PROPER SESSION CONTEXT)
const { error } = await supabase
  .from('notifications')
  .delete()
  .eq('id', notificationId); // RLS policy handles user access
```

## Implementation Steps

### 1. Update All API Routes
For each API route that needs database access with RLS:

1. Change import: `import { supabase }` → `import { createServerClient }`
2. After token extraction: `const supabase = createServerClient(token);`
3. Remove redundant `.eq('client_id', user.id)` filters where RLS handles access control
4. Update auth verification to use the authenticated client

### 2. Files Modified (Notifications Example)
```
src/app/api/notifications/
├── [id]/route.ts
├── [id]/dismiss/route.ts
├── [id]/read/route.ts
├── [id]/unread/route.ts
├── delete-all/route.ts
├── mark-all-read/route.ts
├── read-all/route.ts
├── unread-all/route.ts
└── route.ts
```

### 3. Consistent Pattern for All API Routes
```typescript
export async function POST/DELETE/GET(request: NextRequest) {
  try {
    // 1. Extract and validate auth header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    const token = authHeader.substring(7);

    // 2. Create authenticated server client
    const supabase = createServerClient(token);

    // 3. Verify user with authenticated client
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json(
        { success: false, message: 'Authentication required' },
        { status: 401 }
      );
    }

    // 4. Perform database operations (RLS policies handle access control)
    const { data, error } = await supabase
      .from('table_name')
      .update({ /* fields */ })
      .eq('id', id); // No need for client_id filter with proper RLS

    // 5. Handle response
    if (error) {
      console.error('Operation error:', error);
      return NextResponse.json(
        { success: false, message: 'Operation failed' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Operation successful',
      data
    });

  } catch (error) {
    console.error('API error:', error);
    return NextResponse.json(
      { success: false, message: 'An error occurred' },
      { status: 500 }
    );
  }
}
```

## Why This Works

### The Key Insight
`createServerClient(token)` creates a Supabase client with the proper Authorization header and establishes the session context that RLS policies need. When RLS policies check `auth.uid()`, they now get the actual user ID instead of NULL.

### RLS Policy Example
```sql
CREATE POLICY "Users can manage their own notifications" ON notifications
    FOR ALL TO authenticated
    USING (client_id = auth.uid())
    WITH CHECK (client_id = auth.uid());
```

With the proper authenticated client:
- `auth.uid()` returns the actual user ID
- Policy correctly allows/denies operations based on ownership
- No need for redundant `.eq('client_id', user.id)` in application code

## Applicable Tables

This same issue likely affects any table with RLS policies that check `auth.uid()`:

- `clients` table
- `projects` table  
- `support_tickets` table
- Any other table with user-specific RLS policies

## Migration Strategy for Other Tables

1. **Identify affected API routes**: Look for routes that use the generic `supabase` client
2. **Apply the same pattern**: Use `createServerClient(token)` instead
3. **Update RLS policies**: Ensure policies use `auth.uid()` correctly
4. **Test thoroughly**: Verify operations persist after page reload
5. **Remove redundant filters**: Clean up unnecessary `.eq('client_id', user.id)` calls

## Important Notes

### Avoid Service Role Client Abuse
The main notifications route was using `createServiceRoleClient()` to bypass RLS entirely. This is not recommended:

- ❌ Bypasses security policies
- ❌ Makes application logic responsible for access control
- ❌ Defeats the purpose of RLS

### Dependencies
The fix uses the existing `createServerClient` function in `/lib/supabase.ts`. No additional packages needed.

### Failed Alternative (For Reference)
A migration to `@supabase/ssr` was attempted but caused runtime errors:
```
Error: cookies() should be awaited before using its value
```
This approach was abandoned in favor of the minimal fix using existing infrastructure.

## Testing Checklist

After applying this fix to other tables:

- [ ] API operations return 200 OK
- [ ] Database changes persist after page reload
- [ ] Users can only access their own data
- [ ] Console shows no RLS policy violations
- [ ] Error handling works correctly
- [ ] Authentication still works properly

## Quick Reference

| Issue | Symptom | Fix |
|-------|---------|-----|
| RLS blocks writes silently | 200 OK but no DB changes | Use `createServerClient(token)` |
| Generic client used | `auth.uid()` returns NULL | Create authenticated client |
| Redundant filtering | `.eq('client_id', user.id)` everywhere | Let RLS handle access control |

---

**Created**: October 3, 2025  
**Issue**: Supabase RLS policies silently blocking writes from API routes  
**Solution**: Use `createServerClient(token)` for proper authentication context
