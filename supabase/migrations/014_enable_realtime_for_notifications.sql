-- Migration: 014_enable_realtime_for_notifications.sql
-- Description: Enable Realtime for notifications table

-- Enable Realtime for notifications table
ALTER TABLE notifications REPLICA IDENTITY FULL;

-- Enable Realtime publication for the notifications table
-- This allows Supabase Realtime to subscribe to changes on this table
ALTER PUBLICATION supabase_realtime ADD TABLE notifications;