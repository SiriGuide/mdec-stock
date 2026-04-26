import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection, addDoc } from "firebase/firestore";

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

const IS_CANVAS = typeof __app_id !== 'undefined';
const APP_ID = IS_CANVAS ? __app_id : 'default-app-id';

const getItemsCol = () => IS_CANVAS ? collection(db, 'artifacts', APP_ID, 'public', 'data', 'items') : collection(db, 'mdec_stock', 'shared_data', 'items');
const getSettingsDoc = () => IS_CANVAS ? doc(db, 'artifacts', APP_ID, 'public', 'data', 'settings', 'global') : doc(db, 'mdec_stock', 'shared_data', 'settings', 'global');
const getAuditCol = () => IS_CANVAS ? collection(db, 'artifacts', APP_ID, 'public', 'data', 'audit_logs') : collection(db, 'mdec_stock', 'shared_data', 'audit_logs');
const getItemDoc = (id) => IS_CANVAS ? doc(db, 'artifacts', APP_ID, 'public', 'data', 'items', id) : doc(db, 'mdec_stock', 'shared_data', 'items', id);

const ADMIN_PIN = 'mdec8203';

const Icons = {
  Plus: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Search: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Edit: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Package: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Alert: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Settings: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>,
  X: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  Tag: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" /></svg>,
  History: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  UserPlus: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  CheckCircle: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Unlock: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  Lock: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Download: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Upload: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>,
  ClipboardList: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>,
  Folder: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  ViewGrid: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" /></svg>,
  Camera: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  VideoCamera: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" /></svg>,
  Speaker: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" /></svg>,
  Users: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" /></svg>,
  Signal: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" /></svg>,
  Eye: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>,
  EyeOff: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>,
  Sun: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  Moon: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>,
  Layers: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>,
  Monitor: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  Truck: ({ className = "" }) => <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.92l-1.09-1.09A4 4 0 0 0 16.92 9H14v8h2"/><circle cx="8.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/></svg>,
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
  { id: 'ภาพนิ่ง', label: 'ฝ่ายภาพนิ่ง', color: 'bg-blue-100 text-blue-700', darkColor: 'bg-blue-900/40 text-blue-400', iconName: 'Camera' },
  { id: 'วิดีโอ', label: 'ฝ่ายวิดีโอ', color: 'bg-indigo-100 text-indigo-700', darkColor: 'bg-indigo-900/40 text-indigo-400', iconName: 'VideoCamera' },
  { id: 'เครื่องเสียง', label: 'ฝ่ายเครื่องเสียง', color: 'bg-cyan-100 text-cyan-700', darkColor: 'bg-cyan-900/40 text-cyan-400', iconName: 'Speaker' },
  { id: 'ห้องประชุม', label: 'ห้องประชุม', color: 'bg-sky-100 text-sky-700', darkColor: 'bg-sky-900/40 text-sky-400', iconName: 'Users' },
  { id: 'ob-live', label: 'OB-LIVE', color: 'bg-violet-100 text-violet-700', darkColor: 'bg-violet-900/40 text-violet-400', iconName: 'Signal' }
];

