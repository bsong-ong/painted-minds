# Capacitor Mobile App Setup Guide

This guide will help you configure the necessary permissions for the Painted Minds mobile app, specifically for the microphone access required by the CBT Assistant and Talk Buddy features.

## Prerequisites

- For iOS: Mac with Xcode installed
- For Android: Android Studio installed
- Node.js and npm installed

## Initial Setup Steps

1. **Export and Clone Your Project**
   - Export the project to GitHub via the Lovable interface
   - Clone your repository locally:
   ```bash
   git clone <YOUR_GIT_URL>
   cd <YOUR_PROJECT_NAME>
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Add Platform Support**
   
   For Android:
   ```bash
   npx cap add android
   ```
   
   For iOS:
   ```bash
   npx cap add ios
   ```

## Configure Microphone Permissions

### Android Configuration

After running `npx cap add android`, you need to manually add microphone permissions to the Android manifest file.

**File to Edit:** `android/app/src/main/AndroidManifest.xml`

Add these permissions inside the `<manifest>` tag, before the `<application>` tag:

```xml
<uses-permission android:name="android.permission.RECORD_AUDIO" />
<uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
```

**Example:**
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />

    <application
        ...
    </application>
</manifest>
```

### iOS Configuration

After running `npx cap add ios`, you need to add a microphone usage description to the Info.plist file.

**File to Edit:** `ios/App/App/Info.plist`

Add this entry before the closing `</dict>` tag:

```xml
<key>NSMicrophoneUsageDescription</key>
<string>This app needs access to your microphone to record voice messages for the CBT Assistant and Talk Buddy features.</string>
```

**Example:**
```xml
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <!-- Other keys... -->
    
    <key>NSMicrophoneUsageDescription</key>
    <string>This app needs access to your microphone to record voice messages for the CBT Assistant and Talk Buddy features.</string>
</dict>
</plist>
```

## Build and Run

1. **Build the Web Assets**
   ```bash
   npm run build
   ```

2. **Sync with Native Platforms**
   ```bash
   npx cap sync
   ```

3. **Run on Device/Emulator**
   
   For Android:
   ```bash
   npx cap open android
   ```
   Then build and run in Android Studio.
   
   For iOS:
   ```bash
   npx cap open ios
   ```
   Then build and run in Xcode.

## Testing Microphone Features

1. Launch the app on your device or emulator
2. Navigate to either the CBT Assistant or Talk Buddy feature
3. Click the "Start Recording" button
4. You should see a permission prompt asking for microphone access
5. Grant permission
6. Test recording by speaking into the microphone
7. The app should transcribe your speech and respond accordingly

## Troubleshooting

### Permission Denied Error

If you see "Microphone permission denied" errors:

1. **Check Manifest/Info.plist**: Ensure you've added the permissions correctly
2. **Rebuild**: Run `npm run build` and `npx cap sync` again
3. **Reset Permissions**: On your device, go to Settings → Apps → Painted Minds → Permissions and enable microphone
4. **Reinstall**: Sometimes you need to uninstall and reinstall the app for permission changes to take effect

### No Microphone Found

If you see "No microphone found" errors:

1. **Test on Real Device**: Emulators may not properly emulate microphone hardware
2. **Check Device**: Ensure your device actually has a working microphone
3. **Check iOS Simulator**: For iOS, you need to enable microphone input in Simulator settings

### Audio Recording Doesn't Work

1. **Check Browser Console**: Open developer tools and check for JavaScript errors
2. **Test in Browser First**: Test the web version at your Lovable project URL to ensure the feature works
3. **Update Capacitor**: Make sure you're using the latest version of Capacitor:
   ```bash
   npm install @capacitor/core@latest @capacitor/cli@latest
   npx cap sync
   ```

## Updating After Code Changes

Whenever you make changes to your code in Lovable:

1. Pull the latest changes:
   ```bash
   git pull
   ```

2. Rebuild and sync:
   ```bash
   npm run build
   npx cap sync
   ```

3. The changes will be reflected in your native apps

## Additional Resources

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Android Permissions Guide](https://developer.android.com/guide/topics/permissions/overview)
- [iOS Privacy Permissions](https://developer.apple.com/documentation/uikit/protecting_the_user_s_privacy)
