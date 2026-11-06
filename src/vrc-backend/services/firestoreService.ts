import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDoc, getDocFromServer, setDoc } from 'firebase/firestore';
import staticFirebaseConfig from '../../../firebase-applet-config.json';

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

const firebaseConfig: any = staticFirebaseConfig || {};
const firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const firestoreDb = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

// Validate connection to Firestore at boot
async function testConnection() {
  try {
    await getDocFromServer(doc(firestoreDb, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.error('Please check your Firebase configuration.');
    }
  }
}
testConnection();

export function sanitizeForFirestore(obj: any): any {
  if (obj === null || obj === undefined) return null;
  if (obj instanceof Date) {
    return obj.toISOString();
  }
  if (Array.isArray(obj)) {
    return obj.map(sanitizeForFirestore);
  }
  if (typeof obj === 'object') {
    const cleaned: any = {};
    for (const [key, val] of Object.entries(obj)) {
      if (val === undefined) {
        cleaned[key] = null;
      } else if (val instanceof Date) {
        cleaned[key] = val.toISOString();
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
  async getChurchInfo(env: string = 'production'): Promise<any | null> {
    try {
      const docName = env === 'development' ? 'main_dev' : 'main';
      let snap = await getDoc(doc(firestoreDb, 'church_info', docName));
      if (snap.exists()) {
        return snap.data();
      }
      // If dev doc doesn't exist yet, fall back to production doc as seed
      if (env === 'development') {
        const prodSnap = await getDoc(doc(firestoreDb, 'church_info', 'main'));
        if (prodSnap.exists()) {
          return prodSnap.data();
        }
      }
      return null;
    } catch (error) {
      console.warn('Error reading church_info from Firestore:', error);
      return null;
    }
  },

  // Save Church Info to Firestore
  async saveChurchInfo(data: any, env: string = 'production'): Promise<void> {
    const docName = env === 'development' ? 'main_dev' : 'main';
    const docPath = `church_info/${docName}`;
    try {
      const sanitized = sanitizeForFirestore({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(firestoreDb, 'church_info', docName), sanitized);
    } catch (error) {
      console.error(`Failed to save church_info [${env}] to Firestore:`, error);
      try {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      } catch {
        console.warn('Firestore write warning caught, continuing with local persistence');
      }
    }
  },

  // Get Spotlight / Hero Banner config from Firestore
  async getSpotlight(env: string = 'production'): Promise<any | null> {
    try {
      const docName = env === 'development' ? 'current_dev' : 'current';
      let snap = await getDoc(doc(firestoreDb, 'spotlight', docName));
      if (snap.exists()) {
        return snap.data();
      }
      // If dev doc doesn't exist yet, fall back to production doc as seed
      if (env === 'development') {
        const prodSnap = await getDoc(doc(firestoreDb, 'spotlight', 'current'));
        if (prodSnap.exists()) {
          return prodSnap.data();
        }
      }
      return null;
    } catch (error) {
      console.warn('Error reading spotlight from Firestore:', error);
      return null;
    }
  },

  // Save Spotlight / Hero Banner config to Firestore
  async saveSpotlight(data: any, env: string = 'production'): Promise<void> {
    const docName = env === 'development' ? 'current_dev' : 'current';
    const docPath = `spotlight/${docName}`;
    try {
      const sanitized = sanitizeForFirestore({
        ...data,
        updatedAt: new Date().toISOString(),
      });
      await setDoc(doc(firestoreDb, 'spotlight', docName), sanitized);
    } catch (error) {
      console.error(`Failed to save spotlight [${env}] to Firestore:`, error);
      try {
        handleFirestoreError(error, OperationType.WRITE, docPath);
      } catch {
        console.warn('Firestore write warning caught, continuing with local persistence');
      }
    }
  },
};
