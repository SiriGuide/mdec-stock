import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged, signInWithCustomToken } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection, addDoc } from "firebase/firestore";

// ⚠️ นำค่า Firebase Config ของคุณมาใส่ตรงนี้
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

const ADMIN_PIN = 'mdec8203';

const Icons = {
  Plus: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Search: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Edit: ({ className = "" }) => <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: ({ className = "" }) => <svg className={`w-4 h-4 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Package: ({ className = "" }) => <svg className={`w-6 h-6 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Alert: ({ className = "" }) => <svg className={`w-12 h-12 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Settings: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>,
  X: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
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
  Truck: ({ className = "" }) => <svg className={`w-5 h-5 ${className}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M10 17h4V5H2v12h3"/><path d="M20 17h2v-3.34a4 4 0 0 0-1.17-2.92l-1.09-1.09A4 4 0 0 0 16.92 9H14v8h2"/><circle cx="8.5" cy="17.5" r="2.5"/><circle cx="18.5" cy="17.5" r="2.5"/></svg>
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

function MainApp() {
  const [items, setItems] = useState([]);
  const [settingsOptions, setSettingsOptions] = useState({
    categories: ['กล้อง', 'เลนส์', 'ไมโครโฟน', 'ชุดลำโพง', 'ถ่าน/แบต', 'สายไฟ', 'อื่นๆ'],
    locations: ['ตู้ A1', 'ห้องเก็บของ 2', 'ห้องประชุม 1', 'อื่นๆ'],
    staff: ['แอดมิน', 'อื่นๆ'],
    bundles: [] 
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');

  const [isAdmin, setIsAdmin] = useState(() => {
    try { return localStorage.getItem('mdec_admin') === 'true'; } 
    catch (e) { return false; }
  });
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    try { return localStorage.getItem('mdec_theme') === 'dark'; }
    catch(e) { return false; }
  });

  const [showCommandCenter, setShowCommandCenter] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  const [user, setUser] = useState(null);
  
  const [showLogin, setShowLogin] = useState(false);
  const [pin, setPin] = useState('');
  const [firebaseError, setFirebaseError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', sn: '', department: 'ภาพนิ่ง', category: '', newCategory: '', location: '', newLocation: '', status: 'available', quantity: 1 });
  
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

  // ตัวแปรจัดการเซ็ต
  const [showBundleModal, setShowBundleModal] = useState(false);
  const [showBundleManager, setShowBundleManager] = useState(false); 
  const [bundleForm, setBundleForm] = useState({ id: null, name: '', itemIds: [] });
  const [bundleSearchTerm, setBundleSearchTerm] = useState(''); 
  
  const [showQuickReturnModal, setShowQuickReturnModal] = useState(false);
  const [showEmptyCategories, setShowEmptyCategories] = useState(false);

  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditLogs, setAuditLogs] = useState([]);

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
    btnSecondary: isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600 border-slate-600' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-300',
    btnCancel: isDarkMode ? 'bg-slate-700 text-slate-200 hover:bg-slate-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200',
    modalOverlay: isDarkMode ? 'bg-black/70' : 'bg-slate-900/40',
    statCard: isDarkMode ? 'bg-slate-800 border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-800',
  };

  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
          await signInWithCustomToken(auth, __initial_auth_token);
        } else {
          await signInAnonymously(auth);
        }
      } catch (error) {
        console.error("Auth init error", error);
        setFirebaseError(true);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  // ใช้ฐานข้อมูลเดิม (mdec_stock) ทันทีเพื่อให้ข้อมูลเก่าไม่หาย
  useEffect(() => {
    if (!user) return;
    const itemsRef = collection(db, "mdec_stock", "shared_data", "items");
    const settingsRef = doc(db, "mdec_stock", "shared_data", "settings", "global");

    const unsubscribeItems = onSnapshot(itemsRef, (snapshot) => {
      const loadedItems = [];
      snapshot.forEach((docSnap) => { loadedItems.push({ ...docSnap.data(), id: docSnap.id }); });
      setItems(loadedItems);
      setFirebaseError(false);
    }, (error) => {
      console.error(error);
      setFirebaseError(true);
    });

    const unsubscribeSettings = onSnapshot(settingsRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setSettingsOptions({
          categories: data.categories || ['กล้อง', 'เลนส์', 'ไมโครโฟน', 'ชุดลำโพง', 'ถ่าน/แบต', 'สายไฟ', 'อื่นๆ'],
          locations: data.locations || ['ตู้ A1', 'ห้องเก็บของ 2', 'ห้องประชุม 1', 'อื่นๆ'],
          staff: data.staff || ['แอดมิน', 'อื่นๆ'],
          bundles: data.bundles || []
        });
      } else {
        const defaultSettings = {
          categories: ['กล้อง', 'เลนส์', 'ไมโครโฟน', 'ชุดลำโพง', 'ถ่าน/แบต', 'สายไฟ', 'อื่นๆ'],
          locations: ['ตู้ A1', 'ห้องเก็บของ 2', 'ห้องประชุม 1', 'อื่นๆ'],
          staff: ['แอดมิน', 'อื่นๆ'],
          bundles: [] 
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
      const auditRef = collection(db, "mdec_stock", "shared_data", "audit_logs");
      const unsub = onSnapshot(auditRef, (snapshot) => {
        const logs = [];
        snapshot.forEach((docSnap) => logs.push({ id: docSnap.id, ...docSnap.data() }));
        logs.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
        setAuditLogs(logs);
      }, (error) => console.error(error));
      return () => unsub();
    }
  }, [user, showAuditModal, showCommandCenter]);

  const fileInputRef = useRef(null);

  const logAction = async (actionType, targetName, details) => {
    if (!user) return;
    try {
      await addDoc(collection(db, "mdec_stock", "shared_data", "audit_logs"), {
        timestamp: new Date().toISOString(), action: actionType, target: targetName, details: details, user: "Admin" 
      });
    } catch (e) {
      console.error("Audit Log Error:", e);
    }
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const searchLower = String(searchTerm || '').trim().toLowerCase();
      const matchSearch = searchLower === '' || 
                          (item.name && String(item.name).toLowerCase().includes(searchLower)) || 
                          (item.sn && String(item.sn).toLowerCase().includes(searchLower)) || 
                          (item.location && String(item.location).toLowerCase().includes(searchLower));
                          
      const matchDept = filterDept === 'all' || String(item.department) === String(filterDept);
      const matchCategory = filterCategory === 'all' || String(item.category) === String(filterCategory);
      const matchStatus = filterStatus === 'all' || String(item.status) === String(filterStatus);
      const matchLocation = filterLocation === 'all' || String(item.location) === String(filterLocation);
      
      return matchSearch && matchDept && matchCategory && matchStatus && matchLocation;
    });

    result.sort((a, b) => {
      try {
        const strA = String(a.name || '');
        const strB = String(b.name || '');
        return strA.localeCompare(strB, 'th', { numeric: true, sensitivity: 'base' });
      } catch (e) { return 0; }
    });
    return result;
  }, [items, searchTerm, filterDept, filterCategory, filterStatus, filterLocation]);

  const todayMs = new Date().setHours(0,0,0,0);
  const overdueItems = items.filter(item => {
    if ((item.status !== 'borrowed' && item.status !== 'out-for-event') || !item.expectedReturn) return false;
    return new Date(item.expectedReturn).getTime() < todayMs;
  });

  const selectableItems = useMemo(() => {
    return filteredItems.filter(i => i.status === 'available' || i.status === 'borrowed' || i.status === 'out-for-event');
  }, [filteredItems]);

  const stats = useMemo(() => {
    const s = { all: 0, available: 0, inUse: 0, borrowed: 0, outForEvent: 0, maintenance: 0 };
    items.forEach(item => {
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
    return items.filter(item => filterDept === 'all' || item.department === filterDept);
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
    if (!nameInput.trim()) {
      alert('❌ กรุณากรอกชื่ออุปกรณ์');
      return;
    }

    const snInput = String(formData.sn || '').trim();
    const ignoredSNs = ['-', 'none', 'n/a', 'na', 'ไม่มี', 'ไม่ระบุ', ''];
    
    if (snInput && !ignoredSNs.includes(snInput.toLowerCase())) {
      const isDuplicate = items.some(item => item.sn && String(item.sn).trim().toLowerCase() === snInput.toLowerCase() && item.id !== formData.id);
      if (isDuplicate) {
        alert(`❌ ไม่สามารถบันทึกได้: รหัส S.N. "${snInput}" มีซ้ำอยู่ในระบบแล้ว\n(หากไม่มีซีเรียล ให้ปล่อยว่างไว้ หรือใส่เครื่องหมาย - แทนได้ครับ)`);
        return; 
      }
    }

    try {
      let finalCategory = formData.category || 'อื่นๆ';
      if (formData.category === 'อื่นๆ' && (formData.newCategory || '').trim()) {
        finalCategory = formData.newCategory.trim();
        const updatedCategories = [...new Set([...(settingsOptions.categories || []).filter(c => c !== 'อื่นๆ'), finalCategory, 'อื่นๆ'])];
        setSettingsOptions(prev => ({ ...prev, categories: updatedCategories }));
        await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), { ...settingsOptions, categories: updatedCategories });
      }

      let finalLocation = formData.location || 'อื่นๆ';
      if (formData.location === 'อื่นๆ' && (formData.newLocation || '').trim()) {
        finalLocation = formData.newLocation.trim();
        const updatedLocations = [...new Set([...(settingsOptions.locations || []).filter(c => c !== 'อื่นๆ'), finalLocation, 'อื่นๆ'])];
        setSettingsOptions(prev => ({ ...prev, locations: updatedLocations }));
        await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), { ...settingsOptions, locations: updatedLocations });
      }

      const itemData = { 
        ...formData, category: finalCategory, location: finalLocation, quantity: Number(formData.quantity) || 1, updatedAt: new Date().toISOString() 
      };
      delete itemData.newCategory;
      delete itemData.newLocation;
      
      const isEdit = !!formData.id;
      delete itemData.id;
      
      if (isEdit) {
        await setDoc(doc(db, "mdec_stock", "shared_data", "items", formData.id), itemData, { merge: true });
        logAction('แก้ไขข้อมูล', itemData.name, `แก้ไขรายละเอียดอุปกรณ์ S.N.: ${itemData.sn || '-'}`);
      } else {
        const newId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
        await setDoc(doc(db, "mdec_stock", "shared_data", "items", newId), { ...itemData, history: [] });
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
    if (!user || !itemToDelete || !itemToDelete.id) return;
    try {
      const itemName = itemToDelete.name;
      await deleteDoc(doc(db, "mdec_stock", "shared_data", "items", itemToDelete.id));
      logAction('ลบข้อมูล', itemName, `ลบอุปกรณ์ออกจากระบบ`);
      setItemToDelete(null);
    } catch (error) {
      console.error("Error deleting item:", error);
      alert(`เกิดข้อผิดพลาดจากฐานข้อมูล: ${error.message}`);
      setItemToDelete(null);
    }
  };

  const expandWithChildren = (targetIds) => {
    let expanded = new Set(targetIds);
    if (Array.isArray(targetIds)) {
      targetIds.forEach(id => {
        const item = items.find(i => i.id === id);
        if (item && Array.isArray(item.childIds)) {
          item.childIds.forEach(cId => expanded.add(cId));
        }
      });
    }
    return Array.from(expanded);
  };

  const handleOpenRowBorrow = (e, item) => {
    e.stopPropagation();
    try {
      setBorrowData({ borrower: '', borrowDate: new Date().toISOString().split('T')[0], returnDate: '', staff: '', newStaff: '', note: '' }); 
      setBorrowTargetIds([item.id]);
      setPackingChecklist([]);
    } catch (err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const handleOpenRowEvent = (e, item) => {
    e.stopPropagation();
    try {
      setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' }); 
      setEventTargetIds([item.id]);
      setEventChecklist([]);
    } catch (err) { alert("ระบบขัดข้อง: " + err.message); }
  };

  const handleBorrow = async () => {
    if (!user || !borrowData.borrower || !borrowData.staff || packingChecklist.length === 0) return;
    let finalStaff = borrowData.staff;
    try {
      if (borrowData.staff === 'อื่นๆ' && (borrowData.newStaff || '').trim()) {
        finalStaff = borrowData.newStaff.trim();
        const updatedStaff = [...new Set([...(settingsOptions.staff || []).filter(c => c !== 'อื่นๆ'), finalStaff, 'อื่นๆ'])];
        const newSettings = { ...settingsOptions, staff: updatedStaff };
        setSettingsOptions(newSettings);
        await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), newSettings);
      }
    } catch (e) { console.error("Settings error:", e); }
    
    const newHistoryEntry = { type: 'borrow', date: new Date().toISOString(), borrower: borrowData.borrower, expectedReturn: borrowData.returnDate, staffOut: finalStaff, note: borrowData.note };
    const borrowedNames = [];

    try {
      const promises = packingChecklist.map(id => {
        const item = items.find(i => i.id === id);
        if (!item || item.status !== 'available') return Promise.resolve(); 
        borrowedNames.push(item.name);
        const newHistory = [...(item.history || []), newHistoryEntry];
        return setDoc(doc(db, "mdec_stock", "shared_data", "items", id), { status: 'borrowed', currentBorrower: borrowData.borrower, expectedReturn: borrowData.returnDate, currentNote: borrowData.note, history: newHistory }, { merge: true });
      });
      await Promise.all(promises);
      
      logAction('ให้ยืมอุปกรณ์', `ทำรายการ ${packingChecklist.length} ชิ้น`, `ยืมโดย: ${borrowData.borrower} (จนท.ผู้ให้ยืม: ${finalStaff})\nรายการ: ${borrowedNames.join(', ')}`);
      
      setBorrowTargetIds([]);
      setPackingChecklist([]);
      setSelectedItems([]); 
      setBorrowData({ borrower: '', borrowDate: '', returnDate: '', staff: '', newStaff: '', note: '' });
      alert('✅ บันทึกการยืมเรียบร้อยแล้ว!');
    } catch (error) {
      console.error(error);
      alert(`❌ เกิดข้อผิดพลาดในการทำรายการยืม: ${error.message}`);
    }
  };

  const handleEventOut = async () => {
    if (!user || !eventData.eventName || !eventData.staff || eventChecklist.length === 0) return;
    let finalStaff = eventData.staff;
    try {
      if (eventData.staff === 'อื่นๆ' && (eventData.newStaff || '').trim()) {
        finalStaff = eventData.newStaff.trim();
        const updatedStaff = [...new Set([...(settingsOptions.staff || []).filter(c => c !== 'อื่นๆ'), finalStaff, 'อื่นๆ'])];
        const newSettings = { ...settingsOptions, staff: updatedStaff };
        setSettingsOptions(newSettings);
        await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), newSettings);
      }
    } catch (e) { console.error("Settings error:", e); }
    
    const newHistoryEntry = { type: 'event', date: new Date().toISOString(), eventName: eventData.eventName, expectedReturn: eventData.returnDate, staffOut: finalStaff, note: eventData.note };
    const eventNames = [];

    try {
      const promises = eventChecklist.map(id => {
        const item = items.find(i => i.id === id);
        if (!item || item.status !== 'available') return Promise.resolve(); 
        eventNames.push(item.name);
        const newHistory = [...(item.history || []), newHistoryEntry];
        return setDoc(doc(db, "mdec_stock", "shared_data", "items", id), { status: 'out-for-event', currentEvent: eventData.eventName, expectedReturn: eventData.returnDate, currentNote: eventData.note, history: newHistory }, { merge: true });
      });
      await Promise.all(promises);
      
      logAction('นำออกงาน', `ทำรายการ ${eventChecklist.length} ชิ้น`, `ชื่องาน: ${eventData.eventName} (ผู้นำออก: ${finalStaff})\nรายการ: ${eventNames.join(', ')}`);
      
      setEventTargetIds([]);
      setEventChecklist([]);
      setSelectedItems([]); 
      setEventData({ eventName: '', returnDate: '', staff: '', newStaff: '', note: '' });
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
        await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), newSettings);
      }
    } catch (e) { console.error("Settings error:", e); }
    
    const newHistoryEntry = { type: 'return', date: new Date().toISOString(), staffIn: finalStaff };
    const returnedNames = [];

    try {
      const promises = returnChecklist.map(id => {
        const item = items.find(i => i.id === id);
        if (!item || (item.status !== 'borrowed' && item.status !== 'out-for-event')) return Promise.resolve();
        returnedNames.push(item.name);
        const newHistory = [...(item.history || []), newHistoryEntry];
        return setDoc(doc(db, "mdec_stock", "shared_data", "items", id), { status: 'available', currentBorrower: null, currentEvent: null, currentNote: null, expectedReturn: null, history: newHistory }, { merge: true });
      });
      await Promise.all(promises);

      logAction('รับคืนอุปกรณ์', `ทำรายการ ${returnChecklist.length} ชิ้น`, `จนท.ผู้รับคืน: ${finalStaff}\nรายการ: ${returnedNames.join(', ')}`);

      setReturnTargetIds([]);
      setReturnChecklist([]);
      setSelectedItems([]); 
      setReturnData({ staff: '', newStaff: '' });
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
      await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), newSettings);
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
      await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), newSettings);
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
              quantity: Number(cols[5]) || 1, status: 'available',
              updatedAt: new Date().toISOString(), history: []
            };
            
            await setDoc(doc(db, "mdec_stock", "shared_data", "items", newId), itemData);
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
      await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), updatedSettings);
      if (oldName && oldName !== newName && (key === 'categories' || key === 'locations')) {
        items.forEach(async (item) => {
          let updateData = {};
          if (key === 'categories' && item.category === oldName) updateData.category = newName;
          if (key === 'locations' && item.location === oldName) updateData.location = newName;
          if (Object.keys(updateData).length > 0) {
            await setDoc(doc(db, "mdec_stock", "shared_data", "items", item.id), updateData, { merge: true });
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

  const exportToCSV = () => {
    const headers = ['ชื่ออุปกรณ์', 'รหัส S.N.', 'ฝ่าย', 'หมวดหมู่', 'สถานที่', 'สถานะ', 'จำนวน', 'ผู้ยืมปัจจุบัน', 'อัปเดตล่าสุด'];
    const csvData = items.map(i => [
      i.name, i.sn || '-', i.department, i.category || '-', i.location || '-', 
      STATUSES.find(s=>s.id===i.status)?.label || i.status, i.quantity || 1, i.currentBorrower || i.currentEvent || '-', new Date(i.updatedAt).toLocaleDateString('th-TH')
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers, ...csvData].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = encodeURI(csvContent);
    link.download = `MDEC_Stock_${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(link);
    link.click();
  };

  const handleLogin = () => {
    if (pin === ADMIN_PIN) { 
      setIsAdmin(true); 
      try { localStorage.setItem('mdec_admin', 'true'); } catch(e) {}
      setShowLogin(false); 
      setPin(''); 
    } else { 
      alert('รหัสผ่านไม่ถูกต้อง'); 
      setPin(''); 
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    setSelectedItems([]);
    try { localStorage.removeItem('mdec_admin'); } catch(e) {}
  };

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
            
            {overdueItems.length > 0 ? (
              <div className={`border-2 p-5 rounded-3xl flex-1 flex flex-col shadow-sm animate-[pulse_3s_ease-in-out_infinite] ${isDarkMode ? 'bg-rose-900/20 border-rose-800' : 'bg-rose-50 border-rose-200'}`}>
                <h3 className={`font-black mb-3 flex items-center gap-2 text-lg ${isDarkMode ? 'text-rose-400' : 'text-rose-600'}`}>
                  <Icons.Alert className="w-6 h-6" /> อุปกรณ์เลยกำหนดคืน! ({overdueItems.length})
                </h3>
                <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-2">
                  {overdueItems.map(i => (
                    <div key={i.id} className={`text-base px-4 py-3 rounded-2xl border shadow-sm flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 transition-colors ${isDarkMode ? 'bg-slate-800 border-rose-900/50 text-rose-300 hover:bg-slate-700' : 'bg-white border-rose-100 text-rose-700 hover:bg-rose-50'}`}>
                      <span className="font-bold truncate">{i.name}</span> 
                      <span className={`text-sm font-semibold px-2 py-1 rounded-lg whitespace-nowrap ${isDarkMode ? 'bg-rose-900/40 text-rose-400' : 'bg-rose-50 text-rose-500'}`}>
                        {i.status === 'out-for-event' ? 'งาน: ' : 'ผู้ยืม: '} {i.currentBorrower || i.currentEvent}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className={`border p-5 rounded-3xl flex-1 flex flex-col items-center justify-center shadow-sm ${isDarkMode ? 'bg-emerald-900/10 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100'}`}>
                 <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-3 shadow-sm ${isDarkMode ? 'bg-slate-800 text-emerald-500' : 'bg-white text-emerald-400'}`}>
                   <Icons.CheckCircle className="w-10 h-10" />
                 </div>
                 <span className={`font-black text-xl ${isDarkMode ? 'text-emerald-400' : 'text-emerald-600'}`}>ไม่มีอุปกรณ์เลยกำหนด</span>
                 <span className={`font-medium text-base mt-1 ${isDarkMode ? 'text-emerald-500/70' : 'text-emerald-500'}`}>ยอดเยี่ยมมาก! ทุกคนคืนของตรงเวลา 🎉</span>
              </div>
            )}
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
    <div className={`min-h-screen font-sans p-4 sm:p-8 pb-32 transition-colors duration-300 ${theme.mainBg} ${theme.textMain}`}>
      {/* 🚨 แจ้งเตือนข้อผิดพลาด Firebase ให้ผู้ใช้แก้ไขเองบน Vercel */}
      {firebaseError && (
        <div className="w-full mb-6 bg-rose-100 border-l-4 border-rose-500 text-rose-800 p-5 rounded-r-xl shadow-md flex items-start gap-4">
          <Icons.Alert className="w-8 h-8 shrink-0 text-rose-600" />
          <div>
            <h3 className="font-black text-xl mb-2 text-rose-700">🚨 ฐานข้อมูลถูกระงับ (Firebase Permission Denied)</h3>
            <p className="font-bold text-base mb-2">ระบบไม่สามารถดึงข้อมูลจาก Firebase ของคุณได้ โปรดแก้ไขการตั้งค่าตามนี้:</p>
            <ul className="list-decimal ml-5 space-y-1 font-medium text-sm">
              <li>ไปที่ <b>Firebase Console</b> แล้วเปิดโปรเจกต์ของคุณ</li>
              <li>ไปที่เมนู <b>Authentication</b> {'>'} แท็บ Sign-in method {'>'} เปิดใช้งาน <b>Anonymous (ไม่ระบุตัวตน)</b></li>
              <li>ไปที่เมนู <b>Firestore Database</b> {'>'} แท็บ Rules {'>'} แก้ไขโค้ดเป็น <code>allow read, write: if true;</code> แล้วกด <b>Publish</b></li>
            </ul>
          </div>
        </div>
      )}

      {/* Header */}
      <div className={`w-full flex flex-col xl:flex-row justify-between items-center mb-8 gap-4 p-6 rounded-2xl shadow-md border transition-colors ${theme.cardBg}`}>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Icons.Package className="w-8 h-8" /></div>
          <div>
            <h1 className={`text-2xl sm:text-3xl font-black tracking-tight ${theme.textTitle}`}>
              MDEC-Stock 
              <span className="text-xs sm:text-sm font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg ml-2 align-middle border border-blue-200 shadow-sm">v20.4 Ultimate Stable</span>
            </h1>
            <p className={`font-medium text-sm sm:text-base ${theme.textMuted}`}>ระบบจัดการสต๊อก ศูนย์มัลติมีเดีย</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-2 sm:gap-3 w-full xl:w-auto">
          <button type="button" onClick={() => setIsDarkMode(!isDarkMode)} className={`flex items-center justify-center p-3 font-bold rounded-xl transition-colors shadow-sm ${theme.btnCancel}`} title={isDarkMode ? "เปลี่ยนเป็นโหมดสว่าง" : "เปลี่ยนเป็นโหมดกลางคืน"}>
            {isDarkMode ? <Icons.Sun className="w-5 h-5" /> : <Icons.Moon className="w-5 h-5" />}
          </button>

          {isAdmin && (
            <>
              <button type="button" onClick={() => setShowCommandCenter(true)} className={`flex-1 md:flex-none items-center justify-center gap-2 px-4 py-3 font-bold rounded-xl transition-colors flex ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400 hover:bg-emerald-800/60 border border-emerald-800' : 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100'}`} title="เปิดหน้าจอควบคุมรวม (Dashboard)">
                <Icons.Monitor className="w-5 h-5" /><span className="hidden sm:inline">Command Center</span>
              </button>

              <button type="button" onClick={() => { setBundleForm({ id: null, name: '', itemIds: [] }); setBundleSearchTerm(''); setShowBundleManager(true); }} className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-4 font-black rounded-xl shadow-md transition-colors text-lg whitespace-nowrap ${isDarkMode ? 'bg-fuchsia-600 text-white hover:bg-fuchsia-500' : 'bg-fuchsia-600 text-white hover:bg-fuchsia-700'}`}>
                <Icons.Layers className="w-5 h-5" /> จัดการเซ็ต
              </button>

              {(settingsOptions.bundles && settingsOptions.bundles.length > 0) && (
                <button type="button" onClick={() => setShowBundleModal(true)} className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-4 font-black rounded-xl shadow-md transition-colors text-lg whitespace-nowrap ${isDarkMode ? 'bg-purple-600 text-white hover:bg-purple-500' : 'bg-purple-600 text-white hover:bg-purple-700'}`}>
                  <Icons.Package className="w-5 h-5" /> ใช้งานเซ็ต
                </button>
              )}

              <button type="button" onClick={() => setShowQuickReturnModal(true)} className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-4 font-black rounded-xl shadow-md transition-colors text-lg whitespace-nowrap ${isDarkMode ? 'bg-indigo-600 text-white hover:bg-indigo-500' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}>
                  <Icons.Users className="w-5 h-5" /> ติดตามของรอคืน
              </button>

              <button type="button" onClick={() => setShowAuditModal(true)} className={`flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-xl transition-colors ${theme.btnCancel}`} title="ดูประวัติการทำงานส่วนกลาง">
                <Icons.ClipboardList className="w-5 h-5" />
              </button>
              
              <button type="button" onClick={() => { setSettingsTab('categories'); setShowSettings(true); }} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-3 font-bold rounded-xl transition-colors shadow-sm ${theme.btnCancel}`}>
                <Icons.Settings className="w-5 h-5" /><span className="hidden sm:inline">ตั้งค่า</span>
              </button>
              
              <button type="button" onClick={handleLogout} className={`flex-1 md:flex-none items-center justify-center gap-2 px-4 py-3 font-bold rounded-xl transition-colors flex ${isDarkMode ? 'bg-rose-900/40 text-rose-400 hover:bg-rose-800/60 border border-rose-800' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`} title="ออกจากระบบแอดมิน">
                <Icons.Unlock className="w-5 h-5" />
              </button>
            </>
          )}
          
          {!isAdmin && (
            <button type="button" onClick={() => setShowLogin(true)} className={`flex-1 md:flex-none items-center justify-center gap-2 px-5 py-3 font-bold rounded-xl transition-colors shadow-md flex ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-800 text-white hover:bg-slate-700'}`}>
              <Icons.Lock className="w-5 h-5" /><span className="hidden sm:inline">เข้าสู่ระบบจัดการ</span>
            </button>
          )}
        </div>
      </div>

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

      {/* 📊 Main Stats Grid */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-6 gap-4 sm:gap-6 mb-8">
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-blue-500 flex flex-col items-center justify-center text-center transition-colors ${theme.cardBg}`}>
          <span className={`font-bold text-sm sm:text-base mb-1 ${theme.textMuted}`}>อุปกรณ์ทั้งหมด</span>
          <span className="text-4xl sm:text-5xl font-black text-blue-500">{stats.all}</span>
        </div>
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-emerald-500 flex flex-col items-center justify-center text-center transition-colors ${theme.cardBg}`}>
          <span className={`font-bold text-sm sm:text-base mb-1 ${theme.textMuted}`}>พร้อมใช้งาน</span>
          <span className="text-4xl sm:text-5xl font-black text-emerald-500">{stats.available}</span>
        </div>
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-amber-500 flex flex-col items-center justify-center text-center transition-colors ${theme.cardBg}`}>
          <span className={`font-bold text-sm sm:text-base mb-1 ${theme.textMuted}`}>กำลังใช้งาน</span>
          <span className="text-4xl sm:text-5xl font-black text-amber-500">{stats.inUse}</span>
        </div>
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-purple-500 flex flex-col items-center justify-center text-center transition-colors ${theme.cardBg}`}>
          <span className={`font-bold text-sm sm:text-base mb-1 ${theme.textMuted}`}>กำลังถูกยืม</span>
          <span className="text-4xl sm:text-5xl font-black text-purple-500">{stats.borrowed}</span>
        </div>
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-orange-500 flex flex-col items-center justify-center text-center transition-colors ${theme.cardBg}`}>
          <span className={`font-bold text-sm sm:text-base mb-1 flex items-center gap-1 ${theme.textMuted}`}>🚚 ออกงาน</span>
          <span className="text-4xl sm:text-5xl font-black text-orange-500">{stats.outForEvent}</span>
        </div>
        <div className={`p-5 rounded-2xl shadow-md border-t-4 border-rose-500 flex flex-col items-center justify-center text-center transition-colors ${theme.cardBg}`}>
          <span className={`font-bold text-sm sm:text-base mb-1 ${theme.textMuted}`}>ส่งซ่อม/ชำรุด</span>
          <span className="text-4xl sm:text-5xl font-black text-rose-500">{stats.maintenance}</span>
        </div>
      </div>

      {/* ส่วนของหลอดหมวดหมู่ */}
      <div className="w-full flex justify-end mb-2 pr-2">
        <button type="button" onClick={() => setShowEmptyCategories(!showEmptyCategories)} className={`text-sm font-bold hover:text-blue-500 flex items-center gap-1 transition-colors ${theme.textMuted}`}>
          {showEmptyCategories ? <><Icons.EyeOff className="w-4 h-4"/> ซ่อนหมวดหมู่ที่ว่าง (0 ชิ้น)</> : <><Icons.Eye className="w-4 h-4"/> แสดงหมวดหมู่ทั้งหมด</>}
        </button>
      </div>
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
        {categoryStats.map(c => (
          <div key={c.label} className={`p-4 rounded-xl shadow-sm border flex flex-col transition-colors ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-2">
              <span className={`font-bold text-base sm:text-lg truncate pr-2 ${theme.textTitle}`} title={c.label}>{c.label}</span>
              <span className={`text-xs font-bold px-2 py-1 rounded-md shrink-0 ${isDarkMode ? 'bg-emerald-900/40 text-emerald-400' : 'bg-emerald-50 text-emerald-600'}`}>พร้อมใช้</span>
            </div>
            <div className="flex justify-between items-baseline mb-2">
              <div><span className={`text-3xl font-black ${theme.textTitle}`}>{c.data.total}</span><span className={`text-sm font-bold ml-1 ${theme.textMuted}`}>ชิ้น</span></div>
              <span className="text-2xl font-bold text-emerald-500">{c.data.available}</span>
            </div>
            <div className={`w-full h-2 rounded-full overflow-hidden ${isDarkMode ? 'bg-slate-700' : 'bg-slate-100'}`}><div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${c.data.total === 0 ? 0 : (c.data.available / c.data.total) * 100}%` }}></div></div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className={`w-full flex flex-col gap-4 p-5 sm:p-6 rounded-2xl shadow-md border mb-6 transition-colors ${theme.cardBg}`}>
        <div className="flex flex-col xl:flex-row gap-4 items-center w-full">
          <div className="relative flex-1 w-full">
            <div className={`absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none ${theme.textMuted}`}><Icons.Search className="w-5 h-5" /></div>
            <input type="text" className={`w-full pl-12 pr-4 py-4 rounded-xl text-lg font-bold outline-none transition-all border ${theme.input}`} placeholder="ค้นหาชื่ออุปกรณ์, รหัส, สถานที่..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
            <select className={`flex-1 px-4 py-4 rounded-xl text-lg font-bold outline-none border ${theme.input}`} value={filterLocation} onChange={e => setFilterLocation(e.target.value)}>
              <option value="all">สถานที่/ห้อง ทั้งหมด</option>
              {(settingsOptions.locations || []).filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={`flex-1 px-4 py-4 rounded-xl text-lg font-bold outline-none border ${theme.input}`} value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">หมวดหมู่ทั้งหมด</option>
              {(settingsOptions.categories || []).filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className={`flex-1 px-4 py-4 rounded-xl text-lg font-bold outline-none border ${theme.input}`} value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">สถานะทั้งหมด</option>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {isAdmin && (
            <div className="flex gap-2 w-full xl:w-auto">
              <button type="button" onClick={() => { setFormData({ id: '', name: '', sn: '', department: 'ภาพนิ่ง', category: '', newCategory: '', location: '', newLocation: '', status: 'available', quantity: 1 }); setShowForm(true); }} className={`flex-1 xl:flex-none flex items-center justify-center gap-2 px-6 py-4 font-black rounded-xl shadow-md transition-colors text-lg whitespace-nowrap ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-blue-600 text-white hover:bg-blue-700'}`}><Icons.Plus className="w-5 h-5" /> <span className="hidden sm:inline">เพิ่มอุปกรณ์</span></button>
            </div>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto w-full pb-2 custom-scrollbar">
          <button type="button" onClick={() => setFilterDept('all')} className={`flex items-center justify-center gap-2 whitespace-nowrap px-6 py-4 rounded-xl font-bold text-lg transition-all border ${filterDept === 'all' ? (isDarkMode ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-800 border-slate-800 text-white shadow-md') : theme.btnSecondary}`}>
            ทั้งหมด <Icons.ViewGrid className="w-5 h-5" />
          </button>
          {DEPARTMENTS.map(d => {
            const IconComponent = Icons[d.iconName];
            return (
              <button type="button" key={d.id} onClick={() => setFilterDept(d.id)} className={`flex items-center justify-center gap-2 whitespace-nowrap px-6 py-4 rounded-xl font-bold text-lg transition-all border ${filterDept === d.id ? (isDarkMode ? 'bg-blue-600 border-blue-600 text-white shadow-md' : 'bg-slate-800 border-slate-800 text-white shadow-md') : theme.btnSecondary}`}>
                {d.label} {IconComponent && <IconComponent className="w-5 h-5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 📋 Table / List */}
      <div className={`w-full rounded-2xl shadow-md border overflow-hidden relative transition-colors ${theme.cardBg}`}>
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className={`border-b text-lg transition-colors ${theme.th}`}>
                {isAdmin && (
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
                <tr><td colSpan={isAdmin ? 7 : 6} className={`px-4 py-12 text-center font-bold text-xl ${theme.textMuted}`}>ไม่พบข้อมูลที่ค้นหา</td></tr>
              ) : filteredItems.map((item, index) => {
                const deptInfo = DEPARTMENTS.find(d => d.id === item.department) || DEPARTMENTS[0];
                const statusInfo = STATUSES.find(s => s.id === item.status) || STATUSES[0];
                const isBorrowed = item.status === 'borrowed';
                const isEvent = item.status === 'out-for-event';
                const qty = Number(item.quantity) || 1;
                
                const isOverdue = (isBorrowed || isEvent) && item.expectedReturn && new Date(item.expectedReturn).getTime() < todayMs;
                const rowBg = isOverdue ? (isDarkMode ? 'bg-rose-900/20 hover:bg-rose-900/40' : 'bg-rose-50 hover:bg-rose-100') : theme.trHover;
                const rowBorder = isOverdue ? 'border-l-4 border-l-rose-500' : '';
                
                return (
                  <tr key={`${item.id}_${index}`} className={`group transition-colors text-lg ${rowBg} ${rowBorder}`}>

                    {isAdmin && (
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
                        {isOverdue && <span className="bg-rose-500 text-white text-xs px-2 py-1 rounded-md font-bold shadow-sm">เลยกำหนดคืน!</span>}
                      </div>
                      {item.sn && <div className={`text-base mt-1 font-mono ${theme.textMuted}`}>S.N.: {item.sn}</div>}

                      {/* 📝 กล่องแสดงหมายเหตุ การยืม/ออกงาน */}
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
                        
                        {isAdmin && (
                          <>
                            {/* ปุ่มทำรายการรายชิ้น */}
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
                            
                            <button type="button" onClick={(e) => { e.stopPropagation(); setFormData({ ...item, newCategory: '', newLocation: '' }); setShowForm(true); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-blue-900/40 text-blue-400 hover:bg-blue-600 hover:text-white' : 'bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white'}`} title="แก้ไข"><Icons.Edit className="w-4 h-4" /></button>
                            <button type="button" onClick={(e) => { e.stopPropagation(); setItemToDelete(item); }} className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors ${isDarkMode ? 'bg-rose-900/40 text-rose-400 hover:bg-rose-600 hover:text-white' : 'bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white'}`} title="ลบ"><Icons.Trash className="w-4 h-4" /></button>
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

      {/* 🛒 Floating Action Bar (ระบบตะกร้า) */}
      {isAdmin && selectedItems.length > 0 && (
        <div className={`fixed bottom-8 left-1/2 -translate-x-1/2 backdrop-blur-xl px-4 py-4 sm:px-6 rounded-3xl shadow-[0_20px_60px_rgba(0,0,0,0.2)] flex items-center gap-4 sm:gap-6 z-40 w-[95%] max-w-3xl justify-between animate-[slideUp_0.3s_ease-out] border-2 ${isDarkMode ? 'bg-slate-900/90 border-slate-700 text-white' : 'bg-white/90 border-slate-100 text-slate-800'}`}>
          <div className="flex items-center gap-3 shrink-0">
            <div className="bg-indigo-600 text-white font-black w-10 h-10 rounded-full flex items-center justify-center shadow-inner text-lg">{selectedItems.length}</div>
            <span className="font-bold text-lg hidden lg:inline whitespace-nowrap">รายการที่เลือก</span>
          </div>
          <div className="flex gap-2 sm:gap-3 overflow-x-auto custom-scrollbar">
            <button onClick={handleCreateBundleFromSelection} className="px-4 py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-bold transition-colors shadow-md flex items-center gap-2 text-base whitespace-nowrap"><Icons.Layers className="w-5 h-5"/> <span className="hidden sm:inline">จัดเซ็ต</span></button>

            <button onClick={handleOpenBatchBorrow} className="px-4 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl font-bold transition-colors shadow-md flex items-center gap-2 text-base whitespace-nowrap"><Icons.UserPlus className="w-5 h-5"/> <span className="hidden sm:inline">ยืมออก</span></button>
            
            <button onClick={handleOpenBatchEvent} className="px-4 py-3 bg-orange-600 hover:bg-orange-500 text-white rounded-2xl font-bold transition-colors shadow-md flex items-center gap-2 text-base whitespace-nowrap"><Icons.Truck className="w-5 h-5"/> <span className="hidden sm:inline">ออกงาน</span></button>
            
            <button onClick={handleOpenBatchReturn} className="px-4 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl font-bold transition-colors shadow-md flex items-center gap-2 text-base whitespace-nowrap"><Icons.CheckCircle className="w-5 h-5"/> <span className="hidden sm:inline">รับคืน</span></button>
            
            <button onClick={() => setSelectedItems([])} className={`px-4 py-3 rounded-2xl font-bold transition-colors border shrink-0 ${isDarkMode ? 'bg-slate-800 hover:bg-slate-700 border-slate-700 text-slate-300' : 'bg-slate-100 hover:bg-slate-200 border-slate-200 text-slate-600'}`}><Icons.X className="w-5 h-5" /></button>
          </div>
        </div>
      )}

      {/* Settings Modal (การตั้งค่าทั่วไป) */}
      {showSettings && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] transition-all duration-300 ${theme.cardBg}`}>
            <div className={`flex border-b overflow-x-auto custom-scrollbar shrink-0 ${theme.divide}`}>
              <button type="button" onClick={() => {setSettingsTab('categories'); setEditingSettingItem(null); setNewSettingItem('');}} className={`flex-1 whitespace-nowrap px-4 py-4 font-bold text-lg border-b-2 ${settingsTab === 'categories' ? 'text-blue-500 border-blue-500' : `${theme.textMuted} border-transparent ${theme.trHover}`}`}>หมวดหมู่</button>
              <button type="button" onClick={() => {setSettingsTab('locations'); setEditingSettingItem(null); setNewSettingItem('');}} className={`flex-1 whitespace-nowrap px-4 py-4 font-bold text-lg border-b-2 ${settingsTab === 'locations' ? 'text-blue-500 border-blue-500' : `${theme.textMuted} border-transparent ${theme.trHover}`}`}>สถานที่</button>
              <button type="button" onClick={() => {setSettingsTab('staff'); setEditingSettingItem(null); setNewSettingItem('');}} className={`flex-1 whitespace-nowrap px-4 py-4 font-bold text-lg border-b-2 ${settingsTab === 'staff' ? 'text-blue-500 border-blue-500' : `${theme.textMuted} border-transparent ${theme.trHover}`}`}>เจ้าหน้าที่</button>
            </div>
            
            <div className="overflow-y-auto custom-scrollbar flex-1 flex flex-col min-h-0">
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
            </div>

            <div className={`p-4 border-t shrink-0 ${theme.divide}`}>
              <button type="button" onClick={() => { setShowSettings(false); setEditingSettingItem(null); setNewSettingItem(''); }} className={`w-full py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ปิดหน้าต่าง</button>
            </div>
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
              <button type="button" onClick={() => setDeleteSettingConfirm(null)} className={`flex-1 py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleDeleteSetting} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 text-lg hover:bg-rose-500">ลบรายการ</button>
            </div>
          </div>
        </div>
      )}

      {/* 💡 Modal รับคืนด่วน (Quick Return) */}
      {showQuickReturnModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
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
                      className={`px-6 py-4 font-black rounded-xl transition-colors whitespace-nowrap flex items-center justify-center gap-2 ${isDarkMode ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md'}`}
                    >
                      <Icons.CheckCircle className="w-5 h-5"/> รับคืนกลุ่มนี้
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <div className={`p-4 border-t ${theme.divide}`}>
              <p className={`text-sm text-center font-bold ${theme.textMuted}`}>* กดปุ่มรับคืนกลุ่มนี้ ระบบจะดึงของทั้งหมดไปเข้าหน้าเช็คลิสต์ตรวจของเข้ากล่องให้ทันที (ทยอยคืนบางส่วนได้)</p>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Modal สร้างและจัดการเซ็ต (New Dedicated UI แบบแบ่ง 2 ฝั่ง) */}
      {showBundleManager && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-5xl flex flex-col h-[85vh] overflow-hidden transition-all duration-300 ${theme.cardBg}`}>
            
            {/* Header */}
            <div className={`flex justify-between items-center p-6 border-b shrink-0 ${theme.divide}`}>
              <div>
                <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}>
                  <div className={`p-2 rounded-xl ${isDarkMode ? 'bg-fuchsia-900/50 text-fuchsia-400' : 'bg-fuchsia-100 text-fuchsia-600'}`}>
                    <Icons.Layers className="w-6 h-6" />
                  </div>
                  สร้างและจัดการเซ็ตอุปกรณ์
                </h3>
                <p className={`text-sm font-medium mt-1 ${theme.textMuted}`}>จับกลุ่มอุปกรณ์ที่ใช้บ่อย เพื่อความรวดเร็วในการยืม/ออกงาน</p>
              </div>
              <button type="button" onClick={() => setShowBundleManager(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-6 h-6" /></button>
            </div>

            {/* Body - Split Screen */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              
              {/* Left Panel: List of Bundles */}
              <div className={`w-full lg:w-1/3 flex flex-col border-b lg:border-b-0 lg:border-r ${theme.divide} ${isDarkMode ? 'bg-slate-800/30' : 'bg-slate-50/50'}`}>
                <div className={`p-5 border-b font-black text-lg flex justify-between items-center ${theme.textTitle} ${theme.divide}`}>
                  เซ็ตที่มีในระบบ 
                  <span className={`text-sm px-2 py-0.5 rounded-full ${isDarkMode ? 'bg-slate-700 text-slate-300' : 'bg-slate-200 text-slate-700'}`}>
                    {(settingsOptions.bundles || []).length} เซ็ต
                  </span>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
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

              {/* Right Panel: Create/Edit Form */}
              <div className="w-full lg:w-2/3 flex flex-col h-full overflow-hidden p-6">
                <div className="flex justify-between items-center mb-4 shrink-0">
                  <h4 className={`font-black text-xl flex items-center gap-2 ${bundleForm.id ? 'text-amber-500' : 'text-fuchsia-500'}`}>
                    {bundleForm.id ? <Icons.Edit className="w-6 h-6"/> : <Icons.Plus className="w-6 h-6"/>} 
                    {bundleForm.id ? 'แก้ไขเซ็ตอุปกรณ์' : 'สร้างเซ็ตใหม่'}
                  </h4>
                  {bundleForm.id && (
                    <button onClick={() => { setBundleForm({ id: null, name: '', itemIds: [] }); setBundleSearchTerm(''); }} className={`text-sm font-bold px-3 py-1.5 rounded-lg transition-colors shadow-sm ${isDarkMode ? 'bg-slate-700 hover:bg-slate-600 text-slate-300' : 'bg-white border hover:bg-slate-50 text-slate-700'}`}>
                      + สร้างเซ็ตใหม่แทน
                    </button>
                  )}
                </div>

                {/* Bundle Name Input */}
                <div className="mb-4 shrink-0">
                  <label className={`block font-bold mb-1.5 ${theme.textTitle}`}>ชื่อเซ็ต <span className="text-rose-500">*</span></label>
                  <input type="text" className={`w-full px-4 py-3 mb-4 rounded-xl font-bold outline-none text-lg border focus:ring-2 focus:ring-fuchsia-500 shadow-sm ${theme.input}`} placeholder="เช่น: เซ็ตกล้องหลัก (ตัว A), ชุดเครื่องเสียงสัมภาษณ์..." value={bundleForm.name || ''} onChange={e => setBundleForm({...bundleForm, name: e.target.value})} />
                </div>

                {/* Equipment Selection Area */}
                <div className={`flex-1 flex flex-col min-h-0 border rounded-2xl overflow-hidden shadow-sm ${isDarkMode ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'}`}>
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
                        <label key={i.id} className={`flex justify-between items-center cursor-pointer p-3 rounded-xl border transition-all ${isSelected ? (isDarkMode ? 'bg-fuchsia-900/40 border-fuchsia-700 shadow-inner' : 'bg-fuchsia-50 border-fuchsia-300 shadow-sm') : (isDarkMode ? 'bg-slate-800 border-transparent hover:bg-slate-700' : 'bg-white border-transparent hover:bg-slate-100')} ${theme.textMain}`}>
                          <div className="flex items-center gap-3 min-w-0 pr-2">
                            <input type="checkbox" className="w-5 h-5 accent-fuchsia-600 rounded shrink-0 cursor-pointer" checked={isSelected} onChange={(e) => {
                              const newIds = e.target.checked ? [...(bundleForm.itemIds || []), i.id] : (bundleForm.itemIds || []).filter(id => id !== i.id);
                              setBundleForm({...bundleForm, itemIds: newIds});
                            }} />
                            <div className="truncate">
                              <span className={`font-bold text-base ${isSelected ? (isDarkMode ? 'text-fuchsia-300' : 'text-fuchsia-700') : ''}`}>{i.name}</span>
                              <span className={`text-sm ml-2 ${isSelected ? (isDarkMode ? 'text-fuchsia-400/70' : 'text-fuchsia-600/70') : theme.textMuted}`}>(S.N: {i.sn || '-'})</span>
                            </div>
                          </div>
                          <span className={`shrink-0 text-[10px] px-2 py-1 rounded-md font-bold whitespace-nowrap ${isDarkMode ? s.darkColor : s.color}`}>{s.label}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>

                <div className="mt-4 shrink-0 flex gap-3">
                  {bundleForm.id && (
                    <button type="button" onClick={() => { setBundleForm({ id: null, name: '', itemIds: [] }); setBundleSearchTerm(''); setShowBundleManager(false); }} className={`flex-1 py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>
                      ยกเลิก
                    </button>
                  )}
                  <button type="button" onClick={handleSaveBundle} disabled={!(bundleForm.name || '').trim() || (bundleForm.itemIds || []).length === 0} className={`flex-[2] py-4 font-black rounded-xl text-lg shadow-lg transition-all ${(bundleForm.name || '').trim() && (bundleForm.itemIds || []).length > 0 ? (bundleForm.id ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-amber-500/30' : 'bg-fuchsia-600 hover:bg-fuchsia-500 text-white shadow-fuchsia-500/30') : (isDarkMode ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-300 text-slate-500 cursor-not-allowed')}`}>
                    {bundleForm.id ? '💾 บันทึกการแก้ไข' : '✨ บันทึกสร้างเซ็ตใหม่'}
                  </button>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      {/* 📦 Modal ยืม/คืนแบบใช้งานเซ็ต (Use Bundles) */}
      {showBundleModal && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] ${theme.cardBg}`}>
            <div className={`flex justify-between items-center p-6 border-b ${theme.divide}`}>
              <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.Package className="w-6 h-6 text-purple-500" /> ใช้งานเซ็ตอุปกรณ์</h3>
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

      {/* 📋 Borrow Modal (แบบมีระบบ Checklist) */}
      {borrowTargetIds.length > 0 && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-black flex items-center gap-2 ${theme.textTitle}`}><Icons.UserPlus className="text-purple-500 w-6 h-6" /> บันทึกการให้ยืม</h3>
              <button type="button" onClick={() => { setBorrowTargetIds([]); setPackingChecklist([]); }} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
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
            </div>

            <div className={`mb-8 p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Icons.ClipboardList className="w-5 h-5" /> เช็คลิสต์ก่อนปล่อยยืม ({packingChecklist.length}/{borrowTargetIds.length})
                </h4>
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
                      <span className={`font-bold text-sm sm:text-base leading-tight ${isChecked ? (isDarkMode ? 'text-purple-400 line-through opacity-70' : 'text-purple-700 line-through opacity-70') : theme.textMain}`}>
                        {item.name} <span className={`text-xs font-normal block mt-0.5 ${theme.textMuted}`}>(S.N: {item.sn || '-'})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setBorrowTargetIds([]); setPackingChecklist([]); }} className={`flex-1 py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button 
                type="button" 
                onClick={handleBorrow} 
                disabled={!borrowData.borrower || !borrowData.staff || packingChecklist.length === 0} 
                className={`flex-1 py-4 font-bold rounded-xl text-lg transition-colors ${(!borrowData.borrower || !borrowData.staff || packingChecklist.length === 0) ? (isDarkMode ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : 'bg-purple-600 text-white hover:bg-purple-500 shadow-lg shadow-purple-500/20'}`}
              >
                {packingChecklist.length > 0 && packingChecklist.length < borrowTargetIds.length ? `ยืนยันการยืม (${packingChecklist.length} ชิ้น)` : 'ยืนยันการยืม'}
              </button>
            </div>
            {packingChecklist.length < borrowTargetIds.length && packingChecklist.length > 0 && (
               <p className={`text-xs text-center mt-3 font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`}>* อุปกรณ์ที่ไม่ได้ติ๊ก จะไม่ถูกยืมออกไป (ทำรายการบางส่วน)</p>
            )}
            {packingChecklist.length === 0 && (
               <p className={`text-xs text-center mt-3 font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-500'}`}>* กรุณาติ๊กเลือกอุปกรณ์อย่างน้อย 1 ชิ้นเพื่อทำรายการ</p>
            )}
          </div>
        </div>
      )}

      {/* 🚚 Event Modal (ระบบนำออกงาน) */}
      {eventTargetIds.length > 0 && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-black flex items-center gap-2 ${theme.textTitle}`}><Icons.Truck className="text-orange-500 w-6 h-6" /> นำอุปกรณ์ออกงาน</h3>
              <button type="button" onClick={() => { setEventTargetIds([]); setEventChecklist([]); }} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
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
            </div>

            <div className={`mb-8 p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Icons.ClipboardList className="w-5 h-5" /> เช็คของขึ้นรถ ({eventChecklist.length}/{eventTargetIds.length})
                </h4>
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
                      <span className={`font-bold text-sm sm:text-base leading-tight ${isChecked ? (isDarkMode ? 'text-orange-400 line-through opacity-70' : 'text-orange-700 line-through opacity-70') : theme.textMain}`}>
                        {item.name} <span className={`text-xs font-normal block mt-0.5 ${theme.textMuted}`}>(S.N: {item.sn || '-'})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setEventTargetIds([]); setEventChecklist([]); }} className={`flex-1 py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button 
                type="button" 
                onClick={handleEventOut} 
                disabled={!eventData.eventName || !eventData.staff || eventChecklist.length === 0} 
                className={`flex-1 py-4 font-bold rounded-xl text-lg transition-colors ${(!eventData.eventName || !eventData.staff || eventChecklist.length === 0) ? (isDarkMode ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-slate-200 text-slate-400 cursor-not-allowed') : 'bg-orange-600 text-white hover:bg-orange-500 shadow-lg shadow-orange-500/20'}`}
              >
                {eventChecklist.length > 0 && eventChecklist.length < eventTargetIds.length ? `ยืนยันนำออก (${eventChecklist.length} ชิ้น)` : 'ยืนยันการนำออกงาน'}
              </button>
            </div>
            {eventChecklist.length < eventTargetIds.length && eventChecklist.length > 0 && (
               <p className={`text-xs text-center mt-3 font-bold ${isDarkMode ? 'text-amber-400' : 'text-amber-500'}`}>* อุปกรณ์ที่ไม่ได้ติ๊ก จะไม่ถูกนำออกไป (ทำรายการบางส่วน)</p>
            )}
            {eventChecklist.length === 0 && (
               <p className={`text-xs text-center mt-3 font-bold ${isDarkMode ? 'text-rose-400' : 'text-rose-500'}`}>* กรุณาติ๊กเลือกอุปกรณ์อย่างน้อย 1 ชิ้นเพื่อทำรายการ</p>
            )}
          </div>
        </div>
      )}

      {/* 📋 Return Modal (ระบบรับคืน) */}
      {returnTargetIds.length > 0 && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9990]`}>
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto custom-scrollbar ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-black flex items-center gap-2 ${theme.textTitle}`}><Icons.CheckCircle className="text-emerald-500 w-6 h-6" /> บันทึกรับคืนอุปกรณ์</h3>
              <button type="button" onClick={() => { setReturnTargetIds([]); setReturnChecklist([]); }} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
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

            <div className={`mb-8 p-4 border rounded-xl ${isDarkMode ? 'bg-slate-900/50 border-slate-700' : 'bg-slate-50 border-slate-200'}`}>
              <div className="flex justify-between items-center mb-3">
                <h4 className={`font-bold flex items-center gap-2 ${isDarkMode ? 'text-slate-300' : 'text-slate-700'}`}>
                  <Icons.ClipboardList className="w-5 h-5" /> เช็คลิสต์ของเข้ากล่อง ({returnChecklist.length}/{returnTargetIds.length})
                </h4>
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
                      <span className={`font-bold text-sm sm:text-base leading-tight ${isChecked ? (isDarkMode ? 'text-emerald-400 line-through opacity-70' : 'text-emerald-700 line-through opacity-70') : theme.textMain}`}>
                        {item.name} <span className={`text-xs font-normal block mt-0.5 ${theme.textMuted}`}>(S.N: {item.sn || '-'})</span>
                      </span>
                    </label>
                  );
                })}
              </div>
            </div>

            <div className="flex gap-3">
              <button type="button" onClick={() => { setReturnTargetIds([]); setReturnChecklist([]); }} className={`flex-1 py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ยกเลิก</button>
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
              <h3 className={`text-2xl font-black flex items-center gap-3 ${theme.textTitle}`}><Icons.ClipboardList className="w-6 h-6 text-blue-500"/> ประวัติการทำงานส่วนกลาง</h3>
              <button type="button" onClick={() => setShowAuditModal(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-5 h-5" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 space-y-4">
              {auditLogs.length === 0 ? (
                <div className={`text-center py-10 font-bold text-xl ${theme.textMuted}`}>ยังไม่มีประวัติการทำงานใดๆ</div>
              ) : auditLogs.map((log) => {
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
                        <span className={`text-sm font-bold ${theme.textMuted}`}>{log.timestamp ? new Date(log.timestamp).toLocaleTimeString('th-TH') : '-'} น.</span>
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
          <div className={`rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl ${theme.cardBg}`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className={`text-2xl font-black ${theme.textTitle}`}>ประวัติการยืม-คืน</h3>
              <button type="button" onClick={() => setShowHistory(null)} className={`p-2 hover:text-blue-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-6 h-6" /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {(() => {
                const historyItem = items.find(i => i.id === showHistory);
                const historyList = historyItem?.history || [];
                if (historyList.length === 0) {
                  return <div className={`text-center py-8 font-bold text-xl ${theme.textMuted}`}>ยังไม่มีประวัติการใช้งาน</div>;
                }
                return historyList.slice().reverse().map((h, idx) => {
                  const isBorrow = h.type === 'borrow';
                  const isEvent = h.type === 'event';
                  return (
                    <div key={idx} className={`p-5 rounded-xl border ${isBorrow ? (isDarkMode ? 'bg-purple-900/20 border-purple-800/50' : 'bg-purple-50 border-purple-100') : isEvent ? (isDarkMode ? 'bg-orange-900/20 border-orange-800/50' : 'bg-orange-50 border-orange-100') : (isDarkMode ? 'bg-emerald-900/20 border-emerald-800/50' : 'bg-emerald-50 border-emerald-100')}`}>
                      <div className="flex items-center gap-3 mb-3">
                        <span className={`text-sm font-black px-3 py-1.5 rounded-md ${isBorrow ? (isDarkMode ? 'bg-purple-900/50 text-purple-400' : 'bg-purple-200 text-purple-700') : isEvent ? (isDarkMode ? 'bg-orange-900/50 text-orange-400' : 'bg-orange-200 text-orange-700') : (isDarkMode ? 'bg-emerald-900/50 text-emerald-400' : 'bg-emerald-200 text-emerald-700')}`}>{isBorrow ? 'ยืมออก' : isEvent ? 'ออกงาน' : 'รับคืน'}</span>
                        <span className={`text-base font-bold ${theme.textMuted}`}>{h.date ? new Date(h.date).toLocaleString('th-TH') : '-'}</span>
                      </div>
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

      {/* Modal ยืนยันการลบอุปกรณ์ในตารางหลัก */}
      {itemToDelete && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl ${theme.cardBg}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6 ${isDarkMode ? 'bg-rose-900/40 text-rose-500' : 'bg-rose-100 text-rose-500'}`}><Icons.Trash className="w-10 h-10" /></div>
            <h3 className={`text-2xl font-black mb-2 ${theme.textTitle}`}>ลบอุปกรณ์?</h3>
            <p className={`mb-6 text-lg ${theme.textMuted}`}>
              คุณแน่ใจหรือไม่ที่จะลบ<br/>
              <span className="font-bold text-rose-500 text-xl block mt-2">"{itemToDelete.name}"</span>
            </p>
            <div className="flex gap-3">
              <button type="button" onClick={() => setItemToDelete(null)} className={`flex-1 py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleDeleteItem} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-500/20 text-lg hover:bg-rose-500">ยืนยันการลบ</button>
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
              <button type="button" onClick={() => setShowForm(false)} className={`p-2 hover:text-rose-500 transition-colors ${theme.textMuted}`}><Icons.X className="w-6 h-6" /></button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
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
                <label className={`block text-base sm:text-lg font-bold mb-2 ${theme.textTitle}`}>สถานะ</label>
                <select className={`w-full px-4 py-3 rounded-xl font-bold outline-none text-lg border ${theme.input}`} value={formData.status || 'available'} onChange={e => setFormData({...formData, status: e.target.value})}>
                  {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>

            </div>
            <div className="flex gap-3 mt-8">
              <button type="button" onClick={() => setShowForm(false)} className={`flex-1 py-4 font-bold rounded-xl transition-colors text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleSave} className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl shadow-lg shadow-blue-500/20 transition-colors text-lg">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className={`fixed inset-0 ${theme.modalOverlay} backdrop-blur-sm flex items-center justify-center p-4 z-[9999]`}>
          <div className={`rounded-3xl p-8 max-w-sm w-full shadow-2xl ${theme.cardBg}`}>
            <h3 className={`text-2xl font-black mb-6 text-center ${theme.textTitle}`}>เข้าสู่ระบบจัดการ</h3>
            <input type="password" autoFocus className={`w-full px-4 py-4 border rounded-xl font-bold text-center text-3xl tracking-widest outline-none mb-6 ${theme.input}`} maxLength={8} value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }} />
            <div className="flex gap-3">
              <button type="button" onClick={() => setShowLogin(false)} className={`flex-1 py-4 font-bold rounded-xl text-lg ${theme.btnCancel}`}>ยกเลิก</button>
              <button type="button" onClick={handleLogin} className="flex-1 py-4 bg-blue-600 text-white font-bold rounded-xl text-lg hover:bg-blue-500">เข้าสู่ระบบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// 🛡️ Error Boundary - เกราะป้องกันหน้าจอขาวโพน
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
