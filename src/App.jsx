import React, { useState, useMemo, useEffect } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection, query, where, getDocs } from "firebase/firestore";

// ⚠️ นำค่า Firebase Config ของคุณมาใส่ตรงนี้ (แทนที่คำว่า "ใส่_..._ของคุณที่นี่")
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

const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Package: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Alert: () => <svg className="w-12 h-12 text-rose-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  History: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  UserPlus: () => <svg className="w-4 h-4" fill="none" viewBox="0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  CheckCircle: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Unlock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Folder: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>,
  List: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /></svg>,
  MapPin: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.243-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  MoreVertical: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
};

const DEPARTMENTS = [
  { id: 'ภาพนิ่ง', label: 'ฝ่ายภาพนิ่ง', color: 'bg-blue-100 text-blue-700' },
  { id: 'วิดีโอ', label: 'ฝ่ายวิดีโอ', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'เครื่องเสียง', label: 'ฝ่ายอุปกรณ์เครื่องเสียง', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'ห้องประชุม', label: 'ห้องประชุม', color: 'bg-sky-100 text-sky-700' },
  { id: 'ob-live', label: 'OB-LIVE', color: 'bg-violet-100 text-violet-700' },
];

const STATUSES = [
  { id: 'available', label: 'พร้อมใช้งาน', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'in-use', label: 'กำลังใช้งาน', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'borrowed', label: 'ถูกยืม', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'maintenance', label: 'ส่งซ่อม/ชำรุด', color: 'bg-rose-100 text-rose-700 border-rose-200' }
];

const ADMIN_PIN = 'mdec8203';

