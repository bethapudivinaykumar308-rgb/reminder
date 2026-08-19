import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut as firebaseSignOut
} from 'firebase/auth';
import {
  getFirestore, initializeFirestore,
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  Firestore
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';
import { Consumer, DispatchLog, ReminderTemplate, UtilitySettings } from '../types';
import { INITIAL_CONSUMERS, DEFAULT_SETTINGS, DEFAULT_TEMPLATES } from '../data/sampleDataset';

// Initialize Firebase App
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const auth = getAuth(app);

// Database initialization
let firestoreDb: Firestore;
try {
  firestoreDb = initializeFirestore(app, { experimentalForceLongPolling: true }, 'ai-studio-electricitybills-5e160414-7db0-4994-bad7-47dc4a6b3e30');
} catch (e) {
  try {
    firestoreDb = getFirestore(app, 'ai-studio-electricitybills-5e160414-7db0-4994-bad7-47dc4a6b3e30');
  } catch (e2) {
    firestoreDb = getFirestore(app);
  }
}
export const db = firestoreDb;

// Google Auth Provider with Workspace Scopes
export const provider = new GoogleAuthProvider();
provider.addScope('https://www.googleapis.com/auth/spreadsheets');
provider.addScope('https://www.googleapis.com/auth/drive.readonly');
provider.addScope('https://www.googleapis.com/auth/gmail.send');
provider.addScope('https://www.googleapis.com/auth/calendar.events');
provider.addScope('https://www.googleapis.com/auth/documents');
provider.addScope('https://www.googleapis.com/auth/contacts.readonly');

// In-Memory Token Caching
let cachedAccessToken: string | null = null;
let isSigningIn = false;

export const initAuth = (
  onAuthSuccess?: (user: User, token: string | null) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    if (user) {
      if (onAuthSuccess) onAuthSuccess(user, cachedAccessToken);
    } else {
      cachedAccessToken = null;
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string | null } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    cachedAccessToken = credential?.accessToken || null;
    return { user: result.user, accessToken: cachedAccessToken };
  } catch (error: any) {
    if (
      error?.code === 'auth/popup-closed-by-user' ||
      error?.code === 'auth/cancelled-popup-request' ||
      error?.code === 'auth/popup-blocked' ||
      error?.message?.includes('popup-closed-by-user')
    ) {
      console.log('Google Sign-in popup closed by user.');
      return null;
    }
    console.error('Firebase Auth sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getAccessToken = (): string | null => {
  return cachedAccessToken;
};

export const logout = async () => {
  await firebaseSignOut(auth);
  cachedAccessToken = null;
};

// ==================== FIRESTORE DATA HELPERS ====================

const LOCAL_STORAGE_CONSUMERS_KEY = 'eb_unpaid_consumers_v1';
const LOCAL_STORAGE_LOGS_KEY = 'eb_dispatch_logs_v1';
const LOCAL_STORAGE_TEMPLATES_KEY = 'eb_templates_v1';
const LOCAL_STORAGE_SETTINGS_KEY = 'eb_settings_v1';

// Consumers Collection Listener
export const subscribeConsumers = (onData: (consumers: Consumer[]) => void) => {
  try {
    const q = query(collection(db, 'consumers'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: Consumer[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<Consumer, 'id'>) });
          });
          onData(list);
          try {
            localStorage.setItem(LOCAL_STORAGE_CONSUMERS_KEY, JSON.stringify(list));
          } catch (_) {}
        } else {
          // Initialize with default sample if empty
          const savedLocal = localStorage.getItem(LOCAL_STORAGE_CONSUMERS_KEY);
          if (savedLocal) {
            try {
              onData(JSON.parse(savedLocal));
            } catch {
              onData(INITIAL_CONSUMERS);
            }
          } else {
            onData(INITIAL_CONSUMERS);
            // Auto seed sample data to Firestore
            seedInitialData();
          }
        }
      },
      (error) => {
        console.warn('Firestore consumers subscription fallback to local storage:', error.message);
        const saved = localStorage.getItem(LOCAL_STORAGE_CONSUMERS_KEY);
        onData(saved ? JSON.parse(saved) : INITIAL_CONSUMERS);
      }
    );
  } catch (err) {
    console.warn('Firestore not reachable, using offline dataset:', err);
    const saved = localStorage.getItem(LOCAL_STORAGE_CONSUMERS_KEY);
    onData(saved ? JSON.parse(saved) : INITIAL_CONSUMERS);
    return () => {};
  }
};

export const seedInitialData = async () => {
  try {
    for (const c of INITIAL_CONSUMERS) {
      await setDoc(doc(db, 'consumers', c.id), c);
    }
    for (const t of DEFAULT_TEMPLATES) {
      await setDoc(doc(db, 'reminder_templates', t.id), t);
    }
    await setDoc(doc(db, 'settings', 'config'), DEFAULT_SETTINGS);
  } catch (err) {
    console.warn('Error seeding Firestore initial dataset:', err);
  }
};

