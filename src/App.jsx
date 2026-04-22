import React, { useState, useMemo, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from "firebase/firestore";

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

// รหัสผ่านเข้าสู่ระบบ
const ADMIN_PIN = 'mdec8203';

const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Edit: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Package: () => <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Alert: () => <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  UserPlus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  CheckCircle: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  History: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Folder: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  List: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  MapPin: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.242-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  ChevronDown: () => <svg className="w-4 h-4 ml-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
};

const DEPARTMENTS = [
  { id: 'ทั้งหมด', label: 'ทั้งหมด' },
  { id: 'ฝ่ายภาพนิ่ง', label: 'ฝ่ายภาพนิ่ง' },
  { id: 'ฝ่ายวิดีโอ', label: 'ฝ่ายวิดีโอ' },
  { id: 'ฝ่ายอุปกรณ์เครื่องเสียง', label: 'ฝ่ายอุปกรณ์เครื่องเสียง' },
  { id: 'ห้องประชุม', label: 'ห้องประชุม' }
];

const DEFAULT_CATEGORIES = ['กล้อง', 'เลนส์', 'ไมโครโฟน', 'ชุดลำโพง', 'สายสัญญาณ', 'ไฟสตูดิโอ', 'ถ่าน/แบตเตอรี่'];
const DEFAULT_ROOMS = ['ห้องประชุม 1', 'ห้องประชุม 2', 'ห้องประชุม 3'];
const DEFAULT_LOCATIONS = ['ตู้เก็บของ 1', 'ตู้เก็บของ 2', 'ห้องสตูดิโอ'];

const STATUSES = [
  { id: 'available', label: 'พร้อมใช้งาน', color: 'bg-emerald-100 text-emerald-700 border-emerald-300' },
  { id: 'in-use', label: 'กำลังใช้งาน', color: 'bg-amber-100 text-amber-700 border-amber-300' },
  { id: 'borrowed', label: 'ถูกยืม', color: 'bg-purple-100 text-purple-700 border-purple-300' },
  { id: 'maintenance', label: 'ส่งซ่อม/ชำรุด', color: 'bg-rose-100 text-rose-700 border-rose-300' }
];