export default function App() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [locations, setLocations] = useState([]);
  
  const [user, setUser] = useState(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [showLogin, setShowLogin] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  const [dbError, setDbError] = useState('');

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });
  
  const [showForm, setShowForm] = useState(false);
  const [showBorrowModal, setShowBorrowModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(null);
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [showRoomModal, setShowRoomModal] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  
  const [newCategory, setNewCategory] = useState('');
  const [newRoom, setNewRoom] = useState('');
  const [newLocation, setNewLocation] = useState('');
  
  const [editSettingState, setEditSettingState] = useState({ collection: '', oldName: '', newName: '' });
  const [deleteSettingState, setDeleteSettingState] = useState({ collection: '', name: '' });
  const [showSettingsDropdown, setShowSettingsDropdown] = useState(false);

  const [formData, setFormData] = useState({
    id: '', name: '', sn: '', department: 'ภาพนิ่ง', category: '', location: '', status: 'available', quantity: 1
  });
  const [borrowData, setBorrowData] = useState({ borrowerName: '', expectedReturnDate: '', lenderName: '' });
  const [returnData, setReturnData] = useState({ returnerName: '' }); 
  const [selectedItem, setSelectedItem] = useState(null);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    let unsubscribeItems, unsubscribeCats, unsubscribeRooms, unsubscribeLocs;
    const initApp = async () => {
      try {
        await signInAnonymously(auth);
        unsubscribeItems = onSnapshot(collection(db, 'mdec_stock', 'shared_data', 'items'), 
          (snapshot) => setItems(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }))),
          (error) => { console.error("Firestore error:", error); setDbError(error.message); }
        );
        unsubscribeCats = onSnapshot(collection(db, 'mdec_stock', 'shared_data', 'categories'), 
          (snapshot) => setCategories(snapshot.docs.map(doc => doc.data().name))
        );
        unsubscribeRooms = onSnapshot(collection(db, 'mdec_stock', 'shared_data', 'rooms'), 
          (snapshot) => setRooms(snapshot.docs.map(doc => doc.data().name))
        );
        unsubscribeLocs = onSnapshot(collection(db, 'mdec_stock', 'shared_data', 'locations'), 
          (snapshot) => setLocations(snapshot.docs.map(doc => doc.data().name))
        );
      } catch (error) { console.error("Auth error:", error); setDbError(error.message); }
    };
    initApp();
    const unsubscribeAuth = onAuthStateChanged(auth, (u) => setUser(u));
    return () => {
      if (unsubscribeItems) unsubscribeItems();
      if (unsubscribeCats) unsubscribeCats();
      if (unsubscribeRooms) unsubscribeRooms();
      if (unsubscribeLocs) unsubscribeLocs();
      unsubscribeAuth();
    };
  }, []);

  const handleLogin = (e) => { e.preventDefault(); if (pinInput === ADMIN_PIN) { setIsAdmin(true); setShowLogin(false); setPinInput(''); setLoginError(''); } else { setLoginError('รหัสผ่านไม่ถูกต้อง'); } };
  const handleLogout = () => { setIsAdmin(false); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const itemData = {
        name: formData.name.trim(), sn: formData.sn.trim(), department: formData.department,
        category: formData.category === 'other' ? '' : formData.category, 
        location: formData.location === 'other' ? '' : formData.location, 
        status: formData.status, 
        quantity: Number(formData.quantity) || 1, lastUpdated: new Date().toISOString()
      };
      if (formData.id) {
        await setDoc(doc(db, 'mdec_stock', 'shared_data', 'items', formData.id), itemData, { merge: true });
      } else {
        await setDoc(doc(collection(db, 'mdec_stock', 'shared_data', 'items')), { ...itemData, history: [] });
      }
      setShowForm(false);
    } catch (error) { console.error("Error saving item:", error); }
  };

  const handleDelete = async (id) => {
    if (window.confirm('คุณต้องการลบอุปกรณ์นี้ใช่หรือไม่?')) {
      try { await deleteDoc(doc(db, 'mdec_stock', 'shared_data', 'items', id)); } 
      catch (error) { console.error("Error deleting item:", error); }
    }
  };

  const handleBorrow = async (e) => {
    e.preventDefault();
    if (!borrowData.borrowerName.trim() || !borrowData.lenderName.trim()) return;
    try {
      const historyEntry = {
        type: 'borrow', borrower: borrowData.borrowerName, lender: borrowData.lenderName,
        date: new Date().toISOString(), expectedReturn: borrowData.expectedReturnDate
      };
      await setDoc(doc(db, 'mdec_stock', 'shared_data', 'items', selectedItem.id), {
        status: 'borrowed', currentBorrower: borrowData.borrowerName, borrowerDate: historyEntry.date,
        expectedReturn: borrowData.expectedReturnDate, history: [...(selectedItem.history || []), historyEntry]
      }, { merge: true });
      setShowBorrowModal(false); setBorrowData({ borrowerName: '', expectedReturnDate: '', lenderName: '' }); setSelectedItem(null);
    } catch (error) { console.error("Error borrowing:", error); }
  };

  const handleReturn = async (e) => {
    e.preventDefault();
    if (!returnData.returnerName.trim()) return;
    try {
      const historyEntry = { type: 'return', returnReceiver: returnData.returnerName, date: new Date().toISOString() };
      await setDoc(doc(db, 'mdec_stock', 'shared_data', 'items', selectedItem.id), {
        status: 'available', currentBorrower: null, borrowerDate: null, expectedReturn: null,
        history: [...(selectedItem.history || []), historyEntry]
      }, { merge: true });
      setShowReturnModal(false); setReturnData({ returnerName: '' }); setSelectedItem(null);
    } catch (error) { console.error("Error returning:", error); }
  };

  const addCategory = async (e) => { e.preventDefault(); if (newCategory.trim() && !categories.includes(newCategory.trim())) { await setDoc(doc(collection(db, 'mdec_stock', 'shared_data', 'categories')), { name: newCategory.trim() }); setNewCategory(''); } };
  const addRoom = async (e) => { e.preventDefault(); if (newRoom.trim() && !rooms.includes(newRoom.trim())) { await setDoc(doc(collection(db, 'mdec_stock', 'shared_data', 'rooms')), { name: newRoom.trim() }); setNewRoom(''); } };
  const addLocation = async (e) => { e.preventDefault(); if (newLocation.trim() && !locations.includes(newLocation.trim())) { await setDoc(doc(collection(db, 'mdec_stock', 'shared_data', 'locations')), { name: newLocation.trim() }); setNewLocation(''); } };

  const handleUpdateSetting = async (collectionName, oldName, newName) => {
    if (!newName.trim() || oldName === newName) { setEditSettingState({ collection: '', oldName: '', newName: '' }); return; }
    try {
      const q = query(collection(db, 'mdec_stock', 'shared_data', collectionName), where('name', '==', oldName));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (d) => { await setDoc(doc(db, 'mdec_stock', 'shared_data', collectionName, d.id), { name: newName.trim() }, { merge: true }); });
      
      let itemField = '';
      if (collectionName === 'categories') itemField = 'category';
      if (collectionName === 'rooms' || collectionName === 'locations') itemField = 'location';
      
      if (itemField) {
          const itemQ = query(collection(db, 'mdec_stock', 'shared_data', 'items'), where(itemField, '==', oldName));
          const itemSnap = await getDocs(itemQ);
          itemSnap.forEach(async (d) => { await setDoc(doc(db, 'mdec_stock', 'shared_data', 'items', d.id), { [itemField]: newName.trim() }, { merge: true }); });
      }
    } catch (error) { console.error("Error updating setting:", error); }
    setEditSettingState({ collection: '', oldName: '', newName: '' });
  };

  const handleDeleteSettingConfirm = async () => {
    if (!deleteSettingState.name) return;
    try {
      const q = query(collection(db, 'mdec_stock', 'shared_data', deleteSettingState.collection), where('name', '==', deleteSettingState.name));
      const snapshot = await getDocs(q);
      snapshot.forEach(async (d) => { await deleteDoc(doc(db, 'mdec_stock', 'shared_data', deleteSettingState.collection, d.id)); });
    } catch (error) { console.error("Error deleting setting:", error); }
    setDeleteSettingState({ collection: '', name: '' });
  };

  const exportToCSV = () => {
    if (items.length === 0) return;
    const headers = ['ชื่ออุปกรณ์', 'S.N.', 'หมวดหมู่', 'ฝ่ายที่รับผิดชอบ', 'สถานที่/ห้อง', 'สถานะ', 'จำนวนชิ้น'];
    const rows = items.map(i => [
      `"${i.name}"`, `"${i.sn || '-'}"`, `"${i.category || '-'}"`, `"${DEPARTMENTS.find(d=>d.id===i.department)?.label || '-'}"`, `"${i.location || '-'}"`, `"${STATUSES.find(s=>s.id===i.status)?.label || '-'}"`, i.quantity
    ]);
    const csvContent = "data:text/csv;charset=utf-8,\uFEFF" + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `mdec_stock_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || (item.sn && item.sn.toLowerCase().includes(searchTerm.toLowerCase())) || item.location.toLowerCase().includes(searchTerm.toLowerCase());
      const matchDept = filterDept === 'all' || item.department === filterDept;
      return matchSearch && matchDept;
    });

    result.sort((a, b) => {
      let aValue = a[sortConfig.key] || '';
      let bValue = b[sortConfig.key] || '';

      if (sortConfig.key === 'status') {
        const statusOrder = { 'available': 1, 'in-use': 2, 'borrowed': 3, 'maintenance': 4 };
        aValue = statusOrder[a.status] || 99;
        bValue = statusOrder[b.status] || 99;
      } else {
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [items, searchTerm, filterDept, sortConfig]);

  const stats = useMemo(() => {
    const s = { total: 0, available: 0, borrowed: 0, maintenance: 0, dept: {}, categories: { cam: {t:0,a:0}, lens: {t:0,a:0}, mic: {t:0,a:0}, speaker: {t:0,a:0}, battery: {t:0,a:0} } };
    DEPARTMENTS.forEach(d => s.dept[d.id] = 0);
    items.forEach(item => {
      const qty = Number(item.quantity) || 1;
      s.total += qty;
      if (item.status === 'available') s.available += qty;
      if (item.status === 'borrowed') s.borrowed += qty;
      if (item.status === 'maintenance') s.maintenance += qty;
      if (s.dept[item.department] !== undefined) s.dept[item.department] += qty;

      const cat = (item.category || '').trim();
      
      const checkExactCat = (key, exactWords) => {
        if (exactWords.includes(cat)) {
          s.categories[key].t += qty; 
          if (item.status === 'available') s.categories[key].a += qty;
        }
      };

      checkExactCat('cam', ['กล้อง', 'กล้องถ่ายภาพ', 'กล้องวิดีโอ', 'Camera']);
      checkExactCat('lens', ['เลนส์', 'Lens']);
      checkExactCat('mic', ['ไมโครโฟน', 'ไมค์', 'Microphone']);
      checkExactCat('speaker', ['ชุดลำโพง', 'ลำโพง', 'Speaker']);
      checkExactCat('battery', ['ถ่าน/แบต', 'ถ่าน', 'แบตเตอรี่', 'แบต', 'ถ่านชาร์จ', 'Battery']);
    });
    return s;
  }, [items]);

  if (dbError) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-8 rounded-2xl shadow-xl max-w-lg w-full text-center border-t-4 border-rose-500">
        <div className="mx-auto flex justify-center mb-6"><Icons.Alert /></div>
        <h2 className="text-2xl font-black text-slate-800 mb-4">เข้าถึงฐานข้อมูลไม่ได้</h2>
        <p className="text-lg text-slate-600 mb-6 font-medium">โปรดตั้งค่า Rules ใน Firebase ให้เป็น <code className="bg-slate-100 px-2 py-1 rounded text-rose-600">allow read, write: if true;</code></p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-100 font-sans text-slate-800 pb-20">
      {/* Navbar Full Width */}
      <nav className="bg-white shadow-sm border-b border-slate-200 sticky top-0 z-30">
        <div className="w-full px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md"><Icons.Package /></div>
            <div><h1 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 leading-none">MDEC-Stock</h1><p className="text-base font-bold text-slate-500">ระบบจัดการสต๊อก ศูนย์มัลติมีเดีย</p></div>
          </div>
          <div className="flex gap-2">
            {!isAdmin ? (
              <button onClick={() => setShowLogin(true)} className="flex items-center gap-2 px-5 py-3 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl transition-colors shadow-sm text-base"><Icons.Lock /><span className="hidden sm:inline">เข้าสู่ระบบเพื่อจัดการ</span></button>
            ) : (
              <>
                <button onClick={exportToCSV} className="flex items-center gap-2 px-4 py-3 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 font-bold rounded-xl transition-colors text-base" title="ส่งออก Excel"><Icons.Download /><span className="hidden sm:inline">ส่งออก</span></button>
                <div className="relative">
                  <button onClick={() => setShowSettingsDropdown(!showSettingsDropdown)} className="flex items-center gap-2 px-4 py-3 bg-slate-200 text-slate-800 hover:bg-slate-300 font-bold rounded-xl transition-colors text-base"><Icons.Settings /><span className="hidden sm:inline">ตั้งค่า</span><Icons.MoreVertical/></button>
                  {showSettingsDropdown && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 overflow-hidden z-50">
                      <button onClick={() => {setShowCategoryModal(true); setShowSettingsDropdown(false);}} className="w-full text-left px-5 py-3.5 hover:bg-slate-50 font-bold text-slate-700 text-base border-b border-slate-100 flex items-center gap-3"><Icons.Folder/> จัดการหมวดหมู่</button>
                      <button onClick={() => {setShowRoomModal(true); setShowSettingsDropdown(false);}} className="w-full text-left px-5 py-3.5 hover:bg-slate-50 font-bold text-slate-700 text-base border-b border-slate-100 flex items-center gap-3"><Icons.List/> จัดการห้องประชุม</button>
                      <button onClick={() => {setShowLocationModal(true); setShowSettingsDropdown(false);}} className="w-full text-left px-5 py-3.5 hover:bg-slate-50 font-bold text-slate-700 text-base flex items-center gap-3"><Icons.MapPin/> จัดการสถานที่จัดเก็บ</button>
                    </div>
                  )}
                </div>
                <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 bg-rose-100 hover:bg-rose-200 text-rose-700 font-bold rounded-xl transition-colors text-base" title="ออกจากระบบ"><Icons.Unlock /><span className="hidden sm:inline">ออก</span></button>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content Full Width */}
      <main className="w-full px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md flex flex-col justify-between border-t-8 border-t-blue-500"><p className="text-base sm:text-lg font-bold text-slate-500 mb-2">อุปกรณ์ทั้งหมด</p><p className="text-4xl sm:text-5xl font-black text-blue-600">{stats.total}</p></div>
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md flex flex-col justify-between border-t-8 border-t-emerald-500"><p className="text-base sm:text-lg font-bold text-slate-500 mb-2">พร้อมใช้งาน</p><p className="text-4xl sm:text-5xl font-black text-emerald-600">{stats.available}</p></div>
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md flex flex-col justify-between border-t-8 border-t-purple-500"><p className="text-base sm:text-lg font-bold text-slate-500 mb-2">กำลังถูกยืม</p><p className="text-4xl sm:text-5xl font-black text-purple-600">{stats.borrowed}</p></div>
          <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-md flex flex-col justify-between border-t-8 border-t-rose-500"><p className="text-base sm:text-lg font-bold text-slate-500 mb-2">ส่งซ่อม/ชำรุด</p><p className="text-4xl sm:text-5xl font-black text-rose-600">{stats.maintenance}</p></div>
        </div>

        {/* Sub Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
          {[
            { label: 'กล้อง', ...stats.categories.cam },
            { label: 'เลนส์', ...stats.categories.lens },
            { label: 'ไมโครโฟน', ...stats.categories.mic },
            { label: 'ชุดลำโพง', ...stats.categories.speaker },
            { label: 'ถ่าน/แบต', ...stats.categories.battery }
          ].map(c => (
            <div key={c.label} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
              <div className="flex justify-between items-end mb-3">
                <div><p className="text-base font-bold text-slate-500">{c.label}</p><p className="text-3xl font-black text-slate-800">{c.t} <span className="text-base font-bold text-slate-400">ชิ้น</span></p></div>
                <div className="text-right"><p className="text-sm font-bold text-emerald-600">พร้อมใช้</p><p className="text-2xl font-black text-emerald-600">{c.a}</p></div>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${c.t === 0 ? 0 : (c.a / c.t) * 100}%` }}></div></div>
            </div>
          ))}
        </div>

        {/* Filters & Search */}
        <div className="flex flex-col xl:flex-row gap-4 items-center bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-slate-200">
          <div className="relative w-full xl:max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Icons.Search /></div>
            <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="ค้นหาชื่ออุปกรณ์, รหัส, สถานที่..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>

          <div className="flex gap-2 overflow-x-auto w-full pb-2 xl:pb-0 custom-scrollbar">
            <button onClick={() => setFilterDept('all')} className={`whitespace-nowrap px-6 py-4 rounded-xl font-bold text-lg transition-all ${filterDept === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300'}`}>ทั้งหมด</button>
            {DEPARTMENTS.map(d => (
              <button key={d.id} onClick={() => setFilterDept(d.id)} className={`whitespace-nowrap px-6 py-4 rounded-xl font-bold text-lg transition-all ${filterDept === d.id ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300'}`}>{d.label}</button>
            ))}
          </div>
          {isAdmin && (
            <button onClick={() => { setFormData({ id: '', name: '', sn: '', department: filterDept === 'all' ? 'ภาพนิ่ง' : filterDept, category: categories[0]||'', location: '', status: 'available', quantity: 1 }); setShowForm(true); }} className="w-full xl:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-colors text-lg whitespace-nowrap"><Icons.Plus /> เพิ่มอุปกรณ์</button>
          )}
        </div>

        {/* Table / List */}
        <div className="bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1000px]">
              <thead>
                <tr className="bg-slate-200 border-b-2 border-slate-300">
                  <th onClick={() => handleSort('name')} className="p-5 sm:p-6 text-lg font-black text-slate-800 w-1/3 cursor-pointer hover:bg-slate-300 transition-colors select-none group">ชื่ออุปกรณ์ / รหัส <span className="text-blue-600 ml-1">{sortConfig.key === 'name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="text-slate-400 opacity-0 group-hover:opacity-100">↕</span>}</span></th>
                  <th onClick={() => handleSort('category')} className="p-5 sm:p-6 text-lg font-black text-slate-800 cursor-pointer hover:bg-slate-300 transition-colors select-none group">หมวดหมู่ <span className="text-blue-600 ml-1">{sortConfig.key === 'category' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="text-slate-400 opacity-0 group-hover:opacity-100">↕</span>}</span></th>
                  <th onClick={() => handleSort('location')} className="p-5 sm:p-6 text-lg font-black text-slate-800 cursor-pointer hover:bg-slate-300 transition-colors select-none group">สถานที่ / ห้องประชุม <span className="text-blue-600 ml-1">{sortConfig.key === 'location' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="text-slate-400 opacity-0 group-hover:opacity-100">↕</span>}</span></th>
                  <th onClick={() => handleSort('status')} className="p-5 sm:p-6 text-lg font-black text-slate-800 cursor-pointer hover:bg-slate-300 transition-colors select-none group">สถานะ <span className="text-blue-600 ml-1">{sortConfig.key === 'status' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : <span className="text-slate-400 opacity-0 group-hover:opacity-100">↕</span>}</span></th>
                  <th className="p-5 sm:p-6 text-lg font-black text-slate-800 text-center">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length === 0 ? (
                  <tr><td colSpan="5" className="p-12 text-center text-slate-400 font-bold text-xl">ไม่พบข้อมูลที่ค้นหา</td></tr>
                ) : (
                  filteredItems.map(item => {
                    const status = STATUSES.find(s => s.id === item.status);
                    const dept = DEPARTMENTS.find(d => d.id === item.department);
                    return (
                      <tr key={item.id} className="hover:bg-slate-50 transition-colors group">
                        <td className="p-5 sm:p-6">
                          <p className="font-black text-xl text-slate-800 flex items-center gap-3">{item.name} {item.quantity > 1 && <span className="bg-blue-100 text-blue-800 text-sm px-3 py-1 rounded-lg">x{item.quantity}</span>}</p>
                          <div className="flex gap-2 items-center mt-2"><span className="text-base font-bold text-slate-500">S.N.: {item.sn || '-'}</span></div>
                        </td>
                        <td className="p-5 sm:p-6">
                          {dept && <span className={`inline-block px-3 py-1.5 rounded-lg text-sm font-black mb-2 ${dept.color}`}>{dept.label}</span>}
                          {item.category && <p className="text-lg font-bold text-slate-700">{item.category}</p>}
                        </td>
                        <td className="p-5 sm:p-6 text-lg font-bold text-slate-700">{item.location || '-'}</td>
                        <td className="p-5 sm:p-6">
                          <span className={`px-4 py-2 rounded-xl text-base font-black border ${status?.color}`}>{status?.label}</span>
                          {item.status === 'borrowed' && (
                            <div className="mt-3 bg-purple-50 p-3 rounded-xl border border-purple-200 text-sm font-bold text-purple-900">
                              <p>ผู้ยืม: <span className="text-purple-700">{item.currentBorrower}</span></p>
                              <p>คืน: {item.expectedReturn}</p>
                            </div>
                          )}
                        </td>
                        <td className="p-5 sm:p-6">
                          <div className="flex justify-center gap-3 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                            {isAdmin && item.status === 'available' && <button onClick={() => { setSelectedItem(item); setShowBorrowModal(true); }} className="p-3 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 rounded-xl font-bold transition-colors" title="ให้ยืม"><Icons.UserPlus /></button>}
                            {isAdmin && item.status === 'borrowed' && <button onClick={() => { setSelectedItem(item); setShowReturnModal(true); }} className="p-3 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 rounded-xl font-bold transition-colors" title="รับคืน"><Icons.CheckCircle /></button>}
                            <button onClick={() => setShowHistoryModal(item)} className="p-3 bg-slate-100 text-slate-700 hover:bg-slate-200 rounded-xl transition-colors" title="ประวัติ"><Icons.History /></button>
                            {isAdmin && <button onClick={() => { setFormData({ ...item }); setShowForm(true); }} className="p-3 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-xl transition-colors" title="แก้ไข"><Icons.Edit /></button>}
                            {isAdmin && <button onClick={() => handleDelete(item.id)} className="p-3 bg-rose-50 text-rose-700 hover:bg-rose-100 rounded-xl transition-colors" title="ลบ"><Icons.Trash /></button>}
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

      {}
      {showLogin && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-sm shadow-2xl p-8 text-center">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-700"><Icons.Lock /></div>
            <h3 className="font-black text-2xl mb-6 text-slate-800">เข้าสู่ระบบผู้ดูแล</h3>
            <form onSubmit={handleLogin}>
              <input type="password" required maxLength="8" className="w-full text-center tracking-widest px-5 py-4 border-2 border-slate-300 bg-slate-50 text-2xl font-black rounded-xl mb-4 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 outline-none transition-all" placeholder="••••••••" value={pinInput} onChange={(e) => setPinInput(e.target.value)} />
              {loginError && <p className="text-rose-500 text-base font-bold mb-4">{loginError}</p>}
              <div className="flex gap-3">
                <button type="button" onClick={() => setShowLogin(false)} className="flex-1 py-4 border border-slate-300 rounded-xl font-bold hover:bg-slate-50 text-lg">ยกเลิก</button>
                <button type="submit" className="flex-1 py-4 bg-slate-800 text-white rounded-xl font-black shadow-md hover:bg-slate-900 text-lg">เข้าสู่ระบบ</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center"><h3 className="text-2xl font-black text-slate-800">{formData.id ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}</h3><button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-700 p-2"><Icons.X /></button></div>
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <form id="itemForm" onSubmit={handleSubmit} className="space-y-6">
                <div><label className="block text-base font-bold text-slate-700 mb-2">ชื่ออุปกรณ์ <span className="text-rose-500">*</span></label><input required className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} placeholder="เช่น กล้อง Sony A7IV" /></div>
                
                <div className="grid grid-cols-2 gap-5">
                  <div><label className="block text-base font-bold text-slate-700 mb-2">ฝ่ายที่รับผิดชอบ</label><select className="w-full px-5 py-4 border border-slate-300 rounded-xl bg-white font-bold text-lg" value={formData.department} onChange={(e) => setFormData({...formData, department: e.target.value})}>{DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}</select></div>
                  <div><label className="block text-base font-bold text-slate-700 mb-2">จำนวนชิ้น</label><input type="number" min="1" required className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg bg-white" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: e.target.value})} /></div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-base font-bold text-slate-700 mb-2">หมวดหมู่อุปกรณ์</label>
                    <select className="w-full px-5 py-4 border border-slate-300 rounded-xl bg-white font-bold text-lg mb-2" value={categories.includes(formData.category) ? formData.category : (formData.category === '' ? '' : 'other')} onChange={(e) => setFormData({...formData, category: e.target.value})}>
                      <option value="">-- เลือกหมวดหมู่ --</option>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                      <option value="other" className="font-black text-blue-600">+ เพิ่มหมวดหมู่ใหม่ / พิมพ์ระบุเอง...</option>
                    </select>
                    {(!categories.includes(formData.category) && formData.category !== '') || formData.category === 'other' ? (
                       <input autoFocus placeholder="พิมพ์หมวดหมู่ใหม่..." className="w-full px-5 py-4 border border-blue-400 bg-blue-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" value={formData.category === 'other' ? '' : formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} />
                    ) : null}
                  </div>
                  <div><label className="block text-base font-bold text-slate-700 mb-2">รหัส S.N. (ถ้ามี)</label><input className="w-full px-5 py-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" value={formData.sn} onChange={(e) => setFormData({...formData, sn: e.target.value})} placeholder="เช่น CAM-001 (เว้นว่างได้)" /></div>
                </div>

                <div>
                    <label className="block text-base font-bold text-slate-700 mb-2">สถานที่จัดเก็บ / ห้อง</label>
                    <select className="w-full px-5 py-4 border border-slate-300 rounded-xl bg-white font-bold text-lg mb-2" value={(locations.includes(formData.location) || rooms.includes(formData.location)) ? formData.location : (formData.location === '' ? '' : 'other')} onChange={(e) => setFormData({...formData, location: e.target.value})}>
                      <option value="">-- เลือกสถานที่ --</option>
                      {locations.length > 0 && <optgroup label="สถานที่จัดเก็บ">{locations.map(l => <option key={l} value={l}>{l}</option>)}</optgroup>}
                      {rooms.length > 0 && <optgroup label="ห้องประชุม">{rooms.map(r => <option key={r} value={r}>{r}</option>)}</optgroup>}
                      <option value="other" className="font-black text-blue-600">+ เพิ่มสถานที่ใหม่ / พิมพ์ระบุเอง...</option>
                    </select>
                    {(!locations.includes(formData.location) && !rooms.includes(formData.location) && formData.location !== '') || formData.location === 'other' ? (
                       <input autoFocus placeholder="พิมพ์สถานที่ใหม่..." className="w-full px-5 py-4 border border-blue-400 bg-blue-50 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none font-bold text-lg" value={formData.location === 'other' ? '' : formData.location} onChange={(e) => setFormData({...formData, location: e.target.value})} />
                    ) : null}
                </div>

                <div><label className="block text-base font-bold text-slate-700 mb-2">สถานะ</label><select className="w-full px-5 py-4 border border-slate-300 rounded-xl bg-white font-bold text-lg" value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})}>{STATUSES.map(s => <option key={s.id} value={s.id} disabled={s.id==='borrowed'}>{s.label}</option>)}</select></div>
              </form>
            </div>
            <div className="p-8 border-t border-slate-200 bg-slate-50 flex gap-4">
              <button type="button" onClick={() => setShowForm(false)} className="flex-1 py-4 border border-slate-300 rounded-xl font-bold hover:bg-white text-lg">ยกเลิก</button>
              <button type="submit" form="itemForm" className="flex-1 py-4 bg-blue-600 text-white rounded-xl font-black shadow-md hover:bg-blue-700 text-lg">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {showBorrowModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-8">
            <h3 className="font-black text-3xl mb-3 text-slate-800">ทำรายการให้ยืม</h3>
            <p className="text-slate-500 font-bold mb-8 text-lg">อุปกรณ์: <span className="text-blue-600">{selectedItem.name}</span></p>
            <form onSubmit={handleBorrow} className="space-y-6">
              <div><label className="block text-base font-bold text-slate-700 mb-2">ชื่อผู้ยืม <span className="text-rose-500">*</span></label><input required className="w-full px-5 py-4 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-bold text-lg" value={borrowData.borrowerName} onChange={e=>setBorrowData({...borrowData, borrowerName: e.target.value})} placeholder="ชื่อ-สกุล หรือ แผนก" /></div>
              <div><label className="block text-base font-bold text-slate-700 mb-2">กำหนดคืน</label><input type="date" required className="w-full px-5 py-4 border border-slate-300 rounded-xl outline-none focus:border-indigo-500 font-bold text-lg" value={borrowData.expectedReturnDate} onChange={e=>setBorrowData({...borrowData, expectedReturnDate: e.target.value})} /></div>
              <div className="pt-5 border-t border-slate-200"><label className="block text-base font-bold text-slate-700 mb-2">เจ้าหน้าที่ผู้ทำรายการ (ผู้ให้ยืม) <span className="text-rose-500">*</span></label><input required className="w-full px-5 py-4 border border-indigo-300 bg-indigo-50 rounded-xl outline-none focus:border-indigo-500 font-bold text-lg text-indigo-900" value={borrowData.lenderName} onChange={e=>setBorrowData({...borrowData, lenderName: e.target.value})} placeholder="ชื่อเจ้าหน้าที่" /></div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={()=>setShowBorrowModal(false)} className="flex-1 py-4 border border-slate-300 rounded-xl font-bold text-lg">ยกเลิก</button>
                <button type="submit" className="flex-1 py-4 bg-indigo-600 text-white rounded-xl font-black shadow-md text-lg">บันทึกการยืม</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showReturnModal && selectedItem && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl p-8">
            <h3 className="font-black text-3xl mb-3 text-slate-800">รับคืนอุปกรณ์</h3>
            <p className="text-slate-500 font-bold mb-8 text-lg">รับคืน <span className="text-blue-600">{selectedItem.name}</span> จาก <span className="text-purple-600">{selectedItem.currentBorrower}</span></p>
            <form onSubmit={handleReturn} className="space-y-6">
              <div><label className="block text-base font-bold text-slate-700 mb-2">เจ้าหน้าที่ผู้รับคืน <span className="text-rose-500">*</span></label><input required autoFocus className="w-full px-5 py-4 border border-emerald-300 bg-emerald-50 rounded-xl outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-lg text-emerald-900" value={returnData.returnerName} onChange={e=>setReturnData({returnerName: e.target.value})} placeholder="ชื่อเจ้าหน้าที่ผู้ตรวจรับ" /></div>
              <div className="flex gap-4 mt-8">
                <button type="button" onClick={()=>setShowReturnModal(false)} className="flex-1 py-4 border border-slate-300 rounded-xl font-bold text-lg">ยกเลิก</button>
                <button type="submit" className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-black shadow-md text-lg transition-colors">ยืนยันรับคืน</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showHistoryModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center"><h3 className="text-2xl font-black text-slate-800">ประวัติการยืม-คืน</h3><button onClick={() => setShowHistoryModal(null)} className="text-slate-400 hover:text-slate-700"><Icons.X /></button></div>
            <div className="p-8 overflow-y-auto">
              <p className="font-black text-blue-600 text-xl mb-8">{showHistoryModal.name}</p>
              {!showHistoryModal.history || showHistoryModal.history.length === 0 ? (
                <p className="text-slate-400 font-bold text-center py-12 text-lg">ไม่มีประวัติการยืม-คืน</p>
              ) : (
                <div className="space-y-5">
                  {[...showHistoryModal.history].reverse().map((h, i) => (
                    <div key={i} className={`p-5 rounded-xl border-l-8 font-bold text-lg ${h.type === 'borrow' ? 'bg-indigo-50 border-indigo-500' : 'bg-emerald-50 border-emerald-500'}`}>
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-3 py-1.5 rounded-lg text-sm font-black ${h.type === 'borrow' ? 'bg-indigo-100 text-indigo-800' : 'bg-emerald-100 text-emerald-800'}`}>{h.type === 'borrow' ? 'ยืมออก' : 'รับคืน'}</span>
                        <span className="text-base text-slate-500">{new Date(h.date).toLocaleDateString('th-TH', {day:'numeric',month:'short',year:'numeric',hour:'2-digit',minute:'2-digit'})}</span>
                      </div>
                      {h.type === 'borrow' ? (
                        <>
                          <p className="text-slate-800 mt-3 text-lg">ผู้ยืม: <span className="text-indigo-700 font-black">{h.borrower}</span></p>
                          <p className="text-slate-500 text-base mt-2">ผู้ปล่อยยืม(จนท.): {h.lender || '-'}</p>
                        </>
                      ) : (
                        <p className="text-slate-800 mt-3 text-lg">ผู้รับคืน(จนท.): <span className="text-emerald-700 font-black">{h.returnReceiver || '-'}</span></p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {[
        { show: showCategoryModal, close: ()=>setShowCategoryModal(false), title: 'ตั้งค่าหมวดหมู่อุปกรณ์', icon: <Icons.Folder/>, val: newCategory, setVal: setNewCategory, add: addCategory, list: categories, collectionName: 'categories' },
        { show: showRoomModal, close: ()=>setShowRoomModal(false), title: 'ตั้งค่าห้องประชุม', icon: <Icons.List/>, val: newRoom, setVal: setNewRoom, add: addRoom, list: rooms, collectionName: 'rooms' },
        { show: showLocationModal, close: ()=>setShowLocationModal(false), title: 'ตั้งค่าสถานที่จัดเก็บ', icon: <Icons.MapPin/>, val: newLocation, setVal: setNewLocation, add: addLocation, list: locations, collectionName: 'locations' }
      ].map(modal => modal.show && (
        <div key={modal.title} className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
            <div className="px-8 py-6 border-b border-slate-200 bg-slate-50 flex justify-between items-center"><h3 className="text-xl font-black text-slate-800 flex items-center gap-3"><span className="text-blue-600">{modal.icon}</span>{modal.title}</h3><button onClick={modal.close} className="text-slate-400 hover:text-slate-700 bg-white rounded-full p-2 shadow-sm border border-slate-200"><Icons.Plus className="rotate-45" /></button></div>
            <div className="p-8">
              <form onSubmit={modal.add} className="flex gap-3 mb-8"><input required value={modal.val} onChange={e=>modal.setVal(e.target.value)} className="flex-1 px-5 py-4 border border-slate-300 bg-slate-50 text-lg font-bold rounded-xl focus:ring-2 focus:ring-blue-500 outline-none" placeholder="เพิ่มรายการใหม่..."/><button className="px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md text-lg transition-colors">เพิ่ม</button></form>
              <div className="max-h-72 overflow-y-auto space-y-3 custom-scrollbar pr-2">
                {modal.list.map(l => (
                  <div key={l} className="p-4 bg-white rounded-xl border border-slate-200 font-bold text-lg text-slate-800 shadow-sm flex justify-between items-center group">
                    {editSettingState.collection === modal.collectionName && editSettingState.oldName === l ? (
                      <div className="flex w-full gap-2 items-center">
                        <input autoFocus className="flex-1 px-4 py-3 border border-blue-400 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 text-base font-bold bg-blue-50" value={editSettingState.newName} onChange={(e) => setEditSettingState({...editSettingState, newName: e.target.value})} />
                        <button onClick={() => handleUpdateSetting(modal.collectionName, l, editSettingState.newName)} className="px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-base transition-colors shadow-sm">บันทึก</button>
                        <button onClick={() => setEditSettingState({collection: '', oldName: '', newName: ''})} className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg text-base transition-colors">ยกเลิก</button>
                      </div>
                    ) : (
                      <>
                        <span className="pl-2">{l}</span>
                        <div className="flex gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => setEditSettingState({collection: modal.collectionName, oldName: l, newName: l})} className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"><Icons.Edit /></button>
                          <button onClick={() => setDeleteSettingState({collection: modal.collectionName, name: l})} className="p-3 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"><Icons.Trash /></button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ))}

      {deleteSettingState.name && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4 z-[60]">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 text-center">
            <div className="w-24 h-24 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-6 text-rose-600 shadow-inner"><Icons.Trash/></div>
            <h3 className="font-black text-3xl mb-4 text-slate-800">ยืนยันการลบ?</h3>
            <p className="text-lg font-bold text-slate-600 mb-8 bg-slate-50 p-5 rounded-xl border border-slate-200">ลบ <span className="text-rose-600">"{deleteSettingState.name}"</span> ออกจากตัวเลือก</p>
            <div className="flex gap-4">
              <button onClick={()=>setDeleteSettingState({collection: '', name: ''})} className="flex-1 py-4 border border-slate-300 rounded-xl font-bold hover:bg-slate-50 text-lg transition-colors">ยกเลิก</button>
              <button onClick={handleDeleteSettingConfirm} className="flex-1 py-4 bg-rose-600 text-white rounded-xl font-black shadow-md hover:bg-rose-700 text-lg transition-colors">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
