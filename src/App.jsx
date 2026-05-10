import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection, addDoc, getDocs, getDoc } from "firebase/firestore";

// ⚠️ ใช้ Firebase Config ของคุณโดยตรง
const myFirebaseConfig = {
  apiKey: "AIzaSyA0IFm6icc-QG4ZC2WiuhRa2YquISGH9FM",
  authDomain: "mdec-stock-app.firebaseapp.com",
  projectId: "mdec-stock-app",
  storageBucket: "mdec-stock-app.firebasestorage.app",
  messagingSenderId: "283888438624",
  appId: "1:283888438624:web:6cfe60c58d94dc00fda205"
};

const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : myFirebaseConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// 💡 Smart Database Router
const IS_CANVAS = typeof __app_id !== 'undefined';
const APP_ID = IS_CANVAS ? __app_id : 'default-app-id';

const getItemsCol = () => IS_CANVAS ? collection(db, 'artifacts', APP_ID, 'public', 'data', 'items') : collection(db, 'mdec_stock', 'shared_data', 'items');
const getSettingsDoc = () => IS_CANVAS ? doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'global') : doc(db, 'mdec_stock', 'shared_data', 'settings', 'global');
const getAuditCol = () => IS_CANVAS ? collection(db, 'artifacts', APP_ID, 'public', 'data', 'audit_logs') : collection(db, 'mdec_stock', 'shared_data', 'audit_logs');
const getItemDoc = (id) => IS_CANVAS ? doc(db, 'artifacts', APP_ID, 'public', 'data', 'items', id) : doc(db, 'mdec_stock', 'shared_data', 'items', id);
const getProofsCol = () => IS_CANVAS ? collection(db, 'artifacts', APP_ID, 'public', 'data', 'proofs') : collection(db, 'mdec_stock', 'shared_data', 'proofs');
const getProofDoc = (id) => IS_CANVAS ? doc(db, 'artifacts', APP_ID, 'public', 'data', 'proofs', id) : doc(db, 'mdec_stock', 'shared_data', 'proofs', id);
const getBorrowDocsCol = () => IS_CANVAS ? collection(db, 'artifacts', APP_ID, 'public', 'data', 'borrow_documents') : collection(db, 'mdec_stock', 'shared_data', 'borrow_documents');
const getBorrowDoc = (id) => IS_CANVAS ? doc(db, 'artifacts', APP_ID, 'public', 'data', 'borrow_documents', id) : doc(db, 'mdec_stock', 'shared_data', 'borrow_documents', id);

const ADMIN_PIN = 'mdec8203';
const INACTIVITY_LOGOUT_MS = 2 * 60 * 60 * 1000; // ออกจากSystemอัตโนมัติเมื่อไม่ใช้งาน 2 ชั่วโมง
const WEAK_PIN_LIST = ['0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1234','12345','123456','654321','4321','1122','1212','999999'];
const APP_VERSION = 'v22.50.14 QR Mobile Scan Restore';
const APP_UPDATE_NOTE = 'กู้คืนพื้นที่กล้อง QR ให้สแกนติดง่ายขึ้น หลังจากรอบก่อนย่อพรีวิวมากเกินไป โดยยังปรับเฉพาะ UI/Layout และไม่แตะระบบกล้อง';
// วางไฟล์โลโก้ศูนย์ไว้ที่ public/mdec-logo.png ถ้าไม่มีไฟล์ Systemจะ fallback เป็นไอคอนกล่องเดิม
const ORG_LOGO_SRC = '/mdec-logo.png';
const DEFAULT_PROOF_SETTINGS = { targetKB: 150, warnKB: 250, maxKB: 500, maxImagesPerAction: 3, maxSide: 1000, borrowRequirement: 'recommended', eventRequirement: 'recommended', returnRequirement: 'recommended' };
const DEFAULT_DOCUMENT_SETTINGS = { qrLogo: true, slipLogo: true, boxLabelLogo: true, proofStamp: true, watermark: true, logoSize: 'normal', printTone: 'official' };
const DEFAULT_UI_SETTINGS = { density: 'comfortable', cleanMode: true, mobileCards: true, reduceEffects: false };

const Icons = {
  Plus: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Search: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Edit: ({ className = "" }) => <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: ({ className = "" }) => <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Package: ({ className = "" }) => <svg className={`w-6 h-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Alert: ({ className = "" }) => <svg className={`w-12 h-12 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Settings: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>,
  Database: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <ellipse cx="12" cy="5" rx="7" ry="3" strokeWidth={2} />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 5v6c0 1.657 3.134 3 7 3s7-1.343 7-3V5" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 11v6c0 1.657 3.134 3 7 3s7-1.343 7-3v-6" />
  </svg>,
  X: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Tag: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  History: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  UserPlus: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  CheckCircle: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Unlock: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  Lock: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Download: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Upload: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  ClipboardList: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Folder: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  ViewGrid: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Camera: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  VideoCamera: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Speaker: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>,
  Users: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Signal: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>,
  Eye: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  EyeOff: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
  Sun: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Moon: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  Layers: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Monitor: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Truck: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.92l-1.09-1.09A4 4 0 0 0 16.92 9H14v8h2"/><circle cx="8.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/></svg>,
  QrCode: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m-4 8h.01M16 12h.01M8 16h.01M16 16h.01M4 4h6v6H4V4zm10 0h6v6h-6V4zM4 14h6v6H4v-6z" /></svg>,
  Printer: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" /></svg>
};

const STATUSES = [
  { id: 'available', label: 'พร้อมใช้', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', darkColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-800' },
  { id: 'in-use', label: 'กำลังใช้งาน', color: 'bg-amber-100 text-amber-700 border-amber-200', darkColor: 'bg-amber-900/40 text-amber-400 border-amber-800' },
  { id: 'borrowed', label: 'ถูกยืม', color: 'bg-purple-100 text-purple-700 border-purple-200', darkColor: 'bg-purple-900/40 text-purple-400 border-purple-800' },
  { id: 'out-for-event', label: 'ออกงาน', color: 'bg-orange-100 text-orange-700 border-orange-200', darkColor: 'bg-orange-900/40 text-orange-400 border-orange-800' },
  { id: 'maintenance', label: 'ซ่อม/ชำรุด', color: 'bg-rose-100 text-rose-700 border-rose-200', darkColor: 'bg-rose-900/40 text-rose-400 border-rose-800' }
];

const DEPARTMENTS = [
  { id: 'ภาพนิ่ง', label: 'ฝ่ายภาพนิ่ง', color: 'bg-blue-100 text-blue-700', darkColor: 'bg-blue-900/40 text-blue-400', iconName: 'Camera', iconColor: 'text-blue-500' },
  { id: 'วิดีโอ', label: 'ฝ่ายวิดีโอ', color: 'bg-indigo-100 text-indigo-700', darkColor: 'bg-indigo-900/40 text-indigo-400', iconName: 'VideoCamera', iconColor: 'text-indigo-500' },
  { id: 'เครื่องเสียง', label: 'ฝ่ายอุปกรณ์เครื่องเสียง', color: 'bg-cyan-100 text-cyan-700', darkColor: 'bg-cyan-900/40 text-cyan-400', iconName: 'Speaker', iconColor: 'text-cyan-500' },
  { id: 'ห้องประชุม', label: 'ห้องประชุม', color: 'bg-sky-100 text-sky-700', darkColor: 'bg-sky-900/40 text-sky-400', iconName: 'Users', iconColor: 'text-sky-500' },
  { id: 'ob-live', label: 'OB-LIVE', color: 'bg-violet-100 text-violet-700', darkColor: 'bg-violet-900/40 text-violet-400', iconName: 'Signal', iconColor: 'text-violet-500' }
];


const ASSET_STATUSES = [
  { id: 'active', label: 'ใช้งานอยู่', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', darkColor: 'bg-emerald-900/35 text-emerald-300 border-emerald-800' },
  { id: 'disposed', label: 'จำหน่ายแล้ว', color: 'bg-slate-100 text-slate-600 border-slate-200', darkColor: 'bg-slate-800 text-slate-300 border-slate-700' },
  { id: 'lost', label: 'สูญหาย', color: 'bg-rose-100 text-rose-700 border-rose-200', darkColor: 'bg-rose-900/35 text-rose-300 border-rose-800' },
  { id: 'pending_disposal', label: 'ชำรุดรอจำหน่าย', color: 'bg-amber-100 text-amber-700 border-amber-200', darkColor: 'bg-amber-900/35 text-amber-300 border-amber-800' }
];


function SmartOptionInput({
  label,
  value,
  options = [],
  onChange,
  placeholder = 'พิมพ์ค้นหา หรือกดดูรายการทั้งหมด',
  helper = '',
  theme = {},
  isDarkMode = false,
  icon = '🔎',
  required = false
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [browseAll, setBrowseAll] = useState(false);
  const query = String(value || '');
  const normalizedQuery = query.trim().toLowerCase();

  const cleanOptions = useMemo(() => {
    return [...new Set((options || [])
      .map(v => String(v || '').trim())
      .filter(Boolean)
      .filter(v => v !== 'อื่นๆ'))]
      .sort((a, b) => a.localeCompare(b, 'th', { numeric: true }));
  }, [options]);

  const matchedOptions = useMemo(() => {
    if (browseAll || !normalizedQuery) return cleanOptions;
    const starts = cleanOptions.filter(v => v.toLowerCase().startsWith(normalizedQuery));
    const contains = cleanOptions.filter(v => !v.toLowerCase().startsWith(normalizedQuery) && v.toLowerCase().includes(normalizedQuery));
    return [...starts, ...contains];
  }, [cleanOptions, normalizedQuery, browseAll]);

  const frequentOptions = useMemo(() => {
    const selected = query && cleanOptions.includes(query) ? [query] : [];
    return [...new Set([...selected, ...cleanOptions])].slice(0, 6);
  }, [cleanOptions, query]);

  const exactMatch = cleanOptions.some(v => v.toLowerCase() === normalizedQuery);
  const textTitle = theme.textTitle || (isDarkMode ? 'text-white' : 'text-slate-900');
  const textMuted = theme.textMuted || (isDarkMode ? 'text-slate-400' : 'text-slate-500');

  const shellClass = isDarkMode
    ? 'bg-slate-950 border-slate-700'
    : 'bg-white border-slate-200';
  const inputClass = isDarkMode
    ? 'bg-transparent text-white placeholder:text-slate-500'
    : 'bg-transparent text-slate-800 placeholder:text-slate-400';
  const softBtnClass = isDarkMode
    ? 'bg-slate-900 border-slate-700 text-slate-200 hover:bg-slate-800'
    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-white hover:border-blue-200';
  const selectedChipClass = isDarkMode
    ? 'bg-blue-500/15 border-blue-500/35 text-blue-200'
    : 'bg-blue-50 border-blue-200 text-blue-700';
  const chipClass = isDarkMode
    ? 'bg-slate-900 border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white'
    : 'bg-white border-slate-200 text-slate-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200';

  const selectValue = (option) => {
    onChange(option);
    setIsOpen(false);
    setBrowseAll(false);
  };

  const containPickerWheel = (event) => {
    const el = event.currentTarget;
    event.stopPropagation();
    if (!el || !el.scrollHeight) return;
    const canScroll = el.scrollHeight > el.clientHeight + 1;
    if (!canScroll) {
      event.preventDefault();
      return;
    }
    const deltaY = event.deltaY || 0;
    const atTop = el.scrollTop <= 0;
    const atBottom = Math.ceil(el.scrollTop + el.clientHeight) >= el.scrollHeight;
    if ((deltaY < 0 && atTop) || (deltaY > 0 && atBottom)) {
      event.preventDefault();
    }
  };

  return (
    <div className="relative smart-combobox-field">
      <div className="flex items-end justify-between gap-3 mb-2">
        <label className={`block text-sm sm:text-base font-black ${textTitle}`}>
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
        <span className={`hidden sm:inline text-[11px] font-bold ${textMuted}`}>
          ค้นหาได้ / เลื่อนเลือกได้
        </span>
      </div>

      <div className={`smart-picker-shell rounded-2xl border shadow-sm overflow-hidden transition-all ${shellClass} ${isOpen ? 'ring-2 ring-blue-500/20 border-blue-400/60' : ''}`}>
        <div className="p-3 space-y-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className={`w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0 ${isDarkMode ? 'bg-slate-900 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>{icon}</span>
            <input
              type="text"
              className={`min-w-0 flex-1 min-h-[40px] outline-none font-bold text-sm sm:text-base ${inputClass}`}
              placeholder={placeholder}
              value={query}
              onFocus={() => {
                setIsOpen(true);
                setBrowseAll(false);
              }}
              onChange={(e) => {
                onChange(e.target.value);
                setBrowseAll(false);
                setIsOpen(true);
              }}
              onBlur={() => window.setTimeout(() => setIsOpen(false), 180)}
            />
            {query && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange('');
                  setBrowseAll(true);
                  setIsOpen(true);
                }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center font-black shrink-0 ${isDarkMode ? 'bg-slate-900 text-slate-400 hover:bg-slate-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                title="ล้างค่า"
              >×</button>
            )}
          </div>
          <div className="flex items-center justify-between gap-2 pl-11">
            <div className={`text-[11px] font-bold truncate ${textMuted}`}>
              {query ? 'กำลังค้นหาจากคำที่พิมพ์' : 'พิมพ์ค้นหา หรือกดดูทั้งหมด'}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setBrowseAll(false);
                  setIsOpen(true);
                }}
                className={`h-8 px-3 rounded-xl border items-center justify-center font-black text-[11px] shrink-0 ${softBtnClass}`}
                title="ค้นหาจากคำที่พิมพ์"
              >ค้นหา</button>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  setBrowseAll(true);
                  setIsOpen(true);
                }}
                className={`h-8 px-3 rounded-xl border inline-flex items-center justify-center font-black text-[11px] shrink-0 ${softBtnClass}`}
                title="เปิดรายการทั้งหมดเพื่อเลื่อนเลือก"
              >ทั้งหมด</button>
            </div>
          </div>
        </div>

        {frequentOptions.length > 0 && (
          <div className={`px-3 pb-3 pt-2 border-t ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className={`text-[11px] font-black mb-2 ${textMuted}`}>ใช้บ่อย / เลือกเร็ว</div>
            <div className="flex flex-wrap gap-2">
              {frequentOptions.map(option => (
                <button
                  key={option}
                  type="button"
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => selectValue(option)}
                  className={`px-3 py-1.5 rounded-full border text-xs font-black whitespace-nowrap transition-colors ${String(value || '') === option ? selectedChipClass : chipClass}`}
                  title={option}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {isOpen && (
        <div
          onWheel={containPickerWheel}
          onTouchMove={(e) => e.stopPropagation()}
          style={{ overscrollBehavior: 'contain' }}
          className={`smart-picker-panel absolute z-[10020] mt-2 w-full rounded-3xl border shadow-2xl overflow-hidden max-sm:fixed max-sm:inset-x-3 max-sm:bottom-3 max-sm:top-auto max-sm:w-auto max-sm:max-h-[72vh] ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-200'}`}
        >
          <div className={`px-4 py-3 flex items-center justify-between gap-3 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
            <div className="min-w-0">
              <div className={`text-sm font-black truncate ${textTitle}`}>{label}</div>
              <div className={`text-[11px] font-bold ${textMuted}`}>
                {browseAll || !normalizedQuery ? 'เลื่อนเลือกจากรายการทั้งหมด' : 'ผลการค้นหา / กดเลือกได้เลย'}
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className={`px-2.5 py-1 rounded-full text-[11px] font-black ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500 border border-slate-200'}`}>
                {matchedOptions.length.toLocaleString('th-TH')} รายการ
              </span>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => setIsOpen(false)}
                className={`sm:hidden w-8 h-8 rounded-xl flex items-center justify-center font-black ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-white text-slate-500 border border-slate-200'}`}
              >×</button>
            </div>
          </div>

          {frequentOptions.length > 0 && (
            <div className={`px-4 py-3 border-b ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
              <div className={`text-[11px] font-black mb-2 ${textMuted}`}>รายการที่ใช้บ่อย</div>
              <div className="flex flex-wrap gap-2">
                {frequentOptions.map(option => (
                  <button
                    key={`sheet_${option}`}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => selectValue(option)}
                    className={`px-3 py-2 rounded-full border text-xs font-black whitespace-nowrap transition-colors ${String(value || '') === option ? selectedChipClass : chipClass}`}
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div
            onWheel={containPickerWheel}
            onTouchMove={(e) => e.stopPropagation()}
            style={{ overscrollBehavior: 'contain' }}
            className="smart-picker-list max-h-72 max-sm:max-h-[46vh] overflow-y-auto custom-scrollbar p-2 space-y-1"
          >
            {matchedOptions.map(option => (
              <button
                key={option}
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectValue(option)}
                className={`w-full text-left px-4 py-3 rounded-2xl font-black transition-colors flex items-center justify-between gap-3 ${String(value || '') === option ? 'bg-blue-600 text-white' : isDarkMode ? 'text-slate-200 hover:bg-slate-800' : 'text-slate-700 hover:bg-blue-50'}`}
              >
                <span className="truncate">{option}</span>
                {String(value || '') === option && <span className="text-xs font-black opacity-90">เลือกอยู่</span>}
              </button>
            ))}
            {normalizedQuery && !exactMatch && !browseAll && (
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => selectValue(query.trim())}
                className={`w-full text-left px-4 py-3 rounded-2xl font-black border border-dashed ${isDarkMode ? 'border-blue-800 text-blue-300 bg-blue-950/25 hover:bg-blue-900/30' : 'border-blue-200 text-blue-700 bg-blue-50 hover:bg-blue-100'}`}
              >
                + ใช้ / เพิ่ม “{query.trim()}”
              </button>
            )}
            {!matchedOptions.length && !normalizedQuery && (
              <div className={`px-4 py-5 text-sm font-bold ${textMuted}`}>ยังไม่มีรายการ ให้พิมพ์ชื่อใหม่ได้เลย</div>
            )}
            {!matchedOptions.length && normalizedQuery && !browseAll && (
              <div className={`px-4 py-5 text-sm font-bold ${textMuted}`}>ไม่พบรายการเดิม กดเพิ่มชื่อใหม่ด้านล่างได้เลย</div>
            )}
          </div>

          <div className={`px-4 py-3 text-[11px] font-bold border-t ${isDarkMode ? 'border-slate-800 text-slate-500 bg-slate-900/60' : 'border-slate-100 text-slate-500 bg-slate-50'}`}>
            พิมพ์เพื่อค้นหา • กด “ทั้งหมด” เพื่อเลื่อนเลือก • พิมพ์ชื่อใหม่แล้วบันทึกได้
          </div>
        </div>
      )}

      {helper && <p className={`text-xs font-bold mt-2 ${textMuted}`}>{helper}</p>}
    </div>
  );
}

function FactoryPolishStyle({ isDarkMode }) {
  return (
    <style>{`
      .factory-stock-polish {
        --factory-bg: #f4f7fb;
        --factory-card: #ffffff;
        --factory-border: #dbe3ee;
        --factory-text: #0f172a;
        --factory-muted: #64748b;
        --factory-blue: #2563eb;
        --factory-blue-soft: #eff6ff;
        --factory-shadow: 0 22px 55px rgba(15,23,42,.08);
        --factory-shadow-soft: 0 10px 30px rgba(15,23,42,.06);
        background:
          linear-gradient(180deg, #f8fafc 0%, var(--factory-bg) 100%) !important;
      }
      .factory-stock-polish[data-polish-theme="dark"] {
        --factory-bg: #020617;
        --factory-card: #0f172a;
        --factory-border: #334155;
        --factory-text: #f8fafc;
        --factory-muted: #94a3b8;
        --factory-blue-soft: rgba(37,99,235,.16);
        --factory-shadow: 0 22px 60px rgba(0,0,0,.35);
        --factory-shadow-soft: 0 10px 30px rgba(0,0,0,.24);
        background:
          linear-gradient(180deg, #020617 0%, var(--factory-bg) 100%) !important;
      }
      .factory-stock-polish, .factory-stock-polish * {
        letter-spacing: -.01em;
      }
      .factory-stock-polish :is(button, input, select, textarea) {
        font-family: inherit;
      }
      .factory-stock-polish :is(input:not([type="checkbox"]):not([type="radio"]), select, textarea):not(.stock-check) {
        min-height: 44px;
        border-radius: 16px !important;
        box-shadow: inset 0 1px 0 rgba(255,255,255,.55);
      }
      .factory-stock-polish button {
        outline: none;
        will-change: transform;
      }
      .factory-stock-polish button:active {
        transform: translateY(1px) scale(.99);
      }
      .factory-stock-polish .solid-workspace,
      .factory-stock-polish .solid-panel,
      .factory-stock-polish table,
      .factory-stock-polish thead,
      .factory-stock-polish tbody,
      .factory-stock-polish tr,
      .factory-stock-polish td,
      .factory-stock-polish th {
        backdrop-filter: none !important;
      }
      .factory-stock-polish .stock-table-compact th {
        font-size: 12px;
        letter-spacing: .03em;
        white-space: nowrap;
      }
      .factory-stock-polish .stock-table-compact td {
        vertical-align: middle;
      }
      .factory-stock-polish .stock-name-line {
        display: flex;
        align-items: center;
        gap: 8px;
        flex-wrap: wrap;
      }
      .factory-stock-polish .stock-name-line .stock-title {
        font-size: 16px;
        line-height: 1.25;
        font-weight: 900;
      }
      .factory-stock-polish .stock-meta-line {
        font-size: 12px;
        line-height: 1.35;
      }
      .factory-stock-polish .workspace-tabbar {
        scrollbar-width: thin;
      }
      .factory-stock-polish .workspace-action-card:hover {
        transform: translateY(-1px);
      }
      .factory-stock-polish .factory-topbar {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 18px;
        padding: 24px 0 10px;
      }
      .factory-stock-polish .factory-page-title {
        min-width: 0;
      }
      .factory-stock-polish .factory-kicker {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--factory-blue);
        font-size: 12px;
        font-weight: 900;
        letter-spacing: .12em;
        text-transform: uppercase;
        margin-bottom: 4px;
      }
      .factory-stock-polish .factory-dot {
        width: 8px;
        height: 8px;
        border-radius: 999px;
        background: var(--factory-blue);
        box-shadow: 0 0 0 5px rgba(37,99,235,.12);
      }
      .factory-stock-polish .factory-page-title h1 {
        margin: 0;
        color: var(--factory-text);
        font-size: clamp(28px, 3vw, 42px);
        line-height: 1.05;
        font-weight: 950;
      }
      .factory-stock-polish .factory-page-title p {
        color: var(--factory-muted);
        margin: 8px 0 0;
        font-size: 13px;
        font-weight: 800;
      }
      .factory-stock-polish .factory-top-actions {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex-wrap: wrap;
        gap: 10px;
      }
      .factory-stock-polish .factory-chip,
      .factory-stock-polish .factory-icon-btn,
      .factory-stock-polish .factory-primary-btn,
      .factory-stock-polish .factory-ghost-btn,
      .factory-stock-polish .factory-danger-btn {
        min-height: 42px;
        border-radius: 16px;
        border: 1px solid var(--factory-border);
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        font-weight: 900;
        transition: transform .18s ease, box-shadow .18s ease, background .18s ease, border-color .18s ease;
        white-space: nowrap;
      }
      .factory-stock-polish .factory-chip {
        padding: 0 14px;
        color: #047857;
        background: #ecfdf5;
        border-color: #d1fae5;
      }
      .factory-stock-polish[data-polish-theme="dark"] .factory-chip {
        color: #86efac;
        background: rgba(6,78,59,.34);
        border-color: rgba(16,185,129,.24);
      }
      .factory-stock-polish .factory-icon-btn,
      .factory-stock-polish .factory-ghost-btn {
        background: var(--factory-card);
        color: var(--factory-text);
        box-shadow: var(--factory-shadow-soft);
      }
      .factory-stock-polish .factory-icon-btn { width: 44px; padding: 0; }
      .factory-stock-polish .factory-ghost-btn { padding: 0 14px; }
      .factory-stock-polish .factory-primary-btn {
        padding: 0 18px;
        color: white;
        border-color: rgba(37,99,235,.9);
        background: linear-gradient(135deg,#2563eb,#1d4ed8);
        box-shadow: 0 14px 30px rgba(37,99,235,.22);
      }
      .factory-stock-polish .factory-danger-btn {
        padding: 0 14px;
        color: #e11d48;
        background: #fff1f2;
        border-color: #ffe4e6;
      }
      .factory-stock-polish[data-polish-theme="dark"] .factory-danger-btn {
        color: #fda4af;
        background: rgba(127,29,29,.28);
        border-color: rgba(244,63,94,.24);
      }
      .factory-stock-polish .factory-primary-btn:hover,
      .factory-stock-polish .factory-ghost-btn:hover,
      .factory-stock-polish .factory-icon-btn:hover,
      .factory-stock-polish .factory-danger-btn:hover {
        transform: translateY(-1px);
        box-shadow: var(--factory-shadow);
      }
      .factory-stock-polish aside {
        background: linear-gradient(180deg,#020617 0%,#050b18 48%,#020617 100%) !important;
        box-shadow: 18px 0 50px rgba(15,23,42,.20);
      }
      .factory-stock-polish aside button { min-height: 46px; }
      .factory-stock-polish aside nav button:hover { background: rgba(255,255,255,.08) !important; }
      .factory-stock-polish .custom-scrollbar::-webkit-scrollbar { width: 9px; height: 9px; }
      .factory-stock-polish .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148,163,184,.55); border-radius: 999px; border: 3px solid transparent; background-clip: padding-box; }
      .factory-stock-polish .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
      .factory-stock-polish .smart-combobox-field,
      .factory-stock-polish .smart-picker-panel,
      .factory-stock-polish .smart-picker-list {
        overscroll-behavior: contain;
      }
      .factory-stock-polish .smart-picker-list {
        scroll-behavior: auto;
        -webkit-overflow-scrolling: touch;
      }
      .factory-stock-polish table { border-collapse: separate; border-spacing: 0; }
      .factory-stock-polish thead th {
        font-size: 11px !important;
        text-transform: uppercase;
        letter-spacing: .06em;
        font-weight: 950 !important;
      }
      .factory-stock-polish tbody tr { transition: background .18s ease, transform .18s ease; }
      .factory-stock-polish tbody tr:hover { background: rgba(37,99,235,.035) !important; }
      .factory-stock-polish[data-polish-theme="dark"] tbody tr:hover { background: rgba(37,99,235,.11) !important; }
      /* Solid UI: ปิดฟีลกระจกใส เพื่อให้อ่านง่ายขึ้นในงานจริง */
      .factory-stock-polish .backdrop-blur-sm,
      .factory-stock-polish .backdrop-blur-xl,
      .factory-stock-polish [class*="backdrop-blur"] {
        -webkit-backdrop-filter: none !important;
        backdrop-filter: none !important;
      }
      .factory-stock-polish :is(.shadow-slate-200\/80,.shadow-slate-200\/70) {
        box-shadow: 0 18px 44px rgba(15,23,42,.10) !important;
      }
      .factory-stock-polish[data-polish-theme="light"] :is(input:not([type="checkbox"]):not([type="radio"]), select, textarea):not(.stock-check) {
        background-color: #ffffff !important;
      }
      .factory-stock-polish[data-polish-theme="dark"] :is(input:not([type="checkbox"]):not([type="radio"]), select, textarea):not(.stock-check) {
        background-color: #020617 !important;
      }
      /* Checkbox + table divider cleanup: เอาเส้นขาวสั้น ๆ ข้างช่องติ๊กออก */
      .factory-stock-polish .stock-check,
      .factory-stock-polish input[type="checkbox"] {
        appearance: none !important;
        -webkit-appearance: none !important;
        width: 20px !important;
        height: 20px !important;
        min-width: 20px !important;
        min-height: 20px !important;
        max-width: 20px !important;
        max-height: 20px !important;
        border-radius: 6px !important;
        border: 1.5px solid #94a3b8 !important;
        background: #f8fafc !important;
        background-color: #f8fafc !important;
        display: inline-block !important;
        position: relative;
        cursor: pointer;
        flex: 0 0 auto;
        box-shadow: none !important;
        outline: none !important;
        margin: 0;
        padding: 0 !important;
        overflow: hidden;
      }
      .factory-stock-polish[data-polish-theme="dark"] .stock-check,
      .factory-stock-polish[data-polish-theme="dark"] input[type="checkbox"] {
        background: #e2e8f0 !important;
        background-color: #e2e8f0 !important;
        border-color: #64748b !important;
      }
      .factory-stock-polish .stock-check::before,
      .factory-stock-polish .stock-check::after,
      .factory-stock-polish input[type="checkbox"]::before,
      .factory-stock-polish input[type="checkbox"]::after {
        content: none !important;
        display: none !important;
      }
      .factory-stock-polish .stock-check:checked,
      .factory-stock-polish input[type="checkbox"]:checked {
        background: #4f46e5 !important;
        border-color: #6366f1 !important;
      }
      .factory-stock-polish .stock-check:checked::after,
      .factory-stock-polish input[type="checkbox"]:checked::after {
        content: "" !important;
        display: block !important;
        position: absolute;
        left: 6px;
        top: 2px;
        width: 6px;
        height: 11px;
        border: solid #ffffff;
        border-width: 0 2px 2px 0;
        transform: rotate(45deg);
      }
      .factory-stock-polish .stock-check:disabled,
      .factory-stock-polish input[type="checkbox"]:disabled {
        opacity: .55;
        cursor: not-allowed;
        background: #cbd5e1 !important;
        border-color: #475569 !important;
      }
      .factory-stock-polish .stock-check-disabled {
        width: 20px !important;
        height: 20px !important;
        min-width: 20px !important;
        min-height: 20px !important;
        border-radius: 6px !important;
        display: inline-flex;
        background: #475569;
        opacity: .70;
        box-shadow: none !important;
        border: 1px solid rgba(148,163,184,.35);
      }
      .factory-stock-polish[data-polish-theme="light"] .stock-check-disabled {
        background: #cbd5e1;
        opacity: .85;
        border-color: #94a3b8;
      }
      .factory-stock-polish .stock-select-cell {
        width: 56px;
        min-width: 56px;
        border-top: 0 !important;
        border-right: 0 !important;
        box-shadow: none !important;
        position: relative;
      }
      .factory-stock-polish .stock-select-cell .stock-check,
      .factory-stock-polish .stock-select-cell .stock-check-disabled {
        vertical-align: middle;
      }
      .factory-stock-polish .stock-select-cell::before,
      .factory-stock-polish .stock-select-cell::after {
        content: none !important;
        display: none !important;
      }
      .factory-stock-polish .stock-table-compact tbody > tr {
        border-top: 0 !important;
      }
      .factory-stock-polish .stock-table-compact tbody > tr + tr > td:not(.stock-select-cell) {
        border-top: 1px solid rgba(148,163,184,.18);
      }
      .factory-stock-polish[data-polish-theme="dark"] .stock-table-compact tbody > tr + tr > td:not(.stock-select-cell) {
        border-top-color: rgba(148,163,184,.15);
      }
      .factory-stock-polish .stock-mobile-card {
        isolation: isolate;
      }
      .factory-stock-polish .stock-mobile-select-col {
        width: 30px;
        min-width: 30px;
        display: flex;
        justify-content: center;
        align-items: flex-start;
        padding-top: 3px;
        border: 0 !important;
        box-shadow: none !important;
      }
      .factory-stock-polish .stock-mobile-select-col::before,
      .factory-stock-polish .stock-mobile-select-col::after {
        content: none !important;
        display: none !important;
      }
      .factory-stock-polish .purchase-project-card {
        background: var(--factory-card);
      }
      /* v22.49.4 definitive compact modal sizing */
      @media (min-width: 1024px) {
        .factory-stock-polish .compact-modal-shell.item-form-shell,
        .factory-stock-polish .compact-modal-shell.item-detail-shell {
          width: min(900px, calc(100vw - 112px)) !important;
          max-height: 84dvh !important;
        }
      }
      /* Compact modal polish: ลดขนาด Popup ให้อ่านง่ายขึ้นบนคอม */
      .factory-stock-polish .compact-modal-shell {
        overscroll-behavior: contain;
      }
      @media (min-width: 1024px) {
        .factory-stock-polish .compact-modal-shell {
          width: min(900px, calc(100vw - 96px)) !important;
          max-height: 84dvh !important;
          border-radius: 24px !important;
        }
        .factory-stock-polish .item-form-shell .item-form-section,
        .factory-stock-polish .item-detail-shell .item-detail-summary {
          padding: 14px !important;
          border-radius: 20px !important;
        }
        .factory-stock-polish .item-form-shell .space-y-5 > :not([hidden]) ~ :not([hidden]),
        .factory-stock-polish .item-detail-shell .space-y-4 > :not([hidden]) ~ :not([hidden]) {
          margin-top: 12px !important;
        }
        .factory-stock-polish .item-form-shell .gap-4,
        .factory-stock-polish .item-detail-shell .gap-4 {
          gap: 12px !important;
        }
        .factory-stock-polish .item-form-shell :is(input:not([type="checkbox"]), select, textarea) {
          min-height: 40px !important;
          border-radius: 12px !important;
          padding-top: 9px !important;
          padding-bottom: 9px !important;
          font-size: .95rem !important;
        }
        .factory-stock-polish .item-form-shell label,
        .factory-stock-polish .item-detail-shell label {
          font-size: .92rem !important;
        }
        .factory-stock-polish .item-form-shell .text-lg,
        .factory-stock-polish .item-detail-shell .text-lg {
          font-size: .95rem !important;
          line-height: 1.35 !important;
        }
        .factory-stock-polish .item-form-shell .text-2xl,
        .factory-stock-polish .item-form-shell .sm\:text-3xl,
        .factory-stock-polish .item-detail-shell .text-2xl {
          font-size: 1.35rem !important;
          line-height: 1.15 !important;
        }
        .factory-stock-polish .item-detail-shell .p-5 {
          padding: 14px !important;
        }
        .factory-stock-polish .item-detail-shell .grid {
          gap: 10px !important;
        }
      }
      @media (max-width: 640px) {
        .factory-stock-polish .compact-modal-shell {
          width: 100% !important;
          max-height: 92dvh !important;
          border-radius: 22px !important;
        }
      }
      .factory-stock-polish .clean-mobile-card-title {
        font-size: 16px;
        line-height: 1.25;
      }
      .factory-stock-polish .clean-mobile-actions {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 8px;
      }
      .factory-stock-polish .clean-mobile-actions button {
        min-height: 42px;
      }
      .factory-stock-polish .operation-workspace-card {
        background: var(--factory-card);
      }
      .factory-stock-polish .item-form-shell,
      .factory-stock-polish .item-detail-shell,
      .factory-stock-polish .settings-shell {
        background: var(--factory-card) !important;
        border-color: var(--factory-border) !important;
        box-shadow: var(--factory-shadow) !important;
      }
      .factory-stock-polish .item-form-shell {
        scroll-padding-top: 18px;
      }
      .factory-stock-polish .item-form-section {
        background: color-mix(in srgb, var(--factory-card) 82%, var(--factory-bg)) !important;
        border-color: var(--factory-border) !important;
        box-shadow: 0 10px 24px rgba(15,23,42,.045);
      }
      .factory-stock-polish .item-form-section > div:first-child {
        position: sticky;
        top: -1px;
        z-index: 1;
        width: fit-content;
        padding: 6px 10px;
        border-radius: 999px;
        background: var(--factory-blue-soft);
        color: var(--factory-blue);
        font-size: 13px;
      }
      .factory-stock-polish .item-form-section label,
      .factory-stock-polish .settings-shell label {
        font-size: 13px !important;
        line-height: 1.25;
      }
      .factory-stock-polish .item-form-shell input:not([type="checkbox"]):not([type="radio"]),
      .factory-stock-polish .item-form-shell select,
      .factory-stock-polish .item-form-shell textarea,
      .factory-stock-polish .settings-shell input:not([type="checkbox"]):not([type="radio"]),
      .factory-stock-polish .settings-shell select,
      .factory-stock-polish .settings-shell textarea {
        min-height: 46px;
        font-size: 15px !important;
        border-radius: 14px !important;
      }
      .factory-stock-polish .item-detail-summary {
        background: color-mix(in srgb, var(--factory-card) 84%, var(--factory-bg)) !important;
        border-color: var(--factory-border) !important;
      }
      .factory-stock-polish .item-detail-summary [class*="grid-cols-2"] > div {
        min-height: 72px;
      }
      .factory-stock-polish .item-detail-shell .custom-scrollbar {
        padding-right: 2px;
      }
      .factory-stock-polish .settings-shell .settings-nav-grid button {
        min-height: 70px;
        box-shadow: none !important;
      }
      .factory-stock-polish .settings-shell .settings-nav-grid button:hover {
        transform: translateY(-1px);
      }
      .factory-stock-polish .settings-shell [class*="p-6"],
      .factory-stock-polish .settings-shell [class*="p-5"] {
        border-color: var(--factory-border);
      }
      .factory-stock-polish .settings-shell .custom-scrollbar {
        scrollbar-width: thin;
      }
      @media (max-width: 760px) {
        .factory-stock-polish .item-form-shell,
        .factory-stock-polish .item-detail-shell,
        .factory-stock-polish .settings-shell {
          border-radius: 24px !important;
          max-height: 94vh !important;
        }
        .factory-stock-polish .item-form-section {
          padding: 14px !important;
        }
        .factory-stock-polish .item-form-section > div:first-child {
          font-size: 12px;
          margin-bottom: 12px !important;
        }
        .factory-stock-polish .item-form-shell input:not([type="checkbox"]):not([type="radio"]),
        .factory-stock-polish .item-form-shell select,
        .factory-stock-polish .item-form-shell textarea,
        .factory-stock-polish .settings-shell input:not([type="checkbox"]):not([type="radio"]),
        .factory-stock-polish .settings-shell select,
        .factory-stock-polish .settings-shell textarea {
          min-height: 44px;
          font-size: 14px !important;
        }
        .factory-stock-polish .item-detail-summary [class*="grid-cols-2"] {
          grid-template-columns: 1fr 1fr !important;
        }
        .factory-stock-polish .settings-shell .settings-nav-grid {
          display: flex !important;
          overflow-x: auto;
          padding-bottom: 6px;
          scroll-snap-type: x mandatory;
        }
        .factory-stock-polish .settings-shell .settings-nav-grid button {
          min-width: 132px;
          min-height: 58px;
          scroll-snap-align: start;
        }
        .factory-stock-polish { padding-left: 12px !important; padding-right: 12px !important; }
        .factory-stock-polish .factory-page-title h1 { font-size: 27px !important; line-height: 1.1; }
        .factory-stock-polish .factory-page-title p { font-size: 12px; }
        .factory-stock-polish .workspace-tabbar {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          overflow: visible !important;
          gap: 8px !important;
        }
        .factory-stock-polish .workspace-tabbar button {
          min-width: 0 !important;
          padding: 10px !important;
          border-radius: 16px !important;
        }
        .factory-stock-polish .workspace-tabbar button svg { width: 18px; height: 18px; }
        .factory-stock-polish .factory-top-actions {
          display: grid !important;
          grid-template-columns: repeat(3, minmax(0, 1fr));
          width: 100%;
        }
        .factory-stock-polish .factory-top-actions .factory-ghost-btn,
        .factory-stock-polish .factory-top-actions .factory-primary-btn,
        .factory-stock-polish .factory-top-actions .factory-danger-btn {
          min-height: 42px;
          padding-left: 10px;
          padding-right: 10px;
          border-radius: 14px;
          font-size: 12px;
        }
        .factory-stock-polish .factory-top-actions .factory-ghost-btn span.hidden-mobile,
        .factory-stock-polish .factory-top-actions .factory-danger-btn span.hidden-mobile { display: none !important; }
        .factory-stock-polish .stock-mobile-card { border-radius: 20px !important; }
        .factory-stock-polish .stock-mobile-card .mobile-secondary-chip { display: none !important; }
      }

      /* v22.43.0 UI Polish & Mobile Cleanup */
      .factory-stock-polish .solid-panel,
      .factory-stock-polish .purchase-project-card,
      .factory-stock-polish .stock-mobile-card {
        border-radius: 22px !important;
        border-color: rgba(148,163,184,.22) !important;
      }
      .factory-stock-polish[data-polish-theme="dark"] .solid-panel,
      .factory-stock-polish[data-polish-theme="dark"] .purchase-project-card,
      .factory-stock-polish[data-polish-theme="dark"] .stock-mobile-card {
        background: #0f172a !important;
        border-color: rgba(148,163,184,.18) !important;
      }
      .factory-stock-polish .stock-table-compact tbody td {
        padding-top: 14px !important;
        padding-bottom: 14px !important;
      }
      .factory-stock-polish .stock-table-compact tbody tr + tr td:not(.stock-select-cell) {
        border-top-color: rgba(148,163,184,.14) !important;
      }
      .factory-stock-polish .stock-title {
        letter-spacing: -.02em;
      }
      .factory-stock-polish .factory-primary-btn,
      .factory-stock-polish .factory-ghost-btn,
      .factory-stock-polish .factory-danger-btn,
      .factory-stock-polish .factory-chip {
        min-height: 40px;
      }
      .factory-stock-polish .workspace-tabbar button,
      .factory-stock-polish aside nav button {
        border-radius: 16px !important;
      }
      .factory-stock-polish .workspace-action-card {
        background: var(--factory-card) !important;
        border: 1px solid var(--factory-border) !important;
        box-shadow: var(--factory-shadow-soft) !important;
      }
      .factory-stock-polish :is(.bg-white\/80,.bg-white\/90,.bg-slate-900\/80,.bg-slate-900\/90) {
        backdrop-filter: none !important;
        -webkit-backdrop-filter: none !important;
      }
      .factory-stock-polish .stock-mobile-card {
        padding: 14px !important;
      }
      .factory-stock-polish .stock-mobile-card .stock-name-line {
        gap: 6px;
      }
      .factory-stock-polish .stock-mobile-card .stock-title {
        font-size: 15px !important;
        line-height: 1.25 !important;
      }
      .factory-stock-polish .stock-mobile-card .stock-meta-line {
        font-size: 11px !important;
      }
      .factory-stock-polish .stock-mobile-card [class*="rounded-full"] {
        white-space: nowrap;
      }
      .factory-stock-polish label:has(> input[type="checkbox"]) {
        box-shadow: none !important;
      }
      .factory-stock-polish .checkbox-clean,
      .factory-stock-polish .checklist-row,
      .factory-stock-polish .prep-check-row {
        position: relative;
      }
      .factory-stock-polish .checkbox-clean::before,
      .factory-stock-polish .checkbox-clean::after,
      .factory-stock-polish .checklist-row::before,
      .factory-stock-polish .checklist-row::after,
      .factory-stock-polish .prep-check-row::before,
      .factory-stock-polish .prep-check-row::after {
        content: none !important;
        display: none !important;
      }
      @media (max-width: 767px) {
        .factory-stock-polish {
          background: #020617 !important;
        }
        .factory-stock-polish .factory-topbar {
          gap: 12px !important;
          padding-top: 6px !important;
          padding-bottom: 6px !important;
        }
        .factory-stock-polish .factory-page-title h1 {
          font-size: 26px !important;
          line-height: 1.1 !important;
        }
        .factory-stock-polish .factory-page-title p {
          font-size: 12px !important;
          line-height: 1.45 !important;
        }
        .factory-stock-polish .factory-kicker {
          font-size: 10px !important;
          margin-bottom: 2px !important;
        }
        .factory-stock-polish .factory-top-actions {
          grid-template-columns: 1fr 1fr !important;
          gap: 8px !important;
        }
        .factory-stock-polish .factory-primary-btn,
        .factory-stock-polish .factory-ghost-btn,
        .factory-stock-polish .factory-danger-btn,
        .factory-stock-polish .factory-chip {
          min-height: 38px !important;
          border-radius: 14px !important;
          font-size: 12px !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
        }
        .factory-stock-polish .stock-mobile-select-col {
          width: 28px !important;
          min-width: 28px !important;
        }
        .factory-stock-polish .stock-check,
        .factory-stock-polish input[type="checkbox"] {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          min-height: 18px !important;
          max-width: 18px !important;
          max-height: 18px !important;
          border-radius: 5px !important;
        }
        .factory-stock-polish .stock-check:checked::after,
        .factory-stock-polish input[type="checkbox"]:checked::after {
          left: 5px !important;
          top: 1px !important;
          width: 6px !important;
          height: 11px !important;
        }
        .factory-stock-polish .stock-check-disabled {
          width: 18px !important;
          height: 18px !important;
          min-width: 18px !important;
          min-height: 18px !important;
        }
        .factory-stock-polish .stock-mobile-card {
          border-radius: 18px !important;
          margin-bottom: 10px !important;
        }
        .factory-stock-polish .workspace-tabbar {
          gap: 8px !important;
        }
        .factory-stock-polish .workspace-tabbar button {
          min-height: 40px !important;
          font-size: 12px !important;
          padding: 8px 10px !important;
        }
        .factory-stock-polish .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
          height: 6px;
        }
        .factory-stock-polish .solid-panel {
          border-radius: 18px !important;
        }
      }


      .factory-stock-polish .smart-combobox-field input {
        min-height: 48px;
      }
      .factory-stock-polish .smart-combobox-field .custom-scrollbar::-webkit-scrollbar { width: 7px; }
      .factory-stock-polish .smart-combobox-field .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(148,163,184,.55); border-radius: 999px; }
      .factory-stock-polish .smart-combobox-field .smart-picker-shell {
        box-shadow: 0 10px 24px rgba(15,23,42,.05);
      }
      .factory-stock-polish .smart-combobox-field input {
        box-shadow: none !important;
      }
      .factory-stock-polish .smart-combobox-field button {
        transition: background .18s ease, border-color .18s ease, transform .18s ease;
      }
      .factory-stock-polish .smart-combobox-field button:active {
        transform: translateY(1px);
      }
      .factory-stock-polish .smart-picker-panel {
        overscroll-behavior: contain;
      }
      @media (max-width: 640px) {
        .factory-stock-polish .smart-combobox-field .smart-picker-shell .pl-11 {
          padding-left: 0 !important;
        }
        .factory-stock-polish .smart-combobox-field .smart-picker-shell .justify-between {
          align-items: stretch;
          flex-direction: column;
        }
        .factory-stock-polish .smart-combobox-field .smart-picker-shell .justify-between > div:last-child {
          display: grid;
          grid-template-columns: 1fr 1fr;
          width: 100%;
        }
      }

      /* ===== v22.50.5 Design System Polish: safe UI-only cleanup ===== */
      .factory-stock-polish {
        --ds-radius-card: 22px;
        --ds-radius-panel: 26px;
        --ds-radius-control: 15px;
        --ds-line: rgba(148,163,184,.28);
        --ds-focus: rgba(37,99,235,.20);
        text-rendering: optimizeLegibility;
        -webkit-font-smoothing: antialiased;
      }
      .factory-stock-polish[data-polish-theme="dark"] {
        --ds-line: rgba(148,163,184,.18);
        --ds-focus: rgba(96,165,250,.18);
      }
      .factory-stock-polish :is(.solid-panel,.solid-workspace,.operation-workspace-card,.purchase-project-card,.item-form-section,.item-detail-summary,.workspace-action-card) {
        border-radius: var(--ds-radius-card) !important;
        border-color: var(--factory-border) !important;
        box-shadow: var(--factory-shadow-soft) !important;
      }
      .factory-stock-polish :is(.solid-panel,.operation-workspace-card,.purchase-project-card,.item-form-section,.item-detail-summary) {
        background: var(--factory-card) !important;
      }
      .factory-stock-polish :is(.factory-primary-btn,.factory-ghost-btn,.factory-danger-btn,.factory-chip,.factory-icon-btn) {
        min-height: 40px;
        border-radius: var(--ds-radius-control);
        letter-spacing: -.015em;
      }
      .factory-stock-polish .factory-primary-btn {
        background: linear-gradient(135deg,#2563eb,#1e40af) !important;
        box-shadow: 0 12px 26px rgba(37,99,235,.20) !important;
      }
      .factory-stock-polish .factory-ghost-btn,
      .factory-stock-polish .factory-icon-btn {
        border-color: var(--factory-border) !important;
        background: var(--factory-card) !important;
      }
      .factory-stock-polish :is(input:not([type="checkbox"]):not([type="radio"]), select, textarea):focus {
        outline: none !important;
        border-color: #60a5fa !important;
        box-shadow: 0 0 0 4px var(--ds-focus), inset 0 1px 0 rgba(255,255,255,.42) !important;
      }
      .factory-stock-polish :is(.stock-mobile-card,.clean-mobile-card,.workspace-action-card) {
        border-radius: 22px !important;
        border-color: var(--factory-border) !important;
      }
      .factory-stock-polish .stock-mobile-card {
        box-shadow: 0 12px 28px rgba(15,23,42,.06) !important;
      }
      .factory-stock-polish[data-polish-theme="dark"] .stock-mobile-card {
        box-shadow: 0 12px 30px rgba(0,0,0,.22) !important;
      }
      .factory-stock-polish .stock-name-line .stock-title,
      .factory-stock-polish .clean-mobile-card-title {
        letter-spacing: -.02em;
      }
      .factory-stock-polish :is(.text-xs,.text-sm) {
        line-height: 1.35;
      }
      .factory-stock-polish :is(.rounded-full,.rounded-xl,.rounded-2xl,.rounded-3xl) {
        border-color: var(--factory-border);
      }
      .factory-stock-polish .workspace-tabbar button {
        min-height: 40px;
        white-space: nowrap;
      }
      .factory-stock-polish thead th {
        background: color-mix(in srgb, var(--factory-card) 82%, var(--factory-bg)) !important;
      }
      .factory-stock-polish tbody td {
        border-color: var(--ds-line) !important;
      }
      .factory-stock-polish .custom-scrollbar {
        scrollbar-width: thin;
        scrollbar-color: rgba(148,163,184,.55) transparent;
      }
      .factory-stock-polish .smart-picker-shell,
      .factory-stock-polish .smart-picker-panel {
        border-radius: 20px !important;
      }
      .factory-stock-polish .smart-picker-panel {
        box-shadow: 0 24px 70px rgba(15,23,42,.18) !important;
      }
      .factory-stock-polish[data-polish-theme="dark"] .smart-picker-panel {
        box-shadow: 0 24px 70px rgba(0,0,0,.45) !important;
      }
      .factory-stock-polish .compact-modal-shell {
        border-color: var(--factory-border) !important;
      }
      .factory-stock-polish .settings-shell .settings-nav-grid button,
      .factory-stock-polish .clean-mobile-actions button {
        border-radius: 16px !important;
      }
      .factory-stock-polish .empty-state-card,
      .factory-stock-polish .factory-empty-state {
        border-radius: 24px !important;
        border: 1px dashed var(--factory-border) !important;
        background: color-mix(in srgb, var(--factory-card) 82%, var(--factory-bg)) !important;
      }
      @media (max-width: 760px) {
        .factory-stock-polish {
          --ds-radius-card: 18px;
          --ds-radius-panel: 22px;
          --ds-radius-control: 14px;
        }
        .factory-stock-polish .factory-topbar {
          gap: 10px !important;
          padding-top: 12px !important;
          padding-bottom: 6px !important;
        }
        .factory-stock-polish .factory-page-title h1 {
          font-size: 25px !important;
          line-height: 1.08 !important;
        }
        .factory-stock-polish .factory-page-title p {
          font-size: 12px !important;
          margin-top: 5px !important;
        }
        .factory-stock-polish .factory-top-actions {
          gap: 7px !important;
        }
        .factory-stock-polish :is(.factory-primary-btn,.factory-ghost-btn,.factory-danger-btn,.factory-chip,.factory-icon-btn) {
          min-height: 38px !important;
          border-radius: 14px !important;
          font-size: 12px !important;
        }
        .factory-stock-polish .stock-mobile-card {
          border-radius: 18px !important;
          padding: 12px !important;
        }
        .factory-stock-polish .clean-mobile-actions {
          gap: 6px !important;
        }
        .factory-stock-polish .clean-mobile-actions button {
          min-height: 38px !important;
          font-size: 12px !important;
        }
        .factory-stock-polish .workspace-tabbar {
          gap: 6px !important;
          padding-bottom: 4px;
        }
        .factory-stock-polish .workspace-tabbar button {
          min-height: 38px !important;
          padding-inline: 10px !important;
          font-size: 12px !important;
        }
        .factory-stock-polish :is(.solid-panel,.solid-workspace,.operation-workspace-card,.purchase-project-card,.item-form-section,.item-detail-summary,.workspace-action-card) {
          border-radius: 18px !important;
        }
      }

      @media (max-width: 1023px) {
        .factory-stock-polish .factory-topbar { padding-top: 10px; flex-direction: column; align-items: stretch; }
        .factory-stock-polish .factory-top-actions { justify-content: stretch; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); }
        .factory-stock-polish .factory-chip,
        .factory-stock-polish .factory-primary-btn,
        .factory-stock-polish .factory-ghost-btn,
        .factory-stock-polish .factory-danger-btn,
        .factory-stock-polish .factory-icon-btn { width: 100%; }
      }


      /* v22.46.0 Full Polish Pack: Dashboard / Reports / Borrow-Return / Project / Print */
      .factory-stock-polish .dashboard-polish,
      .factory-stock-polish .report-polish,
      .factory-stock-polish .tracking-polish,
      .factory-stock-polish .borrow-return-polish,
      .factory-stock-polish .print-polish {
        background: var(--factory-card) !important;
        border: 1px solid var(--factory-border) !important;
        border-radius: 24px !important;
        box-shadow: var(--factory-shadow-soft) !important;
      }
      .factory-stock-polish .solid-workspace > div,
      .factory-stock-polish .operation-workspace-card,
      .factory-stock-polish .purchase-project-card,
      .factory-stock-polish .item-detail-shell,
      .factory-stock-polish .item-form-shell,
      .factory-stock-polish .settings-shell {
        transition: border-color .18s ease, box-shadow .18s ease, transform .18s ease;
      }
      .factory-stock-polish .solid-workspace > div:hover,
      .factory-stock-polish .operation-workspace-card:hover,
      .factory-stock-polish .purchase-project-card:hover {
        border-color: rgba(37,99,235,.24) !important;
      }
      .factory-stock-polish .workspace-action-card,
      .factory-stock-polish .operation-workspace-card,
      .factory-stock-polish .purchase-project-card {
        overflow: hidden;
      }
      .factory-stock-polish .workspace-action-card :is(h2,h3,p),
      .factory-stock-polish .operation-workspace-card :is(h2,h3,p),
      .factory-stock-polish .purchase-project-card :is(h2,h3,p) {
        overflow-wrap: anywhere;
      }
      .factory-stock-polish .summary-card,
      .factory-stock-polish .stat-card,
      .factory-stock-polish [class*="statCard"],
      .factory-stock-polish [class*="StatCard"] {
        border-radius: 22px !important;
      }
      .factory-stock-polish .factory-page-title h1,
      .factory-stock-polish h1,
      .factory-stock-polish h2,
      .factory-stock-polish h3 {
        text-wrap: balance;
      }
      .factory-stock-polish .factory-page-title p,
      .factory-stock-polish .stock-meta-line,
      .factory-stock-polish p {
        text-wrap: pretty;
      }
      .factory-stock-polish table td,
      .factory-stock-polish table th {
        border-color: rgba(148,163,184,.18) !important;
      }
      .factory-stock-polish[data-polish-theme="dark"] table td,
      .factory-stock-polish[data-polish-theme="dark"] table th {
        border-color: rgba(148,163,184,.14) !important;
      }
      .factory-stock-polish .stock-table-compact tbody tr:last-child td {
        border-bottom: none !important;
      }
      .factory-stock-polish .stock-table-compact button,
      .factory-stock-polish .solid-panel button,
      .factory-stock-polish .operation-workspace-card button,
      .factory-stock-polish .purchase-project-card button {
        min-height: 38px;
      }
      .factory-stock-polish .stock-table-compact [class*="rounded-full"],
      .factory-stock-polish .stock-mobile-card [class*="rounded-full"],
      .factory-stock-polish .purchase-project-card [class*="rounded-full"] {
        border: 1px solid rgba(148,163,184,.20);
      }
      .factory-stock-polish .operation-workspace-card input:not([type="checkbox"]):not([type="radio"]),
      .factory-stock-polish .operation-workspace-card select,
      .factory-stock-polish .operation-workspace-card textarea,
      .factory-stock-polish .purchase-project-card input:not([type="checkbox"]):not([type="radio"]),
      .factory-stock-polish .purchase-project-card select,
      .factory-stock-polish .purchase-project-card textarea {
        border-radius: 14px !important;
        min-height: 44px !important;
      }
      .factory-stock-polish .operation-workspace-card textarea,
      .factory-stock-polish .purchase-project-card textarea,
      .factory-stock-polish .item-form-shell textarea,
      .factory-stock-polish .settings-shell textarea {
        min-height: 92px !important;
      }
      .factory-stock-polish .operation-workspace-card .custom-scrollbar,
      .factory-stock-polish .purchase-project-card .custom-scrollbar,
      .factory-stock-polish .solid-panel .custom-scrollbar {
        scrollbar-width: thin;
      }
      .factory-stock-polish .print-preview,
      .factory-stock-polish .print-sheet,
      .factory-stock-polish .document-preview {
        background: #ffffff !important;
        color: #0f172a !important;
        border-radius: 18px !important;
        box-shadow: 0 20px 50px rgba(15,23,42,.10) !important;
      }
      .factory-stock-polish .print-preview table,
      .factory-stock-polish .print-sheet table,
      .factory-stock-polish .document-preview table {
        border-collapse: collapse !important;
      }
      .factory-stock-polish .print-preview th,
      .factory-stock-polish .print-sheet th,
      .factory-stock-polish .document-preview th {
        background: #f8fafc !important;
        color: #334155 !important;
      }
      .factory-stock-polish .print-preview td,
      .factory-stock-polish .print-sheet td,
      .factory-stock-polish .document-preview td {
        color: #0f172a !important;
      }
      @media (max-width: 1023px) {
        .factory-stock-polish .solid-workspace,
        .factory-stock-polish main {
          max-width: 100% !important;
        }
        .factory-stock-polish .solid-panel,
        .factory-stock-polish .operation-workspace-card,
        .factory-stock-polish .purchase-project-card,
        .factory-stock-polish .workspace-action-card {
          border-radius: 20px !important;
        }
        .factory-stock-polish .operation-workspace-card,
        .factory-stock-polish .purchase-project-card {
          padding: 14px !important;
        }
        .factory-stock-polish .operation-workspace-card [class*="grid-cols-2"],
        .factory-stock-polish .purchase-project-card [class*="grid-cols-2"],
        .factory-stock-polish .solid-panel [class*="grid-cols-2"] {
          gap: 10px !important;
        }
      }
      @media (max-width: 767px) {
        .factory-stock-polish {
          padding-bottom: 92px !important;
        }
        .factory-stock-polish aside {
          display: none !important;
        }
        .factory-stock-polish .solid-workspace {
          gap: 12px !important;
        }
        .factory-stock-polish .solid-panel,
        .factory-stock-polish .operation-workspace-card,
        .factory-stock-polish .purchase-project-card,
        .factory-stock-polish .workspace-action-card {
          box-shadow: none !important;
          border-radius: 18px !important;
        }
        .factory-stock-polish .workspace-action-card {
          min-height: auto !important;
        }
        .factory-stock-polish .workspace-action-card p {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
        .factory-stock-polish .stock-mobile-card {
          box-shadow: none !important;
          border-color: rgba(148,163,184,.18) !important;
        }
        .factory-stock-polish .stock-mobile-card [class*="gap-3"] {
          gap: 8px !important;
        }
        .factory-stock-polish .stock-mobile-card button {
          min-height: 38px !important;
          border-radius: 12px !important;
          font-size: 12px !important;
        }
        .factory-stock-polish .stock-mobile-card [class*="text-lg"] {
          font-size: 15px !important;
        }
        .factory-stock-polish .stock-mobile-card [class*="text-sm"] {
          font-size: 12px !important;
        }
        .factory-stock-polish .stock-mobile-card [class*="text-xs"] {
          font-size: 11px !important;
        }
        .factory-stock-polish .operation-workspace-card input:not([type="checkbox"]):not([type="radio"]),
        .factory-stock-polish .operation-workspace-card select,
        .factory-stock-polish .operation-workspace-card textarea,
        .factory-stock-polish .purchase-project-card input:not([type="checkbox"]):not([type="radio"]),
        .factory-stock-polish .purchase-project-card select,
        .factory-stock-polish .purchase-project-card textarea {
          min-height: 42px !important;
          font-size: 14px !important;
        }
        .factory-stock-polish .print-preview,
        .factory-stock-polish .print-sheet,
        .factory-stock-polish .document-preview {
          border-radius: 14px !important;
          overflow-x: auto;
        }
      }

      /* v22.46.1 Dashboard Responsive Hotfix: ลดขนาด Dashboard / กันทะลุจอ / Mobile compact */
      .factory-stock-polish,
      .factory-stock-polish * {
        box-sizing: border-box;
      }
      .factory-stock-polish {
        overflow-x: hidden !important;
      }
      .factory-stock-polish main,
      .factory-stock-polish .solid-workspace,
      .factory-stock-polish .solid-panel,
      .factory-stock-polish .operation-workspace-card,
      .factory-stock-polish .purchase-project-card,
      .factory-stock-polish .workspace-action-card {
        max-width: 100% !important;
        min-width: 0 !important;
      }
      .factory-stock-polish main {
        overflow-x: hidden !important;
      }
      .factory-stock-polish [class*="grid-cols-"] > *,
      .factory-stock-polish [class*="flex"] > * {
        min-width: 0;
      }
      .factory-stock-polish .factory-topbar {
        padding-top: 14px !important;
        padding-bottom: 8px !important;
        gap: 12px !important;
      }
      .factory-stock-polish .factory-page-title h1 {
        font-size: clamp(24px, 2.35vw, 34px) !important;
        line-height: 1.08 !important;
      }
      .factory-stock-polish .factory-page-title p {
        font-size: 12px !important;
        line-height: 1.45 !important;
      }
      .factory-stock-polish .factory-kicker {
        font-size: 11px !important;
        margin-bottom: 2px !important;
      }
      .factory-stock-polish .workspace-tabbar {
        padding: 6px !important;
        gap: 6px !important;
        border-radius: 20px !important;
        max-width: 100% !important;
      }
      .factory-stock-polish .workspace-tabbar button {
        min-width: 154px !important;
        min-height: 50px !important;
        padding: 9px 12px !important;
        border-radius: 14px !important;
      }
      .factory-stock-polish .workspace-tabbar button svg {
        width: 18px !important;
        height: 18px !important;
      }
      .factory-stock-polish .workspace-tabbar button span span:first-child {
        font-size: 13px !important;
      }
      .factory-stock-polish .workspace-tabbar button span span:last-child {
        font-size: 10px !important;
      }
      .factory-stock-polish .solid-panel,
      .factory-stock-polish .operation-workspace-card,
      .factory-stock-polish .purchase-project-card,
      .factory-stock-polish .workspace-action-card {
        border-radius: 18px !important;
      }
      .factory-stock-polish .solid-panel {
        padding: 16px !important;
      }
      .factory-stock-polish .workspace-action-card,
      .factory-stock-polish .operation-workspace-card,
      .factory-stock-polish .purchase-project-card {
        padding: 14px !important;
      }
      .factory-stock-polish .summary-card,
      .factory-stock-polish .stat-card,
      .factory-stock-polish [class*="statCard"],
      .factory-stock-polish [class*="StatCard"] {
        padding: 14px !important;
        border-radius: 18px !important;
      }
      .factory-stock-polish .solid-workspace [class*="text-6xl"],
      .factory-stock-polish .solid-panel [class*="text-6xl"] {
        font-size: 2.35rem !important;
        line-height: 1 !important;
      }
      .factory-stock-polish .solid-workspace [class*="text-5xl"],
      .factory-stock-polish .solid-panel [class*="text-5xl"] {
        font-size: 2.05rem !important;
        line-height: 1.04 !important;
      }
      .factory-stock-polish .solid-workspace [class*="text-4xl"],
      .factory-stock-polish .solid-panel [class*="text-4xl"] {
        font-size: 1.75rem !important;
        line-height: 1.08 !important;
      }
      .factory-stock-polish .solid-workspace [class*="text-3xl"],
      .factory-stock-polish .solid-panel [class*="text-3xl"] {
        font-size: 1.45rem !important;
        line-height: 1.12 !important;
      }
      .factory-stock-polish .solid-workspace [class*="text-2xl"],
      .factory-stock-polish .solid-panel [class*="text-2xl"] {
        font-size: 1.18rem !important;
        line-height: 1.18 !important;
      }
      .factory-stock-polish .solid-workspace [class*="min-h-[300px]"],
      .factory-stock-polish .solid-panel [class*="min-h-[300px]"] {
        min-height: 230px !important;
      }
      .factory-stock-polish .solid-workspace [class*="gap-8"],
      .factory-stock-polish .solid-panel [class*="gap-8"] {
        gap: 18px !important;
      }
      .factory-stock-polish .solid-workspace [class*="gap-6"],
      .factory-stock-polish .solid-panel [class*="gap-6"] {
        gap: 14px !important;
      }
      .factory-stock-polish .solid-workspace [class*="p-8"],
      .factory-stock-polish .solid-panel [class*="p-8"] {
        padding: 18px !important;
      }
      .factory-stock-polish .solid-workspace [class*="p-7"],
      .factory-stock-polish .solid-panel [class*="p-7"] {
        padding: 16px !important;
      }
      .factory-stock-polish .solid-workspace [class*="p-6"],
      .factory-stock-polish .solid-panel [class*="p-6"] {
        padding: 15px !important;
      }
      .factory-stock-polish .factory-primary-btn,
      .factory-stock-polish .factory-ghost-btn,
      .factory-stock-polish .factory-danger-btn,
      .factory-stock-polish .factory-chip,
      .factory-stock-polish .solid-panel button,
      .factory-stock-polish .workspace-action-card button {
        min-height: 38px !important;
        border-radius: 14px !important;
      }
      .factory-stock-polish .custom-scrollbar {
        max-width: 100%;
      }
      .factory-stock-polish table {
        width: 100%;
        max-width: 100%;
      }
      .factory-stock-polish .stock-table-compact {
        font-size: 13px !important;
      }
      .factory-stock-polish .stock-table-compact th,
      .factory-stock-polish .stock-table-compact td {
        padding-top: 10px !important;
        padding-bottom: 10px !important;
      }

      @media (min-width: 1024px) {
        .factory-stock-polish .solid-workspace {
          width: 100% !important;
        }
        .factory-stock-polish .solid-workspace [class*="grid-cols-4"] {
          grid-template-columns: repeat(4, minmax(0, 1fr)) !important;
        }
        .factory-stock-polish .solid-workspace [class*="grid-cols-3"] {
          grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
        }
        .factory-stock-polish .solid-workspace [class*="grid-cols-2"] {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 1279px) {
        .factory-stock-polish .factory-page-title h1 {
          font-size: clamp(23px, 3vw, 30px) !important;
        }
        .factory-stock-polish .factory-top-actions {
          gap: 8px !important;
        }
        .factory-stock-polish .solid-workspace [class*="grid-cols-4"] {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
      }

      @media (max-width: 767px) {
        .factory-stock-polish main {
          padding-left: 12px !important;
          padding-right: 12px !important;
          padding-top: 10px !important;
          padding-bottom: 112px !important;
        }
        .factory-stock-polish .factory-topbar {
          padding: 6px 0 6px !important;
          gap: 8px !important;
        }
        .factory-stock-polish .factory-page-title h1 {
          font-size: 23px !important;
          line-height: 1.1 !important;
        }
        .factory-stock-polish .factory-page-title p {
          margin-top: 4px !important;
          font-size: 11px !important;
          line-height: 1.35 !important;
        }
        .factory-stock-polish .factory-kicker {
          font-size: 10px !important;
          letter-spacing: .08em !important;
        }
        .factory-stock-polish .factory-dot {
          width: 6px !important;
          height: 6px !important;
          box-shadow: 0 0 0 4px rgba(37,99,235,.12) !important;
        }
        .factory-stock-polish .factory-top-actions {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          gap: 7px !important;
        }
        .factory-stock-polish .factory-chip,
        .factory-stock-polish .factory-primary-btn,
        .factory-stock-polish .factory-ghost-btn,
        .factory-stock-polish .factory-danger-btn,
        .factory-stock-polish .factory-icon-btn {
          min-height: 36px !important;
          padding-left: 10px !important;
          padding-right: 10px !important;
          border-radius: 12px !important;
          font-size: 12px !important;
        }
        .factory-stock-polish .workspace-tabbar {
          display: grid !important;
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
          overflow-x: visible !important;
          padding: 5px !important;
          gap: 5px !important;
          border-radius: 16px !important;
          margin-bottom: 10px !important;
        }
        .factory-stock-polish .workspace-tabbar button {
          width: 100% !important;
          min-width: 0 !important;
          min-height: 44px !important;
          padding: 8px 9px !important;
          border-radius: 12px !important;
          gap: 7px !important;
        }
        .factory-stock-polish .workspace-tabbar button svg {
          width: 16px !important;
          height: 16px !important;
        }
        .factory-stock-polish .workspace-tabbar button span span:first-child {
          font-size: 12px !important;
          line-height: 1.15 !important;
        }
        .factory-stock-polish .workspace-tabbar button span span:last-child {
          display: none !important;
        }
        .factory-stock-polish .solid-workspace {
          gap: 10px !important;
        }
        .factory-stock-polish .solid-workspace [class*="grid-cols-4"],
        .factory-stock-polish .solid-workspace [class*="grid-cols-3"],
        .factory-stock-polish .solid-workspace [class*="grid-cols-2"],
        .factory-stock-polish .solid-panel [class*="grid-cols-4"],
        .factory-stock-polish .solid-panel [class*="grid-cols-3"],
        .factory-stock-polish .solid-panel [class*="grid-cols-2"] {
          grid-template-columns: minmax(0, 1fr) !important;
        }
        .factory-stock-polish .solid-panel,
        .factory-stock-polish .workspace-action-card,
        .factory-stock-polish .operation-workspace-card,
        .factory-stock-polish .purchase-project-card {
          padding: 12px !important;
          border-radius: 16px !important;
          box-shadow: none !important;
        }
        .factory-stock-polish .summary-card,
        .factory-stock-polish .stat-card,
        .factory-stock-polish [class*="statCard"],
        .factory-stock-polish [class*="StatCard"] {
          padding: 12px !important;
          border-radius: 15px !important;
        }
        .factory-stock-polish .solid-workspace [class*="text-6xl"],
        .factory-stock-polish .solid-workspace [class*="text-5xl"] {
          font-size: 1.65rem !important;
        }
        .factory-stock-polish .solid-workspace [class*="text-4xl"] {
          font-size: 1.45rem !important;
        }
        .factory-stock-polish .solid-workspace [class*="text-3xl"] {
          font-size: 1.28rem !important;
        }
        .factory-stock-polish .solid-workspace [class*="text-2xl"] {
          font-size: 1.08rem !important;
        }
        .factory-stock-polish .solid-workspace [class*="text-xl"] {
          font-size: 1rem !important;
        }
        .factory-stock-polish .solid-workspace [class*="text-lg"] {
          font-size: .94rem !important;
        }
        .factory-stock-polish .solid-workspace [class*="min-h-[300px]"],
        .factory-stock-polish .solid-panel [class*="min-h-[300px]"] {
          min-height: 170px !important;
        }
        .factory-stock-polish .solid-workspace [class*="gap-8"],
        .factory-stock-polish .solid-workspace [class*="gap-6"],
        .factory-stock-polish .solid-panel [class*="gap-8"],
        .factory-stock-polish .solid-panel [class*="gap-6"] {
          gap: 10px !important;
        }
        .factory-stock-polish .solid-workspace [class*="p-8"],
        .factory-stock-polish .solid-workspace [class*="p-7"],
        .factory-stock-polish .solid-workspace [class*="p-6"],
        .factory-stock-polish .solid-panel [class*="p-8"],
        .factory-stock-polish .solid-panel [class*="p-7"],
        .factory-stock-polish .solid-panel [class*="p-6"] {
          padding: 12px !important;
        }
        .factory-stock-polish .stock-table-compact th,
        .factory-stock-polish .stock-table-compact td {
          padding-top: 8px !important;
          padding-bottom: 8px !important;
          font-size: 12px !important;
        }
        .factory-stock-polish .stock-mobile-card {
          padding: 11px !important;
        }
        .factory-stock-polish .stock-mobile-card [class*="rounded-2xl"],
        .factory-stock-polish .stock-mobile-card [class*="rounded-3xl"] {
          border-radius: 14px !important;
        }
        .factory-stock-polish .stock-mobile-card button {
          min-height: 34px !important;
          font-size: 11px !important;
        }
      }

      @media (max-width: 390px) {
        .factory-stock-polish main {
          padding-left: 9px !important;
          padding-right: 9px !important;
        }
        .factory-stock-polish .workspace-tabbar button {
          min-height: 42px !important;
          padding: 7px 8px !important;
        }
        .factory-stock-polish .factory-page-title h1 {
          font-size: 21px !important;
        }
        .factory-stock-polish .solid-panel,
        .factory-stock-polish .workspace-action-card,
        .factory-stock-polish .operation-workspace-card,
        .factory-stock-polish .purchase-project-card {
          padding: 10px !important;
        }
      }

      @media print {
        .factory-stock-polish,
        .factory-stock-polish * {
          box-shadow: none !important;
          text-shadow: none !important;
        }
        .factory-stock-polish .print-preview,
        .factory-stock-polish .print-sheet,
        .factory-stock-polish .document-preview {
          border-radius: 0 !important;
          border: 0 !important;
          box-shadow: none !important;
        }
        .factory-stock-polish button,
        .factory-stock-polish aside,
        .factory-stock-polish .factory-top-actions,
        .factory-stock-polish .workspace-tabbar {
          display: none !important;
        }
      }



      /* v22.47.0 Borrow-Return & Document Polish */
      .factory-stock-polish .operation-workspace-card {
        overflow: visible !important;
      }
      .factory-stock-polish .operation-workspace-card > div:first-child {
        padding-top: 18px !important;
        padding-bottom: 18px !important;
      }
      .factory-stock-polish .operation-workspace-card > div:first-child h2 {
        font-size: clamp(1.25rem, 2vw, 1.75rem) !important;
      }
      .factory-stock-polish .operation-workspace-card > div:nth-child(2) {
        padding: 16px !important;
      }
      .factory-stock-polish .operation-workspace-card section {
        box-shadow: none !important;
      }
      .factory-stock-polish .operation-workspace-card section:first-of-type > div:last-child {
        max-height: min(58vh, 560px) !important;
      }
      .factory-stock-polish .operation-workspace-card section:last-of-type {
        top: 12px !important;
      }
      .factory-stock-polish .operation-workspace-card section:last-of-type > div:last-child {
        max-height: min(68vh, 680px) !important;
        overflow-y: auto !important;
        scrollbar-width: thin;
      }
      .factory-stock-polish .operation-workspace-card section:last-of-type > div:last-child::-webkit-scrollbar {
        width: 6px;
      }
      .factory-stock-polish .operation-workspace-card section:last-of-type > div:last-child::-webkit-scrollbar-thumb {
        background: rgba(148,163,184,.45);
        border-radius: 999px;
      }
      .factory-stock-polish .operation-workspace-card [class*="grid-cols-4"] > div {
        min-height: 92px !important;
        display: flex;
        flex-direction: column;
        justify-content: center;
      }
      .factory-stock-polish .operation-workspace-card [class*="grid-cols-4"] [class*="text-3xl"] {
        font-size: 1.55rem !important;
      }
      .factory-stock-polish .operation-workspace-card [class*="grid-cols-3"] button {
        min-height: 72px !important;
      }
      .factory-stock-polish .operation-workspace-card .clean-mobile-card-title {
        font-size: 15px !important;
        line-height: 1.28 !important;
      }
      .factory-stock-polish .operation-workspace-card label:has(input[type="checkbox"]) {
        border-radius: 14px !important;
      }
      .factory-stock-polish .operation-workspace-card textarea {
        min-height: 74px !important;
      }
      .factory-stock-polish .tracking-polish,
      .factory-stock-polish .monthly-report-polish,
      .factory-stock-polish .document-archive-polish {
        border-radius: 22px !important;
        overflow: hidden !important;
      }
      .factory-stock-polish .document-archive-card,
      .factory-stock-polish .tracking-list-card {
        border-radius: 16px !important;
        transition: border-color .18s ease, background .18s ease;
      }
      .factory-stock-polish .document-archive-card:hover,
      .factory-stock-polish .tracking-list-card:hover {
        border-color: rgba(37,99,235,.30) !important;
      }
      .factory-stock-polish .print-actions-bar {
        position: sticky;
        top: 0;
        z-index: 30;
        backdrop-filter: none !important;
      }
      .factory-stock-polish .print-paper-shell {
        width: min(100%, 980px) !important;
        margin-inline: auto !important;
        border-radius: 18px !important;
        overflow: hidden !important;
      }
      .factory-stock-polish .print-paper-shell table th,
      .factory-stock-polish .print-paper-shell table td {
        padding-top: 8px !important;
        padding-bottom: 8px !important;
      }
      @media (max-width: 1279px) {
        .factory-stock-polish .operation-workspace-card section:last-of-type {
          position: static !important;
        }
        .factory-stock-polish .operation-workspace-card section:last-of-type > div:last-child {
          max-height: none !important;
          overflow: visible !important;
        }
      }
      @media (max-width: 767px) {
        .factory-stock-polish .operation-workspace-card > div:first-child {
          padding: 14px !important;
        }
        .factory-stock-polish .operation-workspace-card > div:nth-child(2) {
          padding: 12px !important;
        }
        .factory-stock-polish .operation-workspace-card [class*="grid-cols-4"] {
          grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
        }
        .factory-stock-polish .operation-workspace-card [class*="grid-cols-4"] > div {
          min-height: 78px !important;
          padding: 10px !important;
        }
        .factory-stock-polish .operation-workspace-card [class*="grid-cols-4"] [class*="text-3xl"] {
          font-size: 1.35rem !important;
        }
        .factory-stock-polish .operation-workspace-card [class*="grid-cols-3"] {
          grid-template-columns: 1fr !important;
        }
        .factory-stock-polish .operation-workspace-card [class*="grid-cols-3"] button {
          min-height: auto !important;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 10px;
          padding: 11px 12px !important;
        }
        .factory-stock-polish .operation-workspace-card [class*="grid-cols-3"] button > div:last-child {
          margin-top: 0 !important;
          text-align: right;
        }
        .factory-stock-polish .operation-workspace-card section:first-of-type > div:last-child {
          max-height: 52vh !important;
        }
        .factory-stock-polish .operation-workspace-card .clean-mobile-card-title {
          font-size: 14px !important;
        }
        .factory-stock-polish .print-actions-bar {
          gap: 8px !important;
          padding: 10px 12px !important;
        }
        .factory-stock-polish .print-paper-shell {
          border-radius: 14px !important;
        }
      }
      @media print {
        .factory-stock-polish .print-actions-bar,
        .print-actions-bar {
          display: none !important;
        }
        .factory-stock-polish .print-paper-shell,
        .print-paper-shell {
          box-shadow: none !important;
          border-radius: 0 !important;
          width: 100% !important;
        }
      }



      /* v22.50.0 Final Production Polish Pack: Print / Mobile / Detail / Settings / Empty States */
      .factory-stock-polish {
        --mdec-radius-soft: 16px;
        --mdec-radius-card: 20px;
        --mdec-line: rgba(148,163,184,.22);
      }
      .factory-stock-polish :is(.solid-panel,.workspace-action-card,.operation-workspace-card,.purchase-project-card) {
        border-width: 1px !important;
      }
      .factory-stock-polish :is(.solid-panel,.operation-workspace-card,.purchase-project-card) h2,
      .factory-stock-polish :is(.solid-panel,.operation-workspace-card,.purchase-project-card) h3 {
        letter-spacing: -.02em;
      }
      .factory-stock-polish :is(.solid-panel,.operation-workspace-card,.purchase-project-card) p {
        line-height: 1.55;
      }
      /* Print & Document polish */
      .factory-stock-polish .print-preview,
      .factory-stock-polish .print-sheet,
      .factory-stock-polish .document-preview,
      .factory-stock-polish .print-paper-shell {
        background: #fff !important;
        color: #0f172a !important;
        border: 1px solid #dbe3ee !important;
      }
      .factory-stock-polish .print-preview :is(th,td),
      .factory-stock-polish .print-sheet :is(th,td),
      .factory-stock-polish .document-preview :is(th,td),
      .factory-stock-polish .print-paper-shell :is(th,td) {
        line-height: 1.45 !important;
      }
      .factory-stock-polish .print-preview th,
      .factory-stock-polish .print-sheet th,
      .factory-stock-polish .document-preview th,
      .factory-stock-polish .print-paper-shell th {
        background: #f1f5f9 !important;
        color: #334155 !important;
        font-weight: 900 !important;
      }
      .factory-stock-polish .document-archive-card,
      .factory-stock-polish .tracking-list-card {
        min-height: 0 !important;
      }
      .factory-stock-polish .document-archive-card button,
      .factory-stock-polish .tracking-list-card button {
        min-height: 34px !important;
      }
      /* Inventory detail / history modal polish */
      .factory-stock-polish .history-detail-card,
      .factory-stock-polish .asset-detail-card,
      .factory-stock-polish .proof-detail-card {
        border-radius: var(--mdec-radius-card) !important;
        overflow: hidden !important;
      }
      .factory-stock-polish [role="dialog"] :is(h2,h3) {
        line-height: 1.18 !important;
      }
      .factory-stock-polish [role="dialog"] :is(input:not([type="checkbox"]),select,textarea) {
        min-height: 40px !important;
      }
      .factory-stock-polish [role="dialog"] textarea {
        min-height: 82px !important;
      }
      .factory-stock-polish [role="dialog"] button {
        min-height: 36px !important;
      }
      /* Settings center polish */
      .factory-stock-polish .settings-panel,
      .factory-stock-polish .settings-card,
      .factory-stock-polish .system-settings-card {
        border-radius: var(--mdec-radius-card) !important;
        border: 1px solid var(--mdec-line) !important;
      }
      .factory-stock-polish .settings-panel button,
      .factory-stock-polish .settings-card button,
      .factory-stock-polish .system-settings-card button {
        min-height: 36px !important;
      }
      .factory-stock-polish .settings-tabs,
      .factory-stock-polish .settings-tabbar {
        scrollbar-width: thin;
      }
      .factory-stock-polish .settings-tabs::-webkit-scrollbar,
      .factory-stock-polish .settings-tabbar::-webkit-scrollbar {
        height: 6px;
      }
      .factory-stock-polish .settings-tabs::-webkit-scrollbar-thumb,
      .factory-stock-polish .settings-tabbar::-webkit-scrollbar-thumb {
        background: rgba(148,163,184,.45);
        border-radius: 999px;
      }
      /* Empty state & warning polish */
      .factory-stock-polish .empty-state,
      .factory-stock-polish .warning-state,
      .factory-stock-polish .no-data-state {
        border-radius: var(--mdec-radius-card) !important;
        border-style: dashed !important;
      }
      .factory-stock-polish .empty-state svg,
      .factory-stock-polish .no-data-state svg {
        opacity: .8;
      }
      .factory-stock-polish .status-pill,
      .factory-stock-polish .badge,
      .factory-stock-polish [class*="rounded-full"][class*="font-bold"] {
        white-space: nowrap;
      }
      /* Mobile field work polish */
      @media (max-width: 767px) {
        .factory-stock-polish {
          --mdec-radius-soft: 14px;
          --mdec-radius-card: 16px;
        }
        .factory-stock-polish :is(input:not([type="checkbox"]), select, textarea) {
          font-size: 16px !important; /* prevent iOS zoom */
        }
        .factory-stock-polish .factory-top-actions {
          position: relative !important;
        }
        .factory-stock-polish .factory-top-actions button,
        .factory-stock-polish .factory-top-actions a {
          overflow: hidden !important;
          text-overflow: ellipsis !important;
        }
        .factory-stock-polish .solid-panel :is(h2,h3),
        .factory-stock-polish .operation-workspace-card :is(h2,h3),
        .factory-stock-polish .purchase-project-card :is(h2,h3) {
          font-size: 1rem !important;
        }
        .factory-stock-polish .document-archive-card,
        .factory-stock-polish .tracking-list-card,
        .factory-stock-polish .workspace-action-card {
          padding: 10px !important;
        }
        .factory-stock-polish .print-preview,
        .factory-stock-polish .print-sheet,
        .factory-stock-polish .document-preview,
        .factory-stock-polish .print-paper-shell {
          width: 100% !important;
          overflow-x: auto !important;
          -webkit-overflow-scrolling: touch;
        }
        .factory-stock-polish .print-preview table,
        .factory-stock-polish .print-sheet table,
        .factory-stock-polish .document-preview table,
        .factory-stock-polish .print-paper-shell table {
          min-width: 640px;
        }
        .factory-stock-polish [role="dialog"] {
          align-items: flex-end !important;
        }
        .factory-stock-polish [role="dialog"] > div {
          border-radius: 18px 18px 0 0 !important;
          max-height: 92dvh !important;
        }
      }
      @media print {
        .factory-stock-polish .no-print,
        .no-print,
        .factory-stock-polish .factory-topbar,
        .factory-stock-polish .mobile-bottom-nav,
        .factory-stock-polish aside,
        .factory-stock-polish .toast,
        .factory-stock-polish .print-actions-bar {
          display: none !important;
        }
        .factory-stock-polish {
          background: #fff !important;
          color: #000 !important;
        }
        .factory-stock-polish .print-preview,
        .factory-stock-polish .print-sheet,
        .factory-stock-polish .document-preview,
        .factory-stock-polish .print-paper-shell {
          border: 0 !important;
          width: 100% !important;
          max-width: 100% !important;
          margin: 0 !important;
          padding: 0 !important;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .factory-stock-polish *, .factory-stock-polish *::before, .factory-stock-polish *::after { transition: none !important; animation: none !important; }
      }
    `}</style>
  );
}


function MainApp() {
  const [items, setItems] = useState([]);
  const [settingsOptions, setSettingsOptions] = useState({
    categories: ['กล้อง', 'เลนส์', 'ไมโครโฟน', 'ชุดลำโพง', 'ถ่าน/แบต', 'สายไฟ', 'อื่นๆ'],
    locations: ['ตู้ A1', 'ห้องเก็บของ 2', 'ห้องประชุมราชพฤกษ์', 'ห้องประชุมสุพรรณิการ์', 'Project Base Learning', 'Arena 1', 'Arena 2', 'อื่นๆ'],
    projects: ['ไม่ระบุโครงการ', 'อื่นๆ'],
    staff: ['แอดมิน', 'อื่นๆ'],
    bundles: [],
    storageBoxes: [],
    prepLists: [],
    backupMeta: {},
    proofStorageMeta: {},
    proofSettings: DEFAULT_PROOF_SETTINGS,
    documentSettings: DEFAULT_DOCUMENT_SETTINGS,
    uiSettings: DEFAULT_UI_SETTINGS,
    accounts: []
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterAssetStatus, setFilterAssetStatus] = useState('all');
  const [filterQrTagged, setFilterQrTagged] = useState('all');

  const [isAdmin, setIsAdmin] = useState(() => {
    try { return localStorage.getItem('mdec_admin') === 'true'; } 
    catch (e) { return false; }
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return localStorage.getItem('mdec_theme') === 'dark'; }
    catch(e) { return false; }
  });
  const [brandLogoError, setBrandLogoError] = useState(false);

  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [pin, setPin] = useState('');
  const [loginUsername, setLoginUsername] = useState('admin');
  const [currentOperator, setCurrentOperator] = useState(() => {
    try { return JSON.parse(localStorage.getItem('mdec_operator') || 'null'); }
    catch (e) { return null; }
  });
  const [accountForm, setAccountForm] = useState({ id: null, name: '', username: '', pin: '', role: 'staff', active: true });
  const [editingAccountId, setEditingAccountId] = useState(null);
  const [firebaseError, setFirebaseError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', sn: '', department: 'ภาพนิ่ง', category: '', newCategory: '', location: '', newLocation: '', status: 'available', assetStatus: 'active', project: '', newProject: '', quantity: 1, owner: '', newOwner: '', isPersonalItem: false, qrTagged: false, internalNote: '' });
  
  const [itemToDelete, setItemToDelete] = useState(null); 
  const [deleteSettingConfirm, setDeleteSettingConfirm] = useState(null);
  
  const [selectedItems, setSelectedItems] = useState([]);
  
  const [borrowTargetIds, setBorrowTargetIds] = useState([]);
  const [borrowData, setBorrowData] = useState({ borrower: '', borrowDate: '', returnDate: '', staff: '', newStaff: '', note: '' });
  
  const [eventTargetIds, setEventTargetIds] = useState([]);
  const [eventData, setEventData] = useState({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' });
  
  const [packingChecklist, setPackingChecklist] = useState([]);
  const [eventChecklist, setEventChecklist] = useState([]);
  
  const [returnTargetIds, setReturnTargetIds] = useState([]);
  const [returnData, setReturnData] = useState({ staff: '', newStaff: '' });
  const [returnChecklist, setReturnChecklist] = useState([]);
  
  const [showHistory, setShowHistory] = useState(null);

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('categories');
  const [newSettingItem, setNewSettingItem] = useState('');
  const [editingSettingItem, setEditingSettingItem] = useState(null);

  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showBundleManager, setShowBundleManager] = useState(false); 
  const [bundleForm, setBundleForm] = useState({ id: null, name: '', itemIds: [] });
  const [bundleSearchTerm, setBundleSearchTerm] = useState(''); 
  
  const [showQuickReturnModal, setShowQuickReturnModal] = useState(false);
  const [showTodayModal, setShowTodayModal] = useState(false);
  const [printSlipData, setPrintSlipData] = useState(null);
  const [printProjectData, setPrintProjectData] = useState(null);
  const [borrowDocuments, setBorrowDocuments] = useState([]);
  const [showBorrowDocsModal, setShowBorrowDocsModal] = useState(false);
  const [borrowDocSearch, setBorrowDocSearch] = useState('');
  const [borrowDocFilter, setBorrowDocFilter] = useState('all');
  const [showPersonalItemsModal, setShowPersonalItemsModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [quickProjectName, setQuickProjectName] = useState('');
  const [projectManagerSearch, setProjectManagerSearch] = useState('');
  const [showProjectAssignModal, setShowProjectAssignModal] = useState(false);
  const [projectAssignTarget, setProjectAssignTarget] = useState('');
  const [projectAssignSelectedIds, setProjectAssignSelectedIds] = useState([]);
  const [projectAssignSearch, setProjectAssignSearch] = useState('');
  const [showRoomView, setShowRoomView] = useState(false);
  const [expandedRooms, setExpandedRooms] = useState({});
  const [showEmptyCategories, setShowEmptyCategories] = useState(false);
  const [showCategorySummary, setShowCategorySummary] = useState(() => { try { return localStorage.getItem('mdec_show_category_summary') === 'true'; } catch(e) { return false; } });
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const [showTrashModal, setShowTrashModal] = useState(false);
  const [showMyAccountModal, setShowMyAccountModal] = useState(false);
  const [myPinForm, setMyPinForm] = useState({ oldPin: '', newPin: '', confirmPin: '' });
  const [showHelpModal, setShowHelpModal] = useState(false);
  const [showAnnualCleanupModal, setShowAnnualCleanupModal] = useState(false);
  const [showBackupCenterModal, setShowBackupCenterModal] = useState(false);
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [quickProblemOnly, setQuickProblemOnly] = useState(false);
  const [auditFilter, setAuditFilter] = useState('all');
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isBusy, setIsBusy] = useState(false);
  const [toasts, setToasts] = useState([]);

  // 🧭 Final Operations Pack: ปฏิทิน / ตรวจนับ / แจ้งซ่อม / ศูนย์ติดตาม / จอทีวี
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [showStockCountModal, setShowStockCountModal] = useState(false);
  const [stockCountFoundIds, setStockCountFoundIds] = useState([]);
  const [stockCountInput, setStockCountInput] = useState('');
  const [showActionCenterModal, setShowActionCenterModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [repairTargetId, setRepairTargetId] = useState(null);
  const [repairForm, setRepairForm] = useState({ issueDate: '', problem: '', reporter: '', sentTo: '', cost: '', doneDate: '', note: '', markAvailable: false });
  const [returnInspection, setReturnInspection] = useState({});
  const [borrowProofFiles, setBorrowProofFiles] = useState([]);
  const [eventProofFiles, setEventProofFiles] = useState([]);
  const [returnProofFiles, setReturnProofFiles] = useState([]);
  const [proofAttachTarget, setProofAttachTarget] = useState(null);
  const [proofAttachFiles, setProofAttachFiles] = useState([]);
  const [showTvDashboardModal, setShowTvDashboardModal] = useState(false);
  const [showTrackingCenterModal, setShowTrackingCenterModal] = useState(false);
  const [trackingTab, setTrackingTab] = useState('today');
  const [showProofCenterModal, setShowProofCenterModal] = useState(false);
  const [proofCenterFilter, setProofCenterFilter] = useState('all');
  const [proofCenterSearch, setProofCenterSearch] = useState('');
  const [expandedProofGroupId, setExpandedProofGroupId] = useState(null);
  const [proofEditTarget, setProofEditTarget] = useState(null);
  const [proofEditForm, setProofEditForm] = useState({ contextLabel: '', note: '' });
  const [proofEditReplaceFiles, setProofEditReplaceFiles] = useState([]);
  const [showSystemHealthModal, setShowSystemHealthModal] = useState(false);
  const [showMonthlyReportModal, setShowMonthlyReportModal] = useState(false);
  const [monthlyReportMonth, setMonthlyReportMonth] = useState(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  });
  const [uiMode, setUiMode] = useState(() => {
    try { return localStorage.getItem('mdec_ui_mode') || 'easy'; } catch(e) { return 'easy'; }
  });
  const [activeWorkspace, setActiveWorkspace] = useState('overview');
  const [borrowReturnMode, setBorrowReturnMode] = useState('borrow');
  const [borrowReturnSearch, setBorrowReturnSearch] = useState('');
  const [selectedPurchaseProject, setSelectedPurchaseProject] = useState(null);
  const [projectMetaEditTarget, setProjectMetaEditTarget] = useState(null);
  const [projectMetaForm, setProjectMetaForm] = useState({ name: '', fiscalYear: '', budget: '', owner: '', startDate: '', endDate: '', objective: '', note: '', status: 'active' });
  const isFullMode = uiMode === 'full';
  const openWorkspace = (workspace = 'overview') => {
    setActiveWorkspace(workspace);
    setShowMoreMenu(false);
    setShowProjectsModal(false);
    setShowStorageBoxesModal(false);
    setShowBundleManager(false);
    if (workspace === 'qrWorkbench') {
      setScanMode('select');
      setQrWorkbenchMode(prev => prev || 'multi');
      setShowScanModal(true);
    } else {
      setShowScanModal(false);
      setUseCamera(false);
    }
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };
  const openControlCenter = () => {
    setActiveWorkspace('overview');
    setShowMoreMenu(true);
    window.setTimeout(() => window.scrollTo({ top: 0, behavior: 'smooth' }), 0);
  };
  const openTrackingCenter = (tab = 'today') => {
    setTrackingTab(tab);
    setShowTrackingCenterModal(true);
  };
  const updateUiMode = (mode) => {
    setUiMode(mode);
    try { localStorage.setItem('mdec_ui_mode', mode); } catch(e) {}
  };

  // 🖨️ สถานะสำหรับ Print & Scan QR Code
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [qrPrintSize, setQrPrintSize] = useState('scanEasy');
  const [qrPrintMode, setQrPrintMode] = useState('plain');
  const [qrPrintColumns, setQrPrintColumns] = useState('auto');
  const [showBoxLabelPrintModal, setShowBoxLabelPrintModal] = useState(false);
  const [showStorageBoxesModal, setShowStorageBoxesModal] = useState(false);
  const [showStorageBoxAssignModal, setShowStorageBoxAssignModal] = useState(false);
  const [showStorageBoxEditor, setShowStorageBoxEditor] = useState(false);
  const [storageBoxForm, setStorageBoxForm] = useState({ id: null, name: '', note: '', size: 'normal', itemIds: [] });
  const [storageBoxSearchTerm, setStorageBoxSearchTerm] = useState('');
  const [showPrepListsModal, setShowPrepListsModal] = useState(false);
  const [showPrepAssignModal, setShowPrepAssignModal] = useState(false);
  const [prepOpenId, setPrepOpenId] = useState(null);
  const [prepForm, setPrepForm] = useState({ id: null, name: '', useDate: '', staff: '', note: '', itemIds: [], checkedIds: [], status: 'pending' });
  const [boxLabelSize, setBoxLabelSize] = useState('normal');
  const [boxLabelStyle, setBoxLabelStyle] = useState('premium');
  const [boxLabelShowChecks, setBoxLabelShowChecks] = useState(false);
  const [boxLabelShowQr, setBoxLabelShowQr] = useState(false);
  const [boxLabelTitle, setBoxLabelTitle] = useState('กล่องอุปกรณ์ MDEC');
  const [boxLabelNote, setBoxLabelNote] = useState('');
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState({ text: '', type: '' });
  const [scanMode, setScanMode] = useState('select'); // select | borrowChecklist | eventChecklist | returnChecklist
  const [qrWorkbenchMode, setQrWorkbenchMode] = useState('multi'); // multi | single
  const [lastScannedItemId, setLastScannedItemId] = useState(null);
  const scanInputRef = useRef(null);
  const scanCooldownRef = useRef(false);

  const [useCamera, setUseCamera] = useState(false);
  const [isScannerLoaded, setIsScannerLoaded] = useState(false);
  const itemsRefForScan = useRef(items);
  const fileInputRef = useRef(null);
  const restoreInputRef = useRef(null);

  useEffect(() => {
    itemsRefForScan.current = items;
  }, [items]);

  useEffect(() => {
    if (!window.Html5QrcodeScanner) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      script.onload = () => setIsScannerLoaded(true);
      document.body.appendChild(script);
    } else {
      setIsScannerLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (showCommandCenter) {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [showCommandCenter]);

  useEffect(() => {
    try { localStorage.setItem('mdec_theme', isDarkMode ? 'dark' : 'light'); } catch(e){}
    if (isDarkMode) {
      document.body.style.backgroundColor = '#0f172a'; 
    } else {
      document.body.style.backgroundColor = '#f1f5f9'; 
    }
  }, [isDarkMode]);

  useEffect(() => {
    try { localStorage.setItem('mdec_show_category_summary', showCategorySummary ? 'true' : 'false'); } catch(e) {}
  }, [showCategorySummary]);

  useEffect(() => {
    if (showScanModal && scanInputRef.current) {
      scanInputRef.current.focus();
    }
  }, [showScanModal]);

  const theme = {
    mainBg: isDarkMode ? 'bg-slate-950' : 'bg-[#f6f8fb]',
    textMain: isDarkMode ? 'text-slate-100' : 'text-slate-800',
    textTitle: isDarkMode ? 'text-white' : 'text-slate-900',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDarkMode ? 'bg-slate-900 border-slate-800 shadow-black/20' : 'bg-white border-slate-200 shadow-slate-200/30',
    input: isDarkMode ? 'bg-slate-950 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-700 focus:ring-blue-500 focus:border-blue-500',
    th: isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600',
    trHover: isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50',
    divide: isDarkMode ? 'divide-slate-700' : 'divide-slate-100',
    btnSecondary: isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border-slate-700 hover:border-slate-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-blue-200',
    btnCancel: isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700' : 'bg-slate-50 text-slate-700 hover:bg-white border border-slate-200',
    modalOverlay: isDarkMode ? 'bg-black/70' : 'bg-slate-900',
    statCard: isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800',
  };



  const renderOrgLogoBox = ({ className = '', imgClassName = 'w-full h-full object-contain', fallbackIconClass = 'w-5 h-5' } = {}) => (
    <div className={`bg-white overflow-hidden flex items-center justify-center shrink-0 ${className}`}>
      {!brandLogoError ? (
        <img src={ORG_LOGO_SRC} alt="MDEC Logo" className={`${imgClassName} ${logoScaleClass}`} onError={() => setBrandLogoError(true)} />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center rounded-inherit">
          <Icons.Package className={fallbackIconClass} />
        </div>
      )}
    </div>
  );

  const renderOrgSignature = ({
    title = 'MDEC-Stock',
    subtitle = 'ศูนย์มัลติมีเดียทางการศึกษา',
    compact = false,
    noText = false,
    containerClass = '',
    titleClass = '',
    subtitleClass = '',
    textWrapClass = '',
    logoClassName = ''
  } = {}) => (
    <div className={`flex items-center ${compact ? 'gap-2' : 'gap-3'} ${containerClass}`}>
      {renderOrgLogoBox({
        className: logoClassName || (compact
          ? 'w-16 h-10 rounded-xl border border-slate-300 px-2 py-1'
          : 'w-24 h-14 rounded-2xl border border-slate-300 px-3 py-2'),
        imgClassName: 'w-full h-full object-contain',
        fallbackIconClass: compact ? 'w-4 h-4' : 'w-6 h-6'
      })}
      {!noText && (
        <div className={`min-w-0 leading-tight ${textWrapClass}`}>
          <div className={`font-black tracking-wide ${compact ? 'text-[10px]' : 'text-sm'} ${titleClass}`}>{title}</div>
          <div className={`font-bold ${compact ? 'text-[9px]' : 'text-xs'} ${subtitleClass}`}>{subtitle}</div>
        </div>
      )}
    </div>
  );


  const documentBrandSettings = { ...DEFAULT_DOCUMENT_SETTINGS, ...(settingsOptions.documentSettings || {}) };
  const showDocumentLogo = (area) => documentBrandSettings?.[area] !== false;
  const logoScaleClass = documentBrandSettings.logoSize === 'large' ? 'scale-110' : documentBrandSettings.logoSize === 'small' ? 'scale-90' : '';
  const isInkSavingDocument = documentBrandSettings.printTone === 'ink';

  const makeDocumentRef = (prefix = 'DOC') => {
    const d = new Date();
    const buddhistYear = d.getFullYear() + 543;
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hour = String(d.getHours()).padStart(2, '0');
    const minute = String(d.getMinutes()).padStart(2, '0');
    const second = String(d.getSeconds()).padStart(2, '0');
    return `${prefix}-${buddhistYear}${month}${day}-${hour}${minute}${second}`;
  };

  const makeBorrowDocumentSnapshot = ({ type = 'borrow', ref, date, subject, staffOut, expectedReturn, note, selectedItems = [], proofs = [] }) => {
    const title = type === 'event' ? 'ใบนำอุปกรณ์ออกงาน' : 'ใบยืมอุปกรณ์';
    return {
      id: ref,
      ref,
      type,
      title,
      date,
      createdAt: date,
      borrower: subject,
      staffOut,
      expectedReturn,
      note: note || '',
      itemIds: selectedItems.map(i => i.id),
      returnedItemIds: [],
      status: 'active',
      statusLabel: 'รอคืน',
      proofs,
      items: selectedItems.map(i => ({
        id: i.id,
        name: i.name || '-',
        sn: i.sn || '-',
        category: i.category || '-',
        location: i.location || '-',
        department: i.department || '-',
        project: i.project || '',
        storageBoxName: i.storageBoxName || '',
        internalNote: i.internalNote || '',
        quantity: i.quantity || 1
      })),
      operatorId: currentOperator?.id || null,
      operatorName: currentOperator?.name || staffOut || currentAccountLabel || 'Admin',
      source: 'MDEC-Stock'
    };
  };

  const openBorrowDocumentPrint = (docData) => {
    if (!docData) return;
    setPrintSlipData({
      type: docData.type || 'borrow',
      title: docData.title || (docData.type === 'event' ? 'ใบนำอุปกรณ์ออกงาน' : 'ใบยืมอุปกรณ์'),
      ref: docData.ref || docData.id || makeDocumentRef('DOC'),
      date: docData.date || docData.createdAt || new Date().toISOString(),
      borrower: docData.borrower || docData.eventName || '-',
      staffOut: docData.staffOut || '-',
      expectedReturn: docData.expectedReturn || '',
      note: docData.note || '',
      items: Array.isArray(docData.items) ? docData.items : [],
      archivedStatus: docData.status || 'active'
    });
  };

  const saveDocumentSettings = async (patch = {}) => {
    const nextDocumentSettings = { ...DEFAULT_DOCUMENT_SETTINGS, ...(settingsOptions.documentSettings || {}), ...patch };
    const nextSettings = { ...settingsOptions, documentSettings: nextDocumentSettings };
    setSettingsOptions(nextSettings);
    try {
      await setDoc(getSettingsDoc(), nextSettings);
      pushToast('บันทึกการตั้งค่าเอกสาร/โลโก้เรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error(error);
      alert('❌ บันทึกการตั้งค่าเอกสารไม่สำเร็จ: ' + error.message);
    }
  };

  const uiDisplaySettings = { ...DEFAULT_UI_SETTINGS, ...(settingsOptions.uiSettings || {}) };
  const isCompactUi = uiDisplaySettings.density === 'compact';
  const isComfortableUi = !isCompactUi;
  const cleanModeEnabled = uiDisplaySettings.cleanMode !== false;
  const mobileCardsEnabled = uiDisplaySettings.mobileCards !== false;
  const reduceEffectsEnabled = uiDisplaySettings.reduceEffects === true;
  const pagePaddingClass = isCompactUi ? 'p-3 sm:p-5 pb-28' : 'p-4 sm:p-8 pb-32';
  const appShellPaddingClass = activeWorkspace === 'qrWorkbench' ? 'p-2 sm:p-4 pb-2' : pagePaddingClass;
  const panelPaddingClass = isCompactUi ? 'p-4 sm:p-5' : 'p-5 sm:p-6';
  const controlPaddingClass = isCompactUi ? 'py-3' : 'py-4';
  const rowTextSizeClass = isCompactUi ? 'text-sm' : 'text-base';
  const cardGapClass = isCompactUi ? 'gap-3' : 'gap-4';

  const saveUiSettings = async (patch = {}) => {
    const nextUiSettings = { ...DEFAULT_UI_SETTINGS, ...(settingsOptions.uiSettings || {}), ...patch };
    const nextSettings = { ...settingsOptions, uiSettings: nextUiSettings };
    setSettingsOptions(nextSettings);
    try {
      await setDoc(getSettingsDoc(), nextSettings);
      pushToast('บันทึกการตั้งค่าการแสดงผลเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error(error);
      alert('❌ บันทึกการตั้งค่าการแสดงผลไม่สำเร็จ: ' + error.message);
    }
  };

  const pushToast = (message, type = 'info', title = '') => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
    const raw = String(message || '');
    let clean = raw.replace(/^[✅❌⚠️🚨]+\s*/u, '').trim();
    const inferredType = type !== 'info' ? type : raw.includes('❌') || raw.includes('🚨') ? 'error' : raw.includes('⚠') ? 'warning' : raw.includes('✅') ? 'success' : 'info';
    setToasts(prev => [...prev.slice(-3), { id, title: title || (inferredType === 'success' ? 'สำเร็จ' : inferredType === 'error' ? 'เกิดข้อผิดพลาด' : inferredType === 'warning' ? 'แจ้งเตือน' : 'ข้อมูล'), message: clean, type: inferredType }]);
    window.setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 4200);
  };

  useEffect(() => {
    const originalAlert = window.alert;
    window.alert = (message) => pushToast(String(message || ''), 'info');
    return () => { window.alert = originalAlert; };
  }, []);



  const notify = (title, message = '', type = 'info') => {
    const cleanTitle = String(title || '').trim();
    const cleanMessage = String(message || '').trim();
    pushToast(cleanMessage || cleanTitle, type, cleanTitle);
  };

  const runWithBusy = async (task) => {
    if (isBusy) return;
    setIsBusy(true);
    try { await task(); }
    finally { setIsBusy(false); }
  };

  const confirmCloseIfDirty = (isDirty, closeFn) => {
    if (!isDirty || window.confirm('ข้อมูลยังไม่ได้บันทึก ต้องการปิดหน้าต่างนี้จริงหรือไม่?')) closeFn();
  };


  const getProofLocationText = async () => {
    if (!navigator?.geolocation) return 'ไม่ระบุตำแหน่ง';
    return new Promise((resolve) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve(`พิกัด GPS: ${pos.coords.latitude.toFixed(6)}, ${pos.coords.longitude.toFixed(6)}`),
        () => resolve('ไม่ระบุตำแหน่ง'),
        { enableHighAccuracy: true, timeout: 4500, maximumAge: 60000 }
      );
    });
  };

  const loadImageFromFile = (file) => new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => { URL.revokeObjectURL(url); resolve(img); };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้')); };
    img.src = url;
  });

  const canvasToJpegBlob = (canvas, quality = 0.7) => new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality));

  const blobToDataUrl = (blob) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

  const formatProofBytes = (bytes) => {
    const n = Number(bytes) || 0;
    if (n < 1024) return `${n} B`;
    if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
    return `${(n / 1024 / 1024).toFixed(2)} MB`;
  };

  const drawStampedProofCanvas = (img, maxSide, contextLabel, timestampText, locationText) => {
    const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
    const width = Math.max(1, Math.round(img.width * scale));
    const height = Math.max(1, Math.round(img.height * scale));
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, width, height);

    if (showDocumentLogo('proofStamp')) {
      const badgePad = Math.max(10, Math.round(width * 0.018));
      const badgeW = Math.max(170, Math.round(width * 0.25));
      const badgeH = Math.max(42, Math.round(width * 0.055));
      ctx.fillStyle = 'rgba(255,255,255,0.88)';
      ctx.fillRect(badgePad, badgePad, badgeW, badgeH);
      ctx.strokeStyle = 'rgba(37,99,235,0.45)';
      ctx.lineWidth = Math.max(2, Math.round(width * 0.002));
      ctx.strokeRect(badgePad, badgePad, badgeW, badgeH);
      ctx.fillStyle = '#1d4ed8';
      ctx.font = `800 ${Math.max(14, Math.round(width * 0.018))}px sans-serif`;
      ctx.fillText('MDEC STOCK', badgePad + Math.round(badgeH * 0.35), badgePad + Math.round(badgeH * 0.45));
      ctx.fillStyle = '#334155';
      ctx.font = `700 ${Math.max(10, Math.round(width * 0.013))}px sans-serif`;
      ctx.fillText('ศูนย์มัลติมีเดียทางการศึกษา', badgePad + Math.round(badgeH * 0.35), badgePad + Math.round(badgeH * 0.78));
    }

    const stripHeight = Math.max(82, Math.round(height * 0.12));
    const y = Math.max(0, height - stripHeight);
    ctx.fillStyle = 'rgba(0,0,0,0.70)';
    ctx.fillRect(0, y, width, stripHeight);
    const pad = Math.max(14, Math.round(width * 0.024));
    const fontBig = Math.max(18, Math.round(width * 0.030));
    const fontSmall = Math.max(14, Math.round(width * 0.021));
    ctx.fillStyle = '#ffffff';
    ctx.font = `700 ${fontBig}px sans-serif`;
    ctx.fillText(`MDEC STOCK • ${contextLabel}`, pad, y + Math.round(stripHeight * 0.35));
    ctx.font = `600 ${fontSmall}px sans-serif`;
    ctx.fillText(`เวลา: ${timestampText}`, pad, y + Math.round(stripHeight * 0.62));
    ctx.fillText(locationText, pad, y + Math.round(stripHeight * 0.85));
    return canvas;
  };

  const createStampedProofData = async (file, contextLabel = 'หลักฐาน') => {
    if (!file || !String(file.type || '').startsWith('image/')) {
      throw new Error('รองรับเฉพาะไฟล์รูปภาพเท่านั้น');
    }
    const img = await loadImageFromFile(file);
    const locationText = await getProofLocationText();
    const now = new Date();
    const timestampText = now.toLocaleString('th-TH', { hour12: false });

    const proofSettings = { ...DEFAULT_PROOF_SETTINGS, ...(settingsOptions.proofSettings || {}) };
    const targetBytes = Math.max(60, Number(proofSettings.targetKB) || 150) * 1024;
    const warnBytes = Math.max(targetBytes, Number(proofSettings.warnKB) || 250) * 1024;
    const maxBytes = Math.max(warnBytes, Number(proofSettings.maxKB) || 500) * 1024;
    let maxSide = Math.max(560, Math.min(1400, Number(proofSettings.maxSide) || 1000));
    let quality = 0.68;
    let canvas = null;
    let blob = null;

    for (let round = 0; round < 12; round++) {
      canvas = drawStampedProofCanvas(img, maxSide, contextLabel, timestampText, locationText);
      blob = await canvasToJpegBlob(canvas, quality);
      if (!blob) throw new Error('ไม่สามารถสร้างไฟล์หลักฐานได้');
      if (blob.size <= targetBytes) break;
      if (quality > 0.40) {
        quality = Math.max(0.38, quality - 0.08);
      } else if (maxSide > 560) {
        maxSide = Math.max(560, maxSide - 160);
        quality = 0.62;
      } else {
        break;
      }
    }

    if (blob.size > maxBytes) {
      throw new Error(`รูปหลักฐานยังใหญ่เกิน ${proofSettings.maxKB || 500} KB หลังบีบอัด กรุณาถ่ายใหม่หรือเลือกรูปที่เล็กลง`);
    }
    if (blob.size > warnBytes) {
      pushToast(`รูปหลักฐานนี้มีขนาด ${formatProofBytes(blob.size)} ใกล้เกินค่าที่แนะนำ`, 'warning');
    }

    const dataUrl = await blobToDataUrl(blob);
    const thumbCanvas = drawStampedProofCanvas(img, 320, contextLabel, timestampText, locationText);
    const thumbBlob = await canvasToJpegBlob(thumbCanvas, 0.55);
    const thumbUrl = thumbBlob ? await blobToDataUrl(thumbBlob) : dataUrl;

    return {
      dataUrl,
      thumbUrl,
      sizeBytes: blob.size,
      thumbBytes: thumbBlob?.size || 0,
      sizeText: formatProofBytes(blob.size),
      timestampText,
      locationText,
      createdAt: now.toISOString()
    };
  };

  const uploadProofFiles = async (files, contextLabel = 'หลักฐาน') => {
    const selected = Array.from(files || []).filter(Boolean);
    if (selected.length === 0) return [];
    const proofSettings = { ...DEFAULT_PROOF_SETTINGS, ...(settingsOptions.proofSettings || {}) };
    const maxImages = Math.max(1, Math.min(5, Number(proofSettings.maxImagesPerAction) || 3));
    const limited = selected.slice(0, maxImages);
    if (selected.length > maxImages) pushToast(`เลือกรูปได้สูงสุดครั้งละ ${maxImages} รูป เพื่อลดพื้นที่จัดเก็บ`, 'warning');
    const proofList = [];
    let totalStoredBytes = 0;

    for (const file of limited) {
      const stamped = await createStampedProofData(file, contextLabel);
      const proofId = `proof_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const proofDoc = {
        id: proofId,
        dataUrl: stamped.dataUrl,
        thumbUrl: stamped.thumbUrl,
        originalName: file.name || 'camera.jpg',
        createdAt: stamped.createdAt,
        timestampText: stamped.timestampText,
        locationText: stamped.locationText,
        createdBy: currentAccountLabel,
        contextLabel,
        storageType: 'firestore-doc-base64',
        sizeBytes: stamped.sizeBytes,
        thumbBytes: stamped.thumbBytes,
        sizeText: stamped.sizeText,
        appId: APP_ID
      };
      await setDoc(getProofDoc(proofId), proofDoc);
      totalStoredBytes += Number(stamped.sizeBytes || 0) + Number(stamped.thumbBytes || 0);
      proofList.push({
        id: proofId,
        proofDocId: proofId,
        thumbUrl: stamped.thumbUrl,
        originalName: file.name || 'camera.jpg',
        createdAt: stamped.createdAt,
        timestampText: stamped.timestampText,
        locationText: stamped.locationText,
        createdBy: currentAccountLabel,
        contextLabel,
        storageType: 'firestore-doc-base64',
        sizeBytes: stamped.sizeBytes,
        sizeText: stamped.sizeText
      });
    }

    if (proofList.length > 0) {
      try {
        const oldMeta = settingsOptions.proofStorageMeta || {};
        const newMeta = {
          ...oldMeta,
          count: (Number(oldMeta.count) || 0) + proofList.length,
          totalBytes: (Number(oldMeta.totalBytes) || 0) + totalStoredBytes,
          updatedAt: new Date().toISOString()
        };
        const newSettings = { ...settingsOptions, proofStorageMeta: newMeta };
        setSettingsOptions(newSettings);
        await setDoc(getSettingsDoc(), newSettings, { merge: true });
      } catch (metaError) {
        console.warn('Proof storage meta update failed:', metaError);
      }
    }
    return proofList;
  };

  const uploadProofsOrConfirm = async (files, contextLabel) => {
    const selected = Array.from(files || []).filter(Boolean);
    if (selected.length === 0) return [];
    try {
      return await uploadProofFiles(selected, contextLabel);
    } catch (error) {
      console.error('Proof upload failed:', error);
      const proceed = window.confirm(`อัปโหลดหลักฐานรูปภาพไม่สำเร็จ\n${error.message || ''}\n\nต้องการบันทึกรายการต่อโดยไม่มีรูปหลักฐานหรือไม่?`);
      if (!proceed) throw error;
      return [];
    }
  };

  const requireProofIfNeeded = (type, files) => {
    const requirement = getProofRequirement(type);
    if (requirement !== 'required') return true;
    if (Array.from(files || []).filter(Boolean).length > 0) return true;
    const label = type === 'borrow' ? 'การยืม' : type === 'event' ? 'การนำออกงาน' : 'การรับคืน';
    pushToast(`กติกาปัจจุบันกำหนดให้ต้องแนบรูปหลักฐานสำหรับ${label}`, 'warning');
    return false;
  };

  const renderProofUploader = (label, proofFiles, setProofFiles, tone = 'blue') => {
    const toneClass = tone === 'purple'
      ? (isDarkMode ? 'bg-purple-900/20 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800')
      : tone === 'orange'
      ? (isDarkMode ? 'bg-orange-900/20 border-orange-800 text-orange-300' : 'bg-orange-50 border-orange-200 text-orange-800')
      : (isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-800');
    return (
      <div className={`p-4 rounded-xl border ${toneClass}`}>
        <label className={`block text-base font-black mb-2 ${theme.textTitle}`}>📷 {label} <span className={`text-sm font-normal ${theme.textMuted}`}>(ไม่บังคับ)</span></label>
        <p className={`text-xs font-bold mb-3 ${theme.textMuted}`}>เลือกไฟล์รูป หรือถ่ายด้วยกล้องมือถือ Systemจะย่อไฟล์ ประทับเวลา และพิกัด GPS ลงบนรูปถ้าอนุญาตตำแหน่ง แล้วเก็บไว้ใน Firestore โดยไม่ใช้ Firebase Storage • เป้าหมายประมาณ {activeProofSettings.targetKB} KB/รูป • สูงสุด {activeProofSettings.maxImagesPerAction} รูป/ครั้ง</p>
        <input
          type="file"
          accept="image/*"
          capture="environment"
          multiple
          className={`w-full text-sm font-bold rounded-xl border p-3 ${theme.input}`}
          onChange={(e) => setProofFiles(Array.from(e.target.files || []))}
        />
        {proofFiles.length > 0 && (
          <div className="mt-3 space-y-1">
            <div className="flex justify-between items-center gap-2">
              <span className="text-xs font-black">เลือกรูปแล้ว {proofFiles.length} รูป</span>
              <button type="button" onClick={() => setProofFiles([])} className={`text-xs font-black px-2 py-1 rounded-lg ${theme.btnCancel}`}>ล้างรูป</button>
            </div>
            {proofFiles.slice(0, 3).map((f, idx) => <div key={idx} className="text-[11px] font-bold truncate opacity-80">• {f.name || `รูปจากกล้อง ${idx + 1}`}</div>)}
          </div>
        )}
      </div>
    );
  };

  const openProofImage = async (proof) => {
    try {
      if (!proof) return;
      if (proof.url && (String(proof.url).startsWith('http') || String(proof.url).startsWith('data:'))) {
        window.open(proof.url, '_blank', 'noopener,noreferrer');
        return;
      }
      const proofId = proof.proofDocId || proof.id;
      if (!proofId) return alert('ไม่พบรหัสรูปหลักฐาน');
      const win = window.open('', '_blank');
      if (win) {
        win.document.write('<html><head><title>กำลังโหลดหลักฐาน...</title></head><body style="font-family:sans-serif;padding:24px;">กำลังโหลดรูปหลักฐาน...</body></html>');
      }
      const snap = await getDoc(getProofDoc(proofId));
      if (!snap.exists()) {
        if (win) win.document.body.innerHTML = '<p>ไม่พบรูปหลักฐานในฐานข้อมูล</p>';
        else alert('ไม่พบรูปหลักฐานในฐานข้อมูล');
        return;
      }
      const data = snap.data();
      const src = data.dataUrl || data.url;
      if (!src) throw new Error('เอกสารหลักฐานไม่มีข้อมูลรูปภาพ');
      const caption = `${data.contextLabel || 'หลักฐาน'} | ${data.timestampText || ''} | ${data.locationText || ''}`;
      if (win) {
        win.document.open();
        win.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>MDEC Proof</title></head><body style="margin:0;background:#111;color:#fff;font-family:sans-serif;"><div style="padding:12px 16px;background:#000;font-size:14px;font-weight:700;">${caption.replace(/</g, '&lt;')}</div><div style="height:calc(100vh - 52px);display:flex;align-items:center;justify-content:center;padding:12px;box-sizing:border-box;"><img src="${src}" style="display:block;max-width:100%;max-height:100%;object-fit:contain;margin:0 auto;" /></div></body></html>`);
        win.document.close();
      } else {
        window.open(src, '_blank', 'noopener,noreferrer');
      }
    } catch (error) {
      console.error(error);
      alert('เปิดรูปหลักฐานไม่ได้: ' + error.message);
    }
  };

  const renderProofGallery = (proofs = [], itemKeyword = '') => {
    const list = Array.isArray(proofs) ? proofs : [];
    if (list.length === 0) return null;
    const first = list[0] || {};
    const previewSrc = first.thumbUrl || first.url || '';
    const openProofCenterFromHistory = () => {
      setProofCenterSearch(itemKeyword || first.contextLabel || first.originalName || '');
      setProofCenterFilter('all');
      setShowProofCenterModal(true);
    };
    return (
      <div className={`mt-4 p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
        <div className="flex items-center gap-3">
          <button type="button" onClick={() => openProofImage(first)} className={`w-20 h-16 rounded-xl overflow-hidden border shrink-0 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`} title="เปิดรูปแรก">
            {previewSrc ? <img src={previewSrc} alt="หลักฐาน" className="w-full h-full object-contain bg-slate-100" /> : <div className={`w-full h-full flex items-center justify-center text-xs font-black ${theme.textMuted}`}>รูป</div>}
          </button>
          <div className="min-w-0 flex-1">
            <div className={`text-sm font-black ${theme.textTitle}`}>มีหลักฐานรูปภาพ {list.length.toLocaleString('th-TH')} รูป</div>
            <div className={`text-xs font-bold truncate ${theme.textMuted}`}>{first.timestampText || (first.createdAt ? new Date(first.createdAt).toLocaleString('th-TH') : 'ไม่ระบุเวลา')} • โดย {first.createdBy || '-'}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button type="button" onClick={() => openProofImage(first)} className={`px-3 py-2 rounded-xl text-xs font-black border ${theme.btnSecondary}`}>เปิดรูปแรก</button>
          <button type="button" onClick={openProofCenterFromHistory} className="px-3 py-2 rounded-xl text-xs font-black bg-pink-600 text-white">ดูในศูนย์หลักฐาน</button>
        </div>
      </div>
    );
  };

  const handleAttachProofsToHistory = async () => {
    if (!proofAttachTarget || proofAttachFiles.length === 0) return alert('กรุณาเลือกรูปหลักฐานอย่างน้อย 1 รูป');
    const item = items.find(i => i.id === proofAttachTarget.itemId);
    if (!item) return alert('ไม่พบอุปกรณ์ที่ต้องการเพิ่มหลักฐาน');
    const history = Array.isArray(item.history) ? [...item.history] : [];
    const historyIndex = Number(proofAttachTarget.historyIndex);
    if (!history[historyIndex]) return alert('ไม่พบประวัติรายการนี้');
    try {
      setIsBusy(true);
      const typeLabel = history[historyIndex].type === 'borrow' ? 'หลักฐานการยืม' : history[historyIndex].type === 'event' ? 'หลักฐานออกงาน' : 'หลักฐานรับคืน';
      const uploadedProofs = await uploadProofFiles(proofAttachFiles, `${typeLabel} • ${item.name || ''}`);
      history[historyIndex] = { ...history[historyIndex], proofs: [...(history[historyIndex].proofs || []), ...uploadedProofs] };
      await setDoc(getItemDoc(item.id), { history, updatedAt: new Date().toISOString(), updatedBy: currentAccountLabel }, { merge: true });
      await logAction('เพิ่มหลักฐานรูปภาพ', item.name || '-', `เพิ่มหลักฐาน ${uploadedProofs.length} รูป ในประวัติรายการที่ ${historyIndex + 1}`);
      setProofAttachTarget(null);
      setProofAttachFiles([]);
      pushToast('เพิ่มหลักฐานรูปภาพเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error(error);
      alert('❌ เพิ่มหลักฐานไม่สำเร็จ: ' + error.message);
    } finally {
      setIsBusy(false);
    }
  };

  const openProofEditModal = (group) => {
    if (!group) return;
    const proof = group.proof || {};
    const representative = group.representative || {};
    setProofEditTarget(group);
    setProofEditForm({
      contextLabel: proof.contextLabel || representative.typeLabel || 'หลักฐาน',
      note: proof.note || representative.note || ''
    });
    setProofEditReplaceFiles([]);
  };

  const updateProofReferencesInItems = async (targetProofKey, updater) => {
    const updateTasks = [];
    items.filter(item => item && !item.isDeleted).forEach((item) => {
      let changed = false;
      const history = (Array.isArray(item.history) ? item.history : []).map((h) => {
        const proofs = Array.isArray(h.proofs) ? h.proofs : [];
        const nextProofs = proofs.map((proof) => {
          if (getProofUniqueKey(proof) !== targetProofKey) return proof;
          changed = true;
          return updater(proof, h, item);
        }).filter(Boolean);
        return changed && nextProofs !== proofs ? { ...h, proofs: nextProofs } : h;
      });
      if (changed) {
        updateTasks.push(setDoc(getItemDoc(item.id), {
          history,
          updatedAt: new Date().toISOString(),
          updatedBy: currentAccountLabel
        }, { merge: true }));
      }
    });
    await Promise.all(updateTasks);
    return updateTasks.length;
  };

  const handleSaveProofEdit = async () => {
    if (!proofEditTarget) return;
    if (!canUseOperationalTools) return alert('บัญชีนี้ไม่มีสิทธิ์แก้ไขรูปหลักฐาน');
    const targetKey = proofEditTarget.groupId;
    const proofDocId = proofEditTarget.proof?.proofDocId || proofEditTarget.proof?.id || proofEditTarget.groupId;
    const cleanedContextLabel = String(proofEditForm.contextLabel || '').trim() || 'หลักฐาน';
    const cleanedNote = String(proofEditForm.note || '').trim();
    const updatedFields = {
      contextLabel: cleanedContextLabel,
      note: cleanedNote,
      updatedAt: new Date().toISOString(),
      updatedBy: currentAccountLabel
    };

    try {
      setIsBusy(true);
      let affectedItems = 0;
      const replaceFile = Array.from(proofEditReplaceFiles || []).filter(Boolean)[0];

      if (replaceFile) {
        const replacementList = await uploadProofFiles([replaceFile], cleanedContextLabel);
        const replacement = {
          ...(replacementList[0] || {}),
          contextLabel: cleanedContextLabel,
          note: cleanedNote,
          replacedFrom: proofDocId || targetKey,
          replacedAt: new Date().toISOString(),
          replacedBy: currentAccountLabel
        };
        if (!replacement.id && !replacement.proofDocId) throw new Error('ไม่สามารถสร้างรูปหลักฐานใหม่ได้');

        const newProofDocId = replacement.proofDocId || replacement.id;
        try {
          await setDoc(getProofDoc(newProofDocId), {
            contextLabel: cleanedContextLabel,
            note: cleanedNote,
            replacedFrom: proofDocId || targetKey,
            updatedAt: new Date().toISOString(),
            updatedBy: currentAccountLabel
          }, { merge: true });
        } catch (newProofDocError) {
          console.warn('New proof doc meta update skipped:', newProofDocError);
        }

        affectedItems = await updateProofReferencesInItems(targetKey, () => replacement);

        try {
          if (proofDocId && proofDocId !== newProofDocId) await deleteDoc(getProofDoc(proofDocId));
        } catch (proofDocError) {
          console.warn('Old proof doc delete skipped:', proofDocError);
        }

        try {
          const oldMeta = settingsOptions.proofStorageMeta || {};
          const bytesToRemove = (Number(proofEditTarget.proof?.sizeBytes) || 0) + (Number(proofEditTarget.proof?.thumbBytes) || 0);
          const newMeta = {
            ...oldMeta,
            count: Math.max(0, Number(oldMeta.count) || 0),
            totalBytes: Math.max(0, (Number(oldMeta.totalBytes) || 0) - bytesToRemove),
            updatedAt: new Date().toISOString()
          };
          await setDoc(getSettingsDoc(), { proofStorageMeta: newMeta }, { merge: true });
          setSettingsOptions(prev => ({ ...prev, proofStorageMeta: newMeta }));
        } catch (metaError) {
          console.warn('Proof replacement meta update skipped:', metaError);
        }

        await logAction('แทนที่รูปหลักฐาน', cleanedContextLabel, `แทนที่รูปหลักฐานที่เชื่อมโยงกับ ${affectedItems} อุปกรณ์/รายการ`);
        pushToast('แทนที่รูปหลักฐานเรียบร้อยแล้ว', 'success');
      } else {
        affectedItems = await updateProofReferencesInItems(targetKey, (proof) => ({ ...proof, ...updatedFields }));
        try {
          if (proofDocId) await setDoc(getProofDoc(proofDocId), updatedFields, { merge: true });
        } catch (proofDocError) {
          console.warn('Proof doc edit skipped:', proofDocError);
        }
        await logAction('แก้ไขข้อมูลรูปหลักฐาน', cleanedContextLabel, `แก้ไขข้อมูลรูปหลักฐานที่เชื่อมโยงกับ ${affectedItems} อุปกรณ์/รายการ`);
        pushToast('แก้ไขข้อมูลรูปหลักฐานเรียบร้อยแล้ว', 'success');
      }

      setProofEditTarget(null);
      setProofEditForm({ contextLabel: '', note: '' });
      setProofEditReplaceFiles([]);
    } catch (error) {
      console.error(error);
      alert('❌ แก้ไขรูปหลักฐานไม่สำเร็จ: ' + error.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteProofGroup = async (group) => {
    if (!group) return;
    if (!canUseOperationalTools) return alert('บัญชีนี้ไม่มีสิทธิ์ลบรูปหลักฐาน');
    const targetKey = group.groupId;
    const proofDocId = group.proof?.proofDocId || group.proof?.id || group.groupId;
    const linkedItems = group.itemRefs?.length || group.entries?.length || 1;
    const ok = window.confirm(`คุณกำลังลบรูปหลักฐานนี้\n\nรูปนี้เกี่ยวข้องกับ ${linkedItems} อุปกรณ์/รายการ\nเมื่อลบแล้ว รูปจะหายจากประวัติทั้งหมดที่เกี่ยวข้อง และไม่สามารถกู้คืนจากSystemได้\n\nต้องการลบต่อหรือไม่?`);
    if (!ok) return;

    try {
      setIsBusy(true);
      const affectedItems = await updateProofReferencesInItems(targetKey, () => null);

      try {
        if (proofDocId) await deleteDoc(getProofDoc(proofDocId));
      } catch (proofDocError) {
        console.warn('Proof doc delete skipped:', proofDocError);
      }

      try {
        const oldMeta = settingsOptions.proofStorageMeta || {};
        const bytesToRemove = (Number(group.proof?.sizeBytes) || 0) + (Number(group.proof?.thumbBytes) || 0);
        const newMeta = {
          ...oldMeta,
          count: Math.max(0, (Number(oldMeta.count) || 0) - 1),
          totalBytes: Math.max(0, (Number(oldMeta.totalBytes) || 0) - bytesToRemove),
          updatedAt: new Date().toISOString()
        };
        await setDoc(getSettingsDoc(), { proofStorageMeta: newMeta }, { merge: true });
        setSettingsOptions(prev => ({ ...prev, proofStorageMeta: newMeta }));
      } catch (metaError) {
        console.warn('Proof meta update skipped:', metaError);
      }

      await logAction('ลบรูปหลักฐาน', group.representative?.itemName || 'รูปหลักฐาน', `ลบรูปหลักฐานที่เชื่อมโยงกับ ${affectedItems} อุปกรณ์/รายการ`);
      setExpandedProofGroupId(null);
      pushToast('ลบรูปหลักฐานเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error(error);
      alert('❌ ลบรูปหลักฐานไม่สำเร็จ: ' + error.message);
    } finally {
      setIsBusy(false);
    }
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth init error", error);
        setFirebaseError(true);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;
    const itemsRef = getItemsCol();
    const settingsRef = getSettingsDoc();
    const borrowDocsRef = getBorrowDocsCol();

    const unsubscribeBorrowDocs = onSnapshot(borrowDocsRef, (snapshot) => {
      const docs = [];
      snapshot.forEach((docSnap) => docs.push({ id: docSnap.id, ...docSnap.data() }));
      docs.sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0));
      setBorrowDocuments(docs);
    }, (error) => {
      console.warn('Borrow document archive snapshot skipped:', error);
    });

    const unsubscribeItems = onSnapshot(itemsRef, (snapshot) => {
      const loadedItems = [];
      snapshot.forEach((docSnap) => { loadedItems.push({ ...docSnap.data(), id: docSnap.id }); });
      setItems(loadedItems);
      setFirebaseError(false);
      setIsInitialLoading(false);
    }, (error) => {
      console.error(error);
      setFirebaseError(true);
      setIsInitialLoading(false);
    });

    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettingsOptions({
          categories: data.categories || ['กล้อง', 'เลนส์', 'ไมโครโฟน', 'ชุดลำโพง', 'ถ่าน/แบต', 'สายไฟ', 'อื่นๆ'],
          locations: data.locations || ['ตู้ A1', 'ห้องเก็บของ 2', 'ห้องประชุม 1', 'อื่นๆ'],
          staff: data.staff || ['แอดมิน', 'อื่นๆ'],
          bundles: data.bundles || [],
          storageBoxes: data.storageBoxes || [],
          prepLists: data.prepLists || [],
          // ✅ สำคัญ: ต้องโหลด projects/projectMeta กลับเข้ามาด้วย ไม่งั้นสร้างโครงการแล้ว onSnapshot จะเขียน state ทับจนเหมือนโครงการหาย
          projects: Array.isArray(data.projects) ? data.projects : ['อื่นๆ'],
          projectMeta: data.projectMeta || {},
          backupMeta: data.backupMeta || {},
          proofStorageMeta: data.proofStorageMeta || {},
          proofSettings: { ...DEFAULT_PROOF_SETTINGS, ...(data.proofSettings || {}) },
          documentSettings: { ...DEFAULT_DOCUMENT_SETTINGS, ...(data.documentSettings || {}) },
          uiSettings: { ...DEFAULT_UI_SETTINGS, ...(data.uiSettings || {}) },
          accounts: data.accounts || []
        });
      } else {
        const defaultSettings = {
          categories: ['กล้อง', 'เลนส์', 'ไมโครโฟน', 'ชุดลำโพง', 'ถ่าน/แบต', 'สายไฟ', 'อื่นๆ'],
          locations: ['ตู้ A1', 'ห้องเก็บของ 2', 'ห้องประชุม 1', 'อื่นๆ'],
          staff: ['แอดมิน', 'อื่นๆ'],
          bundles: [],
          storageBoxes: [],
          prepLists: [],
          projects: ['อื่นๆ'],
          projectMeta: {},
          backupMeta: {},
          proofStorageMeta: {},
          proofSettings: DEFAULT_PROOF_SETTINGS,
          documentSettings: DEFAULT_DOCUMENT_SETTINGS,
          uiSettings: DEFAULT_UI_SETTINGS,
          accounts: [] 
        };
        setDoc(settingsRef, defaultSettings).catch(e => console.log("Init settings failed:", e));
      }
    }, (error) => {
      console.error(error);
      setFirebaseError(true);
    });

    return () => {
      unsubscribeItems();
      unsubscribeSettings();
      unsubscribeBorrowDocs();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (showAuditModal || showCommandCenter) {
      const auditRef = getAuditCol();
      const unsub = onSnapshot(auditRef, (snapshot) => {
        const logs = [];
        snapshot.forEach((docSnap) => logs.push({ id: docSnap.id, ...docSnap.data() }));
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setAuditLogs(logs);
      }, (error) => console.error(error));
      return () => unsub();
    }
  }, [user, showAuditModal, showCommandCenter]);

  const getEffectiveAccounts = () => {
    const savedAccounts = Array.isArray(settingsOptions.accounts) ? settingsOptions.accounts : [];
    const hasCentral = savedAccounts.some(acc => String(acc.username || '').toLowerCase() === 'admin');
    const centralAccount = { id: 'central_admin', name: 'บัญชีกลาง', username: 'admin', pin: ADMIN_PIN, role: 'owner', active: true, builtIn: true };
    return hasCentral ? savedAccounts : [centralAccount, ...savedAccounts];
  };

  const currentAccountLabel = currentOperator?.name || (isAdmin ? 'แอดมิน' : 'ผู้ใช้งานทั่วไป');
  const currentAccountRole = currentOperator?.role || (isAdmin ? 'owner' : 'viewer');
  const isLoggedIn = !!isAdmin;
  const canManageAccounts = isAdmin && (currentAccountRole === 'owner' || currentAccountRole === 'admin');
  const canManageSystem = isAdmin && (currentAccountRole === 'owner' || currentAccountRole === 'admin');
  const canViewAudit = isAdmin && (currentAccountRole === 'owner' || currentAccountRole === 'admin');
  const canUseOperationalTools = isAdmin && ['owner', 'admin', 'staff'].includes(currentAccountRole);
  const canAddEditItems = canUseOperationalTools;
  const canDeleteItems = isAdmin && (currentAccountRole === 'owner' || currentAccountRole === 'admin');
  const currentFullAccount = getEffectiveAccounts().find(acc => acc.id === currentOperator?.id || String(acc.username || '').toLowerCase() === String(currentOperator?.username || '').toLowerCase()) || currentOperator;
  const activeProofSettings = { ...DEFAULT_PROOF_SETTINGS, ...(settingsOptions.proofSettings || {}) };
  const proofRequirementLabel = (value) => value === 'required' ? 'บังคับ' : value === 'recommended' ? 'แนะนำ' : 'ไม่บังคับ';
  const getProofRequirement = (type) => {
    const key = type === 'borrow' ? 'borrowRequirement' : type === 'event' ? 'eventRequirement' : 'returnRequirement';
    return activeProofSettings[key] || 'recommended';
  };
  const updateProofSettings = async (patch) => {
    if (!canManageSystem) return pushToast('คุณไม่มีสิทธิ์แก้ไขกติกาหลักฐาน', 'warning');
    const merged = { ...activeProofSettings, ...patch };
    const cleaned = {
      ...merged,
      targetKB: Math.max(60, Math.min(300, Number(merged.targetKB) || DEFAULT_PROOF_SETTINGS.targetKB)),
      warnKB: Math.max(80, Math.min(600, Number(merged.warnKB) || DEFAULT_PROOF_SETTINGS.warnKB)),
      maxKB: Math.max(120, Math.min(900, Number(merged.maxKB) || DEFAULT_PROOF_SETTINGS.maxKB)),
      maxImagesPerAction: Math.max(1, Math.min(5, Number(merged.maxImagesPerAction) || DEFAULT_PROOF_SETTINGS.maxImagesPerAction)),
      maxSide: Math.max(560, Math.min(1400, Number(merged.maxSide) || DEFAULT_PROOF_SETTINGS.maxSide))
    };
    const newSettings = { ...settingsOptions, proofSettings: cleaned };
    setSettingsOptions(newSettings);
    try {
      await setDoc(getSettingsDoc(), newSettings, { merge: true });
      pushToast('บันทึกกติกาหลักฐานแล้ว', 'success');
    } catch (e) {
      pushToast('บันทึกกติกาหลักฐานไม่สำเร็จ: ' + e.message, 'error');
    }
  };

  const deletedItems = useMemo(() => {
    return items
      .filter(item => item && item.isDeleted)
      .slice()
      .sort((a, b) => new Date(b.deletedAt || b.updatedAt || 0) - new Date(a.deletedAt || a.updatedAt || 0));
  }, [items]);

  const roleLabel = (role) => {
    if (role === 'owner') return 'บัญชีกลาง';
    if (role === 'admin') return 'ผู้ดูแล';
    if (role === 'staff') return 'เจ้าหน้าที่';
    return 'ดูอย่างเดียว';
  };

  const roleBadgeClass = (role) => {
    if (role === 'owner') return isDarkMode ? 'bg-blue-900/50 text-blue-300 border-blue-800' : 'bg-blue-100 text-blue-700 border-blue-200';
    if (role === 'admin') return isDarkMode ? 'bg-purple-900/50 text-purple-300 border-purple-800' : 'bg-purple-100 text-purple-700 border-purple-200';
    if (role === 'staff') return isDarkMode ? 'bg-emerald-900/50 text-emerald-300 border-emerald-800' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
    return isDarkMode ? 'bg-slate-700 text-slate-300 border-slate-600' : 'bg-slate-100 text-slate-600 border-slate-200';
  };

  const validatePinPolicy = (pinValue, usernameValue = '') => {
    const value = String(pinValue || '').trim();
    const username = String(usernameValue || '').trim().toLowerCase();
    if (!value) return { ok: false, message: 'กรุณากรอก PIN' };
    if (value.length < 4) return { ok: false, message: 'PIN ควรมีอย่างน้อย 4 ตัวอักษร/ตัวเลข' };
    if (WEAK_PIN_LIST.includes(value)) return { ok: false, message: 'PIN ง่ายเกินไป กรุณาตั้งใหม่ให้เดายากขึ้น' };
    if (/^(.)\1+$/.test(value)) return { ok: false, message: 'PIN ซ้ำตัวเดิมทั้งหมด เดาง่ายเกินไป' };
    if (username && value.toLowerCase().includes(username)) return { ok: false, message: 'PIN ไม่ควรมี username อยู่ในรหัส' };
    return { ok: true, message: '' };
  };

  const ensureCentralAccount = (accounts = []) => {
    const list = Array.isArray(accounts) ? [...accounts] : [];
    if (!list.some(acc => String(acc.username || '').toLowerCase() === 'admin')) {
      list.unshift({ id: 'central_admin', name: 'บัญชีกลาง', username: 'admin', pin: ADMIN_PIN, role: 'owner', active: true });
    }
    return list;
  };

  const openNewAccountForm = () => {
    setEditingAccountId(null);
    setAccountForm({ id: null, name: '', username: '', pin: '', role: 'staff', active: true });
  };

  const openEditAccountForm = (account) => {
    setEditingAccountId(account.id);
    setAccountForm({
      id: account.id,
      name: account.name || '',
      username: account.username || '',
      pin: '',
      role: account.role || 'staff',
      active: account.active !== false,
      builtIn: !!account.builtIn
    });
  };

  const handleSaveAccount = async () => {
    if (!user || !canManageAccounts) return alert('❌ เฉพาะบัญชีกลาง/ผู้ดูแลเท่านั้นที่จัดการบัญชีได้');
    const name = String(accountForm.name || '').trim();
    const username = String(accountForm.username || '').trim().toLowerCase();
    const pinInput = String(accountForm.pin || '').trim();

    if (!name || !username) return alert('❌ กรุณากรอกชื่อพนักงานและชื่อผู้ใช้');
    if (!editingAccountId && !pinInput) return alert('❌ กรุณาตั้งรหัส PIN สำหรับบัญชีใหม่');
    if (pinInput) {
      const pinCheck = validatePinPolicy(pinInput, username);
      if (!pinCheck.ok) return alert('❌ ' + pinCheck.message);
    }

    const effective = getEffectiveAccounts();
    const duplicate = effective.some(acc => String(acc.username || '').toLowerCase() === username && acc.id !== editingAccountId);
    if (duplicate) return alert('❌ ชื่อผู้ใช้นี้มีอยู่แล้ว กรุณาใช้ชื่ออื่น');

    let nextAccounts = ensureCentralAccount(settingsOptions.accounts);

    if (editingAccountId) {
      nextAccounts = nextAccounts.map(acc => {
        if (acc.id !== editingAccountId) return acc;
        return {
          ...acc,
          name,
          username,
          role: accountForm.role || 'staff',
          active: accountForm.active !== false,
          pin: pinInput ? pinInput : acc.pin,
          updatedAt: new Date().toISOString()
        };
      });
    } else {
      nextAccounts.push({
        id: `acc_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        name,
        username,
        pin: pinInput,
        role: accountForm.role || 'staff',
        active: accountForm.active !== false,
        createdAt: new Date().toISOString()
      });
    }

    const updatedSettings = { ...settingsOptions, accounts: nextAccounts };
    setSettingsOptions(updatedSettings);
    await setDoc(getSettingsDoc(), updatedSettings, { merge: true });
    await logAction(editingAccountId ? 'แก้ไขบัญชีผู้ใช้' : 'เพิ่มบัญชีผู้ใช้', name, `Username: ${username} / สิทธิ์: ${roleLabel(accountForm.role)}`);
    openNewAccountForm();
    alert(editingAccountId ? '✅ แก้ไขบัญชีเรียบร้อยแล้ว' : '✅ เพิ่มบัญชีพนักงานเรียบร้อยแล้ว');
  };

  const handleDeleteAccount = async (account) => {
    if (!user || !canManageAccounts) return alert('❌ เฉพาะบัญชีกลาง/ผู้ดูแลเท่านั้นที่จัดการบัญชีได้');
    if (!account || !account.id) return;
    if (currentOperator?.id === account.id) return alert('❌ ไม่สามารถปิดใช้งานบัญชีที่กำลังใช้งานอยู่ได้');
    if (String(account.username || '').toLowerCase() === 'admin') return alert('❌ ไม่ควรปิดใช้งานบัญชีกลาง admin');
    if (!confirm(`ปิดใช้งานบัญชี "${account.name}" หรือไม่?\n\nบัญชีนี้จะล็อกอินไม่ได้ แต่ประวัติรายการเดิมยังคงอ้างอิงชื่อผู้ใช้ไว้ครบ`)) return;
    let nextAccounts = ensureCentralAccount(settingsOptions.accounts).map(acc => {
      if (acc.id !== account.id) return acc;
      return { ...acc, active: false, disabledAt: new Date().toISOString(), disabledBy: currentOperator?.name || 'Admin' };
    });
    const updatedSettings = { ...settingsOptions, accounts: nextAccounts };
    setSettingsOptions(updatedSettings);
    await setDoc(getSettingsDoc(), updatedSettings, { merge: true });
    await logAction('ปิดใช้งานบัญชีผู้ใช้', account.name || account.username, `ปิดใช้งานบัญชี username: ${account.username}`);
    alert('✅ ปิดใช้งานบัญชีเรียบร้อยแล้ว หากต้องการเปิดกลับ ให้กดแก้ไขแล้วติ๊ก “เปิดใช้งานบัญชีนี้”');
  };

  const handleChangeOwnPin = async () => {
    if (!user || !currentOperator) return alert('❌ กรุณาเข้าสู่Systemก่อน');
    const oldPin = String(myPinForm.oldPin || '').trim();
    const newPin = String(myPinForm.newPin || '').trim();
    const confirmPin = String(myPinForm.confirmPin || '').trim();
    const account = currentFullAccount;

    if (!account || !account.id) return alert('❌ ไม่พบบัญชีปัจจุบัน');
    if (String(account.pin || '') !== oldPin) return alert('❌ PIN เดิมไม่ถูกต้อง');
    if (newPin !== confirmPin) return alert('❌ PIN ใหม่และการยืนยัน PIN ไม่ตรงกัน');
    const pinCheck = validatePinPolicy(newPin, account.username || '');
    if (!pinCheck.ok) return alert('❌ ' + pinCheck.message);

    try {
      let nextAccounts = ensureCentralAccount(settingsOptions.accounts).map(acc => {
        if (acc.id !== account.id) return acc;
        return { ...acc, pin: newPin, updatedAt: new Date().toISOString(), pinChangedAt: new Date().toISOString() };
      });
      const updatedSettings = { ...settingsOptions, accounts: nextAccounts };
      setSettingsOptions(updatedSettings);
      await setDoc(getSettingsDoc(), updatedSettings, { merge: true });
      await logAction('เปลี่ยน PIN ของตัวเอง', account.name || account.username, `ผู้ใช้ ${account.username} เปลี่ยน PIN ของตัวเอง`);
      setMyPinForm({ oldPin: '', newPin: '', confirmPin: '' });
      alert('✅ เปลี่ยน PIN เรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      alert('❌ เปลี่ยน PIN ไม่สำเร็จ: ' + error.message);
    }
  };

  const handleResetAccountPin = async (account) => {
    if (!user || !canManageAccounts) return alert('❌ เฉพาะบัญชีกลาง/ผู้ดูแลเท่านั้นที่รีเซ็ต PIN ได้');
    if (!account || !account.id) return;
    if (account.role === 'owner' && currentAccountRole !== 'owner') return alert('❌ เฉพาะบัญชีกลางเท่านั้นที่รีเซ็ต PIN ของบัญชีกลางได้');
    const newPin = prompt(`ตั้ง PIN ใหม่ให้ "${account.name || account.username}"\n\nกรุณาใช้ PIN ที่เดายาก อย่างน้อย 4 ตัว`);
    if (newPin === null) return;
    const cleanPin = String(newPin || '').trim();
    const pinCheck = validatePinPolicy(cleanPin, account.username || '');
    if (!pinCheck.ok) return alert('❌ ' + pinCheck.message);

    try {
      let nextAccounts = ensureCentralAccount(settingsOptions.accounts);
      nextAccounts = nextAccounts.map(acc => {
        if (acc.id !== account.id) return acc;
        return { ...acc, pin: cleanPin, updatedAt: new Date().toISOString(), pinResetAt: new Date().toISOString(), pinResetBy: currentOperator?.name || 'Admin' };
      });
      const updatedSettings = { ...settingsOptions, accounts: nextAccounts };
      setSettingsOptions(updatedSettings);
      await setDoc(getSettingsDoc(), updatedSettings, { merge: true });
      await logAction('รีเซ็ต PIN ผู้ใช้', account.name || account.username, `รีเซ็ต PIN ให้ username: ${account.username}`);
      alert('✅ รีเซ็ต PIN เรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      alert('❌ รีเซ็ต PIN ไม่สำเร็จ: ' + error.message);
    }
  };

  const logAction = async (actionType, targetName, details) => {
    if (!user) return;
    try {
      await addDoc(getAuditCol(), {
        timestamp: new Date().toISOString(), action: actionType, target: targetName, details: details, user: currentOperator?.name || "Admin" 
      });
    } catch (e) {
      console.error("Audit Log Error:", e);
    }
  };

  const UNASSIGNED_PROJECT_LABELS = ['ไม่ระบุโครงการ', 'ไม่ระบุชื่อโครงการ', 'ไม่ระบุชื่อโครงงาน', 'ไม่ระบุ', '-'];
  const normalizeProjectName = (value) => {
    const clean = String(value || '').trim();
    if (!clean || UNASSIGNED_PROJECT_LABELS.includes(clean)) return '';
    return clean;
  };
  const isUnassignedProjectName = (value) => normalizeProjectName(value) === '';
  const projectDisplayName = (value) => normalizeProjectName(value) || 'ยังไม่ผูกโครงการจัดซื้อ';
  const cleanProjectName = (value) => normalizeProjectName(value);

  const todayMs = new Date().setHours(0,0,0,0);

  const projectOptions = useMemo(() => {
    const fromSettings = Array.isArray(settingsOptions.projects) ? settingsOptions.projects : [];
    const fromItems = items.map(i => normalizeProjectName(i.project)).filter(Boolean);
    const merged = [...new Set([...fromSettings.map(p => normalizeProjectName(p)), ...fromItems])].filter(Boolean);
    const withoutOther = merged.filter(p => p !== 'อื่นๆ');
    return [...new Set([...withoutOther, 'อื่นๆ'])];
  }, [settingsOptions.projects, items]);

  const getAssetStatusInfo = (id) => ASSET_STATUSES.find(s => s.id === (id || 'active')) || ASSET_STATUSES[0];

  const getMissingDataLabels = (item = {}) => {
    const missing = [];
    if (!String(item.name || '').trim()) missing.push('ชื่อ');
    if (!String(item.sn || '').trim()) missing.push('S.N.');
    if (!String(item.category || '').trim()) missing.push('หมวดหมู่');
    if (!String(item.location || '').trim()) missing.push('สถานที่');
    if (!String(item.department || '').trim()) missing.push('ฝ่าย');
    if (!item.qrTagged) missing.push('QR');
    return missing;
  };

  const isMeetingRoomItem = (item) => {
    const dept = String(item?.department || '').toLowerCase();
    const deptLabel = String(DEPARTMENTS.find(d => d.id === item?.department)?.label || '').toLowerCase();
    return dept.includes('ห้องประชุม') || deptLabel.includes('ห้องประชุม');
  };

  const openMeetingRoomView = () => {
    const next = !showRoomView;
    setShowRoomView(next);
    if (next) {
      setFilterDept('all');
      setFilterLocation('all');
    }
  };

  const isProblemItem = (item) => {
    if (!item || item.isDeleted) return false;
    const isLate = (item.status === 'borrowed' || item.status === 'out-for-event') && item.expectedReturn && new Date(item.expectedReturn).getTime() < todayMs;
    const missingInfo = getMissingDataLabels(item).length > 0;
    return isLate || item.status === 'maintenance' || missingInfo;
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      if (item && item.isDeleted) return false;
      const searchLower = String(searchTerm || '').trim().toLowerCase();
      const matchSearch = searchLower === '' || 
                          (item.name && String(item.name).toLowerCase().includes(searchLower)) || 
                          (item.sn && String(item.sn).toLowerCase().includes(searchLower)) || 
                          (item.location && String(item.location).toLowerCase().includes(searchLower)) ||
                          (item.storageBoxName && String(item.storageBoxName).toLowerCase().includes(searchLower)) ||
                          (item.project && String(item.project).toLowerCase().includes(searchLower)) ||
                          (item.owner && String(item.owner).toLowerCase().includes(searchLower)); 
                          
      const matchDept = filterDept === 'all' || String(item.department) === String(filterDept);
      const matchCategory = filterCategory === 'all' || String(item.category) === String(filterCategory);
      const matchStatus = filterStatus === 'all' || String(item.status) === String(filterStatus);
      const matchLocation = filterLocation === 'all' || String(item.location) === String(filterLocation);
      const matchProject = filterProject === 'all' || normalizeProjectName(item.project) === normalizeProjectName(filterProject);
      const matchAssetStatus = filterAssetStatus === 'all' || String(item.assetStatus || 'active') === String(filterAssetStatus);
      const matchQrTagged = filterQrTagged === 'all' || (filterQrTagged === 'tagged' && !!item.qrTagged) || (filterQrTagged === 'untagged' && !item.qrTagged);
      const matchProblem = !quickProblemOnly || isProblemItem(item);
      
      return matchSearch && matchDept && matchCategory && matchStatus && matchLocation && matchProject && matchAssetStatus && matchQrTagged && matchProblem;
    });

    result.sort((a, b) => {
      try {
        const strA = String(a.name || '');
        const strB = String(b.name || '');
        return strA.localeCompare(strB, 'th', { numeric: true, sensitivity: 'base' });
      } catch (e) { return 0; }
    });
    return result;
  }, [items, searchTerm, filterDept, filterCategory, filterStatus, filterLocation, filterProject, filterAssetStatus, filterQrTagged, quickProblemOnly, todayMs]);

  const hasActiveFilters = !!searchTerm || filterDept !== 'all' || filterCategory !== 'all' || filterStatus !== 'all' || filterLocation !== 'all' || filterProject !== 'all' || filterAssetStatus !== 'all' || filterQrTagged !== 'all' || quickProblemOnly;

  const activeFilterCount = [!!searchTerm, filterDept !== 'all', filterCategory !== 'all', filterStatus !== 'all', filterLocation !== 'all', filterProject !== 'all', filterAssetStatus !== 'all', filterQrTagged !== 'all', quickProblemOnly].filter(Boolean).length;

  const activeFilterChips = useMemo(() => {
    const chips = [];
    if (searchTerm) chips.push({ id: 'search', label: `ค้นหา: ${searchTerm}`, clear: () => setSearchTerm('') });
    if (filterDept !== 'all') chips.push({ id: 'dept', label: `ฝ่าย: ${DEPARTMENTS.find(d => d.id === filterDept)?.label || filterDept}`, clear: () => setFilterDept('all') });
    if (filterLocation !== 'all') chips.push({ id: 'location', label: `ห้อง/ที่เก็บ: ${filterLocation}`, clear: () => setFilterLocation('all') });
    if (filterCategory !== 'all') chips.push({ id: 'category', label: `หมวด: ${filterCategory}`, clear: () => setFilterCategory('all') });
    if (filterStatus !== 'all') chips.push({ id: 'status', label: `สถานะ: ${STATUSES.find(s => s.id === filterStatus)?.label || filterStatus}`, clear: () => setFilterStatus('all') });
    if (filterProject !== 'all') chips.push({ id: 'project', label: `โครงการ: ${filterProject}`, clear: () => setFilterProject('all') });
    if (filterAssetStatus !== 'all') chips.push({ id: 'asset', label: `พัสดุ: ${getAssetStatusInfo(filterAssetStatus).label}`, clear: () => setFilterAssetStatus('all') });
    if (filterQrTagged !== 'all') chips.push({ id: 'qr', label: filterQrTagged === 'tagged' ? 'ติด QR แล้ว' : 'ยังไม่ติด QR', clear: () => setFilterQrTagged('all') });
    if (quickProblemOnly) chips.push({ id: 'problem', label: 'ของที่ต้องจัดการ', clear: () => setQuickProblemOnly(false) });
    return chips;
  }, [searchTerm, filterDept, filterCategory, filterStatus, filterLocation, filterProject, filterAssetStatus, filterQrTagged, quickProblemOnly]);

  const filteredBorrowDocuments = useMemo(() => {
    const q = String(borrowDocSearch || '').trim().toLowerCase();
    return (borrowDocuments || []).filter(doc => {
      const status = doc.status || 'active';
      const matchFilter = borrowDocFilter === 'all' || status === borrowDocFilter || doc.type === borrowDocFilter;
      if (!matchFilter) return false;
      if (!q) return true;
      const itemText = (doc.items || []).map(i => `${i.name || ''} ${i.sn || ''} ${i.category || ''} ${i.location || ''}`).join(' ');
      return String(doc.ref || '').toLowerCase().includes(q) ||
             String(doc.borrower || '').toLowerCase().includes(q) ||
             String(doc.staffOut || '').toLowerCase().includes(q) ||
             String(doc.note || '').toLowerCase().includes(q) ||
             itemText.toLowerCase().includes(q);
    });
  }, [borrowDocuments, borrowDocSearch, borrowDocFilter]);

  const clearAllFilters = () => {
    setSearchTerm('');
    setFilterDept('all');
    setFilterCategory('all');
    setFilterStatus('all');
    setFilterLocation('all');
    setFilterProject('all');
    setFilterAssetStatus('all');
    setFilterQrTagged('all');
    setQuickProblemOnly(false);
  };

  const projectMetaMap = settingsOptions.projectMeta || {};
  const getProjectMeta = (projectName) => projectMetaMap[cleanProjectName(projectName)] || {};
  const formatMoney = (value) => {
    const n = Number(value || 0);
    if (!Number.isFinite(n) || n <= 0) return '-';
    return n.toLocaleString('th-TH', { maximumFractionDigits: 0 });
  };
  const formatProjectDate = (value) => {
    if (!value) return '-';
    try {
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value);
      return d.toLocaleDateString('th-TH');
    } catch (e) { return String(value); }
  };

  const projectStats = useMemo(() => {
    const map = {};
    const metaMap = settingsOptions.projectMeta || {};
    const ensureProject = (projectName) => {
      const name = normalizeProjectName(projectName);
      if (!name) return null;
      if (!map[name]) {
        const meta = metaMap[name] || {};
        map[name] = {
          name,
          meta,
          total: 0,
          qtyTotal: 0,
          active: 0,
          disposed: 0,
          lost: 0,
          pending_disposal: 0,
          available: 0,
          borrowed: 0,
          outForEvent: 0,
          maintenance: 0,
          missingData: 0,
          qrMissing: 0,
          categories: {},
          departments: {},
          locations: {},
          items: []
        };
      }
      return map[name];
    };

    // ชื่อโครงการจาก Settings และ projectMeta ต้องแสดงเสมอ แม้ยังไม่มีอุปกรณ์ผูกอยู่
    (Array.isArray(settingsOptions.projects) ? settingsOptions.projects : [])
      .map(projectName => normalizeProjectName(projectName))
      .filter(projectName => projectName && projectName !== 'อื่นๆ')
      .forEach(projectName => ensureProject(projectName));
    Object.keys(metaMap || {}).map(projectName => normalizeProjectName(projectName)).filter(Boolean).forEach(projectName => ensureProject(projectName));

    items.filter(item => item && !item.isDeleted).forEach((item) => {
      const projectName = normalizeProjectName(item.project);
      if (!projectName) return;
      const project = ensureProject(projectName);
      if (!project) return;
      const assetStatus = item.assetStatus || 'active';
      const qty = Number(item.quantity) || 1;
      project.total += 1;
      project.qtyTotal += qty;
      project[assetStatus] = (project[assetStatus] || 0) + 1;
      if (item.status === 'available') project.available += 1;
      if (item.status === 'borrowed') project.borrowed += 1;
      if (item.status === 'out-for-event') project.outForEvent += 1;
      if (item.status === 'maintenance') project.maintenance += 1;
      if (!item.qrTagged) project.qrMissing += 1;
      if (getMissingDataLabels(item).length > 0) project.missingData += 1;
      if (item.category) project.categories[item.category] = (project.categories[item.category] || 0) + 1;
      if (item.department) project.departments[item.department] = (project.departments[item.department] || 0) + 1;
      if (item.location) project.locations[item.location] = (project.locations[item.location] || 0) + 1;
      project.items.push(item);
    });
    return Object.values(map).sort((a, b) => {
      const aYear = String(a.meta?.fiscalYear || '');
      const bYear = String(b.meta?.fiscalYear || '');
      if (aYear && bYear && aYear !== bYear) return bYear.localeCompare(aYear, 'th', { numeric: true });
      if (aYear && !bYear) return -1;
      if (!aYear && bYear) return 1;
      return String(a.name).localeCompare(String(b.name), 'th', { numeric: true });
    });
  }, [items, settingsOptions.projects, settingsOptions.projectMeta]);

  const unassignedProjectItemCount = useMemo(() => (
    items.filter(item => item && !item.isDeleted && isUnassignedProjectName(item.project)).length
  ), [items]);

  const filteredProjectStats = useMemo(() => {
    const q = String(projectManagerSearch || '').trim().toLowerCase();
    if (!q) return projectStats;
    return projectStats.filter(project => {
      const meta = project.meta || {};
      return String(project.name || '').toLowerCase().includes(q) ||
             String(meta.fiscalYear || '').toLowerCase().includes(q) ||
             String(meta.owner || '').toLowerCase().includes(q) ||
             String(meta.objective || '').toLowerCase().includes(q) ||
             String(meta.note || '').toLowerCase().includes(q) ||
             (project.items || []).some(item =>
               String(item.name || '').toLowerCase().includes(q) ||
               String(item.sn || '').toLowerCase().includes(q) ||
               String(item.location || '').toLowerCase().includes(q) ||
               String(item.category || '').toLowerCase().includes(q)
             );
    });
  }, [projectStats, projectManagerSearch]);

  const handleAddProjectQuick = async () => {
    const rawName = String(quickProjectName || '').trim();
    const name = normalizeProjectName(rawName);
    if (!rawName) {
      pushToast('กรุณาพิมพ์ชื่อโครงการจัดซื้อก่อน', 'warning');
      return;
    }
    if (!name) {
      pushToast('ชื่อนี้เป็นคำสงวนสำหรับรายการที่ยังไม่ผูกโครงการ กรุณาตั้งชื่อโครงการจริง เช่น โครงการปรับปรุงกล้องถ่ายภาพประจำปี 2569', 'warning');
      return;
    }
    if (name === 'อื่นๆ') {
      pushToast('กรุณาตั้งชื่อโครงการให้ชัดเจน ไม่ใช้คำว่า “อื่นๆ”', 'warning');
      return;
    }
    if (!canAddEditItems && !canManageSystem) {
      alert('บัญชีนี้ไม่มีสิทธิ์เพิ่มโครงการ');
      return;
    }

    try {
      setIsBusy(true);
      const nowIso = new Date().toISOString();
      const buddhistYear = new Date().getFullYear() + 543;
      const currentProjects = Array.isArray(settingsOptions.projects) ? settingsOptions.projects : [];
      const currentMeta = settingsOptions.projectMeta || {};
      const normalizedProjects = currentProjects
        .map(p => normalizeProjectName(p))
        .filter(p => p && p !== 'อื่นๆ');
      const existingKey = [...normalizedProjects, ...Object.keys(currentMeta || {}).map(p => normalizeProjectName(p))]
        .filter(Boolean)
        .find(p => String(p).trim() === name);

      const nextProjects = [...new Set([...normalizedProjects, existingKey || name, 'อื่นๆ'])];
      const nextMeta = {
        ...currentMeta,
        [existingKey || name]: {
          ...(currentMeta[existingKey || name] || {}),
          name: existingKey || name,
          fiscalYear: String((currentMeta[existingKey || name] || {}).fiscalYear || buddhistYear),
          budget: String((currentMeta[existingKey || name] || {}).budget || ''),
          owner: String((currentMeta[existingKey || name] || {}).owner || ''),
          startDate: (currentMeta[existingKey || name] || {}).startDate || '',
          endDate: (currentMeta[existingKey || name] || {}).endDate || '',
          objective: String((currentMeta[existingKey || name] || {}).objective || ''),
          note: String((currentMeta[existingKey || name] || {}).note || ''),
          status: (currentMeta[existingKey || name] || {}).status || 'draft',
          createdAt: (currentMeta[existingKey || name] || {}).createdAt || nowIso,
          updatedAt: nowIso
        }
      };

      const updatedSettings = {
        ...settingsOptions,
        projects: nextProjects,
        projectMeta: nextMeta
      };

      // อัปเดตหน้าจอก่อน แล้วค่อยบันทึก Firebase เพื่อให้ผู้ใช้เห็นทันที
      setSettingsOptions(updatedSettings);
      setProjectManagerSearch('');
      setActiveWorkspace('projects');
      setSelectedPurchaseProject(existingKey || name);
      setFilterProject('all');
      setQuickProjectName('');
      await setDoc(getSettingsDoc(), { projects: nextProjects, projectMeta: nextMeta }, { merge: true });

      if (existingKey) {
        pushToast('มีชื่อโครงการนี้อยู่แล้ว เปิดรายละเอียดให้แล้ว', 'warning');
      } else {
        await logAction('เพิ่มโครงการจัดซื้อ', name, 'เพิ่มชื่อโครงการจัดซื้อ/จัดหาอุปกรณ์จากหน้าโครงการ');
        pushToast('เพิ่มโครงการจัดซื้อเรียบร้อยแล้ว — โครงการนี้ยังไม่มีอุปกรณ์ผูกอยู่', 'success');
      }
    } catch (error) {
      console.error(error);
      alert('❌ เพิ่มโครงการไม่สำเร็จ: ' + error.message);
    } finally {
      setIsBusy(false);
    }
  };


  const openProjectMetaEditor = (projectName) => {
    const name = cleanProjectName(projectName);
    if (!name) return alert('กรุณาเลือกโครงการจัดซื้อที่ต้องการแก้ไข');
    const meta = getProjectMeta(name);
    setProjectMetaEditTarget(name);
    setProjectMetaForm({
      name,
      fiscalYear: meta.fiscalYear || String(new Date().getFullYear() + 543),
      budget: meta.budget || '',
      owner: meta.owner || '',
      startDate: meta.startDate || '',
      endDate: meta.endDate || '',
      objective: meta.objective || '',
      note: meta.note || '',
      status: meta.status || 'active'
    });
  };

  const closeProjectMetaEditor = () => {
    setProjectMetaEditTarget(null);
    setProjectMetaForm({ name: '', fiscalYear: '', budget: '', owner: '', startDate: '', endDate: '', objective: '', note: '', status: 'active' });
  };

  const handleSaveProjectMeta = async () => {
    if (!projectMetaEditTarget) return;
    if (!canAddEditItems && !canManageSystem) return alert('บัญชีนี้ไม่มีสิทธิ์แก้ไขโครงการ');
    const oldName = cleanProjectName(projectMetaEditTarget);
    const newName = cleanProjectName(projectMetaForm.name);
    if (!newName) return alert('กรุณากรอกชื่อโครงการจัดซื้อให้ถูกต้อง');
    const currentProjects = Array.isArray(settingsOptions.projects) ? settingsOptions.projects : [];
    if (newName !== oldName && projectOptions.some(p => p !== oldName && String(p).trim() === newName)) return alert('มีชื่อโครงการนี้อยู่แล้ว');

    try {
      setIsBusy(true);
      const nowIso = new Date().toISOString();
      const currentMeta = { ...(settingsOptions.projectMeta || {}) };
      const oldMeta = currentMeta[oldName] || {};
      delete currentMeta[oldName];
      currentMeta[newName] = {
        ...oldMeta,
        name: newName,
        fiscalYear: String(projectMetaForm.fiscalYear || '').trim(),
        budget: String(projectMetaForm.budget || '').trim(),
        owner: String(projectMetaForm.owner || '').trim(),
        startDate: projectMetaForm.startDate || '',
        endDate: projectMetaForm.endDate || '',
        objective: String(projectMetaForm.objective || '').trim(),
        note: String(projectMetaForm.note || '').trim(),
        status: projectMetaForm.status || 'active',
        updatedAt: nowIso,
        createdAt: oldMeta.createdAt || nowIso
      };
      let updatedProjects = currentProjects.map(p => p === oldName ? newName : p).filter(Boolean);
      if (!updatedProjects.some(p => p === newName)) updatedProjects = [...updatedProjects.filter(p => p !== 'อื่นๆ'), newName, 'อื่นๆ'];
      updatedProjects = [...new Set(updatedProjects)];
      if (!updatedProjects.includes('อื่นๆ')) updatedProjects.push('อื่นๆ');
      const updatedSettings = { ...settingsOptions, projects: updatedProjects, projectMeta: currentMeta };
      setSettingsOptions(updatedSettings);
      await setDoc(getSettingsDoc(), updatedSettings, { merge: true });

      if (newName !== oldName) {
        const affectedItems = items.filter(item => item && !item.isDeleted && normalizeProjectName(item.project) === normalizeProjectName(oldName));
        await Promise.all(affectedItems.map(item => {
          const history = Array.isArray(item.history) ? [...item.history] : [];
          history.push({
            type: 'projectChange',
            date: nowIso,
            fromProject: oldName,
            toProject: newName,
            staff: currentOperator?.name || 'Admin',
            note: 'เปลี่ยนชื่อโครงการจัดซื้อ'
          });
          return setDoc(getItemDoc(item.id), { project: newName, history, updatedAt: nowIso, updatedBy: currentOperator?.name || 'Admin' }, { merge: true });
        }));
        if (filterProject === oldName) setFilterProject(newName);
      }
      setSelectedPurchaseProject(newName);
      await logAction('บันทึกรายละเอียดโครงการจัดซื้อ', newName, newName !== oldName ? `เปลี่ยนชื่อจาก ${oldName}` : 'แก้ไขรายละเอียดโครงการ');
      closeProjectMetaEditor();
      pushToast('บันทึกโครงการจัดซื้อเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error(error);
      alert('❌ บันทึกโครงการไม่สำเร็จ: ' + error.message);
    } finally {
      setIsBusy(false);
    }
  };

  const openNewItemForProject = (projectName) => {
    const name = cleanProjectName(projectName);
    setFormData({ id: '', name: '', sn: '', department: 'ภาพนิ่ง', category: '', newCategory: '', location: '', newLocation: '', status: 'available', assetStatus: 'active', project: name, newProject: '', quantity: 1, owner: '', newOwner: '', isPersonalItem: false, qrTagged: false, internalNote: '' });
    setShowForm(true);
  };




  const projectAssignCandidateItems = useMemo(() => {
    const search = String(projectAssignSearch || '').toLowerCase().trim();
    return items
      .filter(item => item && !item.isDeleted)
      .filter(item => {
        if (!search) return true;
        return String(item.name || '').toLowerCase().includes(search) ||
               String(item.sn || '').toLowerCase().includes(search) ||
               String(item.category || '').toLowerCase().includes(search) ||
               String(item.location || '').toLowerCase().includes(search) ||
               String(item.project || '').toLowerCase().includes(search);
      })
      .sort((a, b) => {
        const aSelected = projectAssignSelectedIds.includes(a.id);
        const bSelected = projectAssignSelectedIds.includes(b.id);
        if (aSelected && !bSelected) return -1;
        if (!aSelected && bSelected) return 1;
        return String(a.name || '').localeCompare(String(b.name || ''), 'th', { numeric: true });
      });
  }, [items, projectAssignSearch, projectAssignSelectedIds]);

  const openProjectAssign = (projectName) => {
    const name = normalizeProjectName(projectName);
    if (!name) {
      pushToast('เลือกหรือเพิ่มชื่อโครงการก่อน', 'warning');
      return;
    }
    setProjectAssignTarget(name);
    setProjectAssignSearch('');
    setProjectAssignSelectedIds(items.filter(item => item && !item.isDeleted && normalizeProjectName(item.project) === name).map(item => item.id));
    setShowProjectAssignModal(true);
  };

  const toggleProjectAssignItem = (itemId) => {
    setProjectAssignSelectedIds(prev => prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]);
  };

  const handleSaveProjectAssignment = async () => {
    if (!projectAssignTarget) return alert('กรุณาเลือกโครงการ');
    if (!canAddEditItems && !canManageSystem) return alert('บัญชีนี้ไม่มีสิทธิ์ผูกอุปกรณ์กับโครงการจัดซื้อ');
    const selectedSet = new Set(projectAssignSelectedIds);
    const currentProjectItems = items.filter(item => item && !item.isDeleted && normalizeProjectName(item.project) === normalizeProjectName(projectAssignTarget));
    const selectedItemsForProject = items.filter(item => item && !item.isDeleted && selectedSet.has(item.id));
    const affectedMap = new Map();
    currentProjectItems.forEach(item => affectedMap.set(item.id, item));
    selectedItemsForProject.forEach(item => affectedMap.set(item.id, item));
    const affectedItems = Array.from(affectedMap.values());
    const addCount = selectedItemsForProject.filter(item => normalizeProjectName(item.project) !== normalizeProjectName(projectAssignTarget)).length;
    const removeCount = currentProjectItems.filter(item => !selectedSet.has(item.id)).length;

    if (selectedItemsForProject.length === 0) {
      const ok = window.confirm('ไม่มีอุปกรณ์ถูกเลือกไว้ในโครงการนี้ ต้องการล้างอุปกรณ์ทั้งหมดออกจากโครงการจัดซื้อนี้หรือไม่?');
      if (!ok) return;
    }

    try {
      await Promise.all(affectedItems.map(item => {
        const oldProject = projectDisplayName(item.project);
        const willBeInProject = selectedSet.has(item.id);
        const nextProject = willBeInProject ? projectAssignTarget : '';
        const nextProjectLabel = willBeInProject ? projectAssignTarget : 'ยังไม่ผูกโครงการจัดซื้อ';
        const projectChanged = String(oldProject || '') !== String(nextProjectLabel || '');
        const history = Array.isArray(item.history) ? [...item.history] : [];
        if (projectChanged) {
          history.push({
            type: 'projectChange',
            date: new Date().toISOString(),
            fromProject: oldProject,
            toProject: nextProjectLabel,
            staff: currentOperator?.name || 'Admin',
            note: willBeInProject ? 'ผูกอุปกรณ์เข้ากับโครงการจัดซื้อ' : 'นำอุปกรณ์ออกจากโครงการจัดซื้อ'
          });
        }
        return setDoc(getItemDoc(item.id), {
          project: nextProject,
          history,
          updatedAt: new Date().toISOString(),
          updatedBy: currentOperator?.name || 'Admin'
        }, { merge: true });
      }));
      await logAction('ผูกอุปกรณ์กับโครงการจัดซื้อ', projectAssignTarget, `เลือกไว้ ${selectedItemsForProject.length} รายการ / เพิ่มใหม่ ${addCount} / นำออก ${removeCount}`);
      setFilterProject(selectedItemsForProject.length > 0 ? projectAssignTarget : 'all');
      setShowProjectAssignModal(false);
      pushToast(`บันทึกการผูกอุปกรณ์แล้ว: เลือกไว้ ${selectedItemsForProject.length} รายการ${removeCount ? ` / นำออก ${removeCount} รายการ` : ''}`, 'success');
    } catch (error) {
      console.error(error);
      alert('❌ ผูกอุปกรณ์กับโครงการจัดซื้อไม่สำเร็จ: ' + error.message);
    }
  };

  const openProjectPrint = (projectName) => {
    const project = projectStats.find(p => String(p.name) === String(projectName)) || { name: projectName, items: [], total: 0 };
    setPrintProjectData({
      name: project.name,
      date: new Date().toISOString(),
      ref: `PROJECT-${new Date().getFullYear()}${String(new Date().getMonth()+1).padStart(2,'0')}${String(new Date().getDate()).padStart(2,'0')}-${String(project.name || '').slice(0, 12)}`,
      items: (project.items || []).slice().sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th', { numeric: true })),
      total: project.total || 0,
      active: project.active || 0,
      disposed: project.disposed || 0,
      lost: project.lost || 0,
      pending_disposal: project.pending_disposal || 0
    });
  };

  const handleRenameProject = async (oldName) => {
    if (!canAddEditItems && !canManageSystem) return alert('บัญชีนี้ไม่มีสิทธิ์แก้ไขโครงการ');
    if (!normalizeProjectName(oldName)) return alert('กรุณาเลือกโครงการจัดซื้อที่ต้องการเปลี่ยนชื่อ');
    const newName = prompt(`เปลี่ยนชื่อโครงการ\nจาก: ${oldName}\nเป็น:`, oldName);
    const clean = String(newName || '').trim();
    if (!clean || clean === oldName) return;
    if (projectOptions.some(p => p !== oldName && String(p).trim() === clean)) {
      return alert('มีชื่อโครงการนี้อยู่แล้ว');
    }
    try {
      setIsBusy(true);
      const currentProjects = Array.isArray(settingsOptions.projects) ? settingsOptions.projects : [];
      const updatedProjects = [...new Set(currentProjects.map(p => p === oldName ? clean : p).filter(Boolean))];
      if (!updatedProjects.includes('อื่นๆ')) updatedProjects.push('อื่นๆ');
      const updatedSettings = { ...settingsOptions, projects: updatedProjects };
      setSettingsOptions(updatedSettings);
      await setDoc(getSettingsDoc(), updatedSettings, { merge: true });

      const affectedItems = items.filter(item => item && !item.isDeleted && normalizeProjectName(item.project) === normalizeProjectName(oldName));
      await Promise.all(affectedItems.map(item => {
        const history = Array.isArray(item.history) ? [...item.history] : [];
        history.push({
          type: 'projectChange',
          date: new Date().toISOString(),
          fromProject: oldName,
          toProject: clean,
          staff: currentOperator?.name || 'Admin',
          note: 'เปลี่ยนชื่อโครงการจัดซื้อจากหน้าโครงการจัดซื้อ'
        });
        return setDoc(getItemDoc(item.id), {
          project: clean,
          history,
          updatedAt: new Date().toISOString(),
          updatedBy: currentOperator?.name || 'Admin'
        }, { merge: true });
      }));

      if (filterProject === oldName) setFilterProject(clean);
      await logAction('เปลี่ยนชื่อโครงการ', clean, `จาก ${oldName} เป็น ${clean} / กระทบอุปกรณ์ ${affectedItems.length} รายการ`);
      pushToast('เปลี่ยนชื่อโครงการเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error(error);
      alert('❌ เปลี่ยนชื่อโครงการไม่สำเร็จ: ' + error.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleDeleteEmptyProject = async (projectName) => {
    if (!canManageSystem && !canAddEditItems) return alert('บัญชีนี้ไม่มีสิทธิ์ลบชื่อโครงการ');
    if (!normalizeProjectName(projectName)) return alert('กรุณาเลือกโครงการจัดซื้อที่ต้องการลบ');
    const project = projectStats.find(p => String(p.name) === String(projectName));
    if (project && project.total > 0) {
      return alert('โครงการนี้ยังมีอุปกรณ์อยู่ กรุณาย้าย/ลบการผูกอุปกรณ์ออกก่อน จึงจะลบชื่อโครงการได้');
    }
    if (!confirm(`ลบชื่อโครงการ "${projectName}" ออกจากรายการหรือไม่?`)) return;
    try {
      const updatedProjects = (settingsOptions.projects || []).filter(p => p !== projectName);
      const nextProjectMeta = { ...(settingsOptions.projectMeta || {}) };
      delete nextProjectMeta[projectName];
      const updatedSettings = { ...settingsOptions, projects: updatedProjects.includes('อื่นๆ') ? updatedProjects : [...updatedProjects, 'อื่นๆ'], projectMeta: nextProjectMeta };
      setSettingsOptions(updatedSettings);
      await setDoc(getSettingsDoc(), updatedSettings, { merge: true });
      await logAction('ลบชื่อโครงการจัดซื้อ', projectName, 'ลบชื่อโครงการจัดซื้อที่ไม่มีอุปกรณ์ผูกอยู่');
      if (selectedPurchaseProject === projectName) setSelectedPurchaseProject(null);
      pushToast('ลบชื่อโครงการแล้ว', 'success');
    } catch (error) {
      console.error(error);
      alert('❌ ลบชื่อโครงการไม่สำเร็จ: ' + error.message);
    }
  };

  const roomGroups = useMemo(() => {
    const map = {};
    filteredItems.filter(isMeetingRoomItem).forEach((item) => {
      const roomName = String(item.location || 'ไม่ระบุห้อง/สถานที่').trim() || 'ไม่ระบุห้อง/สถานที่';
      if (!map[roomName]) {
        map[roomName] = { name: roomName, total: 0, available: 0, borrowed: 0, event: 0, maintenance: 0, items: [] };
      }
      map[roomName].total += 1;
      if (item.status === 'available') map[roomName].available += 1;
      if (item.status === 'borrowed') map[roomName].borrowed += 1;
      if (item.status === 'out-for-event') map[roomName].event += 1;
      if (item.status === 'maintenance') map[roomName].maintenance += 1;
      map[roomName].items.push(item);
    });
    return Object.values(map).sort((a, b) => String(a.name).localeCompare(String(b.name), 'th', { numeric: true }));
  }, [filteredItems]);

  const toggleRoomExpanded = (roomName) => {
    setExpandedRooms(prev => ({ ...prev, [roomName]: prev[roomName] === false ? true : false }));
  };

  const copyItemSummary = async (item) => {
    if (!item) return;
    const statusLabel = (STATUSES.find(s => s.id === item.status)?.label || item.status || '-');
    const text = `${item.name || '-'}
S.N.: ${item.sn || '-'}
สถานะ: ${statusLabel}
หมวดหมู่: ${item.category || '-'}
ที่เก็บ: ${item.location || '-'}
กล่อง: ${item.storageBoxName || '-'}
โครงการ: ${projectDisplayName(item.project)}
สถานะพัสดุ: ${getAssetStatusInfo(item.assetStatus).label}${item.currentBorrower ? `
ผู้ยืม: ${item.currentBorrower}` : ''}${item.currentEvent ? `
ออกงาน: ${item.currentEvent}` : ''}`;
    try {
      await navigator.clipboard.writeText(text);
      pushToast('คัดลอกข้อมูลอุปกรณ์เรียบร้อยแล้ว', 'success');
    } catch (e) {
      window.prompt('คัดลอกข้อความนี้ได้เลย', text);
    }
  };

  const auditFilterOptions = [
    { id: 'all', label: 'ทั้งหมด' },
    { id: 'add', label: 'เพิ่ม/นำเข้า' },
    { id: 'edit', label: 'แก้ไข' },
    { id: 'borrow', label: 'ยืม' },
    { id: 'event', label: 'ออกงาน' },
    { id: 'return', label: 'รับคืน' },
    { id: 'delete', label: 'ลบ/กู้คืน' },
    { id: 'account', label: 'บัญชีผู้ใช้' },
  ];

  const ui = {
    modalShell: `rounded-[2rem] shadow-2xl w-full overflow-hidden flex flex-col max-h-[92vh] border ${theme.cardBg}`,
    modalHeader: `p-5 sm:p-6 border-b flex items-start justify-between gap-4 ${theme.divide}`,
    modalBody: 'p-4 sm:p-5 overflow-y-auto custom-scrollbar flex-1',
    emptyBox: `rounded-[1.75rem] border p-8 sm:p-10 text-center ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`,
    softPanel: `rounded-[1.75rem] border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`,
    primaryBtn: 'bg-blue-600 hover:bg-blue-500 text-white font-black',
    dangerBtn: 'bg-rose-600 hover:bg-rose-500 text-white font-black'
  };


  const workspaceMeta = {
    overview: {
      kicker: 'MDEC STOCK CENTER',
      title: 'ภาพรวมระบบ',
      desc: 'ระบบจัดการสต๊อกศูนย์มัลติมีเดียทางการศึกษา'
    },
    borrowReturn: {
      kicker: 'BORROW & RETURN',
      title: 'ยืม-คืนอุปกรณ์',
      desc: 'หน้าทำงานหลักสำหรับให้ยืม นำออกงาน รับคืน และตรวจรายการค้าง'
    },
    projects: {
      kicker: 'PURCHASE PROJECTS',
      title: 'โครงการจัดซื้อ',
      desc: 'ติดตามแหล่งที่มาของอุปกรณ์ งบประมาณ และรายการที่จัดซื้อเข้าคลัง'
    },
    organize: {
      kicker: 'ORGANIZE WORKSPACE',
      title: 'กล่อง / เซ็ต / เตรียมของ',
      desc: 'จัดเก็บอุปกรณ์เป็นกล่อง จัดเซ็ตใช้งานประจำ และเตรียมรายการออกงาน'
    },
    qrWorkbench: {
      kicker: 'QR WORKBENCH',
      title: 'ศูนย์สแกน QR',
      desc: 'สแกนเลือกหลายรายการ หรือจัดการอุปกรณ์ทีละชิ้นในหน้าเดียว'
    }
  };
  const currentWorkspaceMeta = workspaceMeta[activeWorkspace] || workspaceMeta.overview;

  const renderWorkspaceTabs = () => (
    <div className={`workspace-tabbar w-full mb-5 rounded-[1.5rem] border shadow-sm p-2 flex gap-2 overflow-x-auto ${theme.cardBg}`}>
      {[
        ['overview', 'ภาพรวม', Icons.Package, 'กลับหน้ารายการทั้งหมด'],
        ['borrowReturn', 'ยืม-คืน', Icons.UserPlus, `${currentBorrowedItems.length + currentEventItems.length} รายการค้าง`],
        ['projects', 'โครงการจัดซื้อ', Icons.Database, `${projectStats.length.toLocaleString('th-TH')} โครงการ`],
        ['organize', 'กล่อง / เซ็ต', Icons.Layers, `${(settingsOptions.storageBoxes || []).length} กล่อง • ${(settingsOptions.bundles || []).length} เซ็ต`],
        ['qrWorkbench', 'QR Workbench', Icons.QrCode, selectedItems.length ? `เลือกแล้ว ${selectedItems.length} รายการ` : 'สแกนงานหน้างาน']
      ].map(([id, label, Icon, desc]) => (
        <button
          key={id}
          type="button"
          onClick={() => openWorkspace(id)}
          className={`min-w-[190px] flex items-center gap-3 px-4 py-3 rounded-2xl border text-left transition-all ${activeWorkspace === id ? 'bg-blue-600 border-blue-600 text-white shadow-md' : theme.btnSecondary}`}
        >
          <Icon className="w-5 h-5 shrink-0" />
          <span className="min-w-0">
            <span className="block font-black truncate">{label}</span>
            <span className={`block text-[11px] font-bold truncate ${activeWorkspace === id ? 'text-blue-100' : theme.textMuted}`}>{desc}</span>
          </span>
        </button>
      ))}
    </div>
  );

  const renderProjectWorkspace = () => {
    const selectedProjectName = normalizeProjectName(selectedPurchaseProject);
    const fallbackSelectedProject = selectedProjectName ? {
      name: selectedProjectName,
      meta: getProjectMeta(selectedProjectName),
      total: 0,
      qtyTotal: 0,
      active: 0,
      disposed: 0,
      lost: 0,
      pending_disposal: 0,
      available: 0,
      borrowed: 0,
      outForEvent: 0,
      maintenance: 0,
      missingData: 0,
      qrMissing: 0,
      categories: {},
      departments: {},
      locations: {},
      items: []
    } : null;
    const selectedProject = projectStats.find(p => String(p.name) === String(selectedProjectName)) || fallbackSelectedProject || filteredProjectStats[0] || null;
    const projectItems = selectedProject?.items || [];
    const meta = selectedProject?.meta || {};
    const budgetNumber = Number(meta.budget || 0);
    const isEmptyProject = selectedProject ? (selectedProject.total || 0) === 0 : true;
    const topCategories = selectedProject ? Object.entries(selectedProject.categories || {}).sort((a,b)=>b[1]-a[1]).slice(0, 6) : [];
    const topLocations = selectedProject ? Object.entries(selectedProject.locations || {}).sort((a,b)=>b[1]-a[1]).slice(0, 6) : [];
    const projectStatus = meta.status || (isEmptyProject ? 'draft' : 'active');
    const statusLabel = projectStatus === 'closed' ? 'ปิดโครงการแล้ว' : projectStatus === 'draft' ? 'แบบร่าง' : 'ใช้งานอยู่';
    const statusClass = projectStatus === 'closed'
      ? (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600')
      : projectStatus === 'draft'
        ? (isDarkMode ? 'bg-amber-950/35 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')
        : (isDarkMode ? 'bg-emerald-950/35 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700');

    return (
      <div className="solid-workspace space-y-5">
        {renderWorkspaceTabs()}
        <div className={`rounded-[1.75rem] border shadow-sm overflow-hidden ${theme.cardBg}`}>
          <div className={`p-5 sm:p-6 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${theme.divide}`}>
            <div>
              <div className={`text-xs font-black tracking-[0.22em] uppercase ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>PURCHASE PROJECTS</div>
              <h2 className={`text-lg sm:text-xl font-black mt-1 ${theme.textTitle}`}>โครงการจัดซื้อ / จัดหาอุปกรณ์</h2>
              <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ใช้บันทึกว่าอุปกรณ์แต่ละชิ้นซื้อมาจากโครงการไหน เช่น โครงการปรับปรุงกล้องถ่ายภาพประจำปี ไม่ใช่ระบบออกงาน</p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2">
              <button type="button" onClick={() => document.getElementById('quick-project-input')?.focus()} className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black">+ สร้างโครงการ</button>
              <button type="button" onClick={() => { setFilterProject('all'); setProjectManagerSearch(''); setSelectedPurchaseProject(null); }} className={`px-4 py-3 rounded-xl border font-black ${theme.btnSecondary}`}>ล้างตัวกรอง</button>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-5">
            <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
              {[
                ['โครงการจัดซื้อ', projectStats.length, 'text-indigo-500', 'ชื่อโครงการที่บันทึกไว้'],
                ['มีอุปกรณ์แล้ว', projectStats.filter(p => (p.total || 0) > 0).length, 'text-blue-500', 'โครงการที่ผูกสินค้าแล้ว'],
                ['ยังไม่มีของ', projectStats.filter(p => (p.total || 0) === 0).length, 'text-amber-500', 'สร้างไว้รอเพิ่มอุปกรณ์'],
                ['อุปกรณ์รวม', projectStats.reduce((s,p)=>s+(p.total||0),0), 'text-emerald-500', 'รายการที่ระบุโครงการแล้ว']
              ].map(([label, value, color, desc]) => (
                <div key={label} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-xs font-black ${theme.textMuted}`}>{label}</div>
                  <div className={`text-3xl font-black mt-1 ${color}`}>{Number(value || 0).toLocaleString('th-TH')}</div>
                  <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{desc}</div>
                </div>
              ))}
            </div>

            {unassignedProjectItemCount > 0 && (
              <div className={`rounded-[1.5rem] border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-950 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <div>
                  <div className="font-black">มีอุปกรณ์ {unassignedProjectItemCount.toLocaleString('th-TH')} รายการที่ยังไม่ได้ผูกโครงการจัดซื้อ</div>
                  <div className="text-xs font-bold opacity-80 mt-1">ระบบจะไม่เอารายการเหล่านี้ไปรวมเป็นโครงการ “ไม่ระบุชื่อโครงการ” อีกแล้ว ต้องเลือกผูกเข้ากับโครงการจริงเท่านั้น</div>
                </div>
                <button type="button" onClick={() => { setFilterProject('all'); openWorkspace('overview'); }} className={`px-4 py-3 rounded-xl border font-black ${theme.btnSecondary}`}>ดูรายการในคลัง</button>
              </div>
            )}

            <div className={`rounded-[1.5rem] border p-4 sm:p-5 grid grid-cols-1 xl:grid-cols-[1fr_auto] gap-3 items-end ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              <div>
                <label className={`block text-sm font-black mb-2 ${theme.textTitle}`}>สร้างโครงการจัดซื้อใหม่</label>
                <input
                  id="quick-project-input"
                  className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`}
                  placeholder="เช่น โครงการปรับปรุงกล้องถ่ายภาพประจำปี 2569"
                  value={quickProjectName}
                  onChange={e => setQuickProjectName(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') handleAddProjectQuick(); }}
                />
                <p className={`text-xs font-bold mt-2 ${theme.textMuted}`}>สร้างแล้วโครงการจะไม่หาย แม้ยังไม่มีอุปกรณ์ผูกอยู่ และจะเปิดหน้ารายละเอียดให้ทันที</p>
              </div>
              <button type="button" onClick={handleAddProjectQuick} disabled={isBusy} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-black shadow-md whitespace-nowrap">{isBusy ? 'กำลังบันทึก...' : 'บันทึกโครงการ'}</button>
            </div>

            <div className={`rounded-[1.5rem] border p-4 ${isDarkMode ? 'bg-blue-950/20 border-blue-900/50' : 'bg-blue-50 border-blue-100'}`}>
              <div className={`font-black mb-3 ${isDarkMode ? 'text-blue-200' : 'text-blue-800'}`}>วิธีคิดใหม่ของหน้านี้</div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  ['1', 'สร้างโครงการจัดซื้อ', 'บันทึกชื่อโครงการ ปีงบประมาณ งบ ผู้รับผิดชอบ และวัตถุประสงค์'],
                  ['2', 'ผูกอุปกรณ์เข้ากับโครงการ', 'เลือกจากคลังเดิม หรือกดเพิ่มสินค้าใหม่โดยระบบใส่ชื่อโครงการให้อัตโนมัติ'],
                  ['3', 'ติดตามและพิมพ์รายงาน', 'ดูของที่ซื้อจากโครงการนี้ สถานะปัจจุบัน และพิมพ์สรุปแนบเอกสารได้']
                ].map(([no, title, desc]) => (
                  <div key={no} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-blue-100'}`}>
                    <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black mb-3">{no}</div>
                    <div className={`font-black ${theme.textTitle}`}>{title}</div>
                    <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{desc}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[430px_1fr] gap-5 items-start">
              <div className={`rounded-[1.5rem] border overflow-hidden ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`p-4 border-b ${theme.divide}`}>
                  <div className={`font-black text-lg ${theme.textTitle}`}>รายการโครงการ</div>
                  <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>เลือกโครงการด้านล่างเพื่อดูรายละเอียดเต็ม</div>
                  <input className={`mt-3 w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="ค้นหาโครงการ / ปีงบ / ผู้รับผิดชอบ / อุปกรณ์" value={projectManagerSearch} onChange={e => setProjectManagerSearch(e.target.value)} />
                </div>
                <div className="p-3 space-y-2 max-h-[720px] overflow-y-auto custom-scrollbar">
                  {filteredProjectStats.length === 0 ? (
                    <div className={ui.emptyBox}>ไม่พบโครงการที่ตรงกับคำค้น / ลองกดล้างตัวกรอง</div>
                  ) : filteredProjectStats.map((project) => {
                    const pMeta = project.meta || {};
                    const active = selectedProject && String(selectedProject.name) === String(project.name);
                    const pStatus = pMeta.status || ((project.total || 0) === 0 ? 'draft' : 'active');
                    const pStatusText = pStatus === 'closed' ? 'ปิดแล้ว' : pStatus === 'draft' ? 'แบบร่าง' : 'ใช้งานอยู่';
                    return (
                      <button
                        key={project.name}
                        type="button"
                        onClick={() => setSelectedPurchaseProject(project.name)}
                        className={`purchase-project-card w-full text-left p-4 rounded-2xl border transition-all ${active ? 'border-blue-500 ring-2 ring-blue-500/20' : (isDarkMode ? 'border-slate-800 hover:border-slate-600' : 'border-slate-200 hover:border-blue-200')}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`font-black leading-tight line-clamp-2 ${active ? (isDarkMode ? 'text-blue-200' : 'text-blue-700') : theme.textTitle}`}>{project.name}</div>
                            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>ปีงบ {pMeta.fiscalYear || '-'} • {project.total || 0} รายการ • {project.qtyTotal || 0} หน่วย</div>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-[10px] font-black border shrink-0 ${pStatus === 'closed' ? (isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-100 border-slate-200 text-slate-600') : pStatus === 'draft' ? (isDarkMode ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700') : (isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700')}`}>{pStatusText}</span>
                        </div>
                        <div className={`mt-3 flex items-center justify-between text-xs font-bold ${theme.textMuted}`}>
                          <span>ผู้รับผิดชอบ: {pMeta.owner || '-'}</span>
                          <span>งบ: {formatMoney(pMeta.budget)}</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className={`rounded-[1.5rem] border overflow-hidden min-h-[640px] ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                {!selectedProject ? (
                  <div className="h-full p-8 flex items-center justify-center text-center">
                    <div>
                      <Icons.Database className={`w-14 h-14 mx-auto mb-3 ${theme.textMuted}`} />
                      <div className={`text-xl font-black ${theme.textTitle}`}>เลือกหรือสร้างโครงการก่อน</div>
                      <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>หลังเลือกแล้วจะเห็นรายการอุปกรณ์ สรุปสถานะ และปุ่มจัดการทั้งหมด</div>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className={`p-5 sm:p-6 border-b ${theme.divide}`}>
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="min-w-0">
                          <div className={`text-xs font-black tracking-[0.18em] uppercase ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>PROJECT DETAIL</div>
                          <h3 className={`text-2xl sm:text-3xl font-black mt-1 leading-tight ${theme.textTitle}`}>{selectedProject.name}</h3>
                          <div className="flex flex-wrap gap-2 mt-3">
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${statusClass}`}>{statusLabel}</span>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>ปีงบ {meta.fiscalYear || '-'}</span>
                            <span className={`px-3 py-1.5 rounded-xl text-xs font-black border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>งบประมาณ {formatMoney(meta.budget)} บาท</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 sm:flex gap-2 shrink-0">
                          {canAddEditItems && selectedProject.name !== 'ไม่ระบุโครงการ' && <button type="button" onClick={() => openProjectMetaEditor(selectedProject.name)} className={`px-4 py-3 rounded-xl border font-black ${theme.btnSecondary}`}>แก้ไขโครงการ</button>}
                          <button type="button" onClick={() => openProjectPrint(selectedProject.name)} className={`px-4 py-3 rounded-xl border font-black ${theme.btnSecondary}`}>พิมพ์รายงาน</button>
                          {canAddEditItems && selectedProject.name !== 'ไม่ระบุโครงการ' && <button type="button" onClick={() => openProjectAssign(selectedProject.name)} className="px-4 py-3 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black">ผูกของจากคลัง</button>}
                          {canAddEditItems && selectedProject.name !== 'ไม่ระบุโครงการ' && <button type="button" onClick={() => openNewItemForProject(selectedProject.name)} className="px-4 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black">+ เพิ่มสินค้าใหม่</button>}
                        </div>
                      </div>
                    </div>

                    <div className="p-5 sm:p-6 space-y-5">
                      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
                        {[
                          ['รายการ', selectedProject.total || 0, 'รายการสินค้า'],
                          ['จำนวนรวม', selectedProject.qtyTotal || 0, 'หน่วย'],
                          ['พร้อมใช้', selectedProject.available || 0, 'พร้อมใช้งาน'],
                          ['ปัญหา', (selectedProject.maintenance || 0) + (selectedProject.lost || 0) + (selectedProject.pending_disposal || 0), 'ซ่อม/สูญหาย/รอจำหน่าย']
                        ].map(([label, value, desc]) => (
                          <div key={label} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`text-xs font-black ${theme.textMuted}`}>{label}</div>
                            <div className={`text-3xl font-black mt-1 ${theme.textTitle}`}>{Number(value || 0).toLocaleString('th-TH')}</div>
                            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{desc}</div>
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                        <div className={`xl:col-span-2 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`font-black mb-3 ${theme.textTitle}`}>ข้อมูลโครงการ</div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            {[
                              ['ผู้รับผิดชอบ', meta.owner || '-'],
                              ['ปีงบประมาณ', meta.fiscalYear || '-'],
                              ['งบประมาณ', budgetNumber > 0 ? `${formatMoney(budgetNumber)} บาท` : '-'],
                              ['ระยะเวลา', `${formatProjectDate(meta.startDate)} - ${formatProjectDate(meta.endDate)}`],
                              ['วัตถุประสงค์', meta.objective || '-'],
                              ['หมายเหตุ', meta.note || '-']
                            ].map(([label, value]) => (
                              <div key={label} className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                                <div className={`text-xs font-black ${theme.textMuted}`}>{label}</div>
                                <div className={`font-bold mt-1 ${theme.textTitle}`}>{value}</div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className={`font-black mb-3 ${theme.textTitle}`}>สรุปเร็ว</div>
                          <div className="space-y-2 text-sm font-bold">
                            <div className="flex justify-between gap-3"><span className={theme.textMuted}>ถูกยืม/ออกงาน</span><span className={theme.textTitle}>{((selectedProject.borrowed || 0) + (selectedProject.outForEvent || 0)).toLocaleString('th-TH')}</span></div>
                            <div className="flex justify-between gap-3"><span className={theme.textMuted}>ซ่อม/ชำรุด</span><span className={theme.textTitle}>{(selectedProject.maintenance || 0).toLocaleString('th-TH')}</span></div>
                            <div className="flex justify-between gap-3"><span className={theme.textMuted}>ยังไม่ติด QR</span><span className={theme.textTitle}>{(selectedProject.qrMissing || 0).toLocaleString('th-TH')}</span></div>
                            <div className="flex justify-between gap-3"><span className={theme.textMuted}>ข้อมูลไม่ครบ</span><span className={theme.textTitle}>{(selectedProject.missingData || 0).toLocaleString('th-TH')}</span></div>
                          </div>
                          <div className={`mt-4 pt-4 border-t ${theme.divide}`}>
                            <button type="button" onClick={() => { setFilterProject(selectedProject.name); openWorkspace('overview'); }} className="w-full px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black">ดูในหน้าคลังสินค้า</button>
                          </div>
                        </div>
                      </div>

                      {(topCategories.length > 0 || topLocations.length > 0) && (
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`font-black mb-3 ${theme.textTitle}`}>หมวดหมู่ในโครงการ</div>
                            <div className="flex flex-wrap gap-2">{topCategories.map(([name, count]) => <span key={name} className={`px-3 py-2 rounded-xl text-xs font-black border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>{name} • {count}</span>)}</div>
                          </div>
                          <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                            <div className={`font-black mb-3 ${theme.textTitle}`}>สถานที่เก็บหลัก</div>
                            <div className="flex flex-wrap gap-2">{topLocations.map(([name, count]) => <span key={name} className={`px-3 py-2 rounded-xl text-xs font-black border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-700'}`}>{name} • {count}</span>)}</div>
                          </div>
                        </div>
                      )}

                      <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className={`p-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${theme.divide}`}>
                          <div>
                            <div className={`font-black ${theme.textTitle}`}>อุปกรณ์ที่อยู่ในโครงการนี้</div>
                            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>แสดงของที่ระบุช่อง “โครงการ” เป็นชื่อโครงการนี้</div>
                          </div>
                          <div className="flex flex-wrap gap-2">
                            {canAddEditItems && selectedProject.name !== 'ไม่ระบุโครงการ' && <button type="button" onClick={() => openProjectAssign(selectedProject.name)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>เลือกจากคลัง</button>}
                            {canAddEditItems && selectedProject.name !== 'ไม่ระบุโครงการ' && <button type="button" onClick={() => openNewItemForProject(selectedProject.name)} className="px-3 py-2 rounded-xl text-sm font-black bg-emerald-600 text-white">เพิ่มสินค้าใหม่</button>}
                          </div>
                        </div>

                        {isEmptyProject ? (
                          <div className="p-8 text-center">
                            <div className={`text-xl font-black ${theme.textTitle}`}>ยังไม่มีอุปกรณ์ในโครงการนี้</div>
                            <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เริ่มจาก “เลือกจากคลัง” เพื่อผูกของที่มีอยู่แล้ว หรือ “เพิ่มสินค้าใหม่” เพื่อบันทึกของที่จัดซื้อเข้าโครงการนี้</div>
                          </div>
                        ) : (
                          <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full text-left min-w-[760px]">
                              <thead className={theme.th}>
                                <tr>
                                  <th className="px-4 py-3 font-black">รหัส / S.N.</th>
                                  <th className="px-4 py-3 font-black">รายการ</th>
                                  <th className="px-4 py-3 font-black">หมวด / ที่เก็บ</th>
                                  <th className="px-4 py-3 font-black text-center">จำนวน</th>
                                  <th className="px-4 py-3 font-black">สถานะ</th>
                                  <th className="px-4 py-3 font-black text-right">จัดการ</th>
                                </tr>
                              </thead>
                              <tbody>
                                {projectItems.slice().sort((a,b)=>String(a.name||'').localeCompare(String(b.name||''),'th',{numeric:true})).map(item => {
                                  const statusInfo = STATUSES.find(st => st.id === item.status) || STATUSES[0];
                                  const assetInfo = getAssetStatusInfo(item.assetStatus);
                                  return (
                                    <tr key={item.id} className={`${isDarkMode ? 'border-t border-slate-800' : 'border-t border-slate-200'}`}>
                                      <td className={`px-4 py-3 font-bold ${theme.textMuted}`}>{item.sn || item.id || '-'}</td>
                                      <td className={`px-4 py-3 font-black ${theme.textTitle}`}>{item.name || '-'}</td>
                                      <td className={`px-4 py-3 text-sm font-bold ${theme.textMuted}`}>{item.category || '-'}<br />{item.location || '-'}</td>
                                      <td className={`px-4 py-3 text-center font-black ${theme.textTitle}`}>{Number(item.quantity || 1).toLocaleString('th-TH')}</td>
                                      <td className="px-4 py-3"><div className="flex flex-col gap-1 items-start"><span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${isDarkMode ? statusInfo.darkColor : statusInfo.color}`}>{statusInfo.label}</span><span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${isDarkMode ? assetInfo.darkColor : assetInfo.color}`}>{assetInfo.label}</span></div></td>
                                      <td className="px-4 py-3 text-right"><div className="inline-flex gap-2"><button type="button" onClick={() => setShowHistory(item.id)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>รายละเอียด</button>{canAddEditItems && <button type="button" onClick={() => openItemEditor(item)} className="px-3 py-2 rounded-xl text-sm font-black bg-blue-600 text-white">แก้ไข</button>}</div></td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        )}
                      </div>

                      {selectedProject.name !== 'ไม่ระบุโครงการ' && isEmptyProject && canAddEditItems && (
                        <div className={`pt-2 flex flex-wrap gap-2`}>
                          <button type="button" onClick={() => handleDeleteEmptyProject(selectedProject.name)} className="px-4 py-3 rounded-xl text-sm font-black bg-rose-600 text-white">ลบโครงการว่าง</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {projectMetaEditTarget && (
          <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
            <div className={`rounded-[2rem] shadow-2xl w-full max-w-3xl max-h-[92vh] overflow-hidden flex flex-col border ${theme.cardBg}`}>
              <div className={`p-5 border-b flex items-center justify-between gap-3 ${theme.divide}`}>
                <div>
                  <div className={`text-xs font-black tracking-[0.18em] uppercase ${isDarkMode ? 'text-indigo-300' : 'text-indigo-600'}`}>PROJECT SETTINGS</div>
                  <h3 className={`text-2xl font-black ${theme.textTitle}`}>แก้ไขรายละเอียดโครงการจัดซื้อ</h3>
                </div>
                <button type="button" onClick={closeProjectMetaEditor} className={`p-2 rounded-xl border ${theme.btnSecondary}`}><Icons.X className="w-5 h-5" /></button>
              </div>
              <div className="p-5 overflow-y-auto custom-scrollbar space-y-4">
                <label className="block"><span className={`block font-black mb-1 ${theme.textTitle}`}>ชื่อโครงการ *</span><input className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={projectMetaForm.name} onChange={e => setProjectMetaForm(prev => ({ ...prev, name: e.target.value }))} /></label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block"><span className={`block font-black mb-1 ${theme.textTitle}`}>ปีงบประมาณ</span><input className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="2569" value={projectMetaForm.fiscalYear} onChange={e => setProjectMetaForm(prev => ({ ...prev, fiscalYear: e.target.value }))} /></label>
                  <label className="block"><span className={`block font-black mb-1 ${theme.textTitle}`}>งบประมาณ</span><input type="number" min="0" className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="เช่น 120000" value={projectMetaForm.budget} onChange={e => setProjectMetaForm(prev => ({ ...prev, budget: e.target.value }))} /></label>
                  <label className="block"><span className={`block font-black mb-1 ${theme.textTitle}`}>ผู้รับผิดชอบ</span><input className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="เช่น ศูนย์ MDEC / ฝ่ายภาพนิ่ง" value={projectMetaForm.owner} onChange={e => setProjectMetaForm(prev => ({ ...prev, owner: e.target.value }))} /></label>
                  <label className="block"><span className={`block font-black mb-1 ${theme.textTitle}`}>สถานะโครงการ</span><select className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={projectMetaForm.status} onChange={e => setProjectMetaForm(prev => ({ ...prev, status: e.target.value }))}><option value="draft">แบบร่าง</option><option value="active">ใช้งานอยู่</option><option value="closed">ปิดโครงการแล้ว</option></select></label>
                  <label className="block"><span className={`block font-black mb-1 ${theme.textTitle}`}>วันที่เริ่ม</span><input type="date" className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={projectMetaForm.startDate} onChange={e => setProjectMetaForm(prev => ({ ...prev, startDate: e.target.value }))} /></label>
                  <label className="block"><span className={`block font-black mb-1 ${theme.textTitle}`}>วันที่สิ้นสุด</span><input type="date" className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={projectMetaForm.endDate} onChange={e => setProjectMetaForm(prev => ({ ...prev, endDate: e.target.value }))} /></label>
                </div>
                <label className="block"><span className={`block font-black mb-1 ${theme.textTitle}`}>วัตถุประสงค์</span><textarea rows={3} className={`w-full px-4 py-3 rounded-xl border font-bold resize-none ${theme.input}`} placeholder="เช่น ปรับปรุงประสิทธิภาพการถ่ายภาพกิจกรรมของวิทยาลัย" value={projectMetaForm.objective} onChange={e => setProjectMetaForm(prev => ({ ...prev, objective: e.target.value }))} /></label>
                <label className="block"><span className={`block font-black mb-1 ${theme.textTitle}`}>หมายเหตุ</span><textarea rows={3} className={`w-full px-4 py-3 rounded-xl border font-bold resize-none ${theme.input}`} placeholder="รายละเอียดเพิ่มเติม / เลขที่เอกสาร / แหล่งงบ" value={projectMetaForm.note} onChange={e => setProjectMetaForm(prev => ({ ...prev, note: e.target.value }))} /></label>
              </div>
              <div className={`p-4 border-t flex flex-col sm:flex-row justify-end gap-2 ${theme.divide}`}>
                <button type="button" onClick={closeProjectMetaEditor} className={`px-5 py-3 rounded-xl border font-black ${theme.btnSecondary}`}>ยกเลิก</button>
                <button type="button" onClick={() => runWithBusy(handleSaveProjectMeta)} disabled={isBusy} className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black disabled:opacity-60">บันทึกโครงการ</button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderOrganizeWorkspace = () => {
    const boxes = settingsOptions.storageBoxes || [];
    const bundles = settingsOptions.bundles || [];
    const prepLists = settingsOptions.prepLists || [];
    return (
      <div className="solid-workspace space-y-5">
        {renderWorkspaceTabs()}
        <div className={`rounded-[1.75rem] border shadow-sm overflow-hidden ${theme.cardBg}`}>
          <div className={`p-5 sm:p-6 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${theme.divide}`}>
            <div>
              <div className={`text-xs font-black tracking-[0.22em] uppercase ${isDarkMode ? 'text-cyan-300' : 'text-cyan-600'}`}>ORGANIZE CENTER</div>
              <h2 className={`text-2xl sm:text-3xl font-black mt-1 ${theme.textTitle}`}>กล่อง / เซ็ต / รายการเตรียมของ</h2>
              <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>หน้านี้รวมงานจัดระเบียบอุปกรณ์ที่เริ่มใหญ่ขึ้น แยกจากรายการสต๊อกหลักให้ดูง่าย</p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2">
              <button type="button" onClick={() => openStorageBoxEditor()} className="px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-black">+ สร้างกล่อง</button>
              <button type="button" onClick={() => { setBundleForm({ id: null, name: '', itemIds: [] }); setBundleSearchTerm(''); setShowBundleManager(true); }} className="px-4 py-3 rounded-xl bg-fuchsia-600 hover:bg-fuchsia-500 text-white font-black">+ สร้างเซ็ต</button>
              <button type="button" onClick={() => setShowPrepListsModal(true)} className={`px-4 py-3 rounded-xl border font-black ${theme.btnSecondary}`}>รายการเตรียมของ</button>
            </div>
          </div>

          <div className="p-5 sm:p-6 space-y-6">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['กล่องเก็บของ', boxes.length, 'text-cyan-500', 'จัดตามกล่อง/ชั้น/ตู้'],
                ['อุปกรณ์ในกล่อง', boxes.reduce((s,b)=>s+(b.itemIds||[]).length,0), 'text-blue-500', 'รวมจำนวนที่ผูกกล่อง'],
                ['เซ็ตอุปกรณ์', bundles.length, 'text-fuchsia-500', 'ชุดที่ใช้บ่อย'],
                ['รายการเตรียมของ', prepLists.length, 'text-amber-500', 'แผนออกงาน/จัดของ']
              ].map(([label, value, color, desc]) => (
                <div key={label} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-xs font-black ${theme.textMuted}`}>{label}</div>
                  <div className={`text-3xl font-black mt-1 ${color}`}>{Number(value || 0).toLocaleString('th-TH')}</div>
                  <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{desc}</div>
                </div>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              <section className={`rounded-[1.5rem] border overflow-hidden ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`p-4 border-b flex items-center justify-between gap-3 ${theme.divide}`}>
                  <div>
                    <h3 className={`text-xl font-black ${theme.textTitle}`}>กล่องเก็บของ</h3>
                    <p className={`text-xs font-bold mt-1 ${theme.textMuted}`}>เหมาะกับตู้ ชั้น กล่องอุปกรณ์ และฉลากหน้ากล่อง</p>
                  </div>
                  <button type="button" onClick={() => openStorageBoxEditor()} className="px-3 py-2 rounded-xl bg-cyan-600 text-white font-black text-sm">เพิ่มกล่อง</button>
                </div>
                <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar">
                  {boxes.length === 0 ? (
                    <div className={`p-8 rounded-2xl border text-center font-bold ${theme.textMuted}`}>ยังไม่มีกล่องเก็บของ</div>
                  ) : boxes.map((box) => {
                    const validIds = (box.itemIds || []).filter(id => items.some(item => item.id === id));
                    return (
                      <div key={box.id} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`font-black text-lg truncate ${theme.textTitle}`}>📦 {box.name}</div>
                            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{validIds.length} รายการ • {box.note || 'ไม่มีหมายเหตุ'}</div>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-black border ${isDarkMode ? 'bg-cyan-950/40 border-cyan-800 text-cyan-300' : 'bg-cyan-50 border-cyan-200 text-cyan-700'}`}>{box.size || 'normal'}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                          <button type="button" onClick={() => selectStorageBoxItems(box)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>เลือกของ</button>
                          <button type="button" onClick={() => openStorageBoxLabel(box)} className="px-3 py-2 rounded-xl text-sm font-black bg-blue-600 text-white">พิมพ์ฉลาก</button>
                          <button type="button" onClick={() => openStorageBoxEditor(box)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>แก้ไข</button>
                          <button type="button" onClick={() => { setFilterLocation('all'); setSearchTerm(box.name || ''); openWorkspace('overview'); }} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>ดูในสต๊อก</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className={`rounded-[1.5rem] border overflow-hidden ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`p-4 border-b flex items-center justify-between gap-3 ${theme.divide}`}>
                  <div>
                    <h3 className={`text-xl font-black ${theme.textTitle}`}>เซ็ตอุปกรณ์</h3>
                    <p className={`text-xs font-bold mt-1 ${theme.textMuted}`}>ชุดอุปกรณ์ที่หยิบใช้งานพร้อมกัน เช่น เซ็ตกล้องหลัก เซ็ต Live</p>
                  </div>
                  <button type="button" onClick={() => { setBundleForm({ id: null, name: '', itemIds: [] }); setBundleSearchTerm(''); setShowBundleManager(true); }} className="px-3 py-2 rounded-xl bg-fuchsia-600 text-white font-black text-sm">เพิ่มเซ็ต</button>
                </div>
                <div className="p-4 space-y-3 max-h-[520px] overflow-y-auto custom-scrollbar">
                  {bundles.length === 0 ? (
                    <div className={`p-8 rounded-2xl border text-center font-bold ${theme.textMuted}`}>ยังไม่มีเซ็ตอุปกรณ์</div>
                  ) : bundles.map((bundle) => {
                    const ids = (bundle.itemIds || []).filter(id => items.some(item => item.id === id));
                    const availableInBundle = ids.filter(id => items.find(item => item.id === id)?.status === 'available').length;
                    return (
                      <div key={bundle.id} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`font-black text-lg truncate ${theme.textTitle}`}>🧩 {bundle.name}</div>
                            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{ids.length} รายการ • พร้อมใช้ {availableInBundle} รายการ</div>
                          </div>
                          <span className={`px-2 py-1 rounded-lg text-xs font-black border ${availableInBundle === ids.length ? (isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDarkMode ? 'bg-amber-950/40 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700')}`}>{availableInBundle}/{ids.length}</span>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">
                          <button type="button" onClick={() => setSelectedItems(ids)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>เลือกเซ็ต</button>
                          <button type="button" onClick={() => handleSelectBundleToBorrow(bundle)} className="px-3 py-2 rounded-xl text-sm font-black bg-purple-600 text-white">ยืม</button>
                          <button type="button" onClick={() => handleSelectBundleToEvent(bundle)} className="px-3 py-2 rounded-xl text-sm font-black bg-orange-600 text-white">ออกงาน</button>
                          <button type="button" onClick={() => { setBundleForm({ id: bundle.id, name: bundle.name, itemIds: bundle.itemIds || [] }); setBundleSearchTerm(''); setShowBundleManager(true); }} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>แก้ไข</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderBorrowReturnWorkspace = () => {
    const modeInfo = borrowReturnMode === 'event'
      ? { id: 'event', title: 'นำอุปกรณ์ออกงาน', color: 'orange', icon: Icons.Truck, status: 'out-for-event' }
      : borrowReturnMode === 'return'
        ? { id: 'return', title: 'รับคืนอุปกรณ์', color: 'emerald', icon: Icons.CheckCircle, status: 'available' }
        : { id: 'borrow', title: 'ให้ยืมอุปกรณ์', color: 'purple', icon: Icons.UserPlus, status: 'borrowed' };
    const q = String(borrowReturnSearch || '').trim().toLowerCase();
    const operationalItems = items
      .filter(item => item && !item.isDeleted)
      .filter(item => borrowReturnMode === 'return' ? (item.status === 'borrowed' || item.status === 'out-for-event') : item.status === 'available')
      .filter(item => {
        if (!q) return true;
        return String(item.name || '').toLowerCase().includes(q) ||
               String(item.sn || '').toLowerCase().includes(q) ||
               String(item.category || '').toLowerCase().includes(q) ||
               String(item.location || '').toLowerCase().includes(q) ||
               String(item.storageBoxName || '').toLowerCase().includes(q) ||
               String(item.currentBorrower || '').toLowerCase().includes(q) ||
               String(item.currentEvent || '').toLowerCase().includes(q);
      })
      .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th', { numeric: true }))
      .slice(0, 140);

    const actionTargetIds = borrowReturnMode === 'event' ? eventTargetIds : borrowReturnMode === 'return' ? returnTargetIds : borrowTargetIds;
    const actionChecklist = borrowReturnMode === 'event' ? eventChecklist : borrowReturnMode === 'return' ? returnChecklist : packingChecklist;
    const selectedActionItems = actionTargetIds.map(id => items.find(item => item.id === id)).filter(Boolean);
    const ActionIcon = modeInfo.icon;
    const toneBtn = borrowReturnMode === 'event' ? 'bg-orange-600 hover:bg-orange-500' : borrowReturnMode === 'return' ? 'bg-emerald-600 hover:bg-emerald-500' : 'bg-purple-600 hover:bg-purple-500';

    const setActionTargets = (ids) => {
      const unique = Array.from(new Set(ids || []));
      if (borrowReturnMode === 'event') {
        setEventTargetIds(unique);
        setEventChecklist(unique);
      } else if (borrowReturnMode === 'return') {
        setReturnTargetIds(unique);
        setReturnChecklist(unique);
      } else {
        setBorrowTargetIds(unique);
        setPackingChecklist(unique);
      }
    };
    const setActionChecklist = (ids) => {
      const unique = Array.from(new Set(ids || []));
      if (borrowReturnMode === 'event') setEventChecklist(unique);
      else if (borrowReturnMode === 'return') setReturnChecklist(unique);
      else setPackingChecklist(unique);
    };
    const clearOperationSelection = () => {
      if (borrowReturnMode === 'event') { setEventTargetIds([]); setEventChecklist([]); setEventProofFiles([]); }
      else if (borrowReturnMode === 'return') { setReturnTargetIds([]); setReturnChecklist([]); setReturnProofFiles([]); setReturnInspection({}); }
      else { setBorrowTargetIds([]); setPackingChecklist([]); setBorrowProofFiles([]); }
    };
    const toggleOperationalItem = (id) => {
      if (actionTargetIds.includes(id)) {
        const next = actionTargetIds.filter(x => x !== id);
        setActionTargets(next);
        setActionChecklist(actionChecklist.filter(x => x !== id));
      } else {
        setActionTargets([...actionTargetIds, id]);
        setActionChecklist([...actionChecklist, id]);
      }
    };
    const selectVisibleItems = () => setActionTargets(operationalItems.map(item => item.id));

    return (
      <div className="solid-workspace space-y-5">
        {renderWorkspaceTabs()}
        <div className={`rounded-[1.75rem] border shadow-sm overflow-hidden operation-workspace-card borrow-return-polish ${theme.cardBg}`}>
          <div className={`p-5 sm:p-6 border-b flex flex-col xl:flex-row xl:items-center justify-between gap-4 ${theme.divide}`}>
            <div>
              <div className={`text-xs font-black tracking-[0.22em] uppercase ${isDarkMode ? 'text-purple-300' : 'text-purple-600'}`}>BORROW & RETURN</div>
              <h2 className={`text-2xl sm:text-3xl font-black mt-1 ${theme.textTitle}`}>จัดการยืม-คืนอุปกรณ์</h2>
              <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>หน้าทำงานหลักสำหรับเลือกอุปกรณ์ กรอกข้อมูล เช็กของ แนบหลักฐาน และยืนยันรายการ โดยไม่ต้องไล่หา popup หลายจุด</p>
            </div>
            <div className="grid grid-cols-2 sm:flex gap-2">
              <button type="button" onClick={() => openSelectionScanner({ camera: true })} className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black flex items-center justify-center gap-2"><Icons.QrCode className="w-5 h-5" /> สแกน QR</button>
              <button type="button" onClick={() => setShowBorrowDocsModal(true)} className={`px-4 py-3 rounded-xl border font-black ${theme.btnSecondary}`}>เอกสารย้อนหลัง</button>
            </div>
          </div>

          <div className="p-4 sm:p-6 space-y-5">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['พร้อมให้ยืม/ออกงาน', stats.available, 'text-emerald-500', 'อุปกรณ์พร้อมใช้'],
                ['ถูกยืมอยู่', currentBorrowedItems.length, 'text-purple-500', 'รอรับคืน'],
                ['ออกงานอยู่', currentEventItems.length, 'text-orange-500', 'รอรับคืนจากงาน'],
                ['เลยกำหนดคืน', overdueItems.length, 'text-rose-500', 'ควรติดตาม']
              ].map(([label, value, color, desc]) => (
                <div key={label} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-xs font-black ${theme.textMuted}`}>{label}</div>
                  <div className={`text-3xl font-black mt-1 ${color}`}>{Number(value || 0).toLocaleString('th-TH')}</div>
                  <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{desc}</div>
                </div>
              ))}
            </div>

            <div className={`rounded-[1.5rem] border p-2 grid grid-cols-3 gap-2 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
              {[
                ['borrow', 'ให้ยืม', Icons.UserPlus, 'เลือกของพร้อมใช้'],
                ['event', 'ออกงาน', Icons.Truck, 'นำของไปใช้งาน'],
                ['return', 'รับคืน', Icons.CheckCircle, 'คืนของเข้าคลัง']
              ].map(([id, label, Icon, desc]) => (
                <button key={id} type="button" onClick={() => { clearOperationSelection(); setBorrowReturnMode(id); }} className={`p-3 rounded-2xl border text-left transition-all ${borrowReturnMode === id ? 'bg-blue-600 text-white border-blue-600 shadow-md' : theme.btnSecondary}`}>
                  <div className="flex items-center gap-2 font-black"><Icon className="w-5 h-5" /> {label}</div>
                  <div className={`text-[11px] font-bold mt-1 ${borrowReturnMode === id ? 'text-blue-100' : theme.textMuted}`}>{desc}</div>
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.1fr)_minmax(360px,.9fr)] gap-5 items-start">
              <section className={`rounded-[1.5rem] border overflow-hidden ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`p-4 border-b ${theme.divide}`}>
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <h3 className={`text-xl font-black ${theme.textTitle}`}>{borrowReturnMode === 'return' ? 'รายการที่รอรับคืน' : 'รายการที่พร้อมใช้งาน'}</h3>
                      <p className={`text-xs font-bold mt-1 ${theme.textMuted}`}>พบ {operationalItems.length.toLocaleString('th-TH')} รายการ • เลือกแล้ว {actionTargetIds.length.toLocaleString('th-TH')} รายการ</p>
                    </div>
                    <div className="flex gap-2">
                      <button type="button" onClick={selectVisibleItems} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>เลือกที่เห็น</button>
                      <button type="button" onClick={clearOperationSelection} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>ล้าง</button>
                    </div>
                  </div>
                  <input className={`mt-3 w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="ค้นหาชื่อ / S.N. / หมวด / ที่เก็บ / ผู้ยืม / งาน" value={borrowReturnSearch} onChange={e => setBorrowReturnSearch(e.target.value)} />
                </div>
                <div className="p-3 sm:p-4 max-h-[650px] overflow-y-auto custom-scrollbar space-y-2">
                  {operationalItems.length === 0 ? (
                    <div className={`p-8 rounded-2xl border text-center font-bold ${theme.textMuted}`}>ไม่พบรายการในโหมดนี้</div>
                  ) : operationalItems.map(item => {
                    const statusInfo = STATUSES.find(st => st.id === item.status) || STATUSES[0];
                    const selected = actionTargetIds.includes(item.id);
                    const late = (item.status === 'borrowed' || item.status === 'out-for-event') && item.expectedReturn && new Date(item.expectedReturn).getTime() < todayMs;
                    return (
                      <button key={item.id} type="button" onClick={() => toggleOperationalItem(item.id)} className={`w-full p-3 sm:p-4 rounded-2xl border text-left transition-all ${selected ? (isDarkMode ? 'bg-blue-950/40 border-blue-700' : 'bg-blue-50 border-blue-300') : (isDarkMode ? 'bg-slate-900 border-slate-800 hover:border-slate-600' : 'bg-slate-50 border-slate-200 hover:border-blue-200')}`}>
                        <div className="flex items-start gap-3">
                          <span className={`mt-1 w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 ${selected ? 'bg-blue-600 border-blue-600 text-white' : isDarkMode ? 'border-slate-600 bg-slate-950' : 'border-slate-300 bg-white'}`}>{selected ? '✓' : ''}</span>
                          <div className="min-w-0 flex-1">
                            <div className={`font-black clean-mobile-card-title ${theme.textTitle}`}>{item.name || '-'}</div>
                            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>S.N. {item.sn || '-'} • {item.category || '-'} • {item.location || '-'}</div>
                            <div className="mt-2 flex flex-wrap gap-1.5">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${isDarkMode ? statusInfo.darkColor : statusInfo.color}`}>{statusInfo.label}</span>
                              {item.storageBoxName && <span className={`px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-cyan-900/40 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>📦 {item.storageBoxName}</span>}
                              {item.currentBorrower && <span className={`px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-purple-900/40 text-purple-300' : 'bg-purple-50 text-purple-700'}`}>ผู้ยืม: {item.currentBorrower}</span>}
                              {item.currentEvent && <span className={`px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-orange-900/40 text-orange-300' : 'bg-orange-50 text-orange-700'}`}>งาน: {item.currentEvent}</span>}
                              {late && <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white">เลยกำหนดคืน</span>}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </section>

              <section className={`rounded-[1.5rem] border overflow-hidden sticky top-4 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                <div className={`p-4 border-b ${theme.divide}`}>
                  <h3 className={`text-xl font-black flex items-center gap-2 ${theme.textTitle}`}><ActionIcon className="w-6 h-6" /> {modeInfo.title}</h3>
                  <p className={`text-xs font-bold mt-1 ${theme.textMuted}`}>เลือกอุปกรณ์ด้านซ้าย แล้วตรวจเช็กก่อนยืนยันรายการ</p>
                </div>
                <div className="p-4 space-y-4">
                  {borrowReturnMode === 'borrow' && (
                    <>
                      <label className="block"><span className={`block text-sm font-black mb-1 ${theme.textTitle}`}>ผู้ให้ยืม *</span><select className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={borrowData.staff || ''} onChange={e => setBorrowData({...borrowData, staff: e.target.value, newStaff: e.target.value !== 'อื่นๆ' ? '' : borrowData.newStaff})}><option value="" disabled>-- เลือกชื่อเจ้าหน้าที่ --</option>{(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}</select></label>
                      {borrowData.staff === 'อื่นๆ' && <input className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="พิมพ์ชื่อเจ้าหน้าที่ใหม่" value={borrowData.newStaff || ''} onChange={e => setBorrowData({...borrowData, newStaff: e.target.value})} />}
                      <label className="block"><span className={`block text-sm font-black mb-1 ${theme.textTitle}`}>ชื่อผู้ยืม *</span><input className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="ชื่อ-สกุล / แผนก" value={borrowData.borrower || ''} onChange={e => setBorrowData({...borrowData, borrower: e.target.value})} /></label>
                      <label className="block"><span className={`block text-sm font-black mb-1 ${theme.textTitle}`}>กำหนดคืน</span><input type="date" className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={borrowData.returnDate || ''} onChange={e => setBorrowData({...borrowData, returnDate: e.target.value})} /></label>
                      <textarea className={`w-full px-4 py-3 rounded-xl border font-bold resize-none ${theme.input}`} rows={2} placeholder="หมายเหตุ" value={borrowData.note || ''} onChange={e => setBorrowData({...borrowData, note: e.target.value})} />
                      {renderProofUploader('หลักฐานการยืม', borrowProofFiles, setBorrowProofFiles, 'purple')}
                    </>
                  )}
                  {borrowReturnMode === 'event' && (
                    <>
                      <label className="block"><span className={`block text-sm font-black mb-1 ${theme.textTitle}`}>ผู้นำออก / ผู้รับผิดชอบ *</span><select className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={eventData.staff || ''} onChange={e => setEventData({...eventData, staff: e.target.value, newStaff: e.target.value !== 'อื่นๆ' ? '' : eventData.newStaff})}><option value="" disabled>-- เลือกชื่อเจ้าหน้าที่ --</option>{(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}</select></label>
                      {eventData.staff === 'อื่นๆ' && <input className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="พิมพ์ชื่อเจ้าหน้าที่ใหม่" value={eventData.newStaff || ''} onChange={e => setEventData({...eventData, newStaff: e.target.value})} />}
                      <label className="block"><span className={`block text-sm font-black mb-1 ${theme.textTitle}`}>ชื่องาน / สถานที่ *</span><input className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="เช่น งานประชุม / ถ่ายภาพกิจกรรม" value={eventData.eventName || ''} onChange={e => setEventData({...eventData, eventName: e.target.value})} /></label>
                      <label className="block"><span className={`block text-sm font-black mb-1 ${theme.textTitle}`}>กำหนดคืน</span><input type="date" className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={eventData.returnDate || ''} onChange={e => setEventData({...eventData, returnDate: e.target.value})} /></label>
                      <textarea className={`w-full px-4 py-3 rounded-xl border font-bold resize-none ${theme.input}`} rows={2} placeholder="หมายเหตุ" value={eventData.note || ''} onChange={e => setEventData({...eventData, note: e.target.value})} />
                      {renderProofUploader('หลักฐานนำออกงาน', eventProofFiles, setEventProofFiles, 'orange')}
                    </>
                  )}
                  {borrowReturnMode === 'return' && (
                    <>
                      <label className="block"><span className={`block text-sm font-black mb-1 ${theme.textTitle}`}>ผู้รับคืน *</span><select className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={returnData.staff || ''} onChange={e => setReturnData({...returnData, staff: e.target.value, newStaff: e.target.value !== 'อื่นๆ' ? '' : returnData.newStaff})}><option value="" disabled>-- เลือกชื่อเจ้าหน้าที่ --</option>{(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}</select></label>
                      {returnData.staff === 'อื่นๆ' && <input className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="พิมพ์ชื่อเจ้าหน้าที่ใหม่" value={returnData.newStaff || ''} onChange={e => setReturnData({...returnData, newStaff: e.target.value})} />}
                      {renderProofUploader('หลักฐานการรับคืน', returnProofFiles, setReturnProofFiles, 'emerald')}
                    </>
                  )}

                  <div className={`rounded-2xl border p-3 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex items-center justify-between gap-3 mb-3">
                      <div className={`font-black ${theme.textTitle}`}>เช็กลิสต์ ({actionChecklist.length}/{actionTargetIds.length})</div>
                      <div className="flex gap-2">
                        <button type="button" onClick={() => setActionChecklist(actionTargetIds)} className={`px-3 py-2 rounded-xl text-xs font-black border ${theme.btnSecondary}`}>เช็กครบ</button>
                        <button type="button" onClick={() => setActionChecklist([])} className={`px-3 py-2 rounded-xl text-xs font-black border ${theme.btnSecondary}`}>ล้างเช็ก</button>
                      </div>
                    </div>
                    <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                      {selectedActionItems.length === 0 ? <div className={`p-4 text-center text-sm font-bold ${theme.textMuted}`}>ยังไม่ได้เลือกอุปกรณ์</div> : selectedActionItems.map(item => {
                        const checked = actionChecklist.includes(item.id);
                        return (
                          <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${checked ? (isDarkMode ? 'bg-emerald-950/25 border-emerald-800' : 'bg-emerald-50 border-emerald-200') : (isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-200')}`}>
                            <input type="checkbox" className="stock-check mt-0.5" checked={checked} onChange={e => setActionChecklist(e.target.checked ? [...actionChecklist, item.id] : actionChecklist.filter(id => id !== item.id))} />
                            <span className={`min-w-0 flex-1 text-sm font-black ${theme.textTitle}`}>{item.name}<span className={`block text-xs font-bold ${theme.textMuted}`}>S.N. {item.sn || '-'} • {item.location || '-'}</span></span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={clearOperationSelection} className={`py-4 rounded-xl font-black border ${theme.btnCancel}`}>ยกเลิก</button>
                    <button type="button" onClick={borrowReturnMode === 'event' ? handleEventOut : borrowReturnMode === 'return' ? handleReturn : handleBorrow} disabled={(borrowReturnMode === 'borrow' && (!borrowData.staff || !borrowData.borrower || packingChecklist.length === 0)) || (borrowReturnMode === 'event' && (!eventData.staff || !eventData.eventName || eventChecklist.length === 0)) || (borrowReturnMode === 'return' && (!returnData.staff || returnChecklist.length === 0))} className={`py-4 rounded-xl font-black text-white ${toneBtn} disabled:bg-slate-400 disabled:cursor-not-allowed`}>ยืนยัน</button>
                  </div>
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQRWorkbenchPage = () => {
    const scanInfo = getScanModeInfo();
    const isChecklistMode = scanMode !== 'select';
    const targetIds = scanMode === 'borrowChecklist' ? borrowTargetIds : scanMode === 'eventChecklist' ? eventTargetIds : scanMode === 'returnChecklist' ? returnTargetIds : [];
    const checkedIds = scanMode === 'borrowChecklist' ? packingChecklist : scanMode === 'eventChecklist' ? eventChecklist : scanMode === 'returnChecklist' ? returnChecklist : [];
    const total = targetIds.length || 0;
    const checked = checkedIds.length || 0;
    const percent = total === 0 ? 0 : Math.min(100, Math.round((checked / total) * 100));
    const isComplete = total > 0 && checked >= total;
    const pendingIds = isChecklistMode ? targetIds.filter(id => !checkedIds.includes(id)).slice(0, 3) : [];
    const recentItem = lastScannedItemId ? items.find(i => i.id === lastScannedItemId) : null;
    const recentStatus = recentItem ? (STATUSES.find(s => s.id === recentItem.status) || STATUSES[0]) : null;
    const selectedPreviewItems = selectedItems.map(id => items.find(i => i.id === id)).filter(Boolean).slice(0, 3);
    const toneClass = scanMode === 'borrowChecklist'
      ? 'from-purple-600 to-violet-700'
      : scanMode === 'eventChecklist'
        ? 'from-orange-500 to-red-600'
        : scanMode === 'returnChecklist'
          ? 'from-emerald-500 to-teal-600'
          : 'from-sky-500 to-indigo-600';
    const toneSoft = scanMode === 'borrowChecklist'
      ? (isDarkMode ? 'bg-purple-950/30 border-purple-800 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800')
      : scanMode === 'eventChecklist'
        ? (isDarkMode ? 'bg-orange-950/30 border-orange-800 text-orange-200' : 'bg-orange-50 border-orange-200 text-orange-800')
        : scanMode === 'returnChecklist'
          ? (isDarkMode ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
          : (isDarkMode ? 'bg-sky-950/30 border-sky-800 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-800');

    const closeScanWorkbench = () => {
      setShowScanModal(false);
      setUseCamera(false);
      setActiveWorkspace('overview');
    };

    const actionButtonBase = 'min-h-[40px] px-3 py-2 rounded-xl font-black text-[13px] transition disabled:opacity-45 disabled:cursor-not-allowed';

    return (
      <div className={`qr-workbench-mobile-friendly w-full h-[calc(100dvh-24px)] min-h-[520px] max-h-[calc(100dvh-24px)] max-md:h-[calc(100svh-8px)] max-md:min-h-0 max-md:max-h-none overflow-hidden rounded-[2rem] max-md:rounded-[1rem] border shadow-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
        <style>{`
          .qr-workbench-mobile-friendly #qr-reader {
            width: 100% !important;
            border: 0 !important;
            background: transparent !important;
            color: inherit !important;
            overflow: hidden !important;
          }
          .qr-workbench-mobile-friendly #qr-reader video {
            border-radius: 22px !important;
            object-fit: cover !important;
            background: #020617 !important;
            height: min(36dvh, 340px) !important;
            min-height: 240px !important;
            max-height: 360px !important;
          }
          .qr-workbench-mobile-friendly #qr-reader__scan_region {
            background: transparent !important;
            border: 0 !important;
          }
          .qr-workbench-mobile-friendly #qr-reader__dashboard,
          .qr-workbench-mobile-friendly #qr-reader__dashboard_section,
          .qr-workbench-mobile-friendly #qr-reader__dashboard_section_csr,
          .qr-workbench-mobile-friendly #qr-reader__camera_selection {
            border: 0 !important;
            background: transparent !important;
            color: inherit !important;
            font-family: inherit !important;
          }
          .qr-workbench-mobile-friendly #qr-reader button {
            background: #0f172a !important;
            color: white !important;
            border: 0 !important;
            padding: 8px 12px !important;
            border-radius: 12px !important;
            font-weight: 900 !important;
            margin: 4px !important;
            font-size: 12px !important;
          }
          .qr-workbench-mobile-friendly #qr-reader select {
            min-height: 36px !important;
            border-radius: 12px !important;
            padding: 0 10px !important;
            font-weight: 800 !important;
            max-width: 100% !important;
            font-size: 12px !important;
          }
          .qr-workbench-mobile-friendly #qr-reader__status_span {
            display: none !important;
          }
          @media (max-width: 767px) {
            .qr-workbench-mobile-friendly #qr-reader video {
              height: 38svh !important;
              min-height: 250px !important;
              max-height: 340px !important;
              border-radius: 22px !important;
            }
            .qr-workbench-mobile-friendly #qr-reader__dashboard_section,
            .qr-workbench-mobile-friendly #qr-reader__dashboard_section_csr {
              padding: 4px 0 !important;
              margin: 0 !important;
              font-size: 12px !important;
              line-height: 1.2 !important;
            }
            .qr-workbench-mobile-friendly #qr-reader__camera_selection {
              min-height: 36px !important;
              height: 36px !important;
              font-size: 12px !important;
              padding: 0 10px !important;
            }
            .qr-workbench-mobile-friendly #qr-reader button {
              padding: 7px 10px !important;
              margin: 3px !important;
              font-size: 12px !important;
              border-radius: 12px !important;
            }
            .qr-workbench-mobile-friendly { border-radius: 16px !important; }
          }
        `}</style>

        <div className="h-full min-h-0 flex flex-col">
          <div className={`shrink-0 px-2.5 py-2 sm:px-4 sm:py-3 border-b ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
            <div className="flex items-center justify-between gap-2">
              <button type="button" onClick={closeScanWorkbench} className={`h-9 px-3 rounded-xl border font-black text-sm flex items-center gap-2 ${theme.btnSecondary}`}>← กลับ</button>
              <div className="min-w-0 flex-1 text-center">
                <h3 className={`font-black text-[15px] sm:text-lg leading-tight truncate ${theme.textTitle}`}>{isChecklistMode ? scanInfo.title : 'สแกน QR'}</h3>
                <p className={`text-[11px] sm:text-xs font-bold truncate ${theme.textMuted}`}>{isChecklistMode ? `เช็กแล้ว ${checked}/${total}` : (qrWorkbenchMode === 'multi' ? `เลือกแล้ว ${selectedItems.length} รายการ` : 'จัดการทันที')}</p>
              </div>
              <div className={`h-9 min-w-[54px] px-2 rounded-xl border flex items-center justify-center text-xs font-black ${isChecklistMode ? toneSoft : theme.btnSecondary}`}>
                {isChecklistMode ? `${percent}%` : selectedItems.length}
              </div>
            </div>

            {!isChecklistMode && (
              <div className={`mt-2 p-1 rounded-xl grid grid-cols-2 gap-1 border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-100 border-slate-200'}`}>
                <button
                  type="button"
                  onClick={() => setQrWorkbenchMode('multi')}
                  className={`min-h-[34px] rounded-lg font-black text-[13px] transition ${qrWorkbenchMode === 'multi' ? 'bg-sky-600 text-white shadow-sm' : (isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-white')}`}
                >
                  หลายรายการ
                </button>
                <button
                  type="button"
                  onClick={() => setQrWorkbenchMode('single')}
                  className={`min-h-[34px] rounded-lg font-black text-[13px] transition ${qrWorkbenchMode === 'single' ? 'bg-indigo-600 text-white shadow-sm' : (isDarkMode ? 'text-slate-300 hover:bg-slate-800' : 'text-slate-600 hover:bg-white')}`}
                >
                  ทันที
                </button>
              </div>
            )}
          </div>

          <div className="flex-1 min-h-0 p-2 sm:p-4 overflow-hidden">
            <div className="h-full min-h-0 grid grid-cols-1 lg:grid-cols-[1.08fr_.92fr] gap-2 sm:gap-4">
              <section className={`min-h-0 rounded-[1.25rem] border overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`shrink-0 px-3 py-2 border-b flex items-center justify-between gap-2 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="min-w-0">
                    <div className={`font-black text-sm ${theme.textTitle}`}>สแกน</div>
                    <div className={`text-[11px] font-bold truncate ${theme.textMuted}`}>{useCamera ? 'ส่อง QR ให้อยู่ในกรอบ' : 'พิมพ์รหัส / ยิงบาร์โค้ด'}</div>
                  </div>
                  <div className="flex gap-1.5 shrink-0">
                    <button type="button" onClick={() => setUseCamera(true)} className={`h-8 px-3 rounded-lg font-black text-xs border ${useCamera ? `bg-gradient-to-br ${toneClass} text-white border-transparent` : theme.btnSecondary}`}>กล้อง</button>
                    <button type="button" onClick={() => setUseCamera(false)} className={`h-8 px-3 rounded-lg font-black text-xs border ${!useCamera ? `bg-gradient-to-br ${toneClass} text-white border-transparent` : theme.btnSecondary}`}>พิมพ์</button>
                  </div>
                </div>

                <div className="flex-1 min-h-0 p-2 sm:p-3 overflow-y-auto custom-scrollbar">
                  {useCamera ? (
                    <>
                      {!isScannerLoaded ? (
                        <div className="min-h-[250px] flex items-center justify-center">
                          <div className="animate-pulse text-amber-500 font-black">กำลังโหลดระบบกล้อง...</div>
                        </div>
                      ) : (
                        <div className={`rounded-[1.5rem] overflow-hidden border-4 ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'}`}>
                          <div id="qr-reader" className="w-full"></div>
                        </div>
                      )}
                      <form onSubmit={handleScanSubmit} className="mt-1.5 grid grid-cols-[1fr_auto] gap-2">
                        <input
                          type="text"
                          className={`px-3 py-2 rounded-xl font-black text-center text-sm outline-none border ${theme.input}`}
                          placeholder="พิมพ์รหัส/S.N. หากสแกนไม่ติด"
                          value={scanInput}
                          onChange={e => setScanInput(e.target.value)}
                        />
                        <button type="submit" className={`px-4 py-2 rounded-xl bg-gradient-to-br ${toneClass} text-white font-black shadow-md text-sm`}>{isChecklistMode ? 'เช็ก' : (qrWorkbenchMode === 'multi' ? 'เพิ่ม' : 'ค้นหา')}</button>
                      </form>
                    </>
                  ) : (
                    <div className="h-full min-h-[250px] flex flex-col justify-center">
                      <form onSubmit={handleScanSubmit}>
                        <label className={`block text-left text-sm font-black mb-2 ${theme.textTitle}`}>รหัสอุปกรณ์ / S.N.</label>
                        <input
                          type="text"
                          ref={scanInputRef}
                          className={`w-full px-4 py-5 rounded-3xl font-black text-center text-xl outline-none mb-3 border-2 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 transition-all ${theme.input}`}
                          placeholder="ยิงบาร์โค้ด หรือพิมพ์รหัสที่นี่"
                          value={scanInput}
                          onChange={e => setScanInput(e.target.value)}
                          autoFocus
                        />
                        <button type="submit" className={`w-full py-3 rounded-2xl bg-gradient-to-br ${toneClass} text-white font-black shadow-lg`}>{isChecklistMode ? 'สแกนเช็กอุปกรณ์นี้' : (qrWorkbenchMode === 'multi' ? 'เพิ่มเข้ารายการ' : 'ค้นหาอุปกรณ์')}</button>
                      </form>
                    </div>
                  )}
                </div>
              </section>

              <section className={`min-h-0 rounded-[1.25rem] border overflow-hidden flex flex-col ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                <div className={`shrink-0 px-3 py-2 border-b ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
                  <div className={`font-black text-sm ${theme.textTitle}`}>{isChecklistMode ? 'เช็กรายการ' : (qrWorkbenchMode === 'multi' ? 'รายการล่าสุด' : 'คำสั่งด่วน')}</div>
                  <div className={`text-[11px] font-bold mt-0.5 ${theme.textMuted}`}>{isChecklistMode ? 'แสดงเฉพาะรายการที่ยังรอสแกน' : (qrWorkbenchMode === 'multi' ? 'แสดงล่าสุดไม่เกิน 3 รายการ เพื่อไม่ให้รก' : 'สแกนแล้วกดจัดการได้ทันที')}</div>
                </div>

                <div className="flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2.5 space-y-2">
                  {scanMessage.text && (
                    <div className={`p-2.5 rounded-xl border text-sm font-black shadow-sm ${scanMessage.type === 'success' ? (isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800') : (isDarkMode ? 'bg-rose-950/40 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800')}`}>
                      {scanMessage.text}
                    </div>
                  )}

                  {isChecklistMode ? (
                    <>
                      <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center justify-between mb-2">
                          <span className={`font-black ${theme.textTitle}`}>เช็กแล้ว</span>
                          <span className={`font-black ${theme.textTitle}`}>{checked}/{total}</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-slate-300/60 dark:bg-slate-800 overflow-hidden">
                          <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percent}%` }}></div>
                        </div>
                        {isComplete && (
                          <button type="button" onClick={closeScanWorkbench} className="mt-3 w-full px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md">
                            เช็กครบแล้ว กลับไปยืนยัน
                          </button>
                        )}
                      </div>

                      <div className="space-y-2">
                        {pendingIds.length === 0 ? (
                          <div className="p-3 rounded-2xl bg-emerald-500 text-white font-black text-center">ครบแล้ว</div>
                        ) : pendingIds.map(id => {
                          const item = items.find(i => i.id === id);
                          if (!item) return null;
                          return (
                            <div key={id} className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <div className={`font-black truncate ${theme.textTitle}`}>{item.name}</div>
                              <div className={`text-xs font-bold ${theme.textMuted}`}>S.N. {item.sn || '-'}</div>
                            </div>
                          );
                        })}
                        {total - checked > pendingIds.length && <div className={`text-center text-xs font-bold ${theme.textMuted}`}>และอีก {total - checked - pendingIds.length} รายการ</div>}
                      </div>
                    </>
                  ) : qrWorkbenchMode === 'multi' ? (
                    <>
                      <div className={`p-2.5 rounded-xl border flex items-center justify-between ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                        <div>
                          <div className={`font-black ${theme.textTitle}`}>เลือกแล้ว {selectedItems.length} รายการ</div>
                          <div className={`text-xs font-bold ${theme.textMuted}`}>สแกนต่อได้เรื่อย ๆ ระบบกันรายการซ้ำให้</div>
                        </div>
                        <button type="button" onClick={() => setSelectedItems([])} disabled={selectedItems.length === 0} className={`px-3 py-2 rounded-xl text-xs font-black border disabled:opacity-45 ${theme.btnSecondary}`}>ล้าง</button>
                      </div>

                      <div className="space-y-2">
                        {selectedPreviewItems.length > 0 ? selectedPreviewItems.map(item => {
                          const st = STATUSES.find(s => s.id === item.status) || STATUSES[0];
                          return (
                            <div key={item.id} className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                              <div className="min-w-0">
                                <div className={`font-black truncate ${theme.textTitle}`}>{item.name}</div>
                                <div className={`text-xs font-bold mt-0.5 ${theme.textMuted}`}>S.N. {item.sn || '-'} • {item.location || 'ไม่ระบุที่เก็บ'}</div>
                              </div>
                              <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border shrink-0 ${isDarkMode ? st.darkColor : st.color}`}>{st.label}</span>
                            </div>
                          );
                        }) : (
                          <div className={`p-3 rounded-xl text-center font-bold ${isDarkMode ? 'bg-slate-950 text-slate-400 border border-slate-800' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                            ยังไม่มีรายการที่สแกนในรอบนี้
                          </div>
                        )}
                        {selectedItems.length > selectedPreviewItems.length && <div className={`text-center text-xs font-bold ${theme.textMuted}`}>และอีก {selectedItems.length - selectedPreviewItems.length} รายการ</div>}
                      </div>
                    </>
                  ) : (
                    <>
                      {recentItem ? (
                        <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={`font-black text-lg leading-tight ${theme.textTitle}`}>{recentItem.name}</div>
                              <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>S.N. {recentItem.sn || '-'} • {recentItem.category || '-'}</div>
                              <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>ที่เก็บ: {recentItem.location || 'ไม่ระบุที่เก็บ'}</div>
                            </div>
                            {recentStatus && <span className={`px-3 py-1.5 rounded-xl text-xs font-black border shrink-0 ${isDarkMode ? recentStatus.darkColor : recentStatus.color}`}>{recentStatus.label}</span>}
                          </div>
                        </div>
                      ) : (
                        <div className={`p-5 rounded-3xl text-center font-bold border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                          สแกน 1 ชิ้น เพื่อแสดงคำสั่งด่วน
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className={`shrink-0 p-2.5 border-t ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
                  {isChecklistMode ? (
                    <button type="button" onClick={closeScanWorkbench} className={`${actionButtonBase} w-full bg-slate-700 hover:bg-slate-600 text-white`}>กลับไปหน้ารายการ</button>
                  ) : qrWorkbenchMode === 'multi' ? (
                    <div className="grid grid-cols-3 gap-2">
                      <button type="button" onClick={() => { handleOpenBatchBorrow(); closeScanWorkbench(); }} className={`${actionButtonBase} bg-purple-600 hover:bg-purple-500 text-white`} disabled={selectedItems.length === 0}>ยืม</button>
                      <button type="button" onClick={() => { handleOpenBatchEvent(); closeScanWorkbench(); }} className={`${actionButtonBase} bg-orange-600 hover:bg-orange-500 text-white`} disabled={selectedItems.length === 0}>ออกงาน</button>
                      <button type="button" onClick={() => { handleOpenBatchReturn(); closeScanWorkbench(); }} className={`${actionButtonBase} bg-emerald-600 hover:bg-emerald-500 text-white`} disabled={selectedItems.length === 0}>คืน</button>
                    </div>
                  ) : recentItem ? (
                    <div className="grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => { closeScanWorkbench(); setShowHistory(recentItem.id); }} className={`${actionButtonBase} border ${theme.btnSecondary}`}>รายละเอียด</button>
                      {canAddEditItems && <button type="button" onClick={() => { closeScanWorkbench(); openItemEditor(recentItem); }} className={`${actionButtonBase} bg-blue-600 hover:bg-blue-500 text-white`}>แก้ไข</button>}
                      {recentItem.status === 'available' && (
                        <>
                          <button type="button" onClick={() => { closeScanWorkbench(); handleOpenRowBorrow({ stopPropagation: () => {} }, recentItem); }} className={`${actionButtonBase} bg-purple-600 hover:bg-purple-500 text-white`}>ยืม</button>
                          <button type="button" onClick={() => { closeScanWorkbench(); handleOpenRowEvent({ stopPropagation: () => {} }, recentItem); }} className={`${actionButtonBase} bg-orange-600 hover:bg-orange-500 text-white`}>ออกงาน</button>
                        </>
                      )}
                      {(recentItem.status === 'borrowed' || recentItem.status === 'out-for-event') && (
                        <button type="button" onClick={() => { closeScanWorkbench(); openReturnForItems([recentItem.id]); }} className={`${actionButtonBase} col-span-2 bg-emerald-600 hover:bg-emerald-500 text-white`}>รับคืนอุปกรณ์นี้</button>
                      )}
                    </div>
                  ) : (
                    <button type="button" disabled className={`${actionButtonBase} w-full bg-slate-400 text-white opacity-60`}>สแกนก่อนดำเนินการ</button>
                  )}
                </div>
              </section>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveWorkspace = () => {
    if (activeWorkspace === 'qrWorkbench') return renderQRWorkbenchPage();
    if (activeWorkspace === 'borrowReturn') return renderBorrowReturnWorkspace();
    if (activeWorkspace === 'projects') return renderProjectWorkspace();
    if (activeWorkspace === 'organize') return renderOrganizeWorkspace();
    return null;
  };

  const settingsNavItems = [
    { id: 'categories', label: 'หมวดหมู่', desc: 'รายการหมวดอุปกรณ์', icon: Icons.Tag, group: 'ข้อมูลพื้นฐาน' },
    { id: 'locations', label: 'สถานที่ / ห้อง', desc: 'ที่เก็บและห้องประชุม', icon: Icons.Folder, group: 'ข้อมูลพื้นฐาน' },
    { id: 'staff', label: 'เจ้าหน้าที่', desc: 'รายชื่อผู้ทำรายการ', icon: Icons.Users, group: 'ข้อมูลพื้นฐาน' },
    { id: 'accounts', label: 'บัญชีผู้ใช้', desc: 'ล็อกอินและสิทธิ์', icon: Icons.UserPlus, group: 'ผู้ใช้งาน' },
    { id: 'display', label: 'การแสดงผล', desc: 'ความแน่น / การ์ด / เอฟเฟกต์', icon: Icons.Monitor, group: 'หน้าตาเว็บ' },
    { id: 'documents', label: 'เอกสาร / โลโก้', desc: 'ใบยืม ฉลาก QR และโลโก้', icon: Icons.Printer, group: 'เอกสาร' },
    { id: 'proofs', label: 'หลักฐานรูปภาพ', desc: 'กติกาการแนบรูป', icon: Icons.Camera, group: 'หลักฐาน' },
    { id: 'database', label: 'ฐานข้อมูล / สำรอง', desc: 'Backup, Restore, Cleanup', icon: Icons.Database, group: 'System' },
  ];

  const resetSettingsFormState = () => {
    setEditingSettingItem(null);
    setNewSettingItem('');
  };

  const filteredAuditLogs = useMemo(() => {
    if (auditFilter === 'all') return auditLogs;
    return auditLogs.filter(log => {
      const action = String(log.action || '');
      if (auditFilter === 'add') return action.includes('เพิ่ม') || action.includes('นำเข้า');
      if (auditFilter === 'edit') return action.includes('แก้');
      if (auditFilter === 'borrow') return action.includes('ยืม');
      if (auditFilter === 'event') return action.includes('ออกงาน');
      if (auditFilter === 'return') return action.includes('คืน');
      if (auditFilter === 'delete') return action.includes('ลบ') || action.includes('กู้คืน');
      if (auditFilter === 'account') return action.includes('บัญชี');
      return true;
    });
  }, [auditLogs, auditFilter]);

  const overdueItems = items.filter(item => {
    if (item && item.isDeleted) return false;
    if ((item.status !== 'borrowed' && item.status !== 'out-for-event') || !item.expectedReturn) return false;
    return new Date(item.expectedReturn).getTime() < todayMs;
  });

  const currentBorrowedItems = useMemo(() => {
    return items
      .filter(item => item && !item.isDeleted && item.status === 'borrowed')
      .slice()
      .sort((a, b) => new Date(a.expectedReturn || '9999-12-31') - new Date(b.expectedReturn || '9999-12-31'));
  }, [items]);

  const currentEventItems = useMemo(() => {
    return items
      .filter(item => item && !item.isDeleted && item.status === 'out-for-event')
      .slice()
      .sort((a, b) => new Date(a.expectedReturn || '9999-12-31') - new Date(b.expectedReturn || '9999-12-31'));
  }, [items]);

  const todayDateKey = new Date().toLocaleDateString('en-CA');
  const dueTodayItems = useMemo(() => {
    return items.filter(item => {
      if (!item || item.isDeleted) return false;
      if (item.status !== 'borrowed' && item.status !== 'out-for-event') return false;
      return String(item.expectedReturn || '') === todayDateKey;
    });
  }, [items, todayDateKey]);

  const prepTodayLists = useMemo(() => {
    return (settingsOptions.prepLists || []).filter(prep => String(prep.useDate || '') === todayDateKey && prep.status !== 'done');
  }, [settingsOptions.prepLists, todayDateKey]);

  const dailyIssueItems = useMemo(() => {
    return items.filter(item => !item?.isDeleted && (item.status === 'maintenance' || isProblemItem(item))).slice(0, 8);
  }, [items, todayMs]);

  const recentActivity = useMemo(() => {
    return (auditLogs || [])
      .slice()
      .sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0))
      .slice(0, 6);
  }, [auditLogs]);

  const selectableItems = useMemo(() => {
    return filteredItems.filter(i => i.status === 'available' || i.status === 'borrowed' || i.status === 'out-for-event');
  }, [filteredItems]);

  const stats = useMemo(() => {
    const s = { all: 0, available: 0, inUse: 0, borrowed: 0, outForEvent: 0, maintenance: 0 };
    items.forEach(item => {
      if (item && item.isDeleted) return;
      const qty = Number(item.quantity) || 1;
      s.all += qty;
      if (item.status === 'available') s.available += qty;
      if (item.status === 'in-use') s.inUse += qty;
      if (item.status === 'borrowed') s.borrowed += qty;
      if (item.status === 'out-for-event') s.outForEvent += qty;
      if (item.status === 'maintenance') s.maintenance += qty;
    });
    return s;
  }, [items]);

  const deptItems = useMemo(() => {
    return items.filter(item => !item.isDeleted && (filterDept === 'all' || item.department === filterDept));
  }, [items, filterDept]);

  const categoryStats = useMemo(() => {
    const catData = {};
    (settingsOptions?.categories || []).filter(c => c !== 'อื่นๆ').forEach(cat => { catData[cat] = { total: 0, available: 0 }; });

    deptItems.forEach(item => {
      const qty = Number(item.quantity) || 1;
      const cat = item.category || 'อื่นๆ';
      if (!catData[cat]) catData[cat] = { total: 0, available: 0 };
      catData[cat].total += qty;
      if (item.status === 'available') { catData[cat].available += qty; }
    });

    let result = Object.entries(catData).map(([label, data]) => ({ label, data }));
    if (!showEmptyCategories) { result = result.filter(item => item.data.total > 0); }
    return result;
  }, [deptItems, settingsOptions, showEmptyCategories]);

  const activeGroups = useMemo(() => {
    const groups = {};
    items.forEach(item => {
      if (item && item.isDeleted) return;
      if (item.status === 'borrowed' && item.currentBorrower) {
        const key = `borrow_${item.currentBorrower}`;
        if(!groups[key]) groups[key] = { type: 'borrow', name: item.currentBorrower, ids: [] };
        groups[key].ids.push(item.id);
      } else if (item.status === 'out-for-event' && item.currentEvent) {
        const key = `event_${item.currentEvent}`;
        if(!groups[key]) groups[key] = { type: 'event', name: item.currentEvent, ids: [] };
        groups[key].ids.push(item.id);
      }
    });
    return Object.values(groups);
  }, [items]);

  const getDateKey = (value) => {
    if (!value) return '';
    try {
      if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value)) return value.slice(0, 10);
      const d = new Date(value);
      if (Number.isNaN(d.getTime())) return String(value).slice(0, 10);
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return y + '-' + m + '-' + day;
    } catch (e) { return String(value).slice(0, 10); }
  };

  const todayKey = getDateKey(new Date());

  const todayFollowup = useMemo(() => {
    const active = items.filter(i => i.status === 'borrowed' || i.status === 'out-for-event');
    return {
      dueToday: active.filter(i => getDateKey(i.expectedReturn) === todayKey),
      overdue: active.filter(i => i.expectedReturn && new Date(i.expectedReturn).setHours(0,0,0,0) < todayMs),
      active
    };
  }, [items, todayKey, todayMs]);

  const calendarDays = useMemo(() => {
    const map = {};
    const addEvent = (dateKey, event) => {
      if (!dateKey) return;
      if (!map[dateKey]) map[dateKey] = [];
      map[dateKey].push(event);
    };

    items.forEach((item) => {
      if ((item.status === 'borrowed' || item.status === 'out-for-event') && item.expectedReturn) {
        addEvent(getDateKey(item.expectedReturn), {
          type: item.status === 'out-for-event' ? 'event-return' : 'borrow-return',
          title: item.status === 'out-for-event' ? `คืนจากงาน: ${item.currentEvent || '-'}` : `คืนจากผู้ยืม: ${item.currentBorrower || '-'}`,
          itemName: item.name,
          sn: item.sn,
          status: item.status
        });
      }
    });

    (settingsOptions.prepLists || []).forEach((prep) => {
      addEvent(getDateKey(prep.useDate), {
        type: 'prep',
        title: `เตรียมของ: ${prep.name || '-'}`,
        itemName: `${(prep.itemIds || []).length} รายการ`,
        staff: prep.staff,
        status: prep.status || 'pending'
      });
    });

    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(0, 45)
      .map(([date, events]) => ({ date, events }));
  }, [items, settingsOptions.prepLists]);

  const actionCenterData = useMemo(() => {
    const dueToday = todayFollowup.dueToday || [];
    const overdue = todayFollowup.overdue || [];
    const maintenance = items.filter(i => i.status === 'maintenance' && !i.isDeleted);
    const untagged = items.filter(i => !i.qrTagged && !i.isDeleted);
    const deleted = items.filter(i => i.isDeleted);
    const prepIncomplete = (settingsOptions.prepLists || []).filter(p => (p.status || 'pending') !== 'completed' && (p.checkedIds || []).length < (p.itemIds || []).length);
    const brokenBoxes = (settingsOptions.storageBoxes || []).map(box => {
      const itemIds = box.itemIds || [];
      const missingIds = itemIds.filter(id => !items.find(i => i.id === id && !i.isDeleted));
      return { ...box, missingIds };
    }).filter(box => (box.missingIds || []).length > 0);

    return {
      overdue,
      dueToday,
      maintenance,
      untagged,
      deleted,
      prepIncomplete,
      brokenBoxes,
      total: overdue.length + dueToday.length + maintenance.length + untagged.length + deleted.length + prepIncomplete.length + brokenBoxes.length
    };
  }, [items, settingsOptions.prepLists, settingsOptions.storageBoxes, todayFollowup]);

  const getProofUniqueKey = (proof = {}) => String(
    proof.proofDocId ||
    proof.id ||
    proof.docId ||
    `${proof.createdAt || 'nodate'}_${proof.originalName || ''}_${proof.sizeBytes || ''}_${String(proof.thumbUrl || proof.url || '').slice(0, 96)}`
  );

  const getItemProofCount = (item) => (Array.isArray(item?.history) ? item.history : []).reduce((sum, h) => sum + (Array.isArray(h.proofs) ? h.proofs.length : 0), 0);

  const allProofEntries = useMemo(() => {
    const entries = [];
    items.filter(i => i && !i.isDeleted).forEach((item) => {
      (Array.isArray(item.history) ? item.history : []).forEach((h, historyIndex) => {
        const proofs = Array.isArray(h.proofs) ? h.proofs : [];
        proofs.forEach((proof, proofIndex) => {
          const type = h.type || 'other';
          const typeLabel = type === 'borrow' ? 'ยืม' : type === 'event' ? 'ออกงาน' : type === 'return' ? 'รับคืน' : type === 'repair' || type === 'repair-done' ? 'ซ่อม' : 'อื่น ๆ';
          entries.push({
            id: `${item.id}_${historyIndex}_${proof.id || proofIndex}`,
            itemId: item.id,
            itemName: item.name || '-',
            sn: item.sn || '-',
            department: item.department || '-',
            category: item.category || '-',
            location: item.location || '-',
            storageBoxName: item.storageBoxName || '',
            historyIndex,
            historyType: type,
            typeLabel,
            date: h.date || proof.createdAt || '',
            subject: h.borrower || h.eventName || h.problem || h.staffIn || '-',
            staff: h.staffOut || h.staffIn || h.operatorName || proof.createdBy || '-',
            note: h.note || h.problem || '',
            proof
          });
        });
      });
    });
    return entries.sort((a, b) => new Date(b.date || b.proof?.createdAt || 0) - new Date(a.date || a.proof?.createdAt || 0));
  }, [items]);

  const filteredProofEntries = useMemo(() => {
    const keyword = String(proofCenterSearch || '').toLowerCase().trim();
    return allProofEntries.filter((entry) => {
      const matchType = proofCenterFilter === 'all' || entry.historyType === proofCenterFilter;
      const haystack = `${entry.itemName} ${entry.sn} ${entry.subject} ${entry.staff} ${entry.storageBoxName} ${entry.note}`.toLowerCase();
      return matchType && (!keyword || haystack.includes(keyword));
    });
  }, [allProofEntries, proofCenterFilter, proofCenterSearch]);

  const dedupedProofGroups = useMemo(() => {
    const groups = new Map();

    allProofEntries.forEach((entry) => {
      const proof = entry.proof || {};
      const groupKey = getProofUniqueKey(proof);

      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          groupId: groupKey,
          proof,
          representative: entry,
          entries: [],
          itemRefs: [],
          itemRefKeys: new Set(),
          typeLabels: new Set(),
          historyTypes: new Set(),
          searchText: ''
        });
      }

      const group = groups.get(groupKey);
      group.entries.push(entry);
      group.typeLabels.add(entry.typeLabel || 'อื่น ๆ');
      group.historyTypes.add(entry.historyType || 'other');

      const itemKey = entry.itemId || entry.sn || entry.itemName || `item_${group.entries.length}`;
      if (!group.itemRefKeys.has(itemKey)) {
        group.itemRefKeys.add(itemKey);
        group.itemRefs.push({
          itemId: entry.itemId,
          itemName: entry.itemName || '-',
          sn: entry.sn || '-',
          subject: entry.subject || '-',
          typeLabel: entry.typeLabel || '-',
          historyType: entry.historyType || 'other',
          date: entry.date || entry.proof?.createdAt || ''
        });
      }
    });

    return Array.from(groups.values()).map((group) => {
      const searchText = [
        group.representative?.itemName,
        group.representative?.sn,
        group.representative?.subject,
        group.representative?.staff,
        group.representative?.storageBoxName,
        group.representative?.note,
        ...group.itemRefs.flatMap(ref => [ref.itemName, ref.sn, ref.subject, ref.typeLabel])
      ].filter(Boolean).join(' ').toLowerCase();

      const sortedEntries = group.entries.slice().sort((a, b) => new Date(b.date || b.proof?.createdAt || 0) - new Date(a.date || a.proof?.createdAt || 0));
      const representative = sortedEntries[0] || group.representative;
      return {
        ...group,
        entries: sortedEntries,
        representative,
        proof: representative?.proof || group.proof,
        typeLabels: Array.from(group.typeLabels),
        historyTypes: Array.from(group.historyTypes),
        searchText,
        firstDate: representative?.date || representative?.proof?.createdAt || ''
      };
    }).sort((a, b) => new Date(b.firstDate || 0) - new Date(a.firstDate || 0));
  }, [allProofEntries]);

  const filteredProofGroups = useMemo(() => {
    const keyword = String(proofCenterSearch || '').toLowerCase().trim();
    return dedupedProofGroups.filter((group) => {
      const matchType = proofCenterFilter === 'all' || group.historyTypes.includes(proofCenterFilter) || (proofCenterFilter === 'repair' && group.historyTypes.some(t => String(t).includes('repair')));
      return matchType && (!keyword || group.searchText.includes(keyword));
    });
  }, [dedupedProofGroups, proofCenterFilter, proofCenterSearch]);

  const proofDuplicateStats = useMemo(() => {
    const linkCount = filteredProofGroups.reduce((sum, group) => sum + group.entries.length, 0);
    const itemLinkCount = filteredProofGroups.reduce((sum, group) => sum + group.itemRefs.length, 0);
    const duplicateLinks = Math.max(0, linkCount - filteredProofGroups.length);
    return { realImages: filteredProofGroups.length, linkCount, itemLinkCount, duplicateLinks };
  }, [filteredProofGroups]);

  const proofStorageForecast = useMemo(() => {
    const proofBytes = Number(settingsOptions.proofStorageMeta?.totalBytes || 0);
    const proofCount = Number(settingsOptions.proofStorageMeta?.count || allProofEntries.length || 0);
    const avgBytes = proofCount > 0 ? proofBytes / proofCount : (Number(activeProofSettings.targetKB || 150) * 1024);
    const limitBytes = 1024 * 1024 * 1024;
    const safeBytes = 800 * 1024 * 1024;
    const usedEstimate = Number(settingsOptions.proofStorageMeta?.totalBytes || 0) + (items.length * 1400);
    const remainingSafe = Math.max(0, safeBytes - usedEstimate);
    const remainingByAvg = avgBytes > 0 ? Math.floor(remainingSafe / avgBytes) : 0;
    return { proofBytes, proofCount, avgBytes, remainingSafe, remainingByAvg };
  }, [settingsOptions.proofStorageMeta, allProofEntries.length, activeProofSettings.targetKB]);

  const monthlyReportData = useMemo(() => {
    const monthKey = monthlyReportMonth || `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`;
    const historyEntries = [];
    items.filter(i => i && !i.isDeleted).forEach((item) => {
      (Array.isArray(item.history) ? item.history : []).forEach((h) => {
        const dKey = getDateKey(h.date || h.issueDate || h.createdAt || '');
        if (String(dKey || '').startsWith(monthKey)) historyEntries.push({ item, h });
      });
    });
    const countType = (type) => historyEntries.filter(e => e.h.type === type).length;
    const useMap = {};
    historyEntries.filter(e => ['borrow','event','return'].includes(e.h.type)).forEach(({item}) => {
      const key = item.id;
      if (!useMap[key]) useMap[key] = { item, count: 0 };
      useMap[key].count += 1;
    });
    const repairItems = historyEntries.filter(e => String(e.h.type || '').includes('repair'));
    return {
      monthKey,
      total: historyEntries.length,
      borrow: countType('borrow'),
      event: countType('event'),
      return: countType('return'),
      repairs: repairItems.length,
      proofs: historyEntries.reduce((sum, e) => sum + (Array.isArray(e.h.proofs) ? e.h.proofs.length : 0), 0),
      topUsed: Object.values(useMap).sort((a, b) => b.count - a.count).slice(0, 8),
      overdueNow: overdueItems.length,
      maintenanceNow: items.filter(i => i.status === 'maintenance' && !i.isDeleted).length
    };
  }, [items, monthlyReportMonth, overdueItems.length]);


  const stockCountStats = useMemo(() => {
    const activeItems = items.filter(i => !i.isDeleted);
    const foundSet = new Set(stockCountFoundIds);
    const found = activeItems.filter(i => foundSet.has(i.id));
    const notFound = activeItems.filter(i => !foundSet.has(i.id) && i.status === 'available');
    const out = activeItems.filter(i => i.status === 'borrowed' || i.status === 'out-for-event');
    const maintenance = activeItems.filter(i => i.status === 'maintenance');
    return { activeItems, found, notFound, out, maintenance };
  }, [items, stockCountFoundIds]);

  const sortedBundleItems = useMemo(() => {
    if (!showBundleManager) return [];
    const search = bundleSearchTerm.toLowerCase().trim();
    const filtered = items.filter(i => !i?.isDeleted && ((i?.name || '').toLowerCase().includes(search) || (i?.sn && String(i.sn).toLowerCase().includes(search))));
    return filtered.sort((a, b) => {
      const aSel = (bundleForm.itemIds || []).includes(a.id);
      const bSel = (bundleForm.itemIds || []).includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return (a.name||'').localeCompare(b.name||'', 'th', { numeric: true });
    });
  }, [items, bundleSearchTerm, bundleForm.itemIds, showBundleManager]);

  const sortedStorageBoxEditorItems = useMemo(() => {
    if (!showStorageBoxEditor) return [];
    const search = storageBoxSearchTerm.toLowerCase().trim();
    const selectedIdsInForm = storageBoxForm.itemIds || [];
    const filtered = items.filter(i => {
      if (i?.isDeleted) return false;
      if (!search) return true;
      return (i?.name || '').toLowerCase().includes(search) ||
             (i?.sn && String(i.sn).toLowerCase().includes(search)) ||
             (i?.category && String(i.category).toLowerCase().includes(search)) ||
             (i?.location && String(i.location).toLowerCase().includes(search)) ||
             (i?.storageBoxName && String(i.storageBoxName).toLowerCase().includes(search));
    });
    return filtered.sort((a, b) => {
      const aSel = selectedIdsInForm.includes(a.id);
      const bSel = selectedIdsInForm.includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return (a.name || '').localeCompare(b.name || '', 'th', { numeric: true });
    });
  }, [items, storageBoxSearchTerm, storageBoxForm.itemIds, showStorageBoxEditor]);


  const databaseStorageEstimate = useMemo(() => {
    const historyCount = items.reduce((sum, item) => sum + (Array.isArray(item.history) ? item.history.length : 0), 0);
    const boxCount = (settingsOptions.storageBoxes || []).length;
    const prepCount = (settingsOptions.prepLists || []).length;
    const bundleCount = (settingsOptions.bundles || []).length;
    const proofMeta = settingsOptions.proofStorageMeta || {};
    const proofStorageBytes = Number(proofMeta.totalBytes || 0);
    const proofImageCount = Number(proofMeta.count || 0);
    const payload = {
      items,
      settings: settingsOptions,
      auditLogs: auditLogs || [],
      summary: { historyCount, boxCount, prepCount, bundleCount, proofImageCount, proofStorageBytes }
    };
    let rawBytes = 0;
    try {
      rawBytes = new TextEncoder().encode(JSON.stringify(payload)).length;
    } catch (e) {
      rawBytes = JSON.stringify(payload).length * 2;
    }

    // ประเมินเผื่อ overhead ของ Firestore/Index/metadata เพื่อให้ปลอดภัยกว่าไฟล์ JSON ดิบ
    const estimatedBytes = Math.ceil((rawBytes * 1.45) + proofStorageBytes + (items.length * 900) + (historyCount * 350) + (boxCount * 700) + (prepCount * 700) + ((auditLogs || []).length * 450));
    const limitBytes = 1024 * 1024 * 1024; // อิงแผนฟรี 1GB ที่ผู้ใช้ใช้งานอยู่
    const percent = Math.min(100, Math.max(0, (estimatedBytes / limitBytes) * 100));

    const formatBytes = (bytes) => {
      if (!bytes || bytes < 0) return '0 B';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      if (bytes < 1024 * 1024 * 1024) return (bytes / 1024 / 1024).toFixed(2) + ' MB';
      return (bytes / 1024 / 1024 / 1024).toFixed(2) + ' GB';
    };

    let level = 'safe';
    let label = 'ปลอดภัยมาก';
    let barClass = 'bg-emerald-500';
    let cardTone = isDarkMode ? 'bg-emerald-900/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200';
    let textTone = isDarkMode ? 'text-emerald-300' : 'text-emerald-700';

    if (percent >= 90) {
      level = 'danger';
      label = 'ใกล้เต็มมาก';
      barClass = 'bg-rose-500';
      cardTone = isDarkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200';
      textTone = isDarkMode ? 'text-rose-300' : 'text-rose-700';
    } else if (percent >= 75) {
      level = 'warning';
      label = 'ควรสำรอง/ล้างประวัติ';
      barClass = 'bg-amber-500';
      cardTone = isDarkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200';
      textTone = isDarkMode ? 'text-amber-300' : 'text-amber-700';
    } else if (percent >= 50) {
      level = 'watch';
      label = 'เริ่มเยอะ ควรติดตาม';
      barClass = 'bg-blue-500';
      cardTone = isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200';
      textTone = isDarkMode ? 'text-blue-300' : 'text-blue-700';
    }

    return {
      level,
      label,
      barClass,
      cardTone,
      textTone,
      percent,
      percentText: percent < 0.1 && estimatedBytes > 0 ? '<0.1%' : percent.toFixed(1) + '%',
      estimatedText: formatBytes(estimatedBytes),
      rawText: formatBytes(rawBytes),
      limitText: formatBytes(limitBytes),
      historyCount,
      boxCount,
      prepCount,
      bundleCount,
      auditCount: (auditLogs || []).length,
      itemCount: items.length,
      proofImageCount,
      proofStorageText: formatBytes(proofStorageBytes)
    };
  }, [items, settingsOptions, auditLogs, isDarkMode]);

  const handleStockCountScan = () => {
    const val = String(stockCountInput || '').trim();
    if (!val) return;
    const found = items.find(i => !i.isDeleted && (i.id === val || String(i.sn || '').toLowerCase() === val.toLowerCase() || String(i.name || '').toLowerCase() === val.toLowerCase()));
    if (!found) {
      notify('ไม่พบอุปกรณ์', `ไม่พบรหัส/ชื่อ: ${val}`, 'error');
      setStockCountInput('');
      return;
    }
    setStockCountFoundIds(prev => prev.includes(found.id) ? prev : [...prev, found.id]);
    notify('ตรวจพบแล้ว', found.name, 'success');
    setStockCountInput('');
  };

  const openRepairForItem = (item) => {
    if (!item) return;
    setRepairTargetId(item.id);
    setRepairForm({ issueDate: new Date().toISOString().slice(0, 10), problem: '', reporter: currentAccountLabel || '', sentTo: '', cost: '', doneDate: '', note: '', markAvailable: false });
    setShowRepairModal(true);
  };

  const handleSaveRepair = async () => {
    const item = items.find(i => i.id === repairTargetId);
    if (!user || !item) return;
    if (!String(repairForm.problem || '').trim()) {
      notify('กรอกอาการก่อน', 'กรุณาระบุอาการเสียหรือสิ่งที่ต้องซ่อม', 'warning');
      return;
    }
    const repairEntry = {
      type: repairForm.markAvailable ? 'repair-done' : 'repair',
      date: new Date().toISOString(),
      issueDate: repairForm.issueDate || new Date().toISOString().slice(0, 10),
      problem: repairForm.problem,
      reporter: repairForm.reporter || currentAccountLabel,
      sentTo: repairForm.sentTo || '',
      cost: repairForm.cost || '',
      doneDate: repairForm.doneDate || '',
      note: repairForm.note || '',
      operatorName: currentAccountLabel
    };
    const newHistory = [...(item.history || []), repairEntry];
    const repairLogs = [...(item.repairLogs || []), repairEntry];
    const newStatus = repairForm.markAvailable ? 'available' : 'maintenance';
    await setDoc(getItemDoc(item.id), { status: newStatus, history: newHistory, repairLogs, updatedAt: new Date().toISOString(), updatedBy: currentAccountLabel }, { merge: true });
    logAction(repairForm.markAvailable ? 'ปิดงานซ่อม' : 'แจ้งซ่อม', item.name, `${repairForm.problem}\nผู้แจ้ง: ${repairForm.reporter || currentAccountLabel}`);
    notify('บันทึกงานซ่อมแล้ว', item.name, 'success');
    setShowRepairModal(false);
    setRepairTargetId(null);
  };

  const applyProblemFilter = (type) => {
    setShowActionCenterModal(false);
    setQuickProblemOnly(false);
    if (type === 'overdue') { setFilterStatus('all'); setSearchTerm(''); return setShowTodayModal(true); }
    if (type === 'maintenance') { setFilterStatus('maintenance'); setSearchTerm(''); return; }
    if (type === 'untagged') { setFilterQrTagged('untagged'); return; }
    if (type === 'deleted') { setShowTrashModal(true); return; }
  };

  const handleSave = async () => {
    if (!canAddEditItems) return alert('❌ บัญชีนี้ไม่มีสิทธิ์เพิ่มหรือแก้ไขอุปกรณ์');
    const nameInput = formData.name || '';
    const snInput = String(formData.sn || '').trim();

    if (!nameInput.trim() || !snInput) {
      alert('❌ กรุณากรอก "ชื่ออุปกรณ์" และ "รหัส S.N." ให้ครบถ้วน (Systemบังคับใส่รหัสซีเรียล)');
      return;
    }

    const isDuplicate = items.some(item => item.sn && String(item.sn).trim().toLowerCase() === snInput.toLowerCase() && item.id !== formData.id);
    if (isDuplicate) {
      alert(`❌ ไม่สามารถบันทึกได้: รหัส S.N. "${snInput}" มีซ้ำอยู่ในSystemแล้ว กรุณาตรวจสอบอีกครั้ง`);
      return; 
    }

    try {
      let currentSettings = { ...settingsOptions };
      let settingsChanged = false;

      let finalCategory = String(formData.category || formData.newCategory || '').trim() || 'อื่นๆ';
      if (formData.category === 'อื่นๆ' && (formData.newCategory || '').trim()) {
        finalCategory = String(formData.newCategory || '').trim();
      }
      if (finalCategory && finalCategory !== 'อื่นๆ' && !(currentSettings.categories || []).some(c => String(c).trim().toLowerCase() === finalCategory.toLowerCase())) {
        currentSettings.categories = [...new Set([...(currentSettings.categories || []).filter(c => c !== 'อื่นๆ'), finalCategory, 'อื่นๆ'])];
        settingsChanged = true;
      }

      let finalLocation = String(formData.location || formData.newLocation || '').trim() || 'อื่นๆ';
      if (formData.location === 'อื่นๆ' && (formData.newLocation || '').trim()) {
        finalLocation = String(formData.newLocation || '').trim();
      }
      if (finalLocation && finalLocation !== 'อื่นๆ' && !(currentSettings.locations || []).some(c => String(c).trim().toLowerCase() === finalLocation.toLowerCase())) {
        currentSettings.locations = [...new Set([...(currentSettings.locations || []).filter(c => c !== 'อื่นๆ'), finalLocation, 'อื่นๆ'])];
        settingsChanged = true;
      }

      let finalProject = normalizeProjectName(formData.project);
      if (formData.project === 'อื่นๆ' && (formData.newProject || '').trim()) {
        finalProject = normalizeProjectName(formData.newProject);
        currentSettings.projects = [...new Set([...(currentSettings.projects || []).map(p => normalizeProjectName(p)).filter(c => c && c !== 'อื่นๆ'), finalProject, 'อื่นๆ'])];
        settingsChanged = true;
      }
      if (finalProject && finalProject !== 'อื่นๆ') {
        currentSettings.projects = [...new Set([...(currentSettings.projects || []).map(p => normalizeProjectName(p)).filter(c => c && c !== 'อื่นๆ'), finalProject, 'อื่นๆ'])];
        settingsChanged = true;
      }

      let finalOwner = '';
      if (formData.isPersonalItem) {
        if (formData.owner === 'อื่นๆ') {
          if (!(formData.newOwner || '').trim()) {
            alert('❌ กรุณาระบุชื่อเจ้าของ (ของส่วนตัว)');
            return;
          }
          finalOwner = formData.newOwner.trim();
          currentSettings.staff = [...new Set([...(currentSettings.staff || []).filter(c => c !== 'อื่นๆ'), finalOwner, 'อื่นๆ'])];
          settingsChanged = true;
        } else if (!formData.owner) {
           alert('❌ กรุณาเลือกชื่อเจ้าของ (ของส่วนตัว)');
           return;
        } else {
          finalOwner = formData.owner;
        }
      }

      if (settingsChanged) {
         setSettingsOptions(currentSettings);
         await setDoc(getSettingsDoc(), currentSettings);
      }

      const itemData = { 
        ...formData, 
        category: finalCategory, 
        location: finalLocation,
        project: finalProject,
        assetStatus: formData.assetStatus || 'active',
        owner: finalOwner,
        quantity: Number(formData.quantity) || 1, 
        updatedAt: new Date().toISOString(),
        updatedBy: currentOperator?.name || 'Admin' 
      };
      delete itemData.newCategory;
      delete itemData.newLocation;
      delete itemData.newProject;
      delete itemData.newOwner;
      delete itemData.isPersonalItem;
      
      const isEdit = !!formData.id;
      delete itemData.id;
      
      if (isEdit) {
        const oldItem = items.find(item => item.id === formData.id);
        const projectChanged = String(oldItem?.project || '') !== String(finalProject || '');
        if (projectChanged) {
          const history = Array.isArray(oldItem?.history) ? [...oldItem.history] : [];
          history.push({
            type: 'projectChange',
            date: new Date().toISOString(),
            fromProject: projectDisplayName(oldItem?.project),
            toProject: finalProject || 'ยังไม่ผูกโครงการจัดซื้อ',
            staff: currentOperator?.name || 'Admin',
            note: 'เปลี่ยนโครงการแบบง่ายจากหน้าแก้ไขอุปกรณ์'
          });
          itemData.history = history;
        }
        await setDoc(getItemDoc(formData.id), itemData, { merge: true });
        logAction(projectChanged ? 'เปลี่ยนโครงการอุปกรณ์' : 'แก้ไขข้อมูล', itemData.name, projectChanged ? `ย้ายจาก ${projectDisplayName(oldItem?.project)} → ${finalProject || 'ยังไม่ผูกโครงการจัดซื้อ'}` : `แก้ไขรายละเอียดอุปกรณ์ S.N.: ${itemData.sn || '-'}`);
      } else {
        const newId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await setDoc(getItemDoc(newId), { ...itemData, createdBy: currentOperator?.name || 'Admin', history: [] });
        logAction('เพิ่มอุปกรณ์', itemData.name, `เพิ่มเข้าสู่Systemใหม่ หมวดหมู่: ${itemData.category}`);
      }
      setShowForm(false);
      alert(isEdit ? '✅ แก้ไขข้อมูลอุปกรณ์สำเร็จ!' : '✅ เพิ่มอุปกรณ์ใหม่สำเร็จ!');
    } catch (error) {
      console.error(error);
      alert(`❌ ไม่สามารถบันทึกข้อมูลได้: ${error.message}`);
    }
  };

  const handleDeleteItem = async () => {
    if (!canDeleteItems) return alert('❌ เฉพาะบัญชีกลาง/ผู้ดูแลเท่านั้นที่ลบอุปกรณ์ได้');
    if (!user || !itemToDelete || !itemToDelete.id) return;
    try {
      const itemName = itemToDelete.name;
      await setDoc(getItemDoc(itemToDelete.id), {
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        deletedBy: currentOperator?.name || 'Admin',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      logAction('ย้ายอุปกรณ์เข้าถังขยะ', itemName, `ย้ายอุปกรณ์ออกจากรายการหลัก สามารถกู้คืนได้จากเมนูถังขยะ`);
      setItemToDelete(null);
      alert('✅ ย้ายอุปกรณ์เข้าถังขยะแล้ว สามารถกู้คืนได้ภายหลัง');
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(`เกิดข้อผิดพลาดจากฐานข้อมูล: ${error.message}`);
      setItemToDelete(null);
    }
  };

  const handleRestoreTrashItem = async (item) => {
    if (!canDeleteItems) return alert('❌ เฉพาะบัญชีกลาง/ผู้ดูแลเท่านั้นที่กู้คืนอุปกรณ์ได้');
    if (!item || !item.id) return;
    try {
      await setDoc(getItemDoc(item.id), {
        isDeleted: false,
        deletedAt: null,
        deletedBy: null,
        restoredAt: new Date().toISOString(),
        restoredBy: currentOperator?.name || 'Admin',
        updatedAt: new Date().toISOString()
      }, { merge: true });
      await logAction('กู้คืนอุปกรณ์จากถังขยะ', item.name || '-', `กู้คืนอุปกรณ์กลับเข้ารายการหลัก`);
      alert('✅ กู้คืนอุปกรณ์เรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      alert('❌ กู้คืนอุปกรณ์ไม่สำเร็จ: ' + error.message);
    }
  };

  const handlePermanentDeleteTrashItem = async (item) => {
    if (!canDeleteItems) return alert('❌ เฉพาะบัญชีกลาง/ผู้ดูแลเท่านั้นที่ลบถาวรได้');
    if (!item || !item.id) return;
    const confirmText = prompt(`ลบถาวร "${item.name}" หรือไม่?\n\nการลบถาวรจะกู้คืนไม่ได้ หากยืนยันให้พิมพ์ DELETE`);
    if (String(confirmText || '').trim() !== 'DELETE') return;
    try {
      await deleteDoc(getItemDoc(item.id));
      await logAction('ลบอุปกรณ์ถาวร', item.name || '-', `ลบถาวรจากถังขยะ`);
      alert('✅ ลบถาวรเรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      alert('❌ ลบถาวรไม่สำเร็จ: ' + error.message);
    }
  };

  const handleOpenRowBorrow = (e, item) => {
    e.stopPropagation();
    try {
      setBorrowData({ borrower: '', borrowDate: new Date().toISOString().split('T')[0], returnDate: '', staff: '', newStaff: '', note: '' }); 
      setBorrowProofFiles([]);
      setBorrowTargetIds([item.id]);
      setPackingChecklist([]);
    } catch (err) { alert("Systemขัดข้อง: " + err.message); }
  };

  const handleOpenRowEvent = (e, item) => {
    e.stopPropagation();
    try {
      setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' }); 
      setEventProofFiles([]);
      setEventTargetIds([item.id]);
      setEventChecklist([]);
    } catch (err) { alert("Systemขัดข้อง: " + err.message); }
  };

  const openAddItemForm = () => {
    setFormData({
      id: '',
      name: '',
      sn: '',
      department: 'ภาพนิ่ง',
      category: '',
      newCategory: '',
      location: '',
      newLocation: '',
      status: 'available',
      quantity: 1,
      owner: '',
      newOwner: '',
      isPersonalItem: false,
      qrTagged: false,
      internalNote: '',
      project: '',
      newProject: '',
      assetStatus: 'active'
    });
    setShowForm(true);
  };

  const checkPersonalItemsWarning = (selectedIds) => {
    const personalItems = selectedIds.map(id => items.find(i => i.id === id)).filter(i => i && i.owner);
    if (personalItems.length > 0) {
      const ownerNames = [...new Set(personalItems.map(i => i.owner))].join(', ');
      return confirm(`⚠️ คำเตือน: มี "ของส่วนตัว" รวมอยู่ในรายการนี้\n(เจ้าของ: ${ownerNames})\n\nโปรดตรวจสอบให้แน่ใจว่าคุณได้รับอนุญาตจากเจ้าของแล้ว ต้องการดำเนินการยืม/นำออกงานต่อหรือไม่?`);
    }
    return true; 
  };

  const handleBorrow = async () => {
    if (!user || !borrowData.borrower || !borrowData.staff || packingChecklist.length === 0) return;
    
    if (!checkPersonalItemsWarning(packingChecklist)) return; 

    let finalStaff = borrowData.staff;
    try {
      if (borrowData.staff === 'อื่นๆ' && (borrowData.newStaff || '').trim()) {
        finalStaff = borrowData.newStaff.trim();
        const updatedStaff = [...new Set([...(settingsOptions.staff || []).filter(c => c !== 'อื่นๆ'), finalStaff, 'อื่นๆ'])];
        const newSettings = { ...settingsOptions, staff: updatedStaff };
        setSettingsOptions(newSettings);
        await setDoc(getSettingsDoc(), newSettings);
      }
    } catch (e) { console.error("Settings error:", e); }
    
    const borrowedNames = [];

    try {
      if (!requireProofIfNeeded('borrow', borrowProofFiles)) return;
      const uploadedProofs = await uploadProofsOrConfirm(borrowProofFiles, `หลักฐานการยืม • ${borrowData.borrower || ''}`);
      const docDate = new Date().toISOString();
      const docRef = makeDocumentRef('BR');
      const selectedBorrowItems = packingChecklist.map(id => items.find(i => i.id === id)).filter(i => i && i.status === 'available');
      const documentSnapshot = makeBorrowDocumentSnapshot({
        type: 'borrow',
        ref: docRef,
        date: docDate,
        subject: borrowData.borrower,
        staffOut: finalStaff,
        expectedReturn: borrowData.returnDate,
        note: borrowData.note,
        selectedItems: selectedBorrowItems,
        proofs: uploadedProofs
      });
      const newHistoryEntry = { type: 'borrow', date: docDate, documentId: docRef, documentRef: docRef, borrower: borrowData.borrower, expectedReturn: borrowData.returnDate, staffOut: finalStaff, note: borrowData.note, proofs: uploadedProofs, operatorId: currentOperator?.id || null, operatorName: currentOperator?.name || finalStaff || 'Admin' };
      const promises = selectedBorrowItems.map(item => {
        borrowedNames.push(item.name);
        const newHistory = [...(item.history || []), newHistoryEntry];
        return setDoc(getItemDoc(item.id), { status: 'borrowed', currentBorrower: borrowData.borrower, expectedReturn: borrowData.returnDate, currentNote: borrowData.note, history: newHistory }, { merge: true });
      });
      await Promise.all([setDoc(getBorrowDoc(docRef), documentSnapshot, { merge: true }), ...promises]);

      logAction('ให้ยืมอุปกรณ์', `ทำรายการ ${selectedBorrowItems.length} ชิ้น`, `เลขที่เอกสาร: ${docRef}\nยืมโดย: ${borrowData.borrower} (จนท.ผู้ให้ยืม: ${finalStaff})\nรายการ: ${borrowedNames.join(', ')}`);
      setPrintSlipData(documentSnapshot);
      setBorrowTargetIds([]);
      setPackingChecklist([]);
      setSelectedItems([]); 
      setBorrowData({ borrower: '', borrowDate: '', returnDate: '', staff: '', newStaff: '', note: '' });
      setBorrowProofFiles([]);
      alert('✅ บันทึกการยืมเรียบร้อยแล้ว!');
    } catch (error) {
      console.error(error);
      alert(`❌ เกิดข้อผิดพลาดในการทำรายการยืม: ${error.message}`);
    }
  };

  const handleEventOut = async () => {
    if (!user || !eventData.eventName || !eventData.staff || eventChecklist.length === 0) return;

    if (!checkPersonalItemsWarning(eventChecklist)) return;

    let finalStaff = eventData.staff;
    try {
      if (eventData.staff === 'อื่นๆ' && (eventData.newStaff || '').trim()) {
        finalStaff = eventData.newStaff.trim();
        const updatedStaff = [...new Set([...(settingsOptions.staff || []).filter(c => c !== 'อื่นๆ'), finalStaff, 'อื่นๆ'])];
        const newSettings = { ...settingsOptions, staff: updatedStaff };
        setSettingsOptions(newSettings);
        await setDoc(getSettingsDoc(), newSettings);
      }
    } catch (e) { console.error("Settings error:", e); }
    
    const eventNames = [];

    try {
      if (!requireProofIfNeeded('event', eventProofFiles)) return;
      const uploadedProofs = await uploadProofsOrConfirm(eventProofFiles, `หลักฐานออกงาน • ${eventData.eventName || ''}`);
      const docDate = new Date().toISOString();
      const docRef = makeDocumentRef('EV');
      const selectedEventItems = eventChecklist.map(id => items.find(i => i.id === id)).filter(i => i && i.status === 'available');
      const documentSnapshot = makeBorrowDocumentSnapshot({
        type: 'event',
        ref: docRef,
        date: docDate,
        subject: eventData.eventName,
        staffOut: finalStaff,
        expectedReturn: eventData.returnDate,
        note: eventData.note,
        selectedItems: selectedEventItems,
        proofs: uploadedProofs
      });
      const newHistoryEntry = { type: 'event', date: docDate, documentId: docRef, documentRef: docRef, eventName: eventData.eventName, expectedReturn: eventData.returnDate, staffOut: finalStaff, note: eventData.note, proofs: uploadedProofs, operatorId: currentOperator?.id || null, operatorName: currentOperator?.name || finalStaff || 'Admin' };
      const promises = selectedEventItems.map(item => {
        eventNames.push(item.name);
        const newHistory = [...(item.history || []), newHistoryEntry];
        return setDoc(getItemDoc(item.id), { status: 'out-for-event', currentEvent: eventData.eventName, expectedReturn: eventData.returnDate, currentNote: eventData.note, history: newHistory }, { merge: true });
      });
      await Promise.all([setDoc(getBorrowDoc(docRef), documentSnapshot, { merge: true }), ...promises]);

      logAction('นำออกงาน', `ทำรายการ ${selectedEventItems.length} ชิ้น`, `เลขที่เอกสาร: ${docRef}\nชื่องาน: ${eventData.eventName} (ผู้นำออก: ${finalStaff})\nรายการ: ${eventNames.join(', ')}`);
      setPrintSlipData(documentSnapshot);
      setEventTargetIds([]);
      setEventChecklist([]);
      setSelectedItems([]); 
      setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' });
      setEventProofFiles([]);
      alert('✅ บันทึกการนำออกงานเรียบร้อยแล้ว!');
    } catch (error) {
      console.error(error);
      alert(`❌ เกิดข้อผิดพลาดในการนำออกงาน: ${error.message}`);
    }
  };

  const handleReturn = async () => {
    if (!user || !returnData.staff || returnChecklist.length === 0) return;
    let finalStaff = returnData.staff;
    try {
      if (returnData.staff === 'อื่นๆ' && (returnData.newStaff || '').trim()) {
        finalStaff = returnData.newStaff.trim();
        const updatedStaff = [...new Set([...(settingsOptions.staff || []).filter(c => c !== 'อื่นๆ'), finalStaff, 'อื่นๆ'])];
        const newSettings = { ...settingsOptions, staff: updatedStaff };
        setSettingsOptions(newSettings);
        await setDoc(getSettingsDoc(), newSettings);
      }
    } catch (e) { console.error("Settings error:", e); }
    
    const returnedNames = [];

    try {
      if (!requireProofIfNeeded('return', returnProofFiles)) return;
      const uploadedProofs = await uploadProofsOrConfirm(returnProofFiles, `หลักฐานรับคืน • ${finalStaff || ''}`);
      const newHistoryEntry = { type: 'return', date: new Date().toISOString(), staffIn: finalStaff, proofs: uploadedProofs, operatorId: currentOperator?.id || null, operatorName: currentOperator?.name || finalStaff || 'Admin' };
      const promises = returnChecklist.map(id => {
        const item = items.find(i => i.id === id);
        if (!item || (item.status !== 'borrowed' && item.status !== 'out-for-event')) return Promise.resolve();
        returnedNames.push(item.name);
        const inspection = returnInspection[id] || { condition: 'ปกติ', note: '' };
        const itemHistoryEntry = { ...newHistoryEntry, inspection, operatorName: currentAccountLabel };
        const newHistory = [...(item.history || []), itemHistoryEntry];
        const shouldMaintenance = ['มีรอย/ต้องตรวจเพิ่ม', 'ชำรุด', 'คืนไม่ครบ'].includes(inspection.condition);
        return setDoc(getItemDoc(id), {
          status: shouldMaintenance ? 'maintenance' : 'available',
          currentBorrower: null, currentEvent: null, currentNote: null, expectedReturn: null,
          returnCondition: inspection.condition,
          returnNote: inspection.note || '',
          history: newHistory,
          updatedAt: new Date().toISOString(),
          updatedBy: currentAccountLabel
        }, { merge: true });
      });
      await Promise.all(promises);

      const returnedSet = new Set(returnChecklist);
      const activeArchiveDocs = (borrowDocuments || []).filter(doc => {
        const ids = Array.isArray(doc.itemIds) ? doc.itemIds : [];
        const isOpen = !doc.status || doc.status === 'active' || doc.status === 'partial';
        return isOpen && ids.some(id => returnedSet.has(id));
      });
      if (activeArchiveDocs.length > 0) {
        const archiveUpdates = activeArchiveDocs.map(docData => {
          const ids = Array.isArray(docData.itemIds) ? docData.itemIds : [];
          const oldReturned = new Set(Array.isArray(docData.returnedItemIds) ? docData.returnedItemIds : []);
          ids.forEach(id => { if (returnedSet.has(id)) oldReturned.add(id); });
          const returnedItemIds = Array.from(oldReturned);
          const isClosed = ids.length > 0 && returnedItemIds.length >= ids.length;
          return setDoc(getBorrowDoc(docData.id || docData.ref), {
            returnedItemIds,
            status: isClosed ? 'closed' : 'partial',
            statusLabel: isClosed ? 'คืนครบแล้ว' : 'คืนบางส่วน',
            returnedAt: isClosed ? new Date().toISOString() : (docData.returnedAt || null),
            returnStaff: finalStaff,
            lastReturnProofs: uploadedProofs,
            updatedAt: new Date().toISOString(),
            updatedBy: currentAccountLabel
          }, { merge: true });
        });
        await Promise.all(archiveUpdates);
      }

      logAction('รับคืนอุปกรณ์', `ทำรายการ ${returnChecklist.length} ชิ้น`, `จนท.ผู้รับคืน: ${finalStaff}\nรายการ: ${returnedNames.join(', ')}`);

      setReturnTargetIds([]);
      setReturnChecklist([]);
      setSelectedItems([]); 
      setReturnData({ staff: '', newStaff: '' });
      setReturnInspection({});
      setReturnProofFiles([]);
      alert('✅ รับคืนอุปกรณ์เรียบร้อยแล้ว!');
    } catch (error) {
      console.error(error);
      alert(`❌ เกิดข้อผิดพลาดในการรับคืน: ${error.message}`);
    }
  };

  const handleSaveBundle = async () => {
    const bundleName = bundleForm.name || '';
    if (!user || !bundleName.trim() || (bundleForm.itemIds || []).length === 0) {
      return alert('❌ กรุณาใส่ชื่อเซ็ต และเลือกอุปกรณ์อย่างน้อย 1 ชิ้น');
    }
    
    try {
      let newBundles;
      if (bundleForm.id) {
        newBundles = (settingsOptions.bundles || []).map(b => 
          b.id === bundleForm.id ? { ...b, name: bundleName, itemIds: bundleForm.itemIds } : b
        );
      } else {
        newBundles = [...(settingsOptions.bundles || []), { id: Date.now().toString(), name: bundleName, itemIds: bundleForm.itemIds }];
      }
      
      const newSettings = { ...settingsOptions, bundles: newBundles };
      setSettingsOptions(newSettings);
      await setDoc(getSettingsDoc(), newSettings);
      setBundleForm({ id: null, name: '', itemIds: [] });
      setBundleSearchTerm('');
      if (selectedItems.length > 0) setSelectedItems([]);
      alert('✅ บันทึกเซ็ตอุปกรณ์เรียบร้อยแล้ว!');
    } catch (error) {
      console.error(error);
      alert(`❌ บันทึกเซ็ตไม่สำเร็จ: ${error.message}`);
    }
  };

  const handleDeleteBundle = async (bundleId) => {
    if (!user) return;
    if(!confirm('ยืนยันการลบเซ็ตอุปกรณ์นี้? (ไม่ส่งผลกระทบต่ออุปกรณ์จริง)')) return;
    try {
      const newBundles = (settingsOptions.bundles || []).filter(b => b.id !== bundleId);
      const newSettings = { ...settingsOptions, bundles: newBundles };
      setSettingsOptions(newSettings);
      await setDoc(getSettingsDoc(), newSettings);
    } catch (error) {
      console.error(error);
      alert(`❌ ลบเซ็ตไม่สำเร็จ: ${error.message}`);
    }
  };

  const handleSelectBundleToBorrow = (bundle) => {
    try {
      const availableIds = (bundle.itemIds || []).filter(id => items.find(i => i.id === id)?.status === 'available');
      if (availableIds.length === 0) return alert('❌ ไม่สามารถยืมได้: อุปกรณ์ในเซ็ตนี้ถูกใช้งานไปหมดแล้ว');
      
      if (availableIds.length < (bundle.itemIds || []).length) {
        const proceed = confirm(`⚠️ อุปกรณ์ในเซ็ตไม่ครบ!\nมีอุปกรณ์พร้อมใช้เพียง ${availableIds.length} จาก ${(bundle.itemIds || []).length} ชิ้น\nคุณต้องการกดยืมชิ้นที่เหลือเท่าที่มีหรือไม่?`);
        if (!proceed) return;
      }
      
      setBorrowTargetIds([...availableIds]);
      setPackingChecklist([]);
      setBorrowData({ borrower: '', borrowDate: new Date().toISOString().split('T')[0], returnDate: '', staff: '', newStaff: '', note: '' });
      setBorrowProofFiles([]);
      setShowBundleModal(false);
    } catch(err) { alert("Systemขัดข้อง: " + err.message); }
  };

  const handleSelectBundleToEvent = (bundle) => {
    try {
      const availableIds = (bundle.itemIds || []).filter(id => items.find(i => i.id === id)?.status === 'available');
      if (availableIds.length === 0) return alert('❌ ไม่สามารถนำออกงานได้: อุปกรณ์ในเซ็ตนี้ถูกใช้งานไปหมดแล้ว');
      
      if (availableIds.length < (bundle.itemIds || []).length) {
        const proceed = confirm(`⚠️ อุปกรณ์ในเซ็ตไม่ครบ!\nมีอุปกรณ์พร้อมใช้เพียง ${availableIds.length} จาก ${(bundle.itemIds || []).length} ชิ้น\nคุณต้องการกดนำออกชิ้นที่เหลือเท่าที่มีหรือไม่?`);
        if (!proceed) return;
      }
      
      setEventTargetIds([...availableIds]);
      setEventChecklist([]);
      setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' });
      setEventProofFiles([]);
      setShowBundleModal(false);
    } catch(err) { alert("Systemขัดข้อง: " + err.message); }
  };

  const handleSelectBundleToReturn = (bundle) => {
    try {
      const outIds = (bundle.itemIds || []).filter(id => {
        const st = items.find(i => i.id === id)?.status;
        return st === 'borrowed' || st === 'out-for-event';
      });
      if (outIds.length === 0) return alert('❌ ไม่มีอุปกรณ์ในเซ็ตนี้ที่รอรับคืน');
      
      setReturnTargetIds([...outIds]);
      setReturnChecklist([]);
      setReturnData({ staff: '', newStaff: '' });
      setShowBundleModal(false);
    } catch(err) { alert("Systemขัดข้อง: " + err.message); }
  };

  const openItemEditor = (item) => {
    if (!item) return;
    setFormData({ ...item, qrTagged: !!item.qrTagged, newCategory: '', newLocation: '', newProject: '', newOwner: item.owner || '', isPersonalItem: !!item.owner, assetStatus: item.assetStatus || 'active' });
    setShowForm(true);
  };

  const openSelectionScanner = ({ camera = false, workbenchMode = 'multi' } = {}) => {
    setScanMode('select');
    setQrWorkbenchMode(workbenchMode);
    setUseCamera(camera);
    setShowScanModal(true);
    setActiveWorkspace('qrWorkbench');
  };

  const openChecklistScanner = (mode) => {
    setScanMode(mode);
    setUseCamera(true);
    setShowScanModal(true);
    setActiveWorkspace('qrWorkbench');
  };

  const getScanModeInfo = () => {
    if (scanMode === 'borrowChecklist') return { title: 'สแกนเช็กก่อนปล่อยยืม', desc: 'สแกน QR ของอุปกรณ์ในรายการยืม เพื่อเช็กแทนการติ๊กเอง', tone: 'purple' };
    if (scanMode === 'eventChecklist') return { title: 'สแกนเช็กของขึ้นงาน', desc: 'สแกน QR ของอุปกรณ์ในรายการออกงาน เพื่อเช็กแทนการติ๊กเอง', tone: 'orange' };
    if (scanMode === 'returnChecklist') return { title: 'สแกนเช็กตอนรับคืน', desc: 'สแกน QR ของอุปกรณ์ที่นำมาคืน เพื่อเช็กแทนการติ๊กเอง', tone: 'emerald' };
    return { title: 'โหมดสแกน QR', desc: 'สแกน QR เพื่อเลือกอุปกรณ์ แล้วกดดูรายละเอียดหรือแก้ไขได้ทันที', tone: 'amber' };
  };

  const handleOpenBatchBorrow = () => {
    try {
      const validIds = selectedItems.filter(id => items.find(i => i.id === id)?.status === 'available');
      if (validIds.length === 0) return alert('❌ ไม่มีอุปกรณ์ที่พร้อมให้ยืมในรายการที่คุณเลือก\n(อุปกรณ์ต้องมีสถานะ "พร้อมใช้")');
      setBorrowData({ borrower: '', borrowDate: new Date().toISOString().split('T')[0], returnDate: '', staff: '', newStaff: '', note: '' });
      
      setBorrowTargetIds([...validIds]);
      setPackingChecklist([]);
    } catch(err) { alert("Systemขัดข้อง: " + err.message); }
  };

  const handleOpenBatchEvent = () => {
    try {
      const validIds = selectedItems.filter(id => items.find(i => i.id === id)?.status === 'available');
      if (validIds.length === 0) return alert('❌ ไม่มีอุปกรณ์ที่พร้อมออกงานในรายการที่คุณเลือก\n(อุปกรณ์ต้องมีสถานะ "พร้อมใช้")');
      setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' });
      
      setEventTargetIds([...validIds]);
      setEventChecklist([]);
    } catch(err) { alert("Systemขัดข้อง: " + err.message); }
  };

  const handleOpenBatchReturn = () => {
    try {
      const validIds = selectedItems.filter(id => {
        const st = items.find(i => i.id === id)?.status;
        return st === 'borrowed' || st === 'out-for-event';
      });
      if (validIds.length === 0) return alert('❌ ไม่มีอุปกรณ์ที่สามารถคืนได้ในรายการที่คุณเลือก\n(อุปกรณ์ต้องมีสถานะ "ถูกยืม" หรือ "ออกงาน")');
      setReturnData({ staff: '', newStaff: '' });
      
      setReturnTargetIds([...validIds]);
      setReturnChecklist([]);
    } catch(err) { alert("Systemขัดข้อง: " + err.message); }
  };



  const openReturnForItems = (ids = []) => {
    const validIds = Array.from(new Set((ids || []).filter(id => {
      const st = items.find(i => i.id === id)?.status;
      return st === 'borrowed' || st === 'out-for-event';
    })));
    if (validIds.length === 0) return alert('❌ ไม่มีอุปกรณ์ที่สามารถรับคืนได้');
    setReturnData({ staff: '', newStaff: '' });
    setReturnTargetIds(validIds);
    setReturnChecklist([]);
    setReturnProofFiles([]);
  };

  const handleCreateBundleFromSelection = () => {
    if (selectedItems.length === 0) return;
    setBundleForm({ id: null, name: '', itemIds: [...selectedItems] });
    setBundleSearchTerm('');
    setShowBundleManager(true);
  };

  const handleProcessScan = (scannedVal) => {
    const val = String(scannedVal || '').trim();
    if (!val) return;
    if (scanCooldownRef.current) return;
    scanCooldownRef.current = true;
    window.setTimeout(() => { scanCooldownRef.current = false; }, 950);

    const currentItems = itemsRefForScan.current || [];
    const foundItem = currentItems.find(i => i.id === val || (i.sn && i.sn.toLowerCase() === val.toLowerCase()));

    if (foundItem) {
      setLastScannedItemId(foundItem.id);
      const markChecklist = (targetIds, currentChecklist, setChecklist, label) => {
        if (!targetIds.includes(foundItem.id)) {
          setScanMessage({ text: `⚠️ "${foundItem.name}" ไม่ได้อยู่ในเช็กลิสต์${label}`, type: 'error' });
          try { if (navigator?.vibrate) navigator.vibrate([70, 45, 70]); } catch(e){}
          try { new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3').play(); } catch(e){}
          return;
        }
        if (currentChecklist.includes(foundItem.id)) {
          setScanMessage({ text: `✅ "${foundItem.name}" เช็กไว้แล้ว ไม่ต้องสแกนซ้ำ`, type: 'success' });
          try { if (navigator?.vibrate) navigator.vibrate(50); } catch(e){}
          return;
        }
        const nextCount = Math.min(targetIds.length, currentChecklist.length + 1);
        const isComplete = nextCount >= targetIds.length;
        setChecklist(prev => prev.includes(foundItem.id) ? prev : [...prev, foundItem.id]);
        setScanMessage({
          text: isComplete ? `🎉 เช็กครบแล้ว พร้อมยืนยันรายการ` : `✅ เช็ก "${foundItem.name}" แล้ว (${nextCount}/${targetIds.length})`,
          type: 'success'
        });
        try { if (navigator?.vibrate) navigator.vibrate(isComplete ? [90, 40, 120] : 90); } catch(e){}
        try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}
      };

      if (scanMode === 'borrowChecklist') {
        markChecklist(borrowTargetIds, packingChecklist, setPackingChecklist, 'ก่อนปล่อยยืม');
      } else if (scanMode === 'eventChecklist') {
        markChecklist(eventTargetIds, eventChecklist, setEventChecklist, 'ออกงาน');
      } else if (scanMode === 'returnChecklist') {
        markChecklist(returnTargetIds, returnChecklist, setReturnChecklist, 'รับคืน');
      } else {
        if (qrWorkbenchMode === 'single') {
          setScanMessage({ text: `✅ พบ "${foundItem.name}" พร้อมจัดการทันที`, type: 'success' });
        } else {
          setSelectedItems(prev => prev.includes(foundItem.id) ? prev : [...prev, foundItem.id]);
          setScanMessage({ text: `✅ พบ "${foundItem.name}" เลือกไว้แล้ว`, type: 'success' });
        }
        try { if (navigator?.vibrate) navigator.vibrate(90); } catch(e){}
        try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}
      }
    } else {
      setScanMessage({ text: `❌ ไม่พบรหัส "${val}" ในSystem`, type: 'error' });
      try { if (navigator?.vibrate) navigator.vibrate([60, 40, 60]); } catch(e){}
      try { new Audio('https://assets.mixkit.co/active_storage/sfx/2955/2955-preview.mp3').play(); } catch(e){}
    }

    setScanInput('');
    setTimeout(() => setScanMessage({ text: '', type: '' }), 3400);
  };

  const handleScanSubmit = (e) => {
    e.preventDefault();
    handleProcessScan(scanInput);
  };

  useEffect(() => {
    let scanner = null;
    if (showScanModal && useCamera && isScannerLoaded) {
      scanner = new window.Html5QrcodeScanner(
        "qr-reader",
        {
          fps: 12,
          rememberLastUsedCamera: true,
          aspectRatio: 1.0,
          disableFlip: false,
          videoConstraints: { facingMode: "environment" },
          qrbox: (viewfinderWidth, viewfinderHeight) => {
            const minEdge = Math.min(viewfinderWidth || 320, viewfinderHeight || 320);
            const size = Math.max(220, Math.min(360, Math.floor(minEdge * 0.72)));
            return { width: size, height: size };
          }
        },
        false
      );
      scanner.render(
        (decodedText) => {
          handleProcessScan(decodedText);
          if (scanner) {
            try { scanner.pause(true); } catch(e) {}
            setTimeout(() => {
              try { scanner.resume(); } catch(e) {}
            }, 2000);
          }
        },
        (err) => { /* ซ่อน error ตอนที่กล้องกำลังหาโฟกัส */ }
      );
    }
    return () => {
      if (scanner) {
        scanner.clear().catch(console.error);
      }
    };
  }, [showScanModal, useCamera, isScannerLoaded]);

  // 💡 กลับมาแล้ว: Systemนำเข้าไฟล์ CSV
  const handleImportCSV = (e) => {
    if (!user) return;
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const csvData = event.target.result;
        const rows = csvData.split('\n').map(row => row.trim()).filter(row => row);
        if (rows.length < 2) return alert('ไฟล์ว่างเปล่า หรือรูปแบบข้อมูลไม่ถูกต้อง');
        
        let importedCount = 0;
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',').map(c => c.trim());
          if (cols.length >= 1) {
            const name = cols[0];
            if (!name) continue;
            
            const newId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            const itemData = {
              name: name, sn: cols[1] || '', category: cols[2] || 'อื่นๆ',
              department: cols[3] || 'ภาพนิ่ง', location: cols[4] || 'อื่นๆ',
              quantity: Number(cols[5]) || 1, status: 'available', owner: '',
              updatedAt: new Date().toISOString(), history: []
            };
            
            await setDoc(getItemDoc(newId), itemData);
            importedCount++;
          }
        }
        
        logAction('นำเข้าข้อมูล (Import)', `เพิ่มข้อมูล ${importedCount} ชิ้น`, `นำเข้าจากไฟล์: ${file.name}`);
        alert(`✅ นำเข้าข้อมูลสำเร็จทั้งหมด ${importedCount} รายการ!`);
        e.target.value = null; 
      } catch (err) {
        console.error(err);
        alert(`เกิดข้อผิดพลาดในการอ่านไฟล์: ${err.message}`);
      }
    };
    reader.readAsText(file);
  };

  const handleSaveSetting = async () => {
    const newSetting = newSettingItem || '';
    if (!user || !newSetting.trim()) return;
    const key = settingsTab;
    let newOptions = [...(settingsOptions[key] || [])];
    let oldName = editingSettingItem;
    let newName = newSetting.trim();

    if (oldName !== null) {
      const index = newOptions.indexOf(oldName);
      if (index > -1) newOptions[index] = newName;
    } else {
      newOptions = newOptions.filter(item => item !== 'อื่นๆ');
      newOptions.push(newName);
      newOptions.push('อื่นๆ');
    }
    newOptions = [...new Set(newOptions)];
    const updatedSettings = { ...settingsOptions, [key]: newOptions };
    setSettingsOptions(updatedSettings);
    
    try {
      await setDoc(getSettingsDoc(), updatedSettings);
      if (oldName && oldName !== newName && (key === 'categories' || key === 'locations')) {
        items.forEach(async (item) => {
          let updateData = {};
          if (key === 'categories' && item.category === oldName) updateData.category = newName;
          if (key === 'locations' && item.location === oldName) updateData.location = newName;
          if (Object.keys(updateData).length > 0) {
            await setDoc(getItemDoc(item.id), updateData, { merge: true });
          }
        });
      }
      setNewSettingItem('');
      setEditingSettingItem(null);
    } catch (error) {
      console.error(error);
      alert(`❌ บันทึกตั้งค่าไม่สำเร็จ: ${error.message}`);
    }
  };

  const handleDeleteSetting = async () => {
    if (!user || deleteSettingConfirm === null) return;
    try {
      const key = settingsTab;
      const newOptions = (settingsOptions[key] || []).filter(item => item !== deleteSettingConfirm);
      const updatedSettings = { ...settingsOptions, [key]: newOptions };
      setSettingsOptions(updatedSettings);
      await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), updatedSettings);
    } catch (error) {
      console.error("Error deleting setting:", error);
    } finally {
      setDeleteSettingConfirm(null);
    }
  };

  const getBackupFileTag = () => new Date().toISOString().split('T')[0];

  const formatBackupDateTime = (value) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleString('th-TH', { year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
  };

  const backupSafeText = (value) => {
    if (value === null || value === undefined) return '';
    if (typeof value === 'object') return JSON.stringify(value);
    return String(value);
  };

  const backupFormatBytes = (bytes) => {
    const n = Number(bytes) || 0;
    if (n < 1024) return n + ' B';
    if (n < 1024 * 1024) return (n / 1024).toFixed(1) + ' KB';
    if (n < 1024 * 1024 * 1024) return (n / 1024 / 1024).toFixed(2) + ' MB';
    return (n / 1024 / 1024 / 1024).toFixed(2) + ' GB';
  };

  const backupHtmlEscape = (value) => backupSafeText(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');

  const backupCsvEscape = (value) => {
    const text = backupSafeText(value);
    const newline = String.fromCharCode(10);
    const carriageReturn = String.fromCharCode(13);
    const mustQuote = text.includes(',') || text.includes('"') || text.includes(newline) || text.includes(carriageReturn);
    const escaped = text.replaceAll('"', '""');
    return mustQuote ? '"' + escaped + '"' : escaped;
  };

  const backupDownloadTextFile = (filename, content, mimeType = 'text/plain;charset=utf-8;') => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const backupDownloadCSV = (filename, headers, rows) => {
    const newline = String.fromCharCode(10);
    const bom = String.fromCharCode(0xfeff);
    const csv = [headers, ...rows].map(row => row.map(backupCsvEscape).join(',')).join(newline);
    backupDownloadTextFile(filename, bom + csv, 'text/csv;charset=utf-8;');
  };

  const backupDownloadMultipleFiles = (files = []) => {
    files.filter(Boolean).forEach((file, index) => {
      setTimeout(() => {
        backupDownloadTextFile(file.filename, file.content, file.mimeType);
      }, index * 450);
    });
  };

  const getBackupStatusLabel = (statusId) => STATUSES.find(s => s.id === statusId)?.label || statusId || '-';

  const saveBackupTimestamp = async (type) => {
    try {
      const now = new Date().toISOString();
      const backupMeta = { ...(settingsOptions.backupMeta || {}), [type]: now, latest: now };
      const newSettings = { ...settingsOptions, backupMeta };
      setSettingsOptions(newSettings);
      await setDoc(getSettingsDoc(), newSettings, { merge: true });
    } catch (e) {
      console.warn('Backup timestamp save failed:', e);
    }
  };

  const exportHistoryCSV = async () => {
    const { headers, rows } = buildHistoryCsvRows();
    backupDownloadCSV('MDEC_Borrow_Return_History_' + getBackupFileTag() + '.csv', headers, rows);
    await logAction('สำรองประวัติยืม-คืน CSV', 'ส่งออก ' + rows.length + ' รายการประวัติ', 'ดาวน์โหลดประวัติการยืม-คืนพร้อมวันเวลาเป็นไฟล์ CSV');
    await saveBackupTimestamp('historyCsv');
    if (rows.length === 0) alert('ℹ️ ดาวน์โหลดไฟล์แล้ว แต่ยังไม่มีประวัติยืม-คืนในSystem');
  };

  const exportItemHistoryCSV = (item) => {
    if (!item) return;
    const headers = ['ชื่ออุปกรณ์', 'รหัส S.N.', 'ลำดับ', 'ประเภท', 'วันเวลาทำรายการ', 'ผู้ทำรายการในSystem', 'ผู้ยืม/ชื่องาน', 'เจ้าหน้าที่ผู้ให้ยืม/ผู้นำออก', 'เจ้าหน้าที่ผู้รับคืน', 'กำหนดคืน', 'หมายเหตุ', 'จำนวนหลักฐาน', 'ลิงก์หลักฐาน'];
    const rows = (Array.isArray(item.history) ? item.history : []).map((h, index) => {
      const historyType = h.type === 'borrow' ? 'ยืมออก' : h.type === 'event' ? 'ออกงาน' : h.type === 'return' ? 'รับคืน' : (h.type || '-');
      return [item.name || '-', item.sn || '-', index + 1, historyType, formatBackupDateTime(h.date), h.operatorName || h.performedBy || '-', h.borrower || h.eventName || '-', h.staffOut || '-', h.staffIn || '-', h.expectedReturn || '-', h.note || '-', Array.isArray(h.proofs) ? h.proofs.length : 0, Array.isArray(h.proofs) ? h.proofs.map(p => p.storageType === 'firestore-doc-base64' ? (p.originalName || p.id || 'รูปในSystem') : (p.url || p.id || '-')).join(' | ') : '-' ];
    });
    backupDownloadCSV(`MDEC_Item_History_${(item.sn || item.id || 'item').replace(/[^a-zA-Z0-9_-]/g, '_')}_${getBackupFileTag()}.csv`, headers, rows);
    if (rows.length === 0) pushToast('ดาวน์โหลดไฟล์แล้ว แต่ยังไม่มีประวัติของอุปกรณ์นี้', 'warning');
    else pushToast('ดาวน์โหลดประวัติอุปกรณ์นี้เรียบร้อยแล้ว', 'success');
  };

  const collectFullBackupPayload = async () => {
    let latestAuditLogs = [];
    try {
      const auditSnapshot = await getDocs(getAuditCol());
      auditSnapshot.forEach((docSnap) => latestAuditLogs.push({ id: docSnap.id, ...docSnap.data() }));
      latestAuditLogs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
    } catch (auditError) {
      console.warn('Audit backup warning:', auditError);
      latestAuditLogs = auditLogs;
    }

    let proofDocs = [];
    try {
      const proofSnapshot = await getDocs(getProofsCol());
      proofSnapshot.forEach((docSnap) => proofDocs.push({ id: docSnap.id, ...docSnap.data() }));
    } catch (proofError) {
      console.warn('Proof backup warning:', proofError);
      proofDocs = [];
    }

    const proofBytes = proofDocs.reduce((sum, p) => sum + (Number(p.sizeBytes) || 0) + (Number(p.thumbBytes) || 0), 0);
    const historyCount = items.reduce((sum, item) => sum + (Array.isArray(item.history) ? item.history.length : 0), 0);
    const historyProofCount = items.reduce((sum, item) => sum + (Array.isArray(item.history) ? item.history.reduce((s, h) => s + (Array.isArray(h.proofs) ? h.proofs.length : 0), 0) : 0), 0);

    const payload = {
      appName: 'MDEC-Stock',
      backupType: 'full-system-backup',
      backupVersion: 2,
      exportedAt: new Date().toISOString(),
      exportedAtTH: new Date().toLocaleString('th-TH', { hour12: false }),
      appVersion: APP_VERSION,
      summary: {
        totalItems: items.length,
        activeItems: items.filter(i => !i.isDeleted).length,
        totalHistoryEntries: historyCount,
        totalProofImages: proofDocs.length,
        totalHistoryProofLinks: historyProofCount,
        estimatedProofBytes: proofBytes,
        totalAuditLogs: latestAuditLogs.length,
        totalBorrowDocuments: (borrowDocuments || []).length,
        totalBundles: (settingsOptions.bundles || []).length,
        totalCategories: (settingsOptions.categories || []).length,
        totalLocations: (settingsOptions.locations || []).length,
        totalProjects: projectStats.length,
        totalStaff: (settingsOptions.staff || []).length,
        totalAccounts: (settingsOptions.accounts || []).length
      },
      settings: settingsOptions,
      items: items,
      auditLogs: latestAuditLogs,
      borrowDocuments: borrowDocuments || [],
      proofs: proofDocs
    };

    return { payload, latestAuditLogs, proofDocs, proofBytes, historyCount, historyProofCount };
  };

  const buildInventoryCsvRows = () => {
    const headers = ['รหัสอุปกรณ์', 'ชื่ออุปกรณ์', 'S.N.', 'ฝ่าย', 'หมวดหมู่', 'ห้อง/สถานที่', 'กล่องเก็บของ', 'โครงการ', 'สถานะใช้งาน', 'สถานะพัสดุ', 'จำนวน', 'เจ้าของ/ของส่วนตัว', 'ติด QR แล้ว', 'จำนวนประวัติ', 'จำนวนรูปหลักฐาน', 'ผู้ยืม/งานปัจจุบัน', 'กำหนดคืน', 'หมายเหตุภายใน', 'อัปเดตล่าสุด'];
    const rows = items.map(item => {
      const historyList = Array.isArray(item.history) ? item.history : [];
      const proofCount = historyList.reduce((sum, h) => sum + (Array.isArray(h.proofs) ? h.proofs.length : 0), 0);
      return [
        item.id || '-',
        item.name || '-',
        item.sn || '-',
        item.department || '-',
        item.category || '-',
        item.location || '-',
        item.storageBoxName || '-',
        item.project || 'ไม่ระบุโครงการ',
        getBackupStatusLabel(item.status),
        getAssetStatusInfo(item.assetStatus).label,
        item.quantity || 1,
        item.owner || '-',
        item.qrTagged ? 'ติดแล้ว' : 'ยังไม่ติด',
        historyList.length,
        proofCount,
        item.currentBorrower || item.currentEvent || '-',
        item.expectedReturn || '-',
        item.internalNote || '-',
        formatBackupDateTime(item.updatedAt)
      ];
    });
    return { headers, rows };
  };

  const buildHistoryCsvRows = () => {
    const headers = ['รหัสเอกสารอุปกรณ์', 'ชื่ออุปกรณ์', 'รหัส S.N.', 'ฝ่าย', 'หมวดหมู่', 'สถานที่', 'โครงการ', 'สถานะพัสดุ', 'ลำดับประวัติ', 'ประเภทประวัติ', 'วันเวลาทำรายการ', 'ผู้ทำรายการในSystem', 'ผู้ยืม/ชื่องาน', 'เจ้าหน้าที่ผู้ให้ยืม/ผู้นำออก', 'เจ้าหน้าที่ผู้รับคืน', 'กำหนดคืน', 'หมายเหตุ', 'จำนวนหลักฐาน', 'รหัส/ชื่อหลักฐาน', 'สถานะปัจจุบัน'];
    const rows = [];
    items.forEach(item => {
      const historyList = Array.isArray(item.history) ? item.history : [];
      historyList.forEach((h, index) => {
        const historyType = h.type === 'borrow' ? 'ยืมออก' : h.type === 'event' ? 'ออกงาน' : h.type === 'return' ? 'รับคืน' : h.type === 'projectChange' ? 'เปลี่ยนโครงการ' : (h.type || '-');
        rows.push([
          item.id || '-',
          item.name || '-',
          item.sn || '-',
          item.department || '-',
          item.category || '-',
          item.location || '-',
          item.project || 'ไม่ระบุโครงการ',
          getAssetStatusInfo(item.assetStatus).label,
          index + 1,
          historyType,
          formatBackupDateTime(h.date),
          h.operatorName || h.performedBy || h.staff || '-',
          h.borrower || h.eventName || `${h.fromProject || ''}${h.toProject ? ' → ' + h.toProject : ''}` || '-',
          h.staffOut || '-',
          h.staffIn || '-',
          h.expectedReturn || '-',
          h.note || '-',
          Array.isArray(h.proofs) ? h.proofs.length : 0,
          Array.isArray(h.proofs) ? h.proofs.map(p => p.proofDocId || p.id || p.originalName || 'รูปในSystem').join(' | ') : '-',
          getBackupStatusLabel(item.status)
        ]);
      });
    });
    return { headers, rows };
  };

  const buildProjectsCsvRows = () => {
    const headers = ['โครงการ', 'ทั้งหมด', 'ใช้งานอยู่', 'จำหน่ายแล้ว', 'สูญหาย', 'ชำรุดรอจำหน่าย', 'รายการอุปกรณ์'];
    const rows = projectStats.map(project => [
      project.name || 'ไม่ระบุโครงการ',
      project.total || 0,
      project.active || 0,
      project.disposed || 0,
      project.lost || 0,
      project.pending_disposal || 0,
      (project.items || []).map(i => `${i.name || '-'} (${i.sn || '-'})`).join(' | ')
    ]);
    return { headers, rows };
  };

  const getProofGroupsForBackup = (proofDocs = []) => {
    const proofMap = new Map((proofDocs || []).map(p => [String(p.id || p.proofDocId), p]));
    const groups = new Map();

    items.forEach(item => {
      (Array.isArray(item.history) ? item.history : []).forEach((h, historyIndex) => {
        (Array.isArray(h.proofs) ? h.proofs : []).forEach((proofRef, proofIndex) => {
          const key = String(proofRef.proofDocId || proofRef.id || `${item.id}_${historyIndex}_${proofIndex}`);
          const proofDoc = proofMap.get(key) || proofRef || {};
          if (!groups.has(key)) {
            groups.set(key, {
              id: key,
              proof: { ...proofRef, ...proofDoc },
              entries: [],
              itemKeys: new Set()
            });
          }
          const group = groups.get(key);
          const itemKey = item.id || item.sn || item.name || `${historyIndex}_${proofIndex}`;
          if (!group.itemKeys.has(itemKey)) {
            group.itemKeys.add(itemKey);
            group.entries.push({
              itemId: item.id,
              itemName: item.name || '-',
              sn: item.sn || '-',
              category: item.category || '-',
              location: item.location || '-',
              project: item.project || 'ไม่ระบุโครงการ',
              historyType: h.type || '-',
              subject: h.borrower || h.eventName || h.note || '-',
              staff: h.staffOut || h.staffIn || h.staff || h.operatorName || h.performedBy || '-',
              date: h.date || proofDoc.createdAt || proofRef.createdAt || ''
            });
          }
        });
      });
    });

    return Array.from(groups.values()).sort((a, b) => new Date(b.proof.createdAt || b.entries[0]?.date || 0) - new Date(a.proof.createdAt || a.entries[0]?.date || 0));
  };

  const buildProofIndexCsvRows = (proofDocs = []) => {
    const groups = getProofGroupsForBackup(proofDocs);
    const headers = ['รหัสรูปหลักฐาน', 'ชื่อไฟล์', 'ประเภท/บริบท', 'วันที่รูป', 'ผู้บันทึก', 'ตำแหน่ง/พิกัด', 'ขนาด', 'เกี่ยวข้องกับกี่อุปกรณ์', 'อุปกรณ์ที่เกี่ยวข้อง', 'โครงการที่เกี่ยวข้อง', 'หมายเหตุ'];
    const rows = groups.map(group => {
      const proof = group.proof || {};
      return [
        group.id,
        proof.originalName || '-',
        proof.contextLabel || '-',
        proof.timestampText || formatBackupDateTime(proof.createdAt),
        proof.createdBy || '-',
        proof.locationText || '-',
        proof.sizeText || backupFormatBytes((Number(proof.sizeBytes) || 0) + (Number(proof.thumbBytes) || 0)),
        group.entries.length,
        group.entries.map(e => `${e.itemName} (${e.sn})`).join(' | '),
        [...new Set(group.entries.map(e => e.project || 'ไม่ระบุโครงการ'))].join(' | '),
        proof.note || '-'
      ];
    });
    return { headers, rows };
  };

  const buildProofGalleryHTML = (proofDocs = []) => {
    const groups = getProofGroupsForBackup(proofDocs);
    const cards = groups.map(group => {
      const proof = group.proof || {};
      const imgSrc = proof.dataUrl || proof.url || proof.thumbUrl || '';
      const type = backupHtmlEscape(proof.contextLabel || 'หลักฐานรูปภาพ');
      const created = backupHtmlEscape(proof.timestampText || formatBackupDateTime(proof.createdAt));
      const by = backupHtmlEscape(proof.createdBy || '-');
      const note = backupHtmlEscape(proof.note || '');
      const location = backupHtmlEscape(proof.locationText || '');
      const itemsHtml = group.entries.map(entry => `
        <li>
          <b>${backupHtmlEscape(entry.itemName)}</b>
          <span>S.N. ${backupHtmlEscape(entry.sn)} • ${backupHtmlEscape(entry.location)} • ${backupHtmlEscape(entry.project)}</span>
        </li>
      `).join('');
      return `
        <article class="card">
          <div class="photoWrap">
            ${imgSrc ? `<img src="${imgSrc}" alt="${type}">` : `<div class="noPhoto">ไม่มีรูปในไฟล์สำรอง</div>`}
          </div>
          <div class="meta">
            <div class="badge">${type}</div>
            <h2>${backupHtmlEscape(group.entries[0]?.subject || proof.originalName || 'หลักฐาน')}</h2>
            <p><b>เวลา:</b> ${created}</p>
            <p><b>ผู้บันทึก:</b> ${by}</p>
            ${location ? `<p><b>สถานที่:</b> ${location}</p>` : ''}
            ${note ? `<p><b>หมายเหตุ:</b> ${note}</p>` : ''}
            <p><b>เกี่ยวข้องกับ:</b> ${group.entries.length} อุปกรณ์/รายการ</p>
            <ul>${itemsHtml}</ul>
          </div>
        </article>
      `;
    }).join('');

    return `<!doctype html>
<html lang="th">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>MDEC Proof Gallery ${backupHtmlEscape(getBackupFileTag())}</title>
<style>
  :root { --bg:#f1f5f9; --card:#ffffff; --text:#0f172a; --muted:#64748b; --blue:#2563eb; --pink:#db2777; }
  * { box-sizing:border-box; }
  body { margin:0; font-family: Arial, "Tahoma", sans-serif; background:var(--bg); color:var(--text); }
  header { position:sticky; top:0; z-index:10; background:linear-gradient(135deg,#0f172a,#1e40af); color:white; padding:20px; box-shadow:0 10px 30px rgba(15,23,42,.18); }
  header h1 { margin:0; font-size:24px; font-weight:900; }
  header p { margin:6px 0 0; color:#dbeafe; font-weight:700; }
  .summary { display:grid; grid-template-columns:repeat(auto-fit,minmax(180px,1fr)); gap:12px; padding:18px; }
  .summary div { background:var(--card); border:1px solid #e2e8f0; border-radius:18px; padding:16px; box-shadow:0 8px 20px rgba(15,23,42,.06); }
  .summary b { display:block; font-size:24px; color:var(--blue); }
  .grid { display:grid; grid-template-columns:repeat(auto-fit,minmax(320px,1fr)); gap:18px; padding:0 18px 24px; }
  .card { background:var(--card); border:1px solid #e2e8f0; border-radius:24px; overflow:hidden; box-shadow:0 10px 30px rgba(15,23,42,.08); }
  .photoWrap { height:300px; background:
    linear-gradient(45deg,rgba(148,163,184,.18) 25%,transparent 25%,transparent 75%,rgba(148,163,184,.18) 75%),
    linear-gradient(45deg,rgba(148,163,184,.18) 25%,transparent 25%,transparent 75%,rgba(148,163,184,.18) 75%);
    background-size:20px 20px; background-position:0 0,10px 10px; display:flex; align-items:center; justify-content:center; }
  .photoWrap img { max-width:100%; max-height:100%; object-fit:contain; display:block; }
  .noPhoto { color:var(--muted); font-weight:900; }
  .meta { padding:16px; }
  .badge { display:inline-block; background:#fce7f3; color:#be185d; border:1px solid #fbcfe8; border-radius:999px; padding:5px 10px; font-size:12px; font-weight:900; }
  h2 { margin:10px 0; font-size:18px; line-height:1.25; }
  p { margin:6px 0; color:#334155; font-size:14px; }
  ul { margin:10px 0 0; padding-left:18px; }
  li { margin:6px 0; }
  li span { display:block; color:var(--muted); font-size:12px; margin-top:2px; }
  footer { padding:18px; color:var(--muted); text-align:center; font-weight:700; }
  @media print { header { position:static; } .card { break-inside:avoid; } .photoWrap { height:220px; } }
</style>
</head>
<body>
<header>
  <h1>MDEC Proof Gallery / คลังรูปหลักฐาน</h1>
  <p>ส่งออกเมื่อ ${backupHtmlEscape(new Date().toLocaleString('th-TH', { hour12:false }))} • เปิดไฟล์นี้ด้วย Chrome/Edge ได้ทันที ไม่ต้องเข้าเว็บ</p>
</header>
<section class="summary">
  <div><b>${groups.length.toLocaleString('th-TH')}</b>รูปหลักฐานจริง</div>
  <div><b>${groups.reduce((sum,g)=>sum+g.entries.length,0).toLocaleString('th-TH')}</b>จุดเชื่อมโยงกับอุปกรณ์</div>
  <div><b>${items.length.toLocaleString('th-TH')}</b>อุปกรณ์ในSystem</div>
</section>
<main class="grid">${cards || '<div class="card"><div class="meta"><h2>ยังไม่มีรูปหลักฐาน</h2></div></div>'}</main>
<footer>MDEC-Stock Backup Gallery • ${backupHtmlEscape(APP_VERSION)}</footer>
</body>
</html>`;
  };

  const buildOneStopBackupFiles = async () => {
    const collected = await collectFullBackupPayload();
    const tag = getBackupFileTag();
    const inventory = buildInventoryCsvRows();
    const history = buildHistoryCsvRows();
    const projects = buildProjectsCsvRows();
    const proofIndex = buildProofIndexCsvRows(collected.proofDocs);
    const galleryHtml = buildProofGalleryHTML(collected.proofDocs);

    const makeCsvContent = (headers, rows) => {
      const newline = String.fromCharCode(10);
      const bom = String.fromCharCode(0xfeff);
      return bom + [headers, ...rows].map(row => row.map(backupCsvEscape).join(',')).join(newline);
    };

    const files = [
      {
        filename: `MDEC_FULL_BACKUP_${tag}.json`,
        content: JSON.stringify(collected.payload, null, 2),
        mimeType: 'application/json;charset=utf-8;'
      },
      {
        filename: `MDEC_INVENTORY_FOR_GOOGLE_SHEETS_${tag}.csv`,
        content: makeCsvContent(inventory.headers, inventory.rows),
        mimeType: 'text/csv;charset=utf-8;'
      },
      {
        filename: `MDEC_HISTORY_FOR_GOOGLE_SHEETS_${tag}.csv`,
        content: makeCsvContent(history.headers, history.rows),
        mimeType: 'text/csv;charset=utf-8;'
      },
      {
        filename: `MDEC_PROJECTS_FOR_GOOGLE_SHEETS_${tag}.csv`,
        content: makeCsvContent(projects.headers, projects.rows),
        mimeType: 'text/csv;charset=utf-8;'
      },
      {
        filename: `MDEC_PROOF_INDEX_FOR_GOOGLE_SHEETS_${tag}.csv`,
        content: makeCsvContent(proofIndex.headers, proofIndex.rows),
        mimeType: 'text/csv;charset=utf-8;'
      },
      {
        filename: `MDEC_PROOF_GALLERY_${tag}.html`,
        content: galleryHtml,
        mimeType: 'text/html;charset=utf-8;'
      }
    ];
    return { ...collected, files, counts: { inventory: inventory.rows.length, history: history.rows.length, projects: projects.rows.length, proofIndex: proofIndex.rows.length } };
  };

  const exportFullBackupJSON = async () => {
    try {
      const collected = await collectFullBackupPayload();
      backupDownloadTextFile('MDEC_Full_Backup_' + getBackupFileTag() + '.json', JSON.stringify(collected.payload, null, 2), 'application/json;charset=utf-8;');
      await logAction('สำรองข้อมูลทั้งหมด JSON', 'สำรอง ' + items.length + ' อุปกรณ์ / ' + collected.historyCount + ' ประวัติ', 'ดาวน์โหลดข้อมูลทั้งSystemเป็นไฟล์ JSON รวมประวัติยืม-คืนและรูปหลักฐาน');
      await saveBackupTimestamp('fullJson');
      alert('✅ สำรองข้อมูลทั้งหมดเรียบร้อยแล้ว! ไฟล์ JSON นี้ใช้สำหรับกู้คืนSystem และมีรูปหลักฐานที่เก็บในSystemรวมอยู่ด้วย');
    } catch (error) {
      console.error(error);
      alert('❌ สำรองข้อมูลทั้งหมดไม่สำเร็จ: ' + error.message);
    }
  };

  const exportProofGalleryHTML = async () => {
    try {
      const collected = await collectFullBackupPayload();
      backupDownloadTextFile('MDEC_PROOF_GALLERY_' + getBackupFileTag() + '.html', buildProofGalleryHTML(collected.proofDocs), 'text/html;charset=utf-8;');
      await logAction('สำรองรูปหลักฐาน HTML', 'ส่งออกคลังรูปหลักฐาน ' + collected.proofDocs.length + ' รูป', 'ดาวน์โหลดไฟล์ HTML สำหรับเปิดดูรูปหลักฐานได้ทันที');
      await saveBackupTimestamp('proofHtml');
      pushToast('ดาวน์โหลดคลังรูปหลักฐาน HTML แล้ว', 'success');
    } catch (error) {
      console.error(error);
      alert('❌ สำรองรูปหลักฐาน HTML ไม่สำเร็จ: ' + error.message);
    }
  };

  const exportSheetsCSVPack = async () => {
    try {
      const collected = await collectFullBackupPayload();
      const tag = getBackupFileTag();
      const inventory = buildInventoryCsvRows();
      const history = buildHistoryCsvRows();
      const projects = buildProjectsCsvRows();
      const proofIndex = buildProofIndexCsvRows(collected.proofDocs);
      backupDownloadCSV(`MDEC_INVENTORY_FOR_GOOGLE_SHEETS_${tag}.csv`, inventory.headers, inventory.rows);
      setTimeout(() => backupDownloadCSV(`MDEC_HISTORY_FOR_GOOGLE_SHEETS_${tag}.csv`, history.headers, history.rows), 450);
      setTimeout(() => backupDownloadCSV(`MDEC_PROJECTS_FOR_GOOGLE_SHEETS_${tag}.csv`, projects.headers, projects.rows), 900);
      setTimeout(() => backupDownloadCSV(`MDEC_PROOF_INDEX_FOR_GOOGLE_SHEETS_${tag}.csv`, proofIndex.headers, proofIndex.rows), 1350);
      await logAction('สำรอง CSV สำหรับ Google Sheets', 'ส่งออกตาราง Inventory/History/Projects/Proof Index', 'CSV เปิดใน Google Sheets ได้ แต่ไม่ได้เก็บรูปจริง');
      await saveBackupTimestamp('sheetsCsv');
      pushToast('ดาวน์โหลดชุด CSV สำหรับ Google Sheets แล้ว', 'success');
    } catch (error) {
      console.error(error);
      alert('❌ สำรอง CSV ไม่สำเร็จ: ' + error.message);
    }
  };

  const exportOneStopBackupSet = async () => {
    try {
      setIsBusy(true);
      const backup = await buildOneStopBackupFiles();
      backupDownloadMultipleFiles(backup.files);
      await logAction('สำรองข้อมูลครบชุด', `JSON + CSV + HTML Gallery / ${backup.payload.summary.totalItems} อุปกรณ์ / ${backup.proofDocs.length} รูป`, 'ดาวน์โหลดชุดสำรองข้อมูลประจำปีแบบครบชุด');
      await saveBackupTimestamp('oneStop');
      alert(
        '✅ เริ่มดาวน์โหลดชุดสำรองข้อมูลครบแล้ว\\n\\n' +
        'ควรมีไฟล์ทั้งหมด 6 ไฟล์:\\n' +
        '1) JSON สำหรับกู้คืนSystem\\n' +
        '2) Inventory CSV สำหรับ Google Sheets\\n' +
        '3) History CSV สำหรับ Google Sheets\\n' +
        '4) Projects CSV สำหรับ Google Sheets\\n' +
        '5) Proof Index CSV สำหรับ Google Sheets\\n' +
        '6) Proof Gallery HTML สำหรับเปิดดูรูปหลักฐาน\\n\\n' +
        'ถ้าเบราว์เซอร์ถาม ให้กดอนุญาตดาวน์โหลดหลายไฟล์'
      );
    } catch (error) {
      console.error(error);
      alert('❌ สำรองข้อมูลครบชุดไม่สำเร็จ: ' + error.message);
    } finally {
      setIsBusy(false);
    }
  };

  const handleRestoreBackupJSON = (e) => {
    if (!user) return;
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = JSON.parse(String(event.target.result || '{}'));
        if (!data || !Array.isArray(data.items)) {
          alert('❌ ไฟล์ JSON ไม่ถูกต้อง: ไม่พบรายการอุปกรณ์');
          return;
        }

        const warning = confirm(
          '⚠️ กู้คืนข้อมูลจาก JSON\n\n' +
          'โหมดนี้จะเขียนทับข้อมูลอุปกรณ์ที่มี ID ตรงกัน และเพิ่มอุปกรณ์ที่ยังไม่มี\n' +
          'Systemจะไม่ลบอุปกรณ์ที่ไม่ได้อยู่ในไฟล์สำรอง เพื่อความปลอดภัย\n\n' +
          'ต้องการดำเนินการต่อหรือไม่?'
        );
        if (!warning) return;

        const confirmText = prompt('พิมพ์ RESTORE เพื่อยืนยันการกู้คืนข้อมูลจากไฟล์ JSON');
        if (confirmText !== 'RESTORE') {
          alert('ยกเลิกการกู้คืน เนื่องจากไม่ได้พิมพ์ RESTORE ให้ถูกต้อง');
          return;
        }

        if (data.settings && typeof data.settings === 'object') {
          await setDoc(getSettingsDoc(), data.settings, { merge: true });
        }

        let restoredProofCount = 0;
        if (Array.isArray(data.proofs)) {
          for (const proof of data.proofs) {
            if (!proof || !proof.id) continue;
            const proofId = proof.id;
            const proofData = { ...proof };
            delete proofData.id;
            await setDoc(getProofDoc(proofId), proofData, { merge: true });
            restoredProofCount++;
          }
        }

        let restoredCount = 0;
        for (const item of data.items) {
          if (!item || !item.id) continue;
          const itemId = item.id;
          const itemData = { ...item };
          delete itemData.id;
          await setDoc(getItemDoc(itemId), itemData, { merge: true });
          restoredCount++;
        }

        await logAction('กู้คืนข้อมูลจาก JSON', 'กู้คืน ' + restoredCount + ' อุปกรณ์ / ' + restoredProofCount + ' รูปหลักฐาน', 'กู้คืนแบบปลอดภัย: เขียนทับ/เพิ่มข้อมูลจากไฟล์ JSON โดยไม่ลบอุปกรณ์ที่ไม่มีในไฟล์');
        await saveBackupTimestamp('restoreJson');
        alert('✅ กู้คืนข้อมูลจาก JSON เรียบร้อยแล้ว ' + restoredCount + ' รายการ และรูปหลักฐาน ' + restoredProofCount + ' รูป\nSystemไม่ได้ลบอุปกรณ์ที่ไม่มีในไฟล์สำรอง');
      } catch (error) {
        console.error(error);
        alert('❌ กู้คืนข้อมูลไม่สำเร็จ: ' + error.message);
      } finally {
        e.target.value = null;
      }
    };
    reader.readAsText(file);
  };

  const clearAllBorrowReturnHistory = async () => {
    if (!user) return;

    const historyCount = items.reduce((sum, item) => {
      return sum + (Array.isArray(item.history) ? item.history.length : 0);
    }, 0);

    if (historyCount === 0) {
      alert('ℹ️ ตอนนี้ยังไม่มีประวัติยืม-คืนให้ล้าง');
      return;
    }

    const backupFirst = confirm(
      '⚠️ ก่อนล้างประวัติยืม-คืนทั้งหมด\n\n' +
      'แนะนำให้กดสำรองข้อมูลทั้งหมด JSON และประวัติยืม-คืน CSV เก็บไว้ก่อน\n\n' +
      'คุณสำรองข้อมูลเรียบร้อยแล้ว และต้องการดำเนินการต่อหรือไม่?'
    );
    if (!backupFirst) return;

    const confirmText = prompt(
      'เพื่อป้องกันการกดพลาด กรุณาพิมพ์คำว่า CLEAR เพื่อยืนยันการล้างประวัติยืม-คืนทั้งหมด\n\n' +
      'Systemจะล้างเฉพาะ history ของอุปกรณ์ทุกชิ้น\n' +
      'ไม่ลบรายการอุปกรณ์ ไม่ลบสถานะปัจจุบัน ไม่ลบหมวดหมู่ สถานที่ หรือเจ้าของ'
    );

    if (confirmText !== 'CLEAR') {
      alert('ยกเลิกการล้างประวัติ เนื่องจากไม่ได้พิมพ์ CLEAR ให้ถูกต้อง');
      return;
    }

    try {
      const promises = items.map((item) => {
        return setDoc(getItemDoc(item.id), { history: [] }, { merge: true });
      });

      await Promise.all(promises);

      await logAction(
        'ล้างประวัติยืม-คืนทั้งหมด',
        'ล้างประวัติ ' + historyCount + ' รายการ',
        'ล้างเฉพาะ history ของอุปกรณ์ทุกชิ้น โดยไม่ลบรายการอุปกรณ์หลักและไม่เปลี่ยนสถานะปัจจุบัน'
      );

      alert('✅ ล้างประวัติยืม-คืนทั้งหมดเรียบร้อยแล้ว\nรายการอุปกรณ์หลักและสถานะปัจจุบันยังอยู่เหมือนเดิม');
    } catch (error) {
      console.error(error);
      alert('❌ ล้างประวัติยืม-คืนไม่สำเร็จ: ' + error.message);
    }
  };

  const exportToCSV = () => {
    const headers = ['ชื่ออุปกรณ์', 'รหัส S.N.', 'ฝ่าย', 'หมวดหมู่', 'สถานที่', 'กล่องเก็บของ', 'สถานะ', 'จำนวน', 'ผู้ยืมปัจจุบัน/ชื่องาน', 'สถานะ QR', 'เจ้าของ', 'หมายเหตุภายใน', 'อัปเดตล่าสุด'];
    const csvData = items.map(i => [
      i.name, i.sn || '-', i.department, i.category || '-', i.location || '-', i.storageBoxName || '-',
      STATUSES.find(s=>s.id===i.status)?.label || i.status, i.quantity || 1, i.currentBorrower || i.currentEvent || '-', i.qrTagged ? 'ติด QR แล้ว' : 'ยังไม่ติด QR', i.owner || '-', i.internalNote || '-', new Date(i.updatedAt).toLocaleDateString('th-TH')
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...csvData].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `MDEC_Stock_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
  };

  const handleLogin = () => {
    const usernameInput = String(loginUsername || '').trim().toLowerCase();
    const pinInput = String(pin || '').trim();
    const effectiveAccounts = getEffectiveAccounts();
    const foundAccount = effectiveAccounts.find(acc => {
      return acc && acc.active !== false &&
        String(acc.username || '').trim().toLowerCase() === usernameInput &&
        String(acc.pin || '') === pinInput;
    });

    // รองรับรหัสเดิมไว้ก่อน: ถ้าพิมพ์ PIN เดิมโดยไม่กรอก username จะเข้าด้วยบัญชีกลาง
    const legacyCentral = !foundAccount && !usernameInput && pinInput === ADMIN_PIN
      ? { id: 'central_admin', name: 'บัญชีกลาง', username: 'admin', role: 'owner', active: true }
      : null;

    const loginAccount = foundAccount || legacyCentral;
    if (loginAccount) {
      const safeAccount = {
        id: loginAccount.id,
        name: loginAccount.name || loginAccount.username || 'ผู้ใช้งาน',
        username: loginAccount.username || 'admin',
        role: loginAccount.role || 'staff'
      };
      setCurrentOperator(safeAccount);
      setIsAdmin(true);
      try {
        localStorage.setItem('mdec_admin', 'true');
        localStorage.setItem('mdec_operator', JSON.stringify(safeAccount));
      } catch(e) {}
      setShowLogin(false);
      setPin('');
      setLoginUsername(safeAccount.username || 'admin');
      logAction('เข้าสู่System', safeAccount.name, `เข้าสู่Systemด้วยบัญชี ${safeAccount.username}`);
    } else {
      alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      setPin('');
    }
  };

  const handleLogout = () => {
    const logoutName = currentOperator?.name || 'Admin';
    logAction('ออกจากSystem', logoutName, 'ออกจากSystemจัดการ');
    setIsAdmin(false);
    setCurrentOperator(null);
    setSelectedItems([]);
    try {
      localStorage.removeItem('mdec_admin');
      localStorage.removeItem('mdec_operator');
    } catch(e) {}
  };

  const handleLockScreen = () => {
    const lockName = currentOperator?.name || 'Admin';
    logAction('ล็อกหน้าจอ', lockName, 'ล็อกหน้าจอเพื่อกันคนอื่นใช้งานต่อ');
    setIsAdmin(false);
    setCurrentOperator(null);
    setSelectedItems([]);
    setPin('');
    setShowLogin(true);
    try {
      localStorage.removeItem('mdec_admin');
      localStorage.removeItem('mdec_operator');
    } catch(e) {}
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    let timeoutId;
    const resetTimer = () => {
      window.clearTimeout(timeoutId);
      timeoutId = window.setTimeout(() => {
        alert('⏱️ SystemออกจากSystemอัตโนมัติ เพราะไม่มีการใช้งานนานเกิน 2 ชั่วโมง');
        handleLogout();
      }, INACTIVITY_LOGOUT_MS);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    events.forEach(evt => window.addEventListener(evt, resetTimer, { passive: true }));
    resetTimer();
    return () => {
      window.clearTimeout(timeoutId);
      events.forEach(evt => window.removeEventListener(evt, resetTimer));
    };
  }, [isLoggedIn, currentOperator?.id]);


  const markSelectedQrTagged = async () => {
    if (!user || selectedItems.length === 0) return;
    const ok = confirm('บันทึกว่าอุปกรณ์ที่เลือก ' + selectedItems.length + ' รายการ ติด QR แล้วหรือไม่?');
    if (!ok) return;
    try {
      await Promise.all(selectedItems.map((id) => setDoc(getItemDoc(id), { qrTagged: true, qrTaggedAt: new Date().toISOString() }, { merge: true })));
      await logAction('อัปเดตสถานะ QR', 'ติด QR แล้ว ' + selectedItems.length + ' รายการ', 'บันทึกสถานะติด QR จากหน้าพิมพ์สติ๊กเกอร์');
      alert('✅ บันทึกสถานะติด QR แล้ว');
    } catch (error) {
      console.error(error);
      alert('❌ บันทึกสถานะ QR ไม่สำเร็จ: ' + error.message);
    }
  };


  const saveSelectedAsStorageBox = async () => {
    if (!user) return;
    if (selectedItems.length === 0) return alert('❌ กรุณาเลือกอุปกรณ์ก่อนบันทึกเป็นกล่องเก็บของ');
    const boxName = String(boxLabelTitle || '').trim();
    if (!boxName) return alert('❌ กรุณาระบุชื่อกล่องเก็บของ');
    const ok = confirm('บันทึกอุปกรณ์ที่เลือก ' + selectedItems.length + ' รายการ ให้อยู่ใน "' + boxName + '" หรือไม่?\n\nหลังบันทึกแล้วให้ไปพิมพ์ฉลากจากหน้า “กล่องเก็บของ” เพื่อให้ฉลากตรงกับข้อมูลกล่องล่าสุด');
    if (!ok) return;
    try {
      const now = new Date().toISOString();
      const existingBoxes = settingsOptions.storageBoxes || [];
      const existing = existingBoxes.find((box) => String(box.name || '').trim().toLowerCase() === boxName.toLowerCase());
      const boxId = existing?.id || `box_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const itemIds = [...new Set(selectedItems)];
      const newBox = {
        id: boxId,
        name: boxName,
        note: boxLabelNote || existing?.note || '',
        size: boxLabelSize || existing?.size || 'normal',
        itemIds,
        createdAt: existing?.createdAt || now,
        updatedAt: now
      };
      const newBoxes = [...existingBoxes.filter((box) => box.id !== boxId), newBox].sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th', { numeric: true }));
      const newSettings = { ...settingsOptions, storageBoxes: newBoxes };
      setSettingsOptions(newSettings);
      await setDoc(getSettingsDoc(), newSettings);
      await Promise.all(itemIds.map((id) => setDoc(getItemDoc(id), { storageBoxId: boxId, storageBoxName: boxName, storageBoxUpdatedAt: now }, { merge: true })));
      await logAction('บันทึกกล่องเก็บของ', boxName, 'บันทึกอุปกรณ์ ' + itemIds.length + ' รายการเข้ากล่อง');
      setShowStorageBoxAssignModal(false);
      setShowStorageBoxesModal(true);
      alert('✅ บันทึกกล่องเก็บของเรียบร้อยแล้ว\nหากต้องการพิมพ์ฉลาก ให้กดปุ่ม “พิมพ์ฉลาก” จากหน้ากล่องเก็บของ');
    } catch (error) {
      console.error(error);
      alert('❌ บันทึกกล่องเก็บของไม่สำเร็จ: ' + error.message);
    }
  };

  const openStorageBoxEditor = (box = null) => {
    const selectedFromTable = selectedItems.length > 0 ? [...selectedItems] : [];
    setStorageBoxForm({
      id: box?.id || null,
      name: box?.name || '',
      note: box?.note || '',
      size: box?.size || 'normal',
      itemIds: box?.itemIds ? [...box.itemIds] : selectedFromTable
    });
    setStorageBoxSearchTerm('');
    setShowStorageBoxesModal(false);
    setShowStorageBoxAssignModal(false);
    setShowStorageBoxEditor(true);
  };

  const handleSaveStorageBoxEditor = async () => {
    if (!user) return;
    const boxName = String(storageBoxForm.name || '').trim();
    if (!boxName) return alert('❌ กรุณาระบุชื่อกล่องเก็บของ');
    const itemIds = [...new Set(storageBoxForm.itemIds || [])].filter((id) => items.some((item) => item.id === id));
    if (itemIds.length === 0) return alert('❌ กรุณาเลือกอุปกรณ์อย่างน้อย 1 ชิ้นเข้ากล่อง');

    try {
      const now = new Date().toISOString();
      const existingBoxes = settingsOptions.storageBoxes || [];
      const oldBox = storageBoxForm.id ? existingBoxes.find((box) => box.id === storageBoxForm.id) : null;
      const sameNameBox = existingBoxes.find((box) => box.id !== storageBoxForm.id && String(box.name || '').trim().toLowerCase() === boxName.toLowerCase());
      if (sameNameBox) return alert('❌ มีกล่องชื่อนี้อยู่แล้ว กรุณาใช้ชื่ออื่น หรือเปิดแก้ไขกล่องเดิม');

      const boxId = storageBoxForm.id || `box_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const removedIds = [...new Set([...(oldBox?.itemIds || [])])].filter((id) => !itemIds.includes(id));
      const newBox = {
        id: boxId,
        name: boxName,
        note: storageBoxForm.note || '',
        size: storageBoxForm.size || 'normal',
        itemIds,
        createdAt: oldBox?.createdAt || now,
        updatedAt: now
      };

      // ถ้าอุปกรณ์ถูกย้ายเข้ากล่องนี้ ให้นำออกจากกล่องอื่นด้วย เพื่อไม่ให้ซ้ำกันหลายกล่อง
      const otherBoxes = existingBoxes
        .filter((box) => box.id !== boxId)
        .map((box) => ({ ...box, itemIds: (box.itemIds || []).filter((id) => !itemIds.includes(id)) }));
      const newBoxes = [...otherBoxes, newBox]
        .sort((a, b) => String(a.name || '').localeCompare(String(b.name || ''), 'th', { numeric: true }));

      const newSettings = { ...settingsOptions, storageBoxes: newBoxes };
      setSettingsOptions(newSettings);
      await setDoc(getSettingsDoc(), newSettings);

      await Promise.all(itemIds.map((id) => setDoc(getItemDoc(id), {
        storageBoxId: boxId,
        storageBoxName: boxName,
        storageBoxUpdatedAt: now
      }, { merge: true })));

      await Promise.all(removedIds.map((id) => setDoc(getItemDoc(id), {
        storageBoxId: null,
        storageBoxName: null,
        storageBoxUpdatedAt: now
      }, { merge: true })));

      await logAction(storageBoxForm.id ? 'แก้ไขกล่องเก็บของ' : 'สร้างกล่องเก็บของ', boxName, `บันทึกอุปกรณ์ ${itemIds.length} รายการในกล่อง${removedIds.length ? ` และนำออก ${removedIds.length} รายการ` : ''}`);
      setShowStorageBoxEditor(false);
      setShowStorageBoxesModal(true);
      alert('✅ บันทึกกล่องเก็บของเรียบร้อยแล้ว');
    } catch (error) {
      console.error(error);
      alert('❌ บันทึกกล่องไม่สำเร็จ: ' + error.message);
    }
  };

  const openStorageBoxLabel = (box) => {
    const ids = (box.itemIds || []).filter((id) => items.some((item) => item.id === id));
    if (ids.length === 0) return alert('❌ กล่องนี้ยังไม่มีอุปกรณ์ หรืออุปกรณ์ถูกลบไปแล้ว');
    setSelectedItems(ids);
    setBoxLabelTitle(box.name || 'กล่องอุปกรณ์ MDEC');
    setBoxLabelNote(box.note || '');
    setBoxLabelSize(box.size || 'normal');
    setShowStorageBoxesModal(false);
    setShowBoxLabelPrintModal(true);
  };

  const selectStorageBoxItems = (box) => {
    const ids = (box.itemIds || []).filter((id) => items.some((item) => item.id === id));
    setSelectedItems(ids);
    setShowStorageBoxesModal(false);
  };

  const openPrepAssignFromSelection = () => {
    if (selectedItems.length === 0) return alert('❌ กรุณาเลือกอุปกรณ์ก่อนสร้างรายการเตรียมของ');
    setPrepForm({
      id: null,
      name: '',
      useDate: '',
      staff: '',
      note: '',
      itemIds: [...new Set(selectedItems)],
      checkedIds: [],
      status: 'pending'
    });
    setShowPrepAssignModal(true);
  };

  const savePrepLists = async (newPrepLists, actionLabel = '', targetName = '', details = '') => {
    const newSettings = { ...settingsOptions, prepLists: newPrepLists };
    setSettingsOptions(newSettings);
    await setDoc(getSettingsDoc(), newSettings);
    if (actionLabel) await logAction(actionLabel, targetName || 'รายการเตรียมของ', details);
  };

  const handleSavePrepList = async () => {
    if (!user) return;
    const prepName = String(prepForm.name || '').trim();
    if (!prepName) return alert('❌ กรุณาระบุชื่องาน / ชื่อรายการเตรียมของ');
    if (!prepForm.useDate) return alert('❌ กรุณาเลือกวันที่ใช้งาน');
    const itemIds = [...new Set(prepForm.itemIds || [])].filter((id) => items.some((item) => item.id === id));
    if (itemIds.length === 0) return alert('❌ กรุณาเลือกอุปกรณ์อย่างน้อย 1 ชิ้น');

    try {
      const now = new Date().toISOString();
      const existingLists = settingsOptions.prepLists || [];
      const prepId = prepForm.id || `prep_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
      const oldPrep = existingLists.find((prep) => prep.id === prepId);
      const newPrep = {
        id: prepId,
        name: prepName,
        useDate: prepForm.useDate,
        staff: prepForm.staff || '',
        note: prepForm.note || '',
        itemIds,
        checkedIds: (prepForm.checkedIds || []).filter((id) => itemIds.includes(id)),
        status: oldPrep?.status || 'pending',
        createdAt: oldPrep?.createdAt || now,
        updatedAt: now
      };
      const newPrepLists = [...existingLists.filter((prep) => prep.id !== prepId), newPrep]
        .sort((a, b) => String(a.useDate || '').localeCompare(String(b.useDate || '')) || String(a.name || '').localeCompare(String(b.name || ''), 'th', { numeric: true }));
      await savePrepLists(newPrepLists, prepForm.id ? 'แก้ไขรายการเตรียมของ' : 'สร้างรายการเตรียมของ', prepName, `บันทึกอุปกรณ์ ${itemIds.length} รายการ วันที่ใช้งาน ${prepForm.useDate}`);
      setShowPrepAssignModal(false);
      setShowPrepListsModal(true);
      setSelectedItems([]);
      alert('✅ บันทึกรายการเตรียมของเรียบร้อยแล้ว\nสถานะอุปกรณ์ยังไม่ถูกเปลี่ยน จนกว่าจะกด “ยืนยันนำออกงาน”');
    } catch (error) {
      console.error(error);
      alert('❌ บันทึกรายการเตรียมของไม่สำเร็จ: ' + error.message);
    }
  };

  const updatePrepCheckedIds = async (prep, checkedIds) => {
    if (!user || !prep?.id) return;
    try {
      const newPrepLists = (settingsOptions.prepLists || []).map((item) =>
        item.id === prep.id ? { ...item, checkedIds: [...new Set(checkedIds)], updatedAt: new Date().toISOString() } : item
      );
      await savePrepLists(newPrepLists);
    } catch (error) {
      console.error(error);
      alert('❌ อัปเดตเช็กลิสต์ไม่สำเร็จ: ' + error.message);
    }
  };

  const togglePrepChecklistItem = async (prep, itemId) => {
    const current = prep.checkedIds || [];
    const next = current.includes(itemId) ? current.filter((id) => id !== itemId) : [...current, itemId];
    await updatePrepCheckedIds(prep, next);
  };

  const toggleAllPrepChecklist = async (prep) => {
    const itemIds = (prep.itemIds || []).filter((id) => items.some((item) => item.id === id));
    const checkedIds = prep.checkedIds || [];
    const allChecked = itemIds.length > 0 && itemIds.every((id) => checkedIds.includes(id));
    await updatePrepCheckedIds(prep, allChecked ? [] : itemIds);
  };

  const openPrepEditor = (prep = null) => {
    if (prep) {
      setPrepForm({
        id: prep.id,
        name: prep.name || '',
        useDate: prep.useDate || '',
        staff: prep.staff || '',
        note: prep.note || '',
        itemIds: [...(prep.itemIds || [])],
        checkedIds: [...(prep.checkedIds || [])],
        status: prep.status || 'pending'
      });
    } else {
      setPrepForm({ id: null, name: '', useDate: '', staff: '', note: '', itemIds: [...new Set(selectedItems)], checkedIds: [], status: 'pending' });
    }
    setShowPrepListsModal(false);
    setShowPrepAssignModal(true);
  };

  const openPrepPrint = (prep) => {
    const prepItems = (prep.itemIds || []).map((id) => items.find((item) => item.id === id)).filter(Boolean);
    if (prepItems.length === 0) return alert('❌ รายการเตรียมของนี้ยังไม่มีอุปกรณ์ที่พิมพ์ได้');
    setPrintSlipData({
      type: 'prep',
      title: 'ใบเตรียมของ',
      ref: makeDocumentRef('PREP'),
      date: new Date().toISOString(),
      borrower: prep.name || '-',
      staffOut: prep.staff || '-',
      expectedReturn: prep.useDate || '',
      note: prep.note || '',
      items: prepItems.map((i) => ({
        id: i.id,
        name: i.name,
        sn: i.sn,
        category: i.category,
        storageBoxName: i.storageBoxName,
        internalNote: i.internalNote,
        checked: (prep.checkedIds || []).includes(i.id)
      }))
    });
    setShowPrepListsModal(false);
  };

  const startPrepAsEvent = (prep) => {
    const prepItems = (prep.itemIds || []).map((id) => items.find((item) => item.id === id)).filter(Boolean);
    const availableIds = prepItems.filter((item) => item.status === 'available').map((item) => item.id);
    const unavailableItems = prepItems.filter((item) => item.status !== 'available');
    if (availableIds.length === 0) return alert('❌ ยังนำออกงานไม่ได้ เพราะอุปกรณ์ในรายการนี้ไม่มีชิ้นที่พร้อมใช้');
    if (unavailableItems.length > 0) {
      const proceed = confirm(`⚠️ มีอุปกรณ์บางชิ้นไม่พร้อมใช้ ${unavailableItems.length} รายการ\n\n${unavailableItems.map((item) => '- ' + item.name).slice(0, 8).join('\n')}\n\nต้องการนำออกเฉพาะชิ้นที่พร้อมใช้หรือไม่?`);
      if (!proceed) return;
    }
    setEventTargetIds([...availableIds]);
    setEventChecklist([]);
    setEventData({
      eventName: prep.name || '',
      returnDate: '',
      staff: prep.staff || '',
      newStaff: '',
      note: prep.note ? `จากรายการเตรียมของ: ${prep.note}` : 'จากรายการเตรียมของ'
    });
    setShowPrepListsModal(false);
  };

  const cancelPrepList = async (prep) => {
    if (!user || !prep?.id) return;
    const ok = confirm('ยกเลิกรายการเตรียมของ "' + (prep.name || '-') + '" หรือไม่?\n\nรายการนี้จะยังถูกเก็บไว้แต่สถานะจะเป็น “ยกเลิก”');
    if (!ok) return;
    try {
      const newPrepLists = (settingsOptions.prepLists || []).map((item) =>
        item.id === prep.id ? { ...item, status: 'cancelled', updatedAt: new Date().toISOString() } : item
      );
      await savePrepLists(newPrepLists, 'ยกเลิกรายการเตรียมของ', prep.name || '-', 'เปลี่ยนสถานะเป็นยกเลิก');
    } catch (error) {
      console.error(error);
      alert('❌ ยกเลิกรายการไม่สำเร็จ: ' + error.message);
    }
  };

  const deletePrepList = async (prep) => {
    if (!user || !prep?.id) return;
    const ok = confirm('ลบรายการเตรียมของ "' + (prep.name || '-') + '" ออกจากSystemหรือไม่?\n\nการลบนี้ไม่กระทบสถานะอุปกรณ์');
    if (!ok) return;
    try {
      const newPrepLists = (settingsOptions.prepLists || []).filter((item) => item.id !== prep.id);
      await savePrepLists(newPrepLists, 'ลบรายการเตรียมของ', prep.name || '-', 'ลบรายการเตรียมของ โดยไม่กระทบอุปกรณ์');
      alert('✅ ลบรายการเตรียมของแล้ว');
    } catch (error) {
      console.error(error);
      alert('❌ ลบรายการไม่สำเร็จ: ' + error.message);
    }
  };

  const deleteStorageBox = async (box) => {
    if (!user || !box?.id) return;
    const ok = confirm('ลบข้อมูลกล่อง "' + (box.name || '-') + '" หรือไม่?\n\nSystemจะนำชื่อกล่องออกจากอุปกรณ์ในกล่องนี้ แต่จะไม่ลบรายการอุปกรณ์');
    if (!ok) return;
    try {
      const newBoxes = (settingsOptions.storageBoxes || []).filter((b) => b.id !== box.id);
      const newSettings = { ...settingsOptions, storageBoxes: newBoxes };
      setSettingsOptions(newSettings);
      await setDoc(getSettingsDoc(), newSettings);
      const affectedItems = items.filter((item) => item.storageBoxId === box.id || (box.itemIds || []).includes(item.id));
      await Promise.all(affectedItems.map((item) => setDoc(getItemDoc(item.id), { storageBoxId: null, storageBoxName: null, storageBoxUpdatedAt: new Date().toISOString() }, { merge: true })));
      await logAction('ลบกล่องเก็บของ', box.name || '-', 'นำชื่อกล่องออกจากอุปกรณ์ ' + affectedItems.length + ' รายการ โดยไม่ลบอุปกรณ์');
      alert('✅ ลบกล่องเก็บของแล้ว รายการอุปกรณ์ยังอยู่ครบ');
    } catch (error) {
      console.error(error);
      alert('❌ ลบกล่องไม่สำเร็จ: ' + error.message);
    }
  };

  if (showBoxLabelPrintModal) {
    const selectedLabelItems = selectedItems.map((id) => items.find((i) => i.id === id)).filter(Boolean);
    const boxLabelSizePresets = {
      small: {
        label: 'เล็ก',
        desc: 'กล่องเล็ก / ถุงอุปกรณ์',
        outerStyle: { width: '92mm', minHeight: '58mm' },
        title: 'text-[18px] print:text-[14pt]',
        titleLong: 'text-[16px] print:text-[12pt]',
        meta: 'text-[10px] print:text-[7pt]',
        itemText: 'text-[11px] print:text-[7.5pt]',
        gridClass: 'grid-cols-1',
        maxPreviewHeight: 'max-h-[190px]',
        bodyPadding: 'p-3 print:p-2',
        qr: 'w-14 h-14 print:w-11 print:h-11',
        qrServer: 120
      },
      normal: {
        label: 'ปกติ',
        desc: 'กล่องอุปกรณ์ทั่วไป',
        outerStyle: { width: '128mm', minHeight: '82mm' },
        title: 'text-[26px] print:text-[20pt]',
        titleLong: 'text-[22px] print:text-[17pt]',
        meta: 'text-[12px] print:text-[8.5pt]',
        itemText: 'text-[13px] print:text-[9pt]',
        gridClass: 'grid-cols-1 sm:grid-cols-2',
        maxPreviewHeight: 'max-h-[285px]',
        bodyPadding: 'p-4 print:p-3',
        qr: 'w-16 h-16 print:w-13 print:h-13',
        qrServer: 150
      },
      large: {
        label: 'ใหญ่',
        desc: 'กล่องใหญ่ / ลังเก็บของ',
        outerStyle: { width: '172mm', minHeight: '112mm' },
        title: 'text-[34px] print:text-[26pt]',
        titleLong: 'text-[28px] print:text-[22pt]',
        meta: 'text-[13px] print:text-[9.5pt]',
        itemText: 'text-[15px] print:text-[10pt]',
        gridClass: 'grid-cols-1 sm:grid-cols-2',
        maxPreviewHeight: 'max-h-[410px]',
        bodyPadding: 'p-5 print:p-4',
        qr: 'w-20 h-20 print:w-16 print:h-16',
        qrServer: 180
      }
    };
    const boxPreset = boxLabelSizePresets[boxLabelSize] || boxLabelSizePresets.normal;
    const isInkMode = boxLabelStyle === 'ink';
    const titleText = boxLabelTitle || 'กล่องอุปกรณ์ MDEC';
    const titleClass = titleText.length > 28 ? boxPreset.titleLong : boxPreset.title;
    const boxQrData = encodeURIComponent(`MDEC-BOX|${titleText}|${selectedLabelItems.map(i => i.id || i.sn || i.name).join(',')}`);
    const groupedByCategory = selectedLabelItems
      .slice()
      .sort((a, b) => String(a.category || '').localeCompare(String(b.category || ''), 'th', { numeric: true }) || String(a.name || '').localeCompare(String(b.name || ''), 'th', { numeric: true }))
      .reduce((acc, item) => {
        const key = item.category || 'ไม่ระบุหมวดหมู่';
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
        return acc;
      }, {});

    return (
      <div className="bg-slate-100 min-h-screen font-sans text-black print:bg-white">
        <style>{`
          .thai-keep {
            word-break: keep-all;
            overflow-wrap: normal;
            line-break: strict;
          }
          .thai-soft {
            word-break: keep-all;
            overflow-wrap: anywhere;
            line-break: strict;
          }
          @media print {
            @page { size: A4; margin: 8mm; }
            body { background: white !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .box-label-toolbar, .box-label-controls { display: none !important; }
            .box-label-page { padding: 0 !important; }
            .box-storage-label { box-shadow: none !important; break-inside: avoid; page-break-inside: avoid; }
            .box-item-card { break-inside: avoid; page-break-inside: avoid; }
          }
        `}</style>

        <div className="box-label-toolbar print:hidden p-4 bg-slate-950 text-white flex flex-col xl:flex-row justify-between items-center fixed top-0 w-full z-50 shadow-md gap-3">
          <div>
            <h2 className="font-black text-xl flex items-center gap-2">
              <Icons.Folder className="w-6 h-6" /> พิมพ์ฉลากกล่องเก็บของ ({selectedLabelItems.length} รายการ)
            </h2>
            <p className="text-slate-300 text-sm font-bold mt-1">
              ตัวอย่างนี้คือฉลากที่จะพิมพ์จริง เลือกขนาด/โหมดได้จากแถบนี้ ส่วนช่องเช็กและ QR เป็นตัวเลือกเสริม
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex bg-slate-800 p-1 rounded-xl gap-1">
              {Object.entries(boxLabelSizePresets).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBoxLabelSize(key)}
                  className={`px-4 py-2 rounded-lg font-black transition-colors ${boxLabelSize === key ? 'bg-white text-slate-900 shadow' : 'text-slate-200 hover:bg-slate-700'}`}
                  title={preset.desc}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <div className="flex bg-slate-800 p-1 rounded-xl gap-1">
              <button type="button" onClick={() => setBoxLabelStyle('premium')} className={`px-4 py-2 rounded-lg font-black transition-colors ${boxLabelStyle === 'premium' ? 'bg-blue-500 text-white shadow' : 'text-slate-200 hover:bg-slate-700'}`}>สวยงาม</button>
              <button type="button" onClick={() => setBoxLabelStyle('ink')} className={`px-4 py-2 rounded-lg font-black transition-colors ${boxLabelStyle === 'ink' ? 'bg-white text-slate-900 shadow' : 'text-slate-200 hover:bg-slate-700'}`}>ประหยัดหมึก</button>
            </div>
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-black flex items-center gap-2 transition-colors">
              <Icons.Printer className="w-5 h-5"/> พิมพ์ฉลาก
            </button>
            <button onClick={() => { setShowBoxLabelPrintModal(false); setShowStorageBoxesModal(true); }} className="bg-slate-700 hover:bg-slate-600 px-6 py-2.5 rounded-xl font-black transition-colors">กลับหน้ากล่อง</button>
          </div>
        </div>

        <div className="box-label-page pt-60 xl:pt-40 p-8 flex flex-col items-center gap-6 print:pt-0 print:p-0">
          <div className="box-label-controls print:hidden w-full max-w-4xl bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="block">
              <span className="block text-sm font-black text-slate-600 mb-1">ชื่อหัวฉลาก</span>
              <input
                value={boxLabelTitle}
                onChange={(e) => setBoxLabelTitle(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="เช่น กล่องไลฟ์สด / กล่องสาย HDMI"
              />
            </label>
            <label className="block">
              <span className="block text-sm font-black text-slate-600 mb-1">หมายเหตุบนฉลาก</span>
              <input
                value={boxLabelNote}
                onChange={(e) => setBoxLabelNote(e.target.value)}
                className="w-full px-4 py-3 border border-slate-300 rounded-xl font-bold outline-none focus:ring-2 focus:ring-slate-900"
                placeholder="เช่น เก็บหลังงานทุกครั้ง / ห้ามแยกชุด"
              />
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-700">
              <input type="checkbox" className="w-5 h-5 accent-slate-900" checked={boxLabelShowChecks} onChange={e => setBoxLabelShowChecks(e.target.checked)} />
              แสดงช่องเช็กของ (ตัวเลือกเสริม)
            </label>
            <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-slate-50 font-black text-slate-700">
              <input type="checkbox" className="w-5 h-5 accent-slate-900" checked={boxLabelShowQr} onChange={e => setBoxLabelShowQr(e.target.checked)} />
              แสดง QR กล่อง (ตัวเลือกเสริม)
            </label>
          </div>

          <div className={`box-storage-label bg-white text-black shadow-xl ${isInkMode ? 'border-2 border-black' : 'border border-slate-300'}`} style={boxPreset.outerStyle}>
            <div className={`${isInkMode ? 'border-b-2 border-black bg-white' : 'border-b border-slate-300 bg-gradient-to-r from-slate-50 to-white'} px-4 py-3 print:px-3 print:py-2`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className={`${boxPreset.meta} font-black tracking-[0.18em] uppercase leading-none text-slate-900`}>MDEC STORAGE BOX</div>
                      <div className={`${titleClass} font-black leading-[1.12] mt-1 thai-keep`}>{titleText}</div>
                      <div className={`${boxPreset.meta} font-bold mt-2 text-slate-700`}>รายการอุปกรณ์ประจำกล่อง • ศูนย์มัลติมีเดียทางการศึกษา</div>
                      <div className={`${boxPreset.meta} font-black mt-1 text-slate-900`}>ทรัพย์สินของ MDEC • ใช้ภายในศูนย์</div>
                    </div>
                    {!isInkMode && showDocumentLogo('boxLabelLogo') && renderOrgLogoBox({ className: 'w-20 h-12 rounded-2xl border border-slate-300 px-2 py-1.5 shadow-sm', imgClassName: 'w-full h-full object-contain', fallbackIconClass: 'w-5 h-5' })}
                  </div>
                </div>

                <div className="shrink-0 flex flex-col items-end gap-2">
                  <div className={`${isInkMode ? 'border-2 border-black bg-white' : 'border border-slate-300 bg-slate-50'} rounded-xl px-3 py-2 text-center min-w-[58px] print:min-w-[48px]`}>
                    <div className="text-3xl print:text-[20pt] font-black leading-none">{selectedLabelItems.length}</div>
                    <div className="text-[10px] print:text-[7pt] font-black leading-tight">รายการ</div>
                  </div>
                  {boxLabelShowQr && (
                    <div className={`${isInkMode ? 'border-2 border-black' : 'border border-slate-300'} bg-white rounded-xl p-1.5`}>
                      <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${boxPreset.qrServer}x${boxPreset.qrServer}&margin=2&data=${boxQrData}`} alt="Box QR" className={`${boxPreset.qr} object-contain block`} />
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className={`${boxPreset.bodyPadding}`}>
              {boxLabelNote && (
                <div className={`${boxPreset.meta} mb-3 border ${isInkMode ? 'border-black bg-white' : 'border-slate-300 bg-slate-50'} rounded-xl px-3 py-2 font-black leading-tight thai-soft`}>
                  หมายเหตุ: {boxLabelNote}
                </div>
              )}

              {selectedLabelItems.length === 0 ? (
                <div className="border-2 border-dashed border-black p-8 text-center font-black text-slate-500">
                  ยังไม่ได้เลือกอุปกรณ์สำหรับทำฉลากกล่อง
กลับไปเลือกอุปกรณ์หรือเลือกกล่องก่อนพิมพ์
                </div>
              ) : (
                <div className={`${boxPreset.maxPreviewHeight} overflow-hidden print:max-h-none`}>
                  <div className={`grid ${boxPreset.gridClass} gap-x-5 gap-y-3`}>
                    {Object.entries(groupedByCategory).map(([category, group]) => (
                      <div key={category} className={`box-item-card break-inside-avoid ${isInkMode ? 'border-2 border-black' : 'border border-slate-300'}`}>
                        <div className={`${boxPreset.meta} font-black ${isInkMode ? 'bg-white border-b-2 border-black' : 'bg-slate-100 border-b border-slate-300'} px-2 py-1 flex justify-between gap-2`}>
                          <span className="thai-keep">{category}</span>
                          <span className="shrink-0">{group.length} ชิ้น</span>
                        </div>
                        <ol className="divide-y divide-slate-200">
                          {group.map((item, index) => (
                            <li key={item.id || `${category}_${index}`} className={`${boxPreset.itemText} font-bold leading-tight grid ${boxLabelShowChecks ? 'grid-cols-[20px_24px_1fr]' : 'grid-cols-[24px_1fr]'} gap-2 px-2 py-1.5`}>
                              {boxLabelShowChecks && <span className="font-black text-center">□</span>}
                              <span className="font-black text-right">{index + 1}.</span>
                              <span className="min-w-0 thai-soft">
                                <span className="block font-black">{item.name || '-'}</span>
                                <span className="block font-bold text-slate-700">
                                  S.N. {item.sn || '-'}
                                  {Number(item.quantity) > 1 ? ` • จำนวน ${item.quantity}` : ''}
                                  {item.location ? ` • ${item.location}` : ''}
                                </span>
                              </span>
                            </li>
                          ))}
                        </ol>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className={`${isInkMode ? 'border-t-2 border-black bg-white' : 'border-t border-slate-300 bg-slate-50'} px-4 py-2 print:px-3 print:py-1.5 flex justify-between items-center gap-3 text-[10px] print:text-[7pt] font-black`}>
              <div className="flex items-center gap-2 min-w-0">
                {!isInkMode && showDocumentLogo('boxLabelLogo') && renderOrgLogoBox({ className: 'w-12 h-7 rounded-lg border border-slate-300 px-1.5 py-1', imgClassName: 'w-full h-full object-contain', fallbackIconClass: 'w-3 h-3' })}
                <span className="truncate">กรุณาตรวจเช็กก่อนใช้งานและหลังเก็บคืนทุกครั้ง • ทรัพย์สินของศูนย์ MDEC</span>
              </div>
              <span className="shrink-0">พิมพ์วันที่ {new Date().toLocaleDateString('th-TH')}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }
  if (showPrintModal) {
    const qrSizePresets = {
      small: {
        label: 'เล็ก',
        desc: 'พื้นที่จำกัด',
        grid: 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7',
        card: 'p-2 min-h-[135px] print:p-1.5',
        qrClass: 'w-20 h-20 print:w-16 print:h-16',
        qrServer: 160,
        printCardWidth: '28mm',
        printCardHeight: '34mm',
        printQrSize: '22mm',
        nameClass: 'text-[10px]',
        snClass: 'text-[9px]',
        labelGrid: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5',
        labelCard: 'p-1.5 print:p-1',
        labelQrClass: 'w-20 h-20 print:w-16 print:h-16',
        labelQrServer: 180,
        labelTitleClass: 'text-[10px] print:text-[7px]',
        labelTextClass: 'text-[8px] print:text-[6px]'
      },
      normal: {
        label: 'ปกติ',
        desc: 'แนะนำ / แบบเดิม',
        grid: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6',
        card: 'p-3 min-h-[170px] print:p-2',
        qrClass: 'w-28 h-28 print:w-24 print:h-24',
        qrServer: 180,
        printCardWidth: '35mm',
        printCardHeight: '43mm',
        printQrSize: '28mm',
        nameClass: 'text-xs',
        snClass: 'text-[10px]',
        labelGrid: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5',
        labelCard: 'p-2 print:p-1',
        labelQrClass: 'w-24 h-24 print:w-20 print:h-20',
        labelQrServer: 220,
        labelTitleClass: 'text-[11px] print:text-[8px]',
        labelTextClass: 'text-[9px] print:text-[6.5px]'
      },
      large: {
        label: 'ใหญ่',
        desc: 'สแกนง่าย',
        grid: 'grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5',
        card: 'p-4 min-h-[215px] print:p-3',
        qrClass: 'w-36 h-36 print:w-32 print:h-32',
        qrServer: 240,
        printCardWidth: '47mm',
        printCardHeight: '56mm',
        printQrSize: '38mm',
        nameClass: 'text-sm',
        snClass: 'text-[11px]',
        labelGrid: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
        labelCard: 'p-2.5 print:p-1.5',
        labelQrClass: 'w-32 h-32 print:w-28 print:h-28',
        labelQrServer: 280,
        labelTitleClass: 'text-sm print:text-[10px]',
        labelTextClass: 'text-[10px] print:text-[7.5px]'
      },
      scanEasy: {
        label: 'สแกนง่ายมาก',
        desc: 'QR ใหญ่พิเศษ เหมาะกับแสงน้อยหรือสแกนผ่านเว็บ',
        grid: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4',
        card: 'p-5 min-h-[250px] print:p-3',
        qrClass: 'w-44 h-44 print:w-40 print:h-40',
        qrServer: 320,
        printCardWidth: '58mm',
        printCardHeight: '70mm',
        printQrSize: '46mm',
        nameClass: 'text-base',
        snClass: 'text-xs',
        labelGrid: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3',
        labelCard: 'p-3 print:p-2',
        labelQrClass: 'w-40 h-40 print:w-36 print:h-36',
        labelQrServer: 360,
        labelTitleClass: 'text-base print:text-[11px]',
        labelTextClass: 'text-xs print:text-[8px]'
      }
    };
    const qrPreset = qrSizePresets[qrPrintSize] || qrSizePresets.normal;
    const isLabelMode = qrPrintMode === 'label';
    const qrColumnPresets = {
      auto: { label: 'อัตโนมัติ', plain: qrPreset.grid, labelGrid: qrPreset.labelGrid },
      '3': { label: '3 คอลัมน์', plain: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3', labelGrid: 'grid-cols-1 md:grid-cols-3' },
      '4': { label: '4 คอลัมน์', plain: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4', labelGrid: 'grid-cols-1 sm:grid-cols-2 md:grid-cols-4' },
      '5': { label: '5 คอลัมน์', plain: 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5', labelGrid: 'grid-cols-1 sm:grid-cols-3 md:grid-cols-5' }
    };
    const qrColumnPreset = qrColumnPresets[qrPrintColumns] || qrColumnPresets.auto;
    const activeQrGrid = isLabelMode ? qrColumnPreset.labelGrid : qrColumnPreset.plain;

    return (
      <div className="bg-white min-h-screen font-sans text-black">
         <style>{`
           @media print {
             @page { size: A4; margin: 8mm; }
             body { background: white !important; }
             .qr-label-card, .qr-plain-card { break-inside: avoid; page-break-inside: avoid; box-shadow: none !important; }
             .qr-plain-grid { grid-template-columns: repeat(auto-fill, var(--qr-card-width)) !important; justify-content: start !important; align-items: start !important; gap: 2mm !important; }
             .qr-plain-card { width: var(--qr-card-width) !important; min-height: var(--qr-card-height) !important; padding: 1.2mm !important; box-sizing: border-box !important; }
             .qr-plain-card .qr-code-image { width: var(--qr-image-size) !important; height: var(--qr-image-size) !important; margin-bottom: 1mm !important; }
             .qr-plain-card .qr-brand-logo img, .qr-label-card .qr-brand-logo img { width: 100% !important; height: 100% !important; }
           }
         `}</style>
         <div className="print:hidden p-4 bg-slate-800 text-white flex flex-col xl:flex-row justify-between items-center fixed top-0 w-full z-50 shadow-md gap-3">
            <div>
              <h2 className="font-bold text-xl flex items-center gap-2">
                <Icons.QrCode className="w-6 h-6" /> โหมดพิมพ์สติ๊กเกอร์ QR Code ({selectedItems.length} ดวง)
              </h2>
              <p className="text-slate-300 text-sm font-bold mt-1">
                เลือกรูปแบบและขนาดก่อนพิมพ์: แบบธรรมดาคือแบบเดิม, แบบฉลากคือป้าย MDEC ที่เคยทำไว้
              </p>
            </div>
            <div className="flex flex-wrap justify-center gap-3">
               <div className="flex bg-slate-700/80 p-1 rounded-xl gap-1">
                 <button
                   type="button"
                   onClick={() => setQrPrintMode('plain')}
                   className={`px-4 py-2 rounded-lg font-black transition-colors ${qrPrintMode === 'plain' ? 'bg-blue-600 text-white shadow' : 'text-slate-200 hover:bg-slate-600'}`}
                   title="แบบเดิม เรียบง่าย สแกนง่าย"
                 >
                   แบบธรรมดา
                 </button>
                 <button
                   type="button"
                   onClick={() => setQrPrintMode('label')}
                   className={`px-4 py-2 rounded-lg font-black transition-colors ${qrPrintMode === 'label' ? 'bg-blue-600 text-white shadow' : 'text-slate-200 hover:bg-slate-600'}`}
                   title="แบบฉลาก มีหัว MDEC STOCK แบบแน่นขึ้น ไม่มี ID ให้เกะกะ"
                 >
                   แบบฉลาก
                 </button>
               </div>

               <div className="flex bg-slate-700/80 p-1 rounded-xl gap-1">
                 {Object.entries(qrSizePresets).map(([key, preset]) => (
                   <button
                     key={key}
                     type="button"
                     onClick={() => setQrPrintSize(key)}
                     className={`px-4 py-2 rounded-lg font-black transition-colors ${qrPrintSize === key ? 'bg-blue-600 text-white shadow' : 'text-slate-200 hover:bg-slate-600'}`}
                     title={preset.desc}
                   >
                     {preset.label}
                   </button>
                 ))}
               </div>

               <div className="flex bg-slate-700/80 p-1 rounded-xl gap-1">
                 {Object.entries(qrColumnPresets).map(([key, preset]) => (
                   <button
                     key={key}
                     type="button"
                     onClick={() => setQrPrintColumns(key)}
                     className={`px-3 py-2 rounded-lg font-black transition-colors ${qrPrintColumns === key ? 'bg-blue-600 text-white shadow' : 'text-slate-200 hover:bg-slate-600'}`}
                     title="ปรับจำนวนคอลัมน์บนหน้าพิมพ์"
                   >
                     {preset.label}
                   </button>
                 ))}
               </div>

               <div className="w-full text-xs sm:text-sm font-bold text-slate-300 bg-slate-800 border border-slate-700 rounded-xl px-4 py-3">
                 แนะนำ: ก่อนติดสติ๊กเกอร์จริง ควรทดลองสแกน 1 ดวงก่อนเสมอ และถ้าติดอุปกรณ์ที่ต้องสแกนบ่อย ให้ใช้ขนาด <b>สแกนง่ายมาก</b> Systemจะเว้น <b>Quiet Zone</b> หรือขอบขาวรอบ QR ให้โล่งขึ้น และย้ายโลโก้ออกจากพื้นที่สแกน เพื่อลดปัญหาสแกนไม่ติด
               </div>

               <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
                 <Icons.Printer className="w-5 h-5"/> สั่งพิมพ์
               </button>
               <button onClick={markSelectedQrTagged} className="bg-emerald-600 hover:bg-emerald-500 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
                 <Icons.CheckCircle className="w-5 h-5"/> ติด QR แล้ว
               </button>
               <button onClick={() => setShowPrintModal(false)} className="bg-slate-600 hover:bg-slate-500 px-6 py-2.5 rounded-xl font-bold transition-colors">ปิด</button>
            </div>
         </div>

         {!isLabelMode ? (
           <div
             className={`qr-plain-grid pt-52 xl:pt-36 p-8 grid ${activeQrGrid} gap-5 print:pt-0 print:p-0`}
             style={{ '--qr-card-width': qrPreset.printCardWidth, '--qr-card-height': qrPreset.printCardHeight, '--qr-image-size': qrPreset.printQrSize }}
           >
             {selectedItems.map(id => {
                const item = items.find(i => i.id === id);
                if(!item) return null;
                return (
                   <div key={id} className={`qr-plain-card border border-slate-300 flex flex-col items-center text-center break-inside-avoid print:border-solid print:border-slate-400 rounded-xl print:rounded-none relative print:min-h-0 bg-white ${qrPreset.card}`}>
                      <div className="w-full flex items-center justify-between gap-2 mb-2 print:mb-1">
                        <div className="qr-brand-logo">
                          {showDocumentLogo('qrLogo') && renderOrgLogoBox({ className: 'w-12 h-7 print:w-10 print:h-6 rounded-lg border border-slate-200 px-1.5 py-0.5 shadow-sm', imgClassName: 'w-full h-full object-contain', fallbackIconClass: 'w-3 h-3' })}
                        </div>
                        <div className="text-[9px] print:text-[6.5px] font-black tracking-wide text-blue-700 border border-blue-200 bg-blue-50 rounded-lg px-2 py-1">MDEC ASSET</div>
                      </div>
                      <div className="qr-safe-zone bg-white p-2.5 print:p-1.5 rounded-xl border border-white shadow-none">
                        <img src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrPreset.qrServer}x${qrPreset.qrServer}&margin=4&data=${encodeURIComponent(item.id)}`} alt="QR" className={`qr-code-image ${qrPreset.qrClass} object-contain block`} />
                      </div>
                      <span className={`${qrPreset.nameClass} font-black leading-tight line-clamp-2 w-full mt-1.5`}>{item.name}</span>
                      <span className={`${qrPreset.snClass} font-bold text-gray-600 mt-1`}>{item.sn}</span>
                      {item.owner ? <span className="text-[9px] font-bold bg-gray-200 px-1 rounded mt-1">👤 {item.owner}</span> : <span className="text-[8px] font-black text-blue-700 mt-1">ทรัพย์สิน MDEC</span>}
                   </div>
                )
             })}
           </div>
         ) : (
           <div className={`pt-52 xl:pt-36 p-8 grid ${activeQrGrid} gap-5 print:pt-0 print:p-0 print:gap-2`}>
             {selectedItems.map(id => {
                const item = items.find(i => i.id === id);
                if(!item) return null;
                const deptInfo = DEPARTMENTS.find(d => d.id === item.department);
                const qrValue = encodeURIComponent(item.id || item.sn || item.name || 'MDEC-STOCK');
                return (
                   <div key={id} className={`qr-label-card border border-slate-300 rounded-xl flex flex-col bg-white text-slate-900 break-inside-avoid shadow-sm print:rounded-none overflow-hidden ${qrPreset.labelCard}`}>
                      <div className="flex items-center justify-between gap-2 border-b border-slate-200 pb-1.5 mb-2 print:pb-0.5 print:mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="qr-brand-logo">
                            {showDocumentLogo('qrLogo') && renderOrgLogoBox({ className: 'w-12 h-7 print:w-10 print:h-6 rounded-lg border border-slate-200 px-1.5 py-0.5 shadow-sm', imgClassName: 'w-full h-full object-contain', fallbackIconClass: 'w-3 h-3' })}
                          </div>
                          <div className="leading-tight min-w-0">
                            <div className={`${qrPreset.labelTitleClass} font-black tracking-wide text-blue-700`}>MDEC STOCK</div>
                            <div className="text-[9px] print:text-[6.5px] font-bold text-slate-500 truncate">ศูนย์มัลติมีเดียทางการศึกษา</div>
                          </div>
                        </div>
                        <div className="text-[8px] print:text-[6px] font-black border border-blue-200 bg-blue-50 text-blue-700 px-1.5 py-0.5 rounded-md shrink-0">QR SAFE</div>
                      </div>

                      <div className="flex gap-2 items-stretch">
                        <div className="qr-safe-zone bg-white p-2 print:p-1 rounded-lg border border-slate-200 shrink-0">
                          <img
                            src={`https://api.qrserver.com/v1/create-qr-code/?size=${qrPreset.labelQrServer}x${qrPreset.labelQrServer}&margin=4&data=${qrValue}`}
                            alt="QR"
                            className={`qr-code-image ${qrPreset.labelQrClass} object-contain block bg-white`}
                          />
                        </div>
                        <div className="min-w-0 flex-1 leading-tight rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 print:px-1 print:py-1">
                          <div className={`${qrPreset.labelTitleClass} font-black line-clamp-2 text-slate-950`}>{item.name}</div>
                          <div className={`mt-1 grid grid-cols-[auto_1fr] gap-x-1 gap-y-0.5 ${qrPreset.labelTextClass} font-bold`}>
                            <span className="text-slate-400">S.N.</span><span className="truncate text-slate-700">{item.sn || '-'}</span>
                            <span className="text-slate-400">ฝ่าย</span><span className="truncate text-slate-700">{deptInfo?.label || item.department || '-'}</span>
                            <span className="text-slate-400">ที่เก็บ</span><span className="truncate text-slate-700">{item.location || '-'}</span>
                          </div>
                        </div>
                      </div>

                      {item.owner ? (
                        <div className="mt-1.5 print:mt-0.5 text-[8px] print:text-[6px] font-black bg-slate-100 border border-slate-300 px-1.5 py-0.5 rounded-md truncate">
                          ของส่วนตัว: {item.owner}
                        </div>
                      ) : (
                        <div className="mt-1.5 print:mt-0.5 flex items-center gap-1 text-[8px] print:text-[6px] font-black bg-blue-50 border border-blue-200 text-blue-700 px-1.5 py-0.5 rounded-md truncate">
                          {showDocumentLogo('qrLogo') && renderOrgLogoBox({ className: 'w-7 h-4 print:w-6 print:h-3.5 rounded-sm border border-blue-100 px-0.5 py-0.5', imgClassName: 'w-full h-full object-contain', fallbackIconClass: 'w-2.5 h-2.5' })}
                          <span className="truncate">ทรัพย์สินศูนย์มัลติมีเดีย</span>
                        </div>
                      )}
                   </div>
                )
             })}
           </div>
         )}
      </div>
    );
  }

  if (printProjectData) {
    const projectItems = printProjectData.items || [];
    return (
      <div className={`factory-stock-polish min-h-screen font-sans text-slate-900 print:bg-white ${isInkSavingDocument ? "bg-white" : "bg-slate-100"}`}>
        <div className="print-actions-bar print:hidden p-4 bg-slate-800 text-white flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
          <div>
            <h2 className="font-bold text-xl flex items-center gap-2"><Icons.Printer className="w-6 h-6" /> รายงานโครงการ</h2>
            <p className="text-slate-300 text-sm font-bold mt-1">ตัวอย่างนี้คือหน้าที่จะพิมพ์จริง ปรับข้อมูลได้จากหน้าโครงการจัดซื้อ</p>
          </div>
          <div className="flex gap-3">
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"><Icons.Printer className="w-5 h-5"/> พิมพ์รายงาน</button>
            <button onClick={() => setPrintProjectData(null)} className="bg-slate-600 hover:bg-slate-500 px-6 py-2.5 rounded-xl font-bold transition-colors">ปิด</button>
          </div>
        </div>
        <div className="pt-24 print:pt-0 p-6 print:p-0 max-w-5xl mx-auto">
          <div className="print-paper-shell relative overflow-hidden bg-white p-8 print:p-6 shadow-xl print:shadow-none border border-slate-200 print:border-0 rounded-2xl print:rounded-none">
            {showDocumentLogo('watermark') && !isInkSavingDocument && !brandLogoError && <img src={ORG_LOGO_SRC} alt="MDEC Watermark" className="absolute right-8 top-8 w-44 opacity-[0.045] pointer-events-none select-none" onError={() => setBrandLogoError(true)} />}
            <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6 gap-4 relative z-[1]">
              <div className="min-w-0">
                {showDocumentLogo('slipLogo') ? renderOrgSignature({
                  title: 'รายงานอุปกรณ์ตามโครงการ',
                  subtitle: 'ศูนย์มัลติมีเดียทางการศึกษา (MDEC)',
                  compact: false,
                  containerClass: 'mb-2',
                  titleClass: 'text-slate-900 text-3xl',
                  subtitleClass: 'text-slate-600 text-sm',
                  textWrapClass: 'min-w-0',
                  logoClassName: 'w-28 h-16 rounded-2xl border border-slate-200 px-3 py-2 shadow-sm'
                }) : (
                  <div className="leading-tight mb-2">
                    <h1 className="text-3xl font-black text-slate-900">รายงานอุปกรณ์ตามโครงการ</h1>
                    <p className="text-sm font-bold text-slate-600">ศูนย์มัลติมีเดียทางการศึกษา (MDEC)</p>
                  </div>
                )}
                <p className="text-lg font-black text-blue-700">โครงการ: {printProjectData.name}</p>
                <p className="text-sm font-bold text-slate-600">เอกสารจากSystem MDEC-Stock • ใช้สำหรับตรวจพัสดุ/ตรวจโครงการ</p>
              </div>
              <div className="text-right text-sm font-bold shrink-0 relative z-[1]">
                <div>เลขที่: {printProjectData.ref}</div>
                <div>วันที่ออกเอกสาร: {new Date(printProjectData.date).toLocaleString('th-TH', { hour12: false })}</div>
              </div>
            </div>

            <div className="grid grid-cols-5 gap-3 mb-6 relative z-[1]">
              {[
                ['ทั้งหมด', printProjectData.total || projectItems.length],
                ['ใช้งานอยู่', printProjectData.active || 0],
                ['จำหน่ายแล้ว', printProjectData.disposed || 0],
                ['สูญหาย', printProjectData.lost || 0],
                ['ชำรุดรอจำหน่าย', printProjectData.pending_disposal || 0]
              ].map(([label, value]) => (
                <div key={label} className="border rounded-xl p-3 text-center">
                  <div className="text-2xl font-black text-slate-900">{Number(value || 0).toLocaleString('th-TH')}</div>
                  <div className="text-xs font-bold text-slate-500">{label}</div>
                </div>
              ))}
            </div>

            <table className="w-full border-collapse mb-8 text-sm relative z-[1]">
              <thead>
                <tr className="bg-slate-900 text-white text-[12px]">
                  <th className="border border-slate-900 px-3 py-2 text-left w-12">#</th>
                  <th className="border border-slate-900 px-3 py-2 text-left">ชื่ออุปกรณ์</th>
                  <th className="border border-slate-900 px-3 py-2 text-left">S.N.</th>
                  <th className="border border-slate-900 px-3 py-2 text-left">หมวดหมู่</th>
                  <th className="border border-slate-900 px-3 py-2 text-left">สถานที่/ห้อง</th>
                  <th className="border border-slate-900 px-3 py-2 text-left">สถานะใช้งาน</th>
                  <th className="border border-slate-900 px-3 py-2 text-left">สถานะพัสดุ</th>
                  <th className="border border-slate-900 px-3 py-2 text-left">หมายเหตุ</th>
                </tr>
              </thead>
              <tbody>
                {projectItems.length === 0 ? (
                  <tr><td colSpan="8" className="border px-3 py-8 text-center font-bold text-slate-500">ยังไม่มีอุปกรณ์ในโครงการนี้
กด “จัดอุปกรณ์” เพื่อเลือกอุปกรณ์เข้าโครงการ</td></tr>
                ) : projectItems.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="border px-3 py-2 font-bold">{index + 1}</td>
                    <td className="border px-3 py-2 font-bold">{item.name || '-'}</td>
                    <td className="border px-3 py-2">{item.sn || '-'}</td>
                    <td className="border px-3 py-2">{item.category || '-'}</td>
                    <td className="border px-3 py-2">{item.location || '-'}</td>
                    <td className="border px-3 py-2">{STATUSES.find(s => s.id === item.status)?.label || item.status || '-'}</td>
                    <td className="border px-3 py-2">{getAssetStatusInfo(item.assetStatus).label}</td>
                    <td className="border px-3 py-2 text-xs">{item.internalNote || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="grid grid-cols-2 gap-12 mt-14 text-center font-bold relative z-[1]">
              <div><div className="border-b border-slate-900 h-12 mb-2"></div><div>ลงชื่อผู้ตรวจรายการ</div></div>
              <div><div className="border-b border-slate-900 h-12 mb-2"></div><div>ลงชื่อผู้รับผิดชอบโครงการ</div></div>
            </div>
            <div className="mt-10 pt-3 border-t border-slate-200 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-500 relative z-[1]">
              <div className="flex items-center gap-2 min-w-0">
                {showDocumentLogo('slipLogo') && renderOrgLogoBox({ className: 'w-16 h-9 rounded-xl border border-slate-200 px-2 py-1 shadow-sm', imgClassName: 'w-full h-full object-contain', fallbackIconClass: 'w-3 h-3' })}
                <span className="truncate">เอกสารนี้ออกโดยSystem MDEC-Stock สำหรับตรวจรายการอุปกรณ์ตามโครงการและประกอบงานพัสดุภายในศูนย์</span>
              </div>
              <span className="shrink-0">{APP_VERSION}</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (printSlipData) {
    const isPrepSlip = printSlipData.type === 'prep';
    return (
      <div className={`factory-stock-polish min-h-screen font-sans text-slate-900 print:bg-white ${isInkSavingDocument ? "bg-white" : "bg-slate-100"}`}>
        <div className="print-actions-bar print:hidden p-4 bg-slate-800 text-white flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
          <div>
            <h2 className="font-bold text-xl flex items-center gap-2"><Icons.Printer className="w-6 h-6" /> {printSlipData.title}</h2>
            <p className="text-slate-300 text-sm font-bold mt-1">ตัวอย่างนี้คือเอกสารที่จะพิมพ์จริง ตรวจข้อมูลก่อนกดพิมพ์</p>
          </div>
          <div className="flex gap-3"><button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"><Icons.Printer className="w-5 h-5"/> {isPrepSlip ? 'พิมพ์ใบเตรียมของ' : 'พิมพ์ใบยืม'}</button><button onClick={() => setPrintSlipData(null)} className="bg-slate-600 hover:bg-slate-500 px-6 py-2.5 rounded-xl font-bold transition-colors">ปิด</button></div>
        </div>
        <div className="pt-24 print:pt-0 p-6 print:p-0 max-w-4xl mx-auto"><div className="print-paper-shell relative overflow-hidden bg-white p-8 print:p-6 shadow-xl print:shadow-none border border-slate-200 print:border-0 rounded-2xl print:rounded-none">
          {showDocumentLogo('watermark') && !isInkSavingDocument && !brandLogoError && <img src={ORG_LOGO_SRC} alt="MDEC Watermark" className="absolute right-8 top-8 w-40 opacity-[0.045] pointer-events-none select-none" onError={() => setBrandLogoError(true)} />}
          <div className="flex justify-between items-start border-b-2 border-slate-900 pb-4 mb-6 gap-4 relative z-[1]">
            <div className="min-w-0">
              {showDocumentLogo('slipLogo') ? renderOrgSignature({
                title: printSlipData.title,
                subtitle: 'ศูนย์มัลติมีเดียทางการศึกษา (MDEC)',
                compact: false,
                containerClass: 'mb-2',
                titleClass: 'text-slate-900 text-3xl',
                subtitleClass: 'text-slate-600 text-sm',
                textWrapClass: 'min-w-0',
                logoClassName: 'w-28 h-16 rounded-2xl border border-slate-200 px-3 py-2 shadow-sm'
              }) : (
                <div className="leading-tight mb-2">
                  <h1 className="text-3xl font-black text-slate-900">{printSlipData.title}</h1>
                  <p className="text-sm font-bold text-slate-600">ศูนย์มัลติมีเดียทางการศึกษา (MDEC)</p>
                </div>
              )}
              <p className="text-sm font-black text-blue-700">เอกสารจากSystem MDEC-Stock • ศูนย์มัลติมีเดียทางการศึกษา</p>
              {isPrepSlip && <p className="text-sm font-bold mt-1 text-slate-600">ใช้สำหรับเช็กรายการอุปกรณ์ก่อนนำออกงานจริง</p>}
            </div>
            <div className="text-right text-sm font-bold shrink-0 relative z-[1]"><div>เลขที่: {printSlipData.ref}</div><div>วันที่ออกเอกสาร: {new Date(printSlipData.date).toLocaleString('th-TH', { hour12: false })}</div></div>
          </div>
          <div className="grid grid-cols-2 gap-4 mb-6 text-base relative z-[1]"><div className="border rounded-xl p-4"><div className="text-slate-500 font-bold text-sm">{isPrepSlip ? 'ชื่องาน / รายการเตรียมของ' : 'ผู้ยืม / ชื่องาน'}</div><div className="font-black text-lg">{printSlipData.borrower || '-'}</div></div><div className="border rounded-xl p-4"><div className="text-slate-500 font-bold text-sm">{isPrepSlip ? 'ผู้รับผิดชอบ' : 'เจ้าหน้าที่ผู้ให้ยืม / ผู้นำออก'}</div><div className="font-black text-lg">{printSlipData.staffOut || '-'}</div></div><div className="border rounded-xl p-4"><div className="text-slate-500 font-bold text-sm">{isPrepSlip ? 'วันที่ใช้งาน' : 'กำหนดคืน'}</div><div className="font-black text-lg">{printSlipData.expectedReturn ? new Date(printSlipData.expectedReturn).toLocaleDateString('th-TH') : '-'}</div></div><div className="border rounded-xl p-4"><div className="text-slate-500 font-bold text-sm">หมายเหตุ</div><div className="font-bold">{printSlipData.note || '-'}</div></div></div>
          <table className="w-full border-collapse mb-8 text-sm"><thead><tr className="bg-slate-900 text-white">{isPrepSlip && <th className="border border-slate-900 px-3 py-2 text-left w-16">เช็ก</th>}<th className="border border-slate-900 px-3 py-2 text-left w-12">#</th><th className="border border-slate-900 px-3 py-2 text-left">ชื่ออุปกรณ์</th><th className="border border-slate-900 px-3 py-2 text-left">S.N.</th><th className="border border-slate-900 px-3 py-2 text-left">หมวดหมู่</th>{isPrepSlip && <th className="border border-slate-900 px-3 py-2 text-left">กล่อง/ที่เก็บ</th>}<th className="border border-slate-900 px-3 py-2 text-left">หมายเหตุภายใน</th></tr></thead><tbody>{(printSlipData.items || []).map((item, index) => (<tr key={item.id || index}>{isPrepSlip && <td className="border px-3 py-2 text-center text-lg font-black">□</td>}<td className="border px-3 py-2 font-bold">{index + 1}</td><td className="border px-3 py-2 font-bold">{item.name || '-'}</td><td className="border px-3 py-2">{item.sn || '-'}</td><td className="border px-3 py-2">{item.category || '-'}</td>{isPrepSlip && <td className="border px-3 py-2 text-xs">{item.storageBoxName || '-'}</td>}<td className="border px-3 py-2 text-xs">{item.internalNote || '-'}</td></tr>))}</tbody></table>
          {isPrepSlip && <div className="border-2 border-dashed border-slate-400 rounded-xl p-4 mb-8 text-sm font-bold"><div className="font-black mb-2">หมายเหตุขณะเตรียมของ</div><div className="h-16"></div></div>}
          <div className="grid grid-cols-2 gap-12 mt-14 text-center font-bold relative z-[1]"><div><div className="border-b border-slate-900 h-12 mb-2"></div><div>{isPrepSlip ? 'ลงชื่อผู้เตรียมของ' : 'ลงชื่อผู้ยืม / ผู้รับผิดชอบงาน'}</div></div><div><div className="border-b border-slate-900 h-12 mb-2"></div><div>{isPrepSlip ? 'ลงชื่อผู้ตรวจรายการ' : 'ลงชื่อเจ้าหน้าที่ผู้ให้ยืม'}</div></div></div>
          <div className="mt-10 pt-3 border-t border-slate-200 flex items-center justify-between gap-3 text-[11px] font-bold text-slate-500 relative z-[1]">
            <div className="flex items-center gap-2 min-w-0">
              {showDocumentLogo('slipLogo') && renderOrgLogoBox({ className: 'w-16 h-9 rounded-xl border border-slate-200 px-2 py-1 shadow-sm', imgClassName: 'w-full h-full object-contain', fallbackIconClass: 'w-3 h-3' })}
              <span className="truncate">เอกสารนี้ออกโดยSystem MDEC-Stock เพื่อแสดงความเป็นเจ้าของและใช้ประกอบการยืม-คืนภายในศูนย์</span>
            </div>
            <span className="shrink-0">{APP_VERSION}</span>
          </div>
        </div></div>
      </div>
    );
  }

  if (showCommandCenter) {
    const healthPercentage = stats.all > 0 ? Math.round((stats.available / stats.all) * 100) : 0;
    const outsideItems = [
      ...currentBorrowedItems.map(i => ({ ...i, _kind: 'borrow' })),
      ...currentEventItems.map(i => ({ ...i, _kind: 'event' }))
    ];
    const overdueItems = outsideItems.filter(i => i.expectedReturn && new Date(i.expectedReturn).getTime() < todayMs);
    const alertCount = stats.maintenance + overdueItems.length;
    const lastActions = auditLogs.slice(0, 6);

    const mc = {
      bg: isDarkMode ? 'bg-[#050816] text-slate-100' : 'bg-slate-950 text-slate-100',
      panel: 'bg-slate-900/92 border-cyan-400/15 shadow-[0_0_34px_rgba(8,145,178,0.10)]',
      panelSoft: 'bg-slate-900/72 border-slate-700/70',
      textDim: 'text-slate-400',
      glow: 'shadow-[0_0_24px_rgba(34,211,238,0.14)]',
    };

    const StatTile = ({ label, value, caption, tone = 'cyan', icon = '●' }) => {
      const toneClass = {
        cyan: 'from-cyan-500/18 to-cyan-500/5 border-cyan-400/25 text-cyan-200',
        emerald: 'from-emerald-500/18 to-emerald-500/5 border-emerald-400/25 text-emerald-200',
        purple: 'from-purple-500/18 to-purple-500/5 border-purple-400/25 text-purple-200',
        rose: 'from-rose-500/18 to-rose-500/5 border-rose-400/25 text-rose-200',
        amber: 'from-amber-500/18 to-amber-500/5 border-amber-400/25 text-amber-200'
      }[tone] || 'from-cyan-500/18 to-cyan-500/5 border-cyan-400/25 text-cyan-200';
      return (
        <div className={`mc-stat relative overflow-hidden rounded-2xl border bg-gradient-to-br ${toneClass}`}>
          <div className="absolute right-[-18px] top-[-18px] w-20 h-20 rounded-full bg-white/5 blur-xl"></div>
          <div className="relative flex items-start justify-between gap-2">
            <div>
              <div className="text-[11px] sm:text-xs font-black tracking-[.18em] uppercase opacity-80">{label}</div>
              <div className="text-3xl sm:text-4xl lg:text-[2.55rem] leading-none font-black mt-2 tabular-nums">{value}</div>
              <div className="text-[11px] sm:text-xs font-bold opacity-70 mt-1 truncate">{caption}</div>
            </div>
            <div className="w-9 h-9 rounded-xl bg-white/8 border border-white/10 flex items-center justify-center shrink-0 text-base">{icon}</div>
          </div>
        </div>
      );
    };

    return (
      <div className={`mission-control fixed inset-0 z-[10000] ${mc.bg} font-sans antialiased overflow-hidden`}>
        <style>{`
          .mission-control, .mission-control * { box-sizing: border-box; }
          .mission-control {
            --mc-cyan: #22d3ee;
            --mc-blue: #6366f1;
            --mc-line: rgba(34,211,238,.14);
            background:
              radial-gradient(circle at 15% 0%, rgba(99,102,241,.26), transparent 32%),
              radial-gradient(circle at 85% 12%, rgba(34,211,238,.18), transparent 30%),
              linear-gradient(180deg,#040816 0%,#08111f 100%);
          }
          .mission-control::before {
            content: "";
            position: fixed;
            inset: 0;
            pointer-events: none;
            opacity: .26;
            background-image:
              linear-gradient(rgba(34,211,238,.12) 1px, transparent 1px),
              linear-gradient(90deg, rgba(34,211,238,.12) 1px, transparent 1px);
            background-size: 44px 44px;
            mask-image: linear-gradient(to bottom, black 0%, transparent 86%);
          }
          .mc-shell { position: relative; height: 100dvh; padding: 14px; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
          .mc-topbar { min-height: 62px; }
          .mc-grid { flex: 1; min-height: 0; display: grid; grid-template-columns: 1.05fr 1.18fr .92fr; gap: 12px; }
          .mc-col { min-width: 0; min-height: 0; display: flex; flex-direction: column; gap: 12px; overflow: hidden; }
          .mc-panel { min-width: 0; min-height: 0; border-radius: 22px; border: 1px solid rgba(34,211,238,.16); overflow: hidden; }
          .mc-panel-pad { padding: 14px; }
          .mc-stat { padding: 14px; min-height: 112px; }
          .mc-scroll { min-height: 0; overflow-y: auto; scrollbar-width: thin; }
          .mc-scroll::-webkit-scrollbar { width: 7px; height: 7px; }
          .mc-scroll::-webkit-scrollbar-thumb { background: rgba(34,211,238,.35); border-radius: 999px; }
          .mc-scanline { position: relative; }
          .mc-scanline::after { content: ""; position: absolute; inset: 0; pointer-events: none; background: linear-gradient(180deg, transparent, rgba(34,211,238,.06), transparent); transform: translateY(-100%); animation: mcscan 4s linear infinite; }
          @keyframes mcscan { to { transform: translateY(100%); } }
          .mc-health-ring { width: 150px; height: 150px; }
          .mc-action-row { transition: transform .15s ease, border-color .15s ease, background .15s ease; }
          .mc-action-row:hover { transform: translateY(-1px); border-color: rgba(34,211,238,.35); background: rgba(15,23,42,.96); }
          @media (max-width: 1180px) {
            .mc-grid { grid-template-columns: .95fr 1.05fr .9fr; gap: 10px; }
            .mc-stat { min-height: 104px; padding: 12px; }
            .mc-health-ring { width: 134px; height: 134px; }
          }
          @media (max-width: 920px) {
            .mission-control { overflow-y: auto; }
            .mc-shell { height: auto; min-height: 100dvh; overflow: visible; padding: 12px; gap: 10px; }
            .mc-topbar { min-height: auto; flex-direction: column; align-items: stretch !important; gap: 10px; }
            .mc-topbar-actions { display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px; }
            .mc-topbar-actions .mc-close { grid-column: 1 / -1; width: 100%; }
            .mc-grid { display: flex; flex-direction: column; min-height: auto; overflow: visible; }
            .mc-col { overflow: visible; min-height: auto; }
            .mc-panel { overflow: hidden; border-radius: 18px; }
            .mc-stat-grid { grid-template-columns: repeat(2, minmax(0,1fr)) !important; }
            .mc-stat { min-height: 92px; padding: 11px; }
            .mc-stat .text-3xl, .mc-stat .text-4xl { font-size: 1.9rem !important; }
            .mc-health-ring { width: 104px; height: 104px; }
            .mc-mobile-row { display: grid !important; grid-template-columns: 118px 1fr; align-items: center; gap: 12px; }
            .mc-scroll { max-height: 310px; }
            .mc-desktop-only { display: none !important; }
          }
          @media (max-width: 480px) {
            .mc-shell { padding: 10px; }
            .mc-stat-grid { gap: 8px !important; }
            .mc-stat { min-height: 86px; }
            .mc-top-title { font-size: 1.05rem !important; }
            .mc-top-sub { font-size: .68rem !important; }
            .mc-mobile-row { grid-template-columns: 96px 1fr; gap: 10px; }
            .mc-health-ring { width: 92px; height: 92px; }
          }
        `}</style>

        <div className="mc-shell">
          <div className={`mc-topbar mc-panel ${mc.panel} flex items-center justify-between gap-4 px-4 py-3`}>
            <div className="min-w-0 flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-cyan-400/10 border border-cyan-300/20 flex items-center justify-center shadow-[0_0_20px_rgba(34,211,238,.14)] shrink-0">
                <Icons.Monitor className="w-6 h-6 text-cyan-200" />
              </div>
              <div className="min-w-0">
                <div className="mc-top-title text-xl font-black tracking-tight text-white truncate">MDEC COMMAND CENTER</div>
                <div className="mc-top-sub text-xs font-black tracking-[.18em] text-cyan-300/75 uppercase truncate">LIVE INVENTORY CONTROL • {APP_VERSION}</div>
              </div>
            </div>
            <div className="mc-topbar-actions flex items-center justify-end gap-2 shrink-0">
              <div className="px-3 py-2 rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-200 font-black text-xs flex items-center justify-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-300 animate-pulse"></span> ONLINE
              </div>
              <div className="px-3 py-2 rounded-2xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-200 font-black tabular-nums">
                {currentTime.toLocaleTimeString('th-TH')}
              </div>
              <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className="px-3 py-2 rounded-2xl border border-cyan-400/15 bg-white/5 text-slate-200 font-black hover:bg-cyan-400/10 transition-colors">
                {isDarkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
              </button>
              <button type="button" onClick={() => setShowCommandCenter(false)} className="mc-close px-4 py-2 rounded-2xl border border-rose-400/30 bg-rose-500/10 text-rose-200 font-black hover:bg-rose-500/20 transition-colors flex items-center justify-center gap-2">
                ปิด <Icons.X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="mc-grid">
            <div className="mc-col">
              <div className="mc-stat-grid grid grid-cols-2 gap-3">
                <StatTile label="STOCK" value={stats.all} caption="รายการทั้งหมด" tone="cyan" icon="📦" />
                <StatTile label="READY" value={stats.available} caption="พร้อมใช้งาน" tone="emerald" icon="✅" />
                <StatTile label="OUT" value={outsideItems.length} caption="ยืม/ออกงาน" tone="purple" icon="🚚" />
                <StatTile label="ALERT" value={alertCount} caption="ต้องติดตาม" tone={alertCount > 0 ? 'rose' : 'amber'} icon="⚠️" />
              </div>

              <div className={`mc-panel mc-panel-pad ${mc.panel} flex-1 mc-scanline`}>
                <div className="text-xs font-black tracking-[.18em] text-cyan-300/80 uppercase mb-3">PRIORITY FOLLOW-UP</div>
                <div className="mc-scroll space-y-2 pr-1">
                  {overdueItems.slice(0, 5).map(item => (
                    <button key={`late_${item.id}`} type="button" onClick={() => setShowHistory(item.id)} className="mc-action-row w-full text-left rounded-2xl border border-rose-400/20 bg-rose-500/10 px-3 py-2.5">
                      <div className="flex items-center justify-between gap-2">
                        <div className="min-w-0 font-black text-rose-100 truncate">{item.name}</div>
                        <span className="text-[10px] font-black px-2 py-1 rounded-lg bg-rose-500 text-white shrink-0">เลยกำหนด</span>
                      </div>
                      <div className="text-xs font-bold text-rose-200/70 truncate mt-1">{item._kind === 'event' ? `งาน: ${item.currentEvent || '-'}` : `ผู้ยืม: ${item.currentBorrower || '-'}`}</div>
                    </button>
                  ))}
                  {overdueItems.length === 0 && stats.maintenance === 0 && (
                    <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-center font-black text-emerald-200">
                      ระบบปกติ • ไม่มีรายการเร่งด่วน
                    </div>
                  )}
                  {stats.maintenance > 0 && (
                    <button type="button" onClick={() => { setQuickProblemOnly(true); setShowCommandCenter(false); }} className="mc-action-row w-full text-left rounded-2xl border border-amber-400/20 bg-amber-400/10 px-3 py-2.5">
                      <div className="font-black text-amber-100">อุปกรณ์ซ่อม/ชำรุด {stats.maintenance} รายการ</div>
                      <div className="text-xs font-bold text-amber-200/70 mt-1">กดเพื่อกรองรายการที่ต้องตรวจสอบ</div>
                    </button>
                  )}
                </div>
              </div>
            </div>

            <div className="mc-col">
              <div className={`mc-panel mc-panel-pad ${mc.panel} flex-[0_0_auto]`}>
                <div className="mc-mobile-row flex flex-col items-center justify-center gap-3 text-center">
                  <div className="relative mc-health-ring rounded-full border-[9px] border-slate-950/80 flex items-center justify-center shadow-[inset_0_0_24px_rgba(0,0,0,.45),0_0_26px_rgba(16,185,129,.18)]"
                       style={{ background: `conic-gradient(#10b981 ${healthPercentage * 3.6}deg, rgba(15,23,42,.75) 0)` }}>
                    <div className="absolute inset-3 rounded-full bg-slate-950 border border-emerald-300/15 flex flex-col items-center justify-center">
                      <span className="text-3xl font-black text-white tabular-nums">{healthPercentage}%</span>
                      <span className="text-[10px] font-black text-emerald-300">READY</span>
                    </div>
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-black tracking-[.18em] text-emerald-300/80 uppercase">STOCK HEALTH</div>
                    <div className="text-2xl font-black text-white mt-1">ความพร้อมของสต๊อก</div>
                    <div className="mt-3 h-2 rounded-full bg-slate-800 overflow-hidden border border-white/5">
                      <div className="h-full bg-gradient-to-r from-emerald-400 to-cyan-300" style={{ width: `${Math.max(0, Math.min(100, healthPercentage))}%` }}></div>
                    </div>
                    <div className="text-xs font-bold text-slate-400 mt-2">พร้อมใช้ {stats.available} จาก {stats.all} รายการ</div>
                  </div>
                </div>
              </div>

              <div className={`mc-panel mc-panel-pad ${mc.panel} flex-1`}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="text-xs font-black tracking-[.18em] text-purple-300/80 uppercase">OUTSIDE CENTER</div>
                    <div className="font-black text-white">กำลังอยู่นอกศูนย์</div>
                  </div>
                  <button type="button" onClick={() => openTrackingCenter('today')} className="px-3 py-1.5 rounded-xl border border-purple-400/20 bg-purple-400/10 text-purple-200 text-xs font-black">ดูทั้งหมด</button>
                </div>
                <div className="mc-scroll space-y-2 pr-1">
                  {outsideItems.slice(0, 6).map(item => {
                    const isLate = item.expectedReturn && new Date(item.expectedReturn).getTime() < todayMs;
                    return (
                      <button key={`${item._kind}_${item.id}`} type="button" onClick={() => setShowHistory(item.id)} className={`mc-action-row w-full text-left rounded-2xl border px-3 py-2.5 ${isLate ? 'border-rose-400/25 bg-rose-500/10' : item._kind === 'event' ? 'border-orange-400/20 bg-orange-400/10' : 'border-purple-400/20 bg-purple-400/10'}`}>
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-black text-white truncate">{item.name}</span>
                          <span className={`text-[10px] font-black px-2 py-1 rounded-lg shrink-0 ${isLate ? 'bg-rose-500 text-white' : item._kind === 'event' ? 'bg-orange-500/80 text-white' : 'bg-purple-500/80 text-white'}`}>{isLate ? 'เลยกำหนด' : item._kind === 'event' ? 'ออกงาน' : 'ยืม'}</span>
                        </div>
                        <div className="text-xs font-bold text-slate-400 truncate mt-1">กำหนดคืน {item.expectedReturn ? new Date(item.expectedReturn).toLocaleDateString('th-TH') : '-'}</div>
                      </button>
                    );
                  })}
                  {outsideItems.length === 0 && <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4 text-center font-black text-emerald-200">ไม่มีของอยู่นอกศูนย์</div>}
                </div>
              </div>
            </div>

            <div className="mc-col">
              <div className={`mc-panel mc-panel-pad ${mc.panel} flex-1`}>
                <div className="flex items-center justify-between gap-3 mb-3">
                  <div>
                    <div className="text-xs font-black tracking-[.18em] text-cyan-300/80 uppercase">LIVE ACTIVITY</div>
                    <div className="font-black text-white">ความเคลื่อนไหวล่าสุด</div>
                  </div>
                  <span className="text-xs font-black px-3 py-1.5 rounded-xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-200">LIVE</span>
                </div>
                <div className="mc-scroll space-y-2 pr-1">
                  {lastActions.map(log => {
                    const action = log.action || '-';
                    let dot = 'bg-cyan-300';
                    if (action.includes('ลบ')) dot = 'bg-rose-300';
                    if (action.includes('คืน')) dot = 'bg-emerald-300';
                    if (action.includes('ยืม') || action.includes('ออกงาน')) dot = 'bg-purple-300';
                    if (action.includes('แก้')) dot = 'bg-amber-300';
                    return (
                      <div key={log.id} className="mc-action-row rounded-2xl border border-slate-700/80 bg-slate-950/40 px-3 py-2.5">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0 flex items-start gap-2">
                            <span className={`mt-1.5 w-2 h-2 rounded-full ${dot} shrink-0 shadow-[0_0_10px_currentColor]`}></span>
                            <div className="min-w-0">
                              <div className="text-xs font-black text-cyan-200/80 truncate">{action}</div>
                              <div className="font-black text-white truncate">{log.target || '-'}</div>
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-500 shrink-0">{log.timestamp ? new Date(log.timestamp).toLocaleTimeString('th-TH', { hour12: false }) : '-'}</span>
                        </div>
                      </div>
                    );
                  })}
                  {lastActions.length === 0 && <div className="rounded-2xl border border-slate-700 bg-slate-950/40 p-4 text-center font-black text-slate-400">ยังไม่มีการเคลื่อนไหว</div>}
                </div>
              </div>

              <div className={`mc-panel mc-panel-pad ${mc.panelSoft} mc-desktop-only`}>
                <div className="text-xs font-black tracking-[.18em] text-slate-400 uppercase mb-2">QUICK ACTIONS</div>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => { setShowCommandCenter(false); openWorkspace('borrowReturn'); }} className="rounded-2xl border border-purple-400/20 bg-purple-400/10 text-purple-100 p-3 font-black text-sm">ยืม-คืน</button>
                  <button type="button" onClick={() => { setShowCommandCenter(false); openSelectionScanner({ camera: true }); }} className="rounded-2xl border border-cyan-400/20 bg-cyan-400/10 text-cyan-100 p-3 font-black text-sm">สแกน QR</button>
                  <button type="button" onClick={() => { setShowCommandCenter(false); openWorkspace('projects'); }} className="rounded-2xl border border-indigo-400/20 bg-indigo-400/10 text-indigo-100 p-3 font-black text-sm">โครงการ</button>
                  <button type="button" onClick={() => { setShowCommandCenter(false); openTrackingCenter('today'); }} className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 text-emerald-100 p-3 font-black text-sm">ติดตาม</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div data-polish-theme={isDarkMode ? 'dark' : 'light'} className={`factory-stock-polish min-h-screen font-sans ${appShellPaddingClass} lg:pl-80 ${activeWorkspace === 'qrWorkbench' ? 'pb-2 lg:pb-4' : 'pb-32 lg:pb-8'} transition-colors duration-300 selection:bg-blue-500/20 antialiased ${theme.mainBg} ${theme.textMain}`}>
      <FactoryPolishStyle isDarkMode={isDarkMode} />
      {/* FactoryStock Desktop Sidebar */}
      <aside className="hidden lg:flex fixed left-0 top-0 bottom-0 z-30 w-72 bg-slate-950 text-white flex-col border-r border-white/10">
        <div className="p-6 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Icons.Package className="w-7 h-7" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-black tracking-tight truncate">MDEC Stock</h1>
              <p className="text-xs text-slate-400 font-bold truncate">Modern Inventory Center</p>
            </div>
          </div>
        </div>

        <nav className="flex-1 px-4 py-5 space-y-2 overflow-y-auto custom-scrollbar">
          <button type="button" onClick={() => openWorkspace('overview')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${activeWorkspace === 'overview' ? 'bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 font-black' : 'text-slate-300 hover:bg-white/8 hover:text-white font-bold'}`}>
            <Icons.Package className="w-5 h-5" /> ภาพรวมระบบ
          </button>
          <button type="button" onClick={() => openWorkspace('borrowReturn')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${activeWorkspace === 'borrowReturn' ? 'bg-gradient-to-r from-purple-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 font-black' : 'text-slate-300 hover:bg-white/8 hover:text-white font-bold'}`}>
            <Icons.UserPlus className="w-5 h-5" /> ยืม-คืนอุปกรณ์
          </button>
          {canUseOperationalTools && (
            <button type="button" onClick={() => openSelectionScanner({ camera: true })} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/8 hover:text-white transition-all text-left font-bold">
              <Icons.QrCode className="w-5 h-5" /> สแกน QR
            </button>
          )}
          <button type="button" onClick={() => openTrackingCenter('today')} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/8 hover:text-white transition-all text-left font-bold">
            <Icons.History className="w-5 h-5" /> ศูนย์ติดตาม
          </button>
          {canAddEditItems && (
            <button type="button" onClick={openAddItemForm} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/8 hover:text-white transition-all text-left font-bold">
              <Icons.Plus className="w-5 h-5" /> เพิ่มอุปกรณ์
            </button>
          )}
          <button type="button" onClick={() => openWorkspace('projects')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${activeWorkspace === 'projects' ? 'bg-gradient-to-r from-indigo-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 font-black' : 'text-slate-300 hover:bg-white/8 hover:text-white font-bold'}`}>
            <Icons.Folder className="w-5 h-5" /> โครงการจัดซื้อ
          </button>
          <button type="button" onClick={() => openWorkspace('organize')} className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl transition-all text-left ${activeWorkspace === 'organize' ? 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white shadow-lg shadow-blue-500/20 font-black' : 'text-slate-300 hover:bg-white/8 hover:text-white font-bold'}`}>
            <Icons.Layers className="w-5 h-5" /> กล่อง / เซ็ต / เตรียมของ
          </button>
          <button type="button" onClick={() => setShowProofCenterModal(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/8 hover:text-white transition-all text-left font-bold">
            <Icons.Camera className="w-5 h-5" /> หลักฐานรูปภาพ
          </button>
          <button type="button" onClick={() => setShowBorrowDocsModal(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/8 hover:text-white transition-all text-left font-bold">
            <Icons.Printer className="w-5 h-5" /> เอกสารย้อนหลัง
          </button>
          <button type="button" onClick={openControlCenter} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/8 hover:text-white transition-all text-left font-bold">
            <Icons.ViewGrid className="w-5 h-5" /> Control Center
          </button>

          <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
            {canManageSystem && (
              <button type="button" onClick={() => { setSettingsTab('categories'); setShowSettings(true); }} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/8 hover:text-white transition-all text-left font-bold">
                <Icons.Settings className="w-5 h-5" /> System Settings
              </button>
            )}
            <button type="button" onClick={() => setShowBackupCenterModal(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/8 hover:text-white transition-all text-left font-bold">
              <Icons.Database className="w-5 h-5" /> Backup / ปิดปี
            </button>
            <button type="button" onClick={() => setShowHelpModal(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-slate-300 hover:bg-white/8 hover:text-white transition-all text-left font-bold">
              <Icons.Alert className="w-5 h-5" /> คู่มือใช้งาน
            </button>
          </div>
        </nav>

        <div className="p-4 border-t border-white/10 space-y-3">
          <div className="rounded-2xl bg-white/5 border border-white/10 p-4">
            <div className="text-xs text-slate-400 mb-1 font-bold">สถานะระบบ</div>
            <div className="text-sm font-black text-emerald-300">● พร้อมใช้งาน {stats.available.toLocaleString('th-TH')} / {stats.all.toLocaleString('th-TH')}</div>
          </div>
          <button type="button" onClick={() => { setMyPinForm({ oldPin: '', newPin: '', confirmPin: '' }); setShowMyAccountModal(true); }} className="w-full px-4 py-3 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 font-bold transition-all text-left">
            👤 {currentAccountLabel}
          </button>
          <div className="grid grid-cols-2 gap-2">
            <button type="button" onClick={handleLockScreen} className="px-3 py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-slate-200 font-black transition-all">ล็อก</button>
            <button type="button" onClick={handleLogout} className="px-3 py-2.5 rounded-2xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 font-black transition-all">ออก</button>
          </div>
        </div>
      </aside>


      {firebaseError && (
        <div className="w-full mb-6 bg-rose-100 border-l-4 border-rose-500 text-rose-800 p-5 rounded-r-xl shadow-md flex items-start gap-4">
          <Icons.Alert className="w-8 h-8 shrink-0 text-rose-600" />
          <div>
            <h3 className="font-black text-xl mb-2 text-rose-700">🚨 ฐานข้อมูลถูกระงับ (Firebase Permission Denied)</h3>
            <p className="font-bold text-base mb-2">Systemไม่สามารถดึงข้อมูลจาก Firebase ของคุณได้ โปรดตรวจสอบการตั้งค่า Rules อีกครั้ง</p>
          </div>
        </div>
      )}

      {isInitialLoading && (
        <div className={`w-full mb-6 p-5 rounded-2xl shadow-sm border flex items-center gap-4 ${theme.cardBg}`}>
          <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center animate-pulse"><Icons.Package className="w-6 h-6" /></div>
          <div>
            <div className={`font-black text-lg ${theme.textTitle}`}>กำลังโหลดข้อมูลสต๊อก...</div>
            <div className={`text-sm font-bold ${theme.textMuted}`}>Systemกำลังดึงรายการอุปกรณ์และการตั้งค่าจาก Firebase</div>
          </div>
        </div>
      )}

      {/* FactoryStock-style Top Bar */}
      {activeWorkspace !== 'qrWorkbench' && (
      <div className="factory-topbar">
        <div className="factory-page-title">
          <div className="factory-kicker"><span className="factory-dot"></span>{currentWorkspaceMeta.kicker}</div>
          <h1>{currentWorkspaceMeta.title}</h1>
          <p>{currentWorkspaceMeta.desc} • {APP_VERSION}</p>
        </div>

        <div className="factory-top-actions">
          <div className="factory-chip">
            <Icons.CheckCircle className="w-4 h-4" /> {firebaseError ? 'ตรวจสอบระบบ' : 'ออนไลน์'}
          </div>

          <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className="factory-icon-btn" title={isDarkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดกลางคืน"}>
            {isDarkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
          </button>

          {isLoggedIn && (
            <>
              {canUseOperationalTools && (
                <button type="button" onClick={() => openSelectionScanner()} className="factory-ghost-btn" title="เปิดโหมดสแกน QR Code/Barcode">
                  <Icons.QrCode className="w-5 h-5" /><span>สแกน</span>
                </button>
              )}
              <button type="button" onClick={() => setShowCommandCenter(true)} className="factory-ghost-btn" title="Dashboard">
                <Icons.Monitor className="w-5 h-5" /><span className="hidden-mobile">Dashboard</span>
              </button>
              <button type="button" onClick={() => openWorkspace('borrowReturn')} className="factory-ghost-btn" title="ยืม-คืนอุปกรณ์">
                <Icons.UserPlus className="w-5 h-5" /><span className="hidden-mobile">ยืม-คืน</span>
              </button>
              <button type="button" onClick={() => openTrackingCenter('today')} className="factory-ghost-btn" title="ศูนย์ติดตาม">
                <Icons.History className="w-5 h-5" /><span>ติดตาม</span>
              </button>
              {canAddEditItems && (
                <button type="button" onClick={openAddItemForm} className="factory-primary-btn" title="เพิ่มอุปกรณ์ใหม่">
                  <Icons.Plus className="w-5 h-5" /><span>เพิ่มอุปกรณ์</span>
                </button>
              )}
              {canUseOperationalTools && (
                <button type="button" onClick={openControlCenter} className="factory-ghost-btn" title="Control Center">
                  <Icons.ViewGrid className="w-5 h-5" /><span>เพิ่มเติม</span>
                </button>
              )}
              {canManageSystem && (
                <button type="button" onClick={() => { setSettingsTab('categories'); setShowSettings(true); }} className="factory-ghost-btn" title="ตั้งค่าระบบ">
                  <Icons.Settings className="w-5 h-5" /><span>ตั้งค่า</span>
                </button>
              )}
              <button type="button" onClick={() => { setMyPinForm({ oldPin: '', newPin: '', confirmPin: '' }); setShowMyAccountModal(true); }} className="factory-ghost-btn" title={`เข้าสู่ระบบโดย ${currentAccountLabel}`}>
                👤 <span className="hidden sm:inline">{currentAccountLabel}</span>
              </button>
              <button type="button" onClick={handleLockScreen} className="factory-ghost-btn" title="ล็อกหน้าจอชั่วคราว">
                <Icons.Lock className="w-5 h-5" /><span className="hidden sm:inline">ล็อก</span>
              </button>
              <button type="button" onClick={handleLogout} className="factory-danger-btn" title="ออกจากระบบ">
                <Icons.Unlock className="w-5 h-5" /><span className="hidden sm:inline">ออก</span>
              </button>
            </>
          )}

          {!isAdmin && (
            <button type="button" onClick={() => setShowLogin(true)} className="factory-primary-btn">
              <Icons.Lock className="w-5 h-5" /><span>เข้าสู่ระบบจัดการ</span>
            </button>
          )}
        </div>
      </div>
      )}

      {activeWorkspace !== 'qrWorkbench' && isLoggedIn && (
        <div className={`w-full mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>👤</div>
            <div>
              <div className={`font-black ${theme.textTitle}`}>เข้าสู่Systemโดย: {currentAccountLabel}</div>
              <div className={`text-sm font-bold ${theme.textMuted}`}>สิทธิ์: {roleLabel(currentAccountRole)} • กด “ล็อก” เมื่อต้องออกจากโต๊ะชั่วคราว</div>
            </div>
          </div>
          <div className={`text-xs font-black px-3 py-2 rounded-xl border ${roleBadgeClass(currentAccountRole)}`}>{currentFullAccount?.username ? '@' + currentFullAccount.username : 'บัญชีภายใน'}</div>
        </div>
      )}

      {activeWorkspace !== 'overview' && renderActiveWorkspace()}

      {activeWorkspace === 'overview' && (
        <>

      {/* Control Center: รวมฟังก์ชันที่คล้ายกันให้เป็นหมวดใหญ่ */}
      {showMoreMenu && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden border ring-1 ring-white/10 ${isDarkMode ? 'bg-slate-900 border-slate-700 shadow-black/40' : 'bg-white border-white shadow-slate-200/80'}`}>
            <div className={`flex justify-between items-start gap-4 p-6 border-b ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                    <Icons.ViewGrid className="w-6 h-6" />
                  </div>
                  Control Center
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>รวมDaily Operations งานข้อมูล เอกสาร และSystemไว้เป็นหมวดแบบหลังบ้าน</p>
              </div>
              <button type="button" onClick={() => setShowMoreMenu(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-4 sm:p-6 overflow-y-auto custom-scrollbar max-h-[78vh] space-y-6">
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <div className={`font-black text-lg ${theme.textTitle}`}>มุมมองเมนู</div>
                  <p className={`text-sm font-bold ${theme.textMuted}`}>เลือกโหมดง่ายสำหรับDaily Operations หรือโหมดเต็มสำหรับผู้ดูแลSystem</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => updateUiMode('easy')} className={`px-4 py-2 rounded-xl font-black border ${uiMode === 'easy' ? 'bg-blue-600 text-white border-blue-600' : theme.btnSecondary}`}>โหมดง่าย</button>
                  <button type="button" onClick={() => updateUiMode('full')} className={`px-4 py-2 rounded-xl font-black border ${uiMode === 'full' ? 'bg-indigo-600 text-white border-indigo-600' : theme.btnSecondary}`}>เต็มSystem</button>
                </div>
              </div>

              <div className="more-menu-overview grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                  ['งานค้าง', overdueItems.length + currentBorrowedItems.length + currentEventItems.length, 'ติดตามยืม/ออกงาน'],
                  ['หลักฐาน', items.reduce((sum, item) => sum + (Array.isArray(item.history) ? item.history.reduce((s, h) => s + (Array.isArray(h.proofs) ? h.proofs.length : 0), 0) : 0), 0), 'รูปหลักฐานทั้งหมด'],
                  ['โครงการ', projectStats.length, 'จัดกลุ่มอุปกรณ์'],
                  ['กล่อง/เซ็ต', (settingsOptions.storageBoxes || []).length + (settingsOptions.bundles || []).length, 'จัดเก็บและจัดชุด']
                ].map(([label, value, desc]) => (
                  <div key={label} className={`p-4 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <div className={`text-xs font-black ${theme.textMuted}`}>{label}</div>
                    <div className={`text-2xl font-black mt-1 ${theme.textTitle}`}>{Number(value || 0).toLocaleString('th-TH')}</div>
                    <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{desc}</div>
                  </div>
                ))}
              </div>

              <div>
                <h4 className={`font-black mb-3 flex items-center gap-2 ${theme.textTitle}`}><Icons.History className="w-5 h-5 text-sky-500" /> Daily Operations</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button type="button" onClick={() => { setShowMoreMenu(false); openTrackingCenter('today'); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.History className="w-5 h-5" /> ศูนย์ติดตามงาน</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ติดตามยืม/คืน/ออกงาน</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); openSelectionScanner({ camera: true }); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.QrCode className="w-5 h-5" /> โหมดสแกนเร็ว</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>สแกนเพื่อเลือกอุปกรณ์</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setProofCenterFilter('all'); setProofCenterSearch(''); setShowProofCenterModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Camera className="w-5 h-5" /> หลักฐานรูปภาพ</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดูและจัดการรูปหลักฐาน</p>
                  </button>
                </div>
              </div>

              <div>
                <h4 className={`font-black mb-3 flex items-center gap-2 ${theme.textTitle}`}><Icons.Folder className="w-5 h-5 text-cyan-500" /> จัดเก็บและจัดชุดอุปกรณ์</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button type="button" onClick={() => openWorkspace('organize')} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Folder className="w-5 h-5" /> กล่องเก็บของ</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>จัดกล่องและฉลาก</p>
                  </button>
                  <button type="button" onClick={() => openWorkspace('organize')} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Layers className="w-5 h-5" /> เซ็ตอุปกรณ์</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>จัดเซ็ตใช้งานร่วมกัน</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowPrepListsModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.ClipboardList className="w-5 h-5" /> รายการเตรียมของ</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เตรียมรายการออกงาน</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowPersonalItemsModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Tag className="w-5 h-5" /> ของส่วนตัว</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>แยกอุปกรณ์ตามเจ้าของ</p>
                  </button>
                  <button type="button" onClick={() => openWorkspace('projects')} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Database className="w-5 h-5" /> โครงการ</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>จัดกลุ่มตามแหล่งที่มา</p>
                  </button>
                  {isFullMode && canUseOperationalTools && (
                    <button type="button" onClick={() => { setShowMoreMenu(false); setShowStockCountModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                      <div className="font-black text-lg flex items-center gap-2"><Icons.QrCode className="w-5 h-5" /> ตรวจนับสต๊อก</div>
                      <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เดินสแกน QR เทียบของจริงกับSystem</p>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h4 className={`font-black mb-3 flex items-center gap-2 ${theme.textTitle}`}><Icons.Printer className="w-5 h-5 text-indigo-500" /> Documents & Labels</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowPrintModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.QrCode className="w-5 h-5" /> QR / สติ๊กเกอร์อุปกรณ์</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>พิมพ์ QR/ฉลาก</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowBoxLabelPrintModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Folder className="w-5 h-5" /> ฉลากกล่อง</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>พิมพ์ฉลากกล่องพร้อมโลโก้ MDEC</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setSettingsTab('documents'); setShowSettings(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Settings className="w-5 h-5" /> ตั้งค่าเอกสาร/โลโก้</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เปิด/ปิดโลโก้ ลายน้ำ และโหมดประหยัดหมึก</p>
                  </button>
                </div>
              </div>

              <div>
                <h4 className={`font-black mb-3 flex items-center gap-2 ${theme.textTitle}`}><Icons.Monitor className="w-5 h-5 text-emerald-500" /> Systemและรายงาน</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowMonthlyReportModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.ClipboardList className="w-5 h-5" /> รายงานประจำเดือน</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>สรุปการยืม คืน ออกงาน และหลักฐาน</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowSystemHealthModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Alert className="w-5 h-5" /> ตรวจสุขภาพSystem</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดูพื้นที่ฐานข้อมูล รูปหลักฐาน และสถานะSystem</p>
                  </button>
                  {canManageSystem && (
                    <button type="button" onClick={() => { setShowMoreMenu(false); setShowBackupCenterModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                      <div className="font-black text-lg flex items-center gap-2"><Icons.Database className="w-5 h-5" /> ศูนย์สำรองข้อมูล</div>
                      <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>JSON / Google Sheets CSV / HTML รูปหลักฐาน</p>
                    </button>
                  )}
                  {isFullMode && canViewAudit && (
                    <button type="button" onClick={() => { setShowMoreMenu(false); setShowAuditModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                      <div className="font-black text-lg flex items-center gap-2"><Icons.History className="w-5 h-5" /> ประวัติการทำงาน</div>
                      <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>Audit log ของSystem</p>
                    </button>
                  )}
                  {isFullMode && canManageSystem && (
                    <button type="button" onClick={() => { setShowMoreMenu(false); setShowTrashModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                      <div className="font-black text-lg flex items-center gap-2"><Icons.Trash className="w-5 h-5" /> ถังขยะ</div>
                      <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>กู้คืนอุปกรณ์ที่ลบผิด</p>
                    </button>
                  )}
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowHelpModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-md ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.ClipboardList className="w-5 h-5" /> คู่มือใช้งาน</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>สรุปวิธีใช้เว็บแบบสั้น ๆ</p>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* แจ้งเตือนของเลยกำหนดคืน */}
      {overdueItems.length > 0 && (
        <div className={`w-full mb-8 border-l-4 p-5 rounded-r-2xl shadow-md flex items-start gap-4 animate-[pulse_2s_ease-in-out_infinite] ${isDarkMode ? 'bg-rose-900/30 border-rose-500 text-rose-300' : 'bg-rose-100 border-rose-500 text-rose-800'}`}>
          <div className={isDarkMode ? 'text-rose-400' : 'text-rose-500'}><Icons.Alert className="w-6 h-6" /></div>
          <div>
            <h3 className={`font-black text-xl mb-1 ${isDarkMode ? 'text-rose-400' : 'text-rose-800'}`}>⚠️ แจ้งเตือน: มีอุปกรณ์เลยกำหนดคืน {overdueItems.length} รายการ!</h3>
            <p className={`font-medium ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>โปรดตรวจสอบรายการที่มีแถบสีแดงในตาราง หรือทวงถามผู้ยืม</p>
          </div>
        </div>
      )}


      {/* ⚡ Daily Quick Actions */}
      <div className={`w-full mb-5 rounded-[1.5rem] border shadow-sm overflow-hidden relative ${theme.cardBg}`}>
        <div className={`relative p-4 sm:p-5 border-b overflow-hidden ${theme.divide}`}>
          <div className={`absolute inset-0 pointer-events-none ${isDarkMode ? 'bg-slate-950' : 'bg-slate-50/40'}`}></div>
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className={`text-xs font-black tracking-[0.22em] uppercase ${isDarkMode ? 'text-blue-300' : 'text-blue-600'}`}>STOCK OPERATIONS</div>
              <h2 className={`text-lg sm:text-xl font-black mt-1 tracking-tight ${theme.textTitle}`}>ศูนย์ปฏิบัติงานสต็อก</h2>
              <p className={`text-sm sm:text-base font-bold mt-1 ${theme.textMuted}`}>สแกน ค้นหา ยืม-คืน และติดตามงานจากจุดเดียว เหมาะกับใช้งานจริงในศูนย์</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <div className={`text-xs font-black px-3 py-2 rounded-full border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                {APP_VERSION}
              </div>
              <div className={`text-xs font-black px-3 py-2 rounded-full border ${isDarkMode ? 'bg-emerald-950/50 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700'}`}>
                พร้อมใช้ {stats.available.toLocaleString('th-TH')}/{stats.all.toLocaleString('th-TH')}
              </div>
            </div>
          </div>
        </div>

        <div className="p-4 sm:p-5 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-2.5">
          {canUseOperationalTools && (
            <button type="button" onClick={() => openSelectionScanner()} className={`group relative overflow-hidden p-4 rounded-2xl text-left border shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all ${isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-900 border-slate-900 text-white'}`}>
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3"><Icons.QrCode className="w-5 h-5" /></div>
              <div className="font-black text-lg">สแกน QR</div>
              <div className="text-xs font-bold text-white/80 mt-1">ค้นหา/ทำรายการเร็ว</div>
            </button>
          )}
          {canAddEditItems && (
            <button type="button" onClick={openAddItemForm} className={`group p-4 rounded-2xl text-left border shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}>
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-3"><Icons.Plus className="w-5 h-5" /></div>
              <div className="font-black text-lg">เพิ่มอุปกรณ์</div>
              <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>ของใหม่เข้าSystem</div>
            </button>
          )}
          <button type="button" onClick={() => openTrackingCenter('today')} className={`group p-4 rounded-2xl text-left border shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all ${isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3"><Icons.CheckCircle className="w-5 h-5" /></div>
            <div className="font-black text-lg">ศูนย์ติดตามงาน</div>
            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>วันนี้ / ต้องจัดการ</div>
          </button>
          <button type="button" onClick={() => setShowQuickReturnModal(true)} className={`group p-4 rounded-2xl text-left border shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all ${isDarkMode ? 'bg-purple-950/40 border-purple-800 text-purple-200' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-3"><Icons.Users className="w-5 h-5" /></div>
            <div className="font-black text-lg">ติดตามของรอคืน</div>
            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>ดูตามผู้ยืม/งาน</div>
          </button>
          <button type="button" onClick={() => { setProofCenterFilter('all'); setProofCenterSearch(''); setShowProofCenterModal(true); }} className={`group p-4 rounded-2xl text-left border shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all ${isDarkMode ? 'bg-pink-950/40 border-pink-800 text-pink-200' : 'bg-pink-50 border-pink-100 text-pink-700'}`}>
            <div className="w-10 h-10 rounded-2xl bg-pink-600 text-white flex items-center justify-center mb-3"><Icons.Camera className="w-5 h-5" /></div>
            <div className="font-black text-lg">หลักฐานรูปภาพ</div>
            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>รวมรูปทุกอุปกรณ์</div>
          </button>
        </div>

        <div className={`px-4 sm:px-5 pb-4 sm:pb-5 grid grid-cols-2 lg:grid-cols-4 gap-2.5`}>
          {[
            ['ต้องคืนวันนี้', dueTodayItems.length, 'emerald', () => openTrackingCenter('today')],
            ['เลยกำหนดคืน', overdueItems.length, 'rose', () => openTrackingCenter('issues')],
            ['รายการเตรียมของวันนี้', prepTodayLists.length, 'blue', () => setShowPrepListsModal(true)],
            ['ของที่ต้องจัดการ', dailyIssueItems.length, 'amber', () => { setQuickProblemOnly(true); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }]
          ].map(([label, value, tone, action]) => {
            const cls = {
              emerald: isDarkMode ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-700',
              rose: isDarkMode ? 'bg-rose-950/30 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-100 text-rose-700',
              blue: isDarkMode ? 'bg-blue-950/30 border-blue-800 text-blue-300' : 'bg-white border-slate-200 text-slate-700',
              amber: isDarkMode ? 'bg-amber-950/30 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-100 text-amber-700'
            }[tone];
            return (
              <button key={label} type="button" onClick={action} className={`p-3.5 rounded-2xl border text-left hover:-translate-y-0.5 transition-all shadow-sm ${cls}`}>
                <div className="text-3xl font-black leading-none">{Number(value || 0).toLocaleString('th-TH')}</div>
                <div className="text-xs sm:text-sm font-black mt-2">{label}</div>
              </button>
            );
          })}
        </div>
      </div>


      {/* 📊 Factory Stock Metrics */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 mb-6">
        {[
          ['ทั้งหมด', stats.all, 'blue', '📦', 'จากข้อมูลทั้งหมด'],
          ['พร้อมใช้', stats.available, 'emerald', '✅', 'พร้อมหยิบใช้งาน'],
          ['กำลังใช้งาน', stats.inUse, 'amber', '⚙️', 'กำลังใช้งานอยู่'],
          ['ถูกยืม', stats.borrowed, 'purple', '📤', 'รอรับคืน'],
          ['ออกงาน', stats.outForEvent, 'orange', '🚚', 'อยู่นอกศูนย์'],
          ['ซ่อม/ชำรุด', stats.maintenance, 'rose', '🛠️', 'ต้องติดตาม']
        ].map(([label, value, tone, emoji, caption]) => {
          const toneMap = {
            blue: isDarkMode ? 'bg-slate-900 border-slate-800 text-blue-300' : 'bg-white border-slate-200 text-blue-600',
            emerald: isDarkMode ? 'bg-slate-900 border-slate-800 text-emerald-300' : 'bg-white border-slate-200 text-emerald-600',
            amber: isDarkMode ? 'bg-slate-900 border-slate-800 text-amber-300' : 'bg-white border-slate-200 text-amber-600',
            purple: isDarkMode ? 'bg-slate-900 border-slate-800 text-purple-300' : 'bg-white border-slate-200 text-purple-600',
            orange: isDarkMode ? 'bg-slate-900 border-slate-800 text-orange-300' : 'bg-white border-slate-200 text-orange-600',
            rose: isDarkMode ? 'bg-slate-900 border-slate-800 text-rose-300' : 'bg-white border-slate-200 text-rose-600'
          };
          return (
            <div key={label} className={`relative overflow-hidden p-4 rounded-2xl border shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md ${toneMap[tone]}`}>
              <div className="absolute -right-3 -top-3 text-6xl opacity-10 font-black">{emoji}</div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`font-black text-xs sm:text-sm tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
                  <div className="text-3xl sm:text-4xl font-black mt-1 leading-none">{Number(value || 0).toLocaleString('th-TH')}</div>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm ${isDarkMode ? 'bg-white/5' : 'bg-white'}`}>{emoji}</div>
              </div>
              <div className={`mt-3 text-[11px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{caption}</div>
            </div>
          );
        })}
      </div>

      {/* ส่วนสรุปหมวดหมู่แบบยุบได้ */}
      <div className={`w-full mb-6 rounded-2xl border shadow-sm overflow-hidden ${theme.cardBg}`}>
        <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${showCategorySummary ? `border-b ${theme.divide}` : ''}`}>
          <div className="min-w-0">
            <div className={`font-black text-xl ${theme.textTitle}`}>สรุปหมวดหมู่</div>
            <div className={`text-sm font-bold ${theme.textMuted}`}>
              {categoryStats.length.toLocaleString('th-TH')} หมวดหมู่ • พร้อมใช้ {stats.available.toLocaleString('th-TH')} / {stats.all.toLocaleString('th-TH')} ชิ้น
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => setShowEmptyCategories(!showEmptyCategories)} className={`px-4 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>
              {showEmptyCategories ? 'ซ่อนหมวดว่าง' : 'รวมหมวดว่าง'}
            </button>
            <button type="button" onClick={() => setShowCategorySummary(!showCategorySummary)} className={`px-4 py-2 rounded-xl text-sm font-black border ${showCategorySummary ? 'bg-blue-600 text-white border-blue-600' : theme.btnSecondary}`}>
              {showCategorySummary ? 'ซ่อนรายละเอียดหมวดหมู่' : 'ดูรายละเอียดหมวดหมู่'}
            </button>
          </div>
        </div>

        {!showCategorySummary ? (
          <div className="px-5 pb-5">
            <div className={`w-full h-3 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
              <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full" style={{ width: `${stats.all === 0 ? 0 : Math.round((stats.available / stats.all) * 100)}%` }}></div>
            </div>
            <div className={`mt-3 flex flex-wrap gap-2 text-xs font-black ${theme.textMuted}`}>
              {categoryStats.filter(c => c.data.total > 0).slice(0, 6).map(c => (
                <span key={c.label} className={`px-3 py-1.5 rounded-full border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {c.label}: {c.data.available}/{c.data.total}
                </span>
              ))}
              {categoryStats.filter(c => c.data.total > 0).length > 6 && (
                <span className={`px-3 py-1.5 rounded-full border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  +{categoryStats.filter(c => c.data.total > 0).length - 6} หมวด
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categoryStats.map(c => (
              <div key={c.label} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-start gap-3 mb-2">
                  <span className={`font-black text-base truncate ${theme.textTitle}`} title={c.label}>{c.label}</span>
                  <span className={`text-xs font-black px-2 py-1 rounded-lg shrink-0 ${isDarkMode ? 'bg-emerald-900/40 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                    {c.data.available}/{c.data.total}
                  </span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>
                  <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${c.data.total === 0 ? 0 : (c.data.available / c.data.total) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Filters & Search */}
      <div className={`w-full flex flex-col gap-4 ${panelPaddingClass} rounded-[1.5rem] shadow-sm border mb-5 transition-colors ${theme.cardBg}`}>
        <div className="flex flex-col lg:flex-row gap-3 items-stretch lg:items-center w-full">
          <div className="relative flex-1 w-full">
            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${theme.textMuted}`}><Icons.Search className="w-5 h-5" /></div>
            <input
              type="text"
              className={`w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold outline-none transition-all border ${theme.input}`}
              placeholder="ค้นหาอุปกรณ์ / S.N. / ห้อง / โครงการ / เจ้าของ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 lg:flex gap-2 w-full lg:w-auto">
            <button
              type="button"
              onClick={() => setShowFilterModal(true)}
              className={`px-4 ${controlPaddingClass} rounded-xl font-black border transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${activeFilterCount > 0 ? 'bg-blue-600 text-white border-blue-600 shadow-md' : theme.btnSecondary}`}
            >
              <Icons.Settings className="w-5 h-5" />
              ตัวกรอง{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
            </button>
            {hasActiveFilters && (
              <button type="button" onClick={clearAllFilters} className={`px-4 ${controlPaddingClass} rounded-xl font-black border transition-colors whitespace-nowrap ${theme.btnSecondary}`}>ล้างตัวกรอง</button>
            )}
            {canAddEditItems && (
              <button
                type="button"
                onClick={openAddItemForm}
                className={`col-span-2 lg:col-span-1 flex items-center justify-center gap-2 px-6 ${controlPaddingClass} font-black rounded-xl shadow-md transition-colors text-lg whitespace-nowrap ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}
              >
                <Icons.Plus className="w-5 h-5" /> เพิ่มอุปกรณ์
              </button>
            )}
          </div>
        </div>

        {activeFilterChips.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {activeFilterChips.map(chip => (
              <button
                key={chip.id}
                type="button"
                onClick={chip.clear}
                className={`px-3 py-2 rounded-full border text-xs sm:text-sm font-black flex items-center gap-2 ${isDarkMode ? 'bg-blue-950/35 border-blue-800 text-blue-200 hover:bg-blue-900' : 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100'}`}
                title="กดเพื่อลบตัวกรองนี้"
              >
                {chip.label}<span className="opacity-70">×</span>
              </button>
            ))}
          </div>
        )}

        <div className={`rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <div className={`px-4 py-3 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${theme.divide}`}>
            <div className={`font-black ${theme.textTitle}`}>
              ฝ่าย / แผนก <span className={`text-xs font-bold ${theme.textMuted}`}>{filterDept === 'all' ? 'ทั้งหมด' : filterDept}</span>
            </div>
            <div className={`text-xs font-bold ${theme.textMuted}`}>
              เลือก “ห้องประชุม” แล้วSystemจะแยกอุปกรณ์ตามห้องให้อัตโนมัติ
            </div>
          </div>
          <div className="p-3 flex gap-2 overflow-x-auto w-full custom-scrollbar">
            <button
              type="button"
              onClick={() => { setFilterDept('all'); setShowRoomView(false); }}
              className={`flex items-center justify-center gap-2 whitespace-nowrap px-5 py-3 rounded-xl font-black transition-all border ${filterDept === 'all' ? (isDarkMode ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-800 border-slate-800 text-white shadow-md') : theme.btnSecondary}`}
            >
              ทั้งหมด <Icons.ViewGrid className="w-5 h-5" />
            </button>
            {DEPARTMENTS.map(d => {
              const IconComponent = Icons[d.iconName];
              return (
                <button
                  type="button"
                  key={d.id}
                  onClick={() => { setFilterDept(d.id); if (d.id !== 'ห้องประชุม') setShowRoomView(false); }}
                  className={`flex items-center justify-center gap-2 whitespace-nowrap px-5 py-3 rounded-xl font-black transition-all border ${filterDept === d.id ? (isDarkMode ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-blue-600 border-blue-600 text-white shadow-md') : theme.btnSecondary}`}
                >
                  {d.label} {IconComponent && <IconComponent className="w-5 h-5" />}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Filter Modal */}
      {showFilterModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[92vh] border ${theme.cardBg}`}>
            <div className={`p-5 border-b flex items-start justify-between gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl sm:text-3xl font-black flex items-center gap-2 ${theme.textTitle}`}><Icons.Settings className="w-7 h-7 text-blue-500" /> ตัวกรองข้อมูล</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>รวมตัวกรองทั้งหมดไว้ที่นี่ หน้าแรกจะได้โล่ง และมือถือกดง่าย</p>
              </div>
              <button type="button" onClick={() => setShowFilterModal(false)} className={`p-2 rounded-xl hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className={`block text-sm font-black mb-2 ${theme.textMuted}`}>สถานที่ / ห้อง</label>
                  <select className={`w-full px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                    <option value="all">สถานที่/ห้อง ทั้งหมด</option>
                    {(settingsOptions.locations || []).filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-black mb-2 ${theme.textMuted}`}>หมวดหมู่</label>
                  <select className={`w-full px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                    <option value="all">หมวดหมู่ทั้งหมด</option>
                    {(settingsOptions.categories || []).filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-black mb-2 ${theme.textMuted}`}>สถานะใช้งาน</label>
                  <select className={`w-full px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                    <option value="all">สถานะทั้งหมด</option>
                    {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-black mb-2 ${theme.textMuted}`}>โครงการ</label>
                  <div className="flex gap-2">
                    <select className={`flex-1 px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                      <option value="all">โครงการทั้งหมด</option>
                      {projectOptions.filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <button type="button" onClick={() => { setShowFilterModal(false); openWorkspace('projects'); }} className="px-4 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black whitespace-nowrap">จัดการ</button>
                  </div>
                </div>
                <div>
                  <label className={`block text-sm font-black mb-2 ${theme.textMuted}`}>สถานะพัสดุ</label>
                  <select className={`w-full px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterAssetStatus} onChange={e => setFilterAssetStatus(e.target.value)}>
                    <option value="all">สถานะพัสดุทั้งหมด</option>
                    {ASSET_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={`block text-sm font-black mb-2 ${theme.textMuted}`}>QR Code</label>
                  <select className={`w-full px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterQrTagged} onChange={e => setFilterQrTagged(e.target.value)}>
                    <option value="all">QR ทั้งหมด</option>
                    <option value="tagged">ติด QR แล้ว</option>
                    <option value="untagged">ยังไม่ติด QR</option>
                  </select>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <label className="flex items-center gap-3 cursor-pointer">
                  <input type="checkbox" className="w-5 h-5 accent-rose-600" checked={!!quickProblemOnly} onChange={e => setQuickProblemOnly(e.target.checked)} />
                  <span className={`font-black ${theme.textTitle}`}>แสดงเฉพาะของที่ต้องจัดการ</span>
                </label>
                <p className={`text-xs font-bold mt-2 ${theme.textMuted}`}>เช่น ของเลยกำหนดคืน อยู่ระหว่างซ่อม ยังไม่ติด QR หรือข้อมูลไม่ครบ</p>
              </div>

              {hasActiveFilters && (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-blue-950/25 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                  <div className="font-black">กำลังใช้ตัวกรอง {activeFilterCount} รายการ</div>
                  <button type="button" onClick={clearAllFilters} className={`px-4 py-2 rounded-xl border font-black ${theme.btnSecondary}`}>ล้างตัวกรองทั้งหมด</button>
                </div>
              )}
            </div>

            <div className={`p-4 border-t grid grid-cols-2 gap-3 ${theme.divide}`}>
              <button type="button" onClick={() => setShowFilterModal(false)} className={`py-3 rounded-xl font-black ${theme.btnCancel}`}>ปิด</button>
              <button type="button" onClick={() => setShowFilterModal(false)} className="py-3 rounded-xl font-black bg-blue-600 hover:bg-blue-500 text-white">ใช้ตัวกรอง</button>
            </div>
          </div>
        </div>
      )}

      {/* 🏫 Meeting Room Department Group View */}
      {(showRoomView || filterDept === 'ห้องประชุม') && (
        <div className={`w-full rounded-[1.75rem] shadow-xl border overflow-hidden relative transition-colors mb-8 ${theme.cardBg}`}>
          <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${theme.divide}`}>
            <div>
              <div className={`font-black text-xl ${theme.textTitle}`}>ฝ่ายห้องประชุม: แยกตามห้อง</div>
              <div className={`text-sm font-bold ${theme.textMuted}`}>พบ {roomGroups.length.toLocaleString('th-TH')} ห้องประชุม/สถานที่ • {roomGroups.reduce((sum, room) => sum + room.total, 0).toLocaleString('th-TH')} รายการในฝ่ายห้องประชุม</div>
            </div>
            <button type="button" onClick={() => { setShowRoomView(false); if (filterDept === 'ห้องประชุม') setFilterDept('all'); }} className={`px-4 py-2 rounded-xl border font-black ${theme.btnSecondary}`}>กลับรายการทั้งหมด</button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {roomGroups.length === 0 ? (
              <div className={`rounded-2xl border p-10 text-center font-black ${theme.textMuted}`}>ไม่พบอุปกรณ์ในฝ่ายห้องประชุมตามเงื่อนไขนี้</div>
            ) : roomGroups.map((room) => {
              const expanded = expandedRooms[room.name] !== false;
              return (
                <div key={room.name} className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                    <button type="button" onClick={() => toggleRoomExpanded(room.name)} className="text-left min-w-0 flex-1">
                      <div className={`font-black text-xl ${theme.textTitle}`}>{expanded ? '▾' : '▸'} {room.name}</div>
                      <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>
                        ทั้งหมด {room.total} • พร้อมใช้ {room.available} • ยืม {room.borrowed} • ออกงาน {room.event} • ซ่อม {room.maintenance}
                      </div>
                    </button>
                    <div className="flex flex-wrap gap-2">
                      <button type="button" onClick={() => setFilterLocation(room.name)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>ดูเฉพาะห้องนี้</button>
                      <button type="button" onClick={() => { setSelectedItems(room.items.map(i => i.id)); setShowPrintModal(true); }} className="px-3 py-2 rounded-xl text-sm font-black bg-blue-600 text-white">พิมพ์ QR ห้องนี้</button>
                    </div>
                  </div>

                  {expanded && (
                    <div className="p-4 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
                      {room.items.map((item) => {
                        const statusInfo = STATUSES.find(s => s.id === item.status) || STATUSES[0];
                        return (
                          <div key={item.id} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <div className={`font-black text-lg truncate ${theme.textTitle}`}>{item.name}</div>
                                <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>S.N. {item.sn || '-'} • {item.category || '-'}</div>
                                {normalizeProjectName(item.project) && <div className={`text-xs font-black mt-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>🗂️ {normalizeProjectName(item.project)}</div>}
                              </div>
                              <span className={`px-2 py-1 rounded-lg text-xs font-black border shrink-0 ${isDarkMode ? statusInfo.darkColor : statusInfo.color}`}>{statusInfo.label}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 mt-3">
                              <button type="button" onClick={() => setShowHistory(item.id)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>รายละเอียด</button>
                              {canAddEditItems && <button type="button" onClick={() => openItemEditor(item)} className="px-3 py-2 rounded-xl text-sm font-black bg-blue-600 text-white">แก้ไข</button>}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {!(showRoomView || filterDept === 'ห้องประชุม') && (
        <>
      {/* 📋 Table / List */}
      <div className={`w-full rounded-[2rem] shadow-2xl border overflow-hidden relative transition-colors ${theme.cardBg}`}>
        <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${theme.divide}`}>
          <div>
            <div className={`font-black text-xl ${theme.textTitle}`}>รายการอุปกรณ์</div>
            <div className={`text-sm font-bold ${theme.textMuted}`}>พบ {filteredItems.length.toLocaleString('th-TH')} รายการ • เลือกแล้ว {selectedItems.length.toLocaleString('th-TH')} รายการ</div>
          </div>
          <div className={`text-xs font-black px-3 py-2 rounded-full border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>{mobileCardsEnabled ? 'Clean List / Mobile Cards' : 'Premium Table View'}</div>
        </div>

        {mobileCardsEnabled && (
          <div className={`lg:hidden ${isCompactUi ? 'p-3' : 'p-4'} space-y-3`}>
            {filteredItems.length === 0 ? (
              <div className={`rounded-2xl border p-8 text-center font-bold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                <Icons.Search className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <div className="text-lg font-black">ไม่พบอุปกรณ์ที่ค้นหา</div>
                <div className="text-sm mt-1">ลองล้างตัวกรอง หรือค้นหาด้วย S.N. / ชื่อกล่อง / สถานที่</div>
                {hasActiveFilters && <button type="button" onClick={clearAllFilters} className="mt-3 px-4 py-2 rounded-xl bg-blue-600 text-white font-black text-sm">ล้างตัวกรองทั้งหมด</button>}
              </div>
            ) : filteredItems.map((item, index) => {
              const deptInfo = DEPARTMENTS.find(d => d.id === item.department) || DEPARTMENTS[0];
              const statusInfo = STATUSES.find(s => s.id === item.status) || STATUSES[0];
              const isBorrowed = item.status === 'borrowed';
              const isEvent = item.status === 'out-for-event';
              const qty = Number(item.quantity) || 1;
              const proofCount = getItemProofCount(item);
              const missingLabels = getMissingDataLabels(item);
              const isOverdue = (isBorrowed || isEvent) && item.expectedReturn && new Date(item.expectedReturn).getTime() < todayMs;
              const canSelectThis = item.status === 'available' || isBorrowed || isEvent;
              return (
                <div key={`mobile_${item.id}_${index}`} className={`stock-mobile-card rounded-3xl border shadow-sm overflow-hidden ${isOverdue ? (isDarkMode ? 'bg-rose-950/30 border-rose-800' : 'bg-rose-50 border-rose-200') : (isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}`}>
                  <div className={`p-4 ${isOverdue ? 'border-l-4 border-rose-500' : isEvent ? 'border-l-4 border-orange-400' : isBorrowed ? 'border-l-4 border-purple-400' : item.status === 'maintenance' ? 'border-l-4 border-rose-700' : 'border-l-4 border-blue-200'}`}>
                    <div className="flex items-start gap-3">
                      {canUseOperationalTools && (
                        <div className="stock-mobile-select-col">
                        <input
                          type="checkbox"
                          className="stock-check mt-1 shrink-0"
                          checked={selectedItems.includes(item.id)}
                          disabled={!canSelectThis}
                          onChange={() => setSelectedItems(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                        />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <div className={`font-black text-lg leading-tight ${theme.textTitle}`}>{item.name}</div>
                        <div className={`mt-1 text-xs font-bold ${theme.textMuted}`}>
                          {item.sn ? `S.N. ${item.sn}` : 'ไม่มี S.N.'} • {item.category || '-'} • {item.location || '-'}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${isDarkMode ? statusInfo.darkColor : statusInfo.color}`}>{statusInfo.label}</span>
                          <span className={`mobile-secondary-chip inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? deptInfo.darkColor : deptInfo.color}`}>{deptInfo.label}</span>
                          {qty > 1 && <span className={`px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>x{qty}</span>}
                          {item.storageBoxName && <span className={`px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-cyan-900/40 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>📦 {item.storageBoxName}</span>}
                          {normalizeProjectName(item.project) && <button type="button" onClick={() => setFilterProject(normalizeProjectName(item.project))} className={`mobile-secondary-chip px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>🗂️ {normalizeProjectName(item.project)}</button>}
                          {item.assetStatus && item.assetStatus !== 'active' && <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${isDarkMode ? getAssetStatusInfo(item.assetStatus).darkColor : getAssetStatusInfo(item.assetStatus).color}`}>{getAssetStatusInfo(item.assetStatus).label}</span>}
                          {missingLabels.length > 0 && <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${isDarkMode ? 'bg-amber-950/35 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>ข้อมูลไม่ครบ {missingLabels.length}</span>}
                          {proofCount > 0 && <button type="button" onClick={() => { setProofCenterSearch(item.sn || item.name || ''); setProofCenterFilter('all'); setShowProofCenterModal(true); }} className={`px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-pink-900/40 text-pink-300' : 'bg-pink-50 text-pink-700'}`}>📷 {proofCount}</button>}
                          {isOverdue && <span className="px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white">เลยกำหนดคืน</span>}
                        </div>
                        {(isBorrowed || isEvent) && (
                          <div className={`mt-3 rounded-2xl border p-3 text-sm font-bold ${isOverdue ? (isDarkMode ? 'bg-rose-900/30 border-rose-800 text-rose-300' : 'bg-rose-100 border-rose-200 text-rose-700') : isEvent ? (isDarkMode ? 'bg-orange-900/30 border-orange-800 text-orange-300' : 'bg-orange-50 border-orange-100 text-orange-700') : (isDarkMode ? 'bg-purple-900/30 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-100 text-purple-700')}`}>
                            <div>{isEvent ? `ออกงาน: ${item.currentEvent || '-'}` : `ผู้ยืม: ${item.currentBorrower || '-'}`}</div>
                            <div className="text-xs mt-1 opacity-80">กำหนดคืน: {item.expectedReturn ? new Date(item.expectedReturn).toLocaleDateString('th-TH') : '-'}</div>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      <button type="button" onClick={() => setShowHistory(item.id)} className={`px-3 py-2.5 rounded-xl font-black text-sm border ${theme.btnSecondary}`}>รายละเอียด</button>
                      {canUseOperationalTools && item.status === 'available' && <button type="button" onClick={(e) => handleOpenRowBorrow(e, item)} className="px-3 py-2.5 rounded-xl font-black text-sm bg-purple-600 text-white">ยืม</button>}
                      {canUseOperationalTools && (isBorrowed || isEvent) && <button type="button" onClick={() => { setReturnData({ staff: '', newStaff: '' }); setReturnTargetIds([item.id]); setReturnChecklist([]); }} className="px-3 py-2.5 rounded-xl font-black text-sm bg-emerald-600 text-white">รับคืน</button>}
                      {canUseOperationalTools && item.status === 'available' && <button type="button" onClick={(e) => handleOpenRowEvent(e, item)} className="px-3 py-2.5 rounded-xl font-black text-sm bg-orange-500 text-white">ออกงาน</button>}
                      <details className={`col-span-2 rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                        <summary className={`list-none cursor-pointer px-3 py-2.5 rounded-xl font-black text-sm text-center ${theme.textTitle}`}>จัดการเพิ่มเติม</summary>
                        <div className="grid grid-cols-2 gap-2 p-2 pt-0">
                          <button type="button" onClick={() => copyItemSummary(item)} className={`px-3 py-2.5 rounded-xl font-black text-sm border ${theme.btnSecondary}`}>คัดลอก</button>
                          {canAddEditItems && <button type="button" onClick={() => openItemEditor(item)} className={`px-3 py-2.5 rounded-xl font-black text-sm border ${theme.btnSecondary}`}>แก้ไข</button>}
                          {canUseOperationalTools && <button type="button" onClick={() => openRepairForItem(item)} className={`col-span-2 px-3 py-2.5 rounded-xl font-black text-sm border ${isDarkMode ? 'bg-rose-900/30 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>แจ้งซ่อม/บันทึกปัญหา</button>}
                        </div>
                      </details>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div className="hidden lg:block overflow-x-auto custom-scrollbar">
          <table className="stock-table-compact w-full text-left border-collapse min-w-[980px]">
            <thead>
              <tr className={`border-b text-sm uppercase tracking-wide transition-colors ${theme.th}`}>
                {canUseOperationalTools && (
                  <th className="px-4 py-4 text-center w-14">
                    <input 
                      type="checkbox" 
                      className="stock-check" 
                      onChange={(e) => {
                        if(e.target.checked) setSelectedItems(selectableItems.map(i => i.id));
                        else setSelectedItems([]);
                      }}
                      disabled={selectableItems.length === 0}
                      checked={selectableItems.length > 0 && selectableItems.every(i => selectedItems.includes(i.id))}
                      title="เลือกรายการที่ทำได้ทั้งหมด"
                    />
                  </th>
                )}
                <th className="px-4 py-4 text-left font-bold pl-6">ชื่ออุปกรณ์ / รหัส</th>
                <th className="px-4 py-4 text-left font-bold">หมวดหมู่</th>
                <th className="px-4 py-4 text-left font-bold">ฝ่ายที่รับผิดชอบ</th>
                <th className="px-4 py-4 text-left font-bold">สถานที่ / ห้อง</th>
                <th className="px-4 py-4 text-left font-bold">สถานะ</th>
                <th className="px-4 py-4 text-center font-bold">ประวัติ / จัดการ</th>
              </tr>
            </thead>
            <tbody className={`divide-y transition-colors ${theme.divide}`}>
              {filteredItems.length === 0 ? (
                <tr><td colSpan={canUseOperationalTools ? 7 : 6} className={`px-4 py-12 text-center font-bold text-xl ${theme.textMuted}`}>
                  <div className="flex flex-col items-center gap-2">
                    <Icons.Search className="w-10 h-10 opacity-50" />
                    <div>ไม่พบอุปกรณ์ที่ค้นหา</div>
                    <div className="text-sm font-bold opacity-80">ลองล้างตัวกรอง หรือค้นหาด้วย S.N. / ชื่อกล่อง / สถานที่</div>
                    {hasActiveFilters && <button type="button" onClick={clearAllFilters} className="mt-2 px-4 py-2 rounded-xl bg-blue-600 text-white font-black text-sm">ล้างตัวกรองทั้งหมด</button>}
                  </div>
                </td></tr>
              ) : filteredItems.map((item, index) => {
                const deptInfo = DEPARTMENTS.find(d => d.id === item.department) || DEPARTMENTS[0];
                const statusInfo = STATUSES.find(s => s.id === item.status) || STATUSES[0];
                const isBorrowed = item.status === 'borrowed';
                const isEvent = item.status === 'out-for-event';
                const qty = Number(item.quantity) || 1;
                const proofCount = getItemProofCount(item);
                const missingLabels = getMissingDataLabels(item);
                
                const isOverdue = (isBorrowed || isEvent) && item.expectedReturn && new Date(item.expectedReturn).getTime() < todayMs;
                const rowBg = isOverdue ? (isDarkMode ? 'bg-rose-900/20 hover:bg-rose-900/40' : 'bg-rose-50 hover:bg-rose-100') : theme.trHover;
                const rowBorder = isOverdue ? 'border-l-4 border-l-rose-500' : isEvent ? 'border-l-4 border-l-orange-400' : isBorrowed ? 'border-l-4 border-l-purple-400' : item.status === 'maintenance' ? 'border-l-4 border-l-rose-700' : '';
                
                return (
                  <tr key={`${item.id}_${index}`} className={`group transition-all ${rowTextSizeClass} ${rowBg} ${rowBorder} hover:shadow-[inset_4px_0_0_rgba(59,130,246,0.45)]`}>

                    {canUseOperationalTools && (
                      <td className="stock-select-cell px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {(item.status === 'available' || isBorrowed || isEvent) ? (
                          <input 
                            type="checkbox" 
                            className="stock-check"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => {
                              setSelectedItems(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                            }}
                          />
                        ) : (
                          <div className="stock-check-disabled mx-auto" title="สถานะนี้ไม่สามารถทำรายการแบบกลุ่มได้"></div>
                        )}
                      </td>
                    )}

                    <td className="px-4 py-4 pl-6">
                      <div className={`stock-name-line ${theme.textTitle}`}>
                        <span className="stock-title">{item.name}</span> 
                        {qty > 1 && <span className={`text-base px-2 py-1 rounded-md ${isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'}`}>x{qty}</span>}
                        {item.owner && (
                           <span className={`text-sm px-2 py-1 rounded-md shadow-sm ${isDarkMode ? 'bg-fuchsia-900/40 text-fuchsia-400' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                             👤 ของส่วนตัว ({item.owner})
                           </span>
                        )}
                        {item.storageBoxName && (
                          <span className={`text-sm px-2 py-1 rounded-md shadow-sm ${isDarkMode ? 'bg-cyan-900/40 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>📦 {item.storageBoxName}</span>
                        )}
                        {item.project && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setFilterProject(item.project); }} className={`text-sm px-2 py-1 rounded-md shadow-sm ${isDarkMode ? 'bg-indigo-900/40 text-indigo-300 hover:bg-indigo-800' : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'}`}>🗂️ {item.project}</button>
                        )}
                        {item.assetStatus && item.assetStatus !== 'active' && (
                          <span className={`text-sm px-2 py-1 rounded-md shadow-sm border ${isDarkMode ? getAssetStatusInfo(item.assetStatus).darkColor : getAssetStatusInfo(item.assetStatus).color}`}>{getAssetStatusInfo(item.assetStatus).label}</span>
                        )}
                        {missingLabels.length > 0 && (
                          <span className={`text-sm px-2 py-1 rounded-md shadow-sm border ${isDarkMode ? 'bg-amber-950/35 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`} title={`ขาด: ${missingLabels.join(', ')}`}>ข้อมูลไม่ครบ {missingLabels.length}</span>
                        )}
                        {proofCount > 0 && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); setProofCenterSearch(item.sn || item.name || ''); setProofCenterFilter('all'); setShowProofCenterModal(true); }} className={`text-sm px-2 py-1 rounded-md shadow-sm ${isDarkMode ? 'bg-pink-900/40 text-pink-300 hover:bg-pink-800' : 'bg-pink-100 text-pink-700 hover:bg-pink-200'}`}>📷 {proofCount}</button>
                        )}
                        {item.qrTagged ? (
                          <span className={`text-sm px-2 py-1 rounded-md shadow-sm ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'}`}>QR ติดแล้ว</span>
                        ) : (
                          <span className={`text-sm px-2 py-1 rounded-md shadow-sm ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>ยังไม่ติด QR</span>
                        )}
                        {isOverdue && <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow-sm">เลยกำหนดคืน!</span>}
                      </div>
                      {item.sn && <div className={`stock-meta-line mt-1 font-mono ${theme.textMuted}`}>S.N.: {item.sn}</div>}
                      {(item.updatedBy || item.updatedAt) && <div className={`stock-meta-line mt-1 font-bold ${theme.textMuted}`}>แก้ไขล่าสุด: {item.updatedBy || '-'} {item.updatedAt ? `• ${new Date(item.updatedAt).toLocaleString('th-TH', { hour12: false })}` : ''}</div>}

                      {(isBorrowed || isEvent) && (
                        <div className={`text-base mt-2 p-2 rounded-lg border inline-block ${isOverdue ? (isDarkMode ? 'bg-rose-900/30 border-rose-800' : 'bg-rose-100 border-rose-200') : isEvent ? (isDarkMode ? 'bg-orange-900/30 border-orange-800' : 'bg-orange-50 border-orange-100') : (isDarkMode ? 'bg-purple-900/30 border-purple-800' : 'bg-purple-50 border-purple-100')}`}>
                          <div className="flex items-center gap-2">
                            {isEvent && <Icons.Truck className={`${isOverdue ? (isDarkMode ? 'text-rose-400' : 'text-rose-700') : (isDarkMode ? 'text-orange-400' : 'text-orange-700')}`} />}
                            <span className={`font-bold ${isOverdue ? (isDarkMode ? 'text-rose-400' : 'text-rose-700') : isEvent ? (isDarkMode ? 'text-orange-400' : 'text-orange-700') : (isDarkMode ? 'text-purple-400' : 'text-purple-700')}`}>
                              {isEvent ? `ออกงาน: ${item.currentEvent}` : `ผู้ยืม: ${item.currentBorrower}`}
                            </span> 
                            <span className={`${isOverdue ? (isDarkMode ? 'text-rose-600' : 'text-rose-300') : isEvent ? (isDarkMode ? 'text-orange-600' : 'text-orange-300') : (isDarkMode ? 'text-purple-600' : 'text-purple-300')}`}>|</span> 
                            <span className={`${isOverdue ? (isDarkMode ? 'text-rose-500 font-bold' : 'text-rose-600 font-bold') : theme.textMuted}`}>
                              คืน: {item.expectedReturn ? new Date(item.expectedReturn).toLocaleDateString('th-TH') : '-'}
                            </span>
                          </div>
                          {item.currentNote && (
                            <div className={`mt-1 text-sm italic font-medium ${isOverdue ? (isDarkMode ? 'text-rose-400/80' : 'text-rose-700/80') : isEvent ? (isDarkMode ? 'text-orange-400/80' : 'text-orange-700/80') : (isDarkMode ? 'text-purple-400/80' : 'text-purple-700/80')}`}>
                              * หมายเหตุ: {item.currentNote}
                            </div>
                          )}
                        </div>
                      )}
                    </td>
                    <td className={`px-4 py-4 font-bold ${theme.textMuted}`}>{item.category || '-'}</td>
                    <td className="px-4 py-4"><span className={`inline-block px-3 py-1.5 rounded-lg text-base font-bold ${isDarkMode ? deptInfo.darkColor : deptInfo.color}`}>{deptInfo.label}</span></td>
                    <td className={`px-4 py-4 font-bold ${theme.textMuted}`}>{item.location || '-'}</td>
                    <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-base font-bold border ${isDarkMode ? statusInfo.darkColor : statusInfo.color}`}><div className={`w-2 h-2 rounded-full currentColor`}></div>{statusInfo.label}</span></td>
                    
                    <td className="px-4 py-4">
                      <div className="flex items-center justify-center gap-2">
                        <button type="button" onClick={(e) => { e.stopPropagation(); setShowHistory(item.id); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${theme.btnCancel}`} title="ประวัติ"><Icons.History className="w-5 h-5" /></button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); copyItemSummary(item); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${theme.btnCancel}`} title="คัดลอกข้อมูลอุปกรณ์"><Icons.ClipboardList className="w-5 h-5" /></button>
                        {canUseOperationalTools && (
                          <button type="button" onClick={(e) => { e.stopPropagation(); openRepairForItem(item); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-rose-900/40 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`} title="แจ้งซ่อม/บันทึกปัญหา"><Icons.Alert className="w-5 h-5" /></button>
                        )}
                        
                        {canUseOperationalTools && (
                          <>
                            {item.status === 'available' && (
                              <>
                                <button type="button" onClick={(e) => handleOpenRowBorrow(e, item)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-purple-900/40 text-purple-400 hover:bg-purple-600 hover:text-white' : 'bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white'}`} title="ให้ยืม"><Icons.UserPlus className="w-5 h-5" /></button>

                                <button type="button" onClick={(e) => handleOpenRowEvent(e, item)} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-orange-900/40 text-orange-400 hover:bg-orange-600 hover:text-white' : 'bg-orange-50 text-orange-600 hover:bg-orange-600 hover:text-white'}`} title="นำออกงาน"><Icons.Truck className="w-5 h-5" /></button>
                              </>
                            )}
                            
                            {(isBorrowed || isEvent) && <button type="button" onClick={(e) => { 
                              e.stopPropagation(); 
                              setReturnData({ staff: '', newStaff: '' }); 
                              setReturnTargetIds([item.id]);
                              setReturnChecklist([]);
                            }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-600 hover:text-white' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white'}`} title="รับคืน"><Icons.CheckCircle className="w-5 h-5" /></button>}
                            
                            {canAddEditItems && <button type="button" onClick={(e) => { e.stopPropagation(); openItemEditor(item); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-blue-900/40 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`} title="แก้ไข"><Icons.Edit className="w-4 h-4" /></button>}
                            {canDeleteItems && <button type="button" onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-rose-900/40 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`} title="ลบ"><Icons.Trash className="w-4 h-4" /></button>}
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
        </>
      )}

        </>
      )}

      {/* 🛒 Bulk Selection Action Bar */}
      {canUseOperationalTools && selectedItems.length > 0 && (() => {
        const selectedActiveItems = selectedItems.map(id => items.find(item => item.id === id)).filter(Boolean);
        const availableCount = selectedActiveItems.filter(item => item.status === 'available').length;
        const returnableCount = selectedActiveItems.filter(item => item.status === 'borrowed' || item.status === 'out-for-event').length;
        const maintenanceCount = selectedActiveItems.filter(item => item.status === 'maintenance').length;
        const hasAvailable = availableCount > 0;
        const hasReturnable = returnableCount > 0;
        const singleSelectedItem = selectedActiveItems.length === 1 ? selectedActiveItems[0] : null;
        const selectionHint = [
          hasAvailable ? `${availableCount} พร้อมใช้` : '',
          hasReturnable ? `${returnableCount} รอคืน` : '',
          maintenanceCount ? `${maintenanceCount} ซ่อม/ชำรุด` : ''
        ].filter(Boolean).join(' • ');

        const secondaryButtonClass = `w-full px-4 py-3 rounded-2xl font-black text-sm border flex items-center gap-3 text-left transition-colors ${isDarkMode ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`;

        return (
          <div className="fixed inset-x-3 bottom-4 sm:bottom-6 lg:inset-x-auto lg:right-6 lg:bottom-6 lg:w-[390px] z-40 flex justify-center pointer-events-none">
            <div className={`pointer-events-auto w-full max-w-4xl lg:max-w-none rounded-[1.5rem] border shadow-[0_18px_55px_rgba(0,0,0,0.32)] p-3 sm:p-4 animate-[slideUp_0.3s_ease-out] ${isDarkMode ? 'bg-slate-950 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'}`}>
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3 shrink-0">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="bg-indigo-600 text-white font-black w-11 h-11 rounded-2xl flex items-center justify-center shadow-inner text-lg shrink-0">{selectedItems.length}</div>
                    <div className="min-w-0">
                      <div className={`font-black leading-tight ${theme.textTitle}`}>รายการที่เลือก</div>
                      <div className={`text-xs font-bold truncate ${theme.textMuted}`}>{selectionHint || 'พร้อมทำรายการแบบกลุ่ม'}</div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSelectedItems([])}
                    className={`lg:hidden w-10 h-10 rounded-2xl flex items-center justify-center border ${theme.btnSecondary}`}
                    title="ล้างการเลือก"
                  >
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-2 flex-1">
                  {singleSelectedItem && (
                    <button
                      type="button"
                      onClick={() => setShowHistory(singleSelectedItem.id)}
                      className={`px-4 py-3 rounded-2xl font-black shadow-md flex items-center justify-center gap-2 text-sm sm:text-base transition-colors border ${theme.btnSecondary}`}
                      title="ดูรายละเอียดอุปกรณ์ที่เลือก"
                    >
                      <Icons.History className="w-5 h-5" />
                      <span>รายละเอียด</span>
                    </button>
                  )}

                  {singleSelectedItem && canAddEditItems && (
                    <button
                      type="button"
                      onClick={() => openItemEditor(singleSelectedItem)}
                      className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-md flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
                      title="แก้ไขข้อมูลอุปกรณ์ที่เลือก"
                    >
                      <Icons.Edit className="w-5 h-5" />
                      <span>แก้ไข</span>
                    </button>
                  )}

                  {hasAvailable && (
                    <button
                      type="button"
                      onClick={handleOpenBatchBorrow}
                      className="px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black shadow-md flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
                      title={`ยืมเฉพาะรายการที่พร้อมใช้ ${availableCount} รายการ`}
                    >
                      <Icons.UserPlus className="w-5 h-5" />
                      <span>ยืม{availableCount > 1 ? ` ${availableCount}` : ''}</span>
                    </button>
                  )}

                  {hasAvailable && (
                    <button
                      type="button"
                      onClick={handleOpenBatchEvent}
                      className="px-4 py-3 rounded-2xl bg-orange-600 hover:bg-orange-500 text-white font-black shadow-md flex items-center justify-center gap-2 text-sm sm:text-base transition-colors"
                      title={`ออกงานเฉพาะรายการที่พร้อมใช้ ${availableCount} รายการ`}
                    >
                      <Icons.Truck className="w-5 h-5" />
                      <span>ออกงาน{availableCount > 1 ? ` ${availableCount}` : ''}</span>
                    </button>
                  )}

                  {hasReturnable && (
                    <button
                      type="button"
                      onClick={handleOpenBatchReturn}
                      className={`${hasAvailable ? '' : 'col-span-2'} px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md flex items-center justify-center gap-2 text-sm sm:text-base transition-colors`}
                      title={`รับคืนเฉพาะรายการที่ถูกยืมหรือออกงาน ${returnableCount} รายการ`}
                    >
                      <Icons.CheckCircle className="w-5 h-5" />
                      <span>รับคืน{returnableCount > 1 ? ` ${returnableCount}` : ''}</span>
                    </button>
                  )}

                  {!hasAvailable && !hasReturnable && (
                    <div className={`col-span-2 px-4 py-3 rounded-2xl border text-center font-black text-sm ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                      รายการที่เลือกยังทำรายการยืม/คืนไม่ได้
                    </div>
                  )}

                  <details className="relative col-span-2 sm:col-span-1">
                    <summary className={`list-none cursor-pointer px-4 py-3 rounded-2xl font-black border flex items-center justify-center gap-2 text-sm sm:text-base ${theme.btnSecondary}`}>
                      <span>เพิ่มเติม</span>
                      <span className="text-lg leading-none">⋯</span>
                    </summary>
                    <div className={`absolute right-0 bottom-full mb-3 w-[min(82vw,330px)] rounded-3xl border shadow-2xl p-3 space-y-2 ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <button type="button" onClick={() => setShowPrintModal(true)} className={secondaryButtonClass}>
                        <Icons.QrCode className="w-5 h-5 shrink-0" />
                        <span><span className="block">พิมพ์ QR / ฉลาก</span><span className={`block text-xs font-bold ${theme.textMuted}`}>พิมพ์ให้รายการที่เลือก</span></span>
                      </button>
                      <button type="button" onClick={() => { setBoxLabelTitle('กล่องอุปกรณ์ MDEC'); setBoxLabelNote(''); setShowStorageBoxAssignModal(true); }} className={secondaryButtonClass}>
                        <Icons.Folder className="w-5 h-5 shrink-0" />
                        <span><span className="block">เพิ่มเข้ากล่อง</span><span className={`block text-xs font-bold ${theme.textMuted}`}>จัดเก็บรายการที่เลือก</span></span>
                      </button>
                      <button type="button" onClick={handleCreateBundleFromSelection} className={secondaryButtonClass}>
                        <Icons.Layers className="w-5 h-5 shrink-0" />
                        <span><span className="block">จัดเซ็ต</span><span className={`block text-xs font-bold ${theme.textMuted}`}>บันทึกเป็นชุดอุปกรณ์</span></span>
                      </button>
                      <button type="button" onClick={openPrepAssignFromSelection} className={secondaryButtonClass}>
                        <Icons.ClipboardList className="w-5 h-5 shrink-0" />
                        <span><span className="block">เตรียมของ</span><span className={`block text-xs font-bold ${theme.textMuted}`}>สร้างรายการเตรียมของ</span></span>
                      </button>
                      <button type="button" onClick={() => setSelectedItems([])} className={`w-full px-4 py-3 rounded-2xl font-black text-sm border flex items-center gap-3 text-left ${isDarkMode ? 'bg-rose-950/30 hover:bg-rose-900 border-rose-800 text-rose-300' : 'bg-rose-50 hover:bg-rose-100 border-rose-200 text-rose-700'}`}>
                        <Icons.X className="w-5 h-5 shrink-0" />
                        <span>ล้างการเลือกทั้งหมด</span>
                      </button>
                    </div>
                  </details>

                  <button
                    type="button"
                    onClick={() => setSelectedItems([])}
                    className={`hidden lg:flex w-12 h-12 rounded-2xl items-center justify-center border ${theme.btnSecondary}`}
                    title="ล้างการเลือก"
                  >
                    <Icons.X className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 📦 Modal สร้าง/เพิ่มเข้ากล่องเก็บของ */}
      {showStorageBoxAssignModal && (
        <div className={`${theme.modalOverlay} fixed inset-0 flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden ${theme.cardBg}`}>
            <div className={`flex justify-between items-start gap-4 p-6 border-b ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}><Icons.Folder className="w-6 h-6"/></div>
                  สร้าง/เพิ่มเข้ากล่อง
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>บันทึกตำแหน่งกล่องจากรายการที่เลือก ส่วนฉลากให้พิมพ์จากหน้า “กล่องเก็บของ” เพื่อให้ข้อมูลตรงล่าสุดเสมอ</p>
              </div>
              <button type="button" onClick={() => setShowStorageBoxAssignModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5">
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`font-black mb-2 ${theme.textTitle}`}>รายการที่เลือก {selectedItems.length} ชิ้น</div>
                <div className="max-h-40 overflow-y-auto custom-scrollbar space-y-1.5 pr-1">
                  {selectedItems.map((id) => {
                    const item = items.find((i) => i.id === id);
                    if (!item) return null;
                    return <div key={id} className={`text-sm font-bold ${theme.textMuted}`}>- {item.name} {item.sn ? `(S.N. ${item.sn})` : ''}</div>;
                  })}
                </div>
              </div>

              <label className="block">
                <span className={`block text-base font-black mb-2 ${theme.textTitle}`}>ชื่อกล่องเก็บของ</span>
                <input
                  list="storage-box-name-list"
                  value={boxLabelTitle}
                  onChange={(e) => setBoxLabelTitle(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`}
                  placeholder="เช่น กล่องไลฟ์สด A / กล่องสาย HDMI"
                />
                <datalist id="storage-box-name-list">
                  {(settingsOptions.storageBoxes || []).map((box) => <option key={box.id} value={box.name} />)}
                </datalist>
                <p className={`text-xs font-bold mt-2 ${theme.textMuted}`}>ถ้าพิมพ์ชื่อกล่องเดิม Systemจะอัปเดตรายการในกล่องนั้นเป็นรายการที่เลือกอยู่ตอนนี้</p>
              </label>

              <label className="block">
                <span className={`block text-base font-black mb-2 ${theme.textTitle}`}>หมายเหตุบนฉลาก / ข้อควรระวัง</span>
                <input
                  value={boxLabelNote}
                  onChange={(e) => setBoxLabelNote(e.target.value)}
                  className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`}
                  placeholder="เช่น ห้ามแยกชุด / เก็บหลังงานทุกครั้ง"
                />
              </label>

              <div className={`p-4 rounded-2xl border text-sm font-bold ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                หลังบันทึกแล้ว ให้ไปที่เมนู “กล่องเก็บของ” แล้วกด “พิมพ์ฉลาก” จากกล่องนั้น ฉลากจะดึงข้อมูลกล่องล่าสุดเสมอ
              </div>
            </div>

            <div className={`p-4 border-t flex flex-col sm:flex-row gap-3 ${theme.divide}`}>
              <button type="button" onClick={() => setShowStorageBoxAssignModal(false)} className={`flex-1 py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={saveSelectedAsStorageBox} className="flex-[2] py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl text-lg shadow-md">บันทึกเป็นกล่องเก็บของ</button>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 Modal สร้างรายการเตรียมของ */}
      {showPrepAssignModal && (
        <div className={`${theme.modalOverlay} fixed inset-0 flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden ${theme.cardBg}`}>
            <div className={`flex justify-between items-start gap-4 p-6 border-b ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-sky-900/50 text-sky-400' : 'bg-sky-100 text-sky-600'}`}><Icons.ClipboardList className="w-6 h-6"/></div>
                  {prepForm.id ? 'แก้ไขรายการเตรียมของ' : 'สร้างรายการเตรียมของ'}
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ใช้วางแผนจัดของล่วงหน้า โดยยังไม่เปลี่ยนสถานะอุปกรณ์จริง</p>
              </div>
              <button type="button" onClick={() => { setShowPrepAssignModal(false); setShowPrepListsModal(true); }} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto custom-scrollbar">
              <label className="block">
                <span className={`block text-base font-black mb-2 ${theme.textTitle}`}>ชื่องาน / ชื่อรายการเตรียมของ <span className="text-rose-500">*</span></span>
                <input value={prepForm.name || ''} onChange={(e) => setPrepForm({ ...prepForm, name: e.target.value })} className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} placeholder="เช่น งานประชุมผู้ปกครอง / ไลฟ์สดพิธีเปิด" />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className={`block text-base font-black mb-2 ${theme.textTitle}`}>วันที่ใช้งาน <span className="text-rose-500">*</span></span>
                  <input type="date" value={prepForm.useDate || ''} onChange={(e) => setPrepForm({ ...prepForm, useDate: e.target.value })} className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} />
                </label>
                <label className="block">
                  <span className={`block text-base font-black mb-2 ${theme.textTitle}`}>ผู้รับผิดชอบ</span>
                  <select value={prepForm.staff || ''} onChange={(e) => setPrepForm({ ...prepForm, staff: e.target.value })} className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`}>
                    <option value="">-- เลือกผู้รับผิดชอบ --</option>
                    {(settingsOptions.staff || []).map((staff) => <option key={staff} value={staff}>{staff}</option>)}
                  </select>
                </label>
              </div>

              <label className="block">
                <span className={`block text-base font-black mb-2 ${theme.textTitle}`}>หมายเหตุ</span>
                <textarea value={prepForm.note || ''} onChange={(e) => setPrepForm({ ...prepForm, note: e.target.value })} className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border resize-none ${theme.input}`} rows={3} placeholder="เช่น เตรียมไว้ก่อนวันงาน / ต้องมีแบตสำรอง / ใช้ห้องประชุมราชพฤกษ์" />
              </label>

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`font-black mb-2 ${theme.textTitle}`}>อุปกรณ์ในรายการ {prepForm.itemIds.length} ชิ้น</div>
                <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-2 pr-1">
                  {prepForm.itemIds.length === 0 ? (
                    <div className={`text-sm font-bold ${theme.textMuted}`}>ยังไม่มีอุปกรณ์ในรายการนี้</div>
                  ) : prepForm.itemIds.map((id) => {
                    const item = items.find((i) => i.id === id);
                    if (!item) return null;
                    const s = STATUSES.find((st) => st.id === item.status) || STATUSES[0];
                    return (
                      <div key={id} className={`flex justify-between items-center gap-2 p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="min-w-0">
                          <div className={`font-bold truncate ${theme.textTitle}`}>{item.name}</div>
                          <div className={`text-xs font-bold ${theme.textMuted}`}>S.N. {item.sn || '-'} {item.storageBoxName ? `• กล่อง: ${item.storageBoxName}` : ''}</div>
                        </div>
                        <span className={`text-[11px] px-2 py-1 rounded-md font-bold whitespace-nowrap ${isDarkMode ? s.darkColor : s.color}`}>{s.label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`p-4 border-t flex flex-col sm:flex-row gap-3 ${theme.divide}`}>
              <button type="button" onClick={() => { setShowPrepAssignModal(false); setShowPrepListsModal(true); }} className={`flex-1 py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleSavePrepList} className="flex-[2] py-4 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl text-lg shadow-md">บันทึกรายการเตรียมของ</button>
            </div>
          </div>
        </div>
      )}

      {/* 🧾 Modal รายการเตรียมของ */}
      {showPrepListsModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-sky-900/50 text-sky-400' : 'bg-sky-100 text-sky-600'}`}><Icons.ClipboardList className="w-6 h-6"/></div>
                  รายการเตรียมของ
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เตรียมรายการล่วงหน้าได้ โดยยังไม่เปลี่ยนสถานะอุปกรณ์ จนกว่าจะกดนำออกงานจริง</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => openPrepEditor(null)} disabled={selectedItems.length === 0} className={`px-4 py-2.5 rounded-xl font-black transition-colors ${selectedItems.length === 0 ? (isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : 'bg-sky-600 hover:bg-sky-500 text-white shadow-md'}`}>
                  + จากรายการที่เลือก
                </button>
                <button type="button" onClick={() => setShowPrepListsModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {(settingsOptions.prepLists || []).length === 0 ? (
                <div className={`text-center py-12 font-bold text-xl flex flex-col items-center gap-3 ${theme.textMuted}`}>
                  <Icons.ClipboardList className="w-14 h-14" />
                  ยังไม่มีรายการเตรียมของ
                  <p className="text-sm font-medium max-w-xl">เลือกอุปกรณ์จากตาราง แล้วกด “เตรียมของ” เพื่อวางแผนรายการล่วงหน้า</p>
                </div>
              ) : (settingsOptions.prepLists || []).slice().sort((a, b) => String(a.useDate || '').localeCompare(String(b.useDate || ''))).map((prep) => {
                const prepItems = (prep.itemIds || []).map((id) => items.find((item) => item.id === id)).filter(Boolean);
                const missingCount = (prep.itemIds || []).length - prepItems.length;
                const unavailableItems = prepItems.filter((item) => item.status !== 'available');
                const checkedIds = prep.checkedIds || [];
                const checkedCount = prepItems.filter((item) => checkedIds.includes(item.id)).length;
                const isOpen = prepOpenId === prep.id;
                const isCancelled = prep.status === 'cancelled';
                return (
                  <div key={prep.id} className={`p-5 rounded-2xl border transition-colors ${isCancelled ? (isDarkMode ? 'bg-slate-800/30 border-slate-700 opacity-75' : 'bg-slate-50 border-slate-200 opacity-75') : (isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h4 className={`text-xl font-black truncate ${theme.textTitle}`}>🧾 {prep.name}</h4>
                          <span className={`text-sm font-bold px-2 py-1 rounded-md ${isDarkMode ? 'bg-sky-900/40 text-sky-400' : 'bg-sky-100 text-sky-700'}`}>{prepItems.length} รายการ</span>
                          {prep.useDate && <span className={`text-sm font-bold px-2 py-1 rounded-md ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>ใช้วันที่ {new Date(prep.useDate).toLocaleDateString('th-TH')}</span>}
                          {unavailableItems.length > 0 && !isCancelled && <span className="text-sm font-bold px-2 py-1 rounded-md bg-amber-100 text-amber-700">ไม่พร้อม {unavailableItems.length}</span>}
                          {missingCount > 0 && <span className="text-sm font-bold px-2 py-1 rounded-md bg-rose-100 text-rose-700">หายจากSystem {missingCount}</span>}
                          {isCancelled && <span className="text-sm font-bold px-2 py-1 rounded-md bg-slate-200 text-slate-600">ยกเลิก</span>}
                        </div>
                        <div className={`text-sm font-bold ${theme.textMuted}`}>
                          ผู้รับผิดชอบ: {prep.staff || '-'} • เช็กแล้ว {checkedCount}/{prepItems.length}
                        </div>
                        {prep.note && <p className={`text-sm font-bold mt-2 ${theme.textMuted}`}>หมายเหตุ: {prep.note}</p>}
                      </div>
                      <div className="flex flex-col gap-2 w-full lg:w-56 shrink-0">
                        <button type="button" onClick={() => setPrepOpenId(isOpen ? null : prep.id)} className={`px-4 py-3 font-black rounded-xl border flex items-center justify-center gap-2 ${theme.btnSecondary}`}><Icons.CheckCircle className="w-5 h-5"/> {isOpen ? 'ซ่อนเช็กลิสต์' : 'เช็กของ'}</button>
                        <button type="button" onClick={() => openPrepPrint(prep)} className={`px-4 py-3 font-black rounded-xl border flex items-center justify-center gap-2 ${theme.btnSecondary}`}><Icons.Printer className="w-5 h-5"/> พิมพ์ใบเตรียมของ</button>
                        <button type="button" onClick={() => startPrepAsEvent(prep)} disabled={isCancelled} className={`px-4 py-3 font-black rounded-xl shadow-md flex items-center justify-center gap-2 ${isCancelled ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-orange-600 hover:bg-orange-500 text-white'}`}><Icons.Truck className="w-5 h-5"/> ยืนยันนำออกงาน</button>
                        <button type="button" onClick={() => openPrepEditor(prep)} className="px-4 py-3 bg-sky-600 hover:bg-sky-500 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2"><Icons.Edit className="w-4 h-4"/> แก้ไข</button>
                        <div className="grid grid-cols-2 gap-2">
                          <button type="button" onClick={() => cancelPrepList(prep)} disabled={isCancelled} className={`px-3 py-2.5 font-black rounded-xl text-sm ${isCancelled ? 'bg-slate-300 text-slate-500 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-400 text-white'}`}>ยกเลิก</button>
                          <button type="button" onClick={() => deletePrepList(prep)} className="px-3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl text-sm">ลบ</button>
                        </div>
                      </div>
                    </div>
                    {isOpen && (
                      <div className={`mt-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="flex items-center justify-between gap-3 mb-3">
                          <div className={`font-black ${theme.textTitle}`}>เช็กลิสต์เตรียมของ</div>
                          <button type="button" onClick={() => toggleAllPrepChecklist(prep)} className={`px-3 py-1.5 rounded-lg text-sm font-black ${isDarkMode ? 'bg-sky-900/40 text-sky-400 hover:bg-sky-800' : 'bg-sky-100 text-sky-700 hover:bg-sky-200'}`}>{checkedCount === prepItems.length && prepItems.length > 0 ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}</button>
                        </div>
                        <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                          {prepItems.map((item) => {
                            const checked = checkedIds.includes(item.id);
                            const s = STATUSES.find((st) => st.id === item.status) || STATUSES[0];
                            return (
                              <label key={item.id} className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer ${checked ? (isDarkMode ? 'bg-sky-900/30 border-sky-800' : 'bg-sky-50 border-sky-200') : (isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-200')}`}>
                                <input type="checkbox" checked={checked} onChange={() => togglePrepChecklistItem(prep, item.id)} className="w-5 h-5 mt-1 accent-sky-600 rounded cursor-pointer shrink-0" />
                                <div className="flex-1 min-w-0">
                                  <div className={`font-bold truncate ${theme.textTitle}`}>{item.name}</div>
                                  <div className={`text-xs font-bold ${theme.textMuted}`}>S.N. {item.sn || '-'} {item.storageBoxName ? `• กล่อง: ${item.storageBoxName}` : ''}</div>
                                </div>
                                <span className={`text-[11px] px-2 py-1 rounded-md font-bold whitespace-nowrap ${isDarkMode ? s.darkColor : s.color}`}>{s.label}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 📷 หน้าสแกน QR Code แบบใหม่: ใช้งานหน้างาน / มือถือ / เครื่องยิงบาร์โค้ด */}
      {showScanModal && activeWorkspace !== 'qrWorkbench' && (() => {
        const scanInfo = getScanModeInfo();
        const isChecklistMode = scanMode !== 'select';
        const targetIds = scanMode === 'borrowChecklist' ? borrowTargetIds : scanMode === 'eventChecklist' ? eventTargetIds : scanMode === 'returnChecklist' ? returnTargetIds : [];
        const checkedIds = scanMode === 'borrowChecklist' ? packingChecklist : scanMode === 'eventChecklist' ? eventChecklist : scanMode === 'returnChecklist' ? returnChecklist : [];
        const total = targetIds.length || 0;
        const checked = checkedIds.length || 0;
        const percent = total === 0 ? 0 : Math.min(100, Math.round((checked / total) * 100));
        const isComplete = total > 0 && checked >= total;
        const pendingIds = isChecklistMode ? targetIds.filter(id => !checkedIds.includes(id)).slice(0, 5) : [];
        const recentItem = lastScannedItemId ? items.find(i => i.id === lastScannedItemId) : null;
        const recentStatus = recentItem ? (STATUSES.find(s => s.id === recentItem.status) || STATUSES[0]) : null;
        const selectedPreviewItems = selectedItems.map(id => items.find(i => i.id === id)).filter(Boolean).slice(0, 6);
        const toneClass = scanMode === 'borrowChecklist'
          ? 'from-purple-600 to-violet-700'
          : scanMode === 'eventChecklist'
            ? 'from-orange-500 to-red-600'
            : scanMode === 'returnChecklist'
              ? 'from-emerald-500 to-teal-600'
              : 'from-sky-500 to-indigo-600';
        const toneSoft = scanMode === 'borrowChecklist'
          ? (isDarkMode ? 'bg-purple-950/30 border-purple-800 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800')
          : scanMode === 'eventChecklist'
            ? (isDarkMode ? 'bg-orange-950/30 border-orange-800 text-orange-200' : 'bg-orange-50 border-orange-200 text-orange-800')
            : scanMode === 'returnChecklist'
              ? (isDarkMode ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800')
              : (isDarkMode ? 'bg-sky-950/30 border-sky-800 text-sky-200' : 'bg-sky-50 border-sky-200 text-sky-800');

        const closeScanWorkbench = () => {
          setShowScanModal(false);
          setUseCamera(false);
        };

        return (
          <div className={`fixed inset-0 ${theme.modalOverlay} z-[9999] overflow-hidden`}>
            <style>{`
              #qr-reader {
                width: 100% !important;
                border: 0 !important;
                background: transparent !important;
                color: inherit !important;
                overflow: hidden !important;
              }
              #qr-reader video {
                border-radius: 26px !important;
                object-fit: cover !important;
                background: #020617 !important;
                height: min(34dvh, 320px) !important; min-height: 250px !important; max-height: 340px !important;
              }
              #qr-reader__scan_region {
                background: transparent !important;
                border: 0 !important;
              }
              #qr-reader__dashboard,
              #qr-reader__dashboard_section,
              #qr-reader__dashboard_section_csr,
              #qr-reader__camera_selection {
                border: 0 !important;
                background: transparent !important;
                color: inherit !important;
                font-family: inherit !important;
              }
              #qr-reader button {
                background: #0f172a !important;
                color: white !important;
                border: 0 !important;
                padding: 10px 16px !important;
                border-radius: 14px !important;
                font-weight: 900 !important;
                margin: 6px !important;
              }
              #qr-reader select {
                min-height: 42px !important;
                border-radius: 14px !important;
                padding: 0 12px !important;
                font-weight: 800 !important;
                max-width: 100% !important;
              }
              #qr-reader__status_span {
                display: inline-flex !important;
                margin-top: 8px !important;
                border-radius: 999px !important;
                padding: 6px 12px !important;
                font-weight: 900 !important;
                font-size: 12px !important;
              }
              @media (max-width: 767px) {
                #qr-reader video { height: 40svh !important; min-height: 260px !important; max-height: 390px !important; border-radius: 22px !important; }
                #qr-reader__dashboard_section { padding: 2px 0 !important; }
                .qrwb-header { padding: 8px 10px 7px !important; }
                .qrwb-icon { width: 34px !important; height: 34px !important; border-radius: 12px !important; }
                .qrwb-header h3 { font-size: 16px !important; line-height: 1.08 !important; }
                .qrwb-subtitle { display: none !important; }
                .qrwb-mode-tabs { margin-top: 8px !important; gap: 6px !important; }
                .qrwb-mode-tabs button { min-height: 42px !important; padding: 8px 6px !important; border-radius: 14px !important; }
                .qrwb-mode-desc, .qrwb-mode-badge { display: none !important; }
                .qrwb-controls { margin-top: 7px !important; gap: 6px !important; }
                .qrwb-controls button { min-height: 38px !important; padding: 7px 8px !important; border-radius: 13px !important; font-size: 12px !important; }
                .qrwb-count-badge { min-height: 30px !important; padding: 4px 8px !important; border-radius: 12px !important; font-size: 12px !important; }
                .qrwb-body { padding: 7px 8px 8px !important; }
                .qrwb-main-grid { gap: 7px !important; }
                .qrwb-scan-head { display: none !important; }
                .qrwb-camera-wrap { padding: 4px !important; }
                .qrwb-tip { display: none !important; }
                .qrwb-side > div { border-radius: 16px !important; padding: 10px !important; }
              }
            `}</style>

            <div className="h-full w-full flex items-stretch justify-center sm:p-4">
              <div className={`w-full max-w-6xl h-full sm:h-[94vh] sm:rounded-[2rem] overflow-hidden border flex flex-col ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'} shadow-2xl`}>
                <div className={`qrwb-header shrink-0 border-b px-3 py-3 sm:px-4 sm:py-3 ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-white'}`}>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3">
                        <div className={`qrwb-icon w-10 h-10 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-br ${toneClass} text-white flex items-center justify-center shadow-lg shrink-0`}>
                          <Icons.QrCode className="w-6 h-6" />
                        </div>
                        <div className="min-w-0">
                          <h3 className={`font-black text-lg sm:text-xl leading-tight ${theme.textTitle}`}>{isChecklistMode ? scanInfo.title : 'QR Workbench'}</h3>
                          <p className={`qrwb-subtitle text-xs sm:text-sm font-bold mt-0.5 ${theme.textMuted}`}>
                            {isChecklistMode ? scanInfo.desc : (qrWorkbenchMode === 'multi' ? 'เลือกหลายรายการ' : 'จัดการทีละชิ้น')}
                          </p>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={closeScanWorkbench}
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center border shrink-0 ${theme.btnCancel}`}
                      title="ปิดหน้าสแกน"
                    >
                      <Icons.X className="w-5 h-5" />
                    </button>
                  </div>

                  {!isChecklistMode && (
                    <div className="qrwb-mode-tabs mt-3 grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setQrWorkbenchMode('multi')}
                        className={`text-center sm:text-left px-3 py-2 sm:p-3 rounded-2xl border transition-all ${qrWorkbenchMode === 'multi' ? 'border-sky-500 bg-sky-50 dark:bg-sky-950/30 shadow-md' : (isDarkMode ? 'border-slate-800 bg-slate-900 hover:bg-slate-800/80' : 'border-slate-200 bg-white hover:bg-slate-50')}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className={`font-black ${theme.textTitle}`}>สแกนเลือกหลายรายการ</div>
                            <div className={`qrwb-mode-desc text-xs font-bold mt-1 ${theme.textMuted}`}>เหมาะกับยืม / คืน / ออกงานหลายชิ้น</div>
                          </div>
                          <span className={`qrwb-mode-badge px-3 py-1 rounded-full text-xs font-black ${qrWorkbenchMode === 'multi' ? 'bg-sky-600 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600')}`}>เลือกแล้ว {selectedItems.length}</span>
                        </div>
                      </button>
                      <button
                        type="button"
                        onClick={() => setQrWorkbenchMode('single')}
                        className={`text-center sm:text-left px-3 py-2 sm:p-3 rounded-2xl border transition-all ${qrWorkbenchMode === 'single' ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-950/30 shadow-md' : (isDarkMode ? 'border-slate-800 bg-slate-900 hover:bg-slate-800/80' : 'border-slate-200 bg-white hover:bg-slate-50')}`}
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <div className={`font-black ${theme.textTitle}`}>สแกนจัดการทันที</div>
                            <div className={`qrwb-mode-desc text-xs font-bold mt-1 ${theme.textMuted}`}>เหมาะกับดูข้อมูลหรือจัดการของทีละชิ้น</div>
                          </div>
                          <span className={`qrwb-mode-badge px-3 py-1 rounded-full text-xs font-black ${qrWorkbenchMode === 'single' ? 'bg-indigo-600 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600')}`}>Quick Action</span>
                        </div>
                      </button>
                    </div>
                  )}

                  <div className="qrwb-controls mt-3 grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
                    <button type="button" onClick={() => setUseCamera(true)} className={`min-h-[36px] sm:min-h-[38px] px-3 sm:px-4 rounded-2xl font-black border transition ${useCamera ? `bg-gradient-to-br ${toneClass} text-white border-transparent shadow-lg` : theme.btnSecondary}`}>
                      📷 ใช้กล้อง
                    </button>
                    <button type="button" onClick={() => setUseCamera(false)} className={`min-h-[36px] sm:min-h-[38px] px-3 sm:px-4 rounded-2xl font-black border transition ${!useCamera ? `bg-gradient-to-br ${toneClass} text-white border-transparent shadow-lg` : theme.btnSecondary}`}>
                      ⌨️ พิมพ์ / ยิงรหัส
                    </button>
                    {isChecklistMode ? (
                      <div className={`min-h-[44px] px-4 rounded-2xl border flex items-center gap-3 font-black ${toneSoft}`}>
                        <span>เช็กแล้ว {checked}/{total}</span>
                        <span>{percent}%</span>
                      </div>
                    ) : (
                      <div className={`qrwb-count-badge col-span-2 sm:col-span-1 min-h-[34px] sm:min-h-[38px] px-3 sm:px-3 rounded-2xl border flex items-center justify-center gap-3 font-black ${theme.btnSecondary}`}>
                        <span>{qrWorkbenchMode === 'multi' ? `เลือกแล้ว ${selectedItems.length}` : 'จัดการทันที'}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="qrwb-body flex-1 min-h-0 overflow-y-auto custom-scrollbar p-2 sm:p-3">
                  <div className="qrwb-main-grid grid grid-cols-1 xl:grid-cols-[1.2fr_.8fr] gap-2 sm:gap-3 items-start">
                    <div className={`rounded-[2rem] border overflow-hidden ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                      <div className={`qrwb-scan-head px-4 py-3 border-b flex items-center justify-between gap-3 ${isDarkMode ? 'border-slate-800 bg-slate-900' : 'border-slate-100 bg-slate-50'}`}>
                        <div>
                          <div className={`font-black ${theme.textTitle}`}>พื้นที่สแกน</div>
                          <div className={`text-xs font-bold mt-0.5 ${theme.textMuted}`}>{useCamera ? 'เห็นกล้องเต็มขึ้น ใช้งานมือถือสะดวกขึ้น' : 'กรอกรหัสหรือใช้เครื่องยิงบาร์โค้ดได้ทันที'}</div>
                        </div>
                        <div className={`text-xs font-black px-3 py-1 rounded-full ${useCamera ? 'bg-emerald-500 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700')}`}>{useCamera ? 'Camera' : 'Manual'}</div>
                      </div>

                      {useCamera ? (
                        <div className="qrwb-camera-wrap p-2 sm:p-3">
                          <div className={`qrwb-tip mb-3 p-3 rounded-2xl border text-left text-xs sm:text-sm font-bold ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                            ส่อง QR ให้อยู่กลางกรอบ ถือให้นิ่งเล็กน้อย ระบบจะมีเสียงปิ๊ปเมื่อสแกนสำเร็จ
                          </div>
                          {!isScannerLoaded ? (
                            <div className="min-h-[360px] flex items-center justify-center">
                              <div className="animate-pulse text-amber-500 font-black">กำลังโหลดระบบกล้อง...</div>
                            </div>
                          ) : (
                            <div className={`rounded-[1.8rem] overflow-hidden border-4 ${isDarkMode ? 'border-slate-800 bg-slate-950' : 'border-slate-200 bg-slate-100'}`}>
                              <div id="qr-reader" className="w-full"></div>
                            </div>
                          )}
                          <form onSubmit={handleScanSubmit} className="mt-3 grid grid-cols-[1fr_auto] gap-2">
                            <input
                              type="text"
                              className={`px-4 py-3 rounded-2xl font-black text-center outline-none border ${theme.input}`}
                              placeholder="สแกนไม่ติด? พิมพ์รหัส/S.N."
                              value={scanInput}
                              onChange={e => setScanInput(e.target.value)}
                            />
                            <button type="submit" className={`px-5 py-3 rounded-2xl bg-gradient-to-br ${toneClass} text-white font-black shadow-md`}>{isChecklistMode ? 'เช็ก' : (qrWorkbenchMode === 'multi' ? 'เพิ่ม' : 'ค้นหา')}</button>
                          </form>
                        </div>
                      ) : (
                        <div className="p-4 sm:p-6">
                          <form onSubmit={handleScanSubmit}>
                            <label className={`block text-left text-sm font-black mb-2 ${theme.textTitle}`}>รหัสอุปกรณ์ / S.N.</label>
                            <input
                              type="text"
                              ref={scanInputRef}
                              className={`w-full px-4 py-6 rounded-3xl font-black text-center text-2xl outline-none mb-3 border-2 focus:border-sky-500 focus:ring-4 focus:ring-sky-500/20 transition-all ${theme.input}`}
                              placeholder="ยิงบาร์โค้ด หรือพิมพ์รหัสที่นี่"
                              value={scanInput}
                              onChange={e => setScanInput(e.target.value)}
                              autoFocus
                            />
                            <button type="submit" className={`w-full py-4 rounded-2xl bg-gradient-to-br ${toneClass} text-white font-black shadow-lg text-lg`}>{isChecklistMode ? 'สแกนเช็กอุปกรณ์นี้' : (qrWorkbenchMode === 'multi' ? 'เพิ่มเข้ารายการที่เลือก' : 'ค้นหาอุปกรณ์นี้')}</button>
                          </form>
                          <div className={`mt-4 p-4 rounded-3xl border text-left ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                            <div className="font-black mb-1">เหมาะกับการใช้เครื่องยิงบาร์โค้ด</div>
                            <div className="text-sm font-bold opacity-80">คลิกช่องรหัสหนึ่งครั้ง แล้วเดินยิง QR/Barcode ต่อเนื่องได้เลย ระบบจะเคลียร์ช่องให้เองหลังสแกน</div>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="qrwb-side space-y-3 sm:space-y-4">
                      {scanMessage.text ? (
                        <div className={`p-3 rounded-[1.5rem] border font-black shadow-sm ${scanMessage.type === 'success' ? (isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800') : (isDarkMode ? 'bg-rose-950/40 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-800')}`}>
                          {scanMessage.text}
                        </div>
                      ) : (
                        <div className={`p-3 rounded-[1.5rem] border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                          พร้อมสแกน — ระบบจะมีเสียง/สั่นเมื่อพบหรือไม่พบรายการ
                        </div>
                      )}

                      {isChecklistMode ? (
                        <>
                          <div className={`p-3 rounded-[1.6rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div>
                                <div className={`font-black ${theme.textTitle}`}>ความคืบหน้าการเช็ก</div>
                                <div className={`text-xs font-bold mt-0.5 ${theme.textMuted}`}>เช็กครบแล้วค่อยกลับไปยืนยันรายการ</div>
                              </div>
                              <div className={`text-xl font-black ${theme.textTitle}`}>{checked}/{total}</div>
                            </div>
                            <div className="w-full h-2.5 rounded-full bg-slate-300/60 dark:bg-slate-800 overflow-hidden">
                              <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percent}%` }}></div>
                            </div>
                            {isComplete && (
                              <button type="button" onClick={closeScanWorkbench} className="mt-4 w-full px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md">
                                เช็กครบแล้ว กลับไปยืนยันรายการ
                              </button>
                            )}
                          </div>

                          <div className={`p-3 rounded-[1.6rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center justify-between mb-3">
                              <div className={`font-black ${theme.textTitle}`}>ยังรอสแกน</div>
                              <div className={`text-xs font-black ${theme.textMuted}`}>{Math.max(0, total - checked)} ชิ้น</div>
                            </div>
                            <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                              {pendingIds.length === 0 ? (
                                <div className="p-3 rounded-2xl bg-emerald-500 text-white font-black text-center">ครบแล้ว</div>
                              ) : pendingIds.map(id => {
                                const item = items.find(i => i.id === id);
                                if (!item) return null;
                                return (
                                  <div key={id} className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className={`font-black truncate ${theme.textTitle}`}>{item.name}</div>
                                    <div className={`text-xs font-bold ${theme.textMuted}`}>S.N. {item.sn || '-'} </div>
                                  </div>
                                );
                              })}
                              {total - checked > pendingIds.length && <div className={`text-center text-xs font-bold ${theme.textMuted}`}>และอีก {total - checked - pendingIds.length} รายการ</div>}
                            </div>
                          </div>
                        </>
                      ) : qrWorkbenchMode === 'multi' ? (
                        <>
                          <div className={`p-3 rounded-[1.6rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                            <div className="flex items-center justify-between gap-3 mb-3">
                              <div>
                                <div className={`font-black ${theme.textTitle}`}>รายการที่เลือก</div>
                                <div className={`text-xs font-bold mt-0.5 ${theme.textMuted}`}>สะสมหลายรายการ แล้วค่อยทำรายการทีเดียว</div>
                              </div>
                              <div className={`text-2xl font-black ${theme.textTitle}`}>{selectedItems.length}</div>
                            </div>

                            {selectedPreviewItems.length > 0 ? (
                              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                                {selectedPreviewItems.map(item => (
                                  <div key={item.id} className={`p-2.5 rounded-xl border flex items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="min-w-0">
                                      <div className={`font-black truncate ${theme.textTitle}`}>{item.name}</div>
                                      <div className={`text-xs font-bold mt-0.5 ${theme.textMuted}`}>S.N. {item.sn || '-'} • {item.location || 'ไม่ระบุที่เก็บ'}</div>
                                    </div>
                                    <span className={`px-2.5 py-1 rounded-xl text-[11px] font-black border shrink-0 ${isDarkMode ? (STATUSES.find(s => s.id === item.status) || STATUSES[0]).darkColor : (STATUSES.find(s => s.id === item.status) || STATUSES[0]).color}`}>{(STATUSES.find(s => s.id === item.status) || STATUSES[0]).label}</span>
                                  </div>
                                ))}
                                {selectedItems.length > selectedPreviewItems.length && <div className={`text-center text-xs font-bold ${theme.textMuted}`}>และอีก {selectedItems.length - selectedPreviewItems.length} รายการ</div>}
                              </div>
                            ) : (
                              <div className={`p-3 rounded-xl text-center font-bold ${isDarkMode ? 'bg-slate-950 text-slate-400 border border-slate-800' : 'bg-slate-50 text-slate-500 border border-slate-200'}`}>
                                ยังไม่มีรายการที่สแกนในรอบนี้
                              </div>
                            )}

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
                              <button type="button" onClick={() => { handleOpenBatchBorrow(); closeScanWorkbench(); }} className="px-4 py-3 rounded-2xl font-black bg-purple-600 hover:bg-purple-500 text-white disabled:opacity-50" disabled={selectedItems.length === 0}>ให้ยืม</button>
                              <button type="button" onClick={() => { handleOpenBatchEvent(); closeScanWorkbench(); }} className="px-4 py-3 rounded-2xl font-black bg-orange-600 hover:bg-orange-500 text-white disabled:opacity-50" disabled={selectedItems.length === 0}>ออกงาน</button>
                              <button type="button" onClick={() => { handleOpenBatchReturn(); closeScanWorkbench(); }} className="px-4 py-3 rounded-2xl font-black bg-emerald-600 hover:bg-emerald-500 text-white disabled:opacity-50" disabled={selectedItems.length === 0}>รับคืน</button>
                            </div>

                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button type="button" onClick={() => setSelectedItems([])} disabled={selectedItems.length === 0} className={`px-4 py-3 rounded-2xl font-black border disabled:opacity-50 ${theme.btnSecondary}`}>ล้างรายการ</button>
                              <button type="button" onClick={closeScanWorkbench} className={`px-4 py-3 rounded-2xl font-black border ${theme.btnSecondary}`}>กลับไปจัดการต่อ</button>
                            </div>
                          </div>

                          {recentItem && (
                            <div className={`p-3 rounded-[1.6rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                              <div className={`text-xs font-black mb-2 ${theme.textMuted}`}>สแกนล่าสุด</div>
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className={`font-black text-lg leading-tight ${theme.textTitle}`}>{recentItem.name}</div>
                                  <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>S.N. {recentItem.sn || '-'} • {recentItem.category || '-'}</div>
                                  <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{recentItem.location || 'ไม่ระบุที่เก็บ'}</div>
                                </div>
                                {recentStatus && <span className={`px-3 py-1.5 rounded-xl text-xs font-black border shrink-0 ${isDarkMode ? recentStatus.darkColor : recentStatus.color}`}>{recentStatus.label}</span>}
                              </div>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className={`p-3 rounded-[1.6rem] border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200 shadow-sm'}`}>
                          <div className="flex items-center justify-between gap-3 mb-3">
                            <div>
                              <div className={`font-black ${theme.textTitle}`}>Quick Action</div>
                              <div className={`text-xs font-bold mt-0.5 ${theme.textMuted}`}>สแกนแล้วจัดการของชิ้นนั้นได้ทันที</div>
                            </div>
                            <span className={`px-3 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-700'}`}>Single Item</span>
                          </div>

                          {recentItem ? (
                            <>
                              <div className={`p-4 rounded-3xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-start justify-between gap-3">
                                  <div className="min-w-0">
                                    <div className={`font-black text-xl leading-tight ${theme.textTitle}`}>{recentItem.name}</div>
                                    <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>S.N. {recentItem.sn || '-'} • {recentItem.category || '-'}</div>
                                    <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>ที่เก็บ: {recentItem.location || 'ไม่ระบุที่เก็บ'}</div>
                                  </div>
                                  {recentStatus && <span className={`px-3 py-1.5 rounded-xl text-xs font-black border shrink-0 ${isDarkMode ? recentStatus.darkColor : recentStatus.color}`}>{recentStatus.label}</span>}
                                </div>
                              </div>

                              <div className="grid grid-cols-2 gap-2 mt-4">
                                <button type="button" onClick={() => { closeScanWorkbench(); setShowHistory(recentItem.id); }} className={`px-4 py-3 rounded-2xl font-black border ${theme.btnSecondary}`}>ดูรายละเอียด</button>
                                {canAddEditItems ? (
                                  <button type="button" onClick={() => { closeScanWorkbench(); openItemEditor(recentItem); }} className="px-4 py-3 rounded-2xl font-black bg-blue-600 hover:bg-blue-500 text-white">แก้ไขข้อมูล</button>
                                ) : (
                                  <button type="button" onClick={closeScanWorkbench} className={`px-4 py-3 rounded-2xl font-black border ${theme.btnSecondary}`}>ปิด</button>
                                )}
                                {recentItem.status === 'available' && (
                                  <>
                                    <button type="button" onClick={() => { closeScanWorkbench(); handleOpenRowBorrow({ stopPropagation: () => {} }, recentItem); }} className="px-4 py-3 rounded-2xl font-black bg-purple-600 hover:bg-purple-500 text-white">ให้ยืม</button>
                                    <button type="button" onClick={() => { closeScanWorkbench(); handleOpenRowEvent({ stopPropagation: () => {} }, recentItem); }} className="px-4 py-3 rounded-2xl font-black bg-orange-600 hover:bg-orange-500 text-white">ออกงาน</button>
                                  </>
                                )}
                                {(recentItem.status === 'borrowed' || recentItem.status === 'out-for-event') && (
                                  <button type="button" onClick={() => { closeScanWorkbench(); openReturnForItems([recentItem.id]); }} className="col-span-2 px-4 py-3 rounded-2xl font-black bg-emerald-600 hover:bg-emerald-500 text-white">รับคืนอุปกรณ์นี้</button>
                                )}
                              </div>
                            </>
                          ) : (
                            <div className={`p-5 rounded-3xl text-center font-bold border ${isDarkMode ? 'bg-slate-950 border-slate-800 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                              ยังไม่มีรายการล่าสุดในรอบนี้<br />
                              เริ่มสแกนเพื่อให้ระบบแสดงการ์ดคำสั่งของอุปกรณ์
                            </div>
                          )}
                        </div>
                      )}

                      <div className={`grid grid-cols-3 gap-2 text-xs font-black ${theme.textMuted}`}>
                        <div className={`p-3 text-center rounded-2xl border ${theme.btnSecondary}`}>{isChecklistMode ? 'เช็กของ' : (qrWorkbenchMode === 'multi' ? 'หลายรายการ' : 'ทันที')}</div>
                        <div className={`p-3 text-center rounded-2xl border ${theme.btnSecondary}`}>กันสแกนซ้ำ</div>
                        <div className={`p-3 text-center rounded-2xl border ${theme.btnSecondary}`}>เสียง/สั่น</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 🧭 Modal ศูนย์ติดตามงาน: วันนี้ / ต้องจัดการ / ปฏิทิน */}
      {showTrackingCenterModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden ${theme.cardBg}`}>
            <div className={`flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 border-b ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.History className="w-6 h-6 text-sky-500" /> ศูนย์ติดตามงาน</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>รวม “วันนี้ / ของที่ต้องจัดการ / ปฏิทิน” ไว้หน้าเดียว ลดการกดหลายเมนู</p>
              </div>
              <button onClick={() => setShowTrackingCenterModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className={`px-6 pt-4 border-b ${theme.divide}`}>
              <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-3">
                {[
                  ['today', 'วันนี้', todayFollowup.dueToday.length + todayFollowup.overdue.length],
                  ['action', 'ต้องจัดการ', actionCenterData.total],
                  ['calendar', 'ปฏิทิน', calendarDays.length]
                ].map(([id, label, count]) => (
                  <button key={id} type="button" onClick={() => setTrackingTab(id)} className={`px-5 py-3 rounded-xl border font-black whitespace-nowrap transition-colors ${trackingTab === id ? 'bg-sky-600 text-white border-sky-600 shadow-md' : theme.btnSecondary}`}>
                    {label} <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${trackingTab === id ? 'bg-white/20 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-200 text-slate-700')}`}>{count}</span>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
              {trackingTab === 'today' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <TodayPanel title="ต้องคืนวันนี้" color="amber" items={todayFollowup.dueToday} empty="วันนี้ยังไม่มีรายการครบกำหนดคืน" isDarkMode={isDarkMode} theme={theme} />
                  <TodayPanel title="เลยกำหนดคืน" color="rose" items={todayFollowup.overdue} empty="ไม่มีรายการเลยกำหนด" isDarkMode={isDarkMode} theme={theme} />
                  <TodayPanel title="ถูกยืม / ออกงาน" color="purple" items={todayFollowup.active} empty="ไม่มีอุปกรณ์ที่ถูกยืมหรือออกงาน" isDarkMode={isDarkMode} theme={theme} />
                </div>
              )}

              {trackingTab === 'action' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {[
                    ['เลยกำหนดคืน', actionCenterData.overdue, 'overdue', 'text-rose-500'],
                    ['ต้องคืนวันนี้', actionCenterData.dueToday, 'overdue', 'text-amber-500'],
                    ['ชำรุด/ส่งซ่อม', actionCenterData.maintenance, 'maintenance', 'text-rose-500'],
                    ['ยังไม่ติด QR', actionCenterData.untagged, 'untagged', 'text-blue-500']
                  ].map(([title, list, type, tone]) => (
                    <div key={title} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center justify-between gap-3 mb-3">
                        <h4 className={`font-black text-lg ${theme.textTitle}`}>{title}</h4>
                        <button onClick={() => { setShowTrackingCenterModal(false); applyProblemFilter(type); }} className={`text-xs font-black px-3 py-1.5 rounded-lg ${theme.btnCancel}`}>ดู/กรอง</button>
                      </div>
                      <div className={`text-4xl font-black mb-2 ${tone}`}>{list.length}</div>
                      <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                        {list.slice(0, 8).map(i => <div key={i.id} className={`text-sm font-bold px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'}`}>{i.name} <span className={theme.textMuted}>{i.sn ? `• ${i.sn}` : ''}</span></div>)}
                        {list.length === 0 && <div className={`text-sm font-bold ${theme.textMuted}`}>ไม่มีรายการ</div>}
                      </div>
                    </div>
                  ))}
                  <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                    <h4 className={`font-black text-lg ${theme.textTitle}`}>รายการเตรียมของยังไม่ครบ</h4>
                    <div className="text-4xl font-black my-2 text-sky-500">{actionCenterData.prepIncomplete.length}</div>
                    {actionCenterData.prepIncomplete.slice(0, 8).map(p => <div key={p.id} className={`text-sm font-bold px-3 py-2 rounded-xl mb-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>{p.name} • {(p.checkedIds||[]).length}/{(p.itemIds||[]).length}</div>)}
                    {actionCenterData.prepIncomplete.length === 0 && <div className={`text-sm font-bold ${theme.textMuted}`}>ไม่มีรายการ</div>}
                  </div>
                  <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                    <h4 className={`font-black text-lg ${theme.textTitle}`}>กล่องที่มีรายการหายจากSystem</h4>
                    <div className="text-4xl font-black my-2 text-cyan-500">{actionCenterData.brokenBoxes.length}</div>
                    {actionCenterData.brokenBoxes.slice(0, 8).map(b => <div key={b.id} className={`text-sm font-bold px-3 py-2 rounded-xl mb-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>{b.name} • หาย {(b.missingIds||[]).length} รายการ</div>)}
                    {actionCenterData.brokenBoxes.length === 0 && <div className={`text-sm font-bold ${theme.textMuted}`}>ไม่มีรายการ</div>}
                  </div>
                </div>
              )}

              {trackingTab === 'calendar' && (
                <div className="space-y-4">
                  {calendarDays.length === 0 && <div className={`text-center py-12 font-black text-xl ${theme.textMuted}`}>ยังไม่มีกำหนดคืนหรือรายการเตรียมของ</div>}
                  {calendarDays.map(day => (
                    <div key={day.date} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`font-black text-lg ${theme.textTitle}`}>{new Date(day.date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                        <span className={`text-xs font-black px-3 py-1 rounded-full ${theme.btnCancel}`}>{day.events.length} รายการ</span>
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {day.events.map((ev, idx) => (
                          <div key={idx} className={`p-3 rounded-xl border ${ev.type === 'prep' ? (isDarkMode ? 'bg-sky-900/20 border-sky-800' : 'bg-sky-50 border-sky-200') : ev.type === 'event-return' ? (isDarkMode ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200') : (isDarkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200')}`}>
                            <div className={`font-black ${theme.textTitle}`}>{ev.title}</div>
                            <div className={`text-sm font-bold ${theme.textMuted}`}>{ev.itemName}{ev.sn ? ` • ${ev.sn}` : ''}{ev.staff ? ` • ${ev.staff}` : ''}</div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 📅 Modal วันนี้ */}
      {showTodayModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}><div className={`rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[85vh] ${theme.cardBg}`}><div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}><h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><div className={`p-2 rounded-xl ${isDarkMode ? 'bg-sky-900/50 text-sky-400' : 'bg-sky-100 text-sky-600'}`}><Icons.History className="w-6 h-6"/></div>วันนี้ต้องติดตามอะไรบ้าง</h3><button type="button" onClick={() => setShowTodayModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button></div><div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 lg:grid-cols-3 gap-4"><TodayPanel title="ต้องคืนวันนี้" color="amber" items={todayFollowup.dueToday} empty="วันนี้ยังไม่มีรายการครบกำหนดคืน" isDarkMode={isDarkMode} theme={theme} /><TodayPanel title="เลยกำหนดคืน" color="rose" items={todayFollowup.overdue} empty="ไม่มีรายการเลยกำหนด" isDarkMode={isDarkMode} theme={theme} /><TodayPanel title="ถูกยืม / ออกงาน" color="purple" items={todayFollowup.active} empty="ไม่มีอุปกรณ์ที่ถูกยืมหรือออกงาน" isDarkMode={isDarkMode} theme={theme} /></div><div className={`p-4 border-t text-center text-sm font-bold ${theme.divide} ${theme.textMuted}`}>ใช้หน้านี้เปิดเช็กตอนเช้าได้เลย ว่าต้องตามคืนอะไรบ้างและใครกำลังใช้อุปกรณ์อยู่</div></div></div>
      )}

      {/* 🛠️ Modal แก้ไขกล่องเก็บของ */}
      {showStorageBoxEditor && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-3 sm:p-4 z-[9995]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col h-[92vh] sm:h-[88vh] overflow-hidden ${theme.cardBg}`}>
            <div className={`flex justify-between items-start gap-4 p-4 sm:p-5 border-b shrink-0 ${theme.divide}`}>
              <div className="min-w-0">
                <h3 className={`text-lg sm:text-xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}><Icons.Folder className="w-6 h-6"/></div>
                  {storageBoxForm.id ? 'แก้ไขกล่องเก็บของ' : 'สร้างกล่องเก็บของ'}
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>แก้ชื่อกล่อง หมายเหตุ และติ๊กเลือกอุปกรณ์เข้ากล่องได้ในหน้าเดียว</p>
              </div>
              <button type="button" onClick={() => { setShowStorageBoxEditor(false); setShowStorageBoxesModal(true); }} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 min-h-0 flex flex-col lg:flex-row overflow-hidden">
              <div className={`w-full lg:w-[360px] p-5 border-b lg:border-b-0 lg:border-r shrink-0 ${theme.divide} ${isDarkMode ? 'bg-slate-900/25' : 'bg-slate-50/80'}`}>
                <div className="space-y-4">
                  <label className="block">
                    <span className={`block text-base font-black mb-2 ${theme.textTitle}`}>ชื่อกล่องเก็บของ <span className="text-rose-500">*</span></span>
                    <input type="text" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border ${theme.input}`} placeholder="เช่น กล่องไลฟ์สด A" value={storageBoxForm.name || ''} onChange={(e) => setStorageBoxForm({...storageBoxForm, name: e.target.value})} />
                  </label>

                  <label className="block">
                    <span className={`block text-base font-black mb-2 ${theme.textTitle}`}>หมายเหตุบนฉลาก</span>
                    <textarea className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border resize-none ${theme.input}`} rows="4" placeholder="เช่น ห้ามแยกชุด / เก็บหลังงานทุกครั้ง" value={storageBoxForm.note || ''} onChange={(e) => setStorageBoxForm({...storageBoxForm, note: e.target.value})}></textarea>
                  </label>

                  <label className="block">
                    <span className={`block text-base font-black mb-2 ${theme.textTitle}`}>ขนาดฉลากเริ่มต้น</span>
                    <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border ${theme.input}`} value={storageBoxForm.size || 'normal'} onChange={(e) => setStorageBoxForm({...storageBoxForm, size: e.target.value})}>
                      <option value="small">เล็ก</option>
                      <option value="normal">ปกติ</option>
                      <option value="large">ใหญ่</option>
                    </select>
                  </label>

                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`text-sm font-black ${theme.textTitle}`}>เลือกแล้ว {storageBoxForm.itemIds?.length || 0} รายการ</div>
                    <p className={`text-xs font-bold mt-1 ${theme.textMuted}`}>ถ้าเลือกอุปกรณ์ที่อยู่กล่องอื่น Systemจะย้ายมาอยู่กล่องนี้ให้อัตโนมัติ</p>
                  </div>
                </div>
              </div>

              <div className="flex-1 min-h-0 flex flex-col p-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
                  <div>
                    <h4 className={`text-lg font-black ${theme.textTitle}`}>เลือกอุปกรณ์ในกล่อง</h4>
                    <p className={`text-sm font-bold ${theme.textMuted}`}>ติ๊กเลือก / เอาออกได้เหมือนการจัดการเซ็ตอุปกรณ์</p>
                  </div>
                  <div className="flex gap-2">
                    <button type="button" onClick={() => setStorageBoxForm({...storageBoxForm, itemIds: items.map(i => i.id)})} className={`px-3 py-2 rounded-xl font-bold border text-sm ${theme.btnSecondary}`}>เลือกทั้งหมด</button>
                    <button type="button" onClick={() => setStorageBoxForm({...storageBoxForm, itemIds: []})} className={`px-3 py-2 rounded-xl font-bold border text-sm ${theme.btnSecondary}`}>ล้างทั้งหมด</button>
                  </div>
                </div>

                <div className="relative mb-4 shrink-0">
                  <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${theme.textMuted}`}><Icons.Search className="w-5 h-5" /></div>
                  <input type="text" className={`w-full pl-12 pr-4 py-3 rounded-xl font-bold outline-none border ${theme.input}`} placeholder="ค้นหาชื่ออุปกรณ์, S.N., หมวดหมู่, สถานที่, ชื่อกล่องเดิม..." value={storageBoxSearchTerm} onChange={(e) => setStorageBoxSearchTerm(e.target.value)} />
                </div>

                <div className={`flex-1 overflow-y-auto custom-scrollbar rounded-2xl border p-2 space-y-1 ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  {sortedStorageBoxEditorItems.length === 0 ? (
                    <div className={`text-center py-10 font-bold ${theme.textMuted}`}>ไม่พบอุปกรณ์ที่ค้นหา</div>
                  ) : sortedStorageBoxEditorItems.map((item) => {
                    const selected = (storageBoxForm.itemIds || []).includes(item.id);
                    const movingFromOtherBox = item.storageBoxName && item.storageBoxId !== storageBoxForm.id;
                    return (
                      <label key={item.id} className={`flex items-center justify-between gap-3 p-3 rounded-xl border cursor-pointer transition-all ${selected ? (isDarkMode ? 'bg-cyan-900/30 border-cyan-700' : 'bg-cyan-50 border-cyan-300') : (isDarkMode ? 'bg-slate-800 border-transparent hover:bg-slate-700' : 'bg-white border-transparent hover:bg-slate-100')}`}>
                        <div className="flex items-center gap-3 min-w-0">
                          <input type="checkbox" className="w-5 h-5 accent-cyan-600 rounded shrink-0 cursor-pointer" checked={selected} onChange={(e) => {
                            const newIds = e.target.checked ? [...(storageBoxForm.itemIds || []), item.id] : (storageBoxForm.itemIds || []).filter(id => id !== item.id);
                            setStorageBoxForm({...storageBoxForm, itemIds: [...new Set(newIds)]});
                          }} />
                          <div className="min-w-0">
                            <div className={`font-black truncate ${selected ? (isDarkMode ? 'text-cyan-300' : 'text-cyan-700') : theme.textTitle}`}>{item.name}</div>
                            <div className={`text-xs font-mono truncate ${theme.textMuted}`}>S.N.: {item.sn || '-'} • {item.category || '-'} • {item.location || '-'}</div>
                            {movingFromOtherBox && <div className="text-[11px] font-bold text-amber-500 mt-0.5">อยู่กล่องเดิม: {item.storageBoxName} — ถ้าติ๊กเลือกจะย้ายมากล่องนี้</div>}
                          </div>
                        </div>
                        {item.storageBoxName && <span className={`hidden sm:inline text-[11px] px-2 py-1 rounded-md font-bold whitespace-nowrap ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>📦 {item.storageBoxName}</span>}
                      </label>
                    );
                  })}
                </div>
              </div>
            </div>

            <div className={`p-4 border-t shrink-0 flex flex-col sm:flex-row gap-3 ${theme.divide}`}>
              <button type="button" onClick={() => { setShowStorageBoxEditor(false); setShowStorageBoxesModal(true); }} className={`flex-1 py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleSaveStorageBoxEditor} className="flex-[2] py-4 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl text-lg shadow-md">
                💾 บันทึกกล่องเก็บของ
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Modal กล่องเก็บของ */}
      {showStorageBoxesModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-cyan-900/50 text-cyan-400' : 'bg-cyan-100 text-cyan-600'}`}><Icons.Folder className="w-6 h-6"/></div>
                  กล่องเก็บของ
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดูได้ตลอดว่าแต่ละกล่องมีอะไร และอุปกรณ์แต่ละชิ้นอยู่กล่องไหน</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => openStorageBoxEditor(null)} className={`px-4 py-2.5 rounded-xl font-black transition-colors ${isDarkMode ? 'bg-cyan-600 hover:bg-cyan-500 text-white' : 'bg-cyan-600 hover:bg-cyan-700 text-white shadow-md'}`}>
                  + สร้าง/แก้กล่อง
                </button>
                <button type="button" onClick={() => setShowStorageBoxesModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {(settingsOptions.storageBoxes || []).length === 0 ? (
                <div className={`text-center py-12 font-bold text-xl flex flex-col items-center gap-3 ${theme.textMuted}`}>
                  <Icons.Folder className="w-14 h-14" />
                  ยังไม่มีกล่องเก็บของในSystem
                  <p className="text-sm font-medium max-w-xl">วิธีสร้าง: เลือกอุปกรณ์จากตาราง → กด “สร้าง/เพิ่มเข้ากล่อง” → บันทึกกล่อง จากนั้นค่อยพิมพ์ฉลากจากหน้านี้</p>
                </div>
              ) : (settingsOptions.storageBoxes || []).map((box) => {
                const boxItems = (box.itemIds || []).map((id) => items.find((item) => item.id === id)).filter(Boolean);
                const missingCount = (box.itemIds || []).length - boxItems.length;
                const categories = [...new Set(boxItems.map((item) => item.category || 'ไม่ระบุหมวดหมู่'))];
                return (
                  <div key={box.id} className={`p-5 rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-2">
                          <h4 className={`text-xl font-black truncate ${theme.textTitle}`}>📦 {box.name}</h4>
                          <span className={`text-sm font-bold px-2 py-1 rounded-md ${isDarkMode ? 'bg-cyan-900/40 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>{boxItems.length} รายการ</span>
                          {missingCount > 0 && <span className="text-sm font-bold px-2 py-1 rounded-md bg-rose-100 text-rose-700">หายจากSystem {missingCount} รายการ</span>}
                        </div>
                        {box.note && <p className={`text-sm font-bold mb-2 ${theme.textMuted}`}>หมายเหตุ: {box.note}</p>}
                        <p className={`text-xs font-bold mb-3 ${theme.textMuted}`}>หมวดหมู่ในกล่อง: {categories.length ? categories.join(', ') : '-'}</p>
                        <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                          {boxItems.length === 0 ? (
                            <div className={`text-center py-4 font-bold ${theme.textMuted}`}>ยังไม่มีอุปกรณ์ที่พบในกล่องนี้</div>
                          ) : (
                            <div className="flex flex-wrap gap-2">
                              {boxItems.slice(0, 6).map((item) => (
                                <span key={item.id} className={`max-w-full truncate text-xs sm:text-sm font-bold px-3 py-2 rounded-xl border ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                                  {item.name}
                                </span>
                              ))}
                              {boxItems.length > 6 && (
                                <span className={`text-xs sm:text-sm font-black px-3 py-2 rounded-xl ${isDarkMode ? 'bg-cyan-900/40 text-cyan-400' : 'bg-cyan-100 text-cyan-700'}`}>+ อีก {boxItems.length - 6} รายการ</span>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 w-full lg:w-56 shrink-0">
                        <button type="button" onClick={() => openStorageBoxLabel(box)} className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2"><Icons.Printer className="w-5 h-5"/> พิมพ์ฉลาก</button>
                        <button type="button" onClick={() => openStorageBoxEditor(box)} className="px-4 py-3 bg-cyan-600 hover:bg-cyan-500 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2"><Icons.Edit className="w-4 h-4"/> แก้ไขกล่อง</button>
                        <button type="button" onClick={() => selectStorageBoxItems(box)} className={`px-4 py-3 font-black rounded-xl border flex items-center justify-center gap-2 ${theme.btnSecondary}`}><Icons.CheckCircle className="w-5 h-5"/> เลือกรายการนี้</button>
                        <button type="button" onClick={() => deleteStorageBox(box)} className="px-4 py-3 bg-rose-600 hover:bg-rose-500 text-white font-black rounded-xl shadow-md flex items-center justify-center gap-2"><Icons.Trash className="w-4 h-4"/> ลบกล่อง</button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 💡 Modal รับคืนด่วน */}
      {showQuickReturnModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-lg sm:text-xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600'}`}><Icons.Users className="w-6 h-6"/></div>
                ติดตามสถานะ & รับคืน (ตามบุคคล/งาน)
              </h3>
              <button type="button" onClick={() => setShowQuickReturnModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {activeGroups.length === 0 ? (
                <div className={`text-center py-10 font-bold text-xl flex flex-col items-center gap-3 ${theme.textMuted}`}>
                  <Icons.CheckCircle className="w-12 h-12" />
                  ไม่มีอุปกรณ์ที่รอรับคืนในขณะนี้ (สต๊อกครบ)
                </div>
              ) : activeGroups.map((group, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-start justify-between gap-4 transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-3">
                      {group.type === 'event' ? <Icons.Truck className={`w-6 h-6 ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`} /> : <Icons.Users className={`w-6 h-6 ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`} />}
                      <h4 className={`text-xl font-black truncate ${theme.textTitle}`}>
                        {group.type === 'event' ? 'ออกงาน: ' : 'ผู้ยืม: '} {group.name}
                      </h4>
                      <span className={`shrink-0 text-sm font-bold px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>{group.ids.length} ชิ้น</span>
                    </div>
                    
                    <div className={`p-3 rounded-xl border max-h-40 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className="space-y-1.5">
                        {group.ids.map(id => {
                          const i = items.find(it => it.id === id);
                          if (!i) return null;
                          const isOverdue = i.expectedReturn && new Date(i.expectedReturn).getTime() < todayMs;
                          return (
                            <div key={id} className={`flex justify-between items-center text-sm py-1.5 border-b last:border-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                              <div className="flex items-center gap-2 truncate pr-2">
                                <span className={`font-bold ${theme.textMain}`}>- {i.name}</span>
                                {i.sn && <span className={`text-xs ${theme.textMuted}`}>({i.sn})</span>}
                              </div>
                              <div className="flex gap-2 shrink-0">
                                {isOverdue && <span className="text-[10px] bg-rose-500 text-white px-1.5 py-0.5 rounded font-bold whitespace-nowrap">เลยกำหนด!</span>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-2 mt-2 lg:mt-0 w-full lg:w-auto shrink-0">
                    <button 
                      onClick={() => {
                        setReturnTargetIds([...group.ids]);
                        setReturnChecklist([]);
                        setReturnData({ staff: '', newStaff: '' });
                        setShowQuickReturnModal(false);
                      }}
                      className={`px-6 ${controlPaddingClass} font-black rounded-xl transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'}`}
                    >
                      <Icons.CheckCircle className="w-5 h-5"/> รับคืนกลุ่มนี้
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className={`p-4 border-t ${theme.divide}`}>
              <p className={`text-sm text-center font-bold ${theme.textMuted}`}>* กดปุ่มรับคืนกลุ่มนี้ Systemจะดึงของทั้งหมดไปหน้ารับคืนให้ทันที</p>
            </div>
          </div>
        </div>
      )}

      {/* 🏷️ Modal ทรัพย์สินส่วนตัว (BYOD) */}
      {showPersonalItemsModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-lg sm:text-xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-pink-900/50 text-pink-400' : 'bg-pink-100 text-pink-600'}`}><Icons.Tag className="w-6 h-6"/></div>
                รายการทรัพย์สินส่วนตัว (BYOD)
              </h3>
              <button type="button" onClick={() => setShowPersonalItemsModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {(() => {
                const groups = {};
                let totalPersonalItems = 0;
                items.forEach(item => {
                  if (item.owner) {
                    if (!groups[item.owner]) groups[item.owner] = [];
                    groups[item.owner].push(item);
                    totalPersonalItems++;
                  }
                });

                const ownerKeys = Object.keys(groups).sort();

                if (ownerKeys.length === 0) {
                  return (
                    <div className={`text-center py-10 font-bold text-xl flex flex-col items-center gap-3 ${theme.textMuted}`}>
                      <Icons.Tag className="w-12 h-12" />
                      ยังไม่มีการลงทะเบียนทรัพย์สินส่วนตัวในSystem
                    </div>
                  );
                }

                return (
                  <>
                    <div className={`mb-4 px-4 py-3 rounded-xl border font-bold flex flex-wrap gap-4 ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-700'}`}>
                       <span>👥 เจ้าของทั้งหมด: <span className="text-pink-500">{ownerKeys.length} ท่าน</span></span>
                       <span>📦 อุปกรณ์ส่วนตัวรวม: <span className="text-pink-500">{totalPersonalItems} ชิ้น</span></span>
                    </div>
                    {ownerKeys.map(owner => (
                      <div key={owner} className={`p-5 rounded-2xl border transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                        <div className="flex items-center gap-2 mb-3">
                          <Icons.Users className={`w-6 h-6 ${isDarkMode ? 'text-pink-400' : 'text-pink-500'}`} />
                          <h4 className={`text-xl font-black truncate ${theme.textTitle}`}>
                            ของส่วนตัว: {owner}
                          </h4>
                          <span className={`shrink-0 text-sm font-bold px-2 py-0.5 rounded-md ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>{groups[owner].length} ชิ้น</span>
                        </div>
                        
                        <div className={`p-3 rounded-xl border max-h-40 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                          <div className="space-y-1.5">
                            {groups[owner].map(i => {
                              const s = STATUSES.find(st => st.id === i.status) || STATUSES[0];
                              return (
                                <div key={i.id} className={`flex justify-between items-center text-sm py-2 border-b last:border-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                                  <div className="flex flex-col min-w-0 pr-2">
                                    <div className="flex items-center gap-2">
                                      <span className={`font-bold text-base truncate ${theme.textMain}`}>- {i.name}</span>
                                      <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap ${isDarkMode ? s.darkColor : s.color}`}>{s.label}</span>
                                    </div>
                                    <div className="flex gap-3 mt-1">
                                      {i.sn && <span className={`text-xs ${theme.textMuted}`}>S.N.: {i.sn}</span>}
                                      {i.category && <span className={`text-xs ${theme.textMuted}`}>หมวดหมู่: {i.category}</span>}
                                    </div>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </>
                );
              })()}
            </div>
            <div className={`p-4 border-t shrink-0 ${theme.divide}`}>
              <button type="button" onClick={() => setShowPersonalItemsModal(false)} className={`w-full py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal (การตั้งค่าทั่วไป + ฐานข้อมูล) */}
      {showSettings && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`settings-shell rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300 border ${theme.cardBg}`}>
            <div className={`p-5 border-b shrink-0 flex items-start justify-between gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl sm:text-3xl font-black ${theme.textTitle}`}>ตั้งค่าSystem</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ตั้งค่าหมวดข้อมูล ผู้ใช้งาน เอกสาร และระบบในรูปแบบเดียวกัน</p>
              </div>
              <button type="button" onClick={() => { setShowSettings(false); resetSettingsFormState(); }} className={`p-2 rounded-xl hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              <div className="flex flex-col flex-1 min-h-0">
                <div className={`p-3 sm:p-4 border-b ${theme.divide}`}>
                  <div className="settings-nav-grid grid grid-cols-2 sm:grid-cols-4 xl:grid-cols-8 gap-2">
                    {settingsNavItems.map((nav) => {
                      const Icon = nav.icon || Icons.Settings;
                      const active = settingsTab === nav.id;
                      return (
                        <button
                          key={nav.id}
                          type="button"
                          onClick={() => { setSettingsTab(nav.id); resetSettingsFormState(); if (nav.id === 'accounts') openNewAccountForm(); }}
                          className={`p-3 rounded-2xl border text-left transition-all hover:-translate-y-0.5 hover:shadow-lg ${active ? (isDarkMode ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-blue-600 border-blue-600 text-white shadow-md') : theme.btnSecondary}`}
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="w-5 h-5 shrink-0" />
                            <div className="font-black truncate text-sm sm:text-base">{nav.label}</div>
                          </div>
                          <div className={`hidden sm:block text-xs font-bold truncate mt-1 ${active ? 'text-blue-100' : theme.textMuted}`}>{nav.desc}</div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col min-h-0">
                            <div className={`px-5 sm:px-6 pt-5 pb-0`}>
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-xs font-black tracking-[0.14em] uppercase ${theme.textMuted}`}>SETTING</div>
                  <div className={`text-xl font-black mt-1 ${theme.textTitle}`}>{settingsNavItems.find(nav => nav.id === settingsTab)?.label || 'ตั้งค่าSystem'}</div>
                  <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>{settingsNavItems.find(nav => nav.id === settingsTab)?.desc || 'จัดการSystem'}</div>
                </div>
              </div>
              {settingsTab === 'accounts' ? (
                <div className="p-6 space-y-6">
                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
                    <h4 className={`text-xl font-black mb-2 flex items-center gap-2 ${theme.textTitle}`}><Icons.Users className="w-6 h-6 text-indigo-500"/> จัดการบัญชีพนักงาน</h4>
                    <p className={`text-sm font-bold ${theme.textMuted}`}>บัญชีกลางสามารถเพิ่ม แก้ไข ปิดใช้งาน หรือลบบัญชีพนักงานได้ ใช้สำหรับระบุตัวผู้ทำรายการในSystemและ Audit Log</p>
                    <p className={`text-xs mt-2 font-bold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>* เวอร์ชันทดลองนี้เป็นSystemล็อกอินภายในของเว็บ ยังไม่ใช่ Firebase Auth แบบองค์กร</p>
                    <p className={`text-xs mt-1 font-bold ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>* Systemจะกัน PIN ที่เดาง่ายเกินไป ออกจากSystemอัตโนมัติเมื่อไม่ใช้งาน 2 ชั่วโมง และไม่แสดง PIN เดิมบนหน้าจอ</p>
                  </div>

                  <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h5 className={`font-black text-lg mb-4 ${theme.textTitle}`}>{editingAccountId ? 'แก้ไขบัญชี' : 'เพิ่มบัญชีพนักงานใหม่'}</h5>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-bold mb-1.5 ${theme.textMuted}`}>ชื่อพนักงาน</label>
                        <input type="text" className={`w-full px-4 py-3 rounded-xl font-bold outline-none border ${theme.input}`} placeholder="เช่น ครูศิริชัย" value={accountForm.name} onChange={e => setAccountForm({...accountForm, name: e.target.value})} disabled={!canManageAccounts} />
                      </div>
                      <div>
                        <label className={`block text-sm font-bold mb-1.5 ${theme.textMuted}`}>Username</label>
                        <input type="text" className={`w-full px-4 py-3 rounded-xl font-bold outline-none border ${theme.input}`} placeholder="เช่น sirichai" value={accountForm.username} onChange={e => setAccountForm({...accountForm, username: e.target.value})} disabled={!canManageAccounts} />
                      </div>
                      {!editingAccountId ? (
                        <div>
                          <label className={`block text-sm font-bold mb-1.5 ${theme.textMuted}`}>PIN สำหรับเข้าสู่System</label>
                          <input type="password" className={`w-full px-4 py-3 rounded-xl font-bold outline-none border ${theme.input}`} placeholder="อย่างน้อย 4 ตัว" value={accountForm.pin} onChange={e => setAccountForm({...accountForm, pin: e.target.value})} disabled={!canManageAccounts} />
                        </div>
                      ) : (
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                          <div className="font-black mb-1">PIN ถูกซ่อนไว้เพื่อความปลอดภัย</div>
                          <div className={`text-xs font-bold ${theme.textMuted}`}>หากต้องการเปลี่ยนรหัส ให้ใช้ปุ่ม “รีเซ็ต PIN” ในรายการบัญชีด้านล่าง</div>
                        </div>
                      )}
                      <div>
                        <label className={`block text-sm font-bold mb-1.5 ${theme.textMuted}`}>สิทธิ์</label>
                        <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none border ${theme.input}`} value={accountForm.role} onChange={e => setAccountForm({...accountForm, role: e.target.value})} disabled={!canManageAccounts}>
                          <option value="owner">บัญชีกลาง - จัดการได้ทุกอย่าง</option>
                          <option value="admin">ผู้ดูแล - จัดการSystem/บัญชี/ลบข้อมูลได้</option>
                          <option value="staff">เจ้าหน้าที่ - เพิ่ม/แก้ไข/ยืม/คืน/ออกงานได้</option>
                          <option value="viewer">ดูอย่างเดียว - ค้นหาและดูสถานะเท่านั้น</option>
                        </select>
                      </div>
                      <label className={`sm:col-span-2 flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={accountForm.active !== false} onChange={e => setAccountForm({...accountForm, active: e.target.checked})} disabled={!canManageAccounts} />
                        <span className={`font-bold ${theme.textMain}`}>เปิดใช้งานบัญชีนี้</span>
                      </label>
                    </div>
                    <div className="flex gap-3 mt-5">
                      {editingAccountId && <button type="button" onClick={openNewAccountForm} className={`flex-1 py-3 font-bold rounded-xl ${theme.btnCancel}`}>ยกเลิกแก้ไข</button>}
                      <button type="button" onClick={handleSaveAccount} disabled={!canManageAccounts} className={`flex-[2] py-3 font-black rounded-xl text-white ${canManageAccounts ? 'bg-indigo-600 hover:bg-indigo-500' : 'bg-slate-400 cursor-not-allowed'}`}>{editingAccountId ? 'บันทึกการแก้ไขบัญชี' : 'เพิ่มบัญชีพนักงาน'}</button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {getEffectiveAccounts().map((acc) => (
                      <div key={acc.id} className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2 mb-1">
                            <span className={`font-black text-lg truncate ${theme.textTitle}`}>{acc.name || acc.username}</span>
                            <span className={`text-xs px-2 py-1 rounded-lg border font-black ${roleBadgeClass(acc.role)}`}>{roleLabel(acc.role)}</span>
                            {acc.active === false && <span className="text-xs px-2 py-1 rounded-lg bg-rose-100 text-rose-700 border border-rose-200 font-black">ปิดใช้งาน</span>}
                          </div>
                          <div className={`text-sm font-bold ${theme.textMuted}`}>@{acc.username} {currentOperator?.id === acc.id ? '• กำลังใช้งานอยู่' : ''}</div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          <button type="button" onClick={() => openEditAccountForm(acc)} className={`px-4 py-2 rounded-xl font-bold ${isDarkMode ? 'bg-blue-900/40 text-blue-300 hover:bg-blue-800' : 'bg-blue-50 text-blue-600 hover:bg-blue-100'}`}>แก้ไข</button>
                          <button type="button" onClick={() => handleResetAccountPin(acc)} disabled={!canManageAccounts || (acc.role === 'owner' && currentAccountRole !== 'owner')} className={`px-4 py-2 rounded-xl font-bold ${(!canManageAccounts || (acc.role === 'owner' && currentAccountRole !== 'owner')) ? (isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed') : (isDarkMode ? 'bg-amber-900/40 text-amber-300 hover:bg-amber-800' : 'bg-amber-50 text-amber-600 hover:bg-amber-100')}`}>รีเซ็ต PIN</button>
                          <button type="button" onClick={() => handleDeleteAccount(acc)} disabled={!canManageAccounts || String(acc.username || '').toLowerCase() === 'admin' || acc.active === false} className={`px-4 py-2 rounded-xl font-bold ${(!canManageAccounts || String(acc.username || '').toLowerCase() === 'admin' || acc.active === false) ? (isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-100 text-slate-400 cursor-not-allowed') : (isDarkMode ? 'bg-rose-900/40 text-rose-300 hover:bg-rose-800' : 'bg-rose-50 text-rose-600 hover:bg-rose-100')}`}>ปิดใช้งาน</button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : settingsTab === 'display' ? (
                <div className="p-6 space-y-6">
                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-teal-900/20 border-teal-800' : 'bg-teal-50 border-teal-200'}`}>
                    <h4 className={`text-xl font-black mb-2 flex items-center gap-2 ${theme.textTitle}`}><Icons.ViewGrid className="w-6 h-6 text-teal-500"/> ตั้งค่าการแสดงผล</h4>
                    <p className={`text-sm font-bold ${theme.textMuted}`}>ปรับหน้าเว็บให้เหมาะกับการใช้งานจริง เลือกได้ว่าจะเน้นโล่งสบายตาหรือเห็นข้อมูลเยอะขึ้น</p>
                  </div>

                  <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`font-black text-lg mb-3 ${theme.textTitle}`}>ความแน่นของหน้าจอ</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        ['comfortable', 'Comfortable', 'ช่องว่างเยอะ ปุ่มใหญ่ ใช้งานสบาย'],
                        ['compact', 'Compact', 'เห็นข้อมูลมากขึ้น เหมาะกับคอม']
                      ].map(([value, title, desc]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => saveUiSettings({ density: value })}
                          className={`text-left p-4 rounded-2xl border transition-all ${uiDisplaySettings.density === value ? 'bg-teal-600 text-white border-teal-600 shadow-lg' : theme.btnSecondary}`}
                        >
                          <div className="font-black text-lg">{title}</div>
                          <div className={`text-xs font-bold mt-1 ${uiDisplaySettings.density === value ? 'text-teal-50' : theme.textMuted}`}>{desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      ['mobileCards', 'ใช้ Card View บนมือถือ', 'เปลี่ยนรายการอุปกรณ์จากตารางเป็นการ์ด อ่านง่ายและกดปุ่มง่ายขึ้นบนมือถือ'],
                      ['cleanMode', 'โหมดสะอาดตา', 'ลดความรู้สึกรกของหน้าแรกและเน้นปุ่มหลักที่ใช้บ่อย'],
                      ['reduceEffects', 'ลดเงา/เอฟเฟกต์', 'เหมาะกับเครื่องที่ช้าหรืออยากได้หน้าตาเรียบกว่าเดิม']
                    ].map(([key, title, desc]) => (
                      <label key={key} className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          className="w-5 h-5 mt-1 accent-teal-600 shrink-0"
                          checked={uiDisplaySettings[key] !== false}
                          onChange={(e) => saveUiSettings({ [key]: e.target.checked })}
                        />
                        <span className="min-w-0">
                          <span className={`block font-black ${theme.textTitle}`}>{title}</span>
                          <span className={`block text-sm font-bold mt-1 ${theme.textMuted}`}>{desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                    <div className={`font-black mb-2 ${theme.textTitle}`}>แนะนำสำหรับศูนย์ MDEC</div>
                    <div className={`text-sm font-bold ${theme.textMuted}`}>ใช้ Comfortable + Card View บนมือถือ สำหรับเจ้าหน้าที่ทั่วไป และใช้ Compact บนคอมของบัญชีกลางเมื่อต้องInventory Managementจำนวนมาก</div>
                  </div>
                </div>
              ) : settingsTab === 'documents' ? (
                <div className="p-6 space-y-6">
                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-sky-900/20 border-sky-800' : 'bg-sky-50 border-sky-200'}`}>
                    <h4 className={`text-xl font-black mb-2 flex items-center gap-2 ${theme.textTitle}`}><Icons.Printer className="w-6 h-6 text-sky-500"/> ตั้งค่าเอกสารและโลโก้</h4>
                    <p className={`text-sm font-bold ${theme.textMuted}`}>เลือกได้ว่าโลโก้ MDEC จะแสดงบน QR ใบยืม ฉลากกล่อง รูปหลักฐาน และ watermark มากน้อยแค่ไหน โดยไม่ต้องแก้โค้ดใหม่</p>
                  </div>

                  <div className="grid grid-cols-1 gap-3">
                    {[
                      ['qrLogo', 'แสดงโลโก้บน QR และฉลาก QR', 'เหมาะกับการยืนยันว่า QR นี้เป็นทรัพย์สินของศูนย์'],
                      ['slipLogo', 'แสดงโลโก้บนใบยืม / ใบเตรียมของ', 'ทำให้เอกสารดูเป็นทางการและเป็นของ MDEC'],
                      ['boxLabelLogo', 'แสดงโลโก้บนฉลากกล่อง', 'เหมาะกับฉลากกล่องหรือบรรจุภัณฑ์'],
                      ['proofStamp', 'ประทับตรา MDEC บนรูปหลักฐาน', 'ใช้กับรูปหลักฐานยืม-คืนที่ถ่ายผ่านเว็บ'],
                      ['watermark', 'แสดง watermark จาง ๆ บนเอกสาร', 'ทำให้ใบยืม/ใบเตรียมของดูเป็นเอกสารSystem']
                    ].map(([key, title, desc]) => (
                      <label key={key} className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <input
                          type="checkbox"
                          className="w-5 h-5 mt-1 accent-sky-600 shrink-0"
                          checked={documentBrandSettings[key] !== false}
                          onChange={(e) => saveDocumentSettings({ [key]: e.target.checked })}
                        />
                        <span className="min-w-0">
                          <span className={`block font-black ${theme.textTitle}`}>{title}</span>
                          <span className={`block text-sm font-bold mt-1 ${theme.textMuted}`}>{desc}</span>
                        </span>
                      </label>
                    ))}
                  </div>

                  <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`font-black text-lg mb-3 ${theme.textTitle}`}>ขนาดโลโก้บนเอกสาร</div>
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        ['small', 'เล็ก'],
                        ['normal', 'ปกติ'],
                        ['large', 'ใหญ่']
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => saveDocumentSettings({ logoSize: value })}
                          className={`px-3 py-3 rounded-xl font-black border ${documentBrandSettings.logoSize === value ? 'bg-sky-600 text-white border-sky-600' : theme.btnSecondary}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className={`p-5 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`font-black text-lg mb-3 ${theme.textTitle}`}>โทนเอกสารตอนพิมพ์</div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {[
                        ['official', 'ทางการ มีโลโก้/Watermark'],
                        ['ink', 'ประหยัดหมึก ลดพื้นหลัง']
                      ].map(([value, label]) => (
                        <button
                          key={value}
                          type="button"
                          onClick={() => saveDocumentSettings({ printTone: value })}
                          className={`px-3 py-3 rounded-xl font-black border ${documentBrandSettings.printTone === value ? 'bg-sky-600 text-white border-sky-600' : theme.btnSecondary}`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                    <p className={`text-xs font-bold mt-3 ${theme.textMuted}`}>แนะนำ: ใช้ “ทางการ” สำหรับเอกสารแนบงานหรือส่งผู้บริหาร และใช้ “ประหยัดหมึก” สำหรับเอกสารภายในที่พิมพ์บ่อย</p>
                  </div>

                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                    <div className={`font-black mb-2 ${theme.textTitle}`}>ตัวอย่างภาพลักษณ์</div>
                    <div className={`rounded-2xl p-5 border bg-white text-slate-900 ${isDarkMode ? 'border-blue-800' : 'border-blue-100'}`}>
                      <div className="flex items-center justify-between gap-4 border-b border-slate-200 pb-4">
                        {showDocumentLogo('slipLogo') ? renderOrgSignature({ title: 'ใบยืมอุปกรณ์', subtitle: 'ศูนย์มัลติมีเดียทางการศึกษา', titleClass: 'text-slate-900 text-xl', subtitleClass: 'text-slate-500', logoClassName: 'w-24 h-14 rounded-2xl border border-slate-200 px-3 py-2 shadow-sm' }) : <div className="font-black text-2xl">ใบยืมอุปกรณ์</div>}
                        <div className="text-right text-sm font-black text-slate-500">{makeDocumentRef('BR')}</div>
                      </div>
                      <div className="mt-4 grid grid-cols-2 gap-3 text-sm">
                        <div className="rounded-xl border border-slate-200 p-3"><div className="text-slate-400 font-bold">ผู้ยืม</div><div className="font-black">ตัวอย่างผู้ยืม</div></div>
                        <div className="rounded-xl border border-slate-200 p-3"><div className="text-slate-400 font-bold">เจ้าหน้าที่</div><div className="font-black">{currentAccountLabel}</div></div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : settingsTab === 'database' ? (
                <div className="p-6 space-y-6">
                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-200 text-blue-700'}`}>
                    <div className="font-black text-base mb-1">คำแนะนำก่อนจัดการฐานข้อมูล</div>
                    <div className="text-sm font-bold">แนะนำให้ใช้ “ศูนย์สำรองข้อมูล” เพื่อดาวน์โหลด JSON สำหรับกู้คืน, CSV สำหรับเปิดใน Google Sheets และ HTML สำหรับดูรูปหลักฐาน ก่อนล้างประวัติทุกครั้ง</div>
                  </div>
                  <div className={`p-6 rounded-2xl border shadow-sm ${databaseStorageEstimate.cardTone}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 mb-4">
                      <div>
                        <h4 className={`text-xl font-black mb-1 flex items-center gap-2 ${theme.textTitle}`}><Icons.Signal className={`w-6 h-6 ${databaseStorageEstimate.textTone}`}/> สถานะพื้นที่ฐานข้อมูล</h4>
                        <p className={`text-sm font-bold ${theme.textMuted}`}>ประเมินจากข้อมูลที่เว็บโหลดอยู่ เทียบกับพื้นที่ 1GB</p>
                      </div>
                      <span className={`px-3 py-1.5 rounded-xl text-sm font-black border ${databaseStorageEstimate.cardTone} ${databaseStorageEstimate.textTone}`}>
                        {databaseStorageEstimate.label}
                      </span>
                    </div>

                    <div className={`w-full h-5 rounded-full overflow-hidden border shadow-inner ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <div className={`h-full rounded-full transition-all duration-500 ${databaseStorageEstimate.barClass}`} style={{ width: `${Math.max(databaseStorageEstimate.percent, databaseStorageEstimate.percent > 0 ? 1 : 0)}%` }}></div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-4">
                      <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>ใช้ไปประมาณ</div>
                        <div className={`text-lg font-black ${databaseStorageEstimate.textTone}`}>{databaseStorageEstimate.percentText}</div>
                      </div>
                      <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>ขนาดประเมิน</div>
                        <div className={`text-lg font-black ${theme.textTitle}`}>{databaseStorageEstimate.estimatedText}</div>
                      </div>
                      <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>อุปกรณ์</div>
                        <div className={`text-lg font-black ${theme.textTitle}`}>{databaseStorageEstimate.itemCount} ชิ้น</div>
                      </div>
                      <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>ประวัติยืม-คืน</div>
                        <div className={`text-lg font-black ${theme.textTitle}`}>{databaseStorageEstimate.historyCount} รายการ</div>
                      </div>
                      <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>รูปหลักฐาน</div>
                        <div className={`text-lg font-black ${theme.textTitle}`}>{databaseStorageEstimate.proofImageCount} รูป</div>
                        <div className={`text-[10px] font-bold ${theme.textMuted}`}>{databaseStorageEstimate.proofStorageText}</div>
                      </div>
                    </div>

                    <p className={`text-xs mt-3 font-bold ${theme.textMuted}`}>
                      * เป็นค่าประมาณเพื่อช่วยดูแนวโน้ม ไม่ใช่ตัวเลข Usage จริงจาก Firebase Console โดยตรง ถ้าเริ่มเกิน 75% ควรสำรอง JSON/CSV และล้างประวัติรายปี ส่วนรูปหลักฐานจะถูกย่อไฟล์ก่อนเก็บ
                    </p>
                  </div>

                  <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-blue-900/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                    <h4 className={`text-xl font-black mb-2 flex items-center gap-2 ${theme.textTitle}`}><Icons.Download className="w-6 h-6 text-blue-500"/> ศูนย์สำรองข้อมูลครบชุด</h4>
                    <p className={`text-sm mb-4 font-medium ${theme.textMuted}`}>ปุ่มหลักจะดาวน์โหลดครบทั้ง JSON สำหรับกู้คืน, CSV สำหรับ Google Sheets และ HTML สำหรับเปิดดูรูปหลักฐาน</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <button type="button" onClick={() => setShowBackupCenterModal(true)} className="sm:col-span-2 w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-base">
                        <Icons.Database className="w-5 h-5"/> เปิดศูนย์สำรองข้อมูล
                      </button>
                      <button type="button" onClick={exportFullBackupJSON} className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-base">
                        <Icons.Download className="w-5 h-5"/> เฉพาะ JSON
                      </button>
                      <button type="button" onClick={exportSheetsCSVPack} className="w-full py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-base">
                        <Icons.History className="w-5 h-5"/> เฉพาะ CSV
                      </button>
                    </div>
                    <p className={`text-xs mt-3 font-bold ${theme.textMuted}`}>* CSV เปิดใน Google Sheets ได้แต่ไม่มีรูปจริง ส่วนไฟล์ HTML Gallery ใช้เปิดดูรูปหลักฐานจริงได้ทันที</p>
                    <div className={`mt-3 p-3 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-white border-blue-100 text-slate-600'}`}>
                      สำรองล่าสุด: {settingsOptions.backupMeta?.latest ? new Date(settingsOptions.backupMeta.latest).toLocaleString('th-TH', { hour12: false }) : 'ยังไม่มีข้อมูลการสำรองในSystem'}
                    </div>
                    <div className={`mt-4 p-4 rounded-xl border ${isDarkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                      <h5 className={`text-base font-black mb-1 flex items-center gap-2 ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                        <Icons.Upload className="w-4 h-4" /> กู้คืนข้อมูลจาก JSON
                      </h5>
                      <p className={`text-xs mb-3 font-bold ${isDarkMode ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                        ใช้เมื่อจำเป็นเท่านั้น Systemจะเขียนทับ/เพิ่มข้อมูลจากไฟล์ JSON แต่จะไม่ลบอุปกรณ์ที่ไม่มีในไฟล์สำรอง
                      </p>
                      <input type="file" accept=".json,application/json" className="hidden" ref={restoreInputRef} onChange={handleRestoreBackupJSON} />
                      <button type="button" onClick={() => restoreInputRef.current?.click()} className="w-full py-3 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-base">
                        <Icons.Upload className="w-5 h-5"/> เลือกไฟล์ JSON เพื่อกู้คืน
                      </button>
                    </div>

                    <div className={`mt-5 p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <h5 className={`text-base font-black mb-1 flex items-center gap-2 ${theme.textTitle}`}>
                        <Icons.CheckCircle className="w-4 h-4 text-emerald-500" /> Checklist ปิดปีการศึกษา
                      </h5>
                      <p className={`text-xs mb-3 font-bold ${theme.textMuted}`}>ใช้เช็กก่อนสำรองและล้างประวัติรายปี เพื่อกันพลาด</p>
                      <button type="button" onClick={() => setShowAnnualCleanupModal(true)} className={`w-full py-3 rounded-xl font-black border ${theme.btnSecondary}`}>เปิด Checklist ปิดปีการศึกษา</button>
                    </div>

                    <div className={`mt-5 p-4 rounded-xl border ${isDarkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200'}`}>
                      <h5 className={`text-base font-black mb-1 flex items-center gap-2 ${isDarkMode ? 'text-rose-300' : 'text-rose-700'}`}>
                        <Icons.Trash className="w-4 h-4" /> ล้างประวัติยืม-คืนทั้งหมด
                      </h5>
                      <p className={`text-xs mb-3 font-bold ${isDarkMode ? 'text-rose-300/80' : 'text-rose-700/80'}`}>
                        ใช้หลังจากสำรองข้อมูลรายปีแล้ว Systemจะล้างเฉพาะประวัติใน history ของอุปกรณ์ทุกชิ้น ไม่ลบรายการอุปกรณ์และไม่เปลี่ยนสถานะปัจจุบัน
                      </p>
                      <button type="button" onClick={clearAllBorrowReturnHistory} className="w-full py-3 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-base">
                        <Icons.Trash className="w-5 h-5"/> ล้างประวัติยืม-คืนทั้งหมด
                      </button>
                    </div>
                  </div>
                  <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className={`text-xl font-black mb-2 flex items-center gap-2 ${theme.textTitle}`}><Icons.Download className="w-6 h-6 text-emerald-500"/> สำรองข้อมูล (Export)</h4>
                    <p className={`text-sm mb-4 font-medium ${theme.textMuted}`}>ดาวน์โหลดข้อมูลสต๊อกทั้งหมดออกมาเป็นไฟล์ Excel (.csv) เพื่อเก็บสำรองไว้ในคอมพิวเตอร์ของคุณ</p>
                    <button onClick={exportToCSV} className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-lg">
                      <Icons.Download className="w-5 h-5"/> โหลดไฟล์ CSV
                    </button>
                  </div>

                  <div className={`p-6 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h4 className={`text-xl font-black mb-2 flex items-center gap-2 ${theme.textTitle}`}><Icons.Upload className="w-6 h-6 text-blue-500"/> นำเข้าข้อมูล (Import)</h4>
                    <p className={`text-sm mb-4 font-medium ${theme.textMuted}`}>อัปโหลดไฟล์ .csv เพื่อเพิ่มอุปกรณ์ทีละหลายๆ ชิ้น (Format: ชื่อ, S.N., หมวดหมู่, ฝ่าย, สถานที่, จำนวน)</p>
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-md transition-colors flex justify-center items-center gap-2 text-lg">
                      <Icons.Upload className="w-5 h-5"/> เลือกไฟล์ CSV
                    </button>
                  </div>
                </div>
              ) : settingsTab === 'proofs' ? (
                <div className="p-6 space-y-5">
                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-pink-900/20 border-pink-800' : 'bg-pink-50 border-pink-200'}`}>
                    <h4 className={`text-xl font-black mb-2 flex items-center gap-2 ${theme.textTitle}`}>📷 กติกาหลักฐานรูปภาพ</h4>
                    <p className={`text-sm font-bold ${theme.textMuted}`}>ใช้ควบคุมการย่อรูปและการบังคับแนบหลักฐาน เพื่อให้ฐานข้อมูล 1GB อยู่ได้ยาวขึ้น</p>
                  </div>

                  <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 p-5 rounded-2xl border ${theme.cardBg}`}>
                    <label className="block"><span className={`block text-sm font-bold mb-1 ${theme.textMuted}`}>ขนาดเป้าหมายต่อรูป (KB)</span><input type="number" min="60" max="300" className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={activeProofSettings.targetKB} onChange={e => updateProofSettings({ targetKB: e.target.value })} /></label>
                    <label className="block"><span className={`block text-sm font-bold mb-1 ${theme.textMuted}`}>เตือนเมื่อเกิน (KB)</span><input type="number" min="80" max="600" className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={activeProofSettings.warnKB} onChange={e => updateProofSettings({ warnKB: e.target.value })} /></label>
                    <label className="block"><span className={`block text-sm font-bold mb-1 ${theme.textMuted}`}>ห้ามบันทึกถ้าเกิน (KB)</span><input type="number" min="120" max="900" className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={activeProofSettings.maxKB} onChange={e => updateProofSettings({ maxKB: e.target.value })} /></label>
                    <label className="block"><span className={`block text-sm font-bold mb-1 ${theme.textMuted}`}>จำนวนรูปสูงสุดต่อครั้ง</span><input type="number" min="1" max="5" className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={activeProofSettings.maxImagesPerAction} onChange={e => updateProofSettings({ maxImagesPerAction: e.target.value })} /></label>
                  </div>

                  <div className={`p-5 rounded-2xl border ${theme.cardBg}`}>
                    <h5 className={`font-black text-lg mb-3 ${theme.textTitle}`}>บังคับ/แนะนำหลักฐานตามประเภทงาน</h5>
                    {[['borrowRequirement','ยืมอุปกรณ์'], ['eventRequirement','นำออกงาน'], ['returnRequirement','รับคืน']].map(([key,label]) => (
                      <div key={key} className="flex items-center justify-between gap-3 py-2">
                        <div className={`font-bold ${theme.textTitle}`}>{label}</div>
                        <select className={`px-3 py-2 rounded-xl border font-bold ${theme.input}`} value={activeProofSettings[key]} onChange={e => updateProofSettings({ [key]: e.target.value })}>
                          <option value="optional">ไม่บังคับ</option>
                          <option value="recommended">แนะนำแต่ไม่บังคับ</option>
                          <option value="required">บังคับแนบรูป</option>
                        </select>
                      </div>
                    ))}
                  </div>

                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-slate-900/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <h5 className={`font-black text-lg mb-3 ${theme.textTitle}`}>สถานะรูปหลักฐาน</h5>
                    <div className="grid grid-cols-2 gap-3">
                      <div className={`p-3 rounded-xl border ${theme.btnSecondary}`}><div className={`text-xs font-bold ${theme.textMuted}`}>จำนวนรูป</div><div className={`text-2xl font-black ${theme.textTitle}`}>{databaseStorageEstimate.proofImageCount}</div></div>
                      <div className={`p-3 rounded-xl border ${theme.btnSecondary}`}><div className={`text-xs font-bold ${theme.textMuted}`}>พื้นที่รูป</div><div className={`text-2xl font-black ${theme.textTitle}`}>{databaseStorageEstimate.proofStorageText}</div></div>
                      <div className={`p-3 rounded-xl border ${theme.btnSecondary}`}><div className={`text-xs font-bold ${theme.textMuted}`}>เฉลี่ย/รูป</div><div className={`text-2xl font-black ${theme.textTitle}`}>{formatProofBytes(proofStorageForecast.avgBytes || 0)}</div></div>
                      <div className={`p-3 rounded-xl border ${theme.btnSecondary}`}><div className={`text-xs font-bold ${theme.textMuted}`}>ยังพอเพิ่มได้ประมาณ</div><div className={`text-2xl font-black ${theme.textTitle}`}>{proofStorageForecast.remainingByAvg.toLocaleString('th-TH')} รูป</div></div>
                    </div>
                    <p className={`text-xs font-bold mt-3 ${theme.textMuted}`}>แนะนำถ่ายภาพรวมต่อรายการยืม/คืน/ออกงาน ไม่ถ่ายทุกชิ้น เพื่อให้พื้นที่อยู่ได้ทั้งปี</p>
                  </div>
                </div>
              ) : (
                <div className="p-6">
                  <div className="flex gap-2 mb-6">
                    <input type="text" className={`flex-1 px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} placeholder={`พิมพ์${settingsTab === 'categories' ? 'หมวดหมู่' : settingsTab === 'locations' ? 'สถานที่' : 'ชื่อเจ้าหน้าที่'}ใหม่...`} value={newSettingItem} onChange={e => setNewSettingItem(e.target.value)} />
                    <button type="button" onClick={handleSaveSetting} className="px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-lg">{editingSettingItem !== null ? 'บันทึก' : 'เพิ่ม'}</button>
                    {editingSettingItem !== null && <button type="button" onClick={() => { setEditingSettingItem(null); setNewSettingItem(''); }} className={`px-4 py-3 font-bold rounded-xl ${theme.btnCancel}`}><Icons.X className="w-5 h-5" /></button>}
                  </div>
                  <div className="max-h-[50vh] overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                    {(settingsOptions[settingsTab] || []).filter(c => c !== 'อื่นๆ').map((item, index) => (
                      <div key={index} className={`flex justify-between items-center p-4 border rounded-xl group transition-colors ${theme.btnSecondary}`}>
                        <span className={`font-bold text-lg ${theme.textTitle}`}>{item}</span>
                        <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                          <button type="button" onClick={() => { setEditingSettingItem(item); setNewSettingItem(item); }} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-blue-900/40 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white'}`}><Icons.Edit className="w-4 h-4" /></button>
                          <button type="button" onClick={() => setDeleteSettingConfirm(item)} className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${isDarkMode ? 'bg-rose-900/40 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white'}`}><Icons.Trash className="w-4 h-4" /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              </div>
              </div>
            </div>

            <div className={`p-4 border-t shrink-0 ${theme.divide}`}>
              <button type="button" onClick={() => { setShowSettings(false); resetSettingsFormState(); }} className={`w-full py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}


      {/* ศูนย์สำรองข้อมูล / Backup ปิดปี */}
      {showBackupCenterModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-3 sm:p-4 z-[10000]`}>
          <div className={`rounded-[1.75rem] sm:rounded-[2rem] w-full max-w-4xl max-h-[92dvh] shadow-2xl border overflow-hidden flex flex-col ${theme.cardBg}`}>
            <div className={`p-4 sm:p-6 border-b shrink-0 ${theme.divide}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-black mb-3 ${isDarkMode ? 'bg-blue-900/35 text-blue-300 border border-blue-800' : 'bg-blue-50 text-blue-700 border border-blue-200'}`}>
                    <Icons.Database className="w-4 h-4" /> Backup / ปิดปี
                  </div>
                  <h3 className={`text-lg sm:text-xl font-black leading-tight ${theme.textTitle}`}>ศูนย์สำรองข้อมูลครบชุด</h3>
                  <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดาวน์โหลดไฟล์สำรองก่อนปิดปี ล้างประวัติ หรือกู้คืนข้อมูลจาก JSON</p>
                </div>
                <button type="button" onClick={() => setShowBackupCenterModal(false)} className={`w-10 h-10 rounded-2xl flex items-center justify-center border shrink-0 ${theme.btnCancel}`} title="ปิด">
                  <Icons.X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 sm:p-6 space-y-4">
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-amber-950/25 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                <div className="font-black mb-1">แนะนำสำหรับปิดปี</div>
                <div className="text-sm font-bold opacity-90">ให้กด “สำรองข้อมูลครบชุด” ก่อนเป็นอันดับแรก แล้วค่อยตรวจ Checklist ปิดปี หรือกดล้างประวัติเมื่อมั่นใจแล้วเท่านั้น</div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_.9fr] gap-4">
                <div className={`p-5 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div>
                      <h4 className={`text-lg sm:text-xl font-black flex items-center gap-2 ${theme.textTitle}`}><Icons.Download className="w-5 h-5 text-blue-500"/> สำรองข้อมูล</h4>
                      <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดาวน์โหลดไฟล์เก็บไว้ในคอม/Google Drive</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600'}`}>{items.length.toLocaleString('th-TH')} อุปกรณ์</span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button type="button" onClick={exportOneStopBackupSet} disabled={isBusy} className={`sm:col-span-2 w-full py-4 rounded-2xl font-black shadow-md flex items-center justify-center gap-2 ${isBusy ? 'bg-slate-400 text-white cursor-wait' : 'bg-blue-600 hover:bg-blue-500 text-white'}`}>
                      <Icons.Database className="w-5 h-5"/> {isBusy ? 'กำลังเตรียมไฟล์...' : 'สำรองข้อมูลครบชุด'}
                    </button>
                    <button type="button" onClick={exportFullBackupJSON} className="w-full py-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black flex items-center justify-center gap-2">
                      <Icons.Download className="w-5 h-5"/> JSON กู้คืนSystem
                    </button>
                    <button type="button" onClick={exportSheetsCSVPack} className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black flex items-center justify-center gap-2">
                      <Icons.Download className="w-5 h-5"/> CSV สำหรับ Sheets
                    </button>
                    <button type="button" onClick={exportProofGalleryHTML} className={`w-full py-3 rounded-2xl font-black border flex items-center justify-center gap-2 ${theme.btnSecondary}`}>
                      <Icons.Camera className="w-5 h-5"/> HTML รูปหลักฐาน
                    </button>
                    <button type="button" onClick={exportHistoryCSV} className={`w-full py-3 rounded-2xl font-black border flex items-center justify-center gap-2 ${theme.btnSecondary}`}>
                      <Icons.History className="w-5 h-5"/> ประวัติยืม-คืน CSV
                    </button>
                  </div>
                  <div className={`mt-4 text-xs font-bold ${theme.textMuted}`}>สำรองล่าสุด: {settingsOptions.backupMeta?.latest ? new Date(settingsOptions.backupMeta.latest).toLocaleString('th-TH', { hour12: false }) : 'ยังไม่มีข้อมูลการสำรองในSystem'}</div>
                </div>

                <div className="space-y-4">
                  <div className={`p-5 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
                    <h4 className={`text-lg font-black mb-2 flex items-center gap-2 ${theme.textTitle}`}><Icons.Upload className="w-5 h-5 text-indigo-500"/> กู้คืนจาก JSON</h4>
                    <p className={`text-sm font-bold mb-4 ${theme.textMuted}`}>ใช้เมื่อจำเป็นเท่านั้น Systemจะเขียนทับ/เพิ่มข้อมูลจากไฟล์ JSON โดยไม่ลบข้อมูลที่ไม่มีในไฟล์</p>
                    <input type="file" accept=".json,application/json" className="hidden" ref={restoreInputRef} onChange={handleRestoreBackupJSON} />
                    <button type="button" onClick={() => restoreInputRef.current?.click()} className={`w-full py-3 rounded-2xl font-black border flex items-center justify-center gap-2 ${theme.btnSecondary}`}>
                      <Icons.Upload className="w-5 h-5"/> เลือกไฟล์ JSON เพื่อกู้คืน
                    </button>
                  </div>

                  <div className={`p-5 rounded-3xl border shadow-sm ${isDarkMode ? 'bg-rose-950/20 border-rose-900' : 'bg-rose-50 border-rose-200'}`}>
                    <h4 className={`text-lg font-black mb-2 flex items-center gap-2 ${theme.textTitle}`}><Icons.Trash className="w-5 h-5 text-rose-500"/> ปิดปี / ล้างประวัติ</h4>
                    <p className={`text-sm font-bold mb-4 ${theme.textMuted}`}>ล้างเฉพาะประวัติยืม-คืน ไม่ลบอุปกรณ์หลัก แต่ควรสำรองข้อมูลครบชุดก่อนทุกครั้ง</p>
                    <div className="grid grid-cols-1 gap-2">
                      <button type="button" onClick={() => setShowAnnualCleanupModal(true)} className={`w-full py-3 rounded-2xl font-black border flex items-center justify-center gap-2 ${theme.btnSecondary}`}>
                        <Icons.CheckCircle className="w-5 h-5"/> เปิด Checklist ปิดปี
                      </button>
                      <button type="button" onClick={clearAllBorrowReturnHistory} className="w-full py-3 rounded-2xl bg-rose-600 hover:bg-rose-500 text-white font-black flex items-center justify-center gap-2">
                        <Icons.Trash className="w-5 h-5"/> ล้างประวัติยืม-คืนทั้งหมด
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className={`p-4 border-t shrink-0 ${theme.divide}`}>
              <button type="button" onClick={() => setShowBackupCenterModal(false)} className={`w-full py-3 rounded-2xl font-black ${theme.btnCancel}`}>ปิดศูนย์สำรองข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist ปิดปีการศึกษา */}
      {showAnnualCleanupModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className={`text-2xl font-black ${theme.textTitle}`}>Checklist ปิดปีการศึกษา</h3>
              <button type="button" onClick={() => setShowAnnualCleanupModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {['ดาวน์โหลด JSON สำหรับกู้คืนSystemแล้ว', 'ดาวน์โหลด CSV สำหรับ Google Sheets แล้ว', 'ดาวน์โหลด HTML Gallery สำหรับดูรูปหลักฐานแล้ว', 'เปิดไฟล์ CSV ใน Google Sheets/Excel ตรวจดูได้แล้ว', 'เปิดไฟล์ HTML Gallery แล้วเห็นรูปหลักฐาน', 'ตรวจว่าของที่ยืม/ออกงานถูกคืนครบแล้ว', 'พร้อมล้างประวัติยืม-คืนรายปี'].map(item => (
                <label key={item} className={`flex items-center gap-3 p-3 rounded-xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <input type="checkbox" className="w-5 h-5 accent-emerald-600" />
                  <span className={`font-bold ${theme.textMain}`}>{item}</span>
                </label>
              ))}
            </div>
            <div className={`mt-5 p-3 rounded-xl border text-sm font-bold ${isDarkMode ? 'bg-rose-900/20 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700'}`}>เมื่อติ๊กครบแล้ว ค่อยกลับไปกด “ล้างประวัติยืม-คืนทั้งหมด” ในหน้า ฐานข้อมูล</div>
          </div>
        </div>
      )}

      {/* Modal 1: ยืนยันการลบการตั้งค่า (Settings) */}
      {deleteSettingConfirm !== null && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl ${theme.cardBg}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-rose-900/40 text-rose-500' : 'bg-rose-100 text-rose-500'}`}><Icons.Trash className="w-10 h-10" /></div>
            <h3 className={`text-2xl font-black mb-2 ${theme.textTitle}`}>ยืนยันการลบ?</h3>
            <p className={`mb-8 text-lg ${theme.textMuted}`}>รายการ <span className="font-bold text-rose-500">"{deleteSettingConfirm}"</span> จะหายไปจากตัวเลือก</p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setDeleteSettingConfirm(null)} className={`w-full sm:flex-1 py-4 font-bold rounded-xl text-base sm:text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleDeleteSetting} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 text-lg hover:bg-rose-500">ลบรายการ</button>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Modal สร้างและจัดการเซ็ต */}
      {showBundleManager && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-end sm:items-center justify-center p-2 sm:p-3 z-[9990]`}>
          <div className={`rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col h-[94vh] sm:h-[88vh] lg:h-[85vh] overflow-hidden transition-all duration-300 ${theme.cardBg}`}>
            
            {/* Header */}
            <div className={`flex justify-between items-start sm:items-center gap-3 p-4 sm:p-6 border-b shrink-0 ${theme.divide}`}>
              <div>
                <h3 className={`text-lg sm:text-xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-fuchsia-900/50 text-fuchsia-400' : 'bg-fuchsia-100 text-fuchsia-600'}`}>
                    <Icons.Layers className="w-6 h-6" />
                  </div>
                  สร้างและจัดการเซ็ตอุปกรณ์
                </h3>
                <p className={`text-xs sm:text-sm font-medium mt-1 ${theme.textMuted}`}>จับกลุ่มอุปกรณ์ที่ใช้บ่อย เพื่อความรวดเร็วในการยืม/ออกงาน</p>
              </div>
              <button type="button" onClick={() => setShowBundleManager(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-6 h-6" /></button>
            </div>

            {/* Body - Split Screen */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-y-auto lg:overflow-hidden custom-scrollbar">
              
              {/* Left Panel */}
              <div className={`w-full lg:w-1/3 flex flex-col shrink-0 lg:shrink min-h-[190px] max-h-[260px] lg:max-h-none lg:min-h-0 border-b lg:border-b-0 lg:border-r ${theme.divide} ${isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
                <div className={`p-4 sm:p-5 border-b font-black text-base sm:text-lg flex justify-between items-center ${theme.textTitle} ${theme.divide}`}>
                  เซ็ตที่มีในSystem 
                  <span className={`text-sm px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                    {(settingsOptions.bundles || []).length} เซ็ต
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-3 sm:p-4 space-y-3">
                  {(settingsOptions.bundles || []).length === 0 && (
                    <div className={`text-center py-10 font-bold ${theme.textMuted}`}>ยังไม่มีเซ็ต<br/>เริ่มสร้างที่แผงด้านขวาเลย!</div>
                  )}
                  {(settingsOptions.bundles || []).map((b) => (
                    <div key={b.id} className={`p-4 rounded-2xl border flex flex-col group transition-all cursor-pointer ${bundleForm.id === b.id ? (isDarkMode ? 'bg-fuchsia-900/30 border-fuchsia-500' : 'bg-fuchsia-50 border-fuchsia-400 shadow-md') : (isDarkMode ? 'bg-slate-800/50 border-slate-700 hover:border-slate-500' : 'bg-white border-slate-200 hover:border-slate-300 shadow-sm')}`} onClick={() => { setBundleForm({ id: b.id, name: b.name, itemIds: b.itemIds || [] }); setBundleSearchTerm(''); }}>
                      <div className="flex justify-between items-start mb-2">
                        <span className={`font-black text-lg ${bundleForm.id === b.id ? (isDarkMode ? 'text-fuchsia-400' : 'text-fuchsia-600') : theme.textTitle}`}>{b.name}</span>
                      </div>
                      <span className={`text-sm font-bold ${theme.textMuted}`}>อุปกรณ์ {(b.itemIds || []).length} ชิ้น</span>
                      <div className={`flex gap-2 mt-3 pt-3 border-t ${isDarkMode ? 'border-slate-700/50' : 'border-slate-200/10'}`}>
                        <button type="button" onClick={(e) => { e.stopPropagation(); setBundleForm({ id: b.id, name: b.name, itemIds: b.itemIds || [] }); setBundleSearchTerm(''); }} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-fuchsia-600 text-slate-300 hover:text-white' : 'bg-slate-100 hover:bg-fuchsia-500 text-slate-600 hover:text-white'}`}>แก้ไข</button>
                        <button type="button" onClick={(e) => { e.stopPropagation(); handleDeleteBundle(b.id); }} className={`flex-1 py-1.5 rounded-lg text-sm font-bold transition-colors ${isDarkMode ? 'bg-slate-700 hover:bg-rose-600 text-slate-300 hover:text-white' : 'bg-slate-100 hover:bg-rose-500 text-slate-600 hover:text-white'}`}>ลบ</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Right Panel */}
              <div className="w-full lg:w-2/3 flex flex-col h-auto lg:h-full min-h-[560px] sm:min-h-[600px] lg:min-h-0 overflow-visible lg:overflow-hidden p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 shrink-0">
                  <h4 className={`font-black text-lg sm:text-xl flex items-center gap-2 ${bundleForm.id ? 'text-amber-500' : 'text-fuchsia-500'}`}>
                    {bundleForm.id ? <Icons.Edit className="w-6 h-6"/> : <Icons.Plus className="w-6 h-6"/>} 
                    {bundleForm.id ? 'แก้ไขเซ็ตอุปกรณ์' : 'สร้างเซ็ตใหม่'}
                  </h4>
                  {bundleForm.id && (
                    <button onClick={() => { setBundleForm({ id: null, name: '', itemIds: [] }); setBundleSearchTerm(''); }} className={`w-full sm:w-auto text-sm font-bold px-3 py-2 sm:py-1.5 rounded-lg transition-colors shadow-sm ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-white border hover:bg-slate-50 text-slate-700'}`}>
                      + สร้างเซ็ตใหม่แทน
                    </button>
                  )}
                </div>

                <div className="mb-4 shrink-0">
                  <label className={`block font-bold mb-1.5 ${theme.textTitle}`}>ชื่อเซ็ต <span className="text-rose-500">*</span></label>
                  <input type="text" className={`w-full px-4 py-3 mb-2 sm:mb-4 rounded-xl font-bold outline-none text-base sm:text-lg border focus:ring-2 focus:ring-fuchsia-500 shadow-sm ${theme.input}`} placeholder="เช่น: เซ็ตกล้องหลัก (ตัว A)..." value={bundleForm.name || ''} onChange={e => setBundleForm({...bundleForm, name: e.target.value})} />
                </div>

                {/* Equipment Selection Area */}
                <div className={`h-[52vh] sm:h-[55vh] lg:h-auto lg:flex-1 flex flex-col min-h-0 border rounded-2xl overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
                  <div className={`p-4 border-b flex flex-col sm:flex-row justify-between gap-3 sm:items-center ${theme.divide} ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'} shrink-0`}>
                    <label className={`font-bold flex items-center gap-2 ${theme.textTitle}`}>
                      เลือกอุปกรณ์เข้าเซ็ต
                      <span className={`px-2 py-0.5 rounded-md text-sm ${isDarkMode ? 'bg-fuchsia-900/50 text-fuchsia-400' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                        เลือกแล้ว {(bundleForm.itemIds || []).length} ชิ้น
                      </span>
                    </label>
                    <div className="relative w-full sm:w-64">
                      <div className={`absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none ${theme.textMuted}`}><Icons.Search className="w-4 h-4" /></div>
                      <input type="text" className={`w-full pl-9 pr-3 py-2 rounded-lg text-sm font-bold outline-none border focus:ring-2 focus:ring-fuchsia-500 ${theme.input}`} placeholder="ค้นหาชื่อ, รหัส..." value={bundleSearchTerm} onChange={e => setBundleSearchTerm(e.target.value)} />
                    </div>
                  </div>

                  {/* List of items to pick */}
                  <div className={`flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50/50'}`}>
                    {sortedBundleItems.length === 0 ? (
                      <div className={`text-center py-10 text-sm font-bold ${theme.textMuted}`}>ไม่พบอุปกรณ์ที่ค้นหา</div>
                    ) : sortedBundleItems.map(i => {
                      const isSelected = (bundleForm.itemIds || []).includes(i.id);
                      const s = STATUSES.find(st => st.id === i.status) || STATUSES[0];
                      return (
                        <label key={i.id} className={`flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 cursor-pointer p-3 rounded-xl border transition-all ${isSelected ? (isDarkMode ? 'bg-fuchsia-900/40 border-fuchsia-700 shadow-inner' : 'bg-fuchsia-50 border-fuchsia-300 shadow-sm') : (isDarkMode ? 'bg-slate-800 border-transparent hover:bg-slate-700' : 'bg-white border-transparent hover:bg-slate-100')} ${theme.textMain}`}>
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <input type="checkbox" className="w-5 h-5 accent-fuchsia-600 rounded shrink-0 cursor-pointer" checked={isSelected} onChange={(e) => {
                              const newIds = e.target.checked ? [...(bundleForm.itemIds || []), i.id] : (bundleForm.itemIds || []).filter(id => id !== i.id);
                              setBundleForm({...bundleForm, itemIds: newIds});
                            }} />
                            <div className="min-w-0">
                              <span className={`font-bold text-sm sm:text-base block truncate ${isSelected ? (isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700') : ''}`}>{i.name}</span>
                              <span className={`text-xs sm:text-sm block truncate ${isSelected ? (isDarkMode ? 'text-fuchsia-400/70' : 'text-fuchsia-600/70') : theme.textMuted}`}>(S.N: {i.sn || '-'})</span>
                            </div>
                          </div>
                          <span className={`self-start sm:self-center shrink-0 text-[10px] px-2 py-1 rounded-md font-bold whitespace-nowrap ${isDarkMode ? s.darkColor : s.color}`}>{s.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className={`mt-4 shrink-0 flex flex-col sm:flex-row gap-3 sticky bottom-0 lg:static z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 border-t sm:border-t-0 ${isDarkMode ? 'bg-slate-800/95 sm:bg-transparent border-slate-700' : 'bg-white sm:bg-transparent border-slate-200'}`}>
                  {bundleForm.id && (
                    <button type="button" onClick={() => { setBundleForm({ id: null, name: '', itemIds: [] }); setBundleSearchTerm(''); setShowBundleManager(false); }} className={`w-full sm:flex-1 py-4 font-bold rounded-xl text-base sm:text-lg ${theme.btnCancel}`}>
                      ยกเลิก
                    </button>
                  )}
                  <button type="button" onClick={handleSaveBundle} disabled={!(bundleForm.name || '').trim() || (bundleForm.itemIds || []).length === 0} className={`w-full sm:flex-[2] py-4 font-black rounded-xl text-base sm:text-lg shadow-lg transition-all ${(bundleForm.name || '').trim() && (bundleForm.itemIds || []).length > 0 ? (bundleForm.id ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/30' : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-fuchsia-500/30') : (isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed')}`}>
                    {bundleForm.id ? '💾 บันทึกการแก้ไข' : '✨ บันทึกสร้างเซ็ตใหม่'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Modal ยืม/คืนแบบใช้งานเซ็ต */}
      {showBundleModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-lg sm:text-xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.Package className="w-6 h-6 text-purple-500" /> ใช้งานเซ็ตอุปกรณ์</h3>
              <button type="button" onClick={() => setShowBundleModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {(settingsOptions.bundles || []).length === 0 ? (
                <div className={`text-center py-10 font-bold text-xl ${theme.textMuted}`}>ยังไม่มีเซ็ตอุปกรณ์ (สร้างได้ที่เมนู "จัดการเซ็ต")</div>
              ) : (settingsOptions.bundles || []).map((bundle) => {
                const totalInBundle = (bundle.itemIds || []).length;
                const availableIds = (bundle.itemIds || []).filter(id => items.find(i => i.id === id)?.status === 'available');
                const outIds = (bundle.itemIds || []).filter(id => {
                  const st = items.find(i => i.id === id)?.status;
                  return st === 'borrowed' || st === 'out-for-event';
                });
                
                const readyInBundle = availableIds.length;
                const outCount = outIds.length;

                return (
                  <div key={bundle.id} className={`p-5 rounded-2xl border flex flex-col lg:flex-row lg:items-start justify-between gap-4 transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                      <div>
                        <h4 className={`text-xl font-black mb-2 ${theme.textTitle}`}>{bundle.name}</h4>
                        <div className="flex flex-wrap gap-x-4 gap-y-1">
                           <p className={`text-sm font-bold ${readyInBundle > 0 ? 'text-purple-500' : theme.textMuted}`}>
                             พร้อมใช้: {readyInBundle}/{totalInBundle} ชิ้น
                           </p>
                           <p className={`text-sm font-bold ${outCount > 0 ? 'text-emerald-500' : theme.textMuted}`}>
                             รอรับคืน: {outCount}/{totalInBundle} ชิ้น
                           </p>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 w-full lg:w-auto">
                        <button 
                          onClick={() => handleSelectBundleToBorrow(bundle)}
                          disabled={readyInBundle === 0}
                          className={`flex-1 lg:flex-none justify-center px-4 py-3 font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 ${readyInBundle === 0 ? (isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : 'bg-purple-600 hover:bg-purple-500 text-white shadow-md'}`}
                        >
                          <Icons.UserPlus className="w-5 h-5" /> ยืมเซ็ตนี้
                        </button>

                        <button 
                          onClick={() => handleSelectBundleToEvent(bundle)}
                          disabled={readyInBundle === 0}
                          className={`flex-1 lg:flex-none justify-center px-4 py-3 font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 ${readyInBundle === 0 ? (isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : 'bg-orange-600 hover:bg-orange-500 text-white shadow-md'}`}
                        >
                          <Icons.Truck className="w-5 h-5" /> นำออกงาน
                        </button>

                        <button 
                          onClick={() => handleSelectBundleToReturn(bundle)}
                          disabled={outCount === 0}
                          className={`flex-1 lg:flex-none justify-center px-4 py-3 font-bold rounded-xl transition-colors whitespace-nowrap flex items-center gap-2 ${outCount === 0 ? (isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'}`}
                        >
                          <Icons.CheckCircle className="w-5 h-5" /> รับคืนเซ็ตนี้
                        </button>
                      </div>
                    </div>
                    
                    <div className={`mt-2 p-3 rounded-xl border max-h-40 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                      <h5 className={`text-sm font-bold mb-2 ${theme.textMuted}`}>รายการอุปกรณ์ในเซ็ต:</h5>
                      <div className="space-y-1.5">
                        {(bundle.itemIds || []).map(id => {
                          const i = items.find(it => it.id === id);
                          if (!i) return <div key={id} className="text-xs text-rose-500 font-bold border-b border-rose-500/20 pb-1">⚠️ ไม่พบอุปกรณ์ (อาจถูกลบไปแล้ว)</div>;
                          const s = STATUSES.find(st => st.id === i.status) || STATUSES[0];
                          return (
                            <div key={id} className={`flex justify-between items-center text-sm py-1 border-b last:border-0 ${isDarkMode ? 'border-slate-700' : 'border-slate-100'}`}>
                              <span className={`truncate pr-2 ${theme.textMain}`}>- {i.name} <span className={theme.textMuted}>({i.sn || 'ไม่มี S.N.'})</span></span>
                              <span className={`text-[11px] px-2 py-0.5 rounded-md font-bold whitespace-nowrap ${isDarkMode ? s.darkColor : s.color}`}>{s.label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className={`p-4 border-t shrink-0 ${theme.divide}`}>
              <button type="button" onClick={() => setShowBundleModal(false)} className={`w-full py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* 📋 Borrow Modal */}
      {borrowTargetIds.length > 0 && activeWorkspace !== 'borrowReturn' && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-black flex items-center gap-2 ${theme.textTitle}`}><Icons.UserPlus className="text-purple-500 w-6 h-6" /> บันทึกการให้ยืม</h3>
              <button type="button" onClick={() => { setBorrowTargetIds([]); setPackingChecklist([]); setBorrowProofFiles([]); }} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>ผู้ให้ยืม (จนท.) <span className="text-rose-500">*</span></label>
                <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} value={borrowData.staff || ''} onChange={e => setBorrowData({...borrowData, staff: e.target.value, newStaff: e.target.value !== 'อื่นๆ' ? '' : borrowData.newStaff})}>
                  <option value="" disabled>-- เลือกชื่อเจ้าหน้าที่ --</option>
                  {(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {borrowData.staff === 'อื่นๆ' && (
                <div>
                  <input type="text" autoFocus className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-purple-900/20 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-300 text-purple-800'}`} placeholder="พิมพ์ชื่อเจ้าหน้าที่ใหม่..." value={borrowData.newStaff || ''} onChange={e => setBorrowData({...borrowData, newStaff: e.target.value})} />
                </div>
              )}
              
              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>ชื่อผู้ยืม <span className="text-rose-500">*</span></label>
                <input type="text" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} placeholder="ชื่อ-สกุล หรือ แผนก" value={borrowData.borrower || ''} onChange={e => setBorrowData({...borrowData, borrower: e.target.value})} />
              </div>
              
              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>กำหนดคืน</label>
                <input type="date" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-purple-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} value={borrowData.returnDate || ''} onChange={e => setBorrowData({...borrowData, returnDate: e.target.value})} />
              </div>

              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>หมายเหตุ <span className={`text-sm font-normal ${theme.textMuted}`}>(ไม่บังคับ)</span></label>
                <textarea className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border focus:ring-2 focus:ring-purple-500 resize-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} rows="2" placeholder="เช่น ยืมไปถ่าย MV, ขาตั้งมีรอยถลอก..." value={borrowData.note || ''} onChange={e => setBorrowData({...borrowData, note: e.target.value})}></textarea>
              </div>
              {renderProofUploader('หลักฐานการยืม', borrowProofFiles, setBorrowProofFiles, 'purple')}
            </div>

            <div className={`mb-8 p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Icons.ClipboardList className="w-5 h-5" /> เช็คลิสต์ก่อนปล่อยยืม ({packingChecklist.length}/{borrowTargetIds.length})
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openChecklistScanner('borrowChecklist')}
                    className={`text-xs font-black px-3 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm ${isDarkMode ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                    title="สแกน QR เพื่อเช็กของแทนการติ๊กเอง"
                  >
                    <Icons.QrCode className="w-4 h-4" /> สแกนเช็ก
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (packingChecklist.length === borrowTargetIds.length) setPackingChecklist([]);
                      else setPackingChecklist([...borrowTargetIds]);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-purple-900/40 hover:bg-purple-800 text-purple-400' : 'bg-purple-100 hover:bg-purple-200 text-purple-700'}`}
                  >
                    {packingChecklist.length === borrowTargetIds.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                  </button>
                </div>
              </div>
              <div className={`mb-3 p-3 rounded-2xl border ${packingChecklist.length === borrowTargetIds.length ? (isDarkMode ? 'bg-emerald-950/25 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700')}`}>
                <div className="flex items-center justify-between gap-3 text-xs font-black mb-2">
                  <span>{packingChecklist.length === borrowTargetIds.length ? 'เช็กครบแล้ว พร้อมยืนยันการยืม' : `เช็กแล้ว ${packingChecklist.length}/${borrowTargetIds.length} ชิ้น`}</span>
                  <span>{borrowTargetIds.length === 0 ? 0 : Math.round((packingChecklist.length / borrowTargetIds.length) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200/70 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${packingChecklist.length === borrowTargetIds.length ? 'bg-emerald-500' : 'bg-purple-500'}`} style={{ width: `${borrowTargetIds.length === 0 ? 0 : Math.round((packingChecklist.length / borrowTargetIds.length) * 100)}%` }}></div>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {borrowTargetIds.map(id => {
                  const item = items.find(i => i.id === id);
                  if(!item) return null;
                  const isChecked = packingChecklist.includes(id);
                  return (
                    <label key={id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${isChecked ? (isDarkMode ? 'bg-purple-900/40 border-purple-800' : 'bg-purple-50 border-purple-200') : (isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200')}`}>
                      <input type="checkbox" className="w-5 h-5 accent-purple-600 rounded mt-0.5 cursor-pointer shrink-0"
                        checked={isChecked}
                        onChange={(e) => {
                          if(e.target.checked) setPackingChecklist([...packingChecklist, id]);
                          else setPackingChecklist(packingChecklist.filter(c => c !== id));
                        }}
                      />
                      <span className={`font-bold text-sm sm:text-base leading-tight flex-1 ${isChecked ? (isDarkMode ? 'text-purple-400 line-through opacity-70' : 'text-purple-700 line-through opacity-70') : theme.textMain}`}>
                        {item.name} <span className={`text-xs font-normal block mt-0.5 ${theme.textMuted}`}>(S.N: {item.sn || '-'})</span>
                        {item.internalNote && <span className={`text-xs font-bold block mt-1 px-2 py-1 rounded-lg ${isDarkMode ? 'bg-amber-900/30 text-amber-300 border border-amber-800/50' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>โน้ตภายใน: {item.internalNote}</span>}
                      </span>
                      {item.owner && <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${isDarkMode ? 'bg-fuchsia-900/40 text-fuchsia-400' : 'bg-fuchsia-100 text-fuchsia-700'}`}>👤 {item.owner}</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setBorrowTargetIds([]); setPackingChecklist([]); setBorrowProofFiles([]); }} className={`w-full sm:flex-1 py-4 font-bold rounded-xl text-base sm:text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button 
                type="button" 
                onClick={handleBorrow} 
                disabled={!borrowData.borrower || !borrowData.staff || packingChecklist.length === 0} 
                className={`flex-1 py-4 font-bold rounded-xl text-lg transition-colors ${(!borrowData.borrower || !borrowData.staff || packingChecklist.length === 0) ? (isDarkMode ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20'}`}
              >
                {packingChecklist.length > 0 && packingChecklist.length < borrowTargetIds.length ? `ยืนยันการยืม (${packingChecklist.length} ชิ้น)` : 'ยืนยันการยืม'}
              </button>
            </div>
            {packingChecklist.length === borrowTargetIds.length && borrowTargetIds.length > 0 && (
               <p className={`text-xs text-center mt-3 font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>✅ เช็กครบแล้ว พร้อมยืนยันการยืม</p>
            )}
            {packingChecklist.length < borrowTargetIds.length && packingChecklist.length > 0 && (
               <p className={`text-xs text-center mt-3 font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`}>* อุปกรณ์ที่ไม่ได้ติ๊กหรือไม่ได้สแกนเช็ก จะไม่ถูกยืมออกไป (ทำรายการบางส่วน)</p>
            )}
            {packingChecklist.length === 0 && (
               <p className={`text-xs text-center mt-3 font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-500'}`}>* กรุณาติ๊กเลือกอุปกรณ์อย่างน้อย 1 ชิ้นเพื่อทำรายการ</p>
            )}
          </div>
        </div>
      )}

      {/* 🚚 Event Modal */}
      {eventTargetIds.length > 0 && activeWorkspace !== 'borrowReturn' && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-black flex items-center gap-2 ${theme.textTitle}`}><Icons.Truck className="text-orange-500 w-6 h-6" /> นำอุปกรณ์ออกงาน</h3>
              <button type="button" onClick={() => { setEventTargetIds([]); setEventChecklist([]); setEventProofFiles([]); }} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>ผู้นำออก / ผู้รับผิดชอบ <span className="text-rose-500">*</span></label>
                <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-orange-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} value={eventData.staff || ''} onChange={e => setEventData({...eventData, staff: e.target.value, newStaff: e.target.value !== 'อื่นๆ' ? '' : eventData.newStaff})}>
                  <option value="" disabled>-- เลือกชื่อเจ้าหน้าที่ --</option>
                  {(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {eventData.staff === 'อื่นๆ' && (
                <div>
                  <input type="text" autoFocus className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-orange-500 ${isDarkMode ? 'bg-orange-900/20 border-orange-800 text-orange-300' : 'bg-orange-50 border-orange-300 text-orange-800'}`} placeholder="พิมพ์ชื่อเจ้าหน้าที่ใหม่..." value={eventData.newStaff || ''} onChange={e => setEventData({...eventData, newStaff: e.target.value})} />
                </div>
              )}
              
              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>ชื่องาน (Project / Event) <span className="text-rose-500">*</span></label>
                <input type="text" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-orange-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} placeholder="เช่น งานถ่าย MV, งานประชุมประจำปี..." value={eventData.eventName || ''} onChange={e => setEventData({...eventData, eventName: e.target.value})} />
              </div>
              
              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>กำหนดกลับ / คืนของ</label>
                <input type="date" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-orange-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} value={eventData.returnDate || ''} onChange={e => setEventData({...eventData, returnDate: e.target.value})} />
              </div>

              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>สถานที่ / หมายเหตุ <span className={`text-sm font-normal ${theme.textMuted}`}>(ไม่บังคับ)</span></label>
                <textarea className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border focus:ring-2 focus:ring-orange-500 resize-none ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} rows="2" placeholder="เช่น สถานที่จัดงาน, เบอร์โทรติดต่อ..." value={eventData.note || ''} onChange={e => setEventData({...eventData, note: e.target.value})}></textarea>
              </div>
              {renderProofUploader('หลักฐานการนำออกงาน', eventProofFiles, setEventProofFiles, 'orange')}
            </div>

            <div className={`mb-8 p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Icons.ClipboardList className="w-5 h-5" /> เช็คของขึ้นรถ ({eventChecklist.length}/{eventTargetIds.length})
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openChecklistScanner('eventChecklist')}
                    className={`text-xs font-black px-3 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm ${isDarkMode ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                    title="สแกน QR เพื่อเช็กของขึ้นงานแทนการติ๊กเอง"
                  >
                    <Icons.QrCode className="w-4 h-4" /> สแกนเช็ก
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (eventChecklist.length === eventTargetIds.length) setEventChecklist([]);
                      else setEventChecklist([...eventTargetIds]);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-orange-900/40 hover:bg-orange-800 text-orange-400' : 'bg-orange-100 hover:bg-orange-200 text-orange-700'}`}
                  >
                    {eventChecklist.length === eventTargetIds.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                  </button>
                </div>
              </div>
              <div className={`mb-3 p-3 rounded-2xl border ${eventChecklist.length === eventTargetIds.length ? (isDarkMode ? 'bg-emerald-950/25 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700')}`}>
                <div className="flex items-center justify-between gap-3 text-xs font-black mb-2">
                  <span>{eventChecklist.length === eventTargetIds.length ? 'เช็กครบแล้ว พร้อมยืนยันออกงาน' : `เช็กแล้ว ${eventChecklist.length}/${eventTargetIds.length} ชิ้น`}</span>
                  <span>{eventTargetIds.length === 0 ? 0 : Math.round((eventChecklist.length / eventTargetIds.length) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200/70 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${eventChecklist.length === eventTargetIds.length ? 'bg-emerald-500' : 'bg-orange-500'}`} style={{ width: `${eventTargetIds.length === 0 ? 0 : Math.round((eventChecklist.length / eventTargetIds.length) * 100)}%` }}></div>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {eventTargetIds.map(id => {
                  const item = items.find(i => i.id === id);
                  if(!item) return null;
                  const isChecked = eventChecklist.includes(id);
                  return (
                    <label key={id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${isChecked ? (isDarkMode ? 'bg-orange-900/40 border-orange-800' : 'bg-orange-50 border-orange-200') : (isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200')}`}>
                      <input type="checkbox" className="w-5 h-5 accent-orange-600 rounded mt-0.5 cursor-pointer shrink-0"
                        checked={isChecked}
                        onChange={(e) => {
                          if(e.target.checked) setEventChecklist([...eventChecklist, id]);
                          else setEventChecklist(eventChecklist.filter(c => c !== id));
                        }}
                      />
                      <span className={`font-bold text-sm sm:text-base leading-tight flex-1 ${isChecked ? (isDarkMode ? 'text-orange-400 line-through opacity-70' : 'text-orange-700 line-through opacity-70') : theme.textMain}`}>
                        {item.name} <span className={`text-xs font-normal block mt-0.5 ${theme.textMuted}`}>(S.N: {item.sn || '-'})</span>
                        {item.internalNote && <span className={`text-xs font-bold block mt-1 px-2 py-1 rounded-lg ${isDarkMode ? 'bg-amber-900/30 text-amber-300 border border-amber-800/50' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>โน้ตภายใน: {item.internalNote}</span>}
                      </span>
                      {item.owner && <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${isDarkMode ? 'bg-fuchsia-900/40 text-fuchsia-400' : 'bg-fuchsia-100 text-fuchsia-700'}`}>👤 {item.owner}</span>}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setEventTargetIds([]); setEventChecklist([]); setEventProofFiles([]); }} className={`w-full sm:flex-1 py-4 font-bold rounded-xl text-base sm:text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button 
                type="button" 
                onClick={handleEventOut} 
                disabled={!eventData.eventName || !eventData.staff || eventChecklist.length === 0} 
                className={`flex-1 py-4 font-bold rounded-xl text-lg transition-colors ${(!eventData.eventName || !eventData.staff || eventChecklist.length === 0) ? (isDarkMode ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-500/20'}`}
              >
                {eventChecklist.length > 0 && eventChecklist.length < eventTargetIds.length ? `ยืนยันนำออก (${eventChecklist.length} ชิ้น)` : 'ยืนยันการนำออกงาน'}
              </button>
            </div>
            {eventChecklist.length === eventTargetIds.length && eventTargetIds.length > 0 && (
               <p className={`text-xs text-center mt-3 font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>✅ เช็กครบแล้ว พร้อมยืนยันการนำออกงาน</p>
            )}
            {eventChecklist.length < eventTargetIds.length && eventChecklist.length > 0 && (
               <p className={`text-xs text-center mt-3 font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`}>* อุปกรณ์ที่ไม่ได้ติ๊กหรือไม่ได้สแกนเช็ก จะไม่ถูกนำออกไป (ทำรายการบางส่วน)</p>
            )}
            {eventChecklist.length === 0 && (
               <p className={`text-xs text-center mt-3 font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-500'}`}>* กรุณาติ๊กเลือกอุปกรณ์อย่างน้อย 1 ชิ้นเพื่อทำรายการ</p>
            )}
          </div>
        </div>
      )}

      {/* 📋 Return Modal */}
      {returnTargetIds.length > 0 && activeWorkspace !== 'borrowReturn' && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-black flex items-center gap-2 ${theme.textTitle}`}><Icons.CheckCircle className="text-emerald-500 w-6 h-6" /> บันทึกรับคืนอุปกรณ์</h3>
              <button type="button" onClick={() => { setReturnTargetIds([]); setReturnChecklist([]); setReturnProofFiles([]); }} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            
            <div className="mb-6">
              <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>ผู้รับคืน (จนท.) <span className="text-rose-500">*</span></label>
              <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-slate-900 border-slate-600 text-white' : 'bg-slate-50 border-slate-300 text-slate-700'}`} value={returnData.staff || ''} onChange={e => setReturnData({...returnData, staff: e.target.value, newStaff: e.target.value !== 'อื่นๆ' ? '' : returnData.newStaff})}>
                <option value="" disabled>-- เลือกชื่อเจ้าหน้าที่ --</option>
                {(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            {returnData.staff === 'อื่นๆ' && (
              <div className="mb-6">
                <input type="text" autoFocus className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-emerald-500 ${isDarkMode ? 'bg-emerald-900/20 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-300 text-emerald-800'}`} placeholder="พิมพ์ชื่อเจ้าหน้าที่ใหม่..." value={returnData.newStaff || ''} onChange={e => setReturnData({...returnData, newStaff: e.target.value})} />
              </div>
            )}
            <div className="mb-6">
              {renderProofUploader('หลักฐานการรับคืน', returnProofFiles, setReturnProofFiles, 'emerald')}
            </div>

            <div className={`mb-8 p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Icons.ClipboardList className="w-5 h-5" /> เช็คลิสต์ของเข้ากล่อง ({returnChecklist.length}/{returnTargetIds.length})
                </h4>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => openChecklistScanner('returnChecklist')}
                    className={`text-xs font-black px-3 py-2 rounded-xl transition-colors flex items-center gap-1 shadow-sm ${isDarkMode ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}
                    title="สแกน QR เพื่อเช็กของตอนรับคืนแทนการติ๊กเอง"
                  >
                    <Icons.QrCode className="w-4 h-4" /> สแกนเช็ก
                  </button>
                  <button 
                    type="button" 
                    onClick={() => {
                      if (returnChecklist.length === returnTargetIds.length) setReturnChecklist([]);
                      else setReturnChecklist([...returnTargetIds]);
                    }}
                    className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors ${isDarkMode ? 'bg-emerald-900/40 hover:bg-emerald-800 text-emerald-400' : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'}`}
                  >
                    {returnChecklist.length === returnTargetIds.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                  </button>
                </div>
              </div>
              <div className={`mb-3 p-3 rounded-2xl border ${returnChecklist.length === returnTargetIds.length ? (isDarkMode ? 'bg-emerald-950/25 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700')}`}>
                <div className="flex items-center justify-between gap-3 text-xs font-black mb-2">
                  <span>{returnChecklist.length === returnTargetIds.length ? 'เช็กครบแล้ว พร้อมยืนยันรับคืน' : `เช็กแล้ว ${returnChecklist.length}/${returnTargetIds.length} ชิ้น`}</span>
                  <span>{returnTargetIds.length === 0 ? 0 : Math.round((returnChecklist.length / returnTargetIds.length) * 100)}%</span>
                </div>
                <div className="w-full h-2.5 rounded-full bg-slate-200/70 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-500 ${returnChecklist.length === returnTargetIds.length ? 'bg-emerald-500' : 'bg-emerald-500'}`} style={{ width: `${returnTargetIds.length === 0 ? 0 : Math.round((returnChecklist.length / returnTargetIds.length) * 100)}%` }}></div>
                </div>
              </div>
              <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar pr-1">
                {returnTargetIds.map(id => {
                  const item = items.find(i => i.id === id);
                  if(!item) return null;
                  const isChecked = returnChecklist.includes(id);
                  return (
                    <label key={id} className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer border transition-colors ${isChecked ? (isDarkMode ? 'bg-emerald-900/40 border-emerald-800' : 'bg-emerald-50 border-emerald-200') : (isDarkMode ? 'bg-slate-800 border-slate-600' : 'bg-white border-slate-200')}`}>
                      <input type="checkbox" className="w-5 h-5 accent-emerald-600 rounded mt-0.5 cursor-pointer shrink-0"
                        checked={isChecked}
                        onChange={(e) => {
                          if(e.target.checked) setReturnChecklist([...returnChecklist, id]);
                          else setReturnChecklist(returnChecklist.filter(c => c !== id));
                        }}
                      />
                      <span className={`font-bold text-sm sm:text-base leading-tight flex-1 ${isChecked ? (isDarkMode ? 'text-emerald-400 line-through opacity-70' : 'text-emerald-700 line-through opacity-70') : theme.textMain}`}>
                        {item.name} <span className={`text-xs font-normal block mt-0.5 ${theme.textMuted}`}>(S.N: {item.sn || '-'})</span>
                        {item.internalNote && <span className={`text-xs font-bold block mt-1 px-2 py-1 rounded-lg ${isDarkMode ? 'bg-amber-900/30 text-amber-300 border border-amber-800/50' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>โน้ตภายใน: {item.internalNote}</span>}
                      </span>
                      {item.owner && <span className={`text-[10px] px-2 py-0.5 rounded font-bold shrink-0 ${isDarkMode ? 'bg-fuchsia-900/40 text-fuchsia-400' : 'bg-fuchsia-100 text-fuchsia-700'}`}>👤 {item.owner}</span>}
                      {isChecked && (
                        <div className="w-full sm:w-56 space-y-2" onClick={(e) => e.stopPropagation()}>
                          <select className={`w-full px-3 py-2 rounded-lg text-xs font-bold border ${theme.input}`} value={(returnInspection[id]?.condition) || 'ปกติ'} onChange={(e) => setReturnInspection(prev => ({...prev, [id]: {...(prev[id] || {}), condition: e.target.value}}))}>
                            <option value="ปกติ">ปกติ</option>
                            <option value="มีรอย/ต้องตรวจเพิ่ม">มีรอย/ต้องตรวจเพิ่ม</option>
                            <option value="ชำรุด">ชำรุด</option>
                            <option value="คืนไม่ครบ">คืนไม่ครบ</option>
                          </select>
                          <input className={`w-full px-3 py-2 rounded-lg text-xs font-bold border ${theme.input}`} placeholder="หมายเหตุหลังคืน" value={(returnInspection[id]?.note) || ''} onChange={(e) => setReturnInspection(prev => ({...prev, [id]: {...(prev[id] || {}), note: e.target.value}}))} />
                        </div>
                      )}
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setReturnTargetIds([]); setReturnChecklist([]); setReturnProofFiles([]); }} className={`w-full sm:flex-1 py-4 font-bold rounded-xl text-base sm:text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button 
                type="button" 
                onClick={handleReturn} 
                disabled={!returnData.staff || returnChecklist.length === 0} 
                className={`flex-1 py-4 font-bold rounded-xl text-lg transition-colors ${(!returnData.staff || returnChecklist.length === 0) ? (isDarkMode ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-500/20'}`}
              >
                {returnChecklist.length > 0 && returnChecklist.length < returnTargetIds.length ? `ยืนยันรับคืน (${returnChecklist.length} ชิ้น)` : 'ยืนยันการรับคืน'}
              </button>
            </div>
            {returnChecklist.length < returnTargetIds.length && returnChecklist.length > 0 && (
               <p className={`text-xs text-center mt-3 font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`}>* อุปกรณ์ที่ไม่ได้ติ๊ก จะยังคงถูกยืม/ออกงานต่อไป (รับคืนบางส่วน)</p>
            )}
            {returnChecklist.length === 0 && (
               <p className={`text-xs text-center mt-3 font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-500'}`}>* กรุณาติ๊กเลือกอุปกรณ์อย่างน้อย 1 ชิ้นเพื่อทำรายการ</p>
            )}
          </div>
        </div>
      )}

      {/* 🛠️ Modal ประวัติส่วนกลาง (Audit Log) */}
      {showAuditModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-lg sm:text-xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.ClipboardList className="w-6 h-6 text-blue-500"/> ประวัติการทำงานส่วนกลาง</h3>
              <button type="button" onClick={() => setShowAuditModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b flex flex-wrap gap-2 items-center">
              {auditFilterOptions.map(opt => (
                <button key={opt.id} type="button" onClick={() => setAuditFilter(opt.id)} className={`px-3 py-2 rounded-xl text-sm font-black border ${auditFilter === opt.id ? 'bg-blue-600 border-blue-600 text-white' : theme.btnSecondary}`}>{opt.label}</button>
              ))}
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {filteredAuditLogs.length === 0 ? (
                <div className={`text-center py-10 font-bold text-xl ${theme.textMuted}`}>ยังไม่มีประวัติการทำงานในตัวกรองนี้</div>
              ) : filteredAuditLogs.map((log) => {
                let badgeColor = 'bg-slate-200 text-slate-700';
                const action = log.action || '';
                let icon = '📌';
                if (action.includes('เพิ่ม') || action.includes('นำเข้า')) { badgeColor = isDarkMode ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-700'; icon = '✨'; }
                if (action.includes('แก้')) { badgeColor = isDarkMode ? 'bg-amber-900/50 text-amber-400' : 'bg-amber-100 text-amber-700'; icon = '✏️'; }
                if (action.includes('ลบ')) { badgeColor = isDarkMode ? 'bg-rose-900/50 text-rose-400' : 'bg-rose-100 text-rose-700'; icon = '🗑️'; }
                if (action.includes('ยืม')) { badgeColor = isDarkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-100 text-purple-700'; icon = '📤'; }
                if (action.includes('ออกงาน')) { badgeColor = isDarkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-100 text-orange-700'; icon = '🚚'; }
                if (action.includes('คืน')) { badgeColor = isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-100 text-emerald-700'; icon = '📥'; }

                return (
                  <div key={log.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-start gap-4 transition-colors ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2 flex-wrap">
                        <span className={`text-sm font-black px-3 py-1 rounded-md ${badgeColor}`}>{icon} {action}</span>
                        <span className={`text-sm font-bold ${theme.textMuted}`}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString('th-TH', {hour12: false}) : '-'} น.</span>
                      </div>
                      <h4 className={`text-lg font-bold mb-1 ${theme.textTitle}`}>{log.target || '-'}</h4>
                      <p className={`text-base whitespace-pre-line ${theme.textMain}`}>{log.details}</p>
                    </div>
                    <div className={`text-sm font-bold px-3 py-1.5 rounded-lg border bg-opacity-50 whitespace-nowrap ${isDarkMode ? 'bg-slate-800 border-slate-600 text-slate-300' : 'bg-white border-slate-200 text-slate-500'}`}>
                      👤 {log.user || 'Admin'}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* History Modal ของแต่ละอุปกรณ์ */}
      {showHistory && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-3 sm:p-5 z-[9999]`}>
          <div className={`item-detail-shell compact-modal-shell rounded-3xl p-4 sm:p-5 max-w-[900px] w-full max-h-[84vh] flex flex-col shadow-2xl ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-4 gap-3">
              <h3 className={`text-2xl font-black ${theme.textTitle}`}>รายละเอียดและประวัติอุปกรณ์</h3>
              <div className="flex items-center gap-2">
                {items.find(i => i.id === showHistory) && <button type="button" onClick={() => exportItemHistoryCSV(items.find(i => i.id === showHistory))} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>Export CSV</button>}
                <button type="button" onClick={() => setShowHistory(null)} className={`p-2 hover:text-blue-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-6 h-6" /></button>
              </div>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {(() => {
                const detailItem = items.find(i => i.id === showHistory);
                if (!detailItem) return null;
                const detailStatus = STATUSES.find(s => s.id === detailItem.status) || STATUSES[0];
                const detailDept = DEPARTMENTS.find(d => d.id === detailItem.department) || DEPARTMENTS[0];
                const latestHistory = (detailItem.history || []).slice(-1)[0];
                const detailProofCount = getItemProofCount(detailItem);
                return (
                  <div className={`item-detail-summary p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`text-2xl font-black leading-tight ${theme.textTitle}`}>{detailItem.name || '-'}</div>
                        <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>S.N. {detailItem.sn || '-'} • {detailItem.category || '-'} • {detailItem.location || '-'}</div>
                      </div>
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-sm font-black border ${isDarkMode ? detailStatus.darkColor : detailStatus.color}`}>{detailStatus.label}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                      <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>ฝ่าย</div>
                        <div className={`font-black truncate ${theme.textTitle}`}>{detailDept.label || detailItem.department || '-'}</div>
                      </div>
                      <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>กล่อง</div>
                        <div className={`font-black truncate ${theme.textTitle}`}>{detailItem.storageBoxName || '-'}</div>
                      </div>
                      <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>หลักฐาน</div>
                        <div className={`font-black ${theme.textTitle}`}>📷 {detailProofCount} รูป</div>
                      </div>
                      <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>QR</div>
                        <div className={`font-black ${detailItem.qrTagged ? 'text-emerald-500' : 'text-amber-500'}`}>{detailItem.qrTagged ? 'ติดแล้ว' : 'ยังไม่ติด'}</div>
                      </div>
                    </div>
                    {latestHistory && <div className={`mt-4 text-sm font-bold ${theme.textMuted}`}>ประวัติล่าสุด: {latestHistory.type === 'borrow' ? 'ยืม' : latestHistory.type === 'event' ? 'ออกงาน' : latestHistory.type === 'return' ? 'รับคืน' : latestHistory.type || '-'} • {latestHistory.date ? new Date(latestHistory.date).toLocaleString('th-TH', { hour12: false }) : '-'}</div>}
                    {detailItem.internalNote && <div className={`mt-3 p-3 rounded-2xl border text-sm font-bold ${isDarkMode ? 'bg-amber-950/20 border-amber-800 text-amber-200' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>โน้ตภายใน: {detailItem.internalNote}</div>}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                      {canUseOperationalTools && detailItem.status === 'available' && <button type="button" onClick={(e) => { setShowHistory(null); handleOpenRowBorrow(e, detailItem); }} className="px-3 py-2.5 rounded-xl font-black text-sm bg-purple-600 text-white">ยืม</button>}
                      {canUseOperationalTools && detailItem.status === 'available' && <button type="button" onClick={(e) => { setShowHistory(null); handleOpenRowEvent(e, detailItem); }} className="px-3 py-2.5 rounded-xl font-black text-sm bg-orange-500 text-white">ออกงาน</button>}
                      {canUseOperationalTools && (detailItem.status === 'borrowed' || detailItem.status === 'out-for-event') && <button type="button" onClick={() => { setShowHistory(null); openReturnForItems([detailItem.id]); }} className="px-3 py-2.5 rounded-xl font-black text-sm bg-emerald-600 text-white">รับคืน</button>}
                      <button type="button" onClick={() => copyItemSummary(detailItem)} className={`px-3 py-2.5 rounded-xl font-black text-sm border ${theme.btnSecondary}`}>คัดลอก</button>
                    </div>
                  </div>
                );
              })()}

              {(() => {
                const historyItem = items.find(i => i.id === showHistory);
                const historyList = historyItem?.history || [];
                if (historyList.length === 0) {
                  return <div className={`text-center py-8 font-bold text-xl ${theme.textMuted}`}>ยังไม่มีประวัติการใช้งาน</div>;
                }
                return historyList.map((entry, originalIndex) => ({ entry, originalIndex })).reverse().map(({ entry: h, originalIndex }) => {
                  const isBorrow = h.type === 'borrow';
                  const isEvent = h.type === 'event';
                  return (
                    <div key={originalIndex} className={`p-5 rounded-xl border ${isBorrow ? (isDarkMode ? 'bg-purple-900/20 border-purple-800/50' : 'bg-purple-50 border-purple-100') : isEvent ? (isDarkMode ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-100') : (isDarkMode ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100')}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-sm font-black px-3 py-1.5 rounded-md ${isBorrow ? (isDarkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-200 text-purple-700') : isEvent ? (isDarkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-200 text-orange-700') : (isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-200 text-emerald-700')}`}>{isBorrow ? 'ยืมออก' : isEvent ? 'ออกงาน' : 'รับคืน'}</span>
                        <span className={`text-base font-bold ${theme.textMuted}`}>{h.date ? new Date(h.date).toLocaleString('th-TH') : '-'}</span>
                      </div>
                      {(h.operatorName || h.performedBy) && (
                        <div className={`text-sm font-bold mb-3 ${theme.textMuted}`}>ผู้ทำรายการในSystem: {h.operatorName || h.performedBy}</div>
                      )}
                      {isBorrow ? (
                        <div className={`text-lg ${theme.textMain}`}>
                          <p className="mb-1"><span className={`font-bold ${theme.textTitle}`}>ผู้ยืม:</span> {h.borrower}</p>
                          <p><span className={`font-bold ${theme.textTitle}`}>ผู้ให้ยืม (จนท.):</span> {h.staffOut || '-'}</p>
                          {h.note && <p className="mt-2 text-sm italic opacity-80"><span className={`font-bold ${theme.textTitle}`}>หมายเหตุ:</span> {h.note}</p>}
                        </div>
                      ) : isEvent ? (
                        <div className={`text-lg ${theme.textMain}`}>
                          <p className="mb-1"><span className={`font-bold ${theme.textTitle}`}>ชื่องาน:</span> {h.eventName}</p>
                          <p><span className={`font-bold ${theme.textTitle}`}>ผู้นำออก (จนท.):</span> {h.staffOut || '-'}</p>
                          {h.note && <p className="mt-2 text-sm italic opacity-80"><span className={`font-bold ${theme.textTitle}`}>หมายเหตุ:</span> {h.note}</p>}
                        </div>
                      ) : (
                        <div className={`text-lg ${theme.textMain}`}><p><span className={`font-bold ${theme.textTitle}`}>ผู้รับคืน (จนท.):</span> {h.staffIn || '-'}</p></div>
                      )}
                      {renderProofGallery(h.proofs, historyItem?.sn || historyItem?.name || '')}
                      {canUseOperationalTools && (
                        <button type="button" onClick={() => { setProofAttachTarget({ itemId: historyItem.id, historyIndex: originalIndex }); setProofAttachFiles([]); }} className={`mt-4 w-full px-4 py-3 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>+ เพิ่มรูปหลักฐานย้อนหลัง</button>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
            <div className={`mt-6 pt-4 border-t ${theme.divide}`}>
              <button type="button" onClick={() => setShowHistory(null)} className={`w-full py-4 font-bold rounded-xl transition-colors text-lg ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* 👤 Modal บัญชีของฉัน */}
      {showMyAccountModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[10000]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] border ${isDarkMode ? 'bg-slate-900 border-slate-700 shadow-black/40' : 'bg-white border-white shadow-slate-200/80'}`}>
            <div className={`p-6 border-b flex justify-between items-start gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center shadow-lg">👤</span>
                  บัญชีของฉัน
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดูสิทธิ์การใช้งาน และเปลี่ยน PIN ของตัวเอง</p>
              </div>
              <button type="button" onClick={() => setShowMyAccountModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className={`text-xs font-black tracking-[0.16em] uppercase ${theme.textMuted}`}>Current Account</div>
                    <div className={`text-2xl font-black mt-1 truncate ${theme.textTitle}`}>{currentFullAccount?.name || currentAccountLabel || '-'}</div>
                    <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>Username: {currentFullAccount?.username || currentOperator?.username || '-'}</div>
                  </div>
                  <span className={`shrink-0 px-3 py-1.5 rounded-xl text-sm font-black border ${roleBadgeClass(currentFullAccount?.role || currentAccountRole)}`}>
                    {roleLabel(currentFullAccount?.role || currentAccountRole)}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`text-xs font-bold ${theme.textMuted}`}>สถานะบัญชี</div>
                    <div className={`font-black ${currentFullAccount?.active === false ? 'text-rose-500' : 'text-emerald-500'}`}>{currentFullAccount?.active === false ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</div>
                  </div>
                  <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`text-xs font-bold ${theme.textMuted}`}>สิทธิ์หลัก</div>
                    <div className={`font-black ${theme.textTitle}`}>{canManageSystem ? 'จัดการSystem' : canUseOperationalTools ? 'ใช้งาน/ทำรายการ' : 'ดูอย่างเดียว'}</div>
                  </div>
                </div>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-blue-950/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <div className={`font-black text-lg mb-2 ${theme.textTitle}`}>เปลี่ยน PIN ของตัวเอง</div>
                <p className={`text-xs font-bold mb-4 ${theme.textMuted}`}>เจ้าหน้าที่สามารถเปลี่ยน PIN ของตัวเองได้ แต่การเปลี่ยน Username ต้องให้บัญชีกลาง/ผู้ดูแลแก้ให้ เพื่อไม่ให้ประวัติรายการสับสน</p>

                <div className="space-y-3">
                  <input
                    type="password"
                    inputMode="numeric"
                    className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`}
                    placeholder="PIN เดิม"
                    value={myPinForm.oldPin}
                    onChange={(e) => setMyPinForm(prev => ({ ...prev, oldPin: e.target.value }))}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`}
                    placeholder="PIN ใหม่"
                    value={myPinForm.newPin}
                    onChange={(e) => setMyPinForm(prev => ({ ...prev, newPin: e.target.value }))}
                  />
                  <input
                    type="password"
                    inputMode="numeric"
                    className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`}
                    placeholder="ยืนยัน PIN ใหม่"
                    value={myPinForm.confirmPin}
                    onChange={(e) => setMyPinForm(prev => ({ ...prev, confirmPin: e.target.value }))}
                    onKeyDown={(e) => { if (e.key === 'Enter') handleChangeOwnPin(); }}
                  />
                  <button type="button" onClick={handleChangeOwnPin} className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-black shadow-lg">
                    บันทึก PIN ใหม่
                  </button>
                </div>
              </div>

              {canManageAccounts && (
                <button
                  type="button"
                  onClick={() => { setShowMyAccountModal(false); setSettingsTab('accounts'); setShowSettings(true); }}
                  className={`w-full p-4 rounded-2xl border text-left font-bold ${theme.btnSecondary}`}
                >
                  <div className={`font-black ${theme.textTitle}`}>ไปหน้าจัดการบัญชีผู้ใช้</div>
                  <div className={`text-sm mt-1 ${theme.textMuted}`}>เพิ่ม / แก้ไข Username / รีเซ็ต PIN / ปิดใช้งานบัญชี</div>
                </button>
              )}
            </div>

            <div className={`p-4 border-t ${theme.divide}`}>
              <button type="button" onClick={() => setShowMyAccountModal(false)} className={`w-full py-4 rounded-xl font-black ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}


      {/* 📷 Modal เพิ่มหลักฐานย้อนหลัง */}
      {proofAttachTarget && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[10000]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className={`text-xl font-black ${theme.textTitle}`}>เพิ่มรูปหลักฐานย้อนหลัง</h3>
              <button type="button" onClick={() => { setProofAttachTarget(null); setProofAttachFiles([]); }} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            {renderProofUploader('รูปหลักฐานย้อนหลัง', proofAttachFiles, setProofAttachFiles, 'blue')}
            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => { setProofAttachTarget(null); setProofAttachFiles([]); }} className={`w-full sm:flex-1 py-4 font-bold rounded-xl text-base sm:text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={() => runWithBusy(handleAttachProofsToHistory)} disabled={isBusy || proofAttachFiles.length === 0} className={`flex-1 py-4 font-bold rounded-xl text-lg text-white ${isBusy || proofAttachFiles.length === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500'}`}>{isBusy ? 'กำลังอัปโหลด...' : 'บันทึกหลักฐาน'}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ยืนยันการลบอุปกรณ์ในตารางหลัก */}
      {itemToDelete && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl ${theme.cardBg}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-rose-900/40 text-rose-500' : 'bg-rose-100 text-rose-500'}`}><Icons.Trash className="w-10 h-10" /></div>
            <h3 className={`text-2xl font-black mb-2 ${theme.textTitle}`}>ย้ายเข้าถังขยะ?</h3>
            <p className={`mb-6 text-lg ${theme.textMuted}`}>
              รายการนี้จะถูกซ่อนจากตารางหลัก แต่ยังสามารถกู้คืนได้จากเมนูถังขยะ<br/>
              <span className="font-bold text-rose-500 text-xl block mt-2">"{itemToDelete.name}"</span>
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setItemToDelete(null)} className={`w-full sm:flex-1 py-4 font-bold rounded-xl text-base sm:text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleDeleteItem} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 text-lg hover:bg-rose-500">ย้ายเข้าถังขยะ</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-3 sm:p-5 z-[9999]`}>
          <div className={`item-form-shell compact-modal-shell rounded-3xl p-3 sm:p-4 lg:p-5 max-w-[900px] w-full max-h-[84vh] overflow-y-auto custom-scrollbar shadow-2xl border ${theme.cardBg}`}>
            <div className="flex justify-between items-start gap-4 mb-4">
              <div>
                <h3 className={`text-lg sm:text-xl font-black ${theme.textTitle}`}>{formData.id ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</h3>
                <p className={`text-xs sm:text-sm font-bold mt-1 ${theme.textMuted}`}>แบ่งข้อมูลเป็นหมวด เพื่อกรอกง่ายและลดความผิดพลาด</p>
              </div>
              <button type="button" onClick={() => confirmCloseIfDirty(true, () => setShowForm(false))} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-6 h-6" /></button>
            </div>

            <div className="space-y-5">
              <section className={`item-form-section p-4 sm:p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div className={`font-black text-lg mb-4 flex items-center gap-2 ${theme.textTitle}`}>1. ข้อมูลหลัก</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className={`block text-base font-bold mb-2 ${theme.textTitle}`}>ชื่ออุปกรณ์ <span className="text-rose-500">*</span></label>
                    <input type="text" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} placeholder="เช่น กล้อง Sony A7IV" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
                  </div>
                  <div>
                    <label className={`block text-base font-bold mb-2 ${theme.textTitle}`}>รหัส S.N. <span className="text-rose-500">*</span></label>
                    <input type="text" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} placeholder="เช่น CAM-001" value={formData.sn || ''} onChange={e => setFormData({...formData, sn: e.target.value})} />
                  </div>
                  <div>
                    <label className={`block text-base font-bold mb-2 ${theme.textTitle}`}>จำนวนชิ้น</label>
                    <input type="number" min="1" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.quantity || 1} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                  <div>
                    <label className={`block text-base font-bold mb-2 ${theme.textTitle}`}>ฝ่ายที่รับผิดชอบ</label>
                    <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})}>
                      {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <SmartOptionInput
                      label="หมวดหมู่อุปกรณ์"
                      value={formData.category || ''}
                      options={settingsOptions.categories || []}
                      onChange={(value) => setFormData({...formData, category: value, newCategory: ''})}
                      placeholder="พิมพ์ค้นหา / กดรายการทั้งหมดเพื่อเลื่อนเลือก"
                      helper="เลือกได้ทั้ง 2 แบบ: พิมพ์ค้นหาเร็ว ๆ หรือกด “รายการทั้งหมด” แล้วเลื่อนเลือกจากรายการเดิม"
                      theme={theme}
                      isDarkMode={isDarkMode}
                      icon="🏷️"
                    />
                  </div>
                </div>
              </section>

              <section className={`item-form-section p-4 sm:p-5 rounded-3xl border ${isDarkMode ? 'bg-indigo-950/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className={`font-black text-lg mb-4 flex items-center gap-2 ${theme.textTitle}`}>2. ที่เก็บ / โครงการ / พัสดุ</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <SmartOptionInput
                      label="สถานที่จัดเก็บ / ห้อง"
                      value={formData.location || ''}
                      options={settingsOptions.locations || []}
                      onChange={(value) => setFormData({...formData, location: value, newLocation: ''})}
                      placeholder="พิมพ์ค้นหา หรือกดรายการทั้งหมดเพื่อเลื่อนเลือก"
                      helper="เลือกได้ทั้งพิมพ์ค้นหาและเลื่อนเลือก ถ้าเป็นสถานที่ใหม่ พิมพ์ชื่อไว้แล้วระบบจะเพิ่มให้ตอนกดบันทึก"
                      theme={theme}
                      isDarkMode={isDarkMode}
                      icon="📍"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className={`block text-base font-bold mb-2 ${theme.textTitle}`}>โครงการ / แหล่งที่มา</label>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <select className={`flex-1 px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.project || ''} onChange={e => setFormData({...formData, project: e.target.value, newProject: e.target.value !== 'อื่นๆ' ? '' : formData.newProject})}>
                        <option value="">-- ไม่ระบุโครงการ --</option>
                        {projectOptions.map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button type="button" onClick={() => openWorkspace('projects')} className={`px-4 py-3 rounded-xl border font-black ${theme.btnSecondary}`}>โครงการจัดซื้อ</button>
                    </div>
                    <p className={`text-xs font-bold mt-2 ${theme.textMuted}`}>โครงการใช้สำหรับจัดกลุ่มอุปกรณ์ตามแหล่งที่มา/จัดซื้อ</p>
                  </div>
                  {formData.project === 'อื่นๆ' && (
                    <div className="sm:col-span-2">
                      <label className="block text-base font-bold text-blue-500 mb-2">เพิ่มชื่อโครงการใหม่ / พิมพ์ระบุเอง</label>
                      <input type="text" autoFocus className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-800'}`} placeholder="เช่น โครงการจัดซื้ออุปกรณ์ถ่ายภาพ ปี 2569" value={formData.newProject || ''} onChange={e => setFormData({...formData, newProject: e.target.value})} />
                    </div>
                  )}
                  <div>
                    <label className={`block text-base font-bold mb-2 ${theme.textTitle}`}>สถานะใช้งาน</label>
                    <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.status || 'available'} onChange={e => setFormData({...formData, status: e.target.value})}>
                      {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={`block text-base font-bold mb-2 ${theme.textTitle}`}>สถานะพัสดุ</label>
                    <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.assetStatus || 'active'} onChange={e => setFormData({...formData, assetStatus: e.target.value})}>
                      {ASSET_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                    <p className={`text-xs font-bold mt-2 ${theme.textMuted}`}>สถานะพัสดุใช้ตรวจพัสดุ เช่น ใช้งานอยู่ / จำหน่ายแล้ว / สูญหาย</p>
                  </div>
                </div>
              </section>

              <section className={`item-form-section p-4 sm:p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-200'}`}>
                <div className={`font-black text-lg mb-4 flex items-center gap-2 ${theme.textTitle}`}>3. รายละเอียดเพิ่มเติม</div>
                <div className="space-y-4">
                  <div className={`p-4 border rounded-xl transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <label className={`flex items-center gap-3 cursor-pointer ${theme.textTitle}`}>
                      <input type="checkbox" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" checked={!!formData.qrTagged} onChange={e => setFormData({...formData, qrTagged: e.target.checked})} />
                      <span className="font-bold text-lg">▦ ติด QR แล้ว</span>
                    </label>
                    <p className={`text-xs font-bold mt-2 ${theme.textMuted}`}>ใช้ช่วยกรองรายการที่ยังไม่ได้ติดสติ๊กเกอร์ QR ตอนเตรียมอุปกรณ์จริง</p>
                  </div>

                  <div className={`p-4 border rounded-xl transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <label className={`flex items-center gap-3 cursor-pointer ${theme.textTitle}`}>
                      <input type="checkbox" className="w-5 h-5 accent-fuchsia-500 rounded cursor-pointer" checked={formData.isPersonalItem} onChange={e => {
                        const isChecked = e.target.checked;
                        setFormData({...formData, isPersonalItem: isChecked, owner: isChecked ? (formData.owner || '') : '', newOwner: ''});
                      }} />
                      <span className="font-bold text-lg">👤 ระบุว่าเป็น "ของส่วนตัว" (Personal Item)</span>
                    </label>
                    {formData.isPersonalItem && (
                      <div className="mt-4 space-y-4">
                        <div>
                          <label className={`block text-sm font-bold mb-2 ${theme.textMuted}`}>เลือกชื่อเจ้าของ <span className="text-rose-500">*</span></label>
                          <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border focus:ring-2 focus:ring-fuchsia-500 ${theme.input}`} value={formData.owner || ''} onChange={e => setFormData({...formData, owner: e.target.value, newOwner: e.target.value !== 'อื่นๆ' ? '' : formData.newOwner})}>
                            <option value="" disabled>-- เลือกชื่อเจ้าของ --</option>
                            {(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}
                          </select>
                        </div>
                        {formData.owner === 'อื่นๆ' && (
                          <input type="text" autoFocus className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border focus:ring-2 focus:ring-fuchsia-500 ${isDarkMode ? 'bg-fuchsia-900/20 border-fuchsia-800 text-fuchsia-300' : 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800'}`} placeholder="พิมพ์ชื่อเจ้าของใหม่..." value={formData.newOwner || ''} onChange={e => setFormData({...formData, newOwner: e.target.value})} />
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className={`block text-base font-bold mb-2 ${theme.textTitle}`}>หมายเหตุภายใน / โน้ตอุปกรณ์ <span className={`text-sm font-normal ${theme.textMuted}`}>(ไม่แสดงบน QR)</span></label>
                    <textarea className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border resize-none ${theme.input}`} rows="3" placeholder="เช่น แบตเสื่อมเร็ว, ช่อง HDMI หลวม, ใช้กับสายเฉพาะรุ่น..." value={formData.internalNote || ''} onChange={e => setFormData({...formData, internalNote: e.target.value})}></textarea>
                  </div>

                  {getMissingDataLabels(formData).length > 0 && (
                    <div className={`p-2.5 rounded-xl border text-sm font-black ${isDarkMode ? 'bg-amber-950/30 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-700'}`}>
                      ข้อมูลที่ยังควรเติม: {getMissingDataLabels(formData).join(', ')}
                    </div>
                  )}
                </div>
              </section>
            </div>

            <div className="flex gap-3 mt-6">
              <button type="button" onClick={() => confirmCloseIfDirty(true, () => setShowForm(false))} className={`flex-1 py-4 font-bold rounded-xl transition-colors text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={() => runWithBusy(handleSave)} disabled={isBusy} className={`flex-1 py-4 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-colors text-lg ${isBusy ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'}`}>{isBusy ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
            </div>
          </div>
        </div>
      )}

      {/* 🧭 Modal ศูนย์รวมของที่ต้องจัดการ */}
      {showActionCenterModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden ${theme.cardBg}`}>
            <div className={`flex justify-between items-start gap-4 p-6 border-b ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.Alert className="w-6 h-6 text-rose-500" /> ของที่ต้องจัดการ</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>รวมรายการที่ควรตาม/ตรวจ/แก้ไขในที่เดียว</p>
              </div>
              <button onClick={() => setShowActionCenterModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                ['เลยกำหนดคืน', actionCenterData.overdue, 'overdue', 'text-rose-500'],
                ['ต้องคืนวันนี้', actionCenterData.dueToday, 'overdue', 'text-amber-500'],
                ['ชำรุด/ส่งซ่อม', actionCenterData.maintenance, 'maintenance', 'text-rose-500'],
                ['ยังไม่ติด QR', actionCenterData.untagged, 'untagged', 'text-blue-500']
              ].map(([title, list, type, tone]) => (
                <div key={title} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between gap-3 mb-3">
                    <h4 className={`font-black text-lg ${theme.textTitle}`}>{title}</h4>
                    <button onClick={() => applyProblemFilter(type)} className={`text-xs font-black px-3 py-1.5 rounded-lg ${theme.btnCancel}`}>ดู/กรอง</button>
                  </div>
                  <div className={`text-4xl font-black mb-2 ${tone}`}>{list.length}</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto custom-scrollbar">
                    {list.slice(0, 8).map(i => <div key={i.id} className={`text-sm font-bold px-3 py-2 rounded-xl ${isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-700'}`}>{i.name} <span className={theme.textMuted}>{i.sn ? `• ${i.sn}` : ''}</span></div>)}
                    {list.length === 0 && <div className={`text-sm font-bold ${theme.textMuted}`}>ไม่มีรายการ</div>}
                  </div>
                </div>
              ))}
              <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                <h4 className={`font-black text-lg ${theme.textTitle}`}>รายการเตรียมของยังไม่ครบ</h4>
                <div className="text-4xl font-black my-2 text-sky-500">{actionCenterData.prepIncomplete.length}</div>
                {actionCenterData.prepIncomplete.slice(0, 8).map(p => <div key={p.id} className={`text-sm font-bold px-3 py-2 rounded-xl mb-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>{p.name} • {(p.checkedIds||[]).length}/{(p.itemIds||[]).length}</div>)}
              </div>
              <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                <h4 className={`font-black text-lg ${theme.textTitle}`}>กล่องที่มีรายการหายจากSystem</h4>
                <div className="text-4xl font-black my-2 text-cyan-500">{actionCenterData.brokenBoxes.length}</div>
                {actionCenterData.brokenBoxes.slice(0, 8).map(b => <div key={b.id} className={`text-sm font-bold px-3 py-2 rounded-xl mb-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>{b.name} • หาย {(b.missingIds||[]).length} รายการ</div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📅 Modal ปฏิทินงาน / กำหนดคืน */}
      {showCalendarModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.History className="w-6 h-6 text-sky-500" /> ปฏิทินงาน / กำหนดคืน</h3>
              <button onClick={() => setShowCalendarModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
              {calendarDays.length === 0 && <div className={`text-center py-12 font-black text-xl ${theme.textMuted}`}>ยังไม่มีกำหนดคืนหรือรายการเตรียมของ</div>}
              {calendarDays.map(day => (
                <div key={day.date} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className={`font-black text-lg ${theme.textTitle}`}>{new Date(day.date).toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h4>
                    <span className={`text-xs font-black px-3 py-1 rounded-full ${theme.btnCancel}`}>{day.events.length} รายการ</span>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {day.events.map((ev, idx) => (
                      <div key={idx} className={`p-3 rounded-xl border ${ev.type === 'prep' ? (isDarkMode ? 'bg-sky-900/20 border-sky-800' : 'bg-sky-50 border-sky-200') : ev.type === 'event-return' ? (isDarkMode ? 'bg-orange-900/20 border-orange-800' : 'bg-orange-50 border-orange-200') : (isDarkMode ? 'bg-purple-900/20 border-purple-800' : 'bg-purple-50 border-purple-200')}`}>
                        <div className={`font-black ${theme.textTitle}`}>{ev.title}</div>
                        <div className={`text-sm font-bold ${theme.textMuted}`}>{ev.itemName}{ev.sn ? ` • ${ev.sn}` : ''}{ev.staff ? ` • ${ev.staff}` : ''}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 🔎 Modal ตรวจนับสต๊อก */}
      {showStockCountModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.QrCode className="w-6 h-6 text-amber-500" /> โหมดตรวจนับสต๊อก</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เดินสแกน QR/S.N. ของจริง Systemจะเทียบกับรายการในเว็บ</p>
              </div>
              <button onClick={() => setShowStockCountModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className={`p-4 rounded-2xl border text-center ${theme.cardBg}`}><div className="text-sm font-bold text-slate-500">ทั้งหมด</div><div className="text-3xl font-black text-blue-500">{stockCountStats.activeItems.length}</div></div>
                <div className={`p-4 rounded-2xl border text-center ${theme.cardBg}`}><div className="text-sm font-bold text-slate-500">พบแล้ว</div><div className="text-3xl font-black text-emerald-500">{stockCountStats.found.length}</div></div>
                <div className={`p-4 rounded-2xl border text-center ${theme.cardBg}`}><div className="text-sm font-bold text-slate-500">ยังไม่พบ</div><div className="text-3xl font-black text-amber-500">{stockCountStats.notFound.length}</div></div>
                <div className={`p-4 rounded-2xl border text-center ${theme.cardBg}`}><div className="text-sm font-bold text-slate-500">ยืม/ออกงาน</div><div className="text-3xl font-black text-purple-500">{stockCountStats.out.length}</div></div>
                <div className={`p-4 rounded-2xl border text-center ${theme.cardBg}`}><div className="text-sm font-bold text-slate-500">ซ่อม</div><div className="text-3xl font-black text-rose-500">{stockCountStats.maintenance.length}</div></div>
              </div>
              <form onSubmit={(e) => { e.preventDefault(); handleStockCountScan(); }} className="flex flex-col sm:flex-row gap-3">
                <input value={stockCountInput} onChange={(e) => setStockCountInput(e.target.value)} className={`flex-1 px-4 py-4 rounded-xl font-bold text-lg border ${theme.input}`} placeholder="สแกน QR / พิมพ์ S.N. / ชื่ออุปกรณ์" autoFocus />
                <button className="px-6 py-4 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black">บันทึกว่าพบ</button>
                <button type="button" onClick={() => setStockCountFoundIds([])} className={`px-6 py-4 rounded-xl font-black border ${theme.btnSecondary}`}>เริ่มใหม่</button>
              </form>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <h4 className={`font-black mb-3 ${theme.textTitle}`}>พบแล้วล่าสุด</h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {stockCountStats.found.slice(-30).reverse().map(i => <div key={i.id} className={`p-3 rounded-xl font-bold ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>✅ {i.name} <span className={theme.textMuted}>{i.sn || ''}</span></div>)}
                    {stockCountStats.found.length === 0 && <div className={`font-bold ${theme.textMuted}`}>ยังไม่ได้สแกนรายการใด</div>}
                  </div>
                </div>
                <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700' : 'border-slate-200'}`}>
                  <h4 className={`font-black mb-3 ${theme.textTitle}`}>ยังไม่พบ (เฉพาะของพร้อมใช้)</h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {stockCountStats.notFound.slice(0, 60).map(i => <div key={i.id} className={`p-3 rounded-xl font-bold ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>□ {i.name} <span className={theme.textMuted}>{i.sn || ''}</span></div>)}
                    {stockCountStats.notFound.length === 0 && <div className={`font-bold text-emerald-500`}>ครบแล้วในกลุ่มพร้อมใช้</div>}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 🛠️ Modal แจ้งซ่อม / ประวัติซ่อม */}
      {showRepairModal && (() => {
        const repairItem = items.find(i => i.id === repairTargetId);
        if (!repairItem) return null;
        return (
          <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9999]`}>
            <div className={`rounded-3xl shadow-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden ${theme.cardBg}`}>
              <div className={`flex justify-between items-start gap-4 p-6 border-b ${theme.divide}`}>
                <div>
                  <h3 className={`text-2xl font-black ${theme.textTitle}`}>แจ้งซ่อม / บันทึกปัญหา</h3>
                  <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>{repairItem.name} • {repairItem.sn || '-'}</p>
                </div>
                <button onClick={() => setShowRepairModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
              </div>
              <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <label className="block"><span className={`block font-bold mb-1 ${theme.textTitle}`}>วันที่พบปัญหา</span><input type="date" className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} value={repairForm.issueDate} onChange={e => setRepairForm({...repairForm, issueDate: e.target.value})} /></label>
                  <label className="block"><span className={`block font-bold mb-1 ${theme.textTitle}`}>ผู้แจ้ง</span><input className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} value={repairForm.reporter} onChange={e => setRepairForm({...repairForm, reporter: e.target.value})} /></label>
                </div>
                <label className="block"><span className={`block font-bold mb-1 ${theme.textTitle}`}>อาการเสีย / สิ่งที่ต้องตรวจ <span className="text-rose-500">*</span></span><textarea rows="3" className={`w-full px-4 py-3 rounded-xl border resize-none ${theme.input}`} value={repairForm.problem} onChange={e => setRepairForm({...repairForm, problem: e.target.value})} placeholder="เช่น หัวไมค์หลวม / ช่อง HDMI กระพริบ / แบตเสื่อม" /></label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <input className={`px-4 py-3 rounded-xl border ${theme.input}`} placeholder="ส่งซ่อมที่ไหน" value={repairForm.sentTo} onChange={e => setRepairForm({...repairForm, sentTo: e.target.value})} />
                  <input className={`px-4 py-3 rounded-xl border ${theme.input}`} placeholder="ค่าใช้จ่าย" value={repairForm.cost} onChange={e => setRepairForm({...repairForm, cost: e.target.value})} />
                  <input type="date" className={`px-4 py-3 rounded-xl border ${theme.input}`} value={repairForm.doneDate} onChange={e => setRepairForm({...repairForm, doneDate: e.target.value})} />
                </div>
                <textarea rows="2" className={`w-full px-4 py-3 rounded-xl border resize-none ${theme.input}`} placeholder="หมายเหตุเพิ่มเติม" value={repairForm.note} onChange={e => setRepairForm({...repairForm, note: e.target.value})} />
                <label className={`flex items-center gap-3 p-4 rounded-xl border ${theme.btnSecondary}`}><input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={repairForm.markAvailable} onChange={e => setRepairForm({...repairForm, markAvailable: e.target.checked})} /><span className="font-bold">ซ่อมเสร็จแล้ว เปลี่ยนสถานะกลับเป็นพร้อมใช้</span></label>
                <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                  <h4 className={`font-black mb-3 ${theme.textTitle}`}>ประวัติซ่อมล่าสุด</h4>
                  {(repairItem.repairLogs || []).slice(-5).reverse().map((r, idx) => <div key={idx} className={`text-sm font-bold mb-2 p-3 rounded-xl ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>{r.issueDate || '-'} • {r.problem} <span className={theme.textMuted}>โดย {r.reporter || '-'}</span></div>)}
                  {!(repairItem.repairLogs || []).length && <div className={`font-bold ${theme.textMuted}`}>ยังไม่มีประวัติซ่อม</div>}
                </div>
              </div>
              <div className={`p-5 border-t flex gap-3 ${theme.divide}`}>
                <button onClick={() => setShowRepairModal(false)} className={`flex-1 py-3 rounded-xl font-bold ${theme.btnCancel}`}>ยกเลิก</button>
                <button onClick={() => runWithBusy(handleSaveRepair)} disabled={isBusy} className={`flex-1 py-3 rounded-xl font-black text-white ${isBusy ? 'bg-rose-400 cursor-wait' : 'bg-rose-600 hover:bg-rose-500'}`}>{isBusy ? 'กำลังบันทึก...' : 'บันทึกงานซ่อม'}</button>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 📺 Modal จอทีวีศูนย์ */}
      {showTvDashboardModal && (
        <div className={`fixed inset-0 z-[10000] p-6 sm:p-10 overflow-y-auto ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`}>
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl sm:text-4xl font-black">MDEC-Stock Dashboard</h1>
              <p className={`font-bold mt-1 ${theme.textMuted}`}>ภาพรวมสำหรับเปิดค้างบนจอศูนย์ • {currentTime.toLocaleTimeString('th-TH')}</p>
            </div>
            <button onClick={() => setShowTvDashboardModal(false)} className="px-5 py-3 rounded-2xl bg-rose-600 text-white font-black">ปิด</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            {[['ทั้งหมด', stats.all, 'text-blue-500'], ['พร้อมใช้', stats.available, 'text-emerald-500'], ['ถูกยืม', stats.borrowed, 'text-purple-500'], ['ออกงาน', stats.outForEvent, 'text-orange-500'], ['ชำรุด', stats.maintenance, 'text-rose-500'], ['ต้องจัดการ', actionCenterData.total, 'text-amber-500']].map(([label, value, tone]) => (
              <div key={label} className={`p-5 rounded-3xl border shadow-sm text-center ${theme.cardBg}`}><div className="text-sm font-black opacity-70">{label}</div><div className={`text-4xl font-black ${tone}`}>{value}</div></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className={`rounded-3xl border p-5 ${theme.cardBg}`}><h2 className="text-2xl font-black mb-3">ต้องคืนวันนี้</h2>{todayFollowup.dueToday.slice(0,8).map(i => <div key={i.id} className="text-xl font-bold py-2 border-b border-slate-200/30">{i.name}</div>)}{!todayFollowup.dueToday.length && <div className="text-xl font-bold opacity-60">ไม่มีรายการ</div>}</div>
            <div className={`rounded-3xl border p-5 ${theme.cardBg}`}><h2 className="text-2xl font-black mb-3">เลยกำหนดคืน</h2>{todayFollowup.overdue.slice(0,8).map(i => <div key={i.id} className="text-xl font-bold py-2 text-rose-500 border-b border-slate-200/30">{i.name}</div>)}{!todayFollowup.overdue.length && <div className="text-xl font-bold opacity-60">ไม่มีรายการ</div>}</div>
            <div className={`rounded-3xl border p-5 ${theme.cardBg}`}><h2 className="text-2xl font-black mb-3">งาน/เตรียมของใกล้ถึง</h2>{calendarDays.slice(0,5).map(d => <div key={d.date} className="py-2 border-b border-slate-200/30"><div className="font-black">{new Date(d.date).toLocaleDateString('th-TH')}</div><div className="font-bold opacity-70">{d.events.length} รายการ</div></div>)}</div>
          </div>
        </div>
      )}


      {/* 🗂️ Legacy Project Manager (เก็บไว้เผื่อปุ่มเก่าเรียก แต่เมนูหลักใช้หน้าโครงการจัดซื้อแบบเต็มหน้าแล้ว) */}
      {showProjectsModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[92vh] border ${isDarkMode ? 'bg-slate-900 border-slate-700 shadow-black/40' : 'bg-white border-white shadow-slate-200/80'}`}>
            <div className={`p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-3xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center shadow-lg">🗂️</span>
                  โครงการจัดซื้อ
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>บันทึกว่าอุปกรณ์แต่ละชิ้นจัดซื้อ/จัดหามาจากโครงการไหน ใช้สำหรับตรวจรายการและพิมพ์รายงาน</p>
              </div>
              <button type="button" onClick={() => setShowProjectsModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1 space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  ['1', 'สร้างชื่อโครงการ', 'ตั้งชื่อกลุ่ม เช่น งานประชุม / ห้องใหม่ / โครงการจัดซื้อ'],
                  ['2', 'จัดอุปกรณ์', 'กดปุ่มจัดอุปกรณ์ แล้วติ๊กเลือกของที่เกี่ยวข้อง'],
                  ['3', 'ใช้งานต่อ', 'กดดูของที่อยู่ในโครงการจัดซื้อนี้ หรือพิมพ์รายงานได้ทันที']
                ].map(([no, title, desc]) => (
                  <div key={no} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center font-black mb-3">{no}</div>
                    <div className={`font-black ${theme.textTitle}`}>{title}</div>
                    <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>{desc}</div>
                  </div>
                ))}
              </div>

              <div className={`p-5 rounded-[1.75rem] border shadow-sm ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}>
                <div className="grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 items-end">
                  <div>
                    <label className={`block text-base font-black mb-2 ${theme.textTitle}`}>เพิ่มชื่อโครงการจัดซื้อ / แหล่งงบประมาณ</label>
                    <input
                      className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`}
                      placeholder="เช่น งานประชุมใหญ่ / โครงการจัดซื้ออุปกรณ์ / ห้องปฏิบัติการใหม่"
                      value={quickProjectName}
                      onChange={e => setQuickProjectName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddProjectQuick(); }}
                    />
                    <p className={`text-xs font-bold mt-2 ${theme.textMuted}`}>ขั้นตอนคือ 1) สร้างชื่อโครงการ 2) กด “จัดอุปกรณ์” 3) ติ๊กเลือกอุปกรณ์แล้วบันทึก</p>
                  </div>
                  <button type="button" onClick={handleAddProjectQuick} className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md whitespace-nowrap">
                    + เพิ่มชื่อ
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-xs font-bold ${theme.textMuted}`}>โครงการทั้งหมด</div>
                  <div className="text-3xl font-black text-indigo-500">{projectStats.length.toLocaleString('th-TH')}</div>
                </div>
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-xs font-bold ${theme.textMuted}`}>อุปกรณ์ที่ผูกไว้</div>
                  <div className="text-3xl font-black text-blue-500">{projectStats.reduce((s,p)=>s+(p.total||0),0).toLocaleString('th-TH')}</div>
                </div>
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-xs font-bold ${theme.textMuted}`}>จำหน่ายแล้ว</div>
                  <div className="text-3xl font-black text-slate-500">{projectStats.reduce((s,p)=>s+(p.disposed||0),0).toLocaleString('th-TH')}</div>
                </div>
                <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`text-xs font-bold ${theme.textMuted}`}>สูญหาย/รอจำหน่าย</div>
                  <div className="text-3xl font-black text-rose-500">{projectStats.reduce((s,p)=>s+(p.lost||0)+(p.pending_disposal||0),0).toLocaleString('th-TH')}</div>
                </div>
              </div>

              <div className={`p-4 rounded-2xl border grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3 ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <input className={`px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="ค้นหาชื่อโครงการ / ชื่ออุปกรณ์ / S.N. / ห้องเก็บ" value={projectManagerSearch} onChange={e => setProjectManagerSearch(e.target.value)} />
                <button type="button" onClick={() => setProjectManagerSearch('')} className={`px-4 py-3 rounded-xl border font-black ${theme.btnSecondary}`}>ล้างค้นหา</button>
              </div>

              {filterProject !== 'all' && (
                <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-indigo-950/20 border-indigo-800 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  <div className="font-black">กำลังกรองโครงการ: {filterProject}</div>
                  <button type="button" onClick={() => setFilterProject('all')} className={`px-3 py-2 rounded-xl border font-black ${theme.btnSecondary}`}>ยกเลิกกรองโครงการ</button>
                </div>
              )}

              {filteredProjectStats.length === 0 ? (
                <div className={`text-center py-16 rounded-3xl border font-black text-xl ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  ไม่พบโครงการที่ตรงกับการค้นหา
ลองล้างคำค้น หรือเพิ่มโครงการใหม่ด้านบน
                </div>
              ) : (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {filteredProjectStats.map((project) => {
                    const progress = project.total ? Math.round(((project.active || 0) / project.total) * 100) : 0;
                    return (
                      <div key={project.name} className={`rounded-[1.75rem] border overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`p-5 border-b ${theme.divide}`}>
                          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className={`font-black text-xl truncate ${theme.textTitle}`}>{project.name}</div>
                              <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ทั้งหมด {project.total} รายการ • ใช้งานอยู่ {project.active || 0} • จำหน่ายแล้ว {project.disposed || 0} • สูญหาย {project.lost || 0}</div>
                            </div>
                            <div className="flex flex-wrap gap-2 shrink-0">
                              {canAddEditItems && project.name !== 'ไม่ระบุโครงการ' && <button type="button" onClick={() => openProjectAssign(project.name)} className="px-3 py-2 rounded-xl text-sm font-black bg-blue-600 hover:bg-blue-500 text-white">จัดอุปกรณ์</button>}
                              <button type="button" onClick={() => openProjectPrint(project.name)} className="px-3 py-2 rounded-xl text-sm font-black bg-slate-800 hover:bg-slate-700 text-white">พิมพ์รายงาน</button>
                              <button type="button" onClick={() => { setFilterProject(project.name); setShowProjectsModal(false); }} className="px-3 py-2 rounded-xl text-sm font-black bg-indigo-600 hover:bg-indigo-500 text-white">ดูเฉพาะโครงการนี้</button>
                            </div>
                          </div>
                          <div className={`mt-4 h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-800' : 'bg-slate-100'}`}>
                            <div className="h-full bg-gradient-to-r from-emerald-500 to-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }}></div>
                          </div>
                        </div>

                        <div className="p-4">
                          {project.items.length === 0 ? (
                            <div className={`p-6 rounded-2xl border text-center font-bold ${theme.textMuted}`}>ยังไม่มีอุปกรณ์ในโครงการนี้
กด “จัดอุปกรณ์” เพื่อเลือกอุปกรณ์เข้าโครงการ</div>
                          ) : (
                            <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar pr-1">
                              {project.items.map((item) => {
                                const assetInfo = getAssetStatusInfo(item.assetStatus);
                                const statusInfo = STATUSES.find(s => s.id === item.status) || STATUSES[0];
                                return (
                                  <div key={item.id} className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="min-w-0">
                                        <div className={`font-black truncate ${theme.textTitle}`}>{item.name}</div>
                                        <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>S.N. {item.sn || '-'} • {item.location || '-'} • {item.category || '-'}</div>
                                      </div>
                                      <div className="flex flex-col gap-1 items-end shrink-0">
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${isDarkMode ? statusInfo.darkColor : statusInfo.color}`}>{statusInfo.label}</span>
                                        <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${isDarkMode ? assetInfo.darkColor : assetInfo.color}`}>{assetInfo.label}</span>
                                      </div>
                                    </div>
                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mt-3">
                                      <button type="button" onClick={() => setShowHistory(item.id)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>รายละเอียด</button>
                                      {canAddEditItems && <button type="button" onClick={() => { setShowProjectsModal(false); openItemEditor(item); }} className="px-3 py-2 rounded-xl text-sm font-black bg-blue-600 text-white">แก้ไข</button>}
                                      <button type="button" onClick={() => copyItemSummary(item)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>คัดลอก</button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}

                          <div className={`mt-4 pt-4 border-t flex flex-wrap gap-2 ${theme.divide}`}>
                            {canAddEditItems && project.name !== 'ไม่ระบุโครงการ' && <button type="button" onClick={() => handleRenameProject(project.name)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>เปลี่ยนชื่อ</button>}
                            {canAddEditItems && project.name !== 'ไม่ระบุโครงการ' && project.total === 0 && <button type="button" onClick={() => handleDeleteEmptyProject(project.name)} className="px-3 py-2 rounded-xl text-sm font-black bg-rose-600 text-white">ลบโครงการว่าง</button>}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className={`p-4 border-t ${theme.divide}`}>
              <button type="button" onClick={() => setShowProjectsModal(false)} className={`w-full py-4 rounded-xl font-black ${theme.btnCancel}`}>ปิดโครงการจัดซื้อ</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal ผูกอุปกรณ์กับโครงการจัดซื้อ */}
      {showProjectAssignModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9995]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border ${theme.cardBg}`}>
            <div className={`p-5 border-b flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl sm:text-3xl font-black ${theme.textTitle}`}>ผูกอุปกรณ์กับโครงการจัดซื้อ</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>โครงการ: <span className="text-indigo-500">{projectAssignTarget}</span> • ติ๊กเลือกเพื่อเพิ่มเข้ากลุ่ม หรือติ๊กออกเพื่อนำออกจากโครงการ แล้วบันทึกทีเดียว</p>
              </div>
              <button type="button" onClick={() => setShowProjectAssignModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 border-b grid grid-cols-1 lg:grid-cols-[1fr_auto] gap-3">
              <input className={`px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="ค้นหาอุปกรณ์ / S.N. / หมวดหมู่ / ห้องเก็บ / โครงการเดิม" value={projectAssignSearch} onChange={e => setProjectAssignSearch(e.target.value)} />
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <div className={`px-4 py-3 rounded-xl border font-black text-center ${theme.btnSecondary}`}>เลือกแล้ว {projectAssignSelectedIds.length.toLocaleString('th-TH')} รายการ</div>
                <button type="button" onClick={() => setProjectAssignSelectedIds(prev => [...new Set([...prev, ...projectAssignCandidateItems.map(item => item.id)])])} className="px-4 py-3 rounded-xl bg-blue-600 text-white font-black">เลือกที่ค้นหาทั้งหมด</button>
                <button type="button" onClick={() => { const visibleIds = new Set(projectAssignCandidateItems.map(item => item.id)); setProjectAssignSelectedIds(prev => prev.filter(id => !visibleIds.has(id))); }} className={`px-4 py-3 rounded-xl border font-black ${theme.btnCancel}`}>ล้างที่ค้นหา</button>
              </div>
            </div>
            <div className={`px-5 py-3 border-b text-sm font-bold ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-blue-50 border-blue-100 text-blue-800'}`}>
              วิธีใช้: รายการที่มีเครื่องหมายถูกจะถือว่าเป็นอุปกรณ์ที่จัดซื้อ/จัดหามาจากโครงการนี้ ถ้าเอาเครื่องหมายถูกออกแล้วกดบันทึก ระบบจะนำรายการนั้นออกจากโครงการ
            </div>
            <div className="p-4 overflow-y-auto custom-scrollbar flex-1">
              {projectAssignCandidateItems.length === 0 ? (
                <div className={`p-10 rounded-3xl border text-center font-black ${theme.textMuted}`}>ไม่พบอุปกรณ์ที่ค้นหา</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {projectAssignCandidateItems.map(item => {
                    const checked = projectAssignSelectedIds.includes(item.id);
                    const already = normalizeProjectName(item.project) === normalizeProjectName(projectAssignTarget);
                    return (
                      <button key={item.id} type="button" onClick={() => toggleProjectAssignItem(item.id)} className={`p-4 rounded-2xl border text-left transition-all ${checked ? (isDarkMode ? 'bg-indigo-950/50 border-indigo-600 text-indigo-200' : 'bg-indigo-50 border-indigo-300 text-indigo-800') : theme.btnSecondary}`}>
                        <div className="flex items-start gap-3">
                          <input type="checkbox" readOnly checked={checked} className="w-5 h-5 mt-1 accent-indigo-600" />
                          <div className="min-w-0 flex-1">
                            <div className="font-black truncate">{item.name}</div>
                            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>S.N. {item.sn || '-'} • {item.category || '-'} • {item.location || '-'}</div>
                            <div className={`text-xs font-bold mt-2 ${already ? 'text-emerald-500' : theme.textMuted}`}>{checked ? (already ? 'อยู่ในโครงการจัดซื้อนี้แล้ว' : 'จะผูกเข้าโครงการจัดซื้อนี้') : (already ? 'จะนำออกจากโครงการจัดซื้อนี้เมื่อบันทึก' : `ปัจจุบัน: ${projectDisplayName(item.project)}`)}</div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
            <div className={`p-4 border-t grid grid-cols-2 gap-3 ${theme.divide}`}>
              <button type="button" onClick={() => setShowProjectAssignModal(false)} className={`py-3 rounded-xl font-black ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={() => runWithBusy(handleSaveProjectAssignment)} disabled={isBusy} className={`py-3 rounded-xl font-black text-white ${isBusy ? 'bg-indigo-400 cursor-wait' : 'bg-indigo-600 hover:bg-indigo-500'}`}>{isBusy ? 'กำลังบันทึก...' : 'บันทึกการจัดโครงการ'}</button>
            </div>
          </div>
        </div>
      )}


      {/* ศูนย์หลักฐานรูปภาพทั้งหมด */}
      {showProofCenterModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[92vh] border ${isDarkMode ? 'bg-slate-900 border-slate-700 shadow-black/40' : 'bg-white border-white shadow-slate-200/80'}`}>
            <div className={`p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-3xl font-black flex items-center gap-3 ${theme.textTitle}`}><span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 to-rose-500 text-white flex items-center justify-center shadow-lg">📷</span> ศูนย์หลักฐานรูปภาพ</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>แสดงแบบรวมรูปซ้ำ และโชว์ภาพเต็มโดยไม่ครอป แม้รูปจะเป็นแนวตั้งหรือแนวนอน</p>
              </div>
              <button type="button" onClick={() => setShowProofCenterModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className={`p-4 border-b grid grid-cols-1 md:grid-cols-3 gap-3 ${theme.divide}`}>
              <input className={`px-4 py-3 rounded-xl border font-bold ${theme.input}`} placeholder="ค้นหา ชื่ออุปกรณ์ / S.N. / ผู้ยืม / งาน / กล่อง" value={proofCenterSearch} onChange={e => setProofCenterSearch(e.target.value)} />
              <select className={`px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={proofCenterFilter} onChange={e => setProofCenterFilter(e.target.value)}>
                <option value="all">หลักฐานทั้งหมด</option>
                <option value="borrow">การยืม</option>
                <option value="event">ออกงาน</option>
                <option value="return">รับคืน</option>
                <option value="repair">แจ้งซ่อม</option>
              </select>
              <div className={`p-3 rounded-xl border text-sm font-black ${theme.btnSecondary}`}>
                พบ {proofDuplicateStats.realImages.toLocaleString('th-TH')} รูปจริง • เชื่อมโยง {proofDuplicateStats.itemLinkCount.toLocaleString('th-TH')} อุปกรณ์/รายการ
              </div>
            </div>
            <div className={`px-5 py-3 border-b text-xs sm:text-sm font-bold ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              จากข้อมูลเดิมมีการแสดงผล {proofDuplicateStats.linkCount.toLocaleString('th-TH')} จุดเชื่อมโยง Systemรวมรูปซ้ำออกไป {proofDuplicateStats.duplicateLinks.toLocaleString('th-TH')} จุด • รูปตัวอย่างใช้โหมดภาพเต็ม ไม่ตัดหัว/ตัดขอบ
            </div>
            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              {filteredProofGroups.length === 0 ? (
                <div className={`text-center py-16 font-black text-xl ${theme.textMuted}`}>ยังไม่มีรูปหลักฐาน หรือไม่พบจากคำค้นหา</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProofGroups.map((group) => {
                    const entry = group.representative || {};
                    const proof = group.proof || {};
                    const previewSrc = proof.url || proof.thumbUrl || '';
                    const expanded = expandedProofGroupId === group.groupId;
                    return (
                      <div key={group.groupId} className={`rounded-[1.35rem] border overflow-hidden text-left hover:shadow-xl transition-all ${isDarkMode ? 'bg-slate-950 border-slate-700 shadow-black/20' : 'bg-white border-slate-100 shadow-slate-200/70'}`}>
                        <button type="button" onClick={() => openProofImage(proof)} className="block w-full text-left">
                          <div className="relative">
                            {previewSrc ? (
                              <div className={`w-full h-56 sm:h-60 flex items-center justify-center ${isDarkMode ? 'bg-slate-900' : 'bg-slate-100'} bg-[linear-gradient(45deg,rgba(148,163,184,0.12)_25%,transparent_25%,transparent_75%,rgba(148,163,184,0.12)_75%),linear-gradient(45deg,rgba(148,163,184,0.12)_25%,transparent_25%,transparent_75%,rgba(148,163,184,0.12)_75%)] bg-[length:18px_18px] bg-[position:0_0,9px_9px]`}>
                                <img src={previewSrc} alt="หลักฐาน" className="max-w-full max-h-full object-contain block" loading="lazy" />
                              </div>
                            ) : <div className={`w-full h-56 flex items-center justify-center font-black ${theme.textMuted}`}>คลิกเพื่อเปิดรูป</div>}
                            <div className="absolute right-3 top-3 px-3 py-1.5 rounded-full bg-white text-slate-800 text-xs font-black border border-white/70">
                              ภาพเต็ม
                            </div>
                            {group.itemRefs.length > 1 && (
                              <div className="absolute left-3 top-3 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-black">
                                รูปเดียว • {group.itemRefs.length} อุปกรณ์
                              </div>
                            )}
                          </div>
                          <div className="p-3 space-y-1">
                            <div className={`font-black truncate ${theme.textTitle}`}>{group.itemRefs.length > 1 ? `เกี่ยวข้องกับ ${group.itemRefs.length} อุปกรณ์` : (entry.itemName || '-')}</div>
                            <div className={`text-xs font-bold ${theme.textMuted}`}>{group.itemRefs.map(ref => ref.itemName).slice(0, 2).join(' • ')}{group.itemRefs.length > 2 ? ` +${group.itemRefs.length - 2}` : ''}</div>
                            <div className="flex flex-wrap gap-1">
                              {group.typeLabels.slice(0, 3).map((label) => (
                                <span key={label} className={`inline-block text-xs px-2 py-1 rounded-lg font-black ${label === 'ยืม' ? 'bg-purple-100 text-purple-700' : label === 'ออกงาน' ? 'bg-orange-100 text-orange-700' : label === 'รับคืน' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>{label}</span>
                              ))}
                            </div>
                            <div className={`text-xs font-bold ${theme.textMuted}`}>เรื่อง: {entry.subject || '-'}</div>
                            <div className={`text-xs font-bold ${theme.textMuted}`}>เวลา: {proof.timestampText || (entry.date ? new Date(entry.date).toLocaleString('th-TH', { hour12: false }) : '-')}</div>
                            <div className={`text-xs font-bold ${theme.textMuted}`}>โดย: {proof.createdBy || entry.staff || '-'}</div>
                            {proof.note && <div className={`text-xs font-bold ${theme.textMuted}`}>หมายเหตุ: {proof.note}</div>}
                          </div>
                        </button>

                        <div className={`px-3 pb-3 ${theme.textMuted}`}>
                          <button type="button" onClick={() => setExpandedProofGroupId(expanded ? null : group.groupId)} className={`w-full py-2 rounded-xl border text-xs font-black ${theme.btnSecondary}`}>
                            {expanded ? 'ซ่อนรายการที่เกี่ยวข้อง' : `ดูรายการที่เกี่ยวข้อง (${group.itemRefs.length})`}
                          </button>
                          {canUseOperationalTools && (
                            <div className="grid grid-cols-2 gap-2 mt-2">
                              <button type="button" onClick={() => openProofEditModal(group)} className={`py-2 rounded-xl border text-xs font-black ${theme.btnSecondary}`}>แก้ไขข้อมูล</button>
                              <button type="button" onClick={() => handleDeleteProofGroup(group)} className="py-2 rounded-xl border text-xs font-black bg-rose-600 text-white border-rose-600 hover:bg-rose-700">ลบรูปนี้</button>
                            </div>
                          )}
                          {expanded && (
                            <div className="mt-2 space-y-1.5">
                              {group.itemRefs.map((ref, idx) => (
                                <button key={`${group.groupId}_${ref.itemId || idx}`} type="button" onClick={() => { setShowProofCenterModal(false); setShowHistory(ref.itemId); }} className={`w-full p-2 rounded-xl border text-left ${isDarkMode ? 'bg-slate-900 border-slate-700 hover:bg-slate-800' : 'bg-slate-50 border-slate-200 hover:bg-white'}`}>
                                  <div className={`font-black text-xs truncate ${theme.textTitle}`}>{ref.itemName}</div>
                                  <div className={`text-[11px] font-bold truncate ${theme.textMuted}`}>S.N. {ref.sn} • {ref.typeLabel} • {ref.subject}</div>
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
            <div className={`p-4 border-t ${theme.divide}`}><button type="button" onClick={() => setShowProofCenterModal(false)} className={`w-full py-4 rounded-xl font-black ${theme.btnCancel}`}>ปิดหน้าต่าง</button></div>
          </div>
        </div>
      )}

      {/* Modal แก้ไขข้อมูลรูปหลักฐาน */}
      {proofEditTarget && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[10020]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden border ${theme.cardBg}`}>
            <div className={`p-6 border-b flex justify-between items-start gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black ${theme.textTitle}`}>แก้ไขข้อมูลรูปหลักฐาน</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>แก้ชื่อ/หมายเหตุของรูปนี้ โดยไม่ต้องอัปโหลดรูปใหม่</p>
              </div>
              <button type="button" onClick={() => { setProofEditTarget(null); setProofEditForm({ contextLabel: '', note: '' }); setProofEditReplaceFiles([]); }} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className={`block text-sm font-black mb-2 ${theme.textTitle}`}>ชื่อ / ประเภทหลักฐาน</label>
                <input className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={proofEditForm.contextLabel} onChange={e => setProofEditForm(prev => ({ ...prev, contextLabel: e.target.value }))} placeholder="เช่น หลักฐานการยืม / หลักฐานรับคืน" />
              </div>
              <div>
                <label className={`block text-sm font-black mb-2 ${theme.textTitle}`}>หมายเหตุรูปภาพ</label>
                <textarea className={`w-full px-4 py-3 rounded-xl border font-bold min-h-[110px] ${theme.input}`} value={proofEditForm.note} onChange={e => setProofEditForm(prev => ({ ...prev, note: e.target.value }))} placeholder="เช่น รูปนี้เป็นภาพรวมของรายการยืมชุดลำโพง..." />
              </div>
              <div className={`p-4 rounded-2xl border text-sm font-bold ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                รูปนี้เชื่อมโยงกับ {Number(proofEditTarget.itemRefs?.length || proofEditTarget.entries?.length || 1).toLocaleString('th-TH')} อุปกรณ์/รายการ การแก้ไขจะอัปเดตข้อมูลรูปนี้ในทุกจุดที่เกี่ยวข้อง
              </div>
            </div>
            <div className={`p-4 border-t grid grid-cols-2 gap-2 ${theme.divide}`}>
              <button type="button" onClick={() => { setProofEditTarget(null); setProofEditForm({ contextLabel: '', note: '' }); }} className={`py-3 rounded-xl font-black ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleSaveProofEdit} disabled={isBusy} className="py-3 rounded-xl font-black bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-60">บันทึก</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal คู่มือใช้งาน */}
      {showHelpModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[10010]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border ${theme.cardBg}`}>
            <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-3xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg">?</span>
                  คู่มือใช้งาน MDEC-Stock
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>สรุปวิธีใช้แบบสั้น ๆ สำหรับเจ้าหน้าที่และผู้ดูแลSystem</p>
              </div>
              <button type="button" onClick={() => setShowHelpModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  ['เริ่มDaily Operations', 'เปิด Daily Workflow เพื่อสแกน QR, เพิ่มอุปกรณ์, ดูของรอคืน และหลักฐานรูปภาพ'],
                  ['ยืม / ออกงาน', 'เลือกอุปกรณ์ → กดยืมหรือออกงาน → กรอกผู้รับผิดชอบ → แนบรูปหลักฐานถ้าต้องการ → บันทึก'],
                  ['รับคืน', 'เปิดศูนย์ติดตามงานหรือรายละเอียดอุปกรณ์ → กดรับคืน → ตรวจสภาพ → แนบหลักฐานรับคืนได้']
                ].map(([title, desc], idx) => (
                  <div key={title} className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center font-black mb-3">{idx + 1}</div>
                    <div className={`font-black text-lg ${theme.textTitle}`}>{title}</div>
                    <p className={`text-sm font-bold mt-2 ${theme.textMuted}`}>{desc}</p>
                  </div>
                ))}
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-pink-950/20 border-pink-800' : 'bg-pink-50 border-pink-200'}`}>
                <h4 className={`font-black text-xl mb-3 ${theme.textTitle}`}>📷 การจัดการรูปหลักฐาน</h4>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-bold ${theme.textMuted}`}>
                  <div>• รูปหลักฐานไม่บังคับ ยกเว้นผู้ดูแลตั้งค่าให้บังคับ</div>
                  <div>• Systemจะย่อรูปและประทับเวลา/พิกัดให้เอง</div>
                  <div>• รูปเดียวที่ผูกหลายอุปกรณ์จะแสดงรวมเป็น 1 ใบใน Gallery</div>
                  <div>• เจ้าหน้าที่สามารถแก้ชื่อ/หมายเหตุ แทนที่รูปใหม่ หรือลบรูปหลักฐานที่อัปโหลดผิดได้</div>
                </div>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-emerald-950/20 border-emerald-800' : 'bg-emerald-50 border-emerald-200'}`}>
                <h4 className={`font-black text-xl mb-3 ${theme.textTitle}`}>✅ วิธีลบรูปทดลองที่อัปโหลดผิด</h4>
                <ol className={`list-decimal pl-5 space-y-2 text-sm font-bold ${theme.textMuted}`}>
                  <li>เปิดเมนู <b>เพิ่มเติม → หลักฐานรูปภาพ</b></li>
                  <li>ค้นหารูปจากชื่ออุปกรณ์ / S.N. / ผู้ยืม / ชื่องาน</li>
                  <li>กดปุ่ม <b>ลบรูปนี้</b> ใต้รูปที่ต้องการลบ</li>
                  <li>ยืนยันการลบ Systemจะถอดรูปออกจากประวัติอุปกรณ์ที่เกี่ยวข้องทั้งหมด</li>
                </ol>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-blue-950/20 border-blue-800' : 'bg-blue-50 border-blue-200'}`}>
                <h4 className={`font-black text-xl mb-3 ${theme.textTitle}`}>🔎 วิธีสแกน QR ให้ติดง่าย</h4>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-bold ${theme.textMuted}`}>
                  <div>• ให้ QR อยู่ในกรอบสแกน และอย่าให้ชิดขอบจอจนเกินไป</div>
                  <div>• หลีกเลี่ยงแสงสะท้อนจากสติ๊กเกอร์เงา หรือถ่ายในที่แสงสว่างพอ</div>
                  <div>• ถ้าสแกนไม่ติด ให้ใช้ช่อง “กรอกรหัสเอง” ในหน้าสแกน</div>
                  <div>• ตอนพิมพ์ QR แนะนำใช้ขนาด “สแกนง่ายมาก” และอย่าให้โลโก้/เส้นกรอบเข้าใกล้ QR เกินไป</div>
                </div>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-indigo-950/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
                <h4 className={`font-black text-xl mb-3 ${theme.textTitle}`}>🧭 ชื่อเมนูหลักที่ใช้ในSystem</h4>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-bold ${theme.textMuted}`}>
                  <div><b>ศูนย์ติดตามงาน</b> = ดูของรอคืน ออกงานอยู่ วันนี้ และเลยกำหนด</div>
                  <div><b>ศูนย์หลักฐานรูปภาพ</b> = ดู แก้ไข แทนที่ หรือลบรูปหลักฐาน</div>
                  <div><b>จัดเก็บและจัดชุด</b> = กล่องเก็บของ เซ็ตอุปกรณ์ และรายการเตรียมของ</div>
                  <div><b>Documents & Labels</b> = QR ฉลากกล่อง ใบยืม และตั้งค่าโลโก้เอกสาร</div>
                </div>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-950 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h4 className={`font-black text-xl mb-3 ${theme.textTitle}`}>สิทธิ์การใช้งานโดยย่อ</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {[
                    ['บัญชีกลาง', 'จัดการทุกอย่าง เพิ่ม/ปิดบัญชี ตั้งค่า และล้าง/สำรองข้อมูล'],
                    ['ผู้ดูแล', 'จัดการอุปกรณ์ ผู้ใช้ และงานหลักได้เกือบทั้งหมด'],
                    ['เจ้าหน้าที่', 'เพิ่ม/แก้ไขอุปกรณ์ ยืม คืน ออกงาน และจัดการหลักฐานได้']
                  ].map(([role, desc]) => (
                    <div key={role} className={`p-4 rounded-2xl border ${theme.btnSecondary}`}>
                      <div className={`font-black ${theme.textTitle}`}>{role}</div>
                      <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>{desc}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className={`p-4 border-t ${theme.divide}`}>
              <button type="button" onClick={() => setShowHelpModal(false)} className={`w-full py-4 rounded-xl font-black ${theme.btnCancel}`}>ปิดคู่มือ</button>
            </div>
          </div>
        </div>
      )}


      {/* ตรวจสุขภาพSystem */}
      {showSystemHealthModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] ${theme.cardBg}`}>
            <div className={`p-6 border-b flex justify-between items-start gap-4 ${theme.divide}`}>
              <div><h3 className={`text-2xl font-black ${theme.textTitle}`}>ตรวจสุขภาพSystem</h3><p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ภาพรวมฐานข้อมูล รูปหลักฐาน และรายการที่ต้องติดตาม</p></div>
              <button type="button" onClick={() => setShowSystemHealthModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <div className={`p-5 rounded-2xl border ${databaseStorageEstimate.cardTone}`}>
                <div className="flex justify-between gap-3 mb-3"><div className={`font-black text-lg ${databaseStorageEstimate.textTone}`}>พื้นที่ฐานข้อมูลโดยประมาณ: {databaseStorageEstimate.label}</div><div className={`font-black ${databaseStorageEstimate.textTone}`}>{databaseStorageEstimate.percentText}</div></div>
                <div className={`h-4 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}><div className={`h-full ${databaseStorageEstimate.barClass}`} style={{ width: databaseStorageEstimate.percentText === '<0.1%' ? '0.4%' : databaseStorageEstimate.percentText }} /></div>
                <div className={`text-xs mt-2 font-bold ${theme.textMuted}`}>{databaseStorageEstimate.estimatedText} / {databaseStorageEstimate.limitText}</div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['อุปกรณ์', databaseStorageEstimate.itemCount],
                  ['ประวัติ', databaseStorageEstimate.historyCount],
                  ['รูปหลักฐาน', databaseStorageEstimate.proofImageCount],
                  ['ของเลยกำหนด', overdueItems.length],
                  ['ชำรุด/ส่งซ่อม', items.filter(i => i.status === 'maintenance' && !i.isDeleted).length],
                  ['ยังไม่ติด QR', items.filter(i => !i.qrTagged && !i.isDeleted).length],
                  ['กล่องเก็บของ', databaseStorageEstimate.boxCount],
                  ['รายการเตรียมของ', databaseStorageEstimate.prepCount]
                ].map(([label,value]) => <div key={label} className={`p-4 rounded-2xl border ${theme.btnSecondary}`}><div className={`text-xs font-bold ${theme.textMuted}`}>{label}</div><div className={`text-2xl font-black ${theme.textTitle}`}>{Number(value || 0).toLocaleString('th-TH')}</div></div>)}
              </div>
              <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-pink-900/20 border-pink-800' : 'bg-pink-50 border-pink-200'}`}>
                <div className={`font-black mb-2 ${theme.textTitle}`}>โหมดประหยัดพื้นที่หลักฐาน</div>
                <div className={`text-sm font-bold ${theme.textMuted}`}>เป้าหมาย {activeProofSettings.targetKB} KB/รูป • เตือนเมื่อเกิน {activeProofSettings.warnKB} KB • ไม่ให้บันทึกถ้าเกิน {activeProofSettings.maxKB} KB • ประมาณว่ายังเพิ่มได้ {proofStorageForecast.remainingByAvg.toLocaleString('th-TH')} รูปก่อนถึงโซนปลอดภัย 800MB</div>
              </div>
            </div>
            <div className={`p-4 border-t ${theme.divide}`}><button type="button" onClick={() => setShowSystemHealthModal(false)} className={`w-full py-4 rounded-xl font-black ${theme.btnCancel}`}>ปิดหน้าต่าง</button></div>
          </div>
        </div>
      )}

      {/* รายงานประจำเดือน */}
      {showMonthlyReportModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] ${theme.cardBg}`}>
            <div className={`p-6 border-b flex justify-between items-start gap-4 ${theme.divide}`}>
              <div><h3 className={`text-2xl font-black ${theme.textTitle}`}>รายงานประจำเดือน</h3><p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>สรุปการใช้งานอุปกรณ์จากประวัติในSystem</p></div>
              <button type="button" onClick={() => setShowMonthlyReportModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
                <label className={`font-black ${theme.textTitle}`}>เลือกเดือน</label>
                <input type="month" className={`px-4 py-3 rounded-xl border font-bold ${theme.input}`} value={monthlyReportMonth} onChange={e => setMonthlyReportMonth(e.target.value)} />
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  ['ยืม', monthlyReportData.borrow, 'bg-purple-100 text-purple-700'],
                  ['ออกงาน', monthlyReportData.event, 'bg-orange-100 text-orange-700'],
                  ['รับคืน', monthlyReportData.return, 'bg-emerald-100 text-emerald-700'],
                  ['แจ้งซ่อม', monthlyReportData.repairs, 'bg-rose-100 text-rose-700'],
                  ['ประวัติรวม', monthlyReportData.total, 'bg-slate-100 text-slate-700'],
                  ['รูปหลักฐาน', monthlyReportData.proofs, 'bg-pink-100 text-pink-700'],
                  ['เลยกำหนดตอนนี้', monthlyReportData.overdueNow, 'bg-red-100 text-red-700'],
                  ['ชำรุดตอนนี้', monthlyReportData.maintenanceNow, 'bg-amber-100 text-amber-700']
                ].map(([label,value,tone]) => <div key={label} className={`p-4 rounded-2xl border ${tone}`}><div className="text-xs font-bold opacity-80">{label}</div><div className="text-3xl font-black">{Number(value || 0).toLocaleString('th-TH')}</div></div>)}
              </div>
              <div className={`p-5 rounded-2xl border ${theme.cardBg}`}>
                <h4 className={`font-black text-lg mb-3 ${theme.textTitle}`}>อุปกรณ์ที่ถูกใช้งานบ่อยในเดือนนี้</h4>
                {monthlyReportData.topUsed.length === 0 ? <div className={`font-bold ${theme.textMuted}`}>ยังไม่มีรายการในเดือนนี้</div> : monthlyReportData.topUsed.map((row, idx) => <div key={row.item.id} className={`flex justify-between gap-3 py-2 border-b ${theme.divide}`}><div className="font-bold">{idx + 1}. {row.item.name} <span className={`text-xs ${theme.textMuted}`}>S.N. {row.item.sn || '-'}</span></div><div className="font-black">{row.count} ครั้ง</div></div>)}
              </div>
            </div>
            <div className={`p-4 border-t ${theme.divide}`}><button type="button" onClick={() => setShowMonthlyReportModal(false)} className={`w-full py-4 rounded-xl font-black ${theme.btnCancel}`}>ปิดหน้าต่าง</button></div>
          </div>
        </div>
      )}


      {/* เอกสารย้อนหลัง / Borrow Documents Archive */}
      {showBorrowDocsModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[90vh] ${theme.cardBg}`}>
            <div className={`p-5 sm:p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${theme.divide}`}>
              <div className="min-w-0">
                <div className="text-xs font-black tracking-[0.18em] uppercase text-blue-500">Documents Archive</div>
                <h3 className={`text-2xl sm:text-3xl font-black mt-1 ${theme.textTitle}`}>เอกสารย้อนหลัง</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>รวมใบยืมและใบนำอุปกรณ์ออกงานที่ระบบบันทึกไว้ สามารถค้นหา กรองสถานะ และพิมพ์ซ้ำได้</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <button type="button" onClick={() => { setBorrowDocSearch(''); setBorrowDocFilter('all'); }} className={`px-4 py-3 rounded-2xl text-sm font-black border ${theme.btnSecondary}`}>ล้างตัวกรอง</button>
                <button type="button" onClick={() => setShowBorrowDocsModal(false)} className={`p-3 rounded-2xl border ${theme.btnSecondary}`}><Icons.X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-5 sm:p-6 border-b border-slate-200/60 dark:border-slate-800/80 grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                ['เอกสารทั้งหมด', borrowDocuments.length, 'bg-blue-500/10 text-blue-600 border-blue-500/20'],
                ['รอคืน', borrowDocuments.filter(d => !d.status || d.status === 'active').length, 'bg-amber-500/10 text-amber-600 border-amber-500/20'],
                ['คืนบางส่วน', borrowDocuments.filter(d => d.status === 'partial').length, 'bg-purple-500/10 text-purple-600 border-purple-500/20'],
                ['ปิดเอกสารแล้ว', borrowDocuments.filter(d => d.status === 'closed').length, 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20']
              ].map(([label, value, tone]) => (
                <div key={label} className={`rounded-2xl border p-4 ${tone}`}>
                  <div className="text-xs font-black opacity-80">{label}</div>
                  <div className="text-2xl font-black mt-1">{Number(value || 0).toLocaleString('th-TH')}</div>
                </div>
              ))}
            </div>

            <div className={`p-5 sm:p-6 border-b grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 ${theme.divide}`}>
              <div className="relative">
                <Icons.Search className={`absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
                <input
                  type="text"
                  value={borrowDocSearch}
                  onChange={(e) => setBorrowDocSearch(e.target.value)}
                  placeholder="ค้นหาเลขที่เอกสาร / ผู้ยืม / เจ้าหน้าที่ / ชื่ออุปกรณ์ / S.N."
                  className={`w-full pl-12 pr-4 py-4 rounded-2xl border font-bold outline-none ${theme.input}`}
                />
              </div>
              <select value={borrowDocFilter} onChange={(e) => setBorrowDocFilter(e.target.value)} className={`px-4 py-4 rounded-2xl border font-black outline-none ${theme.input}`}>
                <option value="all">ทั้งหมด</option>
                <option value="borrow">เฉพาะใบยืม</option>
                <option value="event">เฉพาะใบออกงาน</option>
                <option value="active">รอคืน</option>
                <option value="partial">คืนบางส่วน</option>
                <option value="closed">คืนครบแล้ว</option>
              </select>
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar p-5 sm:p-6 space-y-3">
              {filteredBorrowDocuments.length === 0 ? (
                <div className={`min-h-[280px] rounded-3xl border border-dashed flex flex-col items-center justify-center text-center p-8 ${isDarkMode ? 'border-slate-700 bg-slate-950' : 'border-slate-200 bg-slate-50'}`}>
                  <Icons.Printer className={`w-14 h-14 mb-4 ${theme.textMuted}`} />
                  <div className={`text-xl font-black ${theme.textTitle}`}>ไม่พบเอกสารย้อนหลัง</div>
                  <p className={`text-sm font-bold mt-2 max-w-md ${theme.textMuted}`}>ลองล้างตัวกรอง หรือสร้างใบยืม/ใบออกงานใหม่ ระบบจะบันทึกเอกสารไว้ในหน้านี้อัตโนมัติ</p>
                </div>
              ) : (
                filteredBorrowDocuments.map((docData) => {
                  const itemCount = Array.isArray(docData.items) ? docData.items.length : (Array.isArray(docData.itemIds) ? docData.itemIds.length : 0);
                  const returnedCount = Array.isArray(docData.returnedItemIds) ? docData.returnedItemIds.length : 0;
                  const status = docData.status || 'active';
                  const typeLabel = docData.type === 'event' ? 'ออกงาน' : 'ยืม';
                  const title = docData.title || (docData.type === 'event' ? 'ใบนำอุปกรณ์ออกงาน' : 'ใบยืมอุปกรณ์');
                  const statusLabel = docData.statusLabel || (status === 'closed' ? 'คืนครบแล้ว' : status === 'partial' ? 'คืนบางส่วน' : 'รอคืน');
                  const statusTone = status === 'closed'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'
                    : status === 'partial'
                      ? 'bg-purple-500/10 text-purple-600 border-purple-500/20'
                      : 'bg-amber-500/10 text-amber-600 border-amber-500/20';
                  const docDate = docData.date || docData.createdAt || docData.updatedAt;
                  const dateText = docDate ? new Date(docDate).toLocaleString('th-TH', { hour12: false }) : '-';
                  const previewItems = (docData.items || []).slice(0, 3);
                  return (
                    <div key={docData.id || docData.ref} className={`rounded-3xl border p-4 sm:p-5 transition-all hover:-translate-y-0.5 hover:shadow-xl ${isDarkMode ? 'bg-slate-950 border-slate-800 hover:border-blue-900' : 'bg-white border-slate-200 hover:border-blue-200'}`}>
                      <div className="flex flex-col xl:flex-row xl:items-start justify-between gap-4">
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className={`px-3 py-1 rounded-xl border text-xs font-black ${docData.type === 'event' ? 'bg-orange-500/10 text-orange-600 border-orange-500/20' : 'bg-blue-500/10 text-blue-600 border-blue-500/20'}`}>{typeLabel}</span>
                            <span className={`px-3 py-1 rounded-xl border text-xs font-black ${statusTone}`}>{statusLabel}</span>
                            <span className={`px-3 py-1 rounded-xl border text-xs font-black ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>{itemCount} รายการ</span>
                          </div>
                          <div className={`text-lg sm:text-xl font-black truncate ${theme.textTitle}`}>{title}</div>
                          <div className={`text-sm font-black mt-1 ${theme.textMuted}`}>เลขที่: {docData.ref || docData.id || '-'} • วันที่: {dateText}</div>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4 text-sm">
                            <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                              <div className={`text-xs font-black ${theme.textMuted}`}>ผู้ยืม / ชื่องาน</div>
                              <div className={`font-black truncate ${theme.textTitle}`}>{docData.borrower || '-'}</div>
                            </div>
                            <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                              <div className={`text-xs font-black ${theme.textMuted}`}>เจ้าหน้าที่</div>
                              <div className={`font-black truncate ${theme.textTitle}`}>{docData.staffOut || docData.operatorName || '-'}</div>
                            </div>
                            <div className={`rounded-2xl p-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                              <div className={`text-xs font-black ${theme.textMuted}`}>คืนแล้ว</div>
                              <div className={`font-black truncate ${theme.textTitle}`}>{returnedCount.toLocaleString('th-TH')} / {itemCount.toLocaleString('th-TH')} รายการ</div>
                            </div>
                          </div>
                          {previewItems.length > 0 && (
                            <div className={`mt-4 text-xs font-bold ${theme.textMuted}`}>
                              รายการ: {previewItems.map(i => i.name || i.id || '-').join(', ')}{itemCount > previewItems.length ? ` และอีก ${itemCount - previewItems.length} รายการ` : ''}
                            </div>
                          )}
                          {docData.note && <div className={`mt-3 text-xs font-bold rounded-2xl px-3 py-2 ${isDarkMode ? 'bg-amber-950/20 text-amber-300' : 'bg-amber-50 text-amber-700'}`}>หมายเหตุ: {docData.note}</div>}
                        </div>
                        <div className="flex xl:flex-col gap-2 shrink-0">
                          <button type="button" onClick={() => openBorrowDocumentPrint(docData)} className="px-4 py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-2">
                            <Icons.Printer className="w-5 h-5" /> พิมพ์ซ้ำ
                          </button>
                          <button type="button" onClick={() => { setTrackingTab('today'); setShowTrackingCenterModal(true); }} className={`px-4 py-3 rounded-2xl border font-black transition-all ${theme.btnSecondary}`}>
                            ศูนย์ติดตาม
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className={`p-4 border-t flex flex-col sm:flex-row justify-between items-center gap-3 ${theme.divide}`}>
              <div className={`text-sm font-bold ${theme.textMuted}`}>กำลังแสดง {filteredBorrowDocuments.length.toLocaleString('th-TH')} จาก {borrowDocuments.length.toLocaleString('th-TH')} เอกสาร</div>
              <button type="button" onClick={() => setShowBorrowDocsModal(false)} className={`w-full sm:w-auto px-6 py-3 rounded-2xl font-black ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* FactoryStock Mobile Bottom Nav */}
      {activeWorkspace !== 'qrWorkbench' && (
      <div className={`lg:hidden fixed bottom-0 inset-x-0 z-40 border-t shadow-[0_-16px_40px_rgba(15,23,42,0.14)] ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200'}`}>
        <div className="grid grid-cols-5 gap-1 px-1.5 pt-2 pb-[calc(env(safe-area-inset-bottom)+0.5rem)]">
          <button type="button" onClick={() => openWorkspace('overview')} className={`py-2 rounded-2xl text-[11px] font-black flex flex-col items-center gap-1 ${activeWorkspace === 'overview' ? 'bg-blue-600 text-white' : theme.textMuted}`}>
            <Icons.Package className="w-5 h-5" />หน้าหลัก
          </button>
          <button type="button" onClick={() => openWorkspace('borrowReturn')} className={`py-2 rounded-2xl text-[11px] font-black flex flex-col items-center gap-1 ${activeWorkspace === 'borrowReturn' ? 'bg-purple-600 text-white' : theme.textMuted}`}>
            <Icons.UserPlus className="w-5 h-5" />ยืมคืน
          </button>
          {canUseOperationalTools ? (
            <button type="button" onClick={() => openSelectionScanner({ camera: true })} className="py-2 rounded-2xl text-[11px] font-black flex flex-col items-center gap-1 bg-slate-900 text-white shadow-md">
              <Icons.QrCode className="w-5 h-5" />สแกน
            </button>
          ) : (
            <button type="button" onClick={() => setShowFilterModal(true)} className={`py-2 rounded-2xl text-[11px] font-black flex flex-col items-center gap-1 ${theme.textMuted}`}>
              <Icons.Settings className="w-5 h-5" />กรอง
            </button>
          )}
          <button type="button" onClick={() => openWorkspace('projects')} className={`py-2 rounded-2xl text-[11px] font-black flex flex-col items-center gap-1 ${activeWorkspace === 'projects' ? 'bg-indigo-600 text-white' : theme.textMuted}`}>
            <Icons.Folder className="w-5 h-5" />โครงการ
          </button>
          <button type="button" onClick={openControlCenter} className={`py-2 rounded-2xl text-[11px] font-black flex flex-col items-center gap-1 ${theme.textMuted}`}>
            <Icons.ViewGrid className="w-5 h-5" />เมนู
          </button>
        </div>
      </div>
      )}

      {/* Toast แจ้งเตือนแบบไม่ขัดจังหวะ */}
      <div className="fixed top-4 right-4 z-[12000] space-y-3 w-[92vw] max-w-sm pointer-events-none">
        {toasts.map((toast) => {
          const tone = toast.type === 'success' ? 'border-emerald-300 bg-emerald-50 text-emerald-800' : toast.type === 'error' ? 'border-rose-300 bg-rose-50 text-rose-800' : toast.type === 'warning' ? 'border-amber-300 bg-amber-50 text-amber-800' : 'border-blue-300 bg-blue-50 text-blue-800';
          return (
            <div key={toast.id} className={`pointer-events-auto rounded-2xl border p-4 shadow-xl ${tone}`}>
              <div className="font-black">{toast.title}</div>
              {toast.message && <div className="text-sm font-bold mt-1 opacity-90 whitespace-pre-line">{toast.message}</div>}
            </div>
          );
        })}
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className={`fixed inset-0 ${theme.modalOverlay} flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-8 max-w-sm w-full shadow-2xl ${theme.cardBg}`}>
            <h3 className={`text-2xl font-black mb-2 text-center ${theme.textTitle}`}>เข้าสู่Systemจัดการ</h3>
            <p className={`text-sm font-bold text-center mb-6 ${theme.textMuted}`}>ใช้บัญชีพนักงาน หรือบัญชีกลาง admin</p>
            <div className="space-y-4 mb-6">
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${theme.textMuted}`}>Username</label>
                <input type="text" autoFocus className={`w-full px-4 py-3 border rounded-xl font-bold outline-none text-lg ${theme.input}`} placeholder="เช่น admin" value={loginUsername} onChange={e => setLoginUsername(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }} />
              </div>
              <div>
                <label className={`block text-sm font-bold mb-1.5 ${theme.textMuted}`}>PIN / รหัสผ่าน</label>
                <input type="password" className={`w-full px-4 py-4 border rounded-xl font-bold text-center text-3xl tracking-widest outline-none ${theme.input}`} value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }} />
              </div>
              <div className={`p-3 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-900 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                ค่าเริ่มต้น: username <span className="font-black">admin</span> ใช้ PIN เดิมของSystem จากนั้นไปที่ ตั้งค่า → บัญชีผู้ใช้ เพื่อเพิ่มบัญชีพนักงาน
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowLogin(false)} className={`w-full sm:flex-1 py-4 font-bold rounded-xl text-base sm:text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleLogin} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl text-lg hover:bg-blue-500">เข้าสู่System</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function TodayPanel({ title, color, items, empty, isDarkMode, theme }) {
  const palette = { amber: isDarkMode ? 'bg-amber-900/20 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-200 text-amber-800', rose: isDarkMode ? 'bg-rose-900/20 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-800', purple: isDarkMode ? 'bg-purple-900/20 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-200 text-purple-800' };
  const proofCountOf = (item) => (Array.isArray(item?.history) ? item.history : []).reduce((sum, h) => sum + (Array.isArray(h.proofs) ? h.proofs.length : 0), 0);
  return (<div className={`rounded-2xl border p-4 flex flex-col min-h-[300px] ${palette[color] || palette.purple}`}><h4 className="text-xl font-black mb-3 flex justify-between items-center"><span>{title}</span><span className="text-sm px-2 py-1 rounded-lg bg-white/40">{items.length}</span></h4><div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">{items.length === 0 ? (<div className={`h-full flex items-center justify-center text-center font-bold ${theme.textMuted}`}>{empty}</div>) : items.map(item => { const pc = proofCountOf(item); return (<div key={item.id} className={`p-3 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}><div className="font-black truncate">{item.name}</div><div className="text-xs font-bold opacity-80 mt-1">{item.status === 'out-for-event' ? 'งาน' : 'ผู้ยืม'}: {item.currentBorrower || item.currentEvent || '-'}</div><div className="text-xs font-bold opacity-80">กำหนดคืน: {item.expectedReturn ? new Date(item.expectedReturn).toLocaleDateString('th-TH') : '-'}</div>{pc > 0 && <div className="text-xs font-black mt-2 inline-block px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20">📷 หลักฐาน {pc} รูป</div>}{item.internalNote && <div className="text-xs font-bold mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">โน้ต: {item.internalNote}</div>}</div>);})}</div></div>);
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error.toString() };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-900 text-white p-8 flex flex-col items-center justify-center font-sans">
          <div className="bg-rose-900/30 border-l-4 border-rose-500 p-8 rounded-2xl max-w-2xl w-full">
            <h1 className="text-3xl font-black text-rose-400 mb-4">🚨 ขออภัย เกิดข้อผิดพลาดในSystem</h1>
            <p className="text-lg text-rose-200 mb-6">Systemพบข้อขัดข้องบางประการ กรุณารีเฟรชหน้าเว็บ หากปัญหายังคงอยู่ โปรดตรวจสอบโค้ดล่าสุด</p>
            <pre className="bg-black/50 p-4 rounded-xl text-sm font-mono overflow-auto text-rose-300 whitespace-pre-wrap">{this.state.errorMessage}</pre>
            <button onClick={() => window.location.reload()} className="mt-8 px-6 py-3 bg-rose-600 hover:bg-rose-500 rounded-xl font-bold transition-colors">รีเฟรชหน้าเว็บ</button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
