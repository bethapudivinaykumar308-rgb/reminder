export type TariffCategory = 'Domestic' | 'Commercial' | 'Industrial' | 'Agricultural';
export type PaymentStatus = 'unpaid' | 'partially_paid' | 'paid' | 'disputed' | 'disconnected';
export type DispatchType = 'sms' | 'aicall' | 'whatsapp';
export type DispatchStatus = 'delivered' | 'sent' | 'failed' | 'connected' | 'completed' | 'no-answer' | 'promised_to_pay' | 'requested_extension' | 'in-progress';

export interface CapturedHumanDetails {
  promiseDate?: string;
  committedAmount?: number;
  delayReason?: string;
  customerMeterReading?: string;
  alternateContact?: string;
  preferredPaymentMethod?: string;
  callbackRequested?: string;
  customerSentiment?: 'cooperative' | 'hesitant' | 'disputing' | 'ready_to_pay' | 'unreachable';
  notesSummary?: string;
  capturedAt?: string;
}

export interface Consumer {
  id: string;
  consumerId: string;
  meterNo: string;
  name: string;
  phone: string;
  email?: string;
  amount: number;
  dueDate: string;
  overdueDays: number;
  tariffType: TariffCategory;
  address: string;
  status: PaymentStatus;
  lastSmsDate?: string;
  lastCallDate?: string;
  notes?: string;
  promiseDate?: string;
  delayReason?: string;
  alternateContact?: string;
  customerMeterReading?: string;
  preferredPaymentMethod?: string;
  createdBy?: string;
  createdAt?: string;
  updatedAt?: string;
  hasNoWhatsApp?: boolean;
}

export interface DispatchLog {
  id: string;
  type: DispatchType;
  consumerId: string;
  consumerName: string;
  phone: string;
  amount: number;
  status: DispatchStatus;
  messageContent: string;
  callDuration?: number; // in seconds
  callTranscript?: string;
  customerResponse?: string;
  capturedDetails?: CapturedHumanDetails;
  timestamp: string;
  batchId?: string;
  createdBy?: string;
}

export interface ReminderTemplate {
  id: string;
  type: DispatchType;
  title: string;
  textTemplate: string;
  tone: 'polite' | 'firm' | 'urgent' | 'legal';
  language: string;
  voice?: string;
  isDefault: boolean;
  createdBy?: string;
}

export interface UtilitySettings {
  utilityName: string;
  supportPhone: string;
  launcherPhone?: string; // Officer / User's verified launcher phone number
  isLauncherPhoneVerified?: boolean;
  launcherVerifiedAt?: string;
  paymentPortalUrl: string;
  emailReportsTo: string;
  currency: string;
  autoSyncGoogle: boolean;
  smsSenderId?: string;
  disconnectionGraceDays?: number;
  aiVoiceGender?: 'female' | 'male';
  defaultLanguage?: string;
}

export interface ParsedDocumentResult {
  records: Omit<Consumer, 'id'>[];
  count: number;
  fileName: string;
}

export interface AiReportSummary {
  executiveSummary: string;
  riskAnalysis: string;
  recommendedActions: string[];
  recoveryProbabilityScore: number;
  emailSubject: string;
  emailHtmlBody: string;
}
