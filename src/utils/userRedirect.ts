interface UserPermissions {
  gratitude_journaling_enabled: boolean;
  talk_buddy_enabled: boolean;
  thought_buddy_enabled: boolean;
}

export const getRedirectPath = (permissions: UserPermissions, isAdmin: boolean): string => {
  // Admins always go to the main dashboard
  if (isAdmin) {
    return '/';
  }

  // Check which features the user has access to and redirect to the first available one
  if (permissions.gratitude_journaling_enabled) {
    return '/';  // Main dashboard with gratitude journaling
  }
  
  if (permissions.thought_buddy_enabled) {
    return '/cbt-assistant';
  }
  
  if (permissions.talk_buddy_enabled) {
    return '/talk-buddy';
  }
  
  // If no features are enabled, redirect to main page (they'll see access restricted messages)
  return '/';
};