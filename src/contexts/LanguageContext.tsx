import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'en' | 'th';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

const translations = {
  en: {
    // Common
    loading: 'Loading...',
    back: 'Back',
    email: 'Email',
    password: 'Password',
    signIn: 'Sign In',
    signUp: 'Sign Up',
    signOut: 'Sign Out',
    welcome: 'Welcome',
    save: 'Save',
    cancel: 'Cancel',
    delete: 'Delete',
    download: 'Download',
    
    // Auth page
    drawingApp: 'Drawing App',
    signInToSave: 'Sign in to save and view your drawings',
    emailPlaceholder: 'you@example.com',
    passwordPlaceholder: 'Your password',
    createPasswordPlaceholder: 'Create a password',
    signingIn: 'Signing in...',
    creatingAccount: 'Creating account...',
    checkEmailConfirmation: 'Check your email for the confirmation link!',
    successfullySignedIn: 'Successfully signed in!',
    
    // Index page
    gratitudeArtJournal: 'Gratitude Art Journal',
    viewJournal: 'View Journal',
    startYourDailyGratitude: 'Start Your Daily Gratitude Practice',
    takeAMomentToReflect: 'Take a moment to reflect on what you\'re grateful for today, then express it through art.',
    startGratitudeEntry: 'Start Gratitude Entry',
    yourRecentGratitudeArt: 'Your Recent Gratitude Art',
    
    // Onboarding page
    gratitudeAndMindfulness: 'Gratitude and mindfulness illustration',
    transformYourDaily: 'Transform your daily gratitude practice into beautiful visual memories with AI-enhanced artwork. Express your thankfulness through simple drawings and watch them bloom into stunning art.',
    
    // Feature cards
    dailyGratitude: 'Daily Gratitude',
    dailyGratitudeDesc: 'Draw what you\'re grateful for each day to build a positive mindset and mindfulness habit',
    creativeExpression: 'Creative Expression',
    creativeExpressionDesc: 'Express your gratitude through simple drawings - no artistic skills required, just authentic feelings',
    aiEnhancement: 'AI Enhancement',
    aiEnhancementDesc: 'Transform your sketches into beautiful artwork with AI enhancement that preserves your original intent',
    buildConsistency: 'Build Consistency',
    buildConsistencyDesc: 'Earn rewards and track streaks to maintain your gratitude practice and see your growth over time',
    
    // How it works
    howItWorks: 'How It Works',
    chooseYourGratitude: 'Choose Your Gratitude',
    chooseYourGratitudeDesc: 'Get AI-powered suggestions or pick your own inspiration for what to draw',
    drawYourFeeling: 'Draw Your Feeling',
    drawYourFeelingDesc: 'Create a simple sketch expressing your gratitude - no artistic experience needed',
    enhanceAndReflect: 'Enhance & Reflect',
    enhanceAndReflectDesc: 'Watch your sketch transform into beautiful art and reflect on your gratitude journey',
    
    startYourGratitudeJourney: 'Start Your Gratitude Journey',
    skipAndContinue: 'Skip and continue to app',
    
    // Journal page
    gratitudeJournal: 'Gratitude Journal',
    backToDrawing: 'Back to Drawing',
    showPast: 'Show past',
    days: 'days',
    showAllAsEnhanced: 'Show all as enhanced',
    loadingGratitudeJournal: 'Loading your gratitude journal...',
    noGratitudeEntries: 'No gratitude entries found for the past',
    createYourFirstEntry: 'Create Your First Entry',
    showOriginal: 'Show original',
    showEnhanced: 'Show enhanced',
    enhanced: 'Enhanced',
    prompt: 'Prompt:',
    yourReflection: 'Your reflection:',
    areYouSureDelete: 'Are you sure you want to delete this journal entry?',
    journalEntryDeleted: 'Journal entry deleted',
    failedToDeleteEntry: 'Failed to delete journal entry',
    imageDownloaded: 'Image downloaded',
    failedToDownload: 'Failed to download image',
    failedToLoadEntries: 'Failed to load journal entries',
    
    // NotFound page
    pageNotFound: 'Page not found',
    oopsPageNotFound: 'Oops! Page not found',
    returnToHome: 'Return to Home',
    
    // Drawing page
    drawingCanvas: 'Drawing Canvas',
    penSize: 'Pen Size',
    black: 'Black',
    red: 'Red',
    green: 'Green',
    clear: 'Clear',
    saveDrawing: 'Save Drawing',
    drawYourGratitude: 'Draw your gratitude:',
    expressYourGratitudeThrough: 'Express Your Gratitude Through Art',
    pencil: 'Pencil',
    eraser: 'Eraser',
    colors: 'Colors',
    saving: 'Saving...',
    enhancing: 'Enhancing...',
    saveAndEnhanceEntry: 'Save & Enhance Entry',
    canvasCleared: 'Canvas cleared',
    pleaseDrawSomething: 'Please draw something first',
    gratitudeDrawingSaved: 'Gratitude drawing saved!',
    gratitudeDrawingEnhanced: 'Your gratitude drawing is being enhanced! Check your journal.',
    failedToSaveDrawing: 'Failed to save drawing',
    
    // Text entry page
    whatAreYouGratefulFor: 'What are you grateful for today?',
    writeAboutWhatMakes: 'Write about what makes you feel grateful...',
    getRandomPrompt: 'Get Random Prompt',
    continueToDrawing: 'Continue to Drawing',
    pleaseEnterText: 'Please enter some text before continuing.',
    aiSuggestions: 'AI Suggestions:',
    aiHintsGenerated: 'AI hints generated!',
    failedToGenerateHints: 'Failed to generate AI hints',
    
    // Language switcher
    language: 'Language',
    english: 'English',
    thai: 'ไทย'
  },
  th: {
    // Common
    loading: 'กำลังโหลด...',
    back: 'ย้อนกลับ',
    email: 'อีเมล',
    password: 'รหัสผ่าน',
    signIn: 'เข้าสู่ระบบ',
    signUp: 'สมัครสมาชิก',
    signOut: 'ออกจากระบบ',
    welcome: 'ยินดีต้อนรับ',
    save: 'บันทึก',
    cancel: 'ยกเลิก',
    delete: 'ลบ',
    download: 'ดาวน์โหลด',
    
    // Auth page
    drawingApp: 'แอปวาดรูป',
    signInToSave: 'เข้าสู่ระบบเพื่อบันทึกและดูงานวาดของคุณ',
    emailPlaceholder: 'example@email.com',
    passwordPlaceholder: 'รหัสผ่านของคุณ',
    createPasswordPlaceholder: 'สร้างรหัสผ่าน',
    signingIn: 'กำลังเข้าสู่ระบบ...',
    creatingAccount: 'กำลังสร้างบัญชี...',
    checkEmailConfirmation: 'ตรวจสอบอีเมลของคุณสำหรับลิงค์ยืนยัน!',
    successfullySignedIn: 'เข้าสู่ระบบสำเร็จ!',
    
    // Index page
    gratitudeArtJournal: 'ไดอารี่ศิลปะความกตัญญู',
    viewJournal: 'ดูไดอารี่',
    startYourDailyGratitude: 'เริ่มต้นการฝึกความกตัญญูประจำวันของคุณ',
    takeAMomentToReflect: 'ใช้เวลาสักครู่เพื่อคิดถึงสิ่งที่คุณรู้สึกขอบคุณในวันนี้ แล้วแสดงออกผ่านศิลปะ',
    startGratitudeEntry: 'เริ่มบันทึกความกตัญญู',
    yourRecentGratitudeArt: 'ศิลปะความกตัญญูล่าสุดของคุณ',
    
    // Onboarding page
    gratitudeAndMindfulness: 'ภาพประกอบความกตัญญูและสติ',
    transformYourDaily: 'เปลี่ยนการฝึกความกตัญญูประจำวันของคุณให้เป็นความทรงจำทางภาพที่สวยงามด้วยงานศิลปะที่ปรับปรุงด้วย AI แสดงความขอบคุณผ่านภาพวาดง่ายๆ และดูมันผลิบานเป็นศิลปะที่สวยงาม',
    
    // Feature cards
    dailyGratitude: 'ความกตัญญูประจำวัน',
    dailyGratitudeDesc: 'วาดสิ่งที่คุณรู้สึกขอบคุณในแต่ละวันเพื่อสร้างทัศนคติเชิงบวกและนิสัยการมีสติ',
    creativeExpression: 'การแสดงออกอย่างสร้างสรรค์',
    creativeExpressionDesc: 'แสดงความกตัญญูผ่านภาพวาดง่ายๆ - ไม่ต้องมีทักษะศิลปะ แค่ความรู้สึกที่แท้จริง',
    aiEnhancement: 'การปรับปรุงด้วย AI',
    aiEnhancementDesc: 'เปลี่ยนร่างของคุณให้เป็นงานศิลปะที่สวยงามด้วยการปรับปรุงด้วย AI ที่รักษาเจตนาเดิมของคุณ',
    buildConsistency: 'สร้างความสม่ำเสมอ',
    buildConsistencyDesc: 'รับรางวัลและติดตามความต่อเนื่องเพื่อรักษาการฝึกความกตัญญูและดูการเติบโตของคุณเมื่อเวลาผ่านไป',
    
    // How it works
    howItWorks: 'วิธีการทำงาน',
    chooseYourGratitude: 'เลือกความกตัญญูของคุณ',
    chooseYourGratitudeDesc: 'รับคำแนะนำที่ขับเคลื่อนด้วย AI หรือเลือกแรงบันดาลใจของคุณเองสำหรับสิ่งที่จะวาด',
    drawYourFeeling: 'วาดความรู้สึกของคุณ',
    drawYourFeelingDesc: 'สร้างร่างง่ายๆ ที่แสดงความกตัญญูของคุณ - ไม่ต้องมีประสบการณ์ศิลปะ',
    enhanceAndReflect: 'ปรับปรุงและสะท้อน',
    enhanceAndReflectDesc: 'ดูร่างของคุณเปลี่ยนเป็นศิลปะที่สวยงามและสะท้อนการเดินทางความกตัญญูของคุณ',
    
    startYourGratitudeJourney: 'เริ่มต้นการเดินทางความกตัญญูของคุณ',
    skipAndContinue: 'ข้ามและไปต่อที่แอป',
    
    // Journal page
    gratitudeJournal: 'ไดอารี่ความกตัญญู',
    backToDrawing: 'กลับไปวาดรูป',
    showPast: 'แสดงที่ผ่านมา',
    days: 'วัน',
    showAllAsEnhanced: 'แสดงทั้งหมดแบบปรับปรุงแล้ว',
    loadingGratitudeJournal: 'กำลังโหลดไดอารี่ความกตัญญูของคุณ...',
    noGratitudeEntries: 'ไม่พบรายการความกตัญญูสำหรับที่ผ่านมา',
    createYourFirstEntry: 'สร้างรายการแรกของคุณ',
    showOriginal: 'แสดงต้นฉบับ',
    showEnhanced: 'แสดงแบบปรับปรุงแล้ว',
    enhanced: 'ปรับปรุงแล้ว',
    prompt: 'คำแนะนำ:',
    yourReflection: 'การสะท้อนของคุณ:',
    areYouSureDelete: 'คุณแน่ใจหรือไม่ที่จะลบรายการไดอารี่นี้?',
    journalEntryDeleted: 'ลบรายการไดอารี่แล้ว',
    failedToDeleteEntry: 'ลบรายการไดอารี่ไม่สำเร็จ',
    imageDownloaded: 'ดาวน์โหลดรูปภาพแล้ว',
    failedToDownload: 'ดาวน์โหลดรูปภาพไม่สำเร็จ',
    failedToLoadEntries: 'โหลดรายการไดอารี่ไม่สำเร็จ',
    
    // NotFound page
    pageNotFound: 'ไม่พบหน้า',
    oopsPageNotFound: 'อุ๊ปส์! ไม่พบหน้า',
    returnToHome: 'กลับไปหน้าแรก',
    
    // Drawing page
    drawingCanvas: 'ผ้าใบวาดรูป',
    penSize: 'ขนาดปากกา',
    black: 'ดำ',
    red: 'แดง',
    green: 'เขียว',
    clear: 'ล้าง',
    saveDrawing: 'บันทึกภาพวาด',
    drawYourGratitude: 'วาดความกตัญญูของคุณ:',
    expressYourGratitudeThrough: 'แสดงความกตัญญูของคุณผ่านศิลปะ',
    pencil: 'ดินสอ',
    eraser: 'ยางลบ',
    colors: 'สี',
    saving: 'กำลังบันทึก...',
    enhancing: 'กำลังปรับปรุง...',
    saveAndEnhanceEntry: 'บันทึกและปรับปรุงรายการ',
    canvasCleared: 'ล้างผ้าใบแล้ว',
    pleaseDrawSomething: 'กรุณาวาดอะไรสักอย่างก่อน',
    gratitudeDrawingSaved: 'บันทึกภาพวาดความกตัญญูแล้ว!',
    gratitudeDrawingEnhanced: 'ภาพวาดความกตัญญูของคุณกำลังถูกปรับปรุง! ตรวจสอบไดอารี่ของคุณ',
    failedToSaveDrawing: 'บันทึกภาพวาดไม่สำเร็จ',
    
    // Text entry page
    whatAreYouGratefulFor: 'วันนี้คุณรู้สึกขอบคุณอะไร?',
    writeAboutWhatMakes: 'เขียนเกี่ยวกับสิ่งที่ทำให้คุณรู้สึกขอบคุณ...',
    getRandomPrompt: 'รับคำแนะนำแบบสุ่ม',
    continueToDrawing: 'ไปต่อที่การวาดรูป',
    pleaseEnterText: 'กรุณาใส่ข้อความก่อนดำเนินการต่อ',
    aiSuggestions: 'คำแนะนำจาก AI:',
    aiHintsGenerated: 'สร้างคำแนะนำจาก AI แล้ว!',
    failedToGenerateHints: 'สร้างคำแนะนำจาก AI ไม่สำเร็จ',
    
    // Language switcher
    language: 'ภาษา',
    english: 'English',
    thai: 'ไทย'
  }
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('preferred-language');
    return (saved as Language) || 'en';
  });

  useEffect(() => {
    localStorage.setItem('preferred-language', language);
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations.en] || key;
  };

  const value = {
    language,
    setLanguage,
    t
  };

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};