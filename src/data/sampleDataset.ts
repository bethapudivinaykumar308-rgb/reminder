import { Consumer, ReminderTemplate, UtilitySettings } from '../types';

export const DEFAULT_SETTINGS: UtilitySettings = {
  utilityName: 'AP/TS Power Distribution Co. (విద్యుత్ శాఖ)',
  supportPhone: '+91 98765 43210',
  launcherPhone: '+91 98765 43210',
  isLauncherPhoneVerified: true,
  launcherVerifiedAt: '2026-08-16T10:00:00.000Z',
  paymentPortalUrl: 'https://billpay.electricity.gov.in/quick',
  emailReportsTo: 'bethapudivinaykumar308@gmail.com',
  currency: '₹',
  autoSyncGoogle: false,
  defaultLanguage: 'Telugu',
  aiVoiceGender: 'female',
  disconnectionGraceDays: 7,
};

export const DEFAULT_TEMPLATES: ReminderTemplate[] = [
  {
    id: 'tpl-wa-telugu-urgent',
    type: 'whatsapp',
    title: '🟢 WhatsApp అత్యవసర బిల్లు నోటీసు (Telugu WhatsApp Notice)',
    textTemplate: `⚡ *{utility_name} - విద్యుత్ బిల్లు హెచ్చరిక* ⚡

నమస్కారం *{name}* గారు,

మీ విద్యుత్ కనెక్షన్ వివరాలు:
📋 *కనెక్షన్ ID:* {consumer_id}
🔢 *మీటర్ నంబర్:* {meter_no}
💰 *బకాయి మొత్తం:* {amount}
📅 *గడువు తేదీ:* {due_date} ({overdue_days} రోజులు దాటిపోయింది)

⚠️ *ముఖ్య గమనిక:* విద్యుత్ సరఫరా తాత్కాలికంగా నిలిపివేయకుండా ఉండటానికి దయచేసి వెంటనే బకాయి క్లియర్ చేయండి.

📲 *తక్షణ ఆన్‌లైన్ పేమెంట్ లింక్ (UPI / NetBanking):*
{pay_link}

📞 *సహాయం కోసం అధికారిక హెల్ప్‌లైన్:* {support_phone}`,
    tone: 'urgent',
    language: 'Telugu',
    isDefault: true,
  },
  {
    id: 'tpl-wa-telugu-friendly',
    type: 'whatsapp',
    title: '🟢 WhatsApp మర్యాదపూర్వక రిమైండర్ (Telugu Gentle WhatsApp)',
    textTemplate: `💡 *{utility_name} - బిల్లు సమాచారం*

నమస్కారం *{name}* గారు,

మీ విద్యుత్ మీటర్ *#{meter_no}* (ID: *{consumer_id}*) ప్రస్తుత బిల్లు బకాయి: *{amount}*.

దయచేసి క్రింది అధికారిక లింక్ ద్వారా ఆన్‌లైన్‌లో చెల్లించి ఇన్‌స్టంట్ రశీదు పొందండి:
🔗 {pay_link}

హెల్ప్‌లైన్: {support_phone}. ధన్యవాదాలు!`,
    tone: 'polite',
    language: 'Telugu',
    isDefault: false,
  },
  {
    id: 'tpl-wa-english-urgent',
    type: 'whatsapp',
    title: '🟢 Urgent WhatsApp Disconnection Alert (English)',
    textTemplate: `⚡ *{utility_name} - ELECTRICITY BILL OVERDUE NOTICE* ⚡

Dear *{name}*,

Your electricity connection is currently overdue for payment:
📋 *Consumer ID:* {consumer_id}
🔢 *Meter No:* {meter_no}
💰 *Overdue Amount:* {amount}
⏳ *Overdue by:* {overdue_days} days (Due Date: {due_date})

Please pay immediately to prevent disconnection orders:
👉 *Instant QuickPay Link:* {pay_link}

Helpline: {support_phone}`,
    tone: 'urgent',
    language: 'English',
    isDefault: false,
  },
  {
    id: 'tpl-sms-telugu-urgent',
    type: 'sms',
    title: '⚡ అత్యవసర కరెంట్ బిల్లు నోటీసు (Telugu Urgent SMS)',
    textTemplate: '⚡ [విద్యుత్ శాఖ హెచ్చరిక] నమస్కారం {name} గారు, మీ కనెక్షన్ ID #{consumer_id} విద్యుత్ బిల్లు {amount} చెల్లించాల్సిన గడువు {overdue_days} రోజులు దాటిపోయింది (తేదీ: {due_date}). విద్యుత్ కనెక్షన్ కట్ అవ్వకుండా ఉండటానికి వెంటనే ఇక్కడ చెల్లించండి: {pay_link} లేదా సహాయం కోసం సంప్రదించండి: {support_phone}.',
    tone: 'urgent',
    language: 'Telugu',
    isDefault: true,
  },
  {
    id: 'tpl-sms-telugu-friendly',
    type: 'sms',
    title: '💡 మర్యాదపూర్వక బిల్లు రిమైండర్ (Telugu Gentle SMS)',
    textTemplate: '💡 [విద్యుత్ శాఖ రిమైండర్] నమస్కారం {name} గారు, మీ విద్యుత్ మీటర్ #{meter_no} బిల్లు {amount} గడువు తేదీ: {due_date}. రశీదు వెంటనే పొందడానికి ఇక్కడ చెల్లించండి: {pay_link}. హెల్ప్‌లైన్: {support_phone}.',
    tone: 'polite',
    language: 'Telugu',
    isDefault: false,
  },
  {
    id: 'tpl-call-ai-telugu-urgent',
    type: 'aicall',
    title: '🎙️ ఆటోమేటెడ్ తెలుగు AI కాల్ (Telugu AI Voice Notice)',
    textTemplate: 'నమస్కారం {name} గారు! నేను {utility_name} నుండి ఆస్ట్రా మాట్లాడుతున్నాను. మీ కనెక్షన్ నంబర్ {consumer_id} విద్యుత్ బిల్లు {amount} చెల్లించాల్సిన గడువు {overdue_days} రోజులు దాటిపోయింది. విద్యుత్ సరఫరా నిలిపివేయకుండా వెంటనే చెల్లించండి. తక్షణ SMS పేమెంట్ లింక్ కోసం 1 నొక్కండి, వారం రోజుల గడువు కోసం 2 నొక్కండి, లేదా అధికారితో మాట్లాడటానికి 3 నొక్కండి.',
    tone: 'urgent',
    language: 'Telugu',
    voice: 'ఆస్ట్రా - తెలుగు AI (Astra Telugu Voice)',
    isDefault: true,
  },
  {
    id: 'tpl-call-ai-telugu-courteous',
    type: 'aicall',
    title: '🎙️ తెలుగు సహాయక AI కాల్ (Telugu Courteous Call)',
    textTemplate: 'నమస్కారం {name} గారు. ఇది {utility_name} నుండి సహాయక కాల్. మీ మీటర్ నంబర్ {meter_no} విద్యుత్ బిల్లు {amount} గడువు తేదీ {due_date}. ఆన్‌లైన్‌లో సులభంగా చెల్లించడానికి {pay_link} సందర్శించండి. మీరు ఇప్పటికే చెల్లించి ఉంటే 1 నొక్కండి.',
    tone: 'polite',
    language: 'Telugu',
    voice: 'ఆస్ట్రా - తెలుగు AI (Astra Telugu Voice)',
    isDefault: false,
  },
  {
    id: 'tpl-sms-urgent',
    type: 'sms',
    title: 'Urgent Disconnection Notice (English SMS)',
    textTemplate: '⚡ [MEDC ALERT] Dear {name}, your electricity bill of {amount} for Consumer ID #{consumer_id} is OVERDUE by {overdue_days} days (Due: {due_date}). Pay immediately at {pay_link} or call {support_phone} to prevent service disconnection.',
    tone: 'urgent',
    language: 'English',
    isDefault: false,
  },
  {
    id: 'tpl-call-ai-urgent',
    type: 'aicall',
    title: 'Automated AI Voice Notice (English AI Call)',
    textTemplate: 'Hello {name}. This is Astra calling from {utility_name}. We notice that your power bill of {amount} for Consumer Number {consumer_id} is overdue by {overdue_days} days. Power disconnection orders are scheduled. Press 1 to get an SMS payment link, Press 2 to request a 7-day extension, or Press 3 to speak with a billing agent.',
    tone: 'urgent',
    language: 'English',
    voice: 'Aoede',
    isDefault: false,
  }
];