export const saveConsumer = async (consumer: Consumer): Promise<void> => {
  try {
    await setDoc(doc(db, 'consumers', consumer.id), consumer);
  } catch (err) {
    console.warn('Firestore write error, saving to local state:', err);
    const current = getLocalConsumers();
    const idx = current.findIndex((c) => c.id === consumer.id);
    if (idx >= 0) current[idx] = consumer;
    else current.unshift(consumer);
    localStorage.setItem(LOCAL_STORAGE_CONSUMERS_KEY, JSON.stringify(current));
  }
};

export const saveConsumersBatch = async (consumers: Consumer[]): Promise<void> => {
  for (const c of consumers) {
    await saveConsumer(c);
  }
};

export const deleteConsumer = async (id: string): Promise<void> => {
  try {
    await deleteDoc(doc(db, 'consumers', id));
  } catch (err) {
    console.warn('Firestore delete error, removing from local state:', err);
    const current = getLocalConsumers().filter((c) => c.id !== id);
    localStorage.setItem(LOCAL_STORAGE_CONSUMERS_KEY, JSON.stringify(current));
  }
};

export const getLocalConsumers = (): Consumer[] => {
  try {
    const saved = localStorage.getItem(LOCAL_STORAGE_CONSUMERS_KEY);
    return saved ? JSON.parse(saved) : INITIAL_CONSUMERS;
  } catch {
    return INITIAL_CONSUMERS;
  }
};

// Dispatch Logs
export const subscribeDispatchLogs = (onData: (logs: DispatchLog[]) => void) => {
  try {
    const q = query(collection(db, 'dispatch_logs'), orderBy('timestamp', 'desc'));
    return onSnapshot(
      q,
      (snapshot) => {
        const list: DispatchLog[] = [];
        snapshot.forEach((docSnap) => {
          list.push({ id: docSnap.id, ...(docSnap.data() as Omit<DispatchLog, 'id'>) });
        });
        onData(list);
        localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(list));
      },
      (error) => {
        console.warn('Firestore dispatch logs subscription fallback:', error.message);
        const saved = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
        onData(saved ? JSON.parse(saved) : []);
      }
    );
  } catch (err) {
    const saved = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    onData(saved ? JSON.parse(saved) : []);
    return () => {};
  }
};

export const addDispatchLog = async (log: DispatchLog): Promise<void> => {
  try {
    await setDoc(doc(db, 'dispatch_logs', log.id), log);
  } catch (err) {
    console.warn('Firestore log write error, caching locally:', err);
    const saved = localStorage.getItem(LOCAL_STORAGE_LOGS_KEY);
    const current: DispatchLog[] = saved ? JSON.parse(saved) : [];
    current.unshift(log);
    localStorage.setItem(LOCAL_STORAGE_LOGS_KEY, JSON.stringify(current));
  }
};

// Templates
export const subscribeTemplates = (onData: (templates: ReminderTemplate[]) => void) => {
  try {
    const q = query(collection(db, 'reminder_templates'));
    return onSnapshot(
      q,
      (snapshot) => {
        if (!snapshot.empty) {
          const list: ReminderTemplate[] = [];
          snapshot.forEach((docSnap) => {
            list.push({ id: docSnap.id, ...(docSnap.data() as Omit<ReminderTemplate, 'id'>) });
          });
          onData(list);
          localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(list));
        } else {
          onData(DEFAULT_TEMPLATES);
        }
      },
      () => {
        const saved = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
        onData(saved ? JSON.parse(saved) : DEFAULT_TEMPLATES);
      }
    );
  } catch {
    onData(DEFAULT_TEMPLATES);
    return () => {};
  }
};

export const saveTemplate = async (template: ReminderTemplate): Promise<void> => {
  try {
    await setDoc(doc(db, 'reminder_templates', template.id), template);
  } catch (err) {
    const saved = localStorage.getItem(LOCAL_STORAGE_TEMPLATES_KEY);
    const current: ReminderTemplate[] = saved ? JSON.parse(saved) : DEFAULT_TEMPLATES;
    const idx = current.findIndex((t) => t.id === template.id);
    if (idx >= 0) current[idx] = template;
    else current.push(template);
    localStorage.setItem(LOCAL_STORAGE_TEMPLATES_KEY, JSON.stringify(current));
  }
};

// Settings
export const subscribeSettings = (onData: (settings: UtilitySettings) => void) => {
  try {
    return onSnapshot(
      doc(db, 'settings', 'config'),
      (docSnap) => {
        if (docSnap.exists()) {
          onData(docSnap.data() as UtilitySettings);
        } else {
          onData(DEFAULT_SETTINGS);
        }
      },
      () => {
        const saved = localStorage.getItem(LOCAL_STORAGE_SETTINGS_KEY);
        onData(saved ? JSON.parse(saved) : DEFAULT_SETTINGS);
      }
    );
  } catch {
    onData(DEFAULT_SETTINGS);
    return () => {};
  }
};

export const saveSettings = async (settings: UtilitySettings): Promise<void> => {
  try {
    await setDoc(doc(db, 'settings', 'config'), settings);
  } catch (err) {
    localStorage.setItem(LOCAL_STORAGE_SETTINGS_KEY, JSON.stringify(settings));
  }
};
