import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from 'firebase/firestore';

// ⚠️ นำค่า Firebase Config ของคุณมาใส่ตรงนี้ (แทนที่คำว่า "ใส่_..._ของคุณที่นี่")
// ค่าเหล่านี้เอามาจากหน้า Firebase Console (ดูคู่มือข้อ 1.5)
const myFirebaseConfig = {
  apiKey: "AIzaSyA0IFm6icc-QG4ZC2WiuhRa2YquISGH9FM",
  authDomain: "mdec-stock-app.firebaseapp.com",
  projectId: "mdec-stock-app",
  storageBucket: "mdec-stock-app.firebasestorage.app",
  messagingSenderId: "283888438624",
  appId: "1:283888438624:web:6cfe60c58d94dc00fda205"
};

// โค้ดส่วนนี้เพื่อให้ระบบยังทดสอบในหน้านี้ได้ แต่ถ้าเอาไปใช้งานข้างนอกมันจะดึง myFirebaseConfig ไปใช้
const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : myFirebaseConfig;
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Package: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Alert: () => <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  History: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  UserPlus: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  CheckCircle: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Unlock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
};

const CATEGORIES = [
  { id: 'ภาพนิ่ง', label: 'ฝ่ายภาพนิ่ง', color: 'bg-blue-100 text-blue-700', textColor: 'text-blue-700' },
  { id: 'วิดีโอ', label: 'ฝ่ายวิดีโอ', color: 'bg-indigo-100 text-indigo-700', textColor: 'text-indigo-700' },
  { id: 'เครื่องเสียง', label: 'ฝ่ายอุปกรณ์เครื่องเสียง', color: 'bg-cyan-100 text-cyan-700', textColor: 'text-cyan-700' },
  { id: 'ห้องประชุม', label: 'ห้องประชุม', color: 'bg-sky-100 text-sky-700', textColor: 'text-sky-700' }
];

const STATUSES = [
  { id: 'available', label: 'พร้อมใช้งาน', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'in-use', label: 'กำลังใช้งาน', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'borrowed', label: 'ถูกยืม', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'maintenance', label: 'ส่งซ่อม', color: 'bg-rose-100 text-rose-700 border-rose-200' }
];

const INITIAL_MEETING_ROOMS = [
  'ห้องประชุม A (ชั้น 2)',
  'ห้องประชุม B (ชั้น 3)',
  'ห้องประชุม C (ชั้น 3)',
  'ห้อง Auditorium',
  'ห้องบรรยาย 1',
  'ห้องบรรยาย 2'
];

