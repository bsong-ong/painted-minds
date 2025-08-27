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
    gratitudeArtJournal: 'Painted Smiles',
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
    thai: 'ไทย',
    
    // Gallery page
    publicGallery: 'Public Gallery',
    loadingPublicGallery: 'Loading public gallery...',
    noPublicDrawingsYet: 'No Public Drawings Yet',
    beTheFirstToShare: 'Be the first to share your gratitude art with the community!',
    by: 'by',
    anonymous: 'Anonymous',
    authenticationRequired: 'Authentication Required',
    pleaseSignInToStar: 'Please sign in to star drawings',
    error: 'Error',
    failedToLoadPublicDrawings: 'Failed to load public drawings',
    failedToUpdateStar: 'Failed to update star',
    aiEnhanced: 'AI Enhanced',
    
    // Share dialog
    share: 'Share',
    shareYourGratitudeArt: 'Share Your Gratitude Art',
    public: 'Public',
    private: 'Private',
    anyoneCanSeeYourDrawing: 'Anyone can see your drawing in the public gallery',
    onlyYouCanSeeThis: 'Only you can see this drawing',
    yourArtIsNowPublic: 'Your art is now public!',
    othersCanViewAndStar: 'Others can view and star your gratitude art in the public gallery. Sharing your creativity helps inspire the community!',
    drawingShared: 'Drawing Shared!',
    drawingMadePrivate: 'Drawing Made Private',
    artNowVisibleInGallery: 'Your gratitude art is now visible in the public gallery',
    drawingNowPrivate: 'Your drawing is now private',
    failedToUpdateSharingStatus: 'Failed to update sharing status',
    
    // Story generator
    createYourGratitudeStory: 'Create Your Gratitude Story',
    selectExactly3Images: 'Select exactly 3 images from your journal to create a captivating story. The AI will weave these images together into a heartwarming narrative.',
    selected: 'Selected',
    readyToGenerate: 'Ready to generate!',
    youCanOnlySelect3Images: 'You can only select 3 images',
    pleaseSelectExactly3Images: 'Please select exactly 3 images',
    generateStory: 'Generate Story',
    generatingStory: 'Generating Story...',
    reset: 'Reset',
    yourGratitudeStory: 'Your Gratitude Story',
    createNewStory: 'Create New Story',
    illustration: 'Illustration',
    storyGeneratedSuccessfully: 'Story generated successfully!',
    failedToGenerateStory: 'Failed to generate story. Please try again.',
    generateStoryFromImages: 'Generate Story from Images',

    // Rewards panel
    yourGratitudeJourney: 'Your Gratitude Journey',
    currentStreak: 'Current Streak',
    gratitudeMaster: 'Gratitude Master',
    mindfulSoul: 'Mindful Soul',
    thankfulHeart: 'Thankful Heart',
    gratefulBeginner: 'Grateful Beginner',
    startingJourney: 'Starting Journey',
    personalBest: 'Personal best',
    gratitudeEntries: 'Gratitude Entries',
    centuryCreator: 'Century Creator',
    dedicatedArtist: 'Dedicated Artist',
    consistentCreator: 'Consistent Creator',
    growingArtist: 'Growing Artist',
    newArtist: 'New Artist',
    entries: 'entries',
    nextMilestone: 'Next Milestone',
    moreEntriesToGo: 'more entries to go!',
    highestMilestone: "🎉 You've reached the highest milestone!",
    startGratitudeToday: 'Start your gratitude journey today! 🌱',
    greatStart: 'Great start! Keep the momentum going! 💪',
    buildingHabit: "You're building a beautiful habit! ✨",
    amazingConsistency: "Amazing consistency! You're inspiring! 🌟",
    gratitudeMasterMsg: "You're a true gratitude master! 🏆",

    // Drawing gallery
    myDrawings: 'My Drawings',
    noDrawingsYet: 'No drawings yet',
    createFirstDrawing: 'Create your first drawing using the canvas above!',
    aiEnhancedBadge: 'AI Enhanced',
    originalBadge: 'Original',
    enhancedBadge: 'Enhanced',
    publicBadge: 'Public',
    stars: 'stars',
    loadingDrawings: 'Loading your drawings...',
    failedToLoadDrawings: 'Failed to load drawings',
    drawingDeleted: 'Drawing deleted successfully',
    failedToDeleteDrawing: 'Failed to delete drawing'
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
    thai: 'ไทย',
    
    // Gallery page
    publicGallery: 'แกลเลอรี่สาธารณะ',
    loadingPublicGallery: 'กำลังโหลดแกลเลอรี่สาธารณะ...',
    noPublicDrawingsYet: 'ยังไม่มีงานวาดสาธารณะ',
    beTheFirstToShare: 'เป็นคนแรกที่แบ่งปันศิลปะความกตัญญูของคุณกับชุมชน!',
    by: 'โดย',
    anonymous: 'ไม่ระบุชื่อ',
    authenticationRequired: 'จำเป็นต้องยืนยันตัวตน',
    pleaseSignInToStar: 'กรุณาเข้าสู่ระบบเพื่อให้ดาวงานวาด',
    error: 'ข้อผิดพลาด',
    failedToLoadPublicDrawings: 'โหลดงานวาดสาธารณะไม่สำเร็จ',
    failedToUpdateStar: 'อัปเดตดาวไม่สำเร็จ',
    aiEnhanced: 'ปรับปรุงด้วย AI',
    
    // Share dialog
    share: 'แบ่งปัน',
    shareYourGratitudeArt: 'แบ่งปันศิลปะความกตัญญูของคุณ',
    public: 'สาธารณะ',
    private: 'ส่วนตัว',
    anyoneCanSeeYourDrawing: 'ทุกคนสามารถเห็นงานวาดของคุณในแกลเลอรี่สาธารณะ',
    onlyYouCanSeeThis: 'เฉพาะคุณเท่านั้นที่เห็นงานวาดนี้',
    yourArtIsNowPublic: 'งานศิลปะของคุณเป็นสาธารณะแล้ว!',
    othersCanViewAndStar: 'ผู้อื่นสามารถดูและให้ดาวศิลปะความกตัญญูของคุณในแกลเลอรี่สาธารณะ การแบ่งปันความคิดสร้างสรรคของคุณช่วยสร้างแรงบันดาลใจให้กับชุมชน!',
    drawingShared: 'แบ่งปันงานวาดแล้ว!',
    drawingMadePrivate: 'ทำให้งานวาดเป็นส่วนตัวแล้ว',
    artNowVisibleInGallery: 'ศิลปะความกตัญญูของคุณปรากฏในแกลเลอรี่สาธารณะแล้ว',
    drawingNowPrivate: 'งานวาดของคุณเป็นส่วนตัวแล้ว',
    failedToUpdateSharingStatus: 'อัปเดตสถานะการแบ่งปันไม่สำเร็จ',
    
    // Story generator
    createYourGratitudeStory: 'สร้างเรื่องราวความกตัญญูของคุณ',
    selectExactly3Images: 'เลือกรูปภาพ 3 รูปจากไดอารี่ของคุณเพื่อสร้างเรื่องราวที่น่าติดตาม AI จะสานรูปภาพเหล่านี้เข้าด้วยกันเป็นเรื่องเล่าที่อบอุ่นหัวใจ',
    selected: 'เลือกแล้ว',
    readyToGenerate: 'พร้อมสร้าง!',
    youCanOnlySelect3Images: 'คุณสามารถเลือกได้เพียง 3 รูปเท่านั้น',
    pleaseSelectExactly3Images: 'กรุณาเลือกรูปภาพ 3 รูปพอดี',
    generateStory: 'สร้างเรื่องราว',
    generatingStory: 'กำลังสร้างเรื่องราว...',
    reset: 'รีเซ็ต',
    yourGratitudeStory: 'เรื่องราวความกตัญญูของคุณ',
    createNewStory: 'สร้างเรื่องราวใหม่',
    illustration: 'ภาพประกอบ',
    storyGeneratedSuccessfully: 'สร้างเรื่องราวสำเร็จ!',
    failedToGenerateStory: 'สร้างเรื่องราวไม่สำเร็จ กรุณาลองใหม่อีกครั้ง',
    generateStoryFromImages: 'สร้างเรื่องราวจากรูปภาพ',

    // Rewards panel
    yourGratitudeJourney: 'การเดินทางความกตัญญูของคุณ',
    currentStreak: 'ความต่อเนื่องปัจจุบัน',
    gratitudeMaster: 'ปรมาจารย์ความกตัญญู',
    mindfulSoul: 'วิญญาณมีสติ',
    thankfulHeart: 'หัวใจขอบคุณ',
    gratefulBeginner: 'มือใหม่ผู้กตัญญู',
    startingJourney: 'เริ่มต้นการเดินทาง',
    personalBest: 'สถิติส่วนตัวดีที่สุด',
    gratitudeEntries: 'รายการความกตัญญู',
    centuryCreator: 'นักสร้างสรรค์ร้อยผลงาน',
    dedicatedArtist: 'ศิลปินผู้ทุ่มเท',
    consistentCreator: 'นักสร้างสรรค์ที่สม่ำเสมอ',
    growingArtist: 'ศิลปินที่เติบโต',
    newArtist: 'ศิลปินใหม่',
    entries: 'รายการ',
    nextMilestone: 'เป้าหมายถัดไป',
    moreEntriesToGo: 'รายการเพิ่มเติมที่ต้องทำ!',
    highestMilestone: '🎉 คุณไปถึงเป้าหมายสูงสุดแล้ว!',
    startGratitudeToday: 'เริ่มต้นการเดินทางความกตัญญูวันนี้! 🌱',
    greatStart: 'เริ่มต้นที่ดี! รักษาโมเมนตัมไว้! 💪',
    buildingHabit: 'คุณกำลังสร้างนิสัยที่งดงาม! ✨',
    amazingConsistency: 'ความสม่ำเสมอที่น่าทึ่ง! คุณเป็นแรงบันดาลใจ! 🌟',
    gratitudeMasterMsg: 'คุณเป็นปรมาจารย์ความกตัญญูตัวจริง! 🏆',

    // Drawing gallery
    myDrawings: 'งานวาดของฉัน',
    noDrawingsYet: 'ยังไม่มีงานวาด',
    createFirstDrawing: 'สร้างงานวาดแรกของคุณโดยใช้ผ้าใบด้านบน!',
    aiEnhancedBadge: 'ปรับปรุงด้วย AI',
    originalBadge: 'ต้นฉบับ',
    enhancedBadge: 'ปรับปรุงแล้ว',
    publicBadge: 'สาธารณะ',
    stars: 'ดาว',
    loadingDrawings: 'กำลังโหลดงานวาดของคุณ...',
    failedToLoadDrawings: 'โหลดงานวาดไม่สำเร็จ',
    drawingDeleted: 'ลบงานวาดสำเร็จ',
    failedToDeleteDrawing: 'ลบงานวาดไม่สำเร็จ'
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