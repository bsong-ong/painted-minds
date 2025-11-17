# LINE Messaging API Integration Guide

## Overview

Your app now has full LINE Messaging API integration with the following capabilities:
- **Receive messages** from LINE users via webhook
- **Send messages** to LINE users programmatically
- **Handle events** like follow, unfollow, join, and leave

## Setup Instructions

### 1. Configure Webhook URL in LINE Developers Console

1. Go to [LINE Developers Console](https://developers.line.biz/console/)
2. Select your Messaging API channel
3. Navigate to **Messaging API** tab
4. Set the **Webhook URL** to:
   ```
   https://kmhnnkwcxroxyfkbhqia.supabase.co/functions/v1/line-webhook
   ```

5. Enable **Use webhook** toggle
6. (Optional) Disable **Auto-reply messages** and **Greeting messages** if you want to handle all responses programmatically
7. Click **Verify** to test the webhook connection

### 2. Get Your Bot's Basic ID

In the **Messaging API** tab, you'll find your **Bot basic ID** (starts with `@`). Users can add your bot by searching for this ID in LINE.

### 3. Add Bot as Friend

To test:
1. Open LINE app on your phone
2. Search for your Bot Basic ID (e.g., `@123abcde`)
3. Add the bot as a friend
4. Send a test message

---

## How to Use

### Receiving Messages (Webhook)

The webhook automatically handles incoming LINE events. Currently supported events:

- **message** - User sends a message to your bot
- **follow** - User adds your bot as a friend
- **unfollow** - User blocks or removes your bot
- **join** - Bot is added to a group or chat room
- **leave** - Bot is removed from a group or chat room

**Customize the webhook behavior** by editing:
`supabase/functions/line-webhook/index.ts`

Example: Reply to user messages automatically:
```typescript
case "message":
  if (event.message?.type === "text") {
    const userMessage = event.message.text;
    const userId = event.source.userId;
    
    // Call your send-message function to reply
    await fetch("https://kmhnnkwcxroxyfkbhqia.supabase.co/functions/v1/line-send-message", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer YOUR_SUPABASE_ANON_KEY`,
      },
      body: JSON.stringify({
        to: userId,
        messages: [{
          type: "text",
          text: `You said: ${userMessage}`
        }]
      })
    });
  }
  break;
```

### Sending Messages to Users

Use the `line-send-message` edge function to send messages programmatically.

**From Frontend (React):**

```typescript
import { supabase } from "@/integrations/supabase/client";

const sendLineMessage = async (userId: string, messageText: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("line-send-message", {
      body: {
        to: userId,
        messages: [
          {
            type: "text",
            text: messageText
          }
        ]
      }
    });

    if (error) throw error;
    console.log("Message sent:", data);
    return data;
  } catch (error) {
    console.error("Error sending LINE message:", error);
    throw error;
  }
};

// Example usage
await sendLineMessage("U1234567890abcdef", "Hello from Painted Minds! 🎨");
```

**Message Types Supported:**

```typescript
// Text message
{
  type: "text",
  text: "Your message here"
}

// You can also send other types:
// - image, video, audio
// - sticker
// - location
// - template (buttons, confirm, carousel)
// 
// See LINE Messaging API docs for full list
```

---

## Use Cases for Painted Minds

### 1. **Send Daily Gratitude Reminders**

```typescript
// Send a reminder to users who haven't journaled today
const sendGratitudeReminder = async (userId: string) => {
  await supabase.functions.invoke("line-send-message", {
    body: {
      to: userId,
      messages: [{
        type: "text",
        text: "🌟 Time for your daily gratitude practice! What are you thankful for today?"
      }]
    }
  });
};
```

### 2. **Share Artwork on LINE**

```typescript
// Send a drawing to a user's LINE chat
const shareDrawingToLine = async (userId: string, imageUrl: string) => {
  await supabase.functions.invoke("line-send-message", {
    body: {
      to: userId,
      messages: [
        {
          type: "text",
          text: "Here's your beautiful artwork! 🎨"
        },
        {
          type: "image",
          originalContentUrl: imageUrl,
          previewImageUrl: imageUrl
        }
      ]
    }
  });
};
```

### 3. **Send CBT Encouragement**

```typescript
// Send encouraging messages after a CBT session
const sendEncouragement = async (userId: string) => {
  await supabase.functions.invoke("line-send-message", {
    body: {
      to: userId,
      messages: [{
        type: "text",
        text: "Great job completing your CBT session today! Remember, small steps lead to big changes. 💪"
      }]
    }
  });
};
```

---

## Storing User LINE IDs

To send messages to users, you'll need to store their LINE User IDs. When a user follows your bot, you can save their ID:

**Update webhook to store user data:**

```typescript
case "follow":
  const lineUserId = event.source.userId;
  console.log(`New follower: ${lineUserId}`);
  
  // TODO: Store in your database
  // Example: Link LINE ID to your app's user account
  await supabase
    .from('profiles')
    .update({ line_user_id: lineUserId })
    .eq('id', yourAppUserId);
  
  // Send welcome message
  await fetch("YOUR_SEND_MESSAGE_URL", {
    method: "POST",
    body: JSON.stringify({
      to: lineUserId,
      messages: [{
        type: "text",
        text: "Welcome to Painted Minds! 🎨 We're excited to support your mental wellness journey."
      }]
    })
  });
  break;
```

---

## Testing

### Test Webhook
1. Add your bot as a friend in LINE app
2. Send a message to the bot
3. Check the edge function logs in your backend to see the event being received

### Test Sending Messages
Use the example code above to send a test message to your own LINE User ID (you can find it in the webhook logs when you send a message to the bot).

---

## Resources

- [LINE Messaging API Documentation](https://developers.line.biz/en/docs/messaging-api/)
- [Message Types Reference](https://developers.line.biz/en/reference/messaging-api/#message-objects)
- [Webhook Event Types](https://developers.line.biz/en/reference/messaging-api/#webhook-event-objects)

---

## Troubleshooting

**Webhook not receiving events:**
- Verify the webhook URL is set correctly in LINE Developers
- Check that "Use webhook" is enabled
- Test the webhook URL using the "Verify" button

**Cannot send messages:**
- Ensure LINE_CHANNEL_ACCESS_TOKEN is set correctly
- Check that the user has added your bot as a friend
- Verify the user ID is correct (starts with 'U')

**Signature verification failed:**
- Ensure LINE_CHANNEL_SECRET is set correctly
- Check that you're using the channel secret from the correct LINE channel
