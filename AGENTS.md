# Expo HAS CHANGED

Read the exact versioned docs at https://docs.expo.dev/versions/v56.0.0/ before writing any code.

# Famfetti Agents

## Overview
Background services that handle notifications, event reminders, and family group management.

## Agents

### Notification Agent
- **Purpose**: Send push notifications when events are created or updated
- **Trigger**: Event created/updated in Supabase
- **Tech**: Supabase Edge Functions + Expo Notifications

### Reminder Agent
- **Purpose**: Send reminder notifications for upcoming events
- **Trigger**: Scheduled check for events happening soon
- **Tech**: Supabase Scheduled Functions

### Invite Agent
- **Purpose**: Generate and validate invite codes for adding family members to groups
- **Trigger**: User requests to invite family member, member joins with code
- **Tech**: Supabase Edge Functions
- **Actions**:
  - Generate unique invite code
  - Validate code and add member to family group
  - Expire codes after 7 days or after use

## Configuration
- Reminder timing: 1 hour before event
- Retry failed notifications: 3 attempts
- Invite code expiry: 7 days