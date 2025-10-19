import { Capacitor } from '@capacitor/core';

/**
 * Check if microphone permission is granted
 * On web, this will trigger the browser's permission prompt
 * On native, this checks if permission was already granted
 */
export const checkMicrophonePermission = async (): Promise<boolean> => {
  // On web, navigator.mediaDevices.getUserMedia will handle permissions
  if (!Capacitor.isNativePlatform()) {
    return true;
  }

  try {
    // Try to access the microphone - this will trigger native permission dialog
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    stream.getTracks().forEach(track => track.stop()); // Stop immediately after checking
    return true;
  } catch (error) {
    console.error('Microphone permission check failed:', error);
    return false;
  }
};

/**
 * Request microphone permission from the user
 * This will show the native permission dialog if not already granted
 */
export const requestMicrophonePermission = async (): Promise<boolean> => {
  try {
    const hasPermission = await checkMicrophonePermission();
    return hasPermission;
  } catch (error) {
    console.error('Failed to request microphone permission:', error);
    return false;
  }
};

/**
 * Get a user-friendly error message for microphone permission issues
 */
export const getMicrophoneErrorMessage = (error: Error): string => {
  const errorName = error.name;
  
  if (errorName === 'NotAllowedError' || errorName === 'PermissionDeniedError') {
    if (Capacitor.isNativePlatform()) {
      return 'Microphone permission denied. Please enable microphone access in your device settings under Painted Minds → Permissions.';
    }
    return 'Microphone permission denied. Please allow microphone access when prompted by your browser.';
  }
  
  if (errorName === 'NotFoundError') {
    return 'No microphone found on your device. Please check your device settings or try using a different device.';
  }
  
  if (errorName === 'NotReadableError') {
    return 'Microphone is already in use by another application. Please close other apps using the microphone and try again.';
  }
  
  if (errorName === 'OverconstrainedError') {
    return 'Could not access microphone with the requested settings. Please try again.';
  }
  
  return `Microphone error: ${error.message}`;
};