export const INITIAL_CONSUMERS: Consumer[] = [
  {
    id: 'cons-101',
    consumerId: 'EB-884210',
    meterNo: 'MTR-9921',
    name: 'Rajesh Sharma',
    phone: '+91 98450 12345',
    email: 'rajesh.sharma@example.com',
    amount: 4850,
    dueDate: '2026-07-15',
    overdueDays: 32,
    tariffType: 'Domestic',
    address: 'Flat 402, Green Meadows, Sector 14, Delhi',
    status: 'unpaid',
    notes: 'Prior late payment history, notified twice',
  },
  {
    id: 'cons-102',
    consumerId: 'EB-739102',
    meterNo: 'MTR-4412',
    name: 'Sunita Verma',
    phone: '+91 98765 43210',
    email: 'sunita.verma@example.com',
    amount: 14200,
    dueDate: '2026-06-28',
    overdueDays: 49,
    tariffType: 'Commercial',
    address: 'Verma Textile Emporium, MG Road Market, Bengaluru',
    status: 'unpaid',
    notes: 'Commercial meter with heavy peak usage',
  },
  {
    id: 'cons-103',
    consumerId: 'EB-992014',
    meterNo: 'MTR-8819',
    name: 'Vikram Singh Patel',
    phone: '+91 97110 54321',
    email: 'vikram.patel@agrofarm.in',
    amount: 8900,
    dueDate: '2026-05-20',
    overdueDays: 88,
    tariffType: 'Agricultural',
    address: 'Feeder Line 4, Farm Borewell Plot 12, Gujarat',
    status: 'unpaid',
    notes: 'CRITICAL: Exceeded 60 days cutoff threshold',
  },
  {
    id: 'cons-104',
    consumerId: 'EB-331908',
    meterNo: 'MTR-3390',
    name: 'Ananya Deshmukh',
    phone: '+91 99200 87654',
    email: 'ananya.d@fintech.co',
    amount: 2750,
    dueDate: '2026-08-01',
    overdueDays: 15,
    tariffType: 'Domestic',
    address: 'B-104, Sunrise Heights, Kothrud, Pune',
    status: 'unpaid',
    notes: 'First time overdue',
  },
  {
    id: 'cons-105',
    consumerId: 'EB-554129',
    meterNo: 'MTR-7721',
    name: 'Apex Precision Metals Ltd.',
    phone: '+91 98220 11223',
    email: 'accounts@apexmetals.com',
    amount: 68400,
    dueDate: '2026-06-10',
    overdueDays: 67,
    tariffType: 'Industrial',
    address: 'Plot 45-B, Industrial Development Area, Hyderabad',
    status: 'unpaid',
    notes: 'High tension 11kV connection; final notice pending',
  },
  {
    id: 'cons-106',
    consumerId: 'EB-441289',
    meterNo: 'MTR-5534',
    name: 'Kavitha Ranganathan',
    phone: '+91 94440 98765',
    email: 'kavitha.r@gmail.com',
    amount: 3400,
    dueDate: '2026-07-20',
    overdueDays: 27,
    tariffType: 'Domestic',
    address: '12, Anna Nagar 3rd Cross, Chennai',
    status: 'unpaid',
    notes: 'SMS sent last week',
  },
  {
    id: 'cons-107',
    consumerId: 'EB-661204',
    meterNo: 'MTR-2189',
    name: 'Amitabh Sen',
    phone: '+91 98300 45678',
    email: 'amitabh.sen@kolkata.org',
    amount: 5120,
    dueDate: '2026-05-15',
    overdueDays: 93,
    tariffType: 'Domestic',
    address: '77/2, Salt Lake City Block CF, Kolkata',
    status: 'unpaid',
    notes: 'CRITICAL: Disconnection lineman team scheduled',
  },
  {
    id: 'cons-108',
    consumerId: 'EB-119842',
    meterNo: 'MTR-6651',
    name: 'City Care Diagnostic Clinic',
    phone: '+91 99880 33445',
    email: 'admin@citycarediagnostics.com',
    amount: 19500,
    dueDate: '2026-07-05',
    overdueDays: 42,
    tariffType: 'Commercial',
    address: 'Shop 10-12, Metro Mall Plaza, Sector 18, Noida',
    status: 'unpaid',
    notes: 'Requested call back during business hours',
  },
  {
    id: 'cons-109',
    consumerId: 'EB-901244',
    meterNo: 'MTR-1049',
    name: 'Ramesh Reddy',
    phone: '+91 98850 77665',
    email: 'ramesh.reddy@agri.in',
    amount: 6200,
    dueDate: '2026-07-25',
    overdueDays: 22,
    tariffType: 'Agricultural',
    address: 'Borewell Feeder 2, Warangal Rural Substation, Telangana',
    status: 'unpaid',
    notes: 'Solar subsidy adjustment pending review',
  },
  {
    id: 'cons-110',
    consumerId: 'EB-220194',
    meterNo: 'MTR-3891',
    name: 'Pooja Agarwal',
    phone: '+91 98190 22334',
    email: 'pooja.agarwal@outlook.com',
    amount: 3890,
    dueDate: '2026-08-05',
    overdueDays: 11,
    tariffType: 'Domestic',
    address: 'Bldg 7, Neptune Residency, Powai, Mumbai',
    status: 'unpaid',
    notes: 'Regular on-time payer normally',
  },
];
