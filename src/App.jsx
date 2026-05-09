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

const ADMIN_PIN = 'mdec8203';
const INACTIVITY_LOGOUT_MS = 2 * 60 * 60 * 1000; // ออกจากระบบอัตโนมัติเมื่อไม่ใช้งาน 2 ชั่วโมง
const WEAK_PIN_LIST = ['0000','1111','2222','3333','4444','5555','6666','7777','8888','9999','1234','12345','123456','654321','4321','1122','1212','999999'];
const APP_VERSION = 'v22.27 Mobile & Settings Cleanup';
const APP_UPDATE_NOTE = 'เก็บงานมือถือให้ใช้ง่ายขึ้น ซ่อนตัวกรองยาวไว้ในแผงมือถือ และปรับหน้าตั้งค่าให้ใช้ Select บนมือถือแทนเมนูยาว';
// วางไฟล์โลโก้ศูนย์ไว้ที่ public/mdec-logo.png ถ้าไม่มีไฟล์ ระบบจะ fallback เป็นไอคอนกล่องเดิม
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
  { id: 'available', label: 'พร้อมใช้งาน', color: 'bg-emerald-100 text-emerald-700 border-emerald-200', darkColor: 'bg-emerald-900/40 text-emerald-400 border-emerald-800' },
  { id: 'in-use', label: 'กำลังใช้งาน', color: 'bg-amber-100 text-amber-700 border-amber-200', darkColor: 'bg-amber-900/40 text-amber-400 border-amber-800' },
  { id: 'borrowed', label: 'ถูกยืม', color: 'bg-purple-100 text-purple-700 border-purple-200', darkColor: 'bg-purple-900/40 text-purple-400 border-purple-800' },
  { id: 'out-for-event', label: 'ออกงาน', color: 'bg-orange-100 text-orange-700 border-orange-200', darkColor: 'bg-orange-900/40 text-orange-400 border-orange-800' },
  { id: 'maintenance', label: 'ส่งซ่อม/ชำรุด', color: 'bg-rose-100 text-rose-700 border-rose-200', darkColor: 'bg-rose-900/40 text-rose-400 border-rose-800' }
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
  const [showPersonalItemsModal, setShowPersonalItemsModal] = useState(false);
  const [showProjectsModal, setShowProjectsModal] = useState(false);
  const [quickProjectName, setQuickProjectName] = useState('');
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
  const isFullMode = uiMode === 'full';
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
  const [boxLabelTitle, setBoxLabelTitle] = useState('กล่องอุปกรณ์ MDEC');
  const [boxLabelNote, setBoxLabelNote] = useState('');
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState({ text: '', type: '' });
  const [scanMode, setScanMode] = useState('select'); // select | borrowChecklist | eventChecklist | returnChecklist
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
    mainBg: isDarkMode ? 'bg-slate-950 bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.20),_transparent_34%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_28%)]' : 'bg-slate-100 bg-[radial-gradient(circle_at_top_left,_rgba(59,130,246,0.16),_transparent_30%),radial-gradient(circle_at_top_right,_rgba(14,165,233,0.12),_transparent_30%)]',
    textMain: isDarkMode ? 'text-slate-100' : 'text-slate-800',
    textTitle: isDarkMode ? 'text-white' : 'text-slate-900',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDarkMode ? 'bg-slate-900/90 border-slate-700/80 shadow-black/20' : 'bg-white/95 border-slate-200/80 shadow-slate-200/60',
    input: isDarkMode ? 'bg-slate-950/80 border-slate-700 text-white focus:ring-blue-500 focus:border-blue-500' : 'bg-white border-slate-200 text-slate-700 focus:ring-blue-500 focus:border-blue-500',
    th: isDarkMode ? 'bg-slate-950/80 border-slate-700 text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-600',
    trHover: isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50',
    divide: isDarkMode ? 'divide-slate-700' : 'divide-slate-100',
    btnSecondary: isDarkMode ? 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 border-slate-700 hover:border-slate-600' : 'bg-white text-slate-600 hover:bg-slate-50 border-slate-200 hover:border-blue-200',
    btnCancel: isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700 border border-slate-700' : 'bg-slate-50 text-slate-700 hover:bg-white border border-slate-200',
    modalOverlay: isDarkMode ? 'bg-black/70' : 'bg-slate-900/40',
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
  const panelPaddingClass = isCompactUi ? 'p-4 sm:p-5' : 'p-5 sm:p-6';
  const controlPaddingClass = isCompactUi ? 'py-3' : 'py-4';
  const rowTextSizeClass = isCompactUi ? 'text-base' : 'text-lg';
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
        <p className={`text-xs font-bold mb-3 ${theme.textMuted}`}>เลือกไฟล์รูป หรือถ่ายด้วยกล้องมือถือ ระบบจะย่อไฟล์ ประทับเวลา และพิกัด GPS ลงบนรูปถ้าอนุญาตตำแหน่ง แล้วเก็บไว้ใน Firestore โดยไม่ใช้ Firebase Storage • เป้าหมายประมาณ {activeProofSettings.targetKB} KB/รูป • สูงสุด {activeProofSettings.maxImagesPerAction} รูป/ครั้ง</p>
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
      <div className={`mt-4 p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-950/35 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
    const ok = window.confirm(`คุณกำลังลบรูปหลักฐานนี้\n\nรูปนี้เกี่ยวข้องกับ ${linkedItems} อุปกรณ์/รายการ\nเมื่อลบแล้ว รูปจะหายจากประวัติทั้งหมดที่เกี่ยวข้อง และไม่สามารถกู้คืนจากระบบได้\n\nต้องการลบต่อหรือไม่?`);
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
    if (!user || !currentOperator) return alert('❌ กรุณาเข้าสู่ระบบก่อน');
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

  const todayMs = new Date().setHours(0,0,0,0);

  const projectOptions = useMemo(() => {
    const fromSettings = Array.isArray(settingsOptions.projects) ? settingsOptions.projects : [];
    const fromItems = items.map(i => String(i.project || '').trim()).filter(Boolean);
    const merged = [...new Set([...fromSettings, ...fromItems])].filter(Boolean);
    const withoutOther = merged.filter(p => p !== 'อื่นๆ');
    const base = withoutOther.length ? withoutOther : ['ไม่ระบุโครงการ'];
    return [...new Set([...base, 'อื่นๆ'])];
  }, [settingsOptions.projects, items]);

  const getAssetStatusInfo = (id) => ASSET_STATUSES.find(s => s.id === (id || 'active')) || ASSET_STATUSES[0];

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
    const missingInfo = !String(item.sn || '').trim() || !String(item.category || '').trim() || !String(item.location || '').trim();
    return isLate || item.status === 'maintenance' || !item.qrTagged || missingInfo;
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
      const matchProject = filterProject === 'all' || String(item.project || '') === String(filterProject);
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

  const projectStats = useMemo(() => {
    const map = {};
    items.filter(item => item && !item.isDeleted).forEach((item) => {
      const projectName = String(item.project || 'ไม่ระบุโครงการ').trim() || 'ไม่ระบุโครงการ';
      if (!map[projectName]) {
        map[projectName] = { name: projectName, total: 0, active: 0, disposed: 0, lost: 0, pending_disposal: 0, items: [] };
      }
      const assetStatus = item.assetStatus || 'active';
      map[projectName].total += 1;
      map[projectName][assetStatus] = (map[projectName][assetStatus] || 0) + 1;
      map[projectName].items.push(item);
    });
    return Object.values(map).sort((a, b) => String(a.name).localeCompare(String(b.name), 'th', { numeric: true }));
  }, [items]);

  const handleAddProjectQuick = async () => {
    const name = String(quickProjectName || '').trim();
    if (!name) {
      pushToast('กรุณาพิมพ์ชื่อโครงการก่อน', 'warning');
      return;
    }
    if (!canAddEditItems && !canManageSystem) {
      alert('บัญชีนี้ไม่มีสิทธิ์เพิ่มโครงการ');
      return;
    }
    try {
      const currentProjects = Array.isArray(settingsOptions.projects) ? settingsOptions.projects : [];
      const normalized = currentProjects.filter(p => p && p !== 'อื่นๆ');
      if (normalized.some(p => String(p).trim() === name)) {
        pushToast('มีชื่อโครงการนี้อยู่แล้ว', 'warning');
        setFilterProject(name);
        return;
      }
      const updatedProjects = [...new Set([...normalized, name, 'อื่นๆ'])];
      const updatedSettings = { ...settingsOptions, projects: updatedProjects };
      setSettingsOptions(updatedSettings);
      await setDoc(getSettingsDoc(), updatedSettings, { merge: true });
      setQuickProjectName('');
      setFilterProject(name);
      await logAction('เพิ่มโครงการ', name, 'เพิ่มชื่อโครงการจากหน้าโครงการ');
      pushToast('เพิ่มโครงการเรียบร้อยแล้ว', 'success');
    } catch (error) {
      console.error(error);
      alert('❌ เพิ่มโครงการไม่สำเร็จ: ' + error.message);
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
โครงการ: ${item.project || '-'}
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

  const settingsNavItems = [
    { id: 'categories', label: 'หมวดหมู่', desc: 'รายการหมวดอุปกรณ์', icon: Icons.Tag, group: 'ข้อมูลพื้นฐาน' },
    { id: 'locations', label: 'สถานที่ / ห้อง', desc: 'ที่เก็บและห้องประชุม', icon: Icons.Folder, group: 'ข้อมูลพื้นฐาน' },
    { id: 'staff', label: 'เจ้าหน้าที่', desc: 'รายชื่อผู้ทำรายการ', icon: Icons.Users, group: 'ข้อมูลพื้นฐาน' },
    { id: 'accounts', label: 'บัญชีผู้ใช้', desc: 'ล็อกอินและสิทธิ์', icon: Icons.UserPlus, group: 'ผู้ใช้งาน' },
    { id: 'display', label: 'การแสดงผล', desc: 'ความแน่น / การ์ด / เอฟเฟกต์', icon: Icons.Monitor, group: 'หน้าตาเว็บ' },
    { id: 'documents', label: 'เอกสาร / โลโก้', desc: 'ใบยืม ฉลาก QR และโลโก้', icon: Icons.Printer, group: 'เอกสาร' },
    { id: 'proofs', label: 'หลักฐานรูปภาพ', desc: 'กติกาการแนบรูป', icon: Icons.Camera, group: 'หลักฐาน' },
    { id: 'database', label: 'ฐานข้อมูล / สำรอง', desc: 'Backup, Restore, Cleanup', icon: Icons.Database, group: 'ระบบ' },
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
      alert('❌ กรุณากรอก "ชื่ออุปกรณ์" และ "รหัส S.N." ให้ครบถ้วน (ระบบบังคับใส่รหัสซีเรียล)');
      return;
    }

    const isDuplicate = items.some(item => item.sn && String(item.sn).trim().toLowerCase() === snInput.toLowerCase() && item.id !== formData.id);
    if (isDuplicate) {
      alert(`❌ ไม่สามารถบันทึกได้: รหัส S.N. "${snInput}" มีซ้ำอยู่ในระบบแล้ว กรุณาตรวจสอบอีกครั้ง`);
      return; 
    }

    try {
      let currentSettings = { ...settingsOptions };
      let settingsChanged = false;

      let finalCategory = formData.category || 'อื่นๆ';
      if (formData.category === 'อื่นๆ' && (formData.newCategory || '').trim()) {
        finalCategory = formData.newCategory.trim();
        currentSettings.categories = [...new Set([...(currentSettings.categories || []).filter(c => c !== 'อื่นๆ'), finalCategory, 'อื่นๆ'])];
        settingsChanged = true;
      }

      let finalLocation = formData.location || 'อื่นๆ';
      if (formData.location === 'อื่นๆ' && (formData.newLocation || '').trim()) {
        finalLocation = formData.newLocation.trim();
        currentSettings.locations = [...new Set([...(currentSettings.locations || []).filter(c => c !== 'อื่นๆ'), finalLocation, 'อื่นๆ'])];
        settingsChanged = true;
      }

      let finalProject = formData.project || '';
      if (formData.project === 'อื่นๆ' && (formData.newProject || '').trim()) {
        finalProject = formData.newProject.trim();
        currentSettings.projects = [...new Set([...(currentSettings.projects || []).filter(c => c !== 'อื่นๆ'), finalProject, 'อื่นๆ'])];
        settingsChanged = true;
      }
      if (finalProject && finalProject !== 'อื่นๆ') {
        currentSettings.projects = [...new Set([...(currentSettings.projects || []).filter(c => c !== 'อื่นๆ'), finalProject, 'อื่นๆ'])];
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
            fromProject: oldItem?.project || 'ไม่ระบุโครงการ',
            toProject: finalProject || 'ไม่ระบุโครงการ',
            staff: currentOperator?.name || 'Admin',
            note: 'เปลี่ยนโครงการแบบง่ายจากหน้าแก้ไขอุปกรณ์'
          });
          itemData.history = history;
        }
        await setDoc(getItemDoc(formData.id), itemData, { merge: true });
        logAction(projectChanged ? 'เปลี่ยนโครงการอุปกรณ์' : 'แก้ไขข้อมูล', itemData.name, projectChanged ? `ย้ายจาก ${oldItem?.project || 'ไม่ระบุโครงการ'} → ${finalProject || 'ไม่ระบุโครงการ'}` : `แก้ไขรายละเอียดอุปกรณ์ S.N.: ${itemData.sn || '-'}`);
      } else {
        const newId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await setDoc(getItemDoc(newId), { ...itemData, createdBy: currentOperator?.name || 'Admin', history: [] });
        logAction('เพิ่มอุปกรณ์', itemData.name, `เพิ่มเข้าสู่ระบบใหม่ หมวดหมู่: ${itemData.category}`);
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
    } catch (err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const handleOpenRowEvent = (e, item) => {
    e.stopPropagation();
    try {
      setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' }); 
      setEventProofFiles([]);
      setEventTargetIds([item.id]);
      setEventChecklist([]);
    } catch (err) { alert("ระบบขัดข้อง: " + err.message); }
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
      const newHistoryEntry = { type: 'borrow', date: new Date().toISOString(), borrower: borrowData.borrower, expectedReturn: borrowData.returnDate, staffOut: finalStaff, note: borrowData.note, proofs: uploadedProofs, operatorId: currentOperator?.id || null, operatorName: currentOperator?.name || finalStaff || 'Admin' };
      const promises = packingChecklist.map(id => {
        const item = items.find(i => i.id === id);
        if (!item || item.status !== 'available') return Promise.resolve(); 
        borrowedNames.push(item.name);
        const newHistory = [...(item.history || []), newHistoryEntry];
        return setDoc(getItemDoc(id), { status: 'borrowed', currentBorrower: borrowData.borrower, expectedReturn: borrowData.returnDate, currentNote: borrowData.note, history: newHistory }, { merge: true });
      });
      await Promise.all(promises);
      
      logAction('ให้ยืมอุปกรณ์', `ทำรายการ ${packingChecklist.length} ชิ้น`, `ยืมโดย: ${borrowData.borrower} (จนท.ผู้ให้ยืม: ${finalStaff})\nรายการ: ${borrowedNames.join(', ')}`);
      setPrintSlipData({
        type: 'borrow',
        title: 'ใบยืมอุปกรณ์',
        ref: makeDocumentRef('BR'),
        date: new Date().toISOString(),
        borrower: borrowData.borrower,
        staffOut: finalStaff,
        expectedReturn: borrowData.returnDate,
        note: borrowData.note,
        items: packingChecklist.map(id => items.find(i => i.id === id)).filter(Boolean).map(i => ({ id: i.id, name: i.name, sn: i.sn, category: i.category, internalNote: i.internalNote }))
      });
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
      const newHistoryEntry = { type: 'event', date: new Date().toISOString(), eventName: eventData.eventName, expectedReturn: eventData.returnDate, staffOut: finalStaff, note: eventData.note, proofs: uploadedProofs, operatorId: currentOperator?.id || null, operatorName: currentOperator?.name || finalStaff || 'Admin' };
      const promises = eventChecklist.map(id => {
        const item = items.find(i => i.id === id);
        if (!item || item.status !== 'available') return Promise.resolve(); 
        eventNames.push(item.name);
        const newHistory = [...(item.history || []), newHistoryEntry];
        return setDoc(getItemDoc(id), { status: 'out-for-event', currentEvent: eventData.eventName, expectedReturn: eventData.returnDate, currentNote: eventData.note, history: newHistory }, { merge: true });
      });
      await Promise.all(promises);
      
      logAction('นำออกงาน', `ทำรายการ ${eventChecklist.length} ชิ้น`, `ชื่องาน: ${eventData.eventName} (ผู้นำออก: ${finalStaff})\nรายการ: ${eventNames.join(', ')}`);
      setPrintSlipData({
        type: 'event',
        title: 'ใบนำอุปกรณ์ออกงาน',
        ref: makeDocumentRef('EV'),
        date: new Date().toISOString(),
        borrower: eventData.eventName,
        staffOut: finalStaff,
        expectedReturn: eventData.returnDate,
        note: eventData.note,
        items: eventChecklist.map(id => items.find(i => i.id === id)).filter(Boolean).map(i => ({ id: i.id, name: i.name, sn: i.sn, category: i.category, internalNote: i.internalNote }))
      });
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
        const proceed = confirm(`⚠️ อุปกรณ์ในเซ็ตไม่ครบ!\nมีอุปกรณ์พร้อมใช้งานเพียง ${availableIds.length} จาก ${(bundle.itemIds || []).length} ชิ้น\nคุณต้องการกดยืมชิ้นที่เหลือเท่าที่มีหรือไม่?`);
        if (!proceed) return;
      }
      
      setBorrowTargetIds([...availableIds]);
      setPackingChecklist([]);
      setBorrowData({ borrower: '', borrowDate: new Date().toISOString().split('T')[0], returnDate: '', staff: '', newStaff: '', note: '' });
      setBorrowProofFiles([]);
      setShowBundleModal(false);
    } catch(err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const handleSelectBundleToEvent = (bundle) => {
    try {
      const availableIds = (bundle.itemIds || []).filter(id => items.find(i => i.id === id)?.status === 'available');
      if (availableIds.length === 0) return alert('❌ ไม่สามารถนำออกงานได้: อุปกรณ์ในเซ็ตนี้ถูกใช้งานไปหมดแล้ว');
      
      if (availableIds.length < (bundle.itemIds || []).length) {
        const proceed = confirm(`⚠️ อุปกรณ์ในเซ็ตไม่ครบ!\nมีอุปกรณ์พร้อมใช้งานเพียง ${availableIds.length} จาก ${(bundle.itemIds || []).length} ชิ้น\nคุณต้องการกดนำออกชิ้นที่เหลือเท่าที่มีหรือไม่?`);
        if (!proceed) return;
      }
      
      setEventTargetIds([...availableIds]);
      setEventChecklist([]);
      setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' });
      setEventProofFiles([]);
      setShowBundleModal(false);
    } catch(err) { alert("ระบบขัดข้อง: " + err.message); }
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
    } catch(err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const openItemEditor = (item) => {
    if (!item) return;
    setFormData({ ...item, qrTagged: !!item.qrTagged, newCategory: '', newLocation: '', newProject: '', newOwner: item.owner || '', isPersonalItem: !!item.owner, assetStatus: item.assetStatus || 'active' });
    setShowForm(true);
  };

  const openSelectionScanner = ({ camera = false } = {}) => {
    setScanMode('select');
    setUseCamera(camera);
    setShowScanModal(true);
  };

  const openChecklistScanner = (mode) => {
    setScanMode(mode);
    setUseCamera(true);
    setShowScanModal(true);
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
      if (validIds.length === 0) return alert('❌ ไม่มีอุปกรณ์ที่พร้อมให้ยืมในรายการที่คุณเลือก\n(อุปกรณ์ต้องมีสถานะ "พร้อมใช้งาน")');
      setBorrowData({ borrower: '', borrowDate: new Date().toISOString().split('T')[0], returnDate: '', staff: '', newStaff: '', note: '' });
      
      setBorrowTargetIds([...validIds]);
      setPackingChecklist([]);
    } catch(err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const handleOpenBatchEvent = () => {
    try {
      const validIds = selectedItems.filter(id => items.find(i => i.id === id)?.status === 'available');
      if (validIds.length === 0) return alert('❌ ไม่มีอุปกรณ์ที่พร้อมออกงานในรายการที่คุณเลือก\n(อุปกรณ์ต้องมีสถานะ "พร้อมใช้งาน")');
      setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' });
      
      setEventTargetIds([...validIds]);
      setEventChecklist([]);
    } catch(err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const handleOpenBatchReturn = () => {
    try {
      const validIds = selectedItems.filter(id => {
        const st = items.find(i => i.id === id)?.status;
        return st === 'borrowed' || st === 'out-for-event';
      });
      if (validIds.length === 0) return alert('❌ ไม่มีอุปกรณ์ที่สามารถคืนได้ในรายการที่คุณเลือก\n(อุปกรณ์ต้องมีสถานะ "กำลังถูกยืม" หรือ "ออกงาน")');
      setReturnData({ staff: '', newStaff: '' });
      
      setReturnTargetIds([...validIds]);
      setReturnChecklist([]);
    } catch(err) { alert("ระบบขัดข้อง: " + err.message); }
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
        setSelectedItems(prev => prev.includes(foundItem.id) ? prev : [...prev, foundItem.id]);
        setScanMessage({ text: `✅ พบ "${foundItem.name}" เลือกไว้แล้ว`, type: 'success' });
        try { if (navigator?.vibrate) navigator.vibrate(90); } catch(e){}
        try { new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3').play(); } catch(e){}
      }
    } else {
      setScanMessage({ text: `❌ ไม่พบรหัส "${val}" ในระบบ`, type: 'error' });
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

  // 💡 กลับมาแล้ว: ระบบนำเข้าไฟล์ CSV
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
    if (rows.length === 0) alert('ℹ️ ดาวน์โหลดไฟล์แล้ว แต่ยังไม่มีประวัติยืม-คืนในระบบ');
  };

  const exportItemHistoryCSV = (item) => {
    if (!item) return;
    const headers = ['ชื่ออุปกรณ์', 'รหัส S.N.', 'ลำดับ', 'ประเภท', 'วันเวลาทำรายการ', 'ผู้ทำรายการในระบบ', 'ผู้ยืม/ชื่องาน', 'เจ้าหน้าที่ผู้ให้ยืม/ผู้นำออก', 'เจ้าหน้าที่ผู้รับคืน', 'กำหนดคืน', 'หมายเหตุ', 'จำนวนหลักฐาน', 'ลิงก์หลักฐาน'];
    const rows = (Array.isArray(item.history) ? item.history : []).map((h, index) => {
      const historyType = h.type === 'borrow' ? 'ยืมออก' : h.type === 'event' ? 'ออกงาน' : h.type === 'return' ? 'รับคืน' : (h.type || '-');
      return [item.name || '-', item.sn || '-', index + 1, historyType, formatBackupDateTime(h.date), h.operatorName || h.performedBy || '-', h.borrower || h.eventName || '-', h.staffOut || '-', h.staffIn || '-', h.expectedReturn || '-', h.note || '-', Array.isArray(h.proofs) ? h.proofs.length : 0, Array.isArray(h.proofs) ? h.proofs.map(p => p.storageType === 'firestore-doc-base64' ? (p.originalName || p.id || 'รูปในระบบ') : (p.url || p.id || '-')).join(' | ') : '-' ];
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
    const headers = ['รหัสเอกสารอุปกรณ์', 'ชื่ออุปกรณ์', 'รหัส S.N.', 'ฝ่าย', 'หมวดหมู่', 'สถานที่', 'โครงการ', 'สถานะพัสดุ', 'ลำดับประวัติ', 'ประเภทประวัติ', 'วันเวลาทำรายการ', 'ผู้ทำรายการในระบบ', 'ผู้ยืม/ชื่องาน', 'เจ้าหน้าที่ผู้ให้ยืม/ผู้นำออก', 'เจ้าหน้าที่ผู้รับคืน', 'กำหนดคืน', 'หมายเหตุ', 'จำนวนหลักฐาน', 'รหัส/ชื่อหลักฐาน', 'สถานะปัจจุบัน'];
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
          Array.isArray(h.proofs) ? h.proofs.map(p => p.proofDocId || p.id || p.originalName || 'รูปในระบบ').join(' | ') : '-',
          getBackupStatusLabel(item.status)
        ]);
      });
    });
    return { headers, rows };
  };

  const buildProjectsCsvRows = () => {
    const headers = ['โครงการ', 'อุปกรณ์ทั้งหมด', 'ใช้งานอยู่', 'จำหน่ายแล้ว', 'สูญหาย', 'ชำรุดรอจำหน่าย', 'รายการอุปกรณ์'];
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
  <div><b>${items.length.toLocaleString('th-TH')}</b>อุปกรณ์ในระบบ</div>
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
      await logAction('สำรองข้อมูลทั้งหมด JSON', 'สำรอง ' + items.length + ' อุปกรณ์ / ' + collected.historyCount + ' ประวัติ', 'ดาวน์โหลดข้อมูลทั้งระบบเป็นไฟล์ JSON รวมประวัติยืม-คืนและรูปหลักฐาน');
      await saveBackupTimestamp('fullJson');
      alert('✅ สำรองข้อมูลทั้งหมดเรียบร้อยแล้ว! ไฟล์ JSON นี้ใช้สำหรับกู้คืนระบบ และมีรูปหลักฐานที่เก็บในระบบรวมอยู่ด้วย');
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
        '1) JSON สำหรับกู้คืนระบบ\\n' +
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
          'ระบบจะไม่ลบอุปกรณ์ที่ไม่ได้อยู่ในไฟล์สำรอง เพื่อความปลอดภัย\n\n' +
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
        alert('✅ กู้คืนข้อมูลจาก JSON เรียบร้อยแล้ว ' + restoredCount + ' รายการ และรูปหลักฐาน ' + restoredProofCount + ' รูป\nระบบไม่ได้ลบอุปกรณ์ที่ไม่มีในไฟล์สำรอง');
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
      'ระบบจะล้างเฉพาะ history ของอุปกรณ์ทุกชิ้น\n' +
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
      logAction('เข้าสู่ระบบ', safeAccount.name, `เข้าสู่ระบบด้วยบัญชี ${safeAccount.username}`);
    } else {
      alert('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
      setPin('');
    }
  };

  const handleLogout = () => {
    const logoutName = currentOperator?.name || 'Admin';
    logAction('ออกจากระบบ', logoutName, 'ออกจากระบบจัดการ');
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
        alert('⏱️ ระบบออกจากระบบอัตโนมัติ เพราะไม่มีการใช้งานนานเกิน 2 ชั่วโมง');
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
    if (availableIds.length === 0) return alert('❌ ยังนำออกงานไม่ได้ เพราะอุปกรณ์ในรายการนี้ไม่มีชิ้นที่พร้อมใช้งาน');
    if (unavailableItems.length > 0) {
      const proceed = confirm(`⚠️ มีอุปกรณ์บางชิ้นไม่พร้อมใช้งาน ${unavailableItems.length} รายการ\n\n${unavailableItems.map((item) => '- ' + item.name).slice(0, 8).join('\n')}\n\nต้องการนำออกเฉพาะชิ้นที่พร้อมใช้งานหรือไม่?`);
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
    const ok = confirm('ลบรายการเตรียมของ "' + (prep.name || '-') + '" ออกจากระบบหรือไม่?\n\nการลบนี้ไม่กระทบสถานะอุปกรณ์');
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
    const ok = confirm('ลบข้อมูลกล่อง "' + (box.name || '-') + '" หรือไม่?\n\nระบบจะนำชื่อกล่องออกจากอุปกรณ์ในกล่องนี้ แต่จะไม่ลบรายการอุปกรณ์');
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
        outerStyle: { width: '90mm', minHeight: '56mm' },
        title: 'text-[20px] print:text-[16pt]',
        meta: 'text-[11px] print:text-[8pt]',
        itemText: 'text-[12px] print:text-[8pt]',
        gridClass: 'grid-cols-1',
        maxPreviewHeight: 'max-h-[175px]',
        bodyPadding: 'p-3 print:p-2',
      },
      normal: {
        label: 'ปกติ',
        desc: 'กล่องอุปกรณ์ทั่วไป',
        outerStyle: { width: '125mm', minHeight: '78mm' },
        title: 'text-[28px] print:text-[21pt]',
        meta: 'text-[12px] print:text-[9pt]',
        itemText: 'text-[14px] print:text-[9.5pt]',
        gridClass: 'grid-cols-1 sm:grid-cols-2',
        maxPreviewHeight: 'max-h-[265px]',
        bodyPadding: 'p-4 print:p-3',
      },
      large: {
        label: 'ใหญ่',
        desc: 'กล่องใหญ่ / ลังเก็บของ',
        outerStyle: { width: '170mm', minHeight: '108mm' },
        title: 'text-[36px] print:text-[28pt]',
        meta: 'text-[14px] print:text-[10pt]',
        itemText: 'text-[16px] print:text-[11pt]',
        gridClass: 'grid-cols-1 sm:grid-cols-2',
        maxPreviewHeight: 'max-h-[390px]',
        bodyPadding: 'p-5 print:p-4',
      }
    };
    const boxPreset = boxLabelSizePresets[boxLabelSize] || boxLabelSizePresets.normal;
    const groupedByCategory = selectedLabelItems.reduce((acc, item) => {
      const key = item.category || 'ไม่ระบุหมวดหมู่';
      if (!acc[key]) acc[key] = [];
      acc[key].push(item);
      return acc;
    }, {});

    return (
      <div className="bg-slate-100 min-h-screen font-sans text-black print:bg-white">
        <style>{`
          @media print {
            @page { size: A4; margin: 9mm; }
            body { background: white !important; }
            * { -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
            .box-label-toolbar { display: none !important; }
            .box-label-page { padding: 0 !important; }
            .box-storage-label { box-shadow: none !important; break-inside: avoid; page-break-inside: avoid; }
          }
        `}</style>

        <div className="box-label-toolbar print:hidden p-4 bg-slate-800 text-white flex flex-col xl:flex-row justify-between items-center fixed top-0 w-full z-50 shadow-md gap-3">
          <div>
            <h2 className="font-bold text-xl flex items-center gap-2">
              <Icons.Folder className="w-6 h-6" /> โหมดพิมพ์ฉลากกล่องเก็บของ ({selectedLabelItems.length} รายการ)
            </h2>
            <p className="text-slate-300 text-sm font-bold mt-1">
              พิมพ์จากข้อมูลกล่องเก็บของล่าสุดเท่านั้น: ถ้าแก้รายการในกล่องแล้วกดพิมพ์ใหม่ ฉลากจะตรงกับข้อมูลปัจจุบัน
            </p>
          </div>

          <div className="flex flex-wrap justify-center gap-3">
            <div className="flex bg-slate-700/80 p-1 rounded-xl gap-1">
              {Object.entries(boxLabelSizePresets).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setBoxLabelSize(key)}
                  className={`px-4 py-2 rounded-lg font-black transition-colors ${boxLabelSize === key ? 'bg-white text-slate-900 shadow' : 'text-slate-200 hover:bg-slate-600'}`}
                  title={preset.desc}
                >
                  {preset.label}
                </button>
              ))}
            </div>
            <button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors">
              <Icons.Printer className="w-5 h-5"/> พิมพ์ฉลาก
            </button>
            <button onClick={() => { setShowBoxLabelPrintModal(false); setShowStorageBoxesModal(true); }} className="bg-slate-600 hover:bg-slate-500 px-6 py-2.5 rounded-xl font-bold transition-colors">กลับหน้ากล่อง</button>
          </div>
        </div>

        <div className="box-label-page pt-52 xl:pt-36 p-8 flex flex-col items-center gap-6 print:pt-0 print:p-0">
          <div className="print:hidden w-full max-w-3xl bg-white border border-slate-200 rounded-2xl p-4 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-3">
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
          </div>

          <div className="box-storage-label bg-white border border-slate-300 text-black shadow-xl" style={boxPreset.outerStyle}>
            <div className="border-b border-slate-300 px-4 py-3 print:px-3 print:py-2 bg-gradient-to-r from-slate-50 to-white">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className={`${boxPreset.meta} font-black tracking-[0.18em] uppercase leading-none`}>MDEC STORAGE BOX</div>
                      <div className={`${boxPreset.title} font-black leading-tight mt-1 break-words`}>{boxLabelTitle || 'กล่องอุปกรณ์ MDEC'}</div>
                      <div className={`${boxPreset.meta} font-bold mt-1`}>ศูนย์มัลติมีเดียทางการศึกษา</div>
                      <div className={`${boxPreset.meta} font-black mt-1`}>ทรัพย์สินของ MDEC • ใช้ภายในศูนย์</div>
                    </div>
                    {showDocumentLogo('boxLabelLogo') && renderOrgLogoBox({ className: 'w-20 h-12 rounded-2xl border border-slate-300 px-2 py-1.5 shadow-sm', imgClassName: 'w-full h-full object-contain', fallbackIconClass: 'w-5 h-5' })}
                  </div>
                </div>
                <div className="shrink-0 border border-slate-300 bg-slate-50 rounded-xl px-3 py-2 text-center min-w-[58px] print:min-w-[48px]">
                  <div className="text-3xl print:text-[20pt] font-black leading-none">{selectedLabelItems.length}</div>
                  <div className="text-[10px] print:text-[7pt] font-black leading-tight">รายการ</div>
                </div>
              </div>
            </div>

            <div className={`${boxPreset.bodyPadding}`}>
              {boxLabelNote && (
                <div className={`${boxPreset.meta} mb-3 border border-slate-300 bg-slate-50 rounded-xl px-3 py-2 font-black leading-tight`}>
                  หมายเหตุ: {boxLabelNote}
                </div>
              )}

              {selectedLabelItems.length === 0 ? (
                <div className="border-2 border-dashed border-black p-8 text-center font-black text-slate-500">
                  ยังไม่ได้เลือกอุปกรณ์สำหรับทำฉลากกล่อง
                </div>
              ) : (
                <div className={`${boxPreset.maxPreviewHeight} overflow-hidden print:max-h-none`}>
                  <div className={`grid ${boxPreset.gridClass} gap-x-5 gap-y-3`}>
                    {Object.entries(groupedByCategory).map(([category, group]) => (
                      <div key={category} className="break-inside-avoid border border-black">
                        <div className={`${boxPreset.meta} font-black bg-slate-100 border-b border-slate-300 px-2 py-1 flex justify-between gap-2`}>
                          <span className="truncate">{category}</span>
                          <span className="shrink-0">{group.length} ชิ้น</span>
                        </div>
                        <ol className="divide-y divide-slate-200">
                          {group.map((item, index) => (
                            <li key={item.id || `${category}_${index}`} className={`${boxPreset.itemText} font-bold leading-tight flex gap-2 px-2 py-1.5`}>
                              <span className="font-black shrink-0 w-5 text-right">{index + 1}.</span>
                              <span className="min-w-0 break-words">
                                <span className="font-black">{item.name || '-'}</span>
                                {item.sn && <span className="font-bold"> • S.N. {item.sn}</span>}
                                {Number(item.quantity) > 1 && <span className="font-black"> ×{item.quantity}</span>}
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

            <div className="border-t border-slate-300 bg-slate-50 px-4 py-2 print:px-3 print:py-1.5 flex justify-between items-center gap-3 text-[10px] print:text-[7pt] font-black">
              <div className="flex items-center gap-2 min-w-0">
                {showDocumentLogo('boxLabelLogo') && renderOrgLogoBox({ className: 'w-12 h-7 rounded-lg border border-slate-300 px-1.5 py-1', imgClassName: 'w-full h-full object-contain', fallbackIconClass: 'w-3 h-3' })}
                <span className="truncate">ตรวจเช็กก่อนใช้งานและหลังเก็บทุกครั้ง • ทรัพย์สินของ MDEC</span>
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

               <div className="w-full text-xs sm:text-sm font-bold text-slate-300 bg-slate-800/80 border border-slate-700 rounded-xl px-4 py-3">
                 แนะนำ: ก่อนติดสติ๊กเกอร์จริง ควรทดลองสแกน 1 ดวงก่อนเสมอ และถ้าติดอุปกรณ์ที่ต้องสแกนบ่อย ให้ใช้ขนาด <b>สแกนง่ายมาก</b> ระบบจะเว้น <b>Quiet Zone</b> หรือขอบขาวรอบ QR ให้โล่งขึ้น และย้ายโลโก้ออกจากพื้นที่สแกน เพื่อลดปัญหาสแกนไม่ติด
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

  if (printSlipData) {
    const isPrepSlip = printSlipData.type === 'prep';
    return (
      <div className={`min-h-screen font-sans text-slate-900 print:bg-white ${isInkSavingDocument ? "bg-white" : "bg-slate-100"}`}>
        <div className="print:hidden p-4 bg-slate-800 text-white flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
          <h2 className="font-bold text-xl flex items-center gap-2"><Icons.Printer className="w-6 h-6" /> {printSlipData.title}</h2>
          <div className="flex gap-3"><button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"><Icons.Printer className="w-5 h-5"/> {isPrepSlip ? 'พิมพ์ใบเตรียมของ' : 'พิมพ์ใบยืม'}</button><button onClick={() => setPrintSlipData(null)} className="bg-slate-600 hover:bg-slate-500 px-6 py-2.5 rounded-xl font-bold transition-colors">ปิด</button></div>
        </div>
        <div className="pt-24 print:pt-0 p-6 print:p-0 max-w-4xl mx-auto"><div className="relative overflow-hidden bg-white p-8 print:p-6 shadow-xl print:shadow-none border border-slate-200 print:border-0 rounded-2xl print:rounded-none">
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
              <p className="text-sm font-black text-blue-700">เอกสารจากระบบ MDEC-Stock • ศูนย์มัลติมีเดียทางการศึกษา</p>
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
              <span className="truncate">เอกสารนี้ออกโดยระบบ MDEC-Stock เพื่อแสดงความเป็นเจ้าของและใช้ประกอบการยืม-คืนภายในศูนย์</span>
            </div>
            <span className="shrink-0">{APP_VERSION}</span>
          </div>
        </div></div>
      </div>
    );
  }

  if (showCommandCenter) {
    const healthPercentage = stats.all > 0 ? Math.round((stats.available / stats.all) * 100) : 0;
    
    const ccTheme = {
      bg: isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800',
      card: isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100',
      textMain: isDarkMode ? 'text-slate-100' : 'text-slate-800',
      textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
      totalBg: isDarkMode ? 'bg-gradient-to-br from-blue-900/80 to-indigo-900/80 shadow-indigo-900/20' : 'bg-gradient-to-br from-blue-400 to-indigo-500 shadow-indigo-200',
      statAvail: isDarkMode ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100',
      statInUse: isDarkMode ? 'bg-amber-900/20 border-amber-800/50' : 'bg-amber-50 border-amber-100',
      statBorrow: isDarkMode ? 'bg-purple-900/20 border-purple-800/50' : 'bg-purple-50 border-purple-100',
      statEvent: isDarkMode ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-100',
      statMaint: isDarkMode ? 'bg-rose-900/20 border-rose-800/50' : 'bg-rose-50 border-rose-100',
      circleOuter: isDarkMode ? 'border-slate-950' : 'border-slate-50',
      circleInner: isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-50 text-slate-800',
      timeBg: isDarkMode ? 'bg-indigo-950/50 border-indigo-900/50 text-indigo-400' : 'bg-indigo-50 border-indigo-100 text-indigo-700',
      titleText: isDarkMode ? 'text-indigo-400' : 'text-indigo-600',
      iconBg: isDarkMode ? 'bg-indigo-900/50 text-indigo-400' : 'bg-indigo-100 text-indigo-600',
    };

    return (
      <div className={`fixed inset-0 font-sans z-[10000] flex flex-col p-4 sm:p-8 overflow-hidden font-medium transition-colors duration-300 ${ccTheme.bg}`}>
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-6 p-4 sm:px-8 sm:py-5 rounded-3xl shadow-sm border gap-4 ${ccTheme.card}`}>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 ${ccTheme.titleText}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${ccTheme.iconBg}`}>
              <Icons.Monitor className="w-7 h-7"/>
            </div>
            ศูนย์ควบคุม MDEC ✨
          </h1>
          <div className="flex items-center gap-4 sm:gap-6">
            <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className={`flex items-center justify-center p-3 font-bold rounded-xl transition-colors shadow-sm ${isDarkMode ? 'bg-slate-800 text-slate-200 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'}`} title={isDarkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดกลางคืน"}>
              {isDarkMode ? <Icons.Sun className="w-5 h-5"/> : <Icons.Moon className="w-5 h-5"/>}
            </button>
            <span className="text-lg animate-pulse text-rose-500 font-bold hidden sm:flex items-center gap-2">
              <span className="w-3 h-3 bg-rose-500 rounded-full shadow-[0_0_8px_rgba(244,63,94,0.6)]"></span> เคลื่อนไหวสด
            </span>
            <div className={`text-xl sm:text-2xl font-black px-5 py-2.5 rounded-2xl border shadow-inner ${ccTheme.timeBg}`}>
              {currentTime.toLocaleTimeString('th-TH')}
            </div>
            <button onClick={() => setShowCommandCenter(false)} className={`border px-6 py-3 rounded-2xl transition-all font-bold shadow-sm flex items-center gap-2 group ${isDarkMode ? 'bg-rose-900/30 border-rose-800 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white'}`}>
              ปิดหน้าต่าง <Icons.X className="w-5 h-5 group-hover:rotate-90 transition-transform" />
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="flex flex-col gap-6">
            <div className={`p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-lg ${ccTheme.totalBg}`}>
              <div className="absolute -right-6 -top-6 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
              <div className="absolute -left-6 -bottom-6 w-24 h-24 bg-black/20 rounded-full blur-xl"></div>
              <h2 className={`text-xl font-bold mb-2 z-10 flex items-center gap-2 ${isDarkMode ? 'text-blue-200' : 'text-blue-100'}`}><Icons.Package className="w-6 h-6"/> อุปกรณ์ทั้งหมด</h2>
              <span className="text-7xl sm:text-8xl font-black text-white z-10 drop-shadow-md">{stats.all}</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 flex-1">
              <div className={`p-4 rounded-3xl flex flex-col items-center justify-center shadow-sm border ${ccTheme.statAvail}`}>
                <span className={`font-bold mb-1 flex items-center gap-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>🟢 พร้อมใช้งาน</span>
                <span className={`text-4xl lg:text-5xl font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`}>{stats.available}</span>
              </div>
              <div className={`p-4 rounded-3xl flex flex-col items-center justify-center shadow-sm border ${ccTheme.statBorrow}`}>
                <span className={`font-bold mb-1 flex items-center gap-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>🟣 กำลังถูกยืม</span>
                <span className={`text-4xl lg:text-5xl font-black ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}>{stats.borrowed}</span>
              </div>
              <div className={`p-4 rounded-3xl flex flex-col items-center justify-center shadow-sm border ${ccTheme.statEvent}`}>
                <span className={`font-bold mb-1 flex items-center gap-1 ${isDarkMode ? 'text-orange-400' : 'text-orange-600'}`}>🚚 ออกงาน</span>
                <span className={`text-4xl lg:text-5xl font-black ${isDarkMode ? 'text-orange-400' : 'text-orange-500'}`}>{stats.outForEvent}</span>
              </div>
              <div className={`p-4 rounded-3xl flex flex-col items-center justify-center shadow-sm border ${ccTheme.statMaint}`}>
                <span className={`font-bold mb-1 flex items-center gap-1 ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>🔴 ชำรุด</span>
                <span className={`text-4xl lg:text-5xl font-black ${isDarkMode ? 'text-rose-400' : 'text-rose-500'}`}>{stats.maintenance}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className={`p-8 rounded-3xl flex-1 flex flex-col items-center justify-center shadow-sm relative overflow-hidden border ${ccTheme.card}`}>
              <div className={`absolute top-0 right-0 w-32 h-32 rounded-bl-[100px] -z-0 ${isDarkMode ? 'bg-emerald-900/10' : 'bg-emerald-50'}`}></div>
              <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 z-10 ${ccTheme.textMuted}`}>💖 สุขภาพสต๊อก (ความพร้อม)</h2>
              <div className={`relative w-56 h-56 rounded-full border-[12px] flex items-center justify-center shadow-inner z-10 ${ccTheme.circleOuter}`}
                   style={{ background: `conic-gradient(#10b981 ${healthPercentage * 3.6}deg, transparent 0)` }}>
                <div className={`absolute inset-4 rounded-full flex flex-col items-center justify-center shadow-sm border ${ccTheme.circleInner}`}>
                  <span className="text-5xl font-black">{healthPercentage}%</span>
                  <span className={`text-sm font-bold mt-1 px-3 py-1 rounded-full ${isDarkMode ? 'bg-emerald-900/30 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>พร้อมใช้สุดๆ ✨</span>
                </div>
              </div>
            </div>
            
            <div className={`border p-5 rounded-3xl flex-1 flex flex-col shadow-sm ${isDarkMode ? 'bg-slate-900/80 border-slate-700' : 'bg-white border-slate-200'}`}>
              <div className="flex items-center justify-between gap-3 mb-4">
                <h3 className={`font-black flex items-center gap-2 text-lg ${ccTheme.titleText}`}>
                  <Icons.Truck className="w-6 h-6" /> กำลังอยู่นอกศูนย์
                </h3>
                <span className={`px-3 py-1 rounded-full text-sm font-black border ${isDarkMode ? 'bg-slate-950 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {currentBorrowedItems.length + currentEventItems.length} รายการ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 mb-4">
                <button type="button" onClick={() => openTrackingCenter('today')} className={`p-3 rounded-2xl border text-left ${isDarkMode ? 'bg-purple-950/25 border-purple-800 text-purple-300' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
                  <div className="text-3xl font-black">{currentBorrowedItems.length}</div>
                  <div className="text-xs font-black mt-1">ถูกยืมอยู่</div>
                </button>
                <button type="button" onClick={() => openTrackingCenter('today')} className={`p-3 rounded-2xl border text-left ${isDarkMode ? 'bg-orange-950/25 border-orange-800 text-orange-300' : 'bg-orange-50 border-orange-100 text-orange-700'}`}>
                  <div className="text-3xl font-black">{currentEventItems.length}</div>
                  <div className="text-xs font-black mt-1">ออกงาน/ออกกอง</div>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                {[...currentBorrowedItems.map(i => ({...i, _kind: 'borrow'})), ...currentEventItems.map(i => ({...i, _kind: 'event'}))].slice(0, 12).map(i => {
                  const isLate = i.expectedReturn && new Date(i.expectedReturn).getTime() < todayMs;
                  return (
                    <button key={`${i._kind}_${i.id}`} type="button" onClick={() => setShowHistory(i.id)} className={`w-full text-left text-base px-4 py-3 rounded-2xl border shadow-sm flex flex-col gap-1 transition-colors ${isLate ? (isDarkMode ? 'bg-rose-950/35 border-rose-800 text-rose-200' : 'bg-rose-50 border-rose-200 text-rose-700') : (i._kind === 'event' ? (isDarkMode ? 'bg-orange-950/20 border-orange-800/60 text-orange-200' : 'bg-orange-50 border-orange-100 text-orange-700') : (isDarkMode ? 'bg-purple-950/20 border-purple-800/60 text-purple-200' : 'bg-purple-50 border-purple-100 text-purple-700'))}`}>
                      <div className="flex items-start justify-between gap-2">
                        <span className="font-black truncate">{i.name}</span>
                        <span className={`text-[11px] font-black px-2 py-1 rounded-lg shrink-0 ${isLate ? 'bg-rose-600 text-white' : i._kind === 'event' ? 'bg-orange-500 text-white' : 'bg-purple-600 text-white'}`}>
                          {isLate ? 'เลยกำหนด' : i._kind === 'event' ? 'ออกงาน' : 'ยืม'}
                        </span>
                      </div>
                      <div className={`text-xs font-bold truncate ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>
                        {i._kind === 'event' ? `งาน: ${i.currentEvent || '-'}` : `ผู้ยืม: ${i.currentBorrower || '-'}`} • กำหนดคืน {i.expectedReturn ? new Date(i.expectedReturn).toLocaleDateString('th-TH') : '-'}
                      </div>
                    </button>
                  );
                })}
                {(currentBorrowedItems.length + currentEventItems.length) === 0 && (
                  <div className={`text-center py-8 font-bold ${ccTheme.textMuted}`}>
                    <Icons.CheckCircle className="w-12 h-12 mx-auto mb-2 text-emerald-500" />
                    ตอนนี้ไม่มีอุปกรณ์ถูกยืมหรือออกงาน
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className={`border p-6 rounded-3xl flex flex-col h-full overflow-hidden shadow-sm ${ccTheme.card}`}>
            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 p-3 rounded-2xl ${ccTheme.titleText} ${isDarkMode ? 'bg-indigo-900/20' : 'bg-indigo-50'}`}>
               <Icons.ClipboardList className="w-6 h-6"/> ประวัติการเคลื่อนไหวล่าสุด
            </h2>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {auditLogs.slice(0, 30).map(log => {
                let badgeColor = isDarkMode ? 'bg-slate-800 text-slate-300' : 'bg-slate-100 text-slate-600';
                const action = log.action || '';
                let icon = '📌';
                if (action.includes('เพิ่ม') || action.includes('นำเข้า')) { badgeColor = isDarkMode ? 'bg-blue-900/40 text-blue-400' : 'bg-blue-100 text-blue-700'; icon = '✨'; }
                if (action.includes('แก้')) { badgeColor = isDarkMode ? 'bg-amber-900/40 text-amber-400' : 'bg-amber-100 text-amber-700'; icon = '✏️'; }
                if (action.includes('ลบ')) { badgeColor = isDarkMode ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-100 text-rose-700'; icon = '🗑️'; }
                if (action.includes('ยืม')) { badgeColor = isDarkMode ? 'bg-purple-900/40 text-purple-400' : 'bg-purple-100 text-purple-700'; icon = '📤'; }
                if (action.includes('ออกงาน')) { badgeColor = isDarkMode ? 'bg-orange-900/40 text-orange-400' : 'bg-orange-100 text-orange-700'; icon = '🚚'; }
                if (action.includes('คืน')) { badgeColor = isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-100 text-emerald-700'; icon = '📥'; }

                return (
                  <div key={log.id} className={`p-3.5 rounded-2xl border transition-shadow hover:shadow-md ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="flex justify-between items-center mb-2">
                      <span className={`text-xs font-bold px-2 py-1 rounded-lg ${badgeColor}`}>{icon} {action}</span>
                      <span className={`text-xs font-semibold ${ccTheme.textMuted}`}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString('th-TH', {hour12: false}) : '-'} น.</span>
                    </div>
                    <div className={`text-base font-bold truncate ${ccTheme.textMain}`}>{log.target || '-'}</div>
                    <div className={`text-xs truncate mt-1 flex items-center gap-1.5 ${ccTheme.textMuted}`}>
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${isDarkMode ? 'bg-slate-700' : 'bg-slate-200'}`}>👤</span> แอดมิน: {log.user || 'Admin'}
                    </div>
                  </div>
                );
              })}
              {auditLogs.length === 0 && (
                <div className={`text-center font-medium mt-10 flex flex-col items-center ${ccTheme.textMuted}`}>
                  <Icons.ViewGrid className="w-12 h-12 mb-2" />
                  ยังไม่มีการเคลื่อนไหว
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans ${pagePaddingClass} transition-colors duration-300 ${theme.mainBg} ${theme.textMain}`}>
      {firebaseError && (
        <div className="w-full mb-6 bg-rose-100 border-l-4 border-rose-500 text-rose-800 p-5 rounded-r-xl shadow-md flex items-start gap-4">
          <Icons.Alert className="w-8 h-8 shrink-0 text-rose-600" />
          <div>
            <h3 className="font-black text-xl mb-2 text-rose-700">🚨 ฐานข้อมูลถูกระงับ (Firebase Permission Denied)</h3>
            <p className="font-bold text-base mb-2">ระบบไม่สามารถดึงข้อมูลจาก Firebase ของคุณได้ โปรดตรวจสอบการตั้งค่า Rules อีกครั้ง</p>
          </div>
        </div>
      )}

      {isInitialLoading && (
        <div className={`w-full mb-6 p-5 rounded-2xl shadow-sm border flex items-center gap-4 ${theme.cardBg}`}>
          <div className="w-10 h-10 rounded-full bg-blue-600/10 text-blue-500 flex items-center justify-center animate-pulse"><Icons.Package className="w-6 h-6" /></div>
          <div>
            <div className={`font-black text-lg ${theme.textTitle}`}>กำลังโหลดข้อมูลสต๊อก...</div>
            <div className={`text-sm font-bold ${theme.textMuted}`}>ระบบกำลังดึงรายการอุปกรณ์และการตั้งค่าจาก Firebase</div>
          </div>
        </div>
      )}

      {/* Header - Premium Polish */}
      <div className={`w-full mb-8 rounded-[2rem] border overflow-hidden shadow-2xl transition-colors ${isDarkMode ? 'bg-slate-900/90 border-slate-700/80 shadow-black/30' : 'bg-white/95 border-white shadow-slate-200/80'}`}>
        <div className={`h-2 ${isDarkMode ? 'bg-gradient-to-r from-blue-500 via-cyan-400 to-indigo-500' : 'bg-gradient-to-r from-blue-600 via-sky-400 to-indigo-500'}`} />
        <div className={`flex flex-col xl:flex-row justify-between items-center gap-5 p-5 sm:p-6 ${isDarkMode ? 'bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.18),_transparent_32%)]' : 'bg-[radial-gradient(circle_at_top_left,_rgba(37,99,235,0.10),_transparent_32%)]'}`}>
          <div className="flex items-center gap-4 w-full xl:w-auto min-w-0">
            <div className={`w-36 sm:w-44 md:w-52 h-16 sm:h-20 rounded-[1.4rem] flex items-center justify-center overflow-hidden shrink-0 shadow-xl ring-4 bg-white ring-cyan-300/20 border border-white/80 px-4 py-3`}>
              {!brandLogoError ? (
                <img src={ORG_LOGO_SRC} alt="MDEC Logo" className="w-full h-full object-contain drop-shadow-sm" onError={() => setBrandLogoError(true)} />
              ) : (
                <div className="w-full h-full rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 text-white flex items-center justify-center"><Icons.Package className="w-9 h-9" /></div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className={`text-[11px] font-black tracking-[0.22em] uppercase ${isDarkMode ? 'text-cyan-300' : 'text-blue-600'}`}>Educational Multimedia Center</span>
                <span className={`text-[11px] font-black px-2 py-1 rounded-full border ${isDarkMode ? 'bg-blue-950/50 text-blue-300 border-blue-800' : 'bg-blue-50 text-blue-700 border-blue-100'}`}>{APP_VERSION}</span>
              </div>
              <h1 className={`text-2xl sm:text-4xl font-black tracking-tight leading-tight ${theme.textTitle}`}>MDEC-Stock</h1>
              <p className={`font-bold text-sm sm:text-base ${theme.textMuted}`}>ระบบจัดการสต๊อก ศูนย์มัลติมีเดียทางการศึกษา</p>
              <p className={`font-bold text-xs sm:text-sm mt-1 ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>อัปเดตล่าสุด: {APP_UPDATE_NOTE}</p>
            </div>
          </div>
          <div className="flex flex-wrap justify-center xl:justify-end gap-2 sm:gap-3 w-full xl:w-auto">
            <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className={`flex items-center justify-center p-3 font-bold rounded-2xl transition-all shadow-sm hover:-translate-y-0.5 ${theme.btnCancel}`} title={isDarkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดกลางคืน"}>
              {isDarkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
            </button>

            {isLoggedIn && (
              <>
                {canUseOperationalTools && (
                  <button type="button" onClick={() => openSelectionScanner()} className={`flex-1 md:flex-none items-center justify-center gap-2 px-4 py-3 font-black rounded-2xl transition-all flex shadow-lg hover:-translate-y-0.5 ${isDarkMode ? 'bg-gradient-to-r from-amber-600 to-orange-500 text-white' : 'bg-gradient-to-r from-amber-500 to-orange-500 text-white'}`} title="เปิดโหมดสแกน QR Code/Barcode">
                    <Icons.QrCode className="w-5 h-5" /><span className="hidden sm:inline">โหมดสแกน</span>
                  </button>
                )}

                <button type="button" onClick={() => setShowCommandCenter(true)} className={`flex-1 md:flex-none items-center justify-center gap-2 px-4 py-3 font-bold rounded-2xl transition-all flex hover:-translate-y-0.5 ${isDarkMode ? 'bg-emerald-950/60 text-emerald-300 hover:bg-emerald-900 border border-emerald-800' : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-100'}`} title="เปิดหน้าจอควบคุมรวม (Dashboard)">
                  <Icons.Monitor className="w-5 h-5" /><span className="hidden sm:inline">Dashboard</span>
                </button>

                {canUseOperationalTools && (
                  <button type="button" onClick={() => setShowStorageBoxesModal(true)} className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-3 font-black rounded-2xl shadow-lg transition-all text-base whitespace-nowrap hover:-translate-y-0.5 ${isDarkMode ? 'bg-gradient-to-r from-cyan-700 to-sky-600 text-white' : 'bg-gradient-to-r from-cyan-600 to-sky-600 text-white'}`}>
                    <Icons.Folder className="w-5 h-5" /> กล่องเก็บของ
                  </button>
                )}

                <button type="button" onClick={() => openTrackingCenter('today')} className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-5 py-3 font-black rounded-2xl shadow-lg transition-all text-base whitespace-nowrap hover:-translate-y-0.5 ${isDarkMode ? 'bg-gradient-to-r from-blue-700 to-indigo-600 text-white' : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white'}`} title="รวมวันนี้ / ของที่ต้องจัดการ / ปฏิทิน">
                  <Icons.History className="w-5 h-5" /> ศูนย์ติดตาม
                </button>

                {canManageSystem && (
                  <button type="button" onClick={() => { setSettingsTab('categories'); setShowSettings(true); }} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-2xl transition-all shadow-sm hover:-translate-y-0.5 ${theme.btnCancel}`}>
                    <Icons.Settings className="w-5 h-5" /><span className="hidden sm:inline">ตั้งค่า</span>
                  </button>
                )}

                {canUseOperationalTools && (
                  <button type="button" onClick={() => setShowMoreMenu(true)} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 font-black rounded-2xl transition-all shadow-sm border hover:-translate-y-0.5 ${theme.btnSecondary}`} title="เมนูเพิ่มเติม">
                    <Icons.ViewGrid className="w-5 h-5" /><span className="hidden sm:inline">เพิ่มเติม</span>
                  </button>
                )}

                <button type="button" onClick={() => { setMyPinForm({ oldPin: '', newPin: '', confirmPin: '' }); setShowMyAccountModal(true); }} className={`hidden xl:flex items-center gap-2 px-4 py-3 rounded-2xl border font-bold text-sm transition-all hover:-translate-y-0.5 ${isDarkMode ? 'bg-slate-950/60 border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`} title={`เข้าสู่ระบบโดย ${currentAccountLabel}`}>
                  👤 {currentAccountLabel}
                </button>

                <button type="button" onClick={handleLockScreen} className={`flex-1 md:flex-none items-center justify-center gap-2 px-4 py-3 font-bold rounded-2xl transition-all flex hover:-translate-y-0.5 ${isDarkMode ? 'bg-slate-950/60 border border-slate-700 text-slate-300 hover:bg-slate-800' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`} title="ล็อกหน้าจอชั่วคราว">
                  <Icons.Lock className="w-5 h-5" /><span className="hidden sm:inline">ล็อก</span>
                </button>

                <button type="button" onClick={handleLogout} className={`flex-1 md:flex-none items-center justify-center gap-2 px-4 py-3 font-bold rounded-2xl transition-all flex hover:-translate-y-0.5 ${isDarkMode ? 'bg-rose-950/60 text-rose-300 hover:bg-rose-900 border border-rose-800' : 'bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-100'}`} title="ออกจากระบบ">
                  <Icons.Unlock className="w-5 h-5" />
                </button>
              </>
            )}
            
            {!isAdmin && (
              <button type="button" onClick={() => setShowLogin(true)} className={`flex-1 md:flex-none items-center justify-center gap-2 px-5 py-3 font-bold rounded-2xl transition-all shadow-lg flex hover:-translate-y-0.5 ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
                <Icons.Lock className="w-5 h-5" /><span className="hidden sm:inline">เข้าสู่ระบบจัดการ</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {isLoggedIn && (
        <div className={`w-full mb-6 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white/80 border-slate-200'}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-100 text-blue-600'}`}>👤</div>
            <div>
              <div className={`font-black ${theme.textTitle}`}>เข้าสู่ระบบโดย: {currentAccountLabel}</div>
              <div className={`text-sm font-bold ${theme.textMuted}`}>สิทธิ์: {roleLabel(currentAccountRole)} • กด “ล็อก” เมื่อต้องออกจากโต๊ะชั่วคราว</div>
            </div>
          </div>
          <div className={`text-xs font-black px-3 py-2 rounded-xl border ${roleBadgeClass(currentAccountRole)}`}>{currentFullAccount?.username ? '@' + currentFullAccount.username : 'บัญชีภายใน'}</div>
        </div>
      )}

      {/* เมนูเพิ่มเติม: รวมฟังก์ชันที่คล้ายกันให้เป็นหมวดใหญ่ */}
      {showMoreMenu && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden border ${isDarkMode ? 'bg-slate-900/95 border-slate-700 shadow-black/40' : 'bg-white/95 border-white shadow-slate-200/80'}`}>
            <div className={`flex justify-between items-start gap-4 p-6 border-b ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-slate-700 text-slate-200' : 'bg-slate-100 text-slate-700'}`}>
                    <Icons.ViewGrid className="w-6 h-6" />
                  </div>
                  เมนูรวมระบบ
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>รวมเมนูที่หน้าที่คล้ายกันไว้ด้วยกัน เพื่อลดความรกของเว็บ</p>
              </div>
              <button type="button" onClick={() => setShowMoreMenu(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar max-h-[78vh] space-y-5">
              <div className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <div>
                  <div className={`font-black text-lg ${theme.textTitle}`}>โหมดการแสดงเมนู</div>
                  <p className={`text-sm font-bold ${theme.textMuted}`}>โหมดง่ายแสดงเฉพาะเมนูที่ใช้บ่อย ส่วนเต็มระบบจะแสดงเครื่องมือขั้นสูงทั้งหมด</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button type="button" onClick={() => updateUiMode('easy')} className={`px-4 py-2 rounded-xl font-black border ${uiMode === 'easy' ? 'bg-blue-600 text-white border-blue-600' : theme.btnSecondary}`}>โหมดง่าย</button>
                  <button type="button" onClick={() => updateUiMode('full')} className={`px-4 py-2 rounded-xl font-black border ${uiMode === 'full' ? 'bg-indigo-600 text-white border-indigo-600' : theme.btnSecondary}`}>เต็มระบบ</button>
                </div>
              </div>

              <div>
                <h4 className={`font-black mb-3 flex items-center gap-2 ${theme.textTitle}`}><Icons.History className="w-5 h-5 text-sky-500" /> งานประจำวัน</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button type="button" onClick={() => { setShowMoreMenu(false); openTrackingCenter('today'); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.History className="w-5 h-5" /> ศูนย์ติดตามงาน</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>วันนี้ / รอคืน / ออกงาน / เลยกำหนด / ปฏิทิน</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); openSelectionScanner({ camera: true }); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.QrCode className="w-5 h-5" /> โหมดสแกนเร็ว</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เปิดกล้องสแกน QR ทันที พร้อมกรอบช่วยสแกน</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setProofCenterFilter('all'); setProofCenterSearch(''); setShowProofCenterModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Camera className="w-5 h-5" /> หลักฐานรูปภาพ</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดู / แก้ไข / แทนที่ / ลบรูปหลักฐาน</p>
                  </button>
                </div>
              </div>

              <div>
                <h4 className={`font-black mb-3 flex items-center gap-2 ${theme.textTitle}`}><Icons.Folder className="w-5 h-5 text-cyan-500" /> จัดเก็บและจัดชุดอุปกรณ์</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowStorageBoxesModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Folder className="w-5 h-5" /> กล่องเก็บของ</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดู/แก้ไขกล่องและพิมพ์ฉลากกล่อง</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setBundleForm({ id: null, name: '', itemIds: [] }); setBundleSearchTerm(''); setShowBundleManager(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Layers className="w-5 h-5" /> เซ็ตอุปกรณ์</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>สร้าง/แก้ไขชุดอุปกรณ์ และใช้งานเป็นชุด</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowPrepListsModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.ClipboardList className="w-5 h-5" /> รายการเตรียมของ</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>วางแผนจัดของล่วงหน้าและพิมพ์ใบเตรียมของ</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowPersonalItemsModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Tag className="w-5 h-5" /> ของส่วนตัว</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดูอุปกรณ์ BYOD แยกตามเจ้าของ</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowProjectsModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Database className="w-5 h-5" /> โครงการ</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดูอุปกรณ์ตามโครงการ / งานพัสดุแบบง่าย</p>
                  </button>
                  {isFullMode && canUseOperationalTools && (
                    <button type="button" onClick={() => { setShowMoreMenu(false); setShowStockCountModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                      <div className="font-black text-lg flex items-center gap-2"><Icons.QrCode className="w-5 h-5" /> ตรวจนับสต๊อก</div>
                      <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เดินสแกน QR เทียบของจริงกับระบบ</p>
                    </button>
                  )}
                </div>
              </div>

              <div>
                <h4 className={`font-black mb-3 flex items-center gap-2 ${theme.textTitle}`}><Icons.Printer className="w-5 h-5 text-indigo-500" /> เอกสารและฉลาก</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowPrintModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.QrCode className="w-5 h-5" /> QR / สติ๊กเกอร์อุปกรณ์</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เลือกขนาด QR รวมถึงโหมด “สแกนง่ายมาก”</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowBoxLabelPrintModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Folder className="w-5 h-5" /> ฉลากกล่อง</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>พิมพ์ฉลากกล่องพร้อมโลโก้ MDEC</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setSettingsTab('documents'); setShowSettings(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Settings className="w-5 h-5" /> ตั้งค่าเอกสาร/โลโก้</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เปิด/ปิดโลโก้ ลายน้ำ และโหมดประหยัดหมึก</p>
                  </button>
                </div>
              </div>

              <div>
                <h4 className={`font-black mb-3 flex items-center gap-2 ${theme.textTitle}`}><Icons.Monitor className="w-5 h-5 text-emerald-500" /> ระบบและรายงาน</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowMonthlyReportModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.ClipboardList className="w-5 h-5" /> รายงานประจำเดือน</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>สรุปการยืม คืน ออกงาน และหลักฐาน</p>
                  </button>
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowSystemHealthModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                    <div className="font-black text-lg flex items-center gap-2"><Icons.Alert className="w-5 h-5" /> ตรวจสุขภาพระบบ</div>
                    <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ดูพื้นที่ฐานข้อมูล รูปหลักฐาน และสถานะระบบ</p>
                  </button>
                  {canManageSystem && (
                    <button type="button" onClick={() => { setShowMoreMenu(false); setShowBackupCenterModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                      <div className="font-black text-lg flex items-center gap-2"><Icons.Database className="w-5 h-5" /> ศูนย์สำรองข้อมูล</div>
                      <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>JSON / Google Sheets CSV / HTML รูปหลักฐาน</p>
                    </button>
                  )}
                  {isFullMode && canViewAudit && (
                    <button type="button" onClick={() => { setShowMoreMenu(false); setShowAuditModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                      <div className="font-black text-lg flex items-center gap-2"><Icons.History className="w-5 h-5" /> ประวัติการทำงาน</div>
                      <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>Audit log ของระบบ</p>
                    </button>
                  )}
                  {isFullMode && canManageSystem && (
                    <button type="button" onClick={() => { setShowMoreMenu(false); setShowTrashModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
                      <div className="font-black text-lg flex items-center gap-2"><Icons.Trash className="w-5 h-5" /> ถังขยะ</div>
                      <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>กู้คืนอุปกรณ์ที่ลบผิด</p>
                    </button>
                  )}
                  <button type="button" onClick={() => { setShowMoreMenu(false); setShowHelpModal(true); }} className={`p-4 rounded-2xl text-left border transition-all hover:-translate-y-0.5 hover:shadow-lg ${theme.btnSecondary}`}>
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
      <div className={`w-full mb-8 rounded-[2rem] border shadow-xl overflow-hidden ${theme.cardBg}`}>
        <div className={`p-5 sm:p-6 border-b ${theme.divide}`}>
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className={`text-sm font-black tracking-[0.18em] uppercase ${isDarkMode ? 'text-cyan-300' : 'text-blue-600'}`}>Daily Workflow</div>
              <h2 className={`text-2xl sm:text-3xl font-black mt-1 ${theme.textTitle}`}>เริ่มงานวันนี้จากตรงนี้</h2>
              <p className={`text-sm sm:text-base font-bold mt-1 ${theme.textMuted}`}>รวมปุ่มที่ใช้บ่อยที่สุดไว้ด้านบน ลดการไล่หาเมนูตอนทำงานจริง</p>
            </div>
            <div className={`text-xs font-black px-3 py-2 rounded-full border ${isDarkMode ? 'bg-slate-950/70 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              {APP_VERSION}
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3">
          {canUseOperationalTools && (
            <button type="button" onClick={() => openSelectionScanner()} className="group p-4 rounded-3xl bg-gradient-to-br from-amber-500 to-orange-500 text-white text-left shadow-lg hover:-translate-y-0.5 transition-all">
              <div className="w-10 h-10 rounded-2xl bg-white/20 flex items-center justify-center mb-3"><Icons.QrCode className="w-5 h-5" /></div>
              <div className="font-black text-lg">สแกน QR</div>
              <div className="text-xs font-bold text-white/80 mt-1">ค้นหา/ทำรายการเร็ว</div>
            </button>
          )}
          {canAddEditItems && (
            <button type="button" onClick={openAddItemForm} className={`group p-4 rounded-3xl text-left border shadow-sm hover:-translate-y-0.5 transition-all ${isDarkMode ? 'bg-blue-950/40 border-blue-800 text-blue-200' : 'bg-blue-50 border-blue-100 text-blue-700'}`}>
              <div className="w-10 h-10 rounded-2xl bg-blue-600 text-white flex items-center justify-center mb-3"><Icons.Plus className="w-5 h-5" /></div>
              <div className="font-black text-lg">เพิ่มอุปกรณ์</div>
              <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>ของใหม่เข้าระบบ</div>
            </button>
          )}
          <button type="button" onClick={() => openTrackingCenter('today')} className={`group p-4 rounded-3xl text-left border shadow-sm hover:-translate-y-0.5 transition-all ${isDarkMode ? 'bg-emerald-950/40 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-100 text-emerald-700'}`}>
            <div className="w-10 h-10 rounded-2xl bg-emerald-600 text-white flex items-center justify-center mb-3"><Icons.CheckCircle className="w-5 h-5" /></div>
            <div className="font-black text-lg">ศูนย์ติดตามงาน</div>
            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>วันนี้ / ต้องจัดการ</div>
          </button>
          <button type="button" onClick={() => setShowQuickReturnModal(true)} className={`group p-4 rounded-3xl text-left border shadow-sm hover:-translate-y-0.5 transition-all ${isDarkMode ? 'bg-purple-950/40 border-purple-800 text-purple-200' : 'bg-purple-50 border-purple-100 text-purple-700'}`}>
            <div className="w-10 h-10 rounded-2xl bg-purple-600 text-white flex items-center justify-center mb-3"><Icons.Users className="w-5 h-5" /></div>
            <div className="font-black text-lg">ติดตามของรอคืน</div>
            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>ดูตามผู้ยืม/งาน</div>
          </button>
          <button type="button" onClick={() => { setProofCenterFilter('all'); setProofCenterSearch(''); setShowProofCenterModal(true); }} className={`group p-4 rounded-3xl text-left border shadow-sm hover:-translate-y-0.5 transition-all ${isDarkMode ? 'bg-pink-950/40 border-pink-800 text-pink-200' : 'bg-pink-50 border-pink-100 text-pink-700'}`}>
            <div className="w-10 h-10 rounded-2xl bg-pink-600 text-white flex items-center justify-center mb-3"><Icons.Camera className="w-5 h-5" /></div>
            <div className="font-black text-lg">หลักฐานรูปภาพ</div>
            <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>รวมรูปทุกอุปกรณ์</div>
          </button>
        </div>

        <div className={`px-5 sm:px-6 pb-5 sm:pb-6 grid grid-cols-2 lg:grid-cols-4 gap-3`}>
          {[
            ['ต้องคืนวันนี้', dueTodayItems.length, 'emerald', () => openTrackingCenter('today')],
            ['เลยกำหนดคืน', overdueItems.length, 'rose', () => openTrackingCenter('issues')],
            ['รายการเตรียมของวันนี้', prepTodayLists.length, 'blue', () => setShowPrepListsModal(true)],
            ['ของที่ต้องจัดการ', dailyIssueItems.length, 'amber', () => { setQuickProblemOnly(true); window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' }); }]
          ].map(([label, value, tone, action]) => {
            const cls = {
              emerald: isDarkMode ? 'bg-emerald-950/30 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-100 text-emerald-700',
              rose: isDarkMode ? 'bg-rose-950/30 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-100 text-rose-700',
              blue: isDarkMode ? 'bg-blue-950/30 border-blue-800 text-blue-300' : 'bg-blue-50 border-blue-100 text-blue-700',
              amber: isDarkMode ? 'bg-amber-950/30 border-amber-800 text-amber-300' : 'bg-amber-50 border-amber-100 text-amber-700'
            }[tone];
            return (
              <button key={label} type="button" onClick={action} className={`p-4 rounded-2xl border text-left hover:-translate-y-0.5 transition-all ${cls}`}>
                <div className="text-3xl font-black leading-none">{Number(value || 0).toLocaleString('th-TH')}</div>
                <div className="text-xs sm:text-sm font-black mt-2">{label}</div>
              </button>
            );
          })}
        </div>
      </div>


      {/* 📊 Main Stats Grid - Premium Cards */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-5 mb-8">
        {[
          ['อุปกรณ์ทั้งหมด', stats.all, 'blue', '📦', 'จากข้อมูลทั้งหมด'],
          ['พร้อมใช้งาน', stats.available, 'emerald', '✅', 'พร้อมหยิบใช้งาน'],
          ['กำลังใช้งาน', stats.inUse, 'amber', '⚙️', 'กำลังใช้งานอยู่'],
          ['กำลังถูกยืม', stats.borrowed, 'purple', '📤', 'รอรับคืน'],
          ['ออกงาน', stats.outForEvent, 'orange', '🚚', 'อยู่นอกศูนย์'],
          ['ส่งซ่อม/ชำรุด', stats.maintenance, 'rose', '🛠️', 'ต้องติดตาม']
        ].map(([label, value, tone, emoji, caption]) => {
          const toneMap = {
            blue: isDarkMode ? 'from-blue-950/80 to-slate-900 border-blue-800/70 text-blue-300' : 'from-blue-50 to-white border-blue-100 text-blue-600',
            emerald: isDarkMode ? 'from-emerald-950/70 to-slate-900 border-emerald-800/70 text-emerald-300' : 'from-emerald-50 to-white border-emerald-100 text-emerald-600',
            amber: isDarkMode ? 'from-amber-950/70 to-slate-900 border-amber-800/70 text-amber-300' : 'from-amber-50 to-white border-amber-100 text-amber-600',
            purple: isDarkMode ? 'from-purple-950/70 to-slate-900 border-purple-800/70 text-purple-300' : 'from-purple-50 to-white border-purple-100 text-purple-600',
            orange: isDarkMode ? 'from-orange-950/70 to-slate-900 border-orange-800/70 text-orange-300' : 'from-orange-50 to-white border-orange-100 text-orange-600',
            rose: isDarkMode ? 'from-rose-950/70 to-slate-900 border-rose-800/70 text-rose-300' : 'from-rose-50 to-white border-rose-100 text-rose-600'
          };
          return (
            <div key={label} className={`relative overflow-hidden p-5 rounded-[1.5rem] border bg-gradient-to-br shadow-lg transition-all hover:-translate-y-1 hover:shadow-xl ${toneMap[tone]}`}>
              <div className="absolute -right-3 -top-3 text-6xl opacity-10 font-black">{emoji}</div>
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className={`font-black text-xs sm:text-sm tracking-wide ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>{label}</span>
                  <div className="text-4xl sm:text-5xl font-black mt-1 leading-none">{Number(value || 0).toLocaleString('th-TH')}</div>
                </div>
                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg shadow-sm ${isDarkMode ? 'bg-white/5' : 'bg-white/80'}`}>{emoji}</div>
              </div>
              <div className={`mt-3 text-[11px] font-bold ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{caption}</div>
            </div>
          );
        })}
      </div>

      {/* ส่วนสรุปหมวดหมู่แบบยุบได้ */}
      <div className={`w-full mb-8 rounded-[1.75rem] border shadow-sm overflow-hidden ${theme.cardBg}`}>
        <div className={`px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${showCategorySummary ? `border-b ${theme.divide}` : ''}`}>
          <div className="min-w-0">
            <div className={`font-black text-xl ${theme.textTitle}`}>สรุปหมวดหมู่</div>
            <div className={`text-sm font-bold ${theme.textMuted}`}>
              {categoryStats.length.toLocaleString('th-TH')} หมวดหมู่ • พร้อมใช้งาน {stats.available.toLocaleString('th-TH')} / {stats.all.toLocaleString('th-TH')} ชิ้น
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
                <span key={c.label} className={`px-3 py-1.5 rounded-full border ${isDarkMode ? 'bg-slate-950/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-200 text-slate-600'}`}>
                  {c.label}: {c.data.available}/{c.data.total}
                </span>
              ))}
              {categoryStats.filter(c => c.data.total > 0).length > 6 && (
                <span className={`px-3 py-1.5 rounded-full border ${isDarkMode ? 'bg-slate-950/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                  +{categoryStats.filter(c => c.data.total > 0).length - 6} หมวด
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
            {categoryStats.map(c => (
              <div key={c.label} className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950/30 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
      <div className={`w-full flex flex-col gap-4 ${panelPaddingClass} rounded-2xl shadow-md border mb-6 transition-colors ${theme.cardBg}`}>
        <div className="flex flex-col xl:flex-row gap-4 items-center w-full">
          <div className="relative flex-1 w-full">
            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${theme.textMuted}`}><Icons.Search className="w-5 h-5" /></div>
            <input type="text" className={`w-full pl-12 pr-4 py-3 sm:py-4 rounded-xl text-base sm:text-lg font-bold outline-none transition-all border ${theme.input}`} placeholder="ค้นหาชื่ออุปกรณ์, รหัส, สถานที่, เจ้าของ..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="hidden lg:flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            <select className={`flex-1 px-4 ${controlPaddingClass} rounded-xl text-lg font-bold outline-none border ${theme.input}`} value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
              <option value="all">สถานที่/ห้อง ทั้งหมด</option>
              {(settingsOptions.locations || []).filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={`flex-1 px-4 ${controlPaddingClass} rounded-xl text-lg font-bold outline-none border ${theme.input}`} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">หมวดหมู่ทั้งหมด</option>
              {(settingsOptions.categories || []).filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={`flex-1 px-4 ${controlPaddingClass} rounded-xl text-lg font-bold outline-none border ${theme.input}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">สถานะทั้งหมด</option>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          <div className="hidden lg:flex gap-2 w-full xl:w-auto">
            <button type="button" onClick={() => setShowProjectsModal(true)} className={`flex-1 xl:flex-none px-4 ${controlPaddingClass} rounded-xl font-black border transition-colors whitespace-nowrap ${filterProject !== 'all' ? 'bg-indigo-600 text-white border-indigo-600 shadow-md' : theme.btnSecondary}`}>โครงการ / เพิ่มโครงการ</button>
            <button type="button" onClick={openMeetingRoomView} className={`flex-1 xl:flex-none px-4 ${controlPaddingClass} rounded-xl font-black border transition-colors whitespace-nowrap ${showRoomView ? 'bg-sky-600 text-white border-sky-600 shadow-md' : theme.btnSecondary}`}>แยกห้องประชุม</button>
            <button type="button" onClick={() => setQuickProblemOnly(!quickProblemOnly)} className={`flex-1 xl:flex-none px-4 ${controlPaddingClass} rounded-xl font-black border transition-colors whitespace-nowrap ${quickProblemOnly ? 'bg-rose-600 text-white border-rose-600 shadow-md' : theme.btnSecondary}`}>ของที่ต้องจัดการ</button>
            {hasActiveFilters && <button type="button" onClick={clearAllFilters} className={`flex-1 xl:flex-none px-4 ${controlPaddingClass} rounded-xl font-black border transition-colors whitespace-nowrap ${theme.btnSecondary}`}>ล้างตัวกรอง</button>}
          </div>

          {canAddEditItems && (
            <div className="flex gap-2 w-full xl:w-auto">
              <button type="button" onClick={openAddItemForm} className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 ${controlPaddingClass} font-black rounded-xl shadow-md transition-colors text-lg whitespace-nowrap ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}><Icons.Plus className="w-5 h-5" /> <span className="hidden sm:inline">เพิ่มอุปกรณ์</span></button>
            </div>
          )}
        </div>

        <details className={`lg:hidden w-full rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-950/35 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <summary className={`cursor-pointer list-none px-4 py-3 font-black flex items-center justify-between gap-3 ${theme.textTitle}`}>
            <span>ตัวกรองและเมนูเร็ว</span>
            <span className={`text-xs px-2 py-1 rounded-full border ${theme.btnSecondary}`}>
              {hasActiveFilters ? 'มีตัวกรอง' : 'เปิด'}
            </span>
          </summary>
          <div className={`p-3 border-t space-y-3 ${theme.divide}`}>
            <div className="grid grid-cols-1 gap-3">
              <select className={`px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
                <option value="all">สถานที่/ห้อง ทั้งหมด</option>
                {(settingsOptions.locations || []).filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className={`px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
                <option value="all">หมวดหมู่ทั้งหมด</option>
                {(settingsOptions.categories || []).filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
              <select className={`px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
                <option value="all">สถานะทั้งหมด</option>
                {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
              </select>
              <select className={`px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterDept} onChange={e => setFilterDept(e.target.value)}>
                <option value="all">ฝ่าย/แผนก ทั้งหมด</option>
                {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
              </select>
              <select className={`px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
                <option value="all">โครงการทั้งหมด</option>
                {projectOptions.filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setShowProjectsModal(true)} className={`px-3 py-3 rounded-xl font-black border ${filterProject !== 'all' ? 'bg-indigo-600 text-white border-indigo-600' : theme.btnSecondary}`}>โครงการ</button>
              <button type="button" onClick={openMeetingRoomView} className={`px-3 py-3 rounded-xl font-black border ${showRoomView ? 'bg-sky-600 text-white border-sky-600' : theme.btnSecondary}`}>ห้องประชุม</button>
              <button type="button" onClick={() => setQuickProblemOnly(!quickProblemOnly)} className={`px-3 py-3 rounded-xl font-black border ${quickProblemOnly ? 'bg-rose-600 text-white border-rose-600' : theme.btnSecondary}`}>ต้องจัดการ</button>
              <button type="button" onClick={clearAllFilters} className={`px-3 py-3 rounded-xl font-black border ${theme.btnSecondary}`}>ล้างตัวกรอง</button>
            </div>

            <details className={`rounded-xl border overflow-hidden ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-white'}`}>
              <summary className={`cursor-pointer list-none px-3 py-2.5 text-sm font-black ${theme.textTitle}`}>ตัวกรองละเอียด</summary>
              <div className={`p-3 border-t grid grid-cols-1 gap-3 ${theme.divide}`}>
                <select className={`px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterAssetStatus} onChange={e => setFilterAssetStatus(e.target.value)}>
                  <option value="all">สถานะพัสดุทั้งหมด</option>
                  {ASSET_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
                <select className={`px-4 py-3 rounded-xl text-base font-bold outline-none border ${theme.input}`} value={filterQrTagged} onChange={e => setFilterQrTagged(e.target.value)}>
                  <option value="all">QR ทั้งหมด</option>
                  <option value="tagged">ติด QR แล้ว</option>
                  <option value="untagged">ยังไม่ติด QR</option>
                </select>
              </div>
            </details>
          </div>
        </details>

        <details className={`hidden lg:block w-full rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-950/35 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <summary className={`cursor-pointer list-none px-4 py-3 font-black flex items-center justify-between gap-3 ${theme.textTitle}`}>
            <span>ตัวกรองเพิ่มเติม <span className={`text-xs font-bold ${theme.textMuted}`}>โครงการ / สถานะพัสดุ / QR</span></span>
            <span className={`text-xs px-2 py-1 rounded-full border ${theme.btnSecondary}`}>
              {[filterProject !== 'all', filterAssetStatus !== 'all', filterQrTagged !== 'all'].filter(Boolean).length || 'ปิด'}
            </span>
          </summary>
          <div className={`p-3 border-t grid grid-cols-1 md:grid-cols-3 gap-3 ${theme.divide}`}>
            <select className={`px-4 ${controlPaddingClass} rounded-xl text-lg font-bold outline-none border ${theme.input}`} value={filterProject} onChange={e => setFilterProject(e.target.value)}>
              <option value="all">โครงการทั้งหมด</option>
              {projectOptions.filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={`px-4 ${controlPaddingClass} rounded-xl text-lg font-bold outline-none border ${theme.input}`} value={filterAssetStatus} onChange={e => setFilterAssetStatus(e.target.value)}>
              <option value="all">สถานะพัสดุทั้งหมด</option>
              {ASSET_STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <select className={`px-4 ${controlPaddingClass} rounded-xl text-lg font-bold outline-none border ${theme.input}`} value={filterQrTagged} onChange={e => setFilterQrTagged(e.target.value)}>
              <option value="all">QR ทั้งหมด</option>
              <option value="tagged">ติด QR แล้ว</option>
              <option value="untagged">ยังไม่ติด QR</option>
            </select>
          </div>
        </details>

        <details className={`hidden lg:block w-full rounded-2xl border overflow-hidden ${isDarkMode ? 'bg-slate-950/35 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
          <summary className={`cursor-pointer list-none px-4 py-3 font-black flex items-center justify-between gap-3 ${theme.textTitle}`}>
            <span>ฝ่าย / แผนก <span className={`text-xs font-bold ${theme.textMuted}`}>{filterDept === 'all' ? 'ทั้งหมด' : filterDept}</span></span>
            <span className={`text-xs px-2 py-1 rounded-full border ${theme.btnSecondary}`}>เลือกฝ่าย</span>
          </summary>
          <div className={`p-3 border-t ${theme.divide}`}>
        <div className="flex gap-2 overflow-x-auto w-full pb-2 custom-scrollbar">
          <button type="button" onClick={() => setFilterDept('all')} className={`flex items-center justify-center gap-2 whitespace-nowrap px-6 ${controlPaddingClass} rounded-xl font-bold text-lg transition-all border ${filterDept === 'all' ? (isDarkMode ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-800 border-slate-800 text-white shadow-md') : theme.btnSecondary}`}>
            ทั้งหมด <Icons.ViewGrid className="w-5 h-5" />
          </button>
          {DEPARTMENTS.map(d => {
            const IconComponent = Icons[d.iconName];
            return (
              <button type="button" key={d.id} onClick={() => setFilterDept(d.id)} className={`flex items-center justify-center gap-2 whitespace-nowrap px-6 ${controlPaddingClass} rounded-xl font-bold text-lg transition-all border ${filterDept === d.id ? (isDarkMode ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-800 border-slate-800 text-white shadow-md') : theme.btnSecondary}`}>
                {d.label} {IconComponent && <IconComponent className="w-5 h-5" />}
              </button>
            );
          })}
        </div>
          </div>
        </details>
      </div>

      {/* 🏫 Meeting Room Department Group View */}
      {showRoomView && (
        <div className={`w-full rounded-[1.75rem] shadow-xl border overflow-hidden relative transition-colors mb-8 ${theme.cardBg}`}>
          <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${theme.divide}`}>
            <div>
              <div className={`font-black text-xl ${theme.textTitle}`}>มุมมองแยกตามห้องประชุม</div>
              <div className={`text-sm font-bold ${theme.textMuted}`}>พบ {roomGroups.length.toLocaleString('th-TH')} ห้องประชุม/สถานที่ • {roomGroups.reduce((sum, room) => sum + room.total, 0).toLocaleString('th-TH')} รายการในฝ่ายห้องประชุม</div>
            </div>
            <button type="button" onClick={() => setShowRoomView(false)} className={`px-4 py-2 rounded-xl border font-black ${theme.btnSecondary}`}>กลับรายการทั้งหมด</button>
          </div>

          <div className="p-4 sm:p-5 space-y-4">
            {roomGroups.length === 0 ? (
              <div className={`rounded-2xl border p-10 text-center font-black ${theme.textMuted}`}>ไม่พบอุปกรณ์ในฝ่ายห้องประชุมตามเงื่อนไขนี้</div>
            ) : roomGroups.map((room) => {
              const expanded = expandedRooms[room.name] !== false;
              return (
                <div key={room.name} className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-950/35 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                  <div className={`p-4 flex flex-col lg:flex-row lg:items-center justify-between gap-3 ${isDarkMode ? 'bg-slate-900/40' : 'bg-white'}`}>
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
                                {item.project && <div className={`text-xs font-black mt-2 ${isDarkMode ? 'text-indigo-300' : 'text-indigo-700'}`}>🗂️ {item.project}</div>}
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

      {!showRoomView && (
        <>
      {/* 📋 Table / List */}
      <div className={`w-full rounded-[1.75rem] shadow-xl border overflow-hidden relative transition-colors ${theme.cardBg}`}>
        <div className={`px-5 py-4 border-b flex flex-col sm:flex-row sm:items-center justify-between gap-2 ${theme.divide}`}>
          <div>
            <div className={`font-black text-xl ${theme.textTitle}`}>รายการอุปกรณ์</div>
            <div className={`text-sm font-bold ${theme.textMuted}`}>พบ {filteredItems.length.toLocaleString('th-TH')} รายการ • เลือกแล้ว {selectedItems.length.toLocaleString('th-TH')} รายการ</div>
          </div>
          <div className={`text-xs font-black px-3 py-2 rounded-full border ${isDarkMode ? 'bg-slate-950/70 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>{mobileCardsEnabled ? 'Clean List / Mobile Cards' : 'Premium Table View'}</div>
        </div>

        {mobileCardsEnabled && (
          <div className={`lg:hidden ${isCompactUi ? 'p-3' : 'p-4'} space-y-3`}>
            {filteredItems.length === 0 ? (
              <div className={`rounded-2xl border p-8 text-center font-bold ${isDarkMode ? 'bg-slate-900/40 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
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
              const isOverdue = (isBorrowed || isEvent) && item.expectedReturn && new Date(item.expectedReturn).getTime() < todayMs;
              const canSelectThis = item.status === 'available' || isBorrowed || isEvent;
              return (
                <div key={`mobile_${item.id}_${index}`} className={`rounded-3xl border shadow-sm overflow-hidden ${isOverdue ? (isDarkMode ? 'bg-rose-950/30 border-rose-800' : 'bg-rose-50 border-rose-200') : (isDarkMode ? 'bg-slate-900/70 border-slate-700' : 'bg-white border-slate-200')}`}>
                  <div className={`p-4 ${isOverdue ? 'border-l-4 border-rose-500' : isEvent ? 'border-l-4 border-orange-400' : isBorrowed ? 'border-l-4 border-purple-400' : item.status === 'maintenance' ? 'border-l-4 border-rose-700' : 'border-l-4 border-blue-200'}`}>
                    <div className="flex items-start gap-3">
                      {canUseOperationalTools && (
                        <input
                          type="checkbox"
                          className="w-5 h-5 mt-1 rounded cursor-pointer accent-indigo-600 shrink-0"
                          checked={selectedItems.includes(item.id)}
                          disabled={!canSelectThis}
                          onChange={() => setSelectedItems(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id])}
                        />
                      )}
                      <div className="min-w-0 flex-1">
                        <div className={`font-black text-lg leading-tight ${theme.textTitle}`}>{item.name}</div>
                        <div className={`mt-1 text-xs font-bold ${theme.textMuted}`}>
                          {item.sn ? `S.N. ${item.sn}` : 'ไม่มี S.N.'} • {item.category || '-'} • {item.location || '-'}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black border ${isDarkMode ? statusInfo.darkColor : statusInfo.color}`}>{statusInfo.label}</span>
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? deptInfo.darkColor : deptInfo.color}`}>{deptInfo.label}</span>
                          {qty > 1 && <span className={`px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-blue-900/40 text-blue-300' : 'bg-blue-50 text-blue-700'}`}>x{qty}</span>}
                          {item.storageBoxName && <span className={`px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-cyan-900/40 text-cyan-300' : 'bg-cyan-50 text-cyan-700'}`}>📦 {item.storageBoxName}</span>}
                          {item.project && <button type="button" onClick={() => setFilterProject(item.project)} className={`px-2.5 py-1 rounded-full text-xs font-black ${isDarkMode ? 'bg-indigo-900/40 text-indigo-300' : 'bg-indigo-50 text-indigo-700'}`}>🗂️ {item.project}</button>}
                          {item.assetStatus && item.assetStatus !== 'active' && <span className={`px-2.5 py-1 rounded-full text-xs font-black border ${isDarkMode ? getAssetStatusInfo(item.assetStatus).darkColor : getAssetStatusInfo(item.assetStatus).color}`}>{getAssetStatusInfo(item.assetStatus).label}</span>}
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
                      <details className={`col-span-2 rounded-xl border ${isDarkMode ? 'border-slate-700 bg-slate-950/30' : 'border-slate-200 bg-slate-50'}`}>
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
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`border-b text-sm uppercase tracking-wide transition-colors ${theme.th}`}>
                {canUseOperationalTools && (
                  <th className="px-4 py-4 text-center w-14">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 rounded cursor-pointer accent-indigo-600" 
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
                
                const isOverdue = (isBorrowed || isEvent) && item.expectedReturn && new Date(item.expectedReturn).getTime() < todayMs;
                const rowBg = isOverdue ? (isDarkMode ? 'bg-rose-900/20 hover:bg-rose-900/40' : 'bg-rose-50 hover:bg-rose-100') : theme.trHover;
                const rowBorder = isOverdue ? 'border-l-4 border-l-rose-500' : isEvent ? 'border-l-4 border-l-orange-400' : isBorrowed ? 'border-l-4 border-l-purple-400' : item.status === 'maintenance' ? 'border-l-4 border-l-rose-700' : '';
                
                return (
                  <tr key={`${item.id}_${index}`} className={`group transition-all ${rowTextSizeClass} ${rowBg} ${rowBorder} hover:shadow-[inset_4px_0_0_rgba(59,130,246,0.45)]`}>

                    {canUseOperationalTools && (
                      <td className="px-4 py-4 text-center" onClick={(e) => e.stopPropagation()}>
                        {(item.status === 'available' || isBorrowed || isEvent) ? (
                          <input 
                            type="checkbox" 
                            className="w-5 h-5 rounded cursor-pointer accent-indigo-600"
                            checked={selectedItems.includes(item.id)}
                            onChange={() => {
                              setSelectedItems(prev => prev.includes(item.id) ? prev.filter(id => id !== item.id) : [...prev, item.id]);
                            }}
                          />
                        ) : (
                          <div className={`w-5 h-5 mx-auto rounded-sm cursor-not-allowed ${isDarkMode ? 'bg-slate-700 opacity-50' : 'bg-slate-200 opacity-50'}`} title="สถานะนี้ไม่สามารถทำรายการแบบกลุ่มได้"></div>
                        )}
                      </td>
                    )}

                    <td className="px-4 py-4 pl-6">
                      <div className={`font-bold text-xl flex items-center gap-2 flex-wrap ${theme.textTitle}`}>
                        {item.name} 
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
                      {item.sn && <div className={`text-base mt-1 font-mono ${theme.textMuted}`}>S.N.: {item.sn}</div>}
                      {(item.updatedBy || item.updatedAt) && <div className={`text-xs mt-1 font-bold ${theme.textMuted}`}>แก้ไขล่าสุด: {item.updatedBy || '-'} {item.updatedAt ? `• ${new Date(item.updatedAt).toLocaleString('th-TH', { hour12: false })}` : ''}</div>}

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
          hasAvailable ? `${availableCount} พร้อมใช้งาน` : '',
          hasReturnable ? `${returnableCount} รอคืน` : '',
          maintenanceCount ? `${maintenanceCount} ซ่อม/ชำรุด` : ''
        ].filter(Boolean).join(' • ');

        const secondaryButtonClass = `w-full px-4 py-3 rounded-2xl font-black text-sm border flex items-center gap-3 text-left transition-colors ${isDarkMode ? 'bg-slate-950 hover:bg-slate-800 border-slate-700 text-slate-200' : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'}`;

        return (
          <div className="fixed inset-x-3 bottom-4 sm:bottom-6 z-40 flex justify-center pointer-events-none">
            <div className={`pointer-events-auto w-full max-w-4xl rounded-[1.75rem] border shadow-[0_20px_70px_rgba(0,0,0,0.28)] backdrop-blur-2xl p-3 sm:p-4 animate-[slideUp_0.3s_ease-out] ${isDarkMode ? 'bg-slate-950/92 border-slate-700 text-white' : 'bg-white/95 border-slate-200 text-slate-900'}`}>
              <div className="flex flex-col lg:flex-row lg:items-center gap-3 lg:gap-4">
                <div className="flex items-center justify-between gap-3 lg:w-72 shrink-0">
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

                <div className="grid grid-cols-2 sm:flex sm:flex-wrap lg:flex-nowrap gap-2 flex-1">
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
                      title={`ยืมเฉพาะรายการที่พร้อมใช้งาน ${availableCount} รายการ`}
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
                      title={`ออกงานเฉพาะรายการที่พร้อมใช้งาน ${availableCount} รายการ`}
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
                      title={`รับคืนเฉพาะรายการที่กำลังถูกยืมหรือออกงาน ${returnableCount} รายการ`}
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
        <div className={`${theme.modalOverlay} fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
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
              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
                <p className={`text-xs font-bold mt-2 ${theme.textMuted}`}>ถ้าพิมพ์ชื่อกล่องเดิม ระบบจะอัปเดตรายการในกล่องนั้นเป็นรายการที่เลือกอยู่ตอนนี้</p>
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
        <div className={`${theme.modalOverlay} fixed inset-0 backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
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

              <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
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
                          {missingCount > 0 && <span className="text-sm font-bold px-2 py-1 rounded-md bg-rose-100 text-rose-700">หายจากระบบ {missingCount}</span>}
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
                      <div className={`mt-4 p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
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

      {/* 📷 Modal สแกน QR Code */}
      {showScanModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-4 sm:p-7 max-w-2xl w-full text-center shadow-2xl relative overflow-hidden flex flex-col max-h-[94vh] ${theme.cardBg}`}>
            <style>{`
              #qr-reader button { background-color: #f59e0b; color: white; border: none; padding: 8px 16px; border-radius: 12px; font-weight: 900; cursor: pointer; margin: 5px; }
              #qr-reader select { padding: 8px; border-radius: 10px; margin: 5px; max-width: 100%; border: 1px solid #ccc; color: black; font-weight: 700; }
              #qr-reader { border: none !important; width: 100% !important; }
              #qr-reader video { border-radius: 22px !important; object-fit: cover !important; }
              #qr-reader__scan_region { border-radius: 22px !important; overflow: hidden !important; }
              #qr-reader__dashboard_section_csr span { color: inherit !important; }
            `}</style>
            
            <div className="absolute top-0 left-0 w-full h-1 bg-amber-500 shadow-[0_0_15px_rgba(245,158,11,0.8)] animate-[scan_2s_ease-in-out_infinite] z-0 opacity-80 pointer-events-none"></div>
            
            <button type="button" onClick={() => { setShowScanModal(false); setUseCamera(false); }} className={`absolute top-4 right-4 p-3 hover:bg-rose-500/10 rounded-full hover:text-rose-500 transition-colors z-50 ${theme.textMuted}`}><Icons.X className="w-6 h-6" /></button>
            
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              <h3 className={`text-2xl font-black mb-2 mt-2 relative z-10 flex justify-center items-center gap-2 ${theme.textTitle}`}>
                <Icons.QrCode className="w-8 h-8 text-amber-500" /> {getScanModeInfo().title}
              </h3>
              <p className={`text-sm font-bold mb-4 ${theme.textMuted}`}>{getScanModeInfo().desc} • สแกนติดง่ายขึ้น: ให้ QR อยู่กลางกรอบประมาณ 70–80% และถือให้นิ่ง 1–2 วินาที</p>

              {scanMode !== 'select' && (() => {
                const targetIds = scanMode === 'borrowChecklist' ? borrowTargetIds : scanMode === 'eventChecklist' ? eventTargetIds : returnTargetIds;
                const checkedIds = scanMode === 'borrowChecklist' ? packingChecklist : scanMode === 'eventChecklist' ? eventChecklist : returnChecklist;
                const total = targetIds.length || 0;
                const checked = checkedIds.length || 0;
                const percent = total === 0 ? 0 : Math.min(100, Math.round((checked / total) * 100));
                const isComplete = total > 0 && checked >= total;
                const toneClass = scanMode === 'borrowChecklist'
                  ? (isDarkMode ? 'bg-purple-950/35 border-purple-800 text-purple-200' : 'bg-purple-50 border-purple-200 text-purple-800')
                  : scanMode === 'eventChecklist'
                    ? (isDarkMode ? 'bg-orange-950/35 border-orange-800 text-orange-200' : 'bg-orange-50 border-orange-200 text-orange-800')
                    : (isDarkMode ? 'bg-emerald-950/35 border-emerald-800 text-emerald-200' : 'bg-emerald-50 border-emerald-200 text-emerald-800');
                return (
                  <div className={`mb-4 p-4 rounded-3xl border text-left ${toneClass}`}>
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <div className="font-black text-base">{isComplete ? 'เช็กครบแล้ว พร้อมยืนยันรายการ' : `เช็กแล้ว ${checked}/${total} ชิ้น`}</div>
                      <div className="font-black text-sm">{percent}%</div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-black/10 overflow-hidden">
                      <div className={`h-full rounded-full transition-all duration-500 ${isComplete ? 'bg-emerald-500' : 'bg-amber-500'}`} style={{ width: `${percent}%` }}></div>
                    </div>
                    <div className="mt-2 text-xs font-bold opacity-80">
                      {isComplete ? 'ปิดหน้าสแกนแล้วกดปุ่มยืนยันรายการด้านล่างได้เลย' : 'สแกน QR ของอุปกรณ์จริงทีละชิ้น ระบบจะเช็กให้เอง'}
                    </div>
                    {isComplete && (
                      <button type="button" onClick={() => { setShowScanModal(false); setUseCamera(false); }} className="mt-3 w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black shadow-md">
                        กลับไปกดยืนยันรายการ
                      </button>
                    )}
                  </div>
                );
              })()}

              <div className="flex justify-center gap-2 mb-4 relative z-10">
                <button type="button" onClick={() => setUseCamera(false)} className={`px-4 py-2 font-bold rounded-xl transition-colors ${!useCamera ? 'bg-amber-500 text-white' : theme.btnSecondary}`}>
                  ⌨️ ยิง/พิมพ์รหัส
                </button>
                <button type="button" onClick={() => setUseCamera(true)} className={`px-4 py-2 font-bold rounded-xl transition-colors ${useCamera ? 'bg-amber-500 text-white' : theme.btnSecondary}`}>
                  📷 ใช้กล้องมือถือ
                </button>
              </div>
              
              {!useCamera ? (
                <>
                  <div className={`mb-4 p-3 rounded-2xl border text-left text-xs font-bold ${isDarkMode ? 'bg-slate-950/60 border-slate-700 text-slate-300' : 'bg-amber-50 border-amber-200 text-amber-800'}`}>
                    ใช้เครื่องยิงบาร์โค้ด หรือพิมพ์ S.N. / ID อุปกรณ์ แล้วกด Enter
                  </div>
                  <form onSubmit={handleScanSubmit} className="relative z-10">
                    <input 
                      type="text" 
                      ref={scanInputRef}
                      className={`w-full px-4 py-5 rounded-2xl font-black text-center text-xl outline-none mb-3 border-2 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 transition-all ${theme.input}`} 
                      placeholder="สแกน หรือ พิมพ์รหัสที่นี่" 
                      value={scanInput} 
                      onChange={e => setScanInput(e.target.value)} 
                      autoFocus
                    />
                    <button type="submit" className="w-full py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black shadow-md">{scanMode === 'select' ? 'เลือกอุปกรณ์นี้' : 'สแกนเช็กอุปกรณ์นี้'}</button>
                  </form>
                </>
              ) : (
                <div className="w-full relative z-10 flex flex-col items-center justify-center">
                  <div className={`w-full mb-3 p-3 rounded-2xl border text-left text-xs font-bold ${isDarkMode ? 'bg-slate-950/60 border-slate-700 text-slate-300' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                    <div className="font-black mb-1">เทคนิคให้สแกนติดง่าย</div>
                    <div>• ให้ QR อยู่ในกรอบ ไม่ชิดขอบ • ถ้าสติกเกอร์เงาให้เอียงเล็กน้อย • ถ้าไม่ติดให้ขยับเข้า/ออกช้า ๆ</div>
                  </div>
                  {!isScannerLoaded ? (
                    <div className="animate-pulse text-amber-500 font-bold py-10">กำลังโหลดระบบกล้อง...</div>
                  ) : (
                    <div className={`w-full rounded-[1.6rem] overflow-hidden border-4 ${isDarkMode ? 'border-amber-500/40 bg-slate-950' : 'border-amber-300 bg-slate-100'}`}>
                      <div id="qr-reader" className="w-full bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-inner"></div>
                    </div>
                  )}

                  <form onSubmit={handleScanSubmit} className="w-full mt-3 grid grid-cols-[1fr_auto] gap-2">
                    <input
                      type="text"
                      className={`px-4 py-3 rounded-xl font-bold text-center outline-none border ${theme.input}`}
                      placeholder="สแกนไม่ติด? พิมพ์รหัส/S.N."
                      value={scanInput}
                      onChange={e => setScanInput(e.target.value)}
                    />
                    <button type="submit" className="px-4 py-3 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-black">{scanMode === 'select' ? 'เลือก' : 'เช็ก'}</button>
                  </form>
                </div>
              )}

              <div className="h-12 relative z-10 mt-4 flex items-center justify-center">
                 {scanMessage.text && (
                   <span className={`font-black px-5 py-2.5 rounded-full shadow-md animate-[slideUp_0.2s_ease-out] ${scanMessage.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-rose-500 text-white'}`}>
                     {scanMessage.text}
                   </span>
                 )}
              </div>

              {lastScannedItemId && (() => {
                const scannedItem = items.find(i => i.id === lastScannedItemId);
                if (!scannedItem) return null;
                const statusInfo = STATUSES.find(s => s.id === scannedItem.status) || STATUSES[0];
                return (
                  <div className={`mt-2 mb-3 p-4 rounded-3xl border text-left ${isDarkMode ? 'bg-slate-950/60 border-slate-700' : 'bg-white border-slate-200 shadow-sm'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`font-black text-lg truncate ${theme.textTitle}`}>{scannedItem.name}</div>
                        <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>S.N. {scannedItem.sn || '-'} • {scannedItem.category || '-'}</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-lg text-xs font-black border shrink-0 ${isDarkMode ? statusInfo.darkColor : statusInfo.color}`}>{statusInfo.label}</span>
                    </div>
                    {scanMode === 'select' && (
                      <div className="grid grid-cols-2 gap-2 mt-3">
                        <button type="button" onClick={() => { setShowScanModal(false); setUseCamera(false); setShowHistory(scannedItem.id); }} className={`px-3 py-2.5 rounded-xl font-black text-sm border ${theme.btnSecondary}`}>ดูรายละเอียด</button>
                        {canAddEditItems && <button type="button" onClick={() => { setShowScanModal(false); setUseCamera(false); openItemEditor(scannedItem); }} className="px-3 py-2.5 rounded-xl font-black text-sm bg-blue-600 text-white">แก้ไขข้อมูล</button>}
                      </div>
                    )}
                  </div>
                );
              })()}

              <div className={`mt-2 grid grid-cols-3 gap-2 text-xs font-black ${theme.textMuted}`}>
                <div className={`p-2 rounded-xl border ${theme.btnSecondary}`}>{scanMode === 'select' ? `เลือกแล้ว ${selectedItems.length}` : 'เช็กด้วย QR'}</div>
                <div className={`p-2 rounded-xl border ${theme.btnSecondary}`}>กันสแกนซ้ำ</div>
                <div className={`p-2 rounded-xl border ${theme.btnSecondary}`}>มีสั่น/เสียง</div>
              </div>
            </div>

            <div className={`mt-5 pt-4 border-t shrink-0 relative z-10 ${theme.divide}`}>
              <button type="button" onClick={() => { setShowScanModal(false); setUseCamera(false); }} className={`w-full py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* 🧭 Modal ศูนย์ติดตามงาน: วันนี้ / ต้องจัดการ / ปฏิทิน */}
      {showTrackingCenterModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
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
                  <TodayPanel title="กำลังถูกยืม / ออกงาน" color="purple" items={todayFollowup.active} empty="ไม่มีอุปกรณ์ที่ถูกยืมหรือออกงาน" isDarkMode={isDarkMode} theme={theme} />
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
                    <div key={title} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
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
                  <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                    <h4 className={`font-black text-lg ${theme.textTitle}`}>รายการเตรียมของยังไม่ครบ</h4>
                    <div className="text-4xl font-black my-2 text-sky-500">{actionCenterData.prepIncomplete.length}</div>
                    {actionCenterData.prepIncomplete.slice(0, 8).map(p => <div key={p.id} className={`text-sm font-bold px-3 py-2 rounded-xl mb-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>{p.name} • {(p.checkedIds||[]).length}/{(p.itemIds||[]).length}</div>)}
                    {actionCenterData.prepIncomplete.length === 0 && <div className={`text-sm font-bold ${theme.textMuted}`}>ไม่มีรายการ</div>}
                  </div>
                  <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                    <h4 className={`font-black text-lg ${theme.textTitle}`}>กล่องที่มีรายการหายจากระบบ</h4>
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
                    <div key={day.date} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}><div className={`rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col max-h-[85vh] ${theme.cardBg}`}><div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}><h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><div className={`p-2 rounded-xl ${isDarkMode ? 'bg-sky-900/50 text-sky-400' : 'bg-sky-100 text-sky-600'}`}><Icons.History className="w-6 h-6"/></div>วันนี้ต้องติดตามอะไรบ้าง</h3><button type="button" onClick={() => setShowTodayModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button></div><div className="flex-1 overflow-y-auto custom-scrollbar p-6 grid grid-cols-1 lg:grid-cols-3 gap-4"><TodayPanel title="ต้องคืนวันนี้" color="amber" items={todayFollowup.dueToday} empty="วันนี้ยังไม่มีรายการครบกำหนดคืน" isDarkMode={isDarkMode} theme={theme} /><TodayPanel title="เลยกำหนดคืน" color="rose" items={todayFollowup.overdue} empty="ไม่มีรายการเลยกำหนด" isDarkMode={isDarkMode} theme={theme} /><TodayPanel title="กำลังถูกยืม / ออกงาน" color="purple" items={todayFollowup.active} empty="ไม่มีอุปกรณ์ที่ถูกยืมหรือออกงาน" isDarkMode={isDarkMode} theme={theme} /></div><div className={`p-4 border-t text-center text-sm font-bold ${theme.divide} ${theme.textMuted}`}>ใช้หน้านี้เปิดเช็กตอนเช้าได้เลย ว่าต้องตามคืนอะไรบ้างและใครกำลังใช้อุปกรณ์อยู่</div></div></div>
      )}

      {/* 🛠️ Modal แก้ไขกล่องเก็บของ */}
      {showStorageBoxEditor && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 z-[9995]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-6xl flex flex-col h-[92vh] sm:h-[88vh] overflow-hidden ${theme.cardBg}`}>
            <div className={`flex justify-between items-start gap-4 p-5 sm:p-6 border-b shrink-0 ${theme.divide}`}>
              <div className="min-w-0">
                <h3 className={`text-xl sm:text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
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

                  <div className={`p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-800/60 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`text-sm font-black ${theme.textTitle}`}>เลือกแล้ว {storageBoxForm.itemIds?.length || 0} รายการ</div>
                    <p className={`text-xs font-bold mt-1 ${theme.textMuted}`}>ถ้าเลือกอุปกรณ์ที่อยู่กล่องอื่น ระบบจะย้ายมาอยู่กล่องนี้ให้อัตโนมัติ</p>
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

                <div className={`flex-1 overflow-y-auto custom-scrollbar rounded-2xl border p-2 space-y-1 ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
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
                  ยังไม่มีกล่องเก็บของในระบบ
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
                          {missingCount > 0 && <span className="text-sm font-bold px-2 py-1 rounded-md bg-rose-100 text-rose-700">หายจากระบบ {missingCount} รายการ</span>}
                        </div>
                        {box.note && <p className={`text-sm font-bold mb-2 ${theme.textMuted}`}>หมายเหตุ: {box.note}</p>}
                        <p className={`text-xs font-bold mb-3 ${theme.textMuted}`}>หมวดหมู่ในกล่อง: {categories.length ? categories.join(', ') : '-'}</p>
                        <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-xl sm:text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
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
                    
                    <div className={`p-3 rounded-xl border max-h-40 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
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
              <p className={`text-sm text-center font-bold ${theme.textMuted}`}>* กดปุ่มรับคืนกลุ่มนี้ ระบบจะดึงของทั้งหมดไปหน้ารับคืนให้ทันที</p>
            </div>
          </div>
        </div>
      )}

      {/* 🏷️ Modal ทรัพย์สินส่วนตัว (BYOD) */}
      {showPersonalItemsModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-xl sm:text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
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
                      ยังไม่มีการลงทะเบียนทรัพย์สินส่วนตัวในระบบ
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
                        
                        <div className={`p-3 rounded-xl border max-h-60 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh] transition-all duration-300 border ${theme.cardBg}`}>
            <div className={`p-5 border-b shrink-0 flex items-start justify-between gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl sm:text-3xl font-black ${theme.textTitle}`}>ตั้งค่าระบบ</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>รวมการตั้งค่าที่ใช้บ่อยไว้เป็นหมวดด้านซ้าย ลดการเลื่อนหาเมนูยาว ๆ</p>
              </div>
              <button type="button" onClick={() => { setShowSettings(false); resetSettingsFormState(); }} className={`p-2 rounded-xl hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="flex flex-col lg:flex-row flex-1 min-h-0">
              <aside className={`hidden lg:block lg:w-72 shrink-0 border-r p-3 ${theme.divide}`}>
                <div className="flex lg:flex-col gap-2 overflow-x-auto lg:overflow-x-hidden lg:overflow-y-auto custom-scrollbar pb-1 lg:pb-0 lg:max-h-[72vh]">
                  {settingsNavItems.map((nav, idx) => {
                    const Icon = nav.icon || Icons.Settings;
                    const active = settingsTab === nav.id;
                    const showGroup = idx === 0 || settingsNavItems[idx - 1].group !== nav.group;
                    return (
                      <div key={nav.id} className="lg:w-full shrink-0">
                        {showGroup && <div className={`hidden lg:block text-[11px] font-black uppercase tracking-wide px-3 pt-2 pb-1 ${theme.textMuted}`}>{nav.group}</div>}
                        <button
                          type="button"
                          onClick={() => { setSettingsTab(nav.id); resetSettingsFormState(); if (nav.id === 'accounts') openNewAccountForm(); }}
                          className={`w-full min-w-[190px] lg:min-w-0 p-3 rounded-2xl border text-left transition-all ${active ? (isDarkMode ? 'bg-blue-600 border-blue-500 text-white shadow-lg' : 'bg-blue-600 border-blue-600 text-white shadow-lg') : theme.btnSecondary}`}
                        >
                          <div className="flex items-center gap-3">
                            <Icon className="w-5 h-5 shrink-0" />
                            <div className="min-w-0">
                              <div className="font-black truncate">{nav.label}</div>
                              <div className={`text-xs font-bold truncate ${active ? 'text-blue-100' : theme.textMuted}`}>{nav.desc}</div>
                            </div>
                          </div>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </aside>

              <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col min-h-0">
                <div className={`lg:hidden p-3 border-b ${theme.divide}`}>
                  <label className={`block text-xs font-black mb-2 ${theme.textMuted}`}>เลือกหมวดตั้งค่า</label>
                  <select
                    className={`w-full px-4 py-3 rounded-xl border font-black ${theme.input}`}
                    value={settingsTab}
                    onChange={(e) => { setSettingsTab(e.target.value); resetSettingsFormState(); if (e.target.value === 'accounts') openNewAccountForm(); }}
                  >
                    {settingsNavItems.map(nav => <option key={nav.id} value={nav.id}>{nav.label}</option>)}
                  </select>
                  <div className={`mt-2 text-xs font-bold ${theme.textMuted}`}>
                    {settingsNavItems.find(nav => nav.id === settingsTab)?.desc || 'ตั้งค่าระบบ'}
                  </div>
                </div>
              {settingsTab === 'accounts' ? (
                <div className="p-6 space-y-6">
                  <div className={`p-5 rounded-2xl border ${isDarkMode ? 'bg-indigo-900/20 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
                    <h4 className={`text-xl font-black mb-2 flex items-center gap-2 ${theme.textTitle}`}><Icons.Users className="w-6 h-6 text-indigo-500"/> จัดการบัญชีพนักงาน</h4>
                    <p className={`text-sm font-bold ${theme.textMuted}`}>บัญชีกลางสามารถเพิ่ม แก้ไข ปิดใช้งาน หรือลบบัญชีพนักงานได้ ใช้สำหรับระบุตัวผู้ทำรายการในระบบและ Audit Log</p>
                    <p className={`text-xs mt-2 font-bold ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>* เวอร์ชันทดลองนี้เป็นระบบล็อกอินภายในของเว็บ ยังไม่ใช่ Firebase Auth แบบองค์กร</p>
                    <p className={`text-xs mt-1 font-bold ${isDarkMode ? 'text-indigo-200' : 'text-indigo-700'}`}>* ระบบจะกัน PIN ที่เดาง่ายเกินไป ออกจากระบบอัตโนมัติเมื่อไม่ใช้งาน 2 ชั่วโมง และไม่แสดง PIN เดิมบนหน้าจอ</p>
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
                          <label className={`block text-sm font-bold mb-1.5 ${theme.textMuted}`}>PIN สำหรับเข้าสู่ระบบ</label>
                          <input type="password" className={`w-full px-4 py-3 rounded-xl font-bold outline-none border ${theme.input}`} placeholder="อย่างน้อย 4 ตัว" value={accountForm.pin} onChange={e => setAccountForm({...accountForm, pin: e.target.value})} disabled={!canManageAccounts} />
                        </div>
                      ) : (
                        <div className={`p-4 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-600'}`}>
                          <div className="font-black mb-1">PIN ถูกซ่อนไว้เพื่อความปลอดภัย</div>
                          <div className={`text-xs font-bold ${theme.textMuted}`}>หากต้องการเปลี่ยนรหัส ให้ใช้ปุ่ม “รีเซ็ต PIN” ในรายการบัญชีด้านล่าง</div>
                        </div>
                      )}
                      <div>
                        <label className={`block text-sm font-bold mb-1.5 ${theme.textMuted}`}>สิทธิ์</label>
                        <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none border ${theme.input}`} value={accountForm.role} onChange={e => setAccountForm({...accountForm, role: e.target.value})} disabled={!canManageAccounts}>
                          <option value="owner">บัญชีกลาง - จัดการได้ทุกอย่าง</option>
                          <option value="admin">ผู้ดูแล - จัดการระบบ/บัญชี/ลบข้อมูลได้</option>
                          <option value="staff">เจ้าหน้าที่ - เพิ่ม/แก้ไข/ยืม/คืน/ออกงานได้</option>
                          <option value="viewer">ดูอย่างเดียว - ค้นหาและดูสถานะเท่านั้น</option>
                        </select>
                      </div>
                      <label className={`sm:col-span-2 flex items-center gap-3 p-3 rounded-xl border cursor-pointer ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-white border-slate-200'}`}>
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
                    <div className={`text-sm font-bold ${theme.textMuted}`}>ใช้ Comfortable + Card View บนมือถือ สำหรับเจ้าหน้าที่ทั่วไป และใช้ Compact บนคอมของบัญชีกลางเมื่อต้องจัดการข้อมูลจำนวนมาก</div>
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
                      ['watermark', 'แสดง watermark จาง ๆ บนเอกสาร', 'ทำให้ใบยืม/ใบเตรียมของดูเป็นเอกสารระบบ']
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
                      <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>ใช้ไปประมาณ</div>
                        <div className={`text-lg font-black ${databaseStorageEstimate.textTone}`}>{databaseStorageEstimate.percentText}</div>
                      </div>
                      <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>ขนาดประเมิน</div>
                        <div className={`text-lg font-black ${theme.textTitle}`}>{databaseStorageEstimate.estimatedText}</div>
                      </div>
                      <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>อุปกรณ์</div>
                        <div className={`text-lg font-black ${theme.textTitle}`}>{databaseStorageEstimate.itemCount} ชิ้น</div>
                      </div>
                      <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>ประวัติยืม-คืน</div>
                        <div className={`text-lg font-black ${theme.textTitle}`}>{databaseStorageEstimate.historyCount} รายการ</div>
                      </div>
                      <div className={`p-3 rounded-xl border ${isDarkMode ? 'bg-slate-900/40 border-slate-700' : 'bg-white border-slate-200'}`}>
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
                    <div className={`mt-3 p-3 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-900/40 border-slate-700 text-slate-300' : 'bg-white border-blue-100 text-slate-600'}`}>
                      สำรองล่าสุด: {settingsOptions.backupMeta?.latest ? new Date(settingsOptions.backupMeta.latest).toLocaleString('th-TH', { hour12: false }) : 'ยังไม่มีข้อมูลการสำรองในระบบ'}
                    </div>
                    <div className={`mt-4 p-4 rounded-xl border ${isDarkMode ? 'bg-amber-900/20 border-amber-800' : 'bg-amber-50 border-amber-200'}`}>
                      <h5 className={`text-base font-black mb-1 flex items-center gap-2 ${isDarkMode ? 'text-amber-300' : 'text-amber-700'}`}>
                        <Icons.Upload className="w-4 h-4" /> กู้คืนข้อมูลจาก JSON
                      </h5>
                      <p className={`text-xs mb-3 font-bold ${isDarkMode ? 'text-amber-300/80' : 'text-amber-700/80'}`}>
                        ใช้เมื่อจำเป็นเท่านั้น ระบบจะเขียนทับ/เพิ่มข้อมูลจากไฟล์ JSON แต่จะไม่ลบอุปกรณ์ที่ไม่มีในไฟล์สำรอง
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
                        ใช้หลังจากสำรองข้อมูลรายปีแล้ว ระบบจะล้างเฉพาะประวัติใน history ของอุปกรณ์ทุกชิ้น ไม่ลบรายการอุปกรณ์และไม่เปลี่ยนสถานะปัจจุบัน
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

            <div className={`p-4 border-t shrink-0 ${theme.divide}`}>
              <button type="button" onClick={() => { setShowSettings(false); resetSettingsFormState(); }} className={`w-full py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* Checklist ปิดปีการศึกษา */}
      {showAnnualCleanupModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-5">
              <h3 className={`text-2xl font-black ${theme.textTitle}`}>Checklist ปิดปีการศึกษา</h3>
              <button type="button" onClick={() => setShowAnnualCleanupModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-3">
              {['ดาวน์โหลด JSON สำหรับกู้คืนระบบแล้ว', 'ดาวน์โหลด CSV สำหรับ Google Sheets แล้ว', 'ดาวน์โหลด HTML Gallery สำหรับดูรูปหลักฐานแล้ว', 'เปิดไฟล์ CSV ใน Google Sheets/Excel ตรวจดูได้แล้ว', 'เปิดไฟล์ HTML Gallery แล้วเห็นรูปหลักฐาน', 'ตรวจว่าของที่ยืม/ออกงานถูกคืนครบแล้ว', 'พร้อมล้างประวัติยืม-คืนรายปี'].map(item => (
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-end sm:items-center justify-center p-2 sm:p-4 z-[9990]`}>
          <div className={`rounded-t-3xl sm:rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col h-[94vh] sm:h-[88vh] lg:h-[85vh] overflow-hidden transition-all duration-300 ${theme.cardBg}`}>
            
            {/* Header */}
            <div className={`flex justify-between items-start sm:items-center gap-3 p-4 sm:p-6 border-b shrink-0 ${theme.divide}`}>
              <div>
                <h3 className={`text-xl sm:text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
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
                  เซ็ตที่มีในระบบ 
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
                  <div className={`p-4 border-b flex flex-col sm:flex-row justify-between gap-3 sm:items-center ${theme.divide} ${isDarkMode ? 'bg-slate-800/80' : 'bg-slate-50'} shrink-0`}>
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
                  <div className={`flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1 ${isDarkMode ? 'bg-slate-900/50' : 'bg-slate-50/50'}`}>
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

                <div className={`mt-4 shrink-0 flex flex-col sm:flex-row gap-3 sticky bottom-0 lg:static z-10 -mx-4 sm:mx-0 px-4 sm:px-0 py-3 sm:py-0 border-t sm:border-t-0 backdrop-blur ${isDarkMode ? 'bg-slate-800/95 sm:bg-transparent border-slate-700' : 'bg-white/95 sm:bg-transparent border-slate-200'}`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-xl sm:text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.Package className="w-6 h-6 text-purple-500" /> ใช้งานเซ็ตอุปกรณ์</h3>
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
                    
                    <div className={`mt-2 p-3 rounded-xl border max-h-40 overflow-y-auto custom-scrollbar ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
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
      {borrowTargetIds.length > 0 && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
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

            <div className={`mb-8 p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
              <div className={`mb-3 p-3 rounded-2xl border ${packingChecklist.length === borrowTargetIds.length ? (isDarkMode ? 'bg-emerald-950/25 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDarkMode ? 'bg-slate-950/30 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700')}`}>
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
      {eventTargetIds.length > 0 && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
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

            <div className={`mb-8 p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
              <div className={`mb-3 p-3 rounded-2xl border ${eventChecklist.length === eventTargetIds.length ? (isDarkMode ? 'bg-emerald-950/25 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDarkMode ? 'bg-slate-950/30 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700')}`}>
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
      {returnTargetIds.length > 0 && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
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

            <div className={`mb-8 p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
              <div className={`mb-3 p-3 rounded-2xl border ${returnChecklist.length === returnTargetIds.length ? (isDarkMode ? 'bg-emerald-950/25 border-emerald-800 text-emerald-300' : 'bg-emerald-50 border-emerald-200 text-emerald-700') : (isDarkMode ? 'bg-slate-950/30 border-slate-700 text-slate-300' : 'bg-white border-slate-200 text-slate-700')}`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-xl sm:text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.ClipboardList className="w-6 h-6 text-blue-500"/> ประวัติการทำงานส่วนกลาง</h3>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-6 gap-3">
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
                  <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className={`text-2xl font-black leading-tight ${theme.textTitle}`}>{detailItem.name || '-'}</div>
                        <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>S.N. {detailItem.sn || '-'} • {detailItem.category || '-'} • {detailItem.location || '-'}</div>
                      </div>
                      <span className={`inline-flex items-center justify-center px-3 py-1.5 rounded-xl text-sm font-black border ${isDarkMode ? detailStatus.darkColor : detailStatus.color}`}>{detailStatus.label}</span>
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
                      <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>ฝ่าย</div>
                        <div className={`font-black truncate ${theme.textTitle}`}>{detailDept.label || detailItem.department || '-'}</div>
                      </div>
                      <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>กล่อง</div>
                        <div className={`font-black truncate ${theme.textTitle}`}>{detailItem.storageBoxName || '-'}</div>
                      </div>
                      <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                        <div className={`text-xs font-bold ${theme.textMuted}`}>หลักฐาน</div>
                        <div className={`font-black ${theme.textTitle}`}>📷 {detailProofCount} รูป</div>
                      </div>
                      <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-white border-slate-200'}`}>
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
                        <div className={`text-sm font-bold mb-3 ${theme.textMuted}`}>ผู้ทำรายการในระบบ: {h.operatorName || h.performedBy}</div>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[10000]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[92vh] border ${isDarkMode ? 'bg-slate-900/95 border-slate-700 shadow-black/40' : 'bg-white/95 border-white shadow-slate-200/80'}`}>
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
              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
                  <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`text-xs font-bold ${theme.textMuted}`}>สถานะบัญชี</div>
                    <div className={`font-black ${currentFullAccount?.active === false ? 'text-rose-500' : 'text-emerald-500'}`}>{currentFullAccount?.active === false ? 'ปิดใช้งาน' : 'เปิดใช้งาน'}</div>
                  </div>
                  <div className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900/60 border-slate-700' : 'bg-white border-slate-200'}`}>
                    <div className={`text-xs font-bold ${theme.textMuted}`}>สิทธิ์หลัก</div>
                    <div className={`font-black ${theme.textTitle}`}>{canManageSystem ? 'จัดการระบบ' : canUseOperationalTools ? 'ใช้งาน/ทำรายการ' : 'ดูอย่างเดียว'}</div>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[10000]`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-black ${theme.textTitle}`}>{formData.id ? 'แก้ไขข้อมูล' : 'เพิ่มอุปกรณ์ใหม่'}</h3>
              <button type="button" onClick={() => confirmCloseIfDirty(true, () => setShowForm(false))} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              
              {/* 🏷️ กล่องเลือกว่าเป็นของส่วนตัว */}
              <div className={`sm:col-span-2 p-4 border rounded-xl transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <label className={`flex items-center gap-3 cursor-pointer ${theme.textTitle}`}>
                  <input type="checkbox" className="w-5 h-5 accent-fuchsia-500 rounded cursor-pointer" 
                    checked={formData.isPersonalItem} 
                    onChange={e => {
                      const isChecked = e.target.checked;
                      setFormData({
                        ...formData, 
                        isPersonalItem: isChecked, 
                        owner: isChecked ? (formData.owner || '') : '',
                        newOwner: ''
                      });
                    }} 
                  />
                  <span className="font-bold text-lg">👤 ระบุว่าเป็น "ของส่วนตัว" (Personal Item)</span>
                </label>
                
                {formData.isPersonalItem && (
                  <div className="mt-4 pl-8 space-y-4">
                    <div>
                      <label className={`block text-sm font-bold mb-2 ${theme.textMuted}`}>เลือกชื่อเจ้าของ <span className="text-rose-500">*</span></label>
                      <select 
                        className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border focus:ring-2 focus:ring-fuchsia-500 ${theme.input}`} 
                        value={formData.owner || ''} 
                        onChange={e => setFormData({...formData, owner: e.target.value, newOwner: e.target.value !== 'อื่นๆ' ? '' : formData.newOwner})}
                      >
                        <option value="" disabled>-- เลือกชื่อเจ้าของ --</option>
                        {(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}
                      </select>
                    </div>
                    {formData.owner === 'อื่นๆ' && (
                      <div className="animate-[slideDown_0.2s_ease-out]">
                        <input 
                          type="text" 
                          autoFocus 
                          className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border focus:ring-2 focus:ring-fuchsia-500 ${isDarkMode ? 'bg-fuchsia-900/20 border-fuchsia-800 text-fuchsia-300' : 'bg-fuchsia-50 border-fuchsia-300 text-fuchsia-800'}`} 
                          placeholder="พิมพ์ชื่อเจ้าของใหม่..." 
                          value={formData.newOwner || ''} 
                          onChange={e => setFormData({...formData, newOwner: e.target.value})} 
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="sm:col-span-2">
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>ชื่ออุปกรณ์ <span className="text-rose-500">*</span></label>
                <input type="text" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} placeholder="เช่น กล้อง Sony A7IV" value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              
              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>ฝ่ายที่รับผิดชอบ</label>
                <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})}>
                  {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>จำนวนชิ้น</label>
                <input type="number" min="1" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.quantity || 1} onChange={e => setFormData({...formData, quantity: e.target.value})} />
              </div>
              
              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>หมวดหมู่อุปกรณ์</label>
                <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value, newCategory: e.target.value !== 'อื่นๆ' ? '' : formData.newCategory})}>
                  <option value="" disabled>-- เลือกหมวดหมู่ --</option>
                  {(settingsOptions.categories || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>รหัส S.N. <span className="text-rose-500">*</span></label>
                <input type="text" className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} placeholder="เช่น CAM-001 (บังคับกรอก)" value={formData.sn || ''} onChange={e => setFormData({...formData, sn: e.target.value})} />
              </div>

              {formData.category === 'อื่นๆ' && (
                <div className="sm:col-span-2">
                  <label className="block text-base sm:text-lg font-bold text-blue-500 mb-2">เพิ่มหมวดหมู่ใหม่ / พิมพ์ระบุเอง</label>
                  <input type="text" autoFocus className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-800'}`} placeholder="พิมพ์ชื่อหมวดหมู่ใหม่..." value={formData.newCategory || ''} onChange={e => setFormData({...formData, newCategory: e.target.value})} />
                </div>
              )}
              
              <div className="sm:col-span-2">
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>สถานที่จัดเก็บ / ห้อง</label>
                <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value, newLocation: e.target.value !== 'อื่นๆ' ? '' : formData.newLocation})}>
                  <option value="" disabled>-- เลือกสถานที่ --</option>
                  {(settingsOptions.locations || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>

              {formData.location === 'อื่นๆ' && (
                <div className="sm:col-span-2">
                  <label className="block text-base sm:text-lg font-bold text-blue-500 mb-2">เพิ่มสถานที่ใหม่ / พิมพ์ระบุเอง</label>
                  <input type="text" autoFocus className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-blue-500 ${isDarkMode ? 'bg-blue-900/20 border-blue-800 text-blue-400' : 'bg-blue-50 border-blue-300 text-blue-800'}`} placeholder="พิมพ์ชื่อสถานที่จัดเก็บใหม่..." value={formData.newLocation || ''} onChange={e => setFormData({...formData, newLocation: e.target.value})} />
                </div>
              )}
              
              <div className="sm:col-span-2">
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>หมายเหตุภายใน / โน้ตอุปกรณ์ <span className={`text-sm font-normal ${theme.textMuted}`}>(ไม่แสดงบน QR)</span></label>
                <textarea className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-base border resize-none ${theme.input}`} rows="3" placeholder="เช่น แบตเสื่อมเร็ว, ช่อง HDMI หลวม, ใช้กับสายเฉพาะรุ่น..." value={formData.internalNote || ''} onChange={e => setFormData({...formData, internalNote: e.target.value})}></textarea>
              </div>

              <div className={`sm:col-span-2 p-4 border rounded-xl transition-colors ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                <label className={`flex items-center gap-3 cursor-pointer ${theme.textTitle}`}>
                  <input type="checkbox" className="w-5 h-5 accent-emerald-500 rounded cursor-pointer" checked={!!formData.qrTagged} onChange={e => setFormData({...formData, qrTagged: e.target.checked})} />
                  <span className="font-bold text-lg">▦ ติด QR แล้ว</span>
                </label>
                <p className={`text-xs font-bold mt-2 ${theme.textMuted}`}>ใช้ช่วยกรองรายการที่ยังไม่ได้ติดสติ๊กเกอร์ QR ตอนเตรียมอุปกรณ์จริง</p>
              </div>

              <div className="sm:col-span-2">
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>สถานะ</label>
                <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.status || 'available'} onChange={e => setFormData({...formData, status: e.target.value})}>
                  {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => confirmCloseIfDirty(true, () => setShowForm(false))} className={`flex-1 py-4 font-bold rounded-xl transition-colors text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={() => runWithBusy(handleSave)} disabled={isBusy} className={`flex-1 py-4 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-colors text-lg ${isBusy ? 'bg-blue-400 cursor-wait' : 'bg-blue-600 hover:bg-blue-500'}`}>{isBusy ? 'กำลังบันทึก...' : 'บันทึกข้อมูล'}</button>
            </div>
          </div>
        </div>
      )}


      {/* 🧭 Modal ศูนย์รวมของที่ต้องจัดการ */}
      {showActionCenterModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
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
                <div key={title} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
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
              <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                <h4 className={`font-black text-lg ${theme.textTitle}`}>รายการเตรียมของยังไม่ครบ</h4>
                <div className="text-4xl font-black my-2 text-sky-500">{actionCenterData.prepIncomplete.length}</div>
                {actionCenterData.prepIncomplete.slice(0, 8).map(p => <div key={p.id} className={`text-sm font-bold px-3 py-2 rounded-xl mb-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>{p.name} • {(p.checkedIds||[]).length}/{(p.itemIds||[]).length}</div>)}
              </div>
              <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
                <h4 className={`font-black text-lg ${theme.textTitle}`}>กล่องที่มีรายการหายจากระบบ</h4>
                <div className="text-4xl font-black my-2 text-cyan-500">{actionCenterData.brokenBoxes.length}</div>
                {actionCenterData.brokenBoxes.slice(0, 8).map(b => <div key={b.id} className={`text-sm font-bold px-3 py-2 rounded-xl mb-2 ${isDarkMode ? 'bg-slate-800' : 'bg-white'}`}>{b.name} • หาย {(b.missingIds||[]).length} รายการ</div>)}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📅 Modal ปฏิทินงาน / กำหนดคืน */}
      {showCalendarModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-5xl max-h-[88vh] flex flex-col overflow-hidden ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.History className="w-6 h-6 text-sky-500" /> ปฏิทินงาน / กำหนดคืน</h3>
              <button onClick={() => setShowCalendarModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto custom-scrollbar space-y-4">
              {calendarDays.length === 0 && <div className={`text-center py-12 font-black text-xl ${theme.textMuted}`}>ยังไม่มีกำหนดคืนหรือรายการเตรียมของ</div>}
              {calendarDays.map(day => (
                <div key={day.date} className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-6xl max-h-[90vh] flex flex-col overflow-hidden ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.QrCode className="w-6 h-6 text-amber-500" /> โหมดตรวจนับสต๊อก</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เดินสแกน QR/S.N. ของจริง ระบบจะเทียบกับรายการในเว็บ</p>
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
                  <h4 className={`font-black mb-3 ${theme.textTitle}`}>ยังไม่พบ (เฉพาะของพร้อมใช้งาน)</h4>
                  <div className="space-y-2 max-h-72 overflow-y-auto custom-scrollbar">
                    {stockCountStats.notFound.slice(0, 60).map(i => <div key={i.id} className={`p-3 rounded-xl font-bold ${isDarkMode ? 'bg-slate-800' : 'bg-slate-50'}`}>□ {i.name} <span className={theme.textMuted}>{i.sn || ''}</span></div>)}
                    {stockCountStats.notFound.length === 0 && <div className={`font-bold text-emerald-500`}>ครบแล้วในกลุ่มพร้อมใช้งาน</div>}
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
          <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
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
                <label className={`flex items-center gap-3 p-4 rounded-xl border ${theme.btnSecondary}`}><input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={repairForm.markAvailable} onChange={e => setRepairForm({...repairForm, markAvailable: e.target.checked})} /><span className="font-bold">ซ่อมเสร็จแล้ว เปลี่ยนสถานะกลับเป็นพร้อมใช้งาน</span></label>
                <div className={`rounded-2xl border p-4 ${isDarkMode ? 'border-slate-700 bg-slate-900/40' : 'border-slate-200 bg-slate-50'}`}>
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
              <h1 className="text-3xl sm:text-5xl font-black">MDEC-Stock Dashboard</h1>
              <p className={`font-bold mt-1 ${theme.textMuted}`}>ภาพรวมสำหรับเปิดค้างบนจอศูนย์ • {currentTime.toLocaleTimeString('th-TH')}</p>
            </div>
            <button onClick={() => setShowTvDashboardModal(false)} className="px-5 py-3 rounded-2xl bg-rose-600 text-white font-black">ปิด</button>
          </div>
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
            {[['ทั้งหมด', stats.all, 'text-blue-500'], ['พร้อมใช้', stats.available, 'text-emerald-500'], ['ถูกยืม', stats.borrowed, 'text-purple-500'], ['ออกงาน', stats.outForEvent, 'text-orange-500'], ['ชำรุด', stats.maintenance, 'text-rose-500'], ['ต้องจัดการ', actionCenterData.total, 'text-amber-500']].map(([label, value, tone]) => (
              <div key={label} className={`p-5 rounded-3xl border shadow-sm text-center ${theme.cardBg}`}><div className="text-sm font-black opacity-70">{label}</div><div className={`text-5xl font-black ${tone}`}>{value}</div></div>
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            <div className={`rounded-3xl border p-5 ${theme.cardBg}`}><h2 className="text-2xl font-black mb-3">ต้องคืนวันนี้</h2>{todayFollowup.dueToday.slice(0,8).map(i => <div key={i.id} className="text-xl font-bold py-2 border-b border-slate-200/30">{i.name}</div>)}{!todayFollowup.dueToday.length && <div className="text-xl font-bold opacity-60">ไม่มีรายการ</div>}</div>
            <div className={`rounded-3xl border p-5 ${theme.cardBg}`}><h2 className="text-2xl font-black mb-3">เลยกำหนดคืน</h2>{todayFollowup.overdue.slice(0,8).map(i => <div key={i.id} className="text-xl font-bold py-2 text-rose-500 border-b border-slate-200/30">{i.name}</div>)}{!todayFollowup.overdue.length && <div className="text-xl font-bold opacity-60">ไม่มีรายการ</div>}</div>
            <div className={`rounded-3xl border p-5 ${theme.cardBg}`}><h2 className="text-2xl font-black mb-3">งาน/เตรียมของใกล้ถึง</h2>{calendarDays.slice(0,5).map(d => <div key={d.date} className="py-2 border-b border-slate-200/30"><div className="font-black">{new Date(d.date).toLocaleDateString('th-TH')}</div><div className="font-bold opacity-70">{d.events.length} รายการ</div></div>)}</div>
          </div>
        </div>
      )}


      {/* 🗂️ Modal โครงการ / แหล่งที่มาอุปกรณ์ */}
      {showProjectsModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-6xl overflow-hidden flex flex-col max-h-[92vh] border ${isDarkMode ? 'bg-slate-900/95 border-slate-700 shadow-black/40' : 'bg-white/95 border-white shadow-slate-200/80'}`}>
            <div className={`p-6 border-b flex flex-col lg:flex-row lg:items-center justify-between gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-3xl font-black flex items-center gap-3 ${theme.textTitle}`}><span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-500 text-white flex items-center justify-center shadow-lg">🗂️</span> โครงการ / แหล่งที่มาอุปกรณ์</h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>เพิ่มชื่อโครงการก่อน แล้วค่อยเลือกโครงการนั้นในหน้าเพิ่ม/แก้ไขอุปกรณ์ หรือกด “กรอง” เพื่อดูของในโครงการ</p>
              </div>
              <button type="button" onClick={() => setShowProjectsModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-5 overflow-y-auto custom-scrollbar flex-1">
              <div className={`mb-5 p-5 rounded-3xl border ${isDarkMode ? 'bg-indigo-950/25 border-indigo-800' : 'bg-indigo-50 border-indigo-200'}`}>
                <div className="flex flex-col lg:flex-row lg:items-end gap-3">
                  <div className="flex-1">
                    <label className={`block text-base font-black mb-2 ${theme.textTitle}`}>เพิ่มโครงการใหม่</label>
                    <input
                      className={`w-full px-4 py-3 rounded-xl border font-bold ${theme.input}`}
                      placeholder="เช่น โครงการจัดซื้ออุปกรณ์ห้องประชุม ปี 2569"
                      value={quickProjectName}
                      onChange={e => setQuickProjectName(e.target.value)}
                      onKeyDown={e => { if (e.key === 'Enter') handleAddProjectQuick(); }}
                    />
                    <p className={`text-xs font-bold mt-2 ${theme.textMuted}`}>หลังเพิ่มแล้ว ชื่อโครงการจะไปอยู่ในช่อง “โครงการ / แหล่งที่มา” ตอนเพิ่มหรือแก้ไขอุปกรณ์</p>
                  </div>
                  <button type="button" onClick={handleAddProjectQuick} className="px-5 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black shadow-md whitespace-nowrap">
                    + เพิ่มโครงการ
                  </button>
                </div>
                <div className={`mt-4 p-3 rounded-2xl border text-xs font-bold ${isDarkMode ? 'bg-slate-950/35 border-slate-700 text-slate-300' : 'bg-white/70 border-indigo-100 text-slate-600'}`}>
                  วิธีใช้แบบง่าย: 1) เพิ่มชื่อโครงการ 2) เปิดรายการอุปกรณ์ที่ต้องการ 3) กดแก้ไข 4) เลือกโครงการ 5) บันทึก
                </div>
              </div>

              {filterProject !== 'all' && (
                <div className={`mb-4 p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${isDarkMode ? 'bg-indigo-950/20 border-indigo-800 text-indigo-200' : 'bg-indigo-50 border-indigo-200 text-indigo-700'}`}>
                  <div className="font-black">กำลังกรองโครงการ: {filterProject}</div>
                  <button type="button" onClick={() => setFilterProject('all')} className={`px-3 py-2 rounded-xl border font-black ${theme.btnSecondary}`}>ยกเลิกกรองโครงการ</button>
                </div>
              )}

              {projectStats.length === 0 ? (
                <div className={`text-center py-16 font-black text-xl ${theme.textMuted}`}>ยังไม่มีข้อมูลโครงการ</div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {projectStats.map((project) => (
                    <div key={project.name} className={`rounded-3xl border overflow-hidden ${isDarkMode ? 'bg-slate-950/35 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
                      <div className={`p-5 border-b ${theme.divide}`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <div className={`font-black text-xl truncate ${theme.textTitle}`}>{project.name}</div>
                            <div className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ทั้งหมด {project.total} รายการ • ใช้งานอยู่ {project.active || 0} • จำหน่ายแล้ว {project.disposed || 0} • สูญหาย {project.lost || 0}</div>
                          </div>
                          <button type="button" onClick={() => { setFilterProject(project.name); setShowProjectsModal(false); }} className="px-3 py-2 rounded-xl text-sm font-black bg-indigo-600 text-white shrink-0">กรอง</button>
                        </div>
                      </div>
                      <div className="p-4 space-y-2 max-h-80 overflow-y-auto custom-scrollbar">
                        {project.items.map((item) => {
                          const assetInfo = getAssetStatusInfo(item.assetStatus);
                          const statusInfo = STATUSES.find(s => s.id === item.status) || STATUSES[0];
                          return (
                            <div key={item.id} className={`p-3 rounded-2xl border ${isDarkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200'}`}>
                              <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                  <div className={`font-black truncate ${theme.textTitle}`}>{item.name}</div>
                                  <div className={`text-xs font-bold mt-1 ${theme.textMuted}`}>S.N. {item.sn || '-'} • {item.location || '-'}</div>
                                </div>
                                <div className="flex flex-col gap-1 items-end shrink-0">
                                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${isDarkMode ? statusInfo.darkColor : statusInfo.color}`}>{statusInfo.label}</span>
                                  <span className={`px-2 py-1 rounded-lg text-[10px] font-black border ${isDarkMode ? assetInfo.darkColor : assetInfo.color}`}>{assetInfo.label}</span>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-2 mt-3">
                                <button type="button" onClick={() => setShowHistory(item.id)} className={`px-3 py-2 rounded-xl text-sm font-black border ${theme.btnSecondary}`}>รายละเอียด</button>
                                {canAddEditItems && <button type="button" onClick={() => { setShowProjectsModal(false); openItemEditor(item); }} className="px-3 py-2 rounded-xl text-sm font-black bg-blue-600 text-white">เปลี่ยนโครงการ</button>}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className={`p-4 border-t ${theme.divide}`}>
              <button type="button" onClick={() => setShowProjectsModal(false)} className={`w-full py-4 rounded-xl font-black ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}


      {/* ศูนย์หลักฐานรูปภาพทั้งหมด */}
      {showProofCenterModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-7xl overflow-hidden flex flex-col max-h-[92vh] border ${isDarkMode ? 'bg-slate-900/95 border-slate-700 shadow-black/40' : 'bg-white/95 border-white shadow-slate-200/80'}`}>
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
            <div className={`px-5 py-3 border-b text-xs sm:text-sm font-bold ${isDarkMode ? 'bg-slate-950/50 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
              จากข้อมูลเดิมมีการแสดงผล {proofDuplicateStats.linkCount.toLocaleString('th-TH')} จุดเชื่อมโยง ระบบรวมรูปซ้ำออกไป {proofDuplicateStats.duplicateLinks.toLocaleString('th-TH')} จุด • รูปตัวอย่างใช้โหมดภาพเต็ม ไม่ตัดหัว/ตัดขอบ
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
                            <div className="absolute right-3 top-3 px-3 py-1.5 rounded-full bg-white/85 text-slate-800 text-xs font-black backdrop-blur-sm border border-white/70">
                              ภาพเต็ม
                            </div>
                            {group.itemRefs.length > 1 && (
                              <div className="absolute left-3 top-3 px-3 py-1.5 rounded-full bg-black/70 text-white text-xs font-black backdrop-blur-sm">
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[10020]`}>
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
              <div className={`p-4 rounded-2xl border text-sm font-bold ${isDarkMode ? 'bg-slate-950/40 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[10010]`}>
          <div className={`rounded-[2rem] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[92vh] border ${theme.cardBg}`}>
            <div className={`p-6 border-b flex flex-col sm:flex-row sm:items-start justify-between gap-4 ${theme.divide}`}>
              <div>
                <h3 className={`text-3xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <span className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white flex items-center justify-center shadow-lg">?</span>
                  คู่มือใช้งาน MDEC-Stock
                </h3>
                <p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>สรุปวิธีใช้แบบสั้น ๆ สำหรับเจ้าหน้าที่และผู้ดูแลระบบ</p>
              </div>
              <button type="button" onClick={() => setShowHelpModal(false)} className={`p-2 hover:text-rose-500 ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>

            <div className="p-6 overflow-y-auto custom-scrollbar space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  ['เริ่มงานประจำวัน', 'เปิด Daily Workflow เพื่อสแกน QR, เพิ่มอุปกรณ์, ดูของรอคืน และหลักฐานรูปภาพ'],
                  ['ยืม / ออกงาน', 'เลือกอุปกรณ์ → กดยืมหรือออกงาน → กรอกผู้รับผิดชอบ → แนบรูปหลักฐานถ้าต้องการ → บันทึก'],
                  ['รับคืน', 'เปิดศูนย์ติดตามงานหรือรายละเอียดอุปกรณ์ → กดรับคืน → ตรวจสภาพ → แนบหลักฐานรับคืนได้']
                ].map(([title, desc], idx) => (
                  <div key={title} className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
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
                  <div>• ระบบจะย่อรูปและประทับเวลา/พิกัดให้เอง</div>
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
                  <li>ยืนยันการลบ ระบบจะถอดรูปออกจากประวัติอุปกรณ์ที่เกี่ยวข้องทั้งหมด</li>
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
                <h4 className={`font-black text-xl mb-3 ${theme.textTitle}`}>🧭 ชื่อเมนูหลักที่ใช้ในระบบ</h4>
                <div className={`grid grid-cols-1 md:grid-cols-2 gap-3 text-sm font-bold ${theme.textMuted}`}>
                  <div><b>ศูนย์ติดตามงาน</b> = ดูของรอคืน ออกงานอยู่ วันนี้ และเลยกำหนด</div>
                  <div><b>ศูนย์หลักฐานรูปภาพ</b> = ดู แก้ไข แทนที่ หรือลบรูปหลักฐาน</div>
                  <div><b>จัดเก็บและจัดชุด</b> = กล่องเก็บของ เซ็ตอุปกรณ์ และรายการเตรียมของ</div>
                  <div><b>เอกสารและฉลาก</b> = QR ฉลากกล่อง ใบยืม และตั้งค่าโลโก้เอกสาร</div>
                </div>
              </div>

              <div className={`p-5 rounded-3xl border ${isDarkMode ? 'bg-slate-950/40 border-slate-700' : 'bg-white border-slate-200'}`}>
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


      {/* ตรวจสุขภาพระบบ */}
      {showSystemHealthModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] ${theme.cardBg}`}>
            <div className={`p-6 border-b flex justify-between items-start gap-4 ${theme.divide}`}>
              <div><h3 className={`text-2xl font-black ${theme.textTitle}`}>ตรวจสุขภาพระบบ</h3><p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>ภาพรวมฐานข้อมูล รูปหลักฐาน และรายการที่ต้องติดตาม</p></div>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh] ${theme.cardBg}`}>
            <div className={`p-6 border-b flex justify-between items-start gap-4 ${theme.divide}`}>
              <div><h3 className={`text-2xl font-black ${theme.textTitle}`}>รายงานประจำเดือน</h3><p className={`text-sm font-bold mt-1 ${theme.textMuted}`}>สรุปการใช้งานอุปกรณ์จากประวัติในระบบ</p></div>
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
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-8 max-w-sm w-full shadow-2xl ${theme.cardBg}`}>
            <h3 className={`text-2xl font-black mb-2 text-center ${theme.textTitle}`}>เข้าสู่ระบบจัดการ</h3>
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
              <div className={`p-3 rounded-xl border text-xs font-bold ${isDarkMode ? 'bg-slate-900/40 border-slate-700 text-slate-400' : 'bg-slate-50 border-slate-200 text-slate-500'}`}>
                ค่าเริ่มต้น: username <span className="font-black">admin</span> ใช้ PIN เดิมของระบบ จากนั้นไปที่ ตั้งค่า → บัญชีผู้ใช้ เพื่อเพิ่มบัญชีพนักงาน
              </div>
            </div>
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowLogin(false)} className={`w-full sm:flex-1 py-4 font-bold rounded-xl text-base sm:text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleLogin} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl text-lg hover:bg-blue-500">เข้าสู่ระบบ</button>
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
  return (<div className={`rounded-2xl border p-4 flex flex-col min-h-[300px] ${palette[color] || palette.purple}`}><h4 className="text-xl font-black mb-3 flex justify-between items-center"><span>{title}</span><span className="text-sm px-2 py-1 rounded-lg bg-white/40">{items.length}</span></h4><div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 pr-1">{items.length === 0 ? (<div className={`h-full flex items-center justify-center text-center font-bold ${theme.textMuted}`}>{empty}</div>) : items.map(item => { const pc = proofCountOf(item); return (<div key={item.id} className={`p-3 rounded-xl border shadow-sm ${isDarkMode ? 'bg-slate-800/70 border-slate-700 text-slate-200' : 'bg-white border-slate-200 text-slate-700'}`}><div className="font-black truncate">{item.name}</div><div className="text-xs font-bold opacity-80 mt-1">{item.status === 'out-for-event' ? 'งาน' : 'ผู้ยืม'}: {item.currentBorrower || item.currentEvent || '-'}</div><div className="text-xs font-bold opacity-80">กำหนดคืน: {item.expectedReturn ? new Date(item.expectedReturn).toLocaleDateString('th-TH') : '-'}</div>{pc > 0 && <div className="text-xs font-black mt-2 inline-block px-2 py-1 rounded-lg bg-pink-500/10 border border-pink-500/20">📷 หลักฐาน {pc} รูป</div>}{item.internalNote && <div className="text-xs font-bold mt-2 p-2 rounded-lg bg-amber-500/10 border border-amber-500/20">โน้ต: {item.internalNote}</div>}</div>);})}</div></div>);
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
            <h1 className="text-3xl font-black text-rose-400 mb-4">🚨 ขออภัย เกิดข้อผิดพลาดในระบบ</h1>
            <p className="text-lg text-rose-200 mb-6">ระบบพบข้อขัดข้องบางประการ กรุณารีเฟรชหน้าเว็บ หากปัญหายังคงอยู่ โปรดตรวจสอบโค้ดล่าสุด</p>
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