const StatusBadge = ({ statusId }) => {
  const status = STATUSES.find(s => s.id === statusId) || STATUSES[0];
  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${status.color}`}>
      {status.label}
    </span>
  );
};

const CategoryBadge = ({ categoryId }) => {
  const category = CATEGORIES.find(c => c.id === categoryId) || CATEGORIES[0];
  return (
    <span className={`px-2.5 py-1 rounded-md text-xs font-medium inline-block w-max ${category.color}`}>
      {category.label}
    </span>
  );
};

export default function InventoryApp() {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [meetingRooms, setMeetingRooms] = useState(INITIAL_MEETING_ROOMS);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  
  // Base Modals
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isRoomManagerOpen, setIsRoomManagerOpen] = useState(false);
  
  // Borrow/Return Modals
  const [isBorrowOpen, setIsBorrowOpen] = useState(false);
  const [isReturnOpen, setIsReturnOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  // Current Selections
  const [currentItem, setCurrentItem] = useState(null);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemToReturn, setItemToReturn] = useState(null);

  // Form States
  const [formData, setFormData] = useState({
    name: '', serialNumber: '', category: 'ภาพนิ่ง', location: '', status: 'available'
  });
  
  const [borrowData, setBorrowData] = useState({
    borrowerName: '', borrowDate: '', returnDate: ''
  });

  // Room Manager State
  const [roomInputValue, setRoomInputValue] = useState('');
  const [editingRoomOriginal, setEditingRoomOriginal] = useState(null);
  const [roomToDelete, setRoomToDelete] = useState(null);
  const [roomError, setRoomError] = useState('');

  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [loginError, setLoginError] = useState('');
  
  const ADMIN_PIN = 'mdec8203'; 

  useEffect(() => {
    const initAuth = async () => {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    };
    initAuth();
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    const itemsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'items');
    const unsubscribeItems = onSnapshot(itemsRef, (snapshot) => {
      const fetchedItems = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setItems(fetchedItems.sort((a, b) => b.lastUpdated.localeCompare(a.lastUpdated)));
      setIsLoading(false);
    }, (error) => {
      console.error("Error fetching items: ", error);
      setIsLoading(false);
    });

    const settingsRef = collection(db, 'artifacts', appId, 'users', user.uid, 'settings');
    const unsubscribeSettings = onSnapshot(settingsRef, (snapshot) => {
      let fetchedRooms = INITIAL_MEETING_ROOMS;
      snapshot.docs.forEach(doc => {
        if (doc.id === 'meetingRooms') {
           fetchedRooms = doc.data().rooms || INITIAL_MEETING_ROOMS;
        }
      });
      setMeetingRooms(fetchedRooms);
    }, (error) => console.error("Error fetching settings: ", error));

    return () => {
       unsubscribeItems();
       unsubscribeSettings();
    };
  }, [user]);

  const handleLogin = (e) => {
    e.preventDefault();
    if (pinInput === ADMIN_PIN) {
      setIsAuthenticated(true);
      setIsLoginModalOpen(false);
      setPinInput('');
      setLoginError('');
    } else {
      setLoginError('รหัสผ่านไม่ถูกต้อง');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
  };

  const exportToCSV = () => {
    const headers = ['รหัสอุปกรณ์ (S.N.)', 'ชื่ออุปกรณ์', 'หมวดหมู่', 'สถานที่', 'สถานะ', 'วันที่อัปเดต', 'ผู้ยืมปัจจุบัน', 'วันที่ยืม', 'กำหนดคืน'];
    const csvRows = [headers.join(',')];
    
    items.forEach(item => {
      const borrower = item.currentBorrow?.borrowerName || '';
      const borrowDate = item.currentBorrow?.borrowDate || '';
      const returnDate = item.currentBorrow?.returnDate || '';
      
      const statusLabel = STATUSES.find(s => s.id === item.status)?.label || item.status;
      const categoryLabel = CATEGORIES.find(c => c.id === item.category)?.label || item.category;

      const values = [
        item.serialNumber || '',
        `"${item.name}"`,
        categoryLabel,
        `"${item.location}"`,
        statusLabel,
        item.lastUpdated,
        `"${borrower}"`,
        borrowDate,
        returnDate
      ];
      csvRows.push(values.join(','));
    });

    const csvContent = '\uFEFF' + csvRows.join('\n'); // Add BOM for Excel/Sheets UTF-8 compatibility
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `MDEC_Stock_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredItems = useMemo(() => {
    return items.filter(item => {
      const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (item.serialNumber && item.serialNumber.toLowerCase().includes(searchQuery.toLowerCase())) ||
                            item.location.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [items, searchQuery, selectedCategory]);

  const stats = useMemo(() => {
    let borrowed = 0, maintenance = 0;
    const byCategory = {};
    CATEGORIES.forEach(c => byCategory[c.id] = 0);

    const equipmentStats = {
      camera: { total: 0, available: 0, label: 'กล้อง', unit: 'ตัว' },
      lens: { total: 0, available: 0, label: 'เลนส์', unit: 'ตัว' },
      mic: { total: 0, available: 0, label: 'ไมโครโฟน', unit: 'ตัว' },
      speaker: { total: 0, available: 0, label: 'ชุดลำโพง', unit: 'ชุด' },
    };

    items.forEach(item => {
      if (item.status === 'borrowed') borrowed++;
      if (item.status === 'maintenance') maintenance++;
      
      if (byCategory[item.category] !== undefined) {
        byCategory[item.category]++;
      }

      const nameMatch = item.name.toLowerCase();
      const isAvailable = item.status === 'available';
      
      if (nameMatch.includes('กล้อง') || nameMatch.includes('camera')) {
        equipmentStats.camera.total++;
        if (isAvailable) equipmentStats.camera.available++;
      } else if (nameMatch.includes('เลนส์') || nameMatch.includes('lens')) {
        equipmentStats.lens.total++;
        if (isAvailable) equipmentStats.lens.available++;
      } else if (nameMatch.includes('ไมค์') || nameMatch.includes('mic')) {
        equipmentStats.mic.total++;
        if (isAvailable) equipmentStats.mic.available++;
      } else if (nameMatch.includes('ลำโพง') || nameMatch.includes('speaker')) {
        equipmentStats.speaker.total++;
        if (isAvailable) equipmentStats.speaker.available++;
      }
    });

    const total = items.length;
    // Calculate available differently if needed, here we group 'available' and 'in-use' (in studio) as non-borrowed/non-broken
    const available = items.filter(i => i.status === 'available' || i.status === 'in-use').length; 
    return { total, available, borrowed, maintenance, byCategory, equipmentStats };
  }, [items]);

  const handleOpenForm = (item = null) => {
    if (item) {
      setCurrentItem(item);
      setFormData({ ...item });
    } else {
      setCurrentItem(null);
      setFormData({ name: '', serialNumber: '', category: 'ภาพนิ่ง', location: '', status: 'available' });
    }
    setIsFormOpen(true);
  };

  const handleSaveItem = async (e) => {
    e.preventDefault();
    const dateStr = new Date().toISOString().split('T')[0];
    const itemId = currentItem ? currentItem.id : Date.now().toString();
    const itemRef = doc(db, 'artifacts', appId, 'users', user.uid, 'items', itemId);
    
    if (currentItem) {
      await setDoc(itemRef, { ...currentItem, ...formData, lastUpdated: dateStr });
    } else {
      const newItem = { ...formData, id: itemId, lastUpdated: dateStr, history: [] };
      await setDoc(itemRef, newItem);
    }
    setIsFormOpen(false);
  };

  const confirmDelete = (item) => {
    setItemToDelete(item);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (itemToDelete) {
      await deleteDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'items', itemToDelete.id));
      setIsDeleteOpen(false);
      setItemToDelete(null);
    }
  };

  // Room Manager Handlers
  const handleSaveRoom = async (e) => {
    e.preventDefault();
    setRoomError('');
    const trimmedVal = roomInputValue.trim();
    if (!trimmedVal) return;

    let newRooms = [...meetingRooms];

    if (editingRoomOriginal) {
      if (meetingRooms.includes(trimmedVal) && trimmedVal !== editingRoomOriginal) {
        setRoomError('ชื่อห้องประชุมนี้มีอยู่แล้ว');
        return;
      }
      newRooms = meetingRooms.map(r => r === editingRoomOriginal ? trimmedVal : r);
      
      items.forEach(async (item) => {
        if (item.category === 'ห้องประชุม' && item.location === editingRoomOriginal) {
          await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'items', item.id), { ...item, location: trimmedVal });
        }
      });
    } else {
      if (meetingRooms.includes(trimmedVal)) {
        setRoomError('ชื่อห้องประชุมนี้มีอยู่แล้ว');
        return;
      }
      newRooms = [...meetingRooms, trimmedVal];
    }
    
    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'meetingRooms'), { rooms: newRooms });
    setRoomInputValue('');
    setEditingRoomOriginal(null);
  };

  const requestDeleteRoom = (room) => setRoomToDelete(room);

  const confirmDeleteRoom = async () => {
    if (roomToDelete) {
      const newRooms = meetingRooms.filter(r => r !== roomToDelete);
      await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'meetingRooms'), { rooms: newRooms });
      
      items.forEach(async (item) => {
        if (item.category === 'ห้องประชุม' && item.location === roomToDelete) {
           await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'items', item.id), { ...item, location: '' });
        }
      });
      setRoomToDelete(null);
    }
  };

  const handleOpenBorrow = (item) => {
    setCurrentItem(item);
    const today = new Date().toISOString().split('T')[0];
    setBorrowData({ borrowerName: '', borrowDate: today, returnDate: today });
    setIsBorrowOpen(true);
  };

  const handleSaveBorrow = async (e) => {
    e.preventDefault();
    const newBorrowId = Date.now().toString();
    const newBorrowRecord = {
      id: newBorrowId,
      borrowerName: borrowData.borrowerName,
      borrowDate: borrowData.borrowDate,
      returnDate: borrowData.returnDate,
      actualReturnDate: null
    };

    const updatedItem = {
      ...currentItem,
      status: 'borrowed',
      currentBorrow: newBorrowRecord,
      history: [newBorrowRecord, ...(currentItem.history || [])]
    };

    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'items', currentItem.id), updatedItem);
    setIsBorrowOpen(false);
  };

  const handleOpenReturn = (item) => {
    setItemToReturn(item);
    setIsReturnOpen(true);
  };

  const handleConfirmReturn = async () => {
    const today = new Date().toISOString().split('T')[0];
    const updatedHistory = (itemToReturn.history || []).map(h => 
      h.id === itemToReturn.currentBorrow?.id ? { ...h, actualReturnDate: today } : h
    );
    
    const updatedItem = {
      ...itemToReturn,
      status: 'available',
      currentBorrow: null,
      history: updatedHistory
    };

    await setDoc(doc(db, 'artifacts', appId, 'users', user.uid, 'items', itemToReturn.id), updatedItem);
    setIsReturnOpen(false);
    setItemToReturn(null);
  };

  const handleOpenHistory = (item) => {
    setCurrentItem(item);
    setIsHistoryOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800 pb-12">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-blue-600 p-2 rounded-lg text-white">
              <Icons.Package />
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-900 leading-tight">MDEC-Stock</h1>
              <p className="text-xs text-slate-500">ระบบจัดการสต๊อก ศูนย์มัลติมีเดีย</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {isAuthenticated ? (
              <>
                <button 
                  onClick={exportToCSV}
                  className="bg-emerald-600 hover:bg-emerald-700 transition-colors text-white px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm shadow-emerald-200"
                  title="ส่งออกข้อมูลเป็น CSV เพื่อนำไปเปิดใน Google Sheets"
                >
                  <Icons.Download /> <span className="hidden sm:inline">ส่งออก Sheet</span>
                </button>
                <button 
                  onClick={() => setIsRoomManagerOpen(true)}
                  className="bg-white hover:bg-slate-50 text-slate-700 transition-colors px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 border border-slate-200 shadow-sm"
                >
                  <Icons.Settings /> <span className="hidden sm:inline">ตั้งค่าห้องประชุม</span>
                </button>
                <button 
                  onClick={() => handleOpenForm()}
                  className="bg-blue-600 hover:bg-blue-700 transition-colors text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm shadow-blue-200"
                >
                  <Icons.Plus /> เพิ่มอุปกรณ์
                </button>
                <div className="w-px h-6 bg-slate-200 mx-1"></div>
                <button 
                  onClick={handleLogout}
                  className="text-slate-500 hover:text-rose-600 transition-colors px-3 py-2 rounded-lg text-sm font-medium flex items-center gap-2 bg-slate-100 hover:bg-rose-50"
                  title="ออกจากระบบ"
                >
                  <Icons.Unlock /> ออกจากระบบ
                </button>
              </>
            ) : (
              <button 
                onClick={() => setIsLoginModalOpen(true)}
                className="bg-slate-800 hover:bg-slate-900 transition-colors text-white px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 shadow-sm"
              >
                <Icons.Lock /> เข้าสู่ระบบเพื่อจัดการ
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-8 space-y-6">
        
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400">
             <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
             <p className="font-medium text-slate-500">กำลังเชื่อมต่อฐานข้อมูลคลาวด์...</p>
          </div>
        ) : (
          <>
            <div className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: 'อุปกรณ์ทั้งหมด', value: stats.total, color: 'text-blue-600' },
                  { label: 'พร้อมใช้งาน', value: stats.available, color: 'text-emerald-600' },
                  { label: 'กำลังถูกยืม', value: stats.borrowed, color: 'text-purple-600' },
                  { label: 'ส่งซ่อม/ชำรุด', value: stats.maintenance, color: 'text-rose-600' }
                ].map((stat, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <p className="text-sm font-medium text-slate-500 mb-2">{stat.label}</p>
                    <p className={`text-3xl font-bold ${stat.color}`}>{stat.value}</p>
                  </div>
                ))}
              </div>

              {/* สรุปยอดอุปกรณ์หลัก */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.values(stats.equipmentStats).map((eq, idx) => (
                  <div key={idx} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex flex-col justify-between">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="text-sm font-medium text-slate-700">{eq.label}</p>
                        <p className="text-2xl font-bold text-slate-800">{eq.total} <span className="text-xs font-normal text-slate-500">{eq.unit}</span></p>
                      </div>
                      <div className="text-right">
                        <p className="text-[11px] font-medium text-emerald-600 mb-0.5">พร้อมใช้งาน</p>
                        <p className="text-xl font-bold text-emerald-600">{eq.available} <span className="text-xs font-normal text-emerald-600/70">{eq.unit}</span></p>
                      </div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 mt-3 rounded-full overflow-hidden">
                      <div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: eq.total > 0 ? `${(eq.available/eq.total)*100}%` : '0%' }}></div>
                    </div>
                  </div>
                ))}
              </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <div key={cat.id} className="bg-white border border-slate-100 rounded-xl p-4 shadow-sm flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-500 mb-0.5">{cat.label}</p>
                  <p className={`text-xl font-bold ${cat.textColor}`}>{stats.byCategory[cat.id] || 0} <span className="text-xs font-normal text-slate-400">รายการ</span></p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <div className="relative w-full sm:w-96">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
              <Icons.Search />
            </div>
            <input
              type="text"
              placeholder="ค้นหาชื่ออุปกรณ์, รหัส, ห้องประชุม..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none text-sm transition-all"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-1 sm:pb-0 hide-scrollbar">
            <button 
              onClick={() => setSelectedCategory('all')}
              className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === 'all' ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
            >
              ทั้งหมด
            </button>
            {CATEGORIES.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === cat.id ? 'bg-blue-600 text-white shadow-md shadow-blue-200' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'}`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-sm font-medium text-slate-500">
                  <th className="p-4 pl-6 font-medium">ชื่ออุปกรณ์ / รหัส</th>
                  <th className="p-4 font-medium">หมวดหมู่</th>
                  <th className="p-4 font-medium">สถานที่ / ห้องประชุม</th>
                  <th className="p-4 font-medium">สถานะ</th>
                  <th className="p-4 pr-6 font-medium text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.length > 0 ? (
                  filteredItems.map(item => (
                    <tr key={item.id} className="hover:bg-blue-50/50 transition-colors group">
                      <td className="p-4 pl-6">
                        <p className="font-semibold text-slate-800">{item.name}</p>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {item.serialNumber && <span className="font-medium text-slate-500">S.N.: {item.serialNumber} • </span>}
                          อัปเดต: {item.lastUpdated}
                        </p>
                      </td>
                      <td className="p-4">
                        <CategoryBadge categoryId={item.category} />
                      </td>
                      <td className="p-4 text-sm text-slate-600">
                        {item.location || '-'}
                      </td>
                      <td className="p-4">
                        <StatusBadge statusId={item.status} />
                        {item.status === 'borrowed' && item.currentBorrow && (
                          <div className="mt-2 text-[11px] leading-relaxed text-slate-600 bg-purple-50/80 px-2.5 py-1.5 rounded-lg border border-purple-100 w-max max-w-[200px]">
                            <p><span className="font-medium text-purple-700">ผู้ยืม:</span> {item.currentBorrow.borrowerName}</p>
                            <p><span className="font-medium text-purple-700">ถึง:</span> {item.currentBorrow.returnDate}</p>
                          </div>
                        )}
                      </td>
                      <td className="p-4 pr-6 text-right">
                        <div className="flex justify-end gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                          <button onClick={() => handleOpenHistory(item)} className="p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg" title="ประวัติการยืม">
                            <Icons.History />
                          </button>
                          
                          {isAuthenticated && (
                            <>
                              <div className="w-px h-5 bg-slate-200 my-auto mx-1"></div>
                              {item.status !== 'borrowed' && item.status !== 'maintenance' && (
                                <button onClick={() => handleOpenBorrow(item)} className="p-1.5 text-purple-600 hover:bg-purple-100 rounded-lg flex items-center gap-1" title="ทำรายการให้ยืม">
                                  <Icons.UserPlus />
                                </button>
                              )}
                              {item.status === 'borrowed' && (
                                <button onClick={() => handleOpenReturn(item)} className="p-1.5 text-emerald-600 hover:bg-emerald-100 rounded-lg flex items-center gap-1" title="รับคืนอุปกรณ์">
                                  <Icons.CheckCircle />
                                </button>
                              )}
                              <button onClick={() => handleOpenForm(item)} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg" title="แก้ไขข้อมูล">
                                <Icons.Edit />
                              </button>
                              <button onClick={() => confirmDelete(item)} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg" title="ลบข้อมูล">
                                <Icons.Trash />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-slate-500">
                      ไม่พบข้อมูลที่ค้นหา
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        </>
        )}
      </main>

      {isFormOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h2 className="text-lg font-bold text-slate-800">
                {currentItem ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่'}
              </h2>
              <button onClick={() => setIsFormOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                <Icons.X />
              </button>
            </div>
            
            <form onSubmit={handleSaveItem} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่ออุปกรณ์</label>
                <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                  value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} placeholder="เช่น กล้อง Sony A7IV" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">หมวดหมู่</label>
                  <select className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, location: e.target.value === 'ห้องประชุม' ? meetingRooms[0] || '' : ''})}>
                    {CATEGORIES.map(cat => <option key={cat.id} value={cat.id}>{cat.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">รหัสอุปกรณ์ (S.N.)</label>
                  <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={formData.serialNumber || ''} onChange={e => setFormData({...formData, serialNumber: e.target.value})} placeholder="เช่น CAM-001" />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-end mb-1">
                  <label className="block text-sm font-medium text-slate-700">
                    {formData.category === 'ห้องประชุม' ? 'เลือกห้องประชุม' : 'สถานที่จัดเก็บ'}
                  </label>
                </div>
                
                {formData.category === 'ห้องประชุม' ? (
                  <select 
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white"
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})}
                    required
                  >
                    <option value="" disabled>-- เลือกห้องประชุม --</option>
                    {meetingRooms.map(room => (
                      <option key={room} value={room}>{room}</option>
                    ))}
                  </select>
                ) : (
                  <input 
                    type="text" 
                    className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                    value={formData.location} 
                    onChange={e => setFormData({...formData, location: e.target.value})} 
                    placeholder="เช่น ตู้ A1, ห้องเก็บของ 2" 
                  />
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">สถานะ</label>
                <select 
                  className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm bg-white disabled:bg-slate-50 disabled:text-slate-400"
                  value={formData.status} 
                  onChange={e => setFormData({...formData, status: e.target.value})}
                  disabled={currentItem?.status === 'borrowed'}
                >
                  {STATUSES.map(stat => <option key={stat.id} value={stat.id}>{stat.label}</option>)}
                </select>
                {currentItem?.status === 'borrowed' && (
                  <p className="text-xs text-slate-500 mt-1">* กรุณากดปุ่ม "รับคืน" ที่หน้าตารางเพื่อเปลี่ยนสถานะนี้</p>
                )}
              </div>

              <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsFormOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors">
                  ยกเลิก
                </button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors shadow-md shadow-blue-200">
                  บันทึกข้อมูล
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Room Manager Modal */}
      {isRoomManagerOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-fade-in-up flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">ตั้งค่าห้องประชุม</h2>
                <p className="text-xs text-slate-500">เพิ่ม ลบ หรือแก้ไขรายชื่อห้องประชุมในระบบ</p>
              </div>
              <button onClick={() => setIsRoomManagerOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                <Icons.X />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              <ul className="space-y-2 mb-6">
                {meetingRooms.length > 0 ? (
                  meetingRooms.map(room => (
                    <li key={room} className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:border-blue-200 transition-colors">
                      <span className="text-sm font-medium text-slate-700">{room}</span>
                      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => {setRoomInputValue(room); setEditingRoomOriginal(room);}} className="p-1.5 text-blue-600 hover:bg-blue-100 rounded-lg">
                          <Icons.Edit />
                        </button>
                        <button onClick={() => requestDeleteRoom(room)} className="p-1.5 text-rose-500 hover:bg-rose-100 rounded-lg">
                          <Icons.Trash />
                        </button>
                      </div>
                    </li>
                  ))
                ) : (
                  <li className="text-center p-4 text-sm text-slate-500 border border-dashed border-slate-200 rounded-xl">ไม่มีรายชื่อห้องประชุม</li>
                )}
              </ul>

              <div className="border-t border-slate-100 pt-4">
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  {editingRoomOriginal ? 'แก้ไขชื่อห้องประชุม' : 'เพิ่มห้องประชุมใหม่'}
                </label>
                <form onSubmit={handleSaveRoom} className="flex flex-col gap-2">
                  <div className="flex gap-2">
                    <input 
                      type="text" 
                      placeholder="พิมพ์ชื่อห้อง..."
                      className={`flex-1 px-4 py-2 text-sm border ${roomError ? 'border-rose-500 focus:ring-rose-500' : 'border-slate-200 focus:ring-blue-500'} rounded-xl focus:ring-2 outline-none`}
                      value={roomInputValue}
                      onChange={e => { setRoomInputValue(e.target.value); setRoomError(''); }}
                    />
                    {editingRoomOriginal ? (
                      <>
                        <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700">บันทึก</button>
                        <button type="button" onClick={() => {setEditingRoomOriginal(null); setRoomInputValue(''); setRoomError('');}} className="px-3 py-2 bg-slate-100 text-slate-600 text-sm font-medium rounded-xl hover:bg-slate-200">ยกเลิก</button>
                      </>
                    ) : (
                      <button type="submit" className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-xl hover:bg-blue-700 whitespace-nowrap">เพิ่ม</button>
                    )}
                  </div>
                  {roomError && <p className="text-xs text-rose-500 mt-1">{roomError}</p>}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Basic Modals for Delete */}
      {isDeleteOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500"><Icons.Alert /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">ยืนยันการลบอุปกรณ์?</h3>
            <p className="text-sm text-slate-500 mb-6">ลบ "{itemToDelete?.name}" หรือไม่? <br/>การกระทำนี้ไม่สามารถย้อนกลับได้</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setIsDeleteOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">ยกเลิก</button>
              <button onClick={handleDelete} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-500 hover:bg-rose-600">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}

      {roomToDelete && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[90] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up p-6 text-center">
            <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-500"><Icons.Alert /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">ยืนยันการลบห้องประชุม?</h3>
            <p className="text-sm text-slate-500 mb-6">คุณต้องการลบ "{roomToDelete}" ใช่หรือไม่?</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setRoomToDelete(null)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">ยกเลิก</button>
              <button onClick={confirmDeleteRoom} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-rose-500 hover:bg-rose-600">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}

      {isBorrowOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div>
                <h2 className="text-lg font-bold text-slate-800">ทำรายการให้ยืม</h2>
                <p className="text-xs text-slate-500">{currentItem?.name} (S.N. {currentItem?.serialNumber})</p>
              </div>
              <button onClick={() => setIsBorrowOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                <Icons.X />
              </button>
            </div>
            
            <form onSubmit={handleSaveBorrow} className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">ชื่อผู้ยืม</label>
                <input required type="text" className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                  value={borrowData.borrowerName} onChange={e => setBorrowData({...borrowData, borrowerName: e.target.value})} placeholder="เช่น นายสมคิด เรียนดี" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">วันที่ยืม</label>
                  <input required type="date" className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={borrowData.borrowDate} onChange={e => setBorrowData({...borrowData, borrowDate: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">กำหนดคืน</label>
                  <input required type="date" className="w-full p-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none text-sm"
                    value={borrowData.returnDate} onChange={e => setBorrowData({...borrowData, returnDate: e.target.value})} />
                </div>
              </div>
              <div className="pt-4 mt-2 border-t border-slate-100 flex gap-3">
                <button type="button" onClick={() => setIsBorrowOpen(false)} className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">ยกเลิก</button>
                <button type="submit" className="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 shadow-md shadow-purple-200">บันทึกการยืม</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isReturnOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[80] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up p-6 text-center">
            <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-500"><Icons.CheckCircle /></div>
            <h3 className="text-lg font-bold text-slate-800 mb-2">ยืนยันการรับคืนอุปกรณ์</h3>
            <p className="text-sm text-slate-500 mb-2">รับคืน "{itemToReturn?.name}"</p>
            <p className="text-xs text-slate-400 mb-6 bg-slate-50 p-2 rounded-lg">จากผู้ยืม: {itemToReturn?.currentBorrow?.borrowerName}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => setIsReturnOpen(false)} className="px-4 py-2 rounded-xl text-sm font-medium text-slate-600 bg-slate-100 hover:bg-slate-200">ยกเลิก</button>
              <button onClick={handleConfirmReturn} className="px-4 py-2 rounded-xl text-sm font-medium text-white bg-emerald-500 hover:bg-emerald-600 shadow-md shadow-emerald-200">ยืนยันรับคืน</button>
            </div>
          </div>
        </div>
      )}

      {isHistoryOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden animate-fade-in-up flex flex-col max-h-[80vh]">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50 shrink-0">
              <div>
                <h2 className="text-lg font-bold text-slate-800">ประวัติการยืม-คืน</h2>
                <p className="text-xs text-slate-500">{currentItem?.name} (S.N. {currentItem?.serialNumber})</p>
              </div>
              <button onClick={() => setIsHistoryOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                <Icons.X />
              </button>
            </div>
            
            <div className="p-5 overflow-y-auto flex-1">
              {currentItem?.history && currentItem.history.length > 0 ? (
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
                      <tr>
                        <th className="px-4 py-3 font-medium">ผู้ยืม</th>
                        <th className="px-4 py-3 font-medium">วันที่ยืม</th>
                        <th className="px-4 py-3 font-medium">กำหนดคืน</th>
                        <th className="px-4 py-3 font-medium">สถานะ/วันคืนจริง</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {currentItem.history.map((record, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="px-4 py-3 font-medium text-slate-700">{record.borrowerName}</td>
                          <td className="px-4 py-3 text-slate-600">{record.borrowDate}</td>
                          <td className="px-4 py-3 text-slate-600">{record.returnDate}</td>
                          <td className="px-4 py-3">
                            {record.actualReturnDate ? (
                              <span className="text-emerald-600 text-xs font-medium bg-emerald-50 px-2 py-1 rounded-md">
                                คืนแล้ว ({record.actualReturnDate})
                              </span>
                            ) : (
                              <span className="text-purple-600 text-xs font-medium bg-purple-50 px-2 py-1 rounded-md">
                                กำลังยืมอยู่
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center p-8 border border-dashed border-slate-200 rounded-xl">
                  <div className="w-12 h-12 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Icons.History />
                  </div>
                  <p className="text-slate-500 text-sm">ยังไม่มีประวัติการยืมอุปกรณ์ชิ้นนี้</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden animate-fade-in-up">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <div className="flex items-center gap-2 text-slate-800">
                <div className="bg-slate-800 text-white p-1.5 rounded-lg"><Icons.Lock /></div>
                <h2 className="text-lg font-bold">เข้าสู่ระบบ</h2>
              </div>
              <button onClick={() => {setIsLoginModalOpen(false); setLoginError(''); setPinInput('');}} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-lg border border-slate-200">
                <Icons.X />
              </button>
            </div>
            
            <form onSubmit={handleLogin} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2 text-center">กรุณาใส่รหัสผ่านเพื่อจัดการข้อมูล</label>
                <input 
                  autoFocus
                  required 
                  type="password" 
                  className={`w-full p-3 border ${loginError ? 'border-rose-300 focus:ring-rose-500' : 'border-slate-200 focus:ring-slate-800'} rounded-xl focus:ring-2 outline-none text-center tracking-widest text-lg font-bold`}
                  value={pinInput} 
                  onChange={e => {setPinInput(e.target.value); setLoginError('');}} 
                  placeholder="••••••••" 
                  maxLength={8}
                />
                {loginError && <p className="text-rose-500 text-sm mt-2 text-center font-medium">{loginError}</p>}
              </div>
              
              <div className="pt-2">
                <button type="submit" className="w-full px-4 py-3 rounded-xl text-sm font-bold text-white bg-slate-800 hover:bg-slate-900 transition-colors shadow-md">
                  ยืนยันการเข้าสู่ระบบ
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fade-in-up {
          animation: fadeInUp 0.2s ease-out forwards;
        }
      `}} />
    </div>
  );
}