function MainApp() {
  const [items, setItems] = useState([]);
  const [settingsOptions, setSettingsOptions] = useState({ categories: ['กล้อง', 'เลนส์', 'ไมโครโฟน', 'ชุดลำโพง', 'ถ่าน/แบต', 'สายไฟ', 'อื่นๆ'], locations: ['ตู้ A1', 'ห้องเก็บของ 2', 'ห้องประชุม 1', 'อื่นๆ'], staff: ['แอดมิน', 'อื่นๆ'], bundles: [] });
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  
  const [isAdmin, setIsAdmin] = useState(() => { try { return localStorage.getItem('mdec_admin') === 'true'; } catch (e) { return false; }});
  const [isDarkMode, setIsDarkMode] = useState(() => { try { return localStorage.getItem('mdec_theme') === 'dark'; } catch(e) { return false; }});
  
  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [pin, setPin] = useState('');
  const [firebaseError, setFirebaseError] = useState(false);
  
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', sn: '', department: 'ภาพนิ่ง', category: '', newCategory: '', location: '', newLocation: '', status: 'available', quantity: 1, owner: '', newOwner: '', isPersonalItem: false });
  
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
  const [showPersonalItemsModal, setShowPersonalItemsModal] = useState(false);
  const [showEmptyCategories, setShowEmptyCategories] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);
  
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanInput, setScanInput] = useState('');
  const [scanMessage, setScanMessage] = useState({ text: '', type: '' });
  
  const scanInputRef = useRef(null);
  const [useCamera, setUseCamera] = useState(false);
  const [isScannerLoaded, setIsScannerLoaded] = useState(false);
  const itemsRefForScan = useRef(items);
  const fileInputRef = useRef(null);

  useEffect(() => { itemsRefForScan.current = items; }, [items]);

  useEffect(() => {
    if (!window.Html5QrcodeScanner) {
      const script = document.createElement("script");
      script.src = "https://unpkg.com/html5-qrcode";
      script.async = true;
      script.onload = () => setIsScannerLoaded(true);
      document.body.appendChild(script);
    } else { setIsScannerLoaded(true); }
  }, []);

  useEffect(() => {
    if (showCommandCenter) {
      const timer = setInterval(() => setCurrentTime(new Date()), 1000);
      return () => clearInterval(timer);
    }
  }, [showCommandCenter]);

  useEffect(() => {
    try { localStorage.setItem('mdec_theme', isDarkMode ? 'dark' : 'light'); } catch(e){}
    document.body.style.backgroundColor = isDarkMode ? '#0f172a' : '#f1f5f9'; 
  }, [isDarkMode]);

  useEffect(() => { if (showScanModal && scanInputRef.current) { scanInputRef.current.focus(); } }, [showScanModal]);

  const theme = {
    mainBg: isDarkMode ? 'bg-slate-900' : 'bg-slate-100',
    textMain: isDarkMode ? 'text-slate-100' : 'text-slate-800',
    textTitle: isDarkMode ? 'text-white' : 'text-slate-900',
    textMuted: isDarkMode ? 'text-slate-400' : 'text-slate-500',
    cardBg: isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200',
    input: isDarkMode ? 'bg-slate-900 border-slate-600 text-white focus:ring-blue-500' : 'bg-slate-50 border-slate-300 text-slate-700 focus:ring-blue-500',
    th: isDarkMode ? 'bg-slate-700 border-slate-600 text-slate-200' : 'bg-slate-200 border-slate-300 text-slate-700',
    trHover: isDarkMode ? 'hover:bg-slate-700/50' : 'hover:bg-slate-50',
    divide: isDarkMode ? 'divide-slate-700' : 'divide-slate-100',
    btnCancel: isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    modalOverlay: isDarkMode ? 'bg-black/70' : 'bg-slate-900/40',
  };

  useEffect(() => {
    const initAuth = async () => {
      try { await signInAnonymously(auth); } catch (e) { setFirebaseError(true); }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsubItems = onSnapshot(getItemsCol(), (snapshot) => {
      const arr = [];
      snapshot.forEach(doc => arr.push({ ...doc.data(), id: doc.id }));
      setItems(arr);
      setFirebaseError(false);
    }, () => setFirebaseError(true));

    const unsubSettings = onSnapshot(getSettingsDoc(), (docSnap) => {
      if (docSnap.exists()) {
        setSettingsOptions({
          categories: docSnap.data().categories || ['กล้อง', 'เลนส์', 'ไมโครโฟน', 'ชุดลำโพง', 'ถ่าน/แบต', 'สายไฟ', 'อื่นๆ'],
          locations: docSnap.data().locations || ['ตู้ A1', 'ห้องเก็บของ 2', 'ห้องประชุม 1', 'อื่นๆ'],
          staff: docSnap.data().staff || ['แอดมิน', 'อื่นๆ'],
          bundles: docSnap.data().bundles || []
        });
      } else {
        setDoc(getSettingsDoc(), settingsOptions).catch(console.error);
      }
    }, () => setFirebaseError(true));

    return () => { unsubItems(); unsubSettings(); };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (showAuditModal || showCommandCenter) {
      return onSnapshot(getAuditCol(), (snapshot) => {
        const arr = [];
        snapshot.forEach(doc => arr.push({ id: doc.id, ...doc.data() }));
        setAuditLogs(arr.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)));
      }, console.error);
    }
  }, [user, showAuditModal, showCommandCenter]);

  const logAction = async (actionType, targetName, details) => {
    if (!user) return;
    try { await addDoc(getAuditCol(), { timestamp: new Date().toISOString(), action: actionType, target: targetName, details: details, user: "Admin" }); } catch (e) { console.error(e); }
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const searchLower = String(searchTerm || '').trim().toLowerCase();
      const matchSearch = searchLower === '' || (item.name && String(item.name).toLowerCase().includes(searchLower)) || (item.sn && String(item.sn).toLowerCase().includes(searchLower)) || (item.location && String(item.location).toLowerCase().includes(searchLower)) || (item.owner && String(item.owner).toLowerCase().includes(searchLower)); 
      const matchDept = filterDept === 'all' || String(item.department) === String(filterDept);
      const matchCategory = filterCategory === 'all' || String(item.category) === String(filterCategory);
      const matchStatus = filterStatus === 'all' || String(item.status) === String(filterStatus);
      const matchLocation = filterLocation === 'all' || String(item.location) === String(filterLocation);
      return matchSearch && matchDept && matchCategory && matchStatus && matchLocation;
    });
    result.sort((a, b) => { try { return String(a.name || '').localeCompare(String(b.name || ''), 'th', { numeric: true }); } catch (e) { return 0; } });
    return result;
  }, [items, searchTerm, filterDept, filterCategory, filterStatus, filterLocation]);

  const todayMs = new Date().setHours(0,0,0,0);
  const overdueItems = items.filter(item => ((item.status === 'borrowed' || item.status === 'out-for-event') && item.expectedReturn && new Date(item.expectedReturn).getTime() < todayMs));

  const activeOutItems = useMemo(() => {
    const out = items.filter(item => item.status === 'borrowed' || item.status === 'out-for-event');
    out.sort((a, b) => {
      const aOver = a.expectedReturn && new Date(a.expectedReturn).getTime() < todayMs ? -1 : 1;
      const bOver = b.expectedReturn && new Date(b.expectedReturn).getTime() < todayMs ? -1 : 1;
      return aOver - bOver;
    });
    return out;
  }, [items, todayMs]);

  const selectableItems = useMemo(() => filteredItems.filter(i => i.status === 'available' || i.status === 'borrowed' || i.status === 'out-for-event'), [filteredItems]);

  const stats = useMemo(() => {
    const s = { all: 0, available: 0, inUse: 0, borrowed: 0, outForEvent: 0, maintenance: 0 };
    items.forEach(item => {
      const qty = Number(item.quantity) || 1;
      s.all += qty;
      if (s[item.status] !== undefined) s[item.status] += qty;
      if (item.status === 'out-for-event') s.outForEvent += qty;
      if (item.status === 'in-use') s.inUse += qty;
    });
    return s;
  }, [items]);

  const categoryStats = useMemo(() => {
    const catData = {};
    (settingsOptions?.categories || []).filter(c => c !== 'อื่นๆ').forEach(cat => { catData[cat] = { total: 0, available: 0 }; });
    const deptItems = items.filter(item => filterDept === 'all' || item.department === filterDept);
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
  }, [items, filterDept, settingsOptions, showEmptyCategories]);

  const activeGroups = useMemo(() => {
    const groups = {};
    items.forEach(item => {
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

  const sortedBundleItems = useMemo(() => {
    if (!showBundleManager) return [];
    const search = bundleSearchTerm.toLowerCase().trim();
    const filtered = items.filter(i => (i?.name || '').toLowerCase().includes(search) || (i?.sn && String(i.sn).toLowerCase().includes(search)));
    return filtered.sort((a, b) => {
      const aSel = (bundleForm.itemIds || []).includes(a.id);
      const bSel = (bundleForm.itemIds || []).includes(b.id);
      if (aSel && !bSel) return -1;
      if (!aSel && bSel) return 1;
      return (a.name||'').localeCompare(b.name||'', 'th', { numeric: true });
    });
  }, [items, bundleSearchTerm, bundleForm.itemIds, showBundleManager]);

  const handleSave = async () => {
    const nameInput = formData.name || '';
    const snInput = String(formData.sn || '').trim();
    if (!nameInput.trim() || !snInput) return alert('❌ กรุณากรอก "ชื่ออุปกรณ์" และ "รหัส S.N." ให้ครบถ้วน');
    if (items.some(item => item.sn && String(item.sn).trim().toLowerCase() === snInput.toLowerCase() && item.id !== formData.id)) return alert(`❌ ไม่สามารถบันทึกได้: รหัส S.N. "${snInput}" มีซ้ำอยู่ในระบบแล้ว`);

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
      let finalOwner = '';
      if (formData.isPersonalItem) {
        if (formData.owner === 'อื่นๆ') {
          if (!(formData.newOwner || '').trim()) return alert('❌ กรุณาระบุชื่อผู้ถือครอง');
          finalOwner = formData.newOwner.trim();
          currentSettings.staff = [...new Set([...(currentSettings.staff || []).filter(c => c !== 'อื่นๆ'), finalOwner, 'อื่นๆ'])];
          settingsChanged = true;
        } else if (!formData.owner) {
           return alert('❌ กรุณาเลือกชื่อผู้ถือครอง');
        } else {
          finalOwner = formData.owner;
        }
      }

      if (settingsChanged) {
         setSettingsOptions(currentSettings);
         await setDoc(getSettingsDoc(), currentSettings);
      }

      const itemData = { ...formData, category: finalCategory, location: finalLocation, owner: finalOwner, quantity: Number(formData.quantity) || 1, updatedAt: new Date().toISOString() };
      delete itemData.newCategory; delete itemData.newLocation; delete itemData.newOwner; delete itemData.isPersonalItem;
      const isEdit = !!formData.id; delete itemData.id;
      
      if (isEdit) {
        await setDoc(getItemDoc(formData.id), itemData, { merge: true });
        logAction('แก้ไขข้อมูล', itemData.name, `แก้ไขรายละเอียด S.N.: ${itemData.sn || '-'}`);
      } else {
        const newId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await setDoc(getItemDoc(newId), { ...itemData, history: [] });
        logAction('เพิ่มอุปกรณ์', itemData.name, `เพิ่มเข้าสู่ระบบใหม่ หมวดหมู่: ${itemData.category}`);
      }
      setShowForm(false);
      alert(isEdit ? '✅ แก้ไขข้อมูลอุปกรณ์สำเร็จ!' : '✅ เพิ่มอุปกรณ์ใหม่สำเร็จ!');
    } catch (error) { alert(`❌ ไม่สามารถบันทึกข้อมูลได้: ${error.message}`); }
  };

  const handleDeleteItem = async () => {
    if (!user || !itemToDelete || !itemToDelete.id) return;
    try {
      await deleteDoc(getItemDoc(itemToDelete.id));
      logAction('ลบข้อมูล', itemToDelete.name, `ลบอุปกรณ์ออกจากระบบ`);
      setItemToDelete(null);
    } catch (error) { alert(`เกิดข้อผิดพลาด: ${error.message}`); setItemToDelete(null); }
  };

  const handleOpenRowBorrow = (e, item) => {
    e.stopPropagation();
    setBorrowData({ borrower: '', borrowDate: new Date().toISOString().split('T')[0], returnDate: '', staff: '', newStaff: '', note: '' }); 
    setBorrowTargetIds([item.id]); setPackingChecklist([]);
  };

  const handleOpenRowEvent = (e, item) => {
    e.stopPropagation();
    setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' }); 
    setEventTargetIds([item.id]); setEventChecklist([]);
  };

  const checkPersonalItemsWarning = (selectedIds) => {
    const personalItems = selectedIds.map(id => items.find(i => i.id === id)).filter(i => i && i.owner);
    if (personalItems.length > 0) {
      const ownerNames = [...new Set(personalItems.map(i => i.owner))].join(', ');
      return confirm(`⚠️ คำเตือน: มี "ของประจำตัวเจ้าหน้าที่" รวมอยู่ในรายการนี้\n(ผู้ถือครอง: ${ownerNames})\n\nโปรดตรวจสอบให้แน่ใจว่าได้รับอนุญาตแล้ว ต้องการดำเนินการต่อหรือไม่?`);
    }
    return true; 
  };

  const processStaffOption = async (currentStaff, newStaff) => {
    let finalStaff = currentStaff;
    if (currentStaff === 'อื่นๆ' && (newStaff || '').trim()) {
      finalStaff = newStaff.trim();
      const updatedStaff = [...new Set([...(settingsOptions.staff || []).filter(c => c !== 'อื่นๆ'), finalStaff, 'อื่นๆ'])];
      const newSettings = { ...settingsOptions, staff: updatedStaff };
      setSettingsOptions(newSettings);
      await setDoc(getSettingsDoc(), newSettings);
    }
    return finalStaff;
  };

  const handleBorrow = async () => {
    if (!user || !borrowData.borrower || !borrowData.staff || packingChecklist.length === 0) return;
    if (!checkPersonalItemsWarning(packingChecklist)) return; 
    let finalStaff = await processStaffOption(borrowData.staff, borrowData.newStaff);
    const newHistoryEntry = { type: 'borrow', date: new Date().toISOString(), borrower: borrowData.borrower, expectedReturn: borrowData.returnDate, staffOut: finalStaff, note: borrowData.note };
    const borrowedNames = [];

    try {
      const promises = packingChecklist.map(id => {
        const item = items.find(i => i.id === id);
        if (!item || item.status !== 'available') return Promise.resolve(); 
        borrowedNames.push(item.name);
        return setDoc(getItemDoc(id), { status: 'borrowed', currentBorrower: borrowData.borrower, expectedReturn: borrowData.returnDate, currentNote: borrowData.note, history: [...(item.history || []), newHistoryEntry] }, { merge: true });
      });
      await Promise.all(promises);
      logAction('ให้ยืมอุปกรณ์', `ทำรายการ ${packingChecklist.length} ชิ้น`, `ยืมโดย: ${borrowData.borrower} (จนท: ${finalStaff})\nรายการ: ${borrowedNames.join(', ')}`);
      setBorrowTargetIds([]); setPackingChecklist([]); setSelectedItems([]); 
      alert('✅ บันทึกการยืมเรียบร้อยแล้ว!');
    } catch (error) { alert(`❌ เกิดข้อผิดพลาด: ${error.message}`); }
  };

  const handleEventOut = async () => {
    if (!user || !eventData.eventName || !eventData.staff || eventChecklist.length === 0) return;
    if (!checkPersonalItemsWarning(eventChecklist)) return;
    let finalStaff = await processStaffOption(eventData.staff, eventData.newStaff);
    const newHistoryEntry = { type: 'event', date: new Date().toISOString(), eventName: eventData.eventName, expectedReturn: eventData.returnDate, staffOut: finalStaff, note: eventData.note };
    const eventNames = [];

    try {
      const promises = eventChecklist.map(id => {
        const item = items.find(i => i.id === id);
        if (!item || item.status !== 'available') return Promise.resolve(); 
        eventNames.push(item.name);
        return setDoc(getItemDoc(id), { status: 'out-for-event', currentEvent: eventData.eventName, expectedReturn: eventData.returnDate, currentNote: eventData.note, history: [...(item.history || []), newHistoryEntry] }, { merge: true });
      });
      await Promise.all(promises);
      logAction('นำออกงาน', `ทำรายการ ${eventChecklist.length} ชิ้น`, `ชื่องาน: ${eventData.eventName} (จนท: ${finalStaff})\nรายการ: ${eventNames.join(', ')}`);
      setEventTargetIds([]); setEventChecklist([]); setSelectedItems([]); 
      alert('✅ บันทึกการนำออกงานเรียบร้อยแล้ว!');
    } catch (error) { alert(`❌ เกิดข้อผิดพลาด: ${error.message}`); }
  };

  const handleReturn = async () => {
    if (!user || !returnData.staff || returnChecklist.length === 0) return;
    let finalStaff = await processStaffOption(returnData.staff, returnData.newStaff);
    const newHistoryEntry = { type: 'return', date: new Date().toISOString(), staffIn: finalStaff };
    const returnedNames = [];

    try {
      const promises = returnChecklist.map(id => {
        const item = items.find(i => i.id === id);
        if (!item || (item.status !== 'borrowed' && item.status !== 'out-for-event')) return Promise.resolve();
        returnedNames.push(item.name);
        return setDoc(getItemDoc(id), { status: 'available', currentBorrower: null, currentEvent: null, currentNote: null, expectedReturn: null, history: [...(item.history || []), newHistoryEntry] }, { merge: true });
      });
      await Promise.all(promises);
      logAction('รับคืนอุปกรณ์', `ทำรายการ ${returnChecklist.length} ชิ้น`, `จนท.ผู้รับคืน: ${finalStaff}\nรายการ: ${returnedNames.join(', ')}`);
      setReturnTargetIds([]); setReturnChecklist([]); setSelectedItems([]); 
      alert('✅ รับคืนอุปกรณ์เรียบร้อยแล้ว!');
    } catch (error) { alert(`❌ เกิดข้อผิดพลาด: ${error.message}`); }
  };

  const handleSaveBundle = async () => {
    const bundleName = bundleForm.name || '';
    if (!user || !bundleName.trim() || (bundleForm.itemIds || []).length === 0) return alert('❌ กรุณาใส่ชื่อเซ็ต และเลือกอุปกรณ์อย่างน้อย 1 ชิ้น');
    try {
      let newBundles = bundleForm.id ? (settingsOptions.bundles || []).map(b => b.id === bundleForm.id ? { ...b, name: bundleName, itemIds: bundleForm.itemIds } : b) : [...(settingsOptions.bundles || []), { id: Date.now().toString(), name: bundleName, itemIds: bundleForm.itemIds }];
      const newSettings = { ...settingsOptions, bundles: newBundles };
      setSettingsOptions(newSettings); await setDoc(getSettingsDoc(), newSettings);
      setBundleForm({ id: null, name: '', itemIds: [] }); setBundleSearchTerm(''); setSelectedItems([]);
      alert('✅ บันทึกเซ็ตอุปกรณ์เรียบร้อยแล้ว!');
    } catch (error) { alert(`❌ บันทึกเซ็ตไม่สำเร็จ: ${error.message}`); }
  };

  const handleDeleteBundle = async (bundleId) => {
    if (!user || !confirm('ยืนยันการลบเซ็ตอุปกรณ์นี้?')) return;
    try {
      const newSettings = { ...settingsOptions, bundles: (settingsOptions.bundles || []).filter(b => b.id !== bundleId) };
      setSettingsOptions(newSettings); await setDoc(getSettingsDoc(), newSettings);
    } catch (error) { alert(`❌ ลบเซ็ตไม่สำเร็จ: ${error.message}`); }
  };

  const handleSelectBundleToBorrow = (bundle) => {
    try {
      const availableIds = (bundle.itemIds || []).filter(id => items.find(i => i.id === id)?.status === 'available');
      if (availableIds.length === 0) return alert('❌ ไม่สามารถยืมได้: อุปกรณ์ในเซ็ตนี้ถูกใช้งานไปหมดแล้ว');
      if (availableIds.length < (bundle.itemIds || []).length && !confirm(`⚠️ อุปกรณ์ในเซ็ตพร้อมใช้เพียง ${availableIds.length} ชิ้น ต้องการทำรายการเท่าที่มีหรือไม่?`)) return;
      setBorrowTargetIds([...availableIds]); setPackingChecklist([]); setBorrowData({ borrower: '', borrowDate: new Date().toISOString().split('T')[0], returnDate: '', staff: '', newStaff: '', note: '' });
      setShowBundleModal(false);
    } catch(err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const handleSelectBundleToEvent = (bundle) => {
    try {
      const availableIds = (bundle.itemIds || []).filter(id => items.find(i => i.id === id)?.status === 'available');
      if (availableIds.length === 0) return alert('❌ ไม่สามารถนำออกงานได้: อุปกรณ์ในเซ็ตนี้ถูกใช้งานไปหมดแล้ว');
      if (availableIds.length < (bundle.itemIds || []).length && !confirm(`⚠️ อุปกรณ์ในเซ็ตพร้อมใช้เพียง ${availableIds.length} ชิ้น ต้องการทำรายการเท่าที่มีหรือไม่?`)) return;
      setEventTargetIds([...availableIds]); setEventChecklist([]); setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' });
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
      setReturnTargetIds([...outIds]); setReturnChecklist([]); setReturnData({ staff: '', newStaff: '' });
      setShowBundleModal(false);
    } catch(err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const handleOpenBatchBorrow = () => {
    try {
      const validIds = selectedItems.filter(id => items.find(i => i.id === id)?.status === 'available');
      if (validIds.length === 0) return alert('❌ ไม่มีอุปกรณ์ที่พร้อมให้ยืมในรายการที่คุณเลือก\n(อุปกรณ์ต้องมีสถานะ "พร้อมใช้งาน")');
      setBorrowData({ borrower: '', borrowDate: new Date().toISOString().split('T')[0], returnDate: '', staff: '', newStaff: '', note: '' });
      setBorrowTargetIds([...validIds]); setPackingChecklist([]);
    } catch(err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const handleOpenBatchEvent = () => {
    try {
      const validIds = selectedItems.filter(id => items.find(i => i.id === id)?.status === 'available');
      if (validIds.length === 0) return alert('❌ ไม่มีอุปกรณ์ที่พร้อมออกงานในรายการที่คุณเลือก\n(อุปกรณ์ต้องมีสถานะ "พร้อมใช้งาน")');
      setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' });
      setEventTargetIds([...validIds]); setEventChecklist([]);
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
      setReturnTargetIds([...validIds]); setReturnChecklist([]);
    } catch(err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const handleCreateBundleFromSelection = () => {
    if (selectedItems.length === 0) return;
    setBundleForm({ id: null, name: '', itemIds: [...selectedItems] });
    setBundleSearchTerm(''); setShowBundleManager(true);
  };

  const handleProcessScan = (val) => {
    val = val.trim(); if (!val) return;
    const foundItem = itemsRefForScan.current.find(i => i.id === val || (i.sn && i.sn.toLowerCase() === val.toLowerCase()));
    if (foundItem) {
      setSelectedItems(prev => prev.includes(foundItem.id) ? prev : [...prev, foundItem.id]);
      setScanMessage({ text: `✅ เพิ่ม "${foundItem.name}" ลงตะกร้าแล้ว!`, type: 'success' });
    } else {
      setScanMessage({ text: `❌ ไม่พบรหัส "${val}" ในระบบ`, type: 'error' });
    }
    setScanInput(''); setTimeout(() => setScanMessage({ text: '', type: '' }), 3000);
  };

  const handleScanSubmit = (e) => {
    e.preventDefault(); handleProcessScan(scanInput);
  };

  const handleImportCSV = (e) => {
    if (!user || !e.target.files[0]) return;
    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const rows = event.target.result.split('\n').map(row => row.trim()).filter(row => row);
        if (rows.length < 2) return alert('ไฟล์ว่างเปล่า');
        let count = 0;
        for (let i = 1; i < rows.length; i++) {
          const cols = rows[i].split(',').map(c => c.trim());
          if (cols.length >= 1 && cols[0]) {
            const newId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
            await setDoc(getItemDoc(newId), { name: cols[0], sn: cols[1] || '', category: cols[2] || 'อื่นๆ', department: cols[3] || 'ภาพนิ่ง', location: cols[4] || 'อื่นๆ', quantity: Number(cols[5]) || 1, status: 'available', owner: '', updatedAt: new Date().toISOString(), history: [] });
            count++;
          }
        }
        logAction('นำเข้าข้อมูล', `เพิ่มข้อมูล ${count} ชิ้น`, `ไฟล์: ${e.target.files[0].name}`);
        alert(`✅ นำเข้าข้อมูลสำเร็จ ${count} รายการ!`); e.target.value = null; 
      } catch (err) { alert(`Error: ${err.message}`); }
    };
    reader.readAsText(e.target.files[0]);
  };

  const handleSaveSetting = async () => {
    const newSetting = newSettingItem || '';
    if (!user || !newSetting.trim()) return;
    const key = settingsTab;
    let newOptions = [...(settingsOptions[key] || [])];
    if (editingSettingItem !== null) {
      const idx = newOptions.indexOf(editingSettingItem);
      if (idx > -1) newOptions[idx] = newSetting.trim();
    } else {
      newOptions = newOptions.filter(i => i !== 'อื่นๆ'); newOptions.push(newSetting.trim(), 'อื่นๆ');
    }
    const updatedSettings = { ...settingsOptions, [key]: [...new Set(newOptions)] };
    setSettingsOptions(updatedSettings);
    try {
      await setDoc(getSettingsDoc(), updatedSettings);
      if (editingSettingItem && editingSettingItem !== newSetting.trim() && (key === 'categories' || key === 'locations')) {
        items.forEach(async (item) => {
          let updateData = {};
          if (key === 'categories' && item.category === editingSettingItem) updateData.category = newSetting.trim();
          if (key === 'locations' && item.location === editingSettingItem) updateData.location = newSetting.trim();
          if (Object.keys(updateData).length > 0) await setDoc(getItemDoc(item.id), updateData, { merge: true });
        });
      }
      setNewSettingItem(''); setEditingSettingItem(null);
    } catch (error) { alert(`❌ บันทึกตั้งค่าไม่สำเร็จ: ${error.message}`); }
  };

  const exportToCSV = () => {
    const headers = ['ชื่ออุปกรณ์', 'รหัส S.N.', 'ฝ่าย', 'หมวดหมู่', 'สถานที่', 'สถานะ', 'จำนวน', 'ผู้ยืมปัจจุบัน', 'เจ้าของ', 'อัปเดตล่าสุด'];
    const csvData = items.map(i => [ i.name, i.sn || '-', i.department, i.category || '-', i.location || '-', STATUSES.find(s=>s.id===i.status)?.label || i.status, i.quantity || 1, i.currentBorrower || i.currentEvent || '-', i.owner || '-', new Date(i.updatedAt).toLocaleDateString('th-TH') ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...csvData].map(e => e.join(",")).join("\n");
    const link = document.createElement("a"); link.href = encodeURI(csvContent); link.download = `MDEC_Stock_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link); link.click();
  };

  const handleLogin = () => {
    if (pin === ADMIN_PIN) { 
      setIsAdmin(true); 
      try { localStorage.setItem('mdec_admin', 'true'); } catch(e) {}
      setShowLogin(false); setPin(''); 
    } else { 
      alert('รหัสผ่านไม่ถูกต้อง'); setPin(''); 
    }
  };

  const handleLogout = () => {
    setIsAdmin(false); setSelectedItems([]);
    try { localStorage.removeItem('mdec_admin'); } catch(e) {}
  };

  if (showPrintModal) {
    return (
      <div className="bg-white min-h-screen font-sans text-black">
         <div className="print:hidden p-4 bg-slate-800 text-white flex justify-between items-center fixed top-0 w-full z-50 shadow-md">
            <h2 className="font-bold text-xl flex items-center gap-2"><Icons.QrCode className="w-6 h-6"/> พิมพ์ QR Code ({selectedItems.length} ดวง)</h2>
            <div className="flex gap-3"><button onClick={() => window.print()} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-colors"><Icons.Printer className="w-5 h-5"/> สั่งพิมพ์</button><button onClick={() => setShowPrintModal(false)} className="bg-slate-600 hover:bg-slate-500 px-6 py-2.5 rounded-xl font-bold transition-colors">ปิด</button></div>
         </div>
         <div className="pt-24 p-8 grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6 print:pt-0 print:p-0 print:gap-2">
           {selectedItems.map(id => {
              const item = items.find(i => i.id === id); if(!item) return null;
              return (
                 <div key={id} className="border-2 border-dashed border-gray-300 p-3 flex flex-col items-center justify-center text-center break-inside-avoid print:border-solid print:border-black print:p-2 rounded-xl print:rounded-none relative">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${item.id}`} alt="QR" className="w-24 h-24 object-contain mb-2 print:w-20 print:h-20" />
                    <span className="text-xs font-black leading-tight line-clamp-2 w-full">{item.name}</span><span className="text-[10px] font-bold text-gray-600 mt-1">{item.sn}</span>
                 </div>
              )
           })}
         </div>
      </div>
    );
  }

  if (showCommandCenter) {
    const healthPercentage = stats.all > 0 ? Math.round((stats.available / stats.all) * 100) : 0;
    return (
      <div className={`fixed inset-0 font-sans z-[10000] flex flex-col p-4 sm:p-8 overflow-hidden font-medium transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-200' : 'bg-slate-50 text-slate-800'}`}>
        <div className={`flex flex-col sm:flex-row justify-between items-center mb-6 p-4 sm:px-8 sm:py-5 rounded-3xl shadow-sm border gap-4 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
          <h1 className={`text-2xl sm:text-3xl font-black tracking-tight flex items-center gap-3 ${isDarkMode ? 'text-indigo-400' : 'text-indigo-600'}`}>
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner ${isDarkMode ? 'bg-indigo-900/50' : 'bg-indigo-100'}`}><Icons.Monitor className="w-7 h-7"/></div> ศูนย์ควบคุม MDEC ✨
          </h1>
          <div className="flex items-center gap-4 sm:gap-6">
            <div className={`text-xl sm:text-2xl font-black px-5 py-2.5 rounded-2xl border shadow-inner ${isDarkMode ? 'bg-indigo-950/50 border-indigo-900/50' : 'bg-indigo-50 border-indigo-100'}`}>{currentTime.toLocaleTimeString('th-TH')}</div>
            <button onClick={() => setShowCommandCenter(false)} className={`border px-6 py-3 rounded-2xl font-bold shadow-sm flex items-center gap-2 group ${isDarkMode ? 'bg-rose-900/30 border-rose-800 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-rose-50 border-rose-100 text-rose-600 hover:bg-rose-500 hover:text-white'}`}>ปิดหน้าต่าง <Icons.X className="w-5 h-5 group-hover:rotate-90 transition-transform" /></button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
          <div className="flex flex-col gap-6">
            <div className={`p-8 rounded-3xl flex flex-col items-center justify-center relative overflow-hidden shadow-lg ${isDarkMode ? 'bg-gradient-to-br from-blue-900/80 to-indigo-900/80' : 'bg-gradient-to-br from-blue-400 to-indigo-500'}`}>
              <h2 className="text-xl font-bold mb-2 z-10 flex items-center gap-2 text-white"><Icons.Package className="w-6 h-6"/> อุปกรณ์ทั้งหมด</h2>
              <span className="text-7xl sm:text-8xl font-black text-white z-10 drop-shadow-md">{stats.all}</span>
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-2 xl:grid-cols-2 gap-4 flex-1">
              <div className={`p-4 rounded-3xl flex flex-col items-center justify-center shadow-sm border ${isDarkMode ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100'}`}>
                <span className={`font-bold mb-1 flex items-center gap-1 ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>🟢 พร้อมใช้งาน</span><span className={`text-4xl font-black ${isDarkMode ? 'text-emerald-400' : 'text-emerald-500'}`}>{stats.available}</span>
              </div>
              <div className={`p-4 rounded-3xl flex flex-col items-center justify-center shadow-sm border ${isDarkMode ? 'bg-purple-900/20 border-purple-800/50' : 'bg-purple-50 border-purple-100'}`}>
                <span className={`font-bold mb-1 flex items-center gap-1 ${isDarkMode ? 'text-purple-400' : 'text-purple-600'}`}>🟣 กำลังถูกยืม</span><span className={`text-4xl font-black ${isDarkMode ? 'text-purple-400' : 'text-purple-500'}`}>{stats.borrowed}</span>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className={`p-8 rounded-3xl flex-1 flex flex-col items-center justify-center shadow-sm relative overflow-hidden border ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
              <h2 className={`text-xl font-bold mb-6 flex items-center gap-2 z-10 ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>💖 สุขภาพสต๊อก (ความพร้อม)</h2>
              <div className={`relative w-56 h-56 rounded-full border-[12px] flex items-center justify-center shadow-inner z-10 ${isDarkMode ? 'border-slate-950' : 'border-slate-50'}`} style={{ background: `conic-gradient(#10b981 ${healthPercentage * 3.6}deg, transparent 0)` }}>
                <div className={`absolute inset-4 rounded-full flex flex-col items-center justify-center shadow-sm border ${isDarkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-50 text-slate-800'}`}>
                  <span className="text-5xl font-black">{healthPercentage}%</span>
                </div>
              </div>
            </div>
            
            {activeOutItems.length > 0 ? (
              <div className={`border p-5 rounded-3xl flex-1 flex flex-col shadow-sm ${isDarkMode ? 'bg-slate-800/50 border-slate-700' : 'bg-white border-slate-200'}`}>
                <h3 className={`font-black mb-3 flex items-center gap-2 text-lg ${isDarkMode ? 'text-slate-200' : 'text-slate-800'}`}><Icons.Users className="w-6 h-6" /> รายการกำลังยืม / ออกงาน ({activeOutItems.length})</h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {activeOutItems.map(i => {
                    const isOver = i.expectedReturn && new Date(i.expectedReturn).getTime() < todayMs;
                    return (
                    <div key={i.id} className={`px-4 py-3 rounded-2xl border shadow-sm flex justify-between items-center ${isOver ? (isDarkMode ? 'bg-rose-900/30 border-rose-800 text-rose-300' : 'bg-rose-50 border-rose-200 text-rose-700') : (isDarkMode ? 'bg-slate-800/50 border-slate-700 text-slate-300' : 'bg-slate-50 border-slate-100 text-slate-700')}`}>
                      <div className="flex flex-col"><span className="font-bold">{i.name}</span><span className="text-xs">คืน: {new Date(i.expectedReturn).toLocaleDateString('th-TH')}</span></div>
                      <span className="text-sm font-bold">{i.currentBorrower || i.currentEvent}</span>
                    </div>
                  )})}
                </div>
              </div>
            ) : (
              <div className={`border p-5 rounded-3xl flex-1 flex items-center justify-center ${isDarkMode ? 'bg-emerald-900/10 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100'}`}><span className={`font-black text-xl ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>ไม่มีการยืมหรือออกงานในขณะนี้ 🎉</span></div>
            )}
          </div>

          <div className={`border p-6 rounded-3xl flex flex-col h-full overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
            <h2 className={`text-xl font-black mb-4 flex items-center gap-2 p-3 rounded-2xl ${isDarkMode ? 'bg-indigo-900/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}><Icons.ClipboardList className="w-6 h-6"/> ประวัติการเคลื่อนไหว</h2>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-3">
              {auditLogs.slice(0, 30).map(log => (
                  <div key={log.id} className={`p-3.5 rounded-2xl border ${isDarkMode ? 'bg-slate-800/50 border-slate-700 text-white' : 'bg-slate-50 border-slate-100'}`}>
                    <div className="text-xs font-bold mb-1 opacity-70">{new Date(log.timestamp).toLocaleTimeString('th-TH')} - {log.action}</div>
                    <div className="text-sm font-bold">{log.target}</div>
                  </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen font-sans p-4 sm:p-8 pb-32 transition-colors duration-300 ${theme.mainBg} ${theme.textMain}`}>
      {firebaseError && <div className="w-full mb-6 bg-rose-100 border-l-4 border-rose-500 text-rose-800 p-5 rounded-r-xl shadow-md"><h3 className="font-black text-xl">🚨 ฐานข้อมูลถูกระงับ</h3><p>โปรดตรวจสอบการตั้งค่า Rules Firebase</p></div>}

      {/* Header */}
      <div className={`w-full flex flex-col xl:flex-row justify-between items-center mb-8 gap-4 p-6 rounded-2xl shadow-md border ${theme.cardBg}`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Icons.Package className="w-8 h-8" /></div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.textTitle}`}>MDEC-Stock <span className="text-xs sm:text-sm font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg ml-2 border border-blue-200">v20.6 BYOD (Pro)</span></h1>
            <p className={`font-medium text-sm sm:text-base ${theme.textMuted}`}>ระบบจัดการสต๊อก ศูนย์มัลติมีเดีย</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full xl:w-auto">
          <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className={`p-3 font-bold rounded-xl shadow-sm ${theme.btnCancel}`}>{isDarkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}</button>

          {isAdmin && (
            <>
              <button type="button" onClick={() => setShowScanModal(true)} className={`px-4 py-3 font-black rounded-xl flex items-center gap-2 shadow-md ${isDarkMode ? 'bg-amber-600 hover:bg-amber-500 text-white' : 'bg-amber-500 hover:bg-amber-600 text-white'}`}><Icons.QrCode className="w-5 h-5" /><span className="hidden sm:inline">สแกน</span></button>
              <button type="button" onClick={() => setShowCommandCenter(true)} className={`px-4 py-3 font-bold rounded-xl flex items-center gap-2 ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400 border border-emerald-800' : 'bg-emerald-50 text-emerald-600'}`}><Icons.Monitor className="w-5 h-5" /><span className="hidden sm:inline">Dashboard</span></button>
              <button type="button" onClick={() => { setBundleForm({ id: null, name: '', itemIds: [] }); setBundleSearchTerm(''); setShowBundleManager(true); }} className={`px-6 py-4 font-black rounded-xl shadow-md text-lg flex items-center gap-2 ${isDarkMode ? 'bg-fuchsia-600 text-white' : 'bg-fuchsia-600 text-white'}`}><Icons.Layers className="w-5 h-5" /> จัดการเซ็ต</button>
              {(settingsOptions.bundles && settingsOptions.bundles.length > 0) && (
                <button type="button" onClick={() => setShowBundleModal(true)} className={`px-6 py-4 font-black rounded-xl shadow-md text-lg flex items-center gap-2 ${isDarkMode ? 'bg-purple-600 text-white' : 'bg-purple-600 text-white'}`}><Icons.Package className="w-5 h-5" /> ใช้งานเซ็ต</button>
              )}
              <button type="button" onClick={() => setShowPersonalItemsModal(true)} className={`px-6 py-4 font-black rounded-xl shadow-md text-lg flex items-center gap-2 ${isDarkMode ? 'bg-pink-600 text-white' : 'bg-pink-600 text-white'}`}><Icons.Tag className="w-5 h-5" /> ของประจำตัว</button>
              <button type="button" onClick={() => setShowQuickReturnModal(true)} className={`px-6 py-4 font-black rounded-xl shadow-md text-lg flex items-center gap-2 ${isDarkMode ? 'bg-indigo-600 text-white' : 'bg-indigo-600 text-white'}`}><Icons.Users className="w-5 h-5" /> ติดตามของรอคืน</button>
              <button type="button" onClick={() => setShowAuditModal(true)} className={`px-4 py-3 font-bold rounded-xl flex items-center gap-2 shadow-sm ${theme.btnCancel}`}><Icons.ClipboardList className="w-5 h-5" /><span className="hidden sm:inline">ดูประวัติ</span></button>
              <button type="button" onClick={() => { setSettingsTab('categories'); setShowSettings(true); }} className={`px-4 py-3 font-bold rounded-xl flex items-center gap-2 shadow-sm ${theme.btnCancel}`}><Icons.Settings className="w-5 h-5" /><span className="hidden sm:inline">ตั้งค่า</span></button>
              <button type="button" onClick={handleLogout} className={`px-4 py-3 font-bold rounded-xl flex items-center gap-2 ${isDarkMode ? 'bg-rose-900/40 text-rose-400 border border-rose-800' : 'bg-rose-50 text-rose-600'}`}><Icons.Unlock className="w-5 h-5" /></button>
            </>
          )}
          {!isAdmin && <button type="button" onClick={() => setShowLogin(true)} className={`px-5 py-3 font-bold rounded-xl flex items-center gap-2 shadow-md ${isDarkMode ? 'bg-blue-600 text-white' : 'bg-slate-800 text-white'}`}><Icons.Lock className="w-5 h-5" /> เข้าสู่ระบบ</button>}
        </div>
      </div>

      <div className="w-full grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-blue-500 flex flex-col items-center ${theme.cardBg}`}><span className={theme.textMuted}>ทั้งหมด</span><span className="text-4xl font-black text-blue-500">{stats.all}</span></div>
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-emerald-500 flex flex-col items-center ${theme.cardBg}`}><span className={theme.textMuted}>พร้อมใช้งาน</span><span className="text-4xl font-black text-emerald-500">{stats.available}</span></div>
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-amber-500 flex flex-col items-center ${theme.cardBg}`}><span className={theme.textMuted}>กำลังใช้งาน</span><span className="text-4xl font-black text-amber-500">{stats.inUse}</span></div>
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-purple-500 flex flex-col items-center ${theme.cardBg}`}><span className={theme.textMuted}>กำลังถูกยืม</span><span className="text-4xl font-black text-purple-500">{stats.borrowed}</span></div>
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-orange-500 flex flex-col items-center ${theme.cardBg}`}><span className={theme.textMuted}>ออกงาน</span><span className="text-4xl font-black text-orange-500">{stats.outForEvent}</span></div>
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-rose-500 flex flex-col items-center ${theme.cardBg}`}><span className={theme.textMuted}>ส่งซ่อม/ชำรุด</span><span className="text-4xl font-black text-rose-500">{stats.maintenance}</span></div>
      </div>

      <div className="w-full flex justify-end mb-2 pr-2">
        <button onClick={() => setShowEmptyCategories(!showEmptyCategories)} className={`text-sm font-bold flex items-center gap-1 ${theme.textMuted}`}><Icons.Eye className="w-4 h-4"/> สลับแสดงหมวดหมู่ว่าง</button>
      </div>
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
        {categoryStats.map(c => (
          <div key={c.label} className={`p-4 rounded-xl shadow-sm border flex flex-col ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-2"><span className={`font-bold truncate ${theme.textTitle}`}>{c.label}</span></div>
            <div className="flex justify-between items-baseline mb-2"><div><span className={`text-3xl font-black ${theme.textTitle}`}>{c.data.total}</span></div><span className="text-2xl font-bold text-emerald-500">{c.data.available}</span></div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}><div className="bg-emerald-500 h-full" style={{ width: `${c.data.total === 0 ? 0 : (c.data.available / c.data.total) * 100}%` }}></div></div>
          </div>
        ))}
      </div>

      <div className={`w-full flex flex-col gap-4 p-5 sm:p-6 rounded-2xl shadow-md border mb-6 ${theme.cardBg}`}>
        <div className="flex flex-col xl:flex-row gap-4 items-center w-full">
          <input type="text" className={`flex-1 w-full px-4 py-4 rounded-xl font-bold border ${theme.input}`} placeholder="ค้นหาชื่อ, รหัส..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            <select className={`flex-1 px-4 py-4 rounded-xl font-bold border ${theme.input}`} value={filterLocation} onChange={e => setFilterLocation(e.target.value)}><option value="all">สถานที่ ทั้งหมด</option>{settingsOptions.locations.filter(c=>c!=='อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}</select>
            <select className={`flex-1 px-4 py-4 rounded-xl font-bold border ${theme.input}`} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}><option value="all">หมวดหมู่ทั้งหมด</option>{settingsOptions.categories.filter(c=>c!=='อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}</select>
          </div>
          {isAdmin && <button onClick={() => { setFormData({ id: '', name: '', sn: '', department: 'ภาพนิ่ง', category: '', location: '', status: 'available', quantity: 1, owner: '', isPersonalItem: false }); setShowForm(true); }} className="px-6 py-4 font-black rounded-xl shadow-md bg-blue-600 text-white flex items-center gap-2"><Icons.Plus className="w-5 h-5" /> เพิ่มอุปกรณ์</button>}
        </div>
      </div>

      {/* 📋 Table */}
      <div className={`w-full rounded-2xl shadow-md border overflow-hidden ${theme.cardBg}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`border-b text-lg ${theme.th}`}>
                {isAdmin && <th className="px-4 py-4 text-center w-14"><input type="checkbox" className="w-5 h-5 accent-indigo-600" onChange={e => setSelectedItems(e.target.checked ? selectableItems.map(i=>i.id) : [])} checked={selectableItems.length > 0 && selectableItems.every(i => selectedItems.includes(i.id))}/></th>}
                <th className="px-4 py-4 font-bold pl-6">ชื่ออุปกรณ์ / รหัส</th><th className="px-4 py-4 font-bold">หมวดหมู่</th><th className="px-4 py-4 font-bold">สถานะ</th><th className="px-4 py-4 text-center font-bold">จัดการ</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${theme.divide}`}>
              {filteredItems.length === 0 ? <tr><td colSpan={6} className={`px-4 py-12 text-center font-bold text-xl ${theme.textMuted}`}>ไม่พบข้อมูล</td></tr> : filteredItems.map((item, idx) => {
                const sInfo = STATUSES.find(s => s.id === item.status) || STATUSES[0];
                return (
                  <tr key={item.id} className={`text-lg ${theme.trHover}`}>
                    {isAdmin && <td className="px-4 py-4 text-center"><input type="checkbox" className="w-5 h-5 accent-indigo-600" checked={selectedItems.includes(item.id)} onChange={() => setSelectedItems(p => p.includes(item.id) ? p.filter(id => id !== item.id) : [...p, item.id])} /></td>}
                    <td className="px-4 py-4 pl-6">
                      <div className={`font-bold text-xl flex items-center gap-2 flex-wrap ${theme.textTitle}`}>
                        {item.name} {item.owner && <span className="text-sm px-2 py-1 rounded-md bg-fuchsia-100 text-fuchsia-700">👤 {item.owner}</span>}
                      </div>
                      {item.sn && <div className={`text-base mt-1 font-mono ${theme.textMuted}`}>S.N.: {item.sn}</div>}
                    </td>
                    <td className={`px-4 py-4 font-bold ${theme.textMuted}`}>{item.category}</td>
                    <td className="px-4 py-4"><span className={`px-3 py-1.5 rounded-lg text-base font-bold border ${isDarkMode ? sInfo.darkColor : sInfo.color}`}>{sInfo.label}</span></td>
                    <td className="px-4 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button onClick={(e) => { e.stopPropagation(); setShowHistory(item.id); }} className={`w-10 h-10 rounded-xl flex items-center justify-center ${theme.btnCancel}`}><Icons.History className="w-5 h-5"/></button>
                        {isAdmin && <>
                          {item.status === 'available' && <button onClick={(e) => handleOpenRowBorrow(e, item)} className="w-10 h-10 rounded-xl flex items-center justify-center bg-purple-100 text-purple-600"><Icons.UserPlus className="w-5 h-5"/></button>}
                          {(item.status === 'borrowed' || item.status === 'out-for-event') && <button onClick={(e) => { e.stopPropagation(); setReturnData({staff:''}); setReturnTargetIds([item.id]); setReturnChecklist([]); }} className="w-10 h-10 rounded-xl flex items-center justify-center bg-emerald-100 text-emerald-600"><Icons.CheckCircle className="w-5 h-5"/></button>}
                          <button onClick={(e) => { e.stopPropagation(); setFormData({...item, isPersonalItem: !!item.owner}); setShowForm(true); }} className="w-10 h-10 rounded-xl flex items-center justify-center bg-blue-100 text-blue-600"><Icons.Edit className="w-4 h-4"/></button>
                          <button onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }} className="w-10 h-10 rounded-xl flex items-center justify-center bg-rose-100 text-rose-600"><Icons.Trash className="w-4 h-4"/></button>
                        </>}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {isAdmin && selectedItems.length > 0 && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 backdrop-blur-xl px-4 py-4 sm:px-6 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex items-center gap-4 sm:gap-6 z-40 w-[95%] max-w-4xl justify-between border-2 ${isDarkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/90 border-slate-100 text-slate-800'}`}>
          <div className="flex items-center gap-3 shrink-0"><div className="bg-indigo-600 text-white font-black w-10 h-10 rounded-full flex items-center justify-center shadow-inner text-lg">{selectedItems.length}</div><span className="font-bold text-lg hidden lg:inline">รายการที่เลือก</span></div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto custom-scrollbar">
            <button onClick={() => setShowPrintModal(true)} className="px-4 py-3 bg-slate-800 text-white rounded-2xl font-bold shadow-md flex items-center gap-2"><Icons.QrCode className="w-5 h-5"/> พิมพ์ QR</button>
            <button onClick={handleCreateBundleFromSelection} className="px-4 py-3 bg-blue-600 text-white rounded-2xl font-bold shadow-md flex items-center gap-2"><Icons.Layers className="w-5 h-5"/> จัดเซ็ต</button>
            <button onClick={handleOpenBatchBorrow} className="px-4 py-3 bg-purple-600 text-white rounded-2xl font-bold shadow-md flex items-center gap-2"><Icons.UserPlus className="w-5 h-5"/> ยืมออก</button>
            <button onClick={handleOpenBatchEvent} className="px-4 py-3 bg-orange-600 text-white rounded-2xl font-bold shadow-md flex items-center gap-2"><Icons.Truck className="w-5 h-5"/> ออกงาน</button>
            <button onClick={handleOpenBatchReturn} className="px-4 py-3 bg-emerald-600 text-white rounded-2xl font-bold shadow-md flex items-center gap-2"><Icons.CheckCircle className="w-5 h-5"/> รับคืน</button>
            <button onClick={() => setSelectedItems([])} className={`px-4 py-3 rounded-2xl font-bold border shrink-0 ${theme.btnCancel}`}><Icons.X className="w-5 h-5"/></button>
          </div>
        </div>
      )}

      {/* MODALS */}
      {showPersonalItemsModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.Tag className="w-6 h-6 text-pink-500"/> ของประจำตัวเจ้าหน้าที่</h3>
              <button onClick={() => setShowPersonalItemsModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {(() => {
                const groups = {};
                let totalPersonalItems = 0;
                items.forEach(item => {
                  if (item.owner) {
                    if (!groups[item.owner]) groups[item.owner] = [];
                    groups[item.owner].push(item); totalPersonalItems++;
                  }
                });
                const ownerKeys = Object.keys(groups).sort();
                if (ownerKeys.length === 0) return <div className={`text-center py-10 font-bold ${theme.textMuted}`}>ไม่มีของประจำตัวในระบบ</div>;
                return ownerKeys.map(owner => (
                  <div key={owner} className={`p-5 rounded-2xl border ${theme.cardBg}`}>
                    <div className="flex items-center gap-2 mb-3"><Icons.Users className="w-6 h-6 text-pink-500" /><h4 className="text-xl font-black">{owner} ({groups[owner].length} ชิ้น)</h4></div>
                    <div className="space-y-1.5">{groups[owner].map(i => <div key={i.id} className="text-sm border-b pb-1">- {i.name} ({i.sn})</div>)}</div>
                  </div>
                ));
              })()}
            </div>
          </div>
        </div>
      )}

      {showQuickReturnModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.Users className="w-6 h-6 text-indigo-500"/> ติดตามสถานะ & รับคืน</h3>
              <button onClick={() => setShowQuickReturnModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {activeGroups.length === 0 ? <div className={`text-center py-10 font-bold ${theme.textMuted}`}>ไม่มีอุปกรณ์รอรับคืน</div> : activeGroups.map((group, idx) => (
                <div key={idx} className={`p-5 rounded-2xl border flex flex-col lg:flex-row justify-between gap-4 ${theme.cardBg}`}>
                  <div>
                    <h4 className="text-xl font-black">{group.type === 'event' ? 'ออกงาน: ' : 'ผู้ยืม: '} {group.name}</h4>
                    <div className="text-sm text-slate-500">{group.ids.length} ชิ้น</div>
                  </div>
                  <button onClick={() => { setReturnTargetIds([...group.ids]); setReturnChecklist([]); setReturnData({ staff: '', newStaff: '' }); setShowQuickReturnModal(false); }} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold">รับคืนกลุ่มนี้</button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showAuditModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.ClipboardList className="w-6 h-6 text-blue-500"/> ประวัติการทำงาน</h3>
              <button onClick={() => setShowAuditModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {auditLogs.length === 0 ? <div className={`text-center py-10 font-bold ${theme.textMuted}`}>ยังไม่มีประวัติการทำงาน</div> : auditLogs.map(log => (
                <div key={log.id} className={`p-4 rounded-xl border ${theme.cardBg}`}>
                  <div className="text-sm font-bold text-slate-500">{new Date(log.timestamp).toLocaleString('th-TH')} - {log.action}</div>
                  <div className="text-lg font-bold">{log.target}</div>
                  <div className="text-sm mt-1">{log.details}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showSettings && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] ${theme.cardBg}`}>
            <div className={`flex border-b overflow-x-auto ${theme.divide}`}>
              <button onClick={() => {setSettingsTab('categories'); setEditingSettingItem(null); setNewSettingItem('');}} className={`flex-1 px-4 py-4 font-bold border-b-2 ${settingsTab === 'categories' ? 'text-blue-500 border-blue-500' : 'border-transparent'}`}>หมวดหมู่</button>
              <button onClick={() => {setSettingsTab('locations'); setEditingSettingItem(null); setNewSettingItem('');}} className={`flex-1 px-4 py-4 font-bold border-b-2 ${settingsTab === 'locations' ? 'text-blue-500 border-blue-500' : 'border-transparent'}`}>สถานที่</button>
              <button onClick={() => {setSettingsTab('staff'); setEditingSettingItem(null); setNewSettingItem('');}} className={`flex-1 px-4 py-4 font-bold border-b-2 ${settingsTab === 'staff' ? 'text-blue-500 border-blue-500' : 'border-transparent'}`}>เจ้าหน้าที่</button>
              <button onClick={() => {setSettingsTab('database'); setEditingSettingItem(null); setNewSettingItem('');}} className={`flex-1 px-4 py-4 font-bold border-b-2 ${settingsTab === 'database' ? 'text-emerald-500 border-emerald-500' : 'border-transparent'}`}>ระบบ</button>
            </div>
            <div className="flex-1 overflow-y-auto p-6">
              {settingsTab === 'database' ? (
                <div className="space-y-4">
                  <button onClick={exportToCSV} className="w-full py-3 bg-emerald-600 text-white font-bold rounded-xl flex justify-center items-center gap-2"><Icons.Download className="w-5 h-5"/> โหลดไฟล์ CSV (Backup)</button>
                  <div className="border-t pt-4 mt-4">
                    <input type="file" accept=".csv" className="hidden" ref={fileInputRef} onChange={handleImportCSV} />
                    <button onClick={() => fileInputRef.current?.click()} className="w-full py-3 bg-blue-600 text-white font-bold rounded-xl flex justify-center items-center gap-2"><Icons.Upload className="w-5 h-5"/> นำเข้าข้อมูล (Import CSV)</button>
                  </div>
                </div>
              ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    <input type="text" className={`flex-1 px-4 py-3 rounded-xl border ${theme.input}`} placeholder="เพิ่มรายการใหม่..." value={newSettingItem} onChange={e => setNewSettingItem(e.target.value)} />
                    <button onClick={handleSaveSetting} className="px-6 py-3 bg-blue-600 text-white font-bold rounded-xl">{editingSettingItem !== null ? 'บันทึก' : 'เพิ่ม'}</button>
                  </div>
                  <div className="space-y-2">
                    {(settingsOptions[settingsTab] || []).filter(c => c !== 'อื่นๆ').map((item, index) => (
                      <div key={index} className={`flex justify-between items-center p-3 border rounded-xl ${theme.btnSecondary}`}>
                        <span className="font-bold">{item}</span>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingSettingItem(item); setNewSettingItem(item); }} className="p-2 text-blue-500 hover:bg-blue-100 rounded-lg"><Icons.Edit className="w-4 h-4"/></button>
                          <button onClick={() => setDeleteSettingConfirm(item)} className="p-2 text-rose-500 hover:bg-rose-100 rounded-lg"><Icons.Trash className="w-4 h-4"/></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
            <div className={`p-4 border-t ${theme.divide}`}>
              <button onClick={() => setShowSettings(false)} className={`w-full py-4 font-bold rounded-xl ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {deleteSettingConfirm !== null && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl ${theme.cardBg}`}>
            <h3 className="text-2xl font-black mb-2">ยืนยันการลบ?</h3>
            <p className="mb-6">รายการ "{deleteSettingConfirm}" จะถูกลบ</p>
            <div className="flex gap-3"><button onClick={() => setDeleteSettingConfirm(null)} className={`flex-1 py-3 rounded-xl ${theme.btnCancel}`}>ยกเลิก</button><button onClick={handleDeleteSetting} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold">ลบ</button></div>
          </div>
        </div>
      )}

      {/* Add/Edit Form Modal */}
      {showForm && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl ${theme.cardBg}`}>
            <h3 className={`text-2xl font-black mb-6 ${theme.textTitle}`}>{formData.id ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 flex items-center gap-3 p-3 border rounded-xl">
                <input type="checkbox" className="w-5 h-5 accent-fuchsia-500 rounded" checked={formData.isPersonalItem} onChange={e => setFormData({...formData, isPersonalItem: e.target.checked, owner: e.target.checked ? formData.owner : '', newOwner: ''})} />
                <span className="font-bold text-lg">เป็นของประจำตัวเจ้าหน้าที่</span>
              </div>
              {formData.isPersonalItem && (
                <div className="sm:col-span-2 space-y-3">
                  <select className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} value={formData.owner || ''} onChange={e => setFormData({...formData, owner: e.target.value, newOwner: e.target.value !== 'อื่นๆ' ? '' : formData.newOwner})}><option value="" disabled>-- เลือกชื่อผู้ถือครอง --</option>{(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}</select>
                  {formData.owner === 'อื่นๆ' && <input type="text" className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} placeholder="ระบุชื่อผู้ถือครองใหม่..." value={formData.newOwner || ''} onChange={e => setFormData({...formData, newOwner: e.target.value})} />}
                </div>
              )}
              <div className="sm:col-span-2"><label className="block font-bold mb-1">ชื่ออุปกรณ์ *</label><input type="text" className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} /></div>
              <div><label className="block font-bold mb-1">รหัส S.N. *</label><input type="text" className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} value={formData.sn || ''} onChange={e => setFormData({...formData, sn: e.target.value})} /></div>
              <div><label className="block font-bold mb-1">จำนวนชิ้น</label><input type="number" min="1" className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} value={formData.quantity || 1} onChange={e => setFormData({...formData, quantity: e.target.value})} /></div>
              <div><label className="block font-bold mb-1">ฝ่ายรับผิดชอบ</label><select className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} value={formData.department || ''} onChange={e => setFormData({...formData, department: e.target.value})}>{DEPARTMENTS.map(d=><option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
              <div><label className="block font-bold mb-1">สถานะ</label><select className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>{STATUSES.map(s=><option key={s.id} value={s.id}>{s.label}</option>)}</select></div>
              <div><label className="block font-bold mb-1">หมวดหมู่</label><select className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} value={formData.category || ''} onChange={e => setFormData({...formData, category: e.target.value, newCategory: e.target.value !== 'อื่นๆ' ? '' : formData.newCategory})}><option value="" disabled>-- เลือก --</option>{settingsOptions.categories.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              <div><label className="block font-bold mb-1">สถานที่เก็บ</label><select className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} value={formData.location || ''} onChange={e => setFormData({...formData, location: e.target.value, newLocation: e.target.value !== 'อื่นๆ' ? '' : formData.newLocation})}><option value="" disabled>-- เลือก --</option>{settingsOptions.locations.map(c=><option key={c} value={c}>{c}</option>)}</select></div>
              {formData.category === 'อื่นๆ' && <div className="sm:col-span-2"><input type="text" className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} placeholder="หมวดหมู่ใหม่..." value={formData.newCategory || ''} onChange={e => setFormData({...formData, newCategory: e.target.value})} /></div>}
              {formData.location === 'อื่นๆ' && <div className="sm:col-span-2"><input type="text" className={`w-full px-4 py-3 rounded-xl border ${theme.input}`} placeholder="สถานที่ใหม่..." value={formData.newLocation || ''} onChange={e => setFormData({...formData, newLocation: e.target.value})} /></div>}
            </div>
            <div className="flex gap-3 mt-6"><button onClick={() => setShowForm(false)} className={`flex-1 py-4 font-bold rounded-xl ${theme.btnCancel}`}>ยกเลิก</button><button onClick={handleSave} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl">บันทึก</button></div>
          </div>
        </div>
      )}

      {/* Modals for Borrow/Event/Return */}
      {borrowTargetIds.length > 0 && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl ${theme.cardBg}`}>
            <h3 className="text-2xl font-black mb-4">บันทึกการยืม</h3>
            <input type="text" className={`w-full mb-3 px-4 py-3 border rounded-xl ${theme.input}`} placeholder="ชื่อผู้ยืม *" onChange={e => setBorrowData({...borrowData, borrower: e.target.value})} />
            <select className={`w-full mb-3 px-4 py-3 border rounded-xl ${theme.input}`} onChange={e => setBorrowData({...borrowData, staff: e.target.value})}><option value="">-- เลือกเจ้าหน้าที่ * --</option>{settingsOptions.staff.map(s=><option key={s} value={s}>{s}</option>)}</select>
            {borrowData.staff === 'อื่นๆ' && <input type="text" className={`w-full mb-3 px-4 py-3 border rounded-xl ${theme.input}`} placeholder="ชื่อเจ้าหน้าที่ใหม่..." onChange={e => setBorrowData({...borrowData, newStaff: e.target.value})} />}
            <input type="date" className={`w-full mb-3 px-4 py-3 border rounded-xl ${theme.input}`} onChange={e => setBorrowData({...borrowData, returnDate: e.target.value})} />
            <textarea className={`w-full mb-4 px-4 py-3 border rounded-xl resize-none ${theme.input}`} rows="2" placeholder="หมายเหตุ" onChange={e => setBorrowData({...borrowData, note: e.target.value})}></textarea>
            <div className="flex gap-3"><button onClick={()=>setBorrowTargetIds([])} className={`flex-1 py-3 rounded-xl ${theme.btnCancel}`}>ยกเลิก</button><button onClick={handleBorrow} className="flex-1 py-3 bg-purple-600 text-white rounded-xl font-bold">ยืนยันการยืม</button></div>
          </div>
        </div>
      )}

      {eventTargetIds.length > 0 && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl ${theme.cardBg}`}>
            <h3 className="text-2xl font-black mb-4">บันทึกการออกงาน</h3>
            <input type="text" className={`w-full mb-3 px-4 py-3 border rounded-xl ${theme.input}`} placeholder="ชื่องาน / โปรเจกต์ *" onChange={e => setEventData({...eventData, eventName: e.target.value})} />
            <select className={`w-full mb-3 px-4 py-3 border rounded-xl ${theme.input}`} onChange={e => setEventData({...eventData, staff: e.target.value})}><option value="">-- เลือกผู้รับผิดชอบ * --</option>{settingsOptions.staff.map(s=><option key={s} value={s}>{s}</option>)}</select>
            {eventData.staff === 'อื่นๆ' && <input type="text" className={`w-full mb-3 px-4 py-3 border rounded-xl ${theme.input}`} placeholder="ชื่อผู้รับผิดชอบใหม่..." onChange={e => setEventData({...eventData, newStaff: e.target.value})} />}
            <input type="date" className={`w-full mb-3 px-4 py-3 border rounded-xl ${theme.input}`} onChange={e => setEventData({...eventData, returnDate: e.target.value})} />
            <textarea className={`w-full mb-4 px-4 py-3 border rounded-xl resize-none ${theme.input}`} rows="2" placeholder="สถานที่ / หมายเหตุ" onChange={e => setEventData({...eventData, note: e.target.value})}></textarea>
            <div className="flex gap-3"><button onClick={()=>setEventTargetIds([])} className={`flex-1 py-3 rounded-xl ${theme.btnCancel}`}>ยกเลิก</button><button onClick={handleEventOut} className="flex-1 py-3 bg-orange-600 text-white rounded-xl font-bold">ยืนยันนำออกงาน</button></div>
          </div>
        </div>
      )}

      {returnTargetIds.length > 0 && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl ${theme.cardBg}`}>
            <h3 className="text-2xl font-black mb-4">บันทึกการรับคืน</h3>
            <select className={`w-full mb-4 px-4 py-3 border rounded-xl ${theme.input}`} onChange={e => setReturnData({...returnData, staff: e.target.value})}><option value="">-- เลือกเจ้าหน้าที่รับคืน * --</option>{settingsOptions.staff.map(s=><option key={s} value={s}>{s}</option>)}</select>
            {returnData.staff === 'อื่นๆ' && <input type="text" className={`w-full mb-3 px-4 py-3 border rounded-xl ${theme.input}`} placeholder="ชื่อเจ้าหน้าที่ใหม่..." onChange={e => setReturnData({...returnData, newStaff: e.target.value})} />}
            <div className="flex gap-3"><button onClick={()=>setReturnTargetIds([])} className={`flex-1 py-3 rounded-xl ${theme.btnCancel}`}>ยกเลิก</button><button onClick={handleReturn} className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold">ยืนยันรับคืน</button></div>
          </div>
        </div>
      )}

      {showScanModal && (<div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}><div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl relative flex flex-col max-h-[90vh] ${theme.cardBg}`}><style>{`#qr-reader button{background:#f59e0b;color:#white;border:none;padding:8px 16px;border-radius:8px;font-weight:bold;cursor:pointer;margin:5px} #qr-reader select{padding:8px;border-radius:8px;margin:5px;border:1px solid #ccc;color:#000} #qr-reader{border:none!important} #qr-reader__dashboard_section_csr span{color:inherit!important}`}</style><button onClick={()=>{setShowScanModal(false);setUseCamera(false);}} className="absolute top-4 right-4 p-3 hover:text-rose-500 z-50"><Icons.X className="w-6 h-6"/></button><div className="flex-1 overflow-y-auto"><h3 className="text-2xl font-black mb-4 flex justify-center items-center gap-2"><Icons.QrCode className="w-8 h-8 text-amber-500"/> สแกน QR Code</h3><div className="flex justify-center gap-2 mb-4"><button onClick={()=>setUseCamera(false)} className={`px-4 py-2 font-bold rounded-xl ${!useCamera?'bg-amber-500 text-white':theme.btnSecondary}`}>⌨️ พิมพ์</button><button onClick={()=>setUseCamera(true)} className={`px-4 py-2 font-bold rounded-xl ${useCamera?'bg-amber-500 text-white':theme.btnSecondary}`}>📷 กล้อง</button></div>{!useCamera?(<form onSubmit={handleScanSubmit}><input type="text" ref={scanInputRef} className={`w-full px-4 py-4 rounded-xl font-bold text-center text-xl border focus:border-amber-500 ${theme.input}`} placeholder="สแกนรหัส..." value={scanInput} onChange={e=>setScanInput(e.target.value)} autoFocus/><button type="submit" className="hidden"></button></form>):(<div className="w-full min-h-[300px] flex items-center justify-center">{!isScannerLoaded?<div className="animate-pulse font-bold text-amber-500">โหลดกล้อง...</div>:<div id="qr-reader" className="w-full rounded-xl overflow-hidden shadow-inner border-2 border-amber-500/30"></div>}</div>)}<div className="h-10 mt-4 flex items-center justify-center">{scanMessage.text && <span className={`font-bold px-5 py-2 rounded-full text-white ${scanMessage.type==='success'?'bg-emerald-500':'bg-rose-500'}`}>{scanMessage.text}</span>}</div></div></div></div>)}

      {showBundleManager && (<div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}><div className={`rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] overflow-hidden ${theme.cardBg}`}><div className={`flex justify-between items-center p-6 border-b shrink-0 ${theme.divide}`}><h3 className="text-2xl font-black flex items-center gap-3"><Icons.Layers className="w-6 h-6 text-fuchsia-500"/> จัดการเซ็ต</h3><button onClick={()=>setShowBundleManager(false)} className="p-2 hover:text-rose-500"><Icons.X className="w-6 h-6"/></button></div><div className="flex-1 flex flex-col lg:flex-row min-h-0"><div className={`w-full lg:w-1/3 flex flex-col border-r ${theme.divide}`}><div className="p-4 font-black text-lg border-b">เซ็ตทั้งหมด ({(settingsOptions.bundles||[]).length})</div><div className="flex-1 overflow-y-auto p-4 space-y-3">{(settingsOptions.bundles||[]).map(b=><div key={b.id} className={`p-4 rounded-xl border cursor-pointer ${bundleForm.id===b.id?'border-fuchsia-500 shadow-md':'border-slate-300'}`} onClick={()=>{setBundleForm({id:b.id,name:b.name,itemIds:b.itemIds||[]});setBundleSearchTerm('');}}><div className="font-bold text-lg">{b.name}</div><div className="text-sm text-slate-500">{b.itemIds.length} ชิ้น</div><div className="flex gap-2 mt-2"><button onClick={e=>{e.stopPropagation();setBundleForm({id:b.id,name:b.name,itemIds:b.itemIds||[]});}} className="flex-1 py-1 bg-slate-200 rounded font-bold text-sm text-slate-700">แก้ไข</button><button onClick={e=>{e.stopPropagation();handleDeleteBundle(b.id);}} className="flex-1 py-1 bg-rose-100 text-rose-600 rounded font-bold text-sm">ลบ</button></div></div>)}</div></div><div className="w-full lg:w-2/3 flex flex-col p-6"><input type="text" className={`w-full px-4 py-3 mb-4 rounded-xl font-bold border ${theme.input}`} placeholder="ชื่อเซ็ต..." value={bundleForm.name} onChange={e=>setBundleForm({...bundleForm,name:e.target.value})}/><div className={`flex-1 flex flex-col border rounded-xl overflow-hidden ${theme.cardBg}`}><div className="p-3 border-b"><input type="text" className={`w-full px-3 py-2 rounded-lg border ${theme.input}`} placeholder="ค้นหาอุปกรณ์เข้าเซ็ต..." value={bundleSearchTerm} onChange={e=>setBundleSearchTerm(e.target.value)}/></div><div className="flex-1 overflow-y-auto p-2 space-y-1">{sortedBundleItems.map(i=>{const isSel=(bundleForm.itemIds||[]).includes(i.id);return <label key={i.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer ${isSel?'border-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/20':''}`}><input type="checkbox" className="w-5 h-5 accent-fuchsia-600" checked={isSel} onChange={e=>{setBundleForm({...bundleForm,itemIds:e.target.checked?[...(bundleForm.itemIds||[]),i.id]:(bundleForm.itemIds||[]).filter(id=>id!==i.id)})}}/><span className="font-bold">{i.name}</span></label>})}</div></div><div className="flex gap-3 mt-4"><button onClick={()=>setBundleForm({id:null,name:'',itemIds:[]})} className={`flex-1 py-3 font-bold rounded-xl ${theme.btnCancel}`}>ล้างค่า</button><button onClick={handleSaveBundle} className="flex-[2] py-3 bg-fuchsia-600 text-white font-bold rounded-xl">บันทึกเซ็ต</button></div></div></div></div></div>)}

      {showBundleModal && (<div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}><div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}><div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}><h3 className="text-2xl font-black flex items-center gap-3"><Icons.Package className="w-6 h-6 text-purple-500"/> ใช้งานเซ็ตอุปกรณ์</h3><button onClick={()=>setShowBundleModal(false)} className="p-2 hover:text-rose-500"><Icons.X className="w-5 h-5"/></button></div><div className="flex-1 overflow-y-auto p-6 space-y-4">{(settingsOptions.bundles||[]).map(bundle=>{const ready=(bundle.itemIds||[]).filter(id=>items.find(i=>i.id===id)?.status==='available').length;const outCount=(bundle.itemIds||[]).filter(id=>['borrowed','out-for-event'].includes(items.find(i=>i.id===id)?.status)).length;return <div key={bundle.id} className={`p-5 rounded-2xl border flex flex-col lg:flex-row justify-between gap-4 ${theme.cardBg}`}><div><h4 className="text-xl font-black">{bundle.name}</h4><div className="text-sm font-bold text-slate-500 mt-1">พร้อมใช้: {ready}/{bundle.itemIds.length} | รอคืน: {outCount}/{bundle.itemIds.length}</div></div><div className="flex gap-2"><button onClick={()=>handleSelectBundleToBorrow(bundle)} disabled={ready===0} className="px-4 py-2 bg-purple-600 text-white rounded-xl font-bold disabled:opacity-50">ยืมเซ็ต</button><button onClick={()=>handleSelectBundleToEvent(bundle)} disabled={ready===0} className="px-4 py-2 bg-orange-600 text-white rounded-xl font-bold disabled:opacity-50">ออกงาน</button><button onClick={()=>handleSelectBundleToReturn(bundle)} disabled={outCount===0} className="px-4 py-2 bg-emerald-600 text-white rounded-xl font-bold disabled:opacity-50">รับคืน</button></div></div>})}</div></div></div>)}

      {showHistory && (<div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}><div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl ${theme.cardBg}`}><div className="flex justify-between items-center mb-6"><h3 className="text-2xl font-black">ประวัติยืม-คืน</h3><button onClick={()=>setShowHistory(null)}><Icons.X className="w-6 h-6"/></button></div><div className="flex-1 overflow-y-auto space-y-3">{(()=>{const hList=items.find(i=>i.id===showHistory)?.history||[];if(hList.length===0)return <div className="text-center font-bold">ไม่มีประวัติ</div>;return hList.slice().reverse().map((h,i)=><div key={i} className="p-4 rounded-xl border"><div className="text-sm font-bold mb-1 opacity-70">{new Date(h.date).toLocaleString('th-TH')} - {h.type}</div><div>{h.type==='return'?`รับคืนโดย: ${h.staffIn}`:h.type==='event'?`งาน: ${h.eventName} (จนท: ${h.staffOut})`:`ผู้ยืม: ${h.borrower} (จนท: ${h.staffOut})`}</div>{h.note&&<div className="text-sm italic mt-1">หมายเหตุ: {h.note}</div>}</div>)})()}</div></div></div>)}

      {itemToDelete && (<div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}><div className={`rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl ${theme.cardBg}`}><h3 className="text-2xl font-black mb-2">ลบอุปกรณ์?</h3><p className="mb-6">ลบ "{itemToDelete.name}" ออกจากระบบ</p><div className="flex gap-3"><button onClick={()=>setItemToDelete(null)} className={`flex-1 py-3 rounded-xl ${theme.btnCancel}`}>ยกเลิก</button><button onClick={handleDeleteItem} className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-bold">ลบ</button></div></div></div>)}

      {showPersonalItemsModal && (<div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}><div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}><div className="flex justify-between p-6 border-b"><h3 className="text-2xl font-black flex gap-2"><Icons.Tag className="w-6 h-6 text-pink-500"/> ของประจำตัว</h3><button onClick={()=>setShowPersonalItemsModal(false)}><Icons.X className="w-5 h-5"/></button></div><div className="flex-1 overflow-y-auto p-6 space-y-4">{(()=>{const groups={};items.forEach(i=>{if(i.owner){groups[i.owner]=groups[i.owner]||[];groups[i.owner].push(i);}});const keys=Object.keys(groups).sort();return keys.length===0?<div className="text-center font-bold py-10">ไม่มีของประจำตัว</div>:keys.map(o=><div key={o} className="p-5 border rounded-2xl"><h4 className="font-black text-xl mb-2">{o} ({groups[o].length} ชิ้น)</h4><div className="space-y-1">{groups[o].map(i=><div key={i.id} className="text-sm border-b pb-1">- {i.name} ({i.sn})</div>)}</div></div>)})()}</div></div></div>)}

      {showQuickReturnModal && (<div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}><div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}><div className="flex justify-between p-6 border-b"><h3 className="text-2xl font-black flex gap-2"><Icons.Users className="w-6 h-6 text-indigo-500"/> ติดตามของรอคืน</h3><button onClick={()=>setShowQuickReturnModal(false)}><Icons.X className="w-5 h-5"/></button></div><div className="flex-1 overflow-y-auto p-6 space-y-4">{activeGroups.length===0?<div className="text-center font-bold py-10">ไม่มีของรอคืน</div>:activeGroups.map((g,i)=><div key={i} className="p-5 border rounded-2xl flex justify-between items-center"><div><h4 className="font-black text-xl">{g.type==='event'?'งาน: ':'ผู้ยืม: '}{g.name}</h4><div className="text-sm">{g.ids.length} ชิ้น</div></div><button onClick={()=>{setReturnTargetIds([...g.ids]);setReturnChecklist([]);setReturnData({staff:'',newStaff:''});setShowQuickReturnModal(false);}} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-bold">รับคืนกลุ่มนี้</button></div>)}</div></div></div>)}

      {showAuditModal && (<div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}><div className={`rounded-3xl shadow-2xl w-full max-w-3xl flex flex-col max-h-[85vh] ${theme.cardBg}`}><div className="flex justify-between p-6 border-b"><h3 className="text-2xl font-black flex gap-2"><Icons.ClipboardList className="w-6 h-6 text-blue-500"/> ประวัติส่วนกลาง</h3><button onClick={()=>setShowAuditModal(false)}><Icons.X className="w-5 h-5"/></button></div><div className="flex-1 overflow-y-auto p-6 space-y-3">{auditLogs.length===0?<div className="text-center font-bold py-10">ไม่มีประวัติ</div>:auditLogs.map(l=><div key={l.id} className="p-4 border rounded-xl"><div className="text-sm font-bold opacity-70">{new Date(l.timestamp).toLocaleString('th-TH')} - {l.action}</div><div className="font-bold text-lg">{l.target}</div><div className="text-sm mt-1">{l.details}</div></div>)}</div></div></div>)}

      {showLogin && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-8 max-w-sm w-full shadow-2xl ${theme.cardBg}`}>
            <h3 className="text-2xl font-black mb-6 text-center">เข้าสู่ระบบแอดมิน</h3>
            <input type="password" autoFocus className={`w-full px-4 py-4 border rounded-xl text-center text-3xl tracking-widest outline-none mb-6 ${theme.input}`} value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }} />
            <div className="flex gap-3"><button onClick={() => setShowLogin(false)} className={`flex-1 py-4 font-bold rounded-xl ${theme.btnCancel}`}>ยกเลิก</button><button onClick={handleLogin} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl">เข้าสู่ระบบ</button></div>
          </div>
        </div>
      )}

    </div>
  );
}

// 🛡️ Error Boundary เพื่อป้องกันหน้าจอขาว
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

export default function App() { return <ErrorBoundary><MainApp /></ErrorBoundary>; }