export default function App() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(DEFAULT_CATEGORIES);
  const [rooms, setRooms] = useState(DEFAULT_ROOMS);
  const [locations, setLocations] = useState(DEFAULT_LOCATIONS);
  
  const [isLoading, setIsLoading] = useState(true);
  const [firebaseError, setFirebaseError] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [password, setPassword] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [filterDept, setFilterDept] = useState('ทั้งหมด');

  // Modals & Menus
  const [showAddModal, setShowAddModal] = useState(false);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [showSettingsMenu, setShowSettingsMenu] = useState(false);
  const settingsMenuRef = useRef(null);

  // Borrow/Return
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [borrowItem, setBorrowItem] = useState(null);
  const [borrowForm, setBorrowForm] = useState({ name: '', expectedReturnDate: '', issuer: '' });
  
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItem, setReturnItem] = useState(null);
  const [returnForm, setReturnForm] = useState({ receiver: '' });
  
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [historyItem, setHistoryItem] = useState(null);
  
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);

  // Form
  const [formData, setFormData] = useState({
    name: '', sn: '', quantity: 1, department: 'ฝ่ายภาพนิ่ง', category: '', customCategory: '', location: '', customLocation: '', status: 'available'
  });

  const [newCategory, setNewCategory] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newLocation, setNewLocation] = useState('');

  useEffect(() => {
    let unsubscribeItems, unsubscribeCategories, unsubscribeRooms, unsubscribeLocations;

    const initializeData = async () => {
      try {
        await signInAnonymously(auth);
        
        unsubscribeItems = onSnapshot(collection(db, 'mdec_stock', 'shared_data', 'items'), (snapshot) => {
          setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })).sort((a, b) => b.updatedAt - a.updatedAt));
          setIsLoading(false); setFirebaseError(false);
        }, (err) => { setFirebaseError(true); setIsLoading(false); });

        unsubscribeCategories = onSnapshot(collection(db, 'mdec_stock', 'shared_data', 'categories'), (snapshot) => {
          if (!snapshot.empty) setCategories(snapshot.docs.map(doc => doc.data().name));
        });

        unsubscribeRooms = onSnapshot(collection(db, 'mdec_stock', 'shared_data', 'rooms'), (snapshot) => {
          if (!snapshot.empty) setRooms(snapshot.docs.map(doc => doc.data().name));
        });

        unsubscribeLocations = onSnapshot(collection(db, 'mdec_stock', 'shared_data', 'locations'), (snapshot) => {
          if (!snapshot.empty) setLocations(snapshot.docs.map(doc => doc.data().name));
        });

      } catch (error) { setFirebaseError(true); setIsLoading(false); }
    };

    initializeData();

    const handleClickOutside = (event) => {
      if (settingsMenuRef.current && !settingsMenuRef.current.contains(event.target)) setShowSettingsMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      if (unsubscribeItems) unsubscribeItems();
      if (unsubscribeCategories) unsubscribeCategories();
      if (unsubscribeRooms) unsubscribeRooms();
      if (unsubscribeLocations) unsubscribeLocations();
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogin = (e) => { e.preventDefault(); if (password === ADMIN_PIN) { setIsLoggedIn(true); setShowLoginModal(false); setPassword(''); } else alert('รหัสผ่านไม่ถูกต้อง'); };
  const handleLogout = () => setIsLoggedIn(false);

  const saveItem = async (e) => {
    e.preventDefault();
    if (!formData.name) return;

    let finalCategory = formData.category;
    if (formData.category === 'อื่นๆ' && formData.customCategory.trim() !== '') {
      finalCategory = formData.customCategory.trim();
      if (!categories.includes(finalCategory)) await setDoc(doc(collection(db, 'mdec_stock', 'shared_data', 'categories')), { name: finalCategory });
    }

    let finalLocation = formData.location;
    if (formData.location === 'อื่นๆ' && formData.customLocation?.trim() !== '') {
      finalLocation = formData.customLocation.trim();
      const targetCollection = formData.department === 'ห้องประชุม' ? 'rooms' : 'locations';
      const locList = formData.department === 'ห้องประชุม' ? rooms : locations;
      if (!locList.includes(finalLocation)) await setDoc(doc(collection(db, 'mdec_stock', 'shared_data', targetCollection)), { name: finalLocation });
    }

    const itemData = {
      name: formData.name, sn: formData.sn || '-', quantity: Number(formData.quantity) || 1, department: formData.department,
      category: finalCategory, location: finalLocation, status: formData.status, updatedAt: Date.now(),
    };

    if (editingItem) {
      await setDoc(doc(db, 'mdec_stock', 'shared_data', 'items', editingItem.id), itemData, { merge: true });
    } else {
      await setDoc(doc(collection(db, 'mdec_stock', 'shared_data', 'items')), { ...itemData, history: [] });
    }
    setShowAddModal(false); setEditingItem(null);
  };

  const handleDeleteItem = async () => {
    if (itemToDelete) { await deleteDoc(doc(db, 'mdec_stock', 'shared_data', 'items', itemToDelete.id)); setShowDeleteModal(false); setItemToDelete(null); }
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    if (!borrowForm.name || !borrowItem || !borrowForm.issuer) return;
    const borrowRecord = { borrower: borrowForm.name, issuer: borrowForm.issuer, borrowDate: Date.now(), expectedReturnDate: new Date(borrowForm.expectedReturnDate).getTime(), returnDate: null, receiver: null, status: 'borrowed' };
    const updatedHistory = [...(borrowItem.history || []), borrowRecord];
    await setDoc(doc(db, 'mdec_stock', 'shared_data', 'items', borrowItem.id), { status: 'borrowed', currentBorrower: borrowForm.name, borrowDate: borrowRecord.borrowDate, expectedReturnDate: borrowRecord.expectedReturnDate, history: updatedHistory, updatedAt: Date.now() }, { merge: true });
    setShowBorrowModal(false); setBorrowForm({ name: '', expectedReturnDate: '', issuer: '' }); setBorrowItem(null);
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!returnForm.receiver || !returnItem) return;
    const history = [...(returnItem.history || [])];
    if (history.length > 0 && history[history.length - 1].status === 'borrowed') {
      history[history.length - 1].returnDate = Date.now(); history[history.length - 1].status = 'returned'; history[history.length - 1].receiver = returnForm.receiver;
    }
    await setDoc(doc(db, 'mdec_stock', 'shared_data', 'items', returnItem.id), { status: 'available', currentBorrower: null, borrowDate: null, expectedReturnDate: null, history: history, updatedAt: Date.now() }, { merge: true });
    setShowReturnModal(false); setReturnForm({ receiver: '' }); setReturnItem(null);
  };

  const addCategory = async (e) => { e.preventDefault(); if (newCategory.trim() && !categories.includes(newCategory.trim())) { await setDoc(doc(collection(db, 'mdec_stock', 'shared_data', 'categories')), { name: newCategory.trim() }); setNewCategory(''); } };
  const addRoom = async (e) => { e.preventDefault(); if (newRoom.trim() && !rooms.includes(newRoom.trim())) { await setDoc(doc(collection(db, 'mdec_stock', 'shared_data', 'rooms')), { name: newRoom.trim() }); setNewRoom(''); } };
  const addLocation = async (e) => { e.preventDefault(); if (newLocation.trim() && !locations.includes(newLocation.trim())) { await setDoc(doc(collection(db, 'mdec_stock', 'shared_data', 'locations')), { name: newLocation.trim() }); setNewLocation(''); } };

  const exportToCSV = () => {
    const headers = ['ชื่ออุปกรณ์', 'รหัส S.N.', 'จำนวน', 'ฝ่าย', 'หมวดหมู่', 'สถานที่', 'สถานะ', 'ผู้ยืมปัจจุบัน'];
    const csvData = items.map(item => [item.name, item.sn || '-', item.quantity || 1, item.department, item.category, item.location, STATUSES.find(s => s.id === item.status)?.label || item.status, item.currentBorrower || '-']);
    const csvContent = "\uFEFF" + [headers, ...csvData].map(e => e.join(",")).join("\n");
    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([csvContent], { type: 'text/csv;charset=utf-8;' }));
    link.download = `mdec_stock_${new Date().toLocaleDateString()}.csv`;
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || (item.sn && item.sn.toLowerCase().includes(searchQuery.toLowerCase())) || (item.location && item.location.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesDept = filterDept === 'ทั้งหมด' || item.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const getSum = (arr) => arr.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0);
  const stats = useMemo(() => ({
    total: getSum(items), available: getSum(items.filter(i => i.status === 'available')), borrowed: getSum(items.filter(i => i.status === 'borrowed')), maintenance: getSum(items.filter(i => i.status === 'maintenance'))
  }), [items]);

  const getEquipmentStats = (keyword) => {
    const equipment = items.filter(i => (i.category || '').toLowerCase().includes(keyword.toLowerCase()) || i.name.toLowerCase().includes(keyword.toLowerCase()));
    return { total: getSum(equipment), available: getSum(equipment.filter(i => i.status === 'available')) };
  };

  const equipmentSummary = [
    { label: 'กล้อง', ...getEquipmentStats('กล้อง') }, { label: 'เลนส์', ...getEquipmentStats('เลนส์') },
    { label: 'ไมโครโฟน', ...getEquipmentStats('ไมค์') }, { label: 'ชุดลำโพง', ...getEquipmentStats('ลำโพง') },
    { label: 'ถ่าน/แบตเตอรี่', ...getEquipmentStats('ถ่าน') }
  ];

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-slate-100"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans pb-10 w-full">
      {/* Navbar แบบ Full Width ขยายขนาดตัวอักษร */}
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm w-full">
        <div className="w-full px-4 sm:px-6 lg:px-8 max-w-none">
          <div className="flex justify-between h-20 items-center">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md">
                <Icons.Package />
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight tracking-tight">MDEC-Stock</h1>
                <p className="text-sm font-medium text-slate-500 mt-0.5">ระบบจัดการสต๊อก ศูนย์มัลติมีเดีย</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3 sm:gap-4">
              {isLoggedIn ? (
                <>
                  <button onClick={exportToCSV} className="hidden sm:flex px-4 py-2.5 text-base font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl items-center gap-2 transition-colors">
                    <Icons.Download /> <span>ส่งออก Sheet</span>
                  </button>
                  
                  <div className="relative" ref={settingsMenuRef}>
                    <button onClick={() => setShowSettingsMenu(!showSettingsMenu)} className="px-4 py-2.5 text-base font-bold text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 shadow-sm rounded-xl flex items-center gap-2 transition-colors">
                      <Icons.Settings /> <span className="hidden sm:inline">ตั้งค่า</span> <Icons.ChevronDown />
                    </button>
                    {showSettingsMenu && (
                      <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-xl shadow-xl py-2 z-50 overflow-hidden">
                        <div className="px-5 py-2 bg-slate-50 border-b border-slate-100 text-sm font-extrabold text-slate-500 uppercase tracking-wider">จัดการตัวเลือก</div>
                        <button onClick={() => { setShowCategoryModal(true); setShowSettingsMenu(false); }} className="w-full text-left px-5 py-3.5 text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"><span className="text-slate-400"><Icons.Folder /></span> หมวดหมู่อุปกรณ์</button>
                        <button onClick={() => { setShowLocationModal(true); setShowSettingsMenu(false); }} className="w-full text-left px-5 py-3.5 text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"><span className="text-slate-400"><Icons.MapPin /></span> สถานที่จัดเก็บ</button>
                        <button onClick={() => { setShowRoomModal(true); setShowSettingsMenu(false); }} className="w-full text-left px-5 py-3.5 text-base font-medium text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center gap-3 transition-colors"><span className="text-slate-400"><Icons.List /></span> รายชื่อห้องประชุม</button>
                      </div>
                    )}
                  </div>
                  <button onClick={handleLogout} className="p-2.5 sm:px-4 sm:py-2.5 text-base font-bold text-rose-600 hover:bg-rose-50 border border-transparent hover:border-rose-200 rounded-xl transition-colors flex items-center gap-2">
                    <span className="hidden sm:inline">ออกจากระบบ</span><span className="sm:hidden"><Icons.Lock /></span>
                  </button>
                </>
              ) : (
                <button onClick={() => setShowLoginModal(true)} className="px-4 py-2.5 sm:px-5 text-base font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl flex items-center gap-2 transition-colors shadow-md">
                  <Icons.Lock /> <span className="hidden sm:inline">เข้าสู่ระบบเพื่อจัดการ</span><span className="sm:hidden">เข้าสู่ระบบ</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content แบบขยายใหญ่ขึ้น */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {firebaseError && (
          <div className="bg-red-50 border-l-4 border-red-500 p-5 rounded-r-xl shadow-sm flex items-start gap-4">
            <Icons.Alert />
            <div>
              <h3 className="text-red-800 font-extrabold text-lg">ฐานข้อมูลขัดข้อง (Missing Permissions)</h3>
              <p className="text-red-700 text-base mt-1">กรุณาตั้งค่า Rules ใน Firebase เป็น `allow read, write: if true;` ตามคู่มือครับ</p>
            </div>
          </div>
        )}

        {/* Stats Grid สบายตา ตัวหนังสือใหญ่ขึ้น */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-5">
          {[ 
            { label: 'อุปกรณ์ทั้งหมด', val: stats.total, color: 'blue', txt: 'text-slate-800' },
            { label: 'พร้อมใช้งาน', val: stats.available, color: 'emerald', txt: 'text-emerald-600' },
            { label: 'กำลังถูกยืม', val: stats.borrowed, color: 'purple', txt: 'text-purple-600' },
            { label: 'ส่งซ่อม/ชำรุด', val: stats.maintenance, color: 'rose', txt: 'text-rose-600' }
          ].map((s, i) => (
            <div key={i} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-md flex flex-col items-center justify-center text-center relative overflow-hidden">
              <div className={`absolute top-0 left-0 w-full h-1.5 bg-${s.color}-500`}></div>
              <p className="text-base font-bold text-slate-500 mb-2">{s.label}</p>
              <p className={`text-4xl sm:text-5xl font-black ${s.txt}`}>{s.val}</p>
            </div>
          ))}
        </div>

        {/* Sub Stats - ขยายตัวหนังสือย่อย */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {equipmentSummary.map(eq => (
            <div key={eq.label} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md hover:shadow-lg transition-shadow">
              <div className="flex justify-between items-end mb-4">
                <div>
                  <p className="text-sm font-bold text-slate-500">{eq.label}</p>
                  <p className="text-2xl font-black text-slate-900 mt-1">{eq.total} <span className="text-xs font-semibold text-slate-400">ชิ้น</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-600 font-bold mb-1">พร้อมใช้งาน</p>
                  <p className="text-base font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-100">{eq.available}</p>
                </div>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${eq.total === 0 ? 0 : (eq.available / eq.total) * 100}%` }}></div>
              </div>
            </div>
          ))}
        </div>

        {/* Filters Panel ขยายไซส์ฟอร์ม */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-md flex flex-col xl:flex-row gap-5 items-center justify-between">
          <div className="relative w-full xl:w-96">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Icons.Search /></div>
            <input type="text" placeholder="ค้นหาชื่ออุปกรณ์, รหัส, สถานที่..." className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-300 rounded-xl text-base font-medium focus:ring-2 focus:ring-blue-500 outline-none" value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} />
          </div>
          <div className="flex overflow-x-auto w-full xl:w-auto pb-2 xl:pb-0 hide-scrollbar gap-3">
            {DEPARTMENTS.map(dept => (
              <button key={dept.id} onClick={() => setFilterDept(dept.id)} className={`whitespace-nowrap px-5 py-2.5 rounded-xl text-base font-bold transition-all shadow-sm ${ filterDept === dept.id ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-600 border border-slate-300 hover:bg-slate-50' }`}>
                {dept.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Table ขยายตัวอักษรให้อ่านง่ายจัดๆ */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden">
          <div className="p-5 sm:p-6 border-b border-slate-200 flex justify-between items-center bg-white">
            <h2 className="text-xl sm:text-2xl font-black text-slate-800 flex items-center gap-3">
              รายการอุปกรณ์ <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-full font-bold">{filteredItems.length}</span>
            </h2>
            {isLoggedIn && (
              <button onClick={() => { setEditingItem(null); setFormData({ name: '', sn: '', quantity: 1, department: 'ฝ่ายภาพนิ่ง', category: categories[0] || '', customCategory: '', location: locations[0] || '', customLocation: '', status: 'available' }); setShowAddModal(true); }} className="px-5 py-3 text-base font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-md flex items-center gap-2 transition-all">
                <Icons.Plus /> <span className="hidden sm:inline">เพิ่มอุปกรณ์ใหม่</span>
              </button>
            )}
          </div>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-200 border-b-2 border-slate-300 text-sm uppercase tracking-wider text-slate-700 font-extrabold">
                  <th className="p-5 pl-6 w-1/3">ชื่ออุปกรณ์ / รหัส</th>
                  <th className="p-5 w-1/6">หมวดหมู่</th>
                  <th className="p-5 w-1/5">สถานที่ / ห้องประชุม</th>
                  <th className="p-5 w-1/6">สถานะ</th>
                  <th className="p-5 pr-6 text-right w-1/6">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {filteredItems.length === 0 ? (
                  <tr><td colSpan="5" className="p-16 text-center text-slate-400"><div className="flex justify-center mb-4"><Icons.Package /></div><p className="text-lg font-bold text-slate-500">ไม่พบข้อมูลที่ค้นหา</p></td></tr>
                ) : (
                  filteredItems.map(item => {
                    const statusConfig = STATUSES.find(s => s.id === item.status) || STATUSES[0];
                    return (
                      <tr key={item.id} className="hover:bg-blue-50/60 transition-colors group bg-white">
                        <td className="p-5 pl-6">
                          <div className="flex items-center gap-3 mb-1">
                            <p className="font-black text-slate-900 text-base">{item.name}</p>
                            {item.quantity > 1 && <span className="bg-blue-100 text-blue-700 text-xs px-2.5 py-0.5 rounded-md font-bold whitespace-nowrap border border-blue-200 shadow-sm">จำนวน: {item.quantity}</span>}
                          </div>
                          <div className="flex items-center gap-3 mt-2">
                            <p className="text-sm font-semibold text-slate-500 bg-slate-100 px-2 py-0.5 rounded border border-slate-200 font-mono">S.N.: {item.sn || '-'}</p>
                            <span className="inline-flex px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-500 border border-slate-200">{item.department}</span>
                          </div>
                        </td>
                        <td className="p-5 text-base font-bold text-blue-700">
                          <span className="bg-blue-50 px-3 py-1 rounded-lg border border-blue-100">{item.category || '-'}</span>
                        </td>
                        <td className="p-5 text-base font-bold text-slate-700">{item.location || '-'}</td>
                        <td className="p-5">
                          <div className="flex flex-col gap-2 items-start">
                            <span className={`inline-flex px-3.5 py-1.5 rounded-full text-sm font-black border shadow-sm ${statusConfig.color}`}>{statusConfig.label}</span>
                            {item.status === 'borrowed' && item.currentBorrower && <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-1 rounded-md border border-purple-200 shadow-sm">👤 {item.currentBorrower}</span>}
                          </div>
                        </td>
                        <td className="p-5 pr-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button onClick={() => { setHistoryItem(item); setShowHistoryModal(true); }} className="p-2.5 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-colors"><Icons.History /></button>
                            {isLoggedIn && (
                              <>
                                {item.status === 'available' && <button onClick={() => { setBorrowItem(item); setShowBorrowModal(true); }} className="p-2.5 text-slate-500 hover:text-purple-700 hover:bg-purple-100 rounded-xl transition-colors"><Icons.UserPlus /></button>}
                                {item.status === 'borrowed' && <button onClick={() => { setReturnItem(item); setShowReturnModal(true); }} className="p-2.5 text-slate-500 hover:text-emerald-700 hover:bg-emerald-100 rounded-xl transition-colors"><Icons.CheckCircle /></button>}
                                <button onClick={() => {
                                  const isKnownCat = categories.includes(item.category);
                                  const locList = item.department === 'ห้องประชุม' ? rooms : locations;
                                  const isKnownLoc = locList.includes(item.location);
                                  setEditingItem(item);
                                  setFormData({ ...item, quantity: item.quantity || 1, category: isKnownCat ? item.category : 'อื่นๆ', customCategory: isKnownCat ? '' : item.category, location: isKnownLoc ? item.location : 'อื่นๆ', customLocation: isKnownLoc ? '' : item.location });
                                  setShowAddModal(true);
                                }} className="p-2.5 text-slate-500 hover:text-blue-700 hover:bg-blue-100 rounded-xl transition-colors"><Icons.Edit /></button>
                                <button onClick={() => { setItemToDelete(item); setShowDeleteModal(true); }} className="p-2.5 text-slate-500 hover:text-red-700 hover:bg-red-100 rounded-xl transition-colors"><Icons.Trash /></button>
                              </>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Modals ขยาย Text Size ให้อ่านง่าย */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center">
              <h3 className="text-xl font-black text-slate-800">{editingItem ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 rounded-full p-1.5 transition-colors"><Icons.Plus className="rotate-45" /></button>
            </div>
            <div className="overflow-y-auto p-8 custom-scrollbar">
              <form id="add-form" onSubmit={saveItem} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="sm:col-span-2">
                    <label className="block text-base font-extrabold text-slate-700 mb-2">ชื่ออุปกรณ์</label>
                    <input required type="text" className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-bold bg-slate-50" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="เช่น กล้อง Sony A7IV" />
                  </div>
                  <div>
                    <label className="block text-base font-extrabold text-slate-700 mb-2">ฝ่ายรับผิดชอบ</label>
                    <select className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-bold bg-slate-50" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value, location: e.target.value === 'ห้องประชุม' ? (rooms[0] || '') : (locations[0] || ''), customLocation: ''})}>
                      {DEPARTMENTS.filter(d => d.id !== 'ทั้งหมด').map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-base font-extrabold text-slate-700 mb-2">หมวดหมู่อุปกรณ์</label>
                    <select className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-bold bg-slate-50" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})}>
                      <option value="" disabled>เลือกหมวดหมู่...</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="อื่นๆ" className="font-extrabold text-blue-600 bg-blue-50">➕ เพิ่มหมวดหมู่ใหม่ (พิมพ์เอง)</option>
                    </select>
                    {formData.category === 'อื่นๆ' && <input required type="text" className="w-full mt-3 px-5 py-3 border-2 border-blue-400 rounded-xl outline-none bg-blue-50 text-base font-bold" value={formData.customCategory} onChange={e => setFormData({...formData, customCategory: e.target.value})} placeholder="พิมพ์ชื่อหมวดหมู่ใหม่..." />}
                  </div>
                  <div>
                    <label className="block text-base font-extrabold text-slate-700 mb-2">สถานที่จัดเก็บ / ห้อง</label>
                    <select className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-bold bg-slate-50" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})}>
                      <option value="" disabled>เลือกสถานที่...</option>
                      {(formData.department === 'ห้องประชุม' ? rooms : locations).map(loc => <option key={loc} value={loc}>{loc}</option>)}
                      <option value="อื่นๆ" className="font-extrabold text-blue-600 bg-blue-50">➕ เพิ่มสถานที่ใหม่ (พิมพ์เอง)</option>
                    </select>
                    {formData.location === 'อื่นๆ' && <input required type="text" className="w-full mt-3 px-5 py-3 border-2 border-blue-400 rounded-xl outline-none bg-blue-50 text-base font-bold" value={formData.customLocation || ''} onChange={e => setFormData({...formData, customLocation: e.target.value})} placeholder="พิมพ์ชื่อสถานที่ใหม่..." />}
                  </div>
                  <div>
                    <label className="block text-base font-extrabold text-slate-700 mb-2">สถานะเริ่มต้น</label>
                    <select className="w-full px-5 py-3 border border-slate-300 rounded-xl outline-none text-base font-extrabold bg-slate-50" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                      {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                    </select>
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <label className="block text-base font-extrabold text-slate-700 mb-2">รหัส S.N. <span className="text-sm font-medium text-slate-400 font-normal">(เว้นว่างได้)</span></label>
                    <input type="text" className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-base font-mono bg-slate-50" value={formData.sn} onChange={e => setFormData({...formData, sn: e.target.value})} placeholder="เช่น CAM-001 หรือ -" />
                  </div>
                  <div className="pt-4 border-t border-slate-200">
                    <label className="block text-base font-extrabold text-blue-600 mb-2">จำนวน (ชิ้น/ชุด)</label>
                    <input required type="number" min="1" className="w-full px-5 py-3 border-2 border-blue-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-lg font-black text-blue-800 bg-blue-50" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                  </div>
                </div>
              </form>
            </div>
            <div className="px-8 py-5 flex gap-4 border-t border-slate-200 bg-slate-50">
              <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 px-5 py-3.5 bg-white border border-slate-300 text-slate-700 rounded-xl text-base font-black hover:bg-slate-100 transition-colors">ยกเลิก</button>
              <button type="submit" form="add-form" className="flex-1 px-5 py-3.5 bg-blue-600 text-white rounded-xl text-base font-black hover:bg-blue-700 shadow-lg transition-colors">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {showLoginModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center"><div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mx-auto mb-6 text-blue-600 shadow-inner"><Icons.Lock/></div><h3 className="font-black text-2xl text-slate-800 mb-6">เข้าสู่ระบบจัดการ</h3><form onSubmit={handleLogin} className="space-y-5"><input type="password" required className="w-full px-5 py-4 text-center text-xl tracking-[0.4em] font-black border-2 border-slate-200 rounded-xl focus:border-blue-500 outline-none bg-slate-50" value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••"/><div className="flex gap-3"><button type="button" onClick={()=>setShowLoginModal(false)} className="flex-1 py-3.5 border border-slate-300 rounded-xl font-bold text-slate-600 hover:bg-slate-50 text-base">ยกเลิก</button><button type="submit" className="flex-1 py-3.5 bg-slate-900 text-white rounded-xl font-bold hover:bg-slate-800 text-base shadow-md">ยืนยัน</button></div></form></div></div>
      )}

      {showBorrowModal && borrowItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8">
            <h3 className="text-2xl font-black text-slate-800 mb-5 border-b-2 border-slate-100 pb-4">บันทึกการให้ยืม</h3>
            <div className="bg-purple-50 p-4 rounded-xl border border-purple-200 mb-6 shadow-sm"><p className="font-black text-purple-900 text-lg">{borrowItem.name}</p></div>
            <form onSubmit={handleBorrow} className="space-y-5">
              <div><label className="block text-base font-extrabold mb-2 text-slate-700">ชื่อผู้ยืม (ผู้มารับของ)</label><input required className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-slate-50 text-base font-bold" value={borrowForm.name} onChange={e=>setBorrowForm({...borrowForm, name: e.target.value})} placeholder="ระบุชื่อ-นามสกุล"/></div>
              <div><label className="block text-base font-extrabold mb-2 text-slate-700">ผู้ทำรายการให้ยืม (จนท.)</label><input required className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-slate-50 text-base font-bold" value={borrowForm.issuer} onChange={e=>setBorrowForm({...borrowForm, issuer: e.target.value})} placeholder="ชื่อเจ้าหน้าที่ศูนย์ฯ ที่จ่ายของ"/></div>
              <div><label className="block text-base font-extrabold mb-2 text-slate-700">กำหนดคืน</label><input required type="date" className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 bg-slate-50 text-base font-bold" value={borrowForm.expectedReturnDate} onChange={e=>setBorrowForm({...borrowForm, expectedReturnDate: e.target.value})}/></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={()=>setShowBorrowModal(false)} className="flex-1 py-3.5 border border-slate-300 rounded-xl font-bold hover:bg-slate-50 text-base">ยกเลิก</button><button type="submit" className="flex-1 py-3.5 bg-purple-600 text-white rounded-xl font-black hover:bg-purple-700 shadow-md text-base">บันทึกการยืม</button></div>
            </form>
          </div>
        </div>
      )}

      {showReturnModal && returnItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8">
            <h3 className="text-2xl font-black text-slate-800 mb-5 border-b-2 border-slate-100 pb-4">บันทึกการรับคืน</h3>
            <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 mb-6 shadow-sm"><p className="font-black text-emerald-900 text-lg">{returnItem.name}</p></div>
            <form onSubmit={handleReturn} className="space-y-5">
              <div><label className="block text-base font-extrabold mb-2 text-slate-700">ผู้ทำรายการรับคืน (จนท.)</label><input required className="w-full px-5 py-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500 bg-slate-50 text-base font-bold" value={returnForm.receiver} onChange={e=>setReturnForm({...returnForm, receiver: e.target.value})} placeholder="ชื่อเจ้าหน้าที่ศูนย์ฯ ที่รับของคืน"/></div>
              <div className="flex gap-3 pt-4"><button type="button" onClick={()=>setShowReturnModal(false)} className="flex-1 py-3.5 border border-slate-300 rounded-xl font-bold hover:bg-slate-50 text-base">ยกเลิก</button><button type="submit" className="flex-1 py-3.5 bg-emerald-600 text-white rounded-xl font-black hover:bg-emerald-700 shadow-md text-base">ยืนยันรับคืน</button></div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && historyItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl flex flex-col max-h-[85vh]">
            <div className="px-8 py-5 border-b bg-slate-50 flex justify-between items-center"><div><h3 className="text-xl font-black text-slate-800">ประวัติการยืม-คืน</h3><p className="text-sm font-bold text-slate-500 mt-1">{historyItem.name}</p></div><button onClick={()=>setShowHistoryModal(false)} className="text-slate-400 hover:text-slate-700 p-2"><Icons.Plus className="rotate-45" /></button></div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              {!historyItem.history || historyItem.history.length === 0 ? <div className="text-center py-10"><Icons.History /><p className="text-lg font-bold text-slate-400 mt-3">ไม่พบประวัติการยืม</p></div> : 
              <div className="space-y-5">
                {historyItem.history.slice().reverse().map((r,i)=>(
                  <div key={i} className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative">
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl bg-purple-400"></div>
                    <div className="flex justify-between border-b border-slate-100 pb-3 mb-3 ml-2"><span className="font-black text-lg text-slate-800">ผู้ยืม: {r.borrower}</span><span className={`px-3 py-1 rounded-full text-xs font-black ${r.status==='returned'?'bg-emerald-100 text-emerald-700':'bg-purple-100 text-purple-700'}`}>{r.status==='returned'?'คืนแล้ว':'กำลังยืม'}</span></div>
                    <div className="text-sm font-semibold text-slate-600 grid grid-cols-2 gap-y-3 gap-x-2 ml-2">
                      <p>ยืมเมื่อ: {new Date(r.borrowDate).toLocaleDateString()}</p>
                      <p>กำหนดคืน: <span className="text-purple-700">{new Date(r.expectedReturnDate).toLocaleDateString()}</span></p>
                      <p className="text-slate-500 bg-slate-50 px-2 py-1 rounded border border-slate-100">ผู้ให้ยืม: {r.issuer || '-'}</p>
                      {r.returnDate && <p className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100">คืนเมื่อ: {new Date(r.returnDate).toLocaleDateString()}</p>}
                      {r.receiver && <p className="text-emerald-700 bg-emerald-50 px-2 py-1 rounded border border-emerald-100 col-span-2">ผู้รับคืน: {r.receiver}</p>}
                    </div>
                  </div>
                ))}
              </div>}
            </div>
          </div>
        </div>
      )}

      {showDeleteModal && itemToDelete && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50"><div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center"><div className="w-20 h-20 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-inner"><Icons.Trash/></div><h3 className="font-black text-2xl mb-3 text-slate-800">ยืนยันการลบ?</h3><p className="text-base font-bold text-slate-600 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200">ลบ <span className="text-rose-600">"{itemToDelete.name}"</span> ถาวร</p><div className="flex gap-3"><button onClick={()=>setShowDeleteModal(false)} className="flex-1 py-3.5 border border-slate-300 rounded-xl font-bold hover:bg-slate-50 text-base">ยกเลิก</button><button onClick={handleDeleteItem} className="flex-1 py-3.5 bg-rose-600 text-white rounded-xl font-black shadow-md hover:bg-rose-700 text-base">ยืนยันการลบ</button></div></div></div>
      )}
      
      {/* Settings Modals (Category, Room, Location) ขยาย Font */}
      {[
        { show: showCategoryModal, close: ()=>setShowCategoryModal(false), title: 'ตั้งค่าหมวดหมู่อุปกรณ์', icon: <Icons.Folder/>, val: newCategory, setVal: setNewCategory, add: addCategory, list: categories },
        { show: showRoomModal, close: ()=>setShowRoomModal(false), title: 'ตั้งค่าห้องประชุม', icon: <Icons.List/>, val: newRoom, setVal: setNewRoom, add: addRoom, list: rooms },
        { show: showLocationModal, close: ()=>setShowLocationModal(false), title: 'ตั้งค่าสถานที่จัดเก็บ', icon: <Icons.MapPin/>, val: newLocation, setVal: setNewLocation, add: addLocation, list: locations }
      ].map(modal => modal.show && (
        <div key={modal.title} className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-8 py-5 border-b border-slate-200 bg-slate-50 flex justify-between items-center"><h3 className="text-lg font-black text-slate-800 flex items-center gap-3"><span className="text-blue-600">{modal.icon}</span>{modal.title}</h3><button onClick={modal.close} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-1.5 shadow-sm border border-slate-200"><Icons.Plus className="rotate-45" /></button></div>
            <div className="p-8"><form onSubmit={modal.add} className="flex gap-3 mb-6"><input required value={modal.val} onChange={e=>modal.setVal(e.target.value)} className="flex-1 px-5 py-3 border border-slate-300 bg-slate-50 text-base font-bold rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เพิ่มรายการใหม่..."/><button className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md text-base">เพิ่ม</button></form><div className="max-h-64 overflow-y-auto space-y-3 custom-scrollbar">{modal.list.map(l=><div key={l} className="p-4 bg-white rounded-xl border border-slate-200 font-bold text-base text-slate-700 shadow-sm">{l}</div>)}</div></div>
          </div>
        </div>
      ))}
    </div>
  );
}
