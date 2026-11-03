import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

export const OperationType = {
  CREATE: 'create',
  UPDATE: 'update',
  DELETE: 'delete',
  LIST: 'list',
  GET: 'get',
  WRITE: 'write',
} as const;

export type OperationType = typeof OperationType[keyof typeof OperationType];

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

function handleFirestoreError(error: unknown, operationType: OperationType, pathStr: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: null,
      email: null,
      emailVerified: null,
      isAnonymous: null,
      tenantId: null,
      providerInfo: [],
    },
    operationType,
    path: pathStr,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Load Firebase configuration
const configPath = path.join(process.cwd(), 'firebase-applet-config.json');
let firebaseConfig: any = {};
try {
  if (fs.existsSync(configPath)) {
    firebaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  }
} catch (e) {
  console.warn('Failed to parse firebase-applet-config.json:', e);
}

const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val === undefined) {
        cleaned[key] = null;
      } else if (typeof val === 'object' && val !== null) {
        cleaned[key] = sanitizeForFirestore(val);
      } else {
        cleaned[key] = val;
      }
    }
    return cleaned;
  }
  return obj;
}

export const FirestoreChurchService = {
  // Get Church Info from Firestore
  async getChurchInfo(): Promise<any | null> {
    const docPath = 'church_info/main';
    try {
      const snap = await getDoc(doc(firestoreDb, 'church_info', 'main'));
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      console.warn('Error reading church_info from Firestore:', error);
      return null;
    }
  },

  // Save Church Info to Firestore
  async saveChurchInfo(data: any): Promise<void> {
    const docPath = 'church_info/main';
    try {
      const sanitized = sanitizeForFirestore({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(firestoreDb, 'church_info', 'main'), sanitized);
      console.log('Saved church_info successfully to Firestore!');
    } catch (error) {
      console.error('Failed to save church_info to Firestore:', error);
      try {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      } catch (e) {
        console.warn('Firestore write warning caught, continuing with local persistence');
      }
    }
  },

  // Get Spotlight / Hero Banner config from Firestore
  async getSpotlight(): Promise<any | null> {
    const docPath = 'spotlight/current';
    try {
      const snap = await getDoc(doc(firestoreDb, 'spotlight', 'current'));
      if (snap.exists()) {
        return snap.data();
      }
      return null;
    } catch (error) {
      console.warn('Error reading spotlight from Firestore:', error);
      return null;
    }
  },

  // Save Spotlight / Hero Banner config to Firestore
  async saveSpotlight(data: any): Promise<void> {
    const docPath = 'spotlight/current';
    try {
      const sanitized = sanitizeForFirestore({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(firestoreDb, 'spotlight', 'current'), sanitized);
      console.log('Saved spotlight banner successfully to Firestore!');
    } catch (error) {
      console.error('Failed to save spotlight to Firestore:', error);
      try {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      } catch (e) {
        console.warn('Firestore write warning caught, continuing with local persistence');
      }
    }
  },
};
