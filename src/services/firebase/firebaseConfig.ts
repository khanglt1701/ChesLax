import { getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { browserLocalPersistence, getAuth, setPersistence, signInAnonymously } from 'firebase/auth';
import { getDatabase, type Database } from 'firebase/database';

let signingIn: Promise<string> | null = null;

export function isFirebaseConfigured(): boolean {
  const env = import.meta.env;
  return Boolean(env.VITE_FIREBASE_API_KEY && env.VITE_FIREBASE_DATABASE_URL && env.VITE_FIREBASE_PROJECT_ID && env.VITE_FIREBASE_APP_ID);
}

export function getFirebaseApp(): FirebaseApp {
  if (!isFirebaseConfigured()) {
    throw new Error('Chưa có cấu hình Firebase. Thêm các biến VITE_FIREBASE_* rồi tải lại trang.');
  }
  const existing = getApps()[0];
  if (existing) return existing;
  return initializeApp({
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
  });
}

export function getDb(): Database {
  return getDatabase(getFirebaseApp());
}

export function ensurePlayer(): Promise<string> {
  if (!signingIn) {
    signingIn = signIn().catch((error: unknown) => {
      signingIn = null;
      throw error;
    });
  }
  return signingIn;
}

async function signIn(): Promise<string> {
  const auth = getAuth(getFirebaseApp());
  await setPersistence(auth, browserLocalPersistence);
  try {
    if (!auth.currentUser) await signInAnonymously(auth);
  } catch (error) {
    throw friendlyAuthError(error);
  }
  const uid = auth.currentUser?.uid;
  if (!uid) throw new Error('Không tạo được phiên chơi ẩn danh.');
  return uid;
}

function friendlyAuthError(error: unknown): Error {
  const code = typeof error === 'object' && error && 'code' in error ? String((error as { code: unknown }).code) : '';
  if (code === 'auth/configuration-not-found') {
    return new Error('Firebase Authentication chưa được bật. Trong Firebase console, mở Authentication, bấm Get started, rồi bật nhà cung cấp Anonymous.');
  }
  if (code === 'auth/operation-not-allowed' || code === 'auth/admin-restricted-operation') {
    return new Error('Đăng nhập ẩn danh đang tắt. Bật Anonymous trong Firebase Authentication.');
  }
  return error instanceof Error ? error : new Error('Không tạo được phiên chơi ẩn danh.');
}
