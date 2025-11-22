export type Language = 'en' | 'th';

export const lineMessages = {
  en: {
    dailyReminder: {
      title: '🌟 Daily Gratitude Reminder',
      text: 'Take a moment to reflect... What are you grateful for today? 💭✨\n\nShare your thoughts with me!'
    },
    gratitudeReceived: {
      thankYou: (text: string) => `✨ "${text}"\n\nLovely! Would you like to draw something to express your gratitude?`,
      buttonText: 'Tap below to open the drawing canvas',
      buttonLabel: '🎨 Start Drawing'
    },
    welcome: {
      newFollower: '🎨 Welcome to Painted Minds!\n\nSend me any message to get your link token and connect your account.\n\nOnce linked, you\'ll receive:\n✅ Daily gratitude reminders\n✅ Achievement notifications\n✅ Personalized encouragement'
    },
    linkAccount: {
      title: '🔗 Link Your Account',
      message: (token: string) => `Your link token is:\n\n${token}\n\nCopy this token and paste it in the Painted Minds app under Settings > LINE to connect your account.\n\nThis token expires in 5 minutes.`
    },
    help: {
      title: '✨ Painted Minds Help',
      message: '📝 Your account is linked!\n\n🎨 Send me what you\'re grateful for to start drawing!\n\nExample: "I\'m grateful for my family"\n\n📔 Type \'journal\' to view your recent entries\n⭐ Track your streaks and achievements in the app\n🔔 Get daily reminders\n\n💡 Type \'test reminder\' to preview the daily reminder\n\nVisit the app for more features!'
    },
    errors: {
      liffNotConfigured: '✨ Thank you for sharing your gratitude!\n\nDrawing feature is being set up. Please try again soon or visit the app directly.',
      reminderNotConfigured: '⚠️ Reminder feature is being configured. Please try again soon.',
      fetchJournalFailed: '❌ Sorry, I couldn\'t fetch your journal entries. Please try again later.'
    },
    journal: {
      noEntries: '📔 You don\'t have any journal entries from the last 7 days.\n\nCreate new entries in the app!',
      untitled: 'Untitled Entry',
      noSummary: 'No summary available',
      carouselAlt: (count: number) => `Your ${count} journal entries from the last 7 days`
    }
  },
  th: {
    dailyReminder: {
      title: '🌟 การเตือนความกตัญญูประจำวัน',
      text: 'ใช้เวลาสักครู่เพื่อคิดถึง... วันนี้คุณรู้สึกขอบคุณอะไร? 💭✨\n\nแบ่งปันความคิดของคุณกับฉัน!'
    },
    gratitudeReceived: {
      thankYou: (text: string) => `✨ "${text}"\n\nน่ารักมาก! คุณต้องการวาดรูปเพื่อแสดงความกตัญญูหรือไม่?`,
      buttonText: 'แตะด้านล่างเพื่อเปิดผืนผ้าใบวาดรูป',
      buttonLabel: '🎨 เริ่มวาดรูป'
    },
    welcome: {
      newFollower: '🎨 ยินดีต้อนรับสู่ Painted Minds!\n\nส่งข้อความใดๆ ให้ฉันเพื่อรับโทเค็นลิงก์และเชื่อมต่อบัญชีของคุณ\n\nเมื่อเชื่อมต่อแล้ว คุณจะได้รับ:\n✅ การเตือนความกตัญญูประจำวัน\n✅ การแจ้งเตือนความสำเร็จ\n✅ กำลังใจส่วนตัว'
    },
    linkAccount: {
      title: '🔗 เชื่อมต่อบัญชีของคุณ',
      message: (token: string) => `โทเค็นลิงก์ของคุณคือ:\n\n${token}\n\nคัดลอกโทเค็นนี้และวางในแอป Painted Minds ภายใต้การตั้งค่า > LINE เพื่อเชื่อมต่อบัญชีของคุณ\n\nโทเค็นนี้จะหมดอายุใน 5 นาที`
    },
    help: {
      title: '✨ ความช่วยเหลือ Painted Minds',
      message: '📝 บัญชีของคุณเชื่อมต่อแล้ว!\n\n🎨 ส่งสิ่งที่คุณรู้สึกขอบคุณให้ฉันเพื่อเริ่มวาดรูป!\n\nตัวอย่าง: "ฉันรู้สึกขอบคุณครอบครัวของฉัน"\n\n📔 พิมพ์ \'journal\' เพื่อดูรายการล่าสุดของคุณ\n⭐ ติดตามความต่อเนื่องและความสำเร็จของคุณในแอป\n🔔 รับการเตือนประจำวัน\n\n💡 พิมพ์ \'test reminder\' เพื่อดูตัวอย่างการเตือนประจำวัน\n\nเยี่ยมชมแอปสำหรับคุณสมบัติเพิ่มเติม!'
    },
    errors: {
      liffNotConfigured: '✨ ขอบคุณที่แบ่งปันความกตัญญูของคุณ!\n\nกำลังตั้งค่าคุณสมบัติการวาดรูป โปรดลองอีกครั้งในไม่ช้าหรือเยี่ยมชมแอปโดยตรง',
      reminderNotConfigured: '⚠️ กำลังกำหนดค่าคุณสมบัติการเตือน โปรดลองอีกครั้งในไม่ช้า',
      fetchJournalFailed: '❌ ขออภัย ฉันไม่สามารถดึงรายการบันทึกของคุณได้ โปรดลองอีกครั้งในภายหลัง'
    },
    journal: {
      noEntries: '📔 คุณไม่มีบันทึกใดๆ จาก 7 วันที่ผ่านมา\n\nสร้างรายการใหม่ในแอป!',
      untitled: 'รายการไม่มีชื่อ',
      noSummary: 'ไม่มีสรุป',
      carouselAlt: (count: number) => `บันทึก ${count} รายการของคุณจาก 7 วันที่ผ่านมา`
    }
  }
};

export function getMessage(language: Language, path: string, ...args: any[]): string {
  const keys = path.split('.');
  let value: any = lineMessages[language];
  
  for (const key of keys) {
    value = value?.[key];
  }
  
  if (typeof value === 'function') {
    return value(...args);
  }
  
  // Fallback to English if translation not found
  if (!value) {
    let fallback: any = lineMessages.en;
    for (const key of keys) {
      fallback = fallback?.[key];
    }
    if (typeof fallback === 'function') {
      return fallback(...args);
    }
    return fallback || '';
  }
  
  return value || '';
}
