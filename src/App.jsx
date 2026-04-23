import React, { useState, useMemo, useEffect } from 'react';
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously, onAuthStateChanged } from "firebase/auth";
import { getFirestore, doc, setDoc, deleteDoc, onSnapshot, collection } from "firebase/firestore";

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
const ADMIN_PIN = 'mdec8203';

const Icons = {
  Plus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>,
  Search: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  Edit: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>,
  Trash: () => <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>,
  Package: () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /></svg>,
  Alert: () => <svg className="w-12 h-12 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>,
  Settings: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>,
  X: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>,
  History: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  UserPlus: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" /></svg>,
  CheckCircle: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
  Unlock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" /></svg>,
  Lock: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>,
  Download: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>,
  Folder: () => <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" /></svg>
};

const STATUSES = [
  { id: 'available', label: 'พร้อมใช้งาน', color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { id: 'in-use', label: 'กำลังใช้งาน', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { id: 'borrowed', label: 'ถูกยืม', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { id: 'maintenance', label: 'ส่งซ่อม/ชำรุด', color: 'bg-rose-100 text-rose-700 border-rose-200' }
];

const DEPARTMENTS = [
  { id: 'ภาพนิ่ง', label: 'ฝ่ายภาพนิ่ง', color: 'bg-blue-100 text-blue-700' },
  { id: 'วิดีโอ', label: 'ฝ่ายวิดีโอ', color: 'bg-indigo-100 text-indigo-700' },
  { id: 'เครื่องเสียง', label: 'ฝ่ายอุปกรณ์เครื่องเสียง', color: 'bg-cyan-100 text-cyan-700' },
  { id: 'ห้องประชุม', label: 'ห้องประชุม', color: 'bg-sky-100 text-sky-700' },
  { id: 'ob-live', label: 'OB-LIVE', color: 'bg-violet-100 text-violet-700' }
];

export default function App() {
  const [items, setItems] = useState([]);
  const [settingsOptions, setSettingsOptions] = useState({
    categories: ['กล้อง', 'เลนส์', 'ไมโครโฟน', 'ชุดลำโพง', 'ถ่าน/แบต', 'สายไฟ', 'อื่นๆ'],
    locations: ['ตู้ A1', 'ห้องเก็บของ 2', 'ห้องประชุม 1', 'อื่นๆ'],
    staff: ['แอดมิน', 'อื่นๆ']
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterDept, setFilterDept] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const [isAdmin, setIsAdmin] = useState(() => {
    return localStorage.getItem('mdec_admin') === 'true';
  });
  const [showLogin, setShowLogin] = useState(false);
  const [pin, setPin] = useState('');
  const [firebaseError, setFirebaseError] = useState(false);

  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({ id: '', name: '', sn: '', department: 'ภาพนิ่ง', category: '', newCategory: '', location: '', newLocation: '', status: 'available', quantity: 1 });
  
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [deleteSettingConfirm, setDeleteSettingConfirm] = useState(null);
  
  const [showBorrow, setShowBorrow] = useState(null);
  const [borrowData, setBorrowData] = useState({ borrower: '', borrowDate: '', returnDate: '', staff: '', newStaff: '' });
  
  const [showReturn, setShowReturn] = useState(null);
  const [returnData, setReturnData] = useState({ staff: '', newStaff: '' });
  
  const [showHistory, setShowHistory] = useState(null);

  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState('categories');
  const [newSettingItem, setNewSettingItem] = useState('');
  const [editingSettingItem, setEditingSettingItem] = useState(null);

  useEffect(() => {
    signInAnonymously(auth).catch(() => setFirebaseError(true));
    
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const unsubscribeItems = onSnapshot(collection(db, "mdec_stock", "shared_data", "items"), (snapshot) => {
          const loadedItems = [];
          snapshot.forEach((doc) => loadedItems.push({ id: doc.id, ...doc.data() }));
          setItems(loadedItems);
          setFirebaseError(false);
        }, (error) => {
          console.error(error);
          setFirebaseError(true);
        });

        const unsubscribeSettings = onSnapshot(doc(db, "mdec_stock", "shared_data", "settings", "global"), (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            if (!data.staff) data.staff = ['แอดมิน', 'อื่นๆ'];
            setSettingsOptions(data);
          } else {
            setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), settingsOptions);
          }
        });

        return () => {
          unsubscribeItems();
          unsubscribeSettings();
        };
      }
    });
    return () => unsubscribeAuth();
  }, []);

  const filteredItems = useMemo(() => {
    let result = items.filter(item => {
      const matchSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (item.sn && item.sn.toLowerCase().includes(searchTerm.toLowerCase())) || 
                          (item.location && item.location.toLowerCase().includes(searchTerm.toLowerCase()));
      const matchDept = filterDept === 'all' || item.department === filterDept;
      const matchCategory = filterCategory === 'all' || item.category === filterCategory;
      const matchStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchSearch && matchDept && matchCategory && matchStatus;
    });

    result.sort((a, b) => {
      let aValue = a[sortConfig.key];
      let bValue = b[sortConfig.key];

      if (aValue === undefined || aValue === null) aValue = '';
      if (bValue === undefined || bValue === null) bValue = '';

      if (sortConfig.key === 'status') {
        const statusOrder = { 'available': 1, 'in-use': 2, 'borrowed': 3, 'maintenance': 4 };
        aValue = statusOrder[a.status] || 99;
        bValue = statusOrder[b.status] || 99;
      } else if (sortConfig.key === 'quantity') {
        aValue = Number(aValue) || 0;
        bValue = Number(bValue) || 0;
      } else {
        aValue = aValue.toString();
        bValue = bValue.toString();
      }

      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
      }

      return sortConfig.direction === 'asc' 
        ? aValue.toString().localeCompare(bValue.toString(), 'th') 
        : bValue.toString().localeCompare(aValue.toString(), 'th');
    });

    return result;
  }, [items, searchTerm, filterDept, filterCategory, filterStatus, sortConfig]);

  const stats = useMemo(() => {
    const s = { all: 0, available: 0, inUse: 0, borrowed: 0, maintenance: 0 };
    items.forEach(item => {
      const qty = Number(item.quantity) || 1;
      s.all += qty;
      if (item.status === 'available') s.available += qty;
      if (item.status === 'in-use') s.inUse += qty;
      if (item.status === 'borrowed') s.borrowed += qty;
      if (item.status === 'maintenance') s.maintenance += qty;
    });
    return s;
  }, [items]);

  const deptItems = useMemo(() => {
    return items.filter(item => filterDept === 'all' || item.department === filterDept);
  }, [items, filterDept]);

  const categoryStats = useMemo(() => {
    const catData = {};
    settingsOptions.categories.filter(c => c !== 'อื่นๆ').forEach(cat => {
      catData[cat] = { total: 0, available: 0 };
    });

    deptItems.forEach(item => {
      const qty = Number(item.quantity) || 1;
      const cat = item.category || 'อื่นๆ';
      if (!catData[cat]) catData[cat] = { total: 0, available: 0 };
      catData[cat].total += qty;
      if (item.status === 'available') {
        catData[cat].available += qty;
      }
    });

    return Object.entries(catData)
      .filter(([_, data]) => data.total > 0)
      .map(([label, data]) => ({ label, data }));
  }, [deptItems, settingsOptions.categories]);

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleSave = async () => {
    if (!formData.name.trim()) return;
    let finalCategory = formData.category;
    if (formData.category === 'อื่นๆ' && formData.newCategory.trim()) {
      finalCategory = formData.newCategory.trim();
      const updatedCategories = [...new Set([...settingsOptions.categories.filter(c => c !== 'อื่นๆ'), finalCategory, 'อื่นๆ'])];
      setSettingsOptions(prev => ({ ...prev, categories: updatedCategories }));
      await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), { ...settingsOptions, categories: updatedCategories });
    }

    let finalLocation = formData.location;
    if (formData.location === 'อื่นๆ' && formData.newLocation.trim()) {
      finalLocation = formData.newLocation.trim();
      const updatedLocations = [...new Set([...settingsOptions.locations.filter(c => c !== 'อื่นๆ'), finalLocation, 'อื่นๆ'])];
      setSettingsOptions(prev => ({ ...prev, locations: updatedLocations }));
      await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), { ...settingsOptions, locations: updatedLocations });
    }

    const itemData = { 
      ...formData, 
      category: finalCategory, 
      location: finalLocation,
      quantity: Number(formData.quantity) || 1,
      updatedAt: new Date().toISOString() 
    };
    delete itemData.newCategory;
    delete itemData.newLocation;
    
    if (formData.id) {
      await setDoc(doc(db, "mdec_stock", "shared_data", "items", formData.id), itemData, { merge: true });
    } else {
      const newId = `item_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await setDoc(doc(db, "mdec_stock", "shared_data", "items", newId), { ...itemData, history: [] });
    }
    setShowForm(false);
  };

  const handleDelete = async () => {
    if (showDeleteConfirm) {
      try {
        await deleteDoc(doc(db, "mdec_stock", "shared_data", "items", showDeleteConfirm));
      } catch (error) {
        console.error("Error deleting item:", error);
      } finally {
        setShowDeleteConfirm(null);
      }
    }
  };

  const handleBorrow = async () => {
    if (!borrowData.borrower || !borrowData.staff) return;
    let finalStaff = borrowData.staff;
    if (borrowData.staff === 'อื่นๆ' && borrowData.newStaff.trim()) {
      finalStaff = borrowData.newStaff.trim();
      const updatedStaff = [...new Set([...(settingsOptions.staff || []).filter(c => c !== 'อื่นๆ'), finalStaff, 'อื่นๆ'])];
      const newSettings = { ...settingsOptions, staff: updatedStaff };
      setSettingsOptions(newSettings);
      await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), newSettings);
    }
    const item = items.find(i => i.id === showBorrow);
    const newHistory = [...(item.history || []), { type: 'borrow', date: new Date().toISOString(), borrower: borrowData.borrower, expectedReturn: borrowData.returnDate, staffOut: finalStaff }];
    await setDoc(doc(db, "mdec_stock", "shared_data", "items", showBorrow), { status: 'borrowed', currentBorrower: borrowData.borrower, expectedReturn: borrowData.returnDate, history: newHistory }, { merge: true });
    setShowBorrow(null);
    setBorrowData({ borrower: '', borrowDate: '', returnDate: '', staff: '', newStaff: '' });
  };

  const handleReturn = async () => {
    if (!returnData.staff) return;
    let finalStaff = returnData.staff;
    if (returnData.staff === 'อื่นๆ' && returnData.newStaff.trim()) {
      finalStaff = returnData.newStaff.trim();
      const updatedStaff = [...new Set([...(settingsOptions.staff || []).filter(c => c !== 'อื่นๆ'), finalStaff, 'อื่นๆ'])];
      const newSettings = { ...settingsOptions, staff: updatedStaff };
      setSettingsOptions(newSettings);
      await setDoc(doc(db, "mdec_stock", "shared_data", "settings", "global"), newSettings);
    }
    const item = items.find(i => i.id === showReturn);
    const newHistory = [...(item.history || []), { type: 'return', date: new Date().toISOString(), staffIn: finalStaff }];
    await setDoc(doc(db, "mdec_stock", "shared_data", "items", showReturn), { status: 'available', currentBorrower: null, expectedReturn: null, history: newHistory }, { merge: true });
    setShowReturn(null);
    setReturnData({ staff: '', newStaff: '' });
  };

  const handleSaveSetting = async () => {
    if (!newSettingItem.trim()) return;
    const key = settingsTab;
    let newOptions = [...(settingsOptions[key] || [])];
    let oldName = editingSettingItem;
    let newName = newSettingItem.trim();

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
  };

  const handleDeleteSetting = async () => {
    if (deleteSettingConfirm !== null) {
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
    }
  };

  const exportToCSV = () => {
    const headers = ['ชื่ออุปกรณ์', 'รหัส S.N.', 'ฝ่าย', 'หมวดหมู่', 'สถานที่', 'สถานะ', 'จำนวน', 'ผู้ยืมปัจจุบัน', 'อัปเดตล่าสุด'];
    const csvData = items.map(i => [
      i.name, i.sn || '-', i.department, i.category || '-', i.location || '-', 
      STATUSES.find(s=>s.id===i.status)?.label || i.status, i.quantity || 1, i.currentBorrower || '-', new Date(i.updatedAt).toLocaleDateString('th-TH')
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
      localStorage.setItem('mdec_admin', 'true'); 
      setShowLogin(false); 
      setPin(''); 
    } else { 
      alert('รหัสผ่านไม่ถูกต้อง'); 
      setPin(''); 
    }
  };

  const handleLogout = () => {
    setIsAdmin(false);
    localStorage.removeItem('mdec_admin'); 
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig.key !== columnKey) return <span className="text-slate-300 ml-1 opacity-0 group-hover:opacity-100">↕</span>;
    return <span className="text-blue-600 ml-1">{sortConfig.direction === 'asc' ? '↑' : '↓'}</span>;
  };

  const Th = ({ label, columnKey, className }) => (
    <th 
      className={`px-4 py-4 text-left font-bold text-slate-700 cursor-pointer hover:bg-slate-300 transition-colors group select-none ${className || ''}`} 
      onClick={() => handleSort(columnKey)}
    >
      <div className="flex items-center">
        {label} <SortIcon columnKey={columnKey} />
      </div>
    </th>
  );

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800 font-sans p-4 sm:p-8">
      {firebaseError && (
        <div className="w-full mb-6 bg-red-100 border-l-4 border-red-500 text-red-700 p-4 rounded-r-xl shadow-md flex items-start gap-4">
          <Icons.Alert />
          <div>
            <h3 className="font-bold text-lg">ฐานข้อมูลถูกระงับ (Firebase Permission Error)</h3>
            <p>โปรดเข้าไปที่เว็บ Firebase Console &gt; Firestore Database &gt; Rules และเปลี่ยนเป็น <code>allow read, write: if true;</code> เพื่อให้ระบบทำงานได้</p>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="w-full flex flex-col md:flex-row justify-between items-center mb-8 gap-4 bg-white p-6 rounded-2xl shadow-md border border-slate-200">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg"><Icons.Package /></div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              MDEC-Stock 
              <span className="text-xs sm:text-sm font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded-lg ml-2 align-middle border border-blue-200 shadow-sm">v3.1</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm sm:text-base">ระบบจัดการสต๊อก ศูนย์มัลติมีเดีย</p>
          </div>
        </div>
        <div className="flex flex-wrap justify-center gap-3 w-full md:w-auto">
          {isAdmin && <button onClick={exportToCSV} className="flex-1 md:flex-none items-center justify-center gap-2 px-5 py-3 bg-emerald-50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl transition-colors flex"><Icons.Download /><span className="hidden sm:inline">ส่งออก Sheet</span></button>}
          
          {isAdmin && (
            <button 
              onClick={() => { setSettingsTab('categories'); setShowSettings(true); }} 
              className="flex-1 md:flex-none flex items-center justify-center gap-2 px-5 py-3 bg-slate-100 text-slate-700 hover:bg-slate-200 font-bold rounded-xl transition-colors shadow-sm"
            >
              <Icons.Settings /><span>ตั้งค่า</span>
            </button>
          )}

          {isAdmin ? (
            <button onClick={handleLogout} className="flex-1 md:flex-none items-center justify-center gap-2 px-5 py-3 bg-rose-50 text-rose-600 hover:bg-rose-100 font-bold rounded-xl transition-colors flex"><Icons.Unlock /><span className="hidden sm:inline">ออกจากระบบ</span></button>
          ) : (
            <button onClick={() => setShowLogin(true)} className="flex-1 md:flex-none items-center justify-center gap-2 px-5 py-3 bg-slate-800 text-white hover:bg-slate-700 font-bold rounded-xl transition-colors shadow-md flex"><Icons.Lock /><span className="hidden sm:inline">เข้าสู่ระบบจัดการ</span></button>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="w-full grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6 mb-8">
        <div className="bg-white p-5 rounded-2xl shadow-md border-t-4 border-blue-500 flex flex-col items-center justify-center text-center">
          <span className="text-slate-500 font-bold text-sm sm:text-base mb-1">อุปกรณ์ทั้งหมด</span>
          <span className="text-4xl sm:text-5xl font-black text-blue-600">{stats.all}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md border-t-4 border-emerald-400 flex flex-col items-center justify-center text-center">
          <span className="text-slate-500 font-bold text-sm sm:text-base mb-1">พร้อมใช้งาน</span>
          <span className="text-4xl sm:text-5xl font-black text-emerald-500">{stats.available}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md border-t-4 border-amber-400 flex flex-col items-center justify-center text-center">
          <span className="text-slate-500 font-bold text-sm sm:text-base mb-1">กำลังใช้งาน</span>
          <span className="text-4xl sm:text-5xl font-black text-amber-500">{stats.inUse}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md border-t-4 border-purple-400 flex flex-col items-center justify-center text-center">
          <span className="text-slate-500 font-bold text-sm sm:text-base mb-1">กำลังถูกยืม</span>
          <span className="text-4xl sm:text-5xl font-black text-purple-600">{stats.borrowed}</span>
        </div>
        <div className="bg-white p-5 rounded-2xl shadow-md border-t-4 border-rose-400 flex flex-col items-center justify-center text-center">
          <span className="text-slate-500 font-bold text-sm sm:text-base mb-1">ส่งซ่อม/ชำรุด</span>
          <span className="text-4xl sm:text-5xl font-black text-rose-500">{stats.maintenance}</span>
        </div>
      </div>

      {/* Sub Stats - Dynamic Categories */}
      <div className="w-full grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 mb-8">
        {categoryStats.map(c => (
          <div key={c.label} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200 flex flex-col">
            <div className="flex justify-between items-center mb-2">
              <span className="font-bold text-slate-600 text-base sm:text-lg truncate pr-2" title={c.label}>{c.label}</span>
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded-md shrink-0">พร้อมใช้</span>
            </div>
            <div className="flex justify-between items-baseline mb-2">
              <div><span className="text-3xl font-black text-slate-800">{c.data.total}</span><span className="text-sm font-bold text-slate-400 ml-1">ชิ้น</span></div>
              <span className="text-2xl font-bold text-emerald-500">{c.data.available}</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden"><div className="bg-emerald-500 h-full transition-all duration-500" style={{ width: `${c.data.total === 0 ? 0 : (c.data.available / c.data.total) * 100}%` }}></div></div>
          </div>
        ))}
      </div>

      {/* Filters & Search */}
      <div className="w-full flex flex-col gap-4 bg-white p-5 sm:p-6 rounded-2xl shadow-md border border-slate-200 mb-6">
        <div className="flex flex-col xl:flex-row gap-4 items-center w-full">
          <div className="relative flex-1 w-full">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-400"><Icons.Search /></div>
            <input type="text" className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold focus:ring-2 focus:ring-blue-500 outline-none transition-all" placeholder="ค้นหาชื่ออุปกรณ์, รหัส, สถานที่..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
            <select className="flex-1 px-4 py-4 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500" value={filterCategory} onChange={e => setFilterCategory(e.target.value)}>
              <option value="all">หมวดหมู่ทั้งหมด</option>
              {settingsOptions.categories.filter(c => c !== 'อื่นๆ').map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            <select className="flex-1 px-4 py-4 bg-slate-50 border border-slate-300 rounded-xl text-lg font-bold text-slate-600 outline-none focus:ring-2 focus:ring-blue-500" value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
              <option value="all">สถานะทั้งหมด</option>
              {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
          </div>

          {isAdmin && (
            <button onClick={() => { setFormData({ id: '', name: '', sn: '', department: filterDept === 'all' ? 'ภาพนิ่ง' : filterDept, category: '', newCategory: '', location: '', newLocation: '', status: 'available', quantity: 1 }); setShowForm(true); }} className="w-full xl:w-auto flex items-center justify-center gap-2 px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white font-black rounded-xl shadow-md transition-colors text-lg whitespace-nowrap"><Icons.Plus /> เพิ่มอุปกรณ์</button>
          )}
        </div>

        <div className="flex gap-2 overflow-x-auto w-full pb-2 custom-scrollbar">
          <button onClick={() => setFilterDept('all')} className={`whitespace-nowrap px-6 py-4 rounded-xl font-bold text-lg transition-all ${filterDept === 'all' ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300'}`}>ทั้งหมด</button>
          {DEPARTMENTS.map(d => (
            <button key={d.id} onClick={() => setFilterDept(d.id)} className={`whitespace-nowrap px-6 py-4 rounded-xl font-bold text-lg transition-all ${filterDept === d.id ? 'bg-slate-800 text-white shadow-md' : 'bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-300'}`}>{d.label}</button>
          ))}
        </div>
      </div>

      {/* Table / List */}
      <div className="w-full bg-white rounded-2xl shadow-md border border-slate-200 overflow-hidden overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[900px]">
          <thead>
            <tr className="bg-slate-200 border-b border-slate-300 text-lg">
              <Th label="ชื่ออุปกรณ์ / รหัส" columnKey="name" />
              <Th label="หมวดหมู่" columnKey="category" />
              {filterDept === 'all' && <Th label="ฝ่ายที่รับผิดชอบ" columnKey="department" />}
              <Th label="สถานที่ / ห้อง" columnKey="location" />
              <Th label="สถานะ" columnKey="status" />
              <th className="px-4 py-4 text-center font-bold text-slate-700">ประวัติ / จัดการ</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredItems.length === 0 ? (
              <tr><td colSpan={filterDept === 'all' ? 6 : 5} className="px-4 py-12 text-center text-slate-400 font-bold text-xl">ไม่พบข้อมูลที่ค้นหา</td></tr>
            ) : filteredItems.map((item) => {
              const deptInfo = DEPARTMENTS.find(d => d.id === item.department) || DEPARTMENTS[0];
              const statusInfo = STATUSES.find(s => s.id === item.status) || STATUSES[0];
              const isBorrowed = item.status === 'borrowed';
              const qty = Number(item.quantity) || 1;
              
              // 🛠️ ล็อกรหัส Key ให้เป็นค่าจาก Database โดยตรง ห้ามพึ่งพาลำดับเด็ดขาด
              return (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors text-lg">
                  <td className="px-4 py-4">
                    <div className="font-bold text-slate-800 text-xl flex items-center gap-2">
                      {item.name} 
                      {qty > 1 && <span className="bg-blue-100 text-blue-700 text-base px-2 py-1 rounded-md">x{qty}</span>}
                    </div>
                    {item.sn && <div className="text-base text-slate-500 mt-1 font-mono">S.N.: {item.sn}</div>}
                    {isBorrowed && <div className="text-base mt-2 p-2 bg-purple-50 rounded-lg border border-purple-100 inline-block"><span className="font-bold text-purple-700">ผู้ยืม: {item.currentBorrower}</span> <span className="text-purple-400 mx-1">|</span> <span className="text-slate-500">คืน: {item.expectedReturn ? new Date(item.expectedReturn).toLocaleDateString('th-TH') : '-'}</span></div>}
                  </td>
                  <td className="px-4 py-4 font-bold text-slate-600">{item.category || '-'}</td>
                  
                  {filterDept === 'all' && (
                    <td className="px-4 py-4">
                      <span className={`inline-block px-3 py-1.5 rounded-lg text-base font-bold ${deptInfo.color}`}>{deptInfo.label}</span>
                    </td>
                  )}

                  <td className="px-4 py-4 font-bold text-slate-600">{item.location || '-'}</td>
                  <td className="px-4 py-4"><span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-base font-bold border ${statusInfo.color}`}><div className={`w-2 h-2 rounded-full currentColor`}></div>{statusInfo.label}</span></td>
                  <td className="px-4 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button onClick={() => setShowHistory(item.id)} className="w-10 h-10 rounded-xl bg-slate-100 text-slate-600 hover:bg-slate-800 hover:text-white flex items-center justify-center transition-colors" title="ประวัติ"><Icons.History /></button>
                      
                      {isAdmin && (
                        <>
                          {item.status === 'available' && <button onClick={() => { setBorrowData({ borrower: '', borrowDate: new Date().toISOString().split('T')[0], returnDate: '', staff: '', newStaff: '' }); setShowBorrow(item.id); }} className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-600 hover:text-white flex items-center justify-center transition-colors" title="ให้ยืม"><Icons.UserPlus /></button>}
                          {isBorrowed && <button onClick={() => { setReturnData({ staff: '', newStaff: '' }); setShowReturn(item.id); }} className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 hover:bg-emerald-600 hover:text-white flex items-center justify-center transition-colors" title="รับคืน"><Icons.CheckCircle /></button>}
                          <button onClick={() => { setFormData({ ...item, newCategory: '', newLocation: '' }); setShowForm(true); }} className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors" title="แก้ไข"><Icons.Edit /></button>
                          <button onClick={() => setShowDeleteConfirm(item.id)} className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors" title="ลบ"><Icons.Trash /></button>
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

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-[9990]">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            <div className="flex border-b border-slate-100 overflow-x-auto custom-scrollbar">
              <button onClick={() => {setSettingsTab('categories'); setEditingSettingItem(null); setNewSettingItem('');}} className={`flex-1 whitespace-nowrap px-4 py-4 font-bold text-lg ${settingsTab === 'categories' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>หมวดหมู่</button>
              <button onClick={() => {setSettingsTab('locations'); setEditingSettingItem(null); setNewSettingItem('');}} className={`flex-1 whitespace-nowrap px-4 py-4 font-bold text-lg ${settingsTab === 'locations' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>สถานที่</button>
              <button onClick={() => {setSettingsTab('staff'); setEditingSettingItem(null); setNewSettingItem('');}} className={`flex-1 whitespace-nowrap px-4 py-4 font-bold text-lg ${settingsTab === 'staff' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500 hover:bg-slate-50'}`}>เจ้าหน้าที่</button>
            </div>
            <div className="p-6">
              <div className="flex gap-2 mb-6">
                <input type="text" className="flex-1 px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-lg" placeholder={`พิมพ์${settingsTab === 'categories' ? 'หมวดหมู่' : settingsTab === 'locations' ? 'สถานที่' : 'ชื่อเจ้าหน้าที่'}ใหม่...`} value={newSettingItem} onChange={e => setNewSettingItem(e.target.value)} />
                <button onClick={handleSaveSetting} className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-lg">{editingSettingItem !== null ? 'บันทึกแก้ไข' : 'เพิ่ม'}</button>
                {editingSettingItem !== null && <button onClick={() => { setEditingSettingItem(null); setNewSettingItem(''); }} className="px-4 py-3 bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold rounded-xl"><Icons.X /></button>}
              </div>
              <div className="max-h-60 overflow-y-auto custom-scrollbar flex flex-col gap-2 pr-2">
                {(settingsOptions[settingsTab] || []).filter(c => c !== 'อื่นๆ').map((item, index) => (
                  <div key={index} className="flex justify-between items-center p-4 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-slate-100 transition-colors">
                    <span className="font-bold text-slate-700 text-lg">{item}</span>
                    <div className="flex gap-2 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => { setEditingSettingItem(item); setNewSettingItem(item); }} className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 hover:bg-blue-600 hover:text-white flex items-center justify-center transition-colors"><Icons.Edit /></button>
                      <button onClick={() => setDeleteSettingConfirm(item)} className="w-10 h-10 rounded-lg bg-rose-100 text-rose-600 hover:bg-rose-600 hover:text-white flex items-center justify-center transition-colors"><Icons.Trash /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="p-4 bg-slate-50 border-t border-slate-100">
              <button onClick={() => { setShowSettings(false); setEditingSettingItem(null); setNewSettingItem(''); }} className="w-full py-4 bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold rounded-xl text-lg">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 1: ยืนยันการลบการตั้งค่า (Settings) */}
      {deleteSettingConfirm !== null && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Icons.Trash /></div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">ยืนยันการลบ?</h3>
            <p className="text-slate-500 mb-8 text-lg">รายการ <span className="font-bold text-rose-600">"{deleteSettingConfirm}"</span> จะหายไปจากตัวเลือก</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteSettingConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl text-lg">ยกเลิก</button>
              <button onClick={handleDeleteSetting} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200 text-lg">ลบรายการ</button>
            </div>
          </div>
        </div>
      )}

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">เข้าสู่ระบบจัดการ</h3>
            <input type="password" autoFocus className="w-full px-4 py-4 bg-slate-50 border border-slate-300 rounded-xl font-bold text-center text-3xl tracking-widest focus:ring-2 focus:ring-blue-500 outline-none mb-6" maxLength={8} value={pin} onChange={e => setPin(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') handleLogin(); }} />
            <div className="flex gap-3">
              <button onClick={() => setShowLogin(false)} className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl text-lg">ยกเลิก</button>
              <button onClick={handleLogin} className="flex-1 py-4 bg-slate-800 text-white font-bold rounded-xl text-lg">เข้าสู่ระบบ</button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto custom-scrollbar shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">{formData.id ? 'แก้ไขข้อมูล' : 'เพิ่มอุปกรณ์ใหม่'}</h3>
              <button onClick={() => setShowForm(false)} className="text-slate-400 hover:text-slate-600 p-2"><Icons.X /></button>
            </div>
            <div className="space-y-5">
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">ชื่ออุปกรณ์ <span className="text-rose-500">*</span></label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-lg" placeholder="เช่น กล้อง Sony A7IV" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">ฝ่ายที่รับผิดชอบ</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-lg" value={formData.department} onChange={e => setFormData({...formData, department: e.target.value})}>
                    {DEPARTMENTS.map(d => <option key={d.id} value={d.id}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">จำนวนชิ้น</label>
                  <input type="number" min="1" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-lg" value={formData.quantity} onChange={e => setFormData({...formData, quantity: e.target.value})} />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">หมวดหมู่อุปกรณ์</label>
                  <select className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-lg" value={formData.category} onChange={e => setFormData({...formData, category: e.target.value, newCategory: e.target.value !== 'อื่นๆ' ? '' : formData.newCategory})}>
                    <option value="" disabled>-- เลือกหมวดหมู่ --</option>
                    {settingsOptions.categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">รหัส S.N. (ถ้ามี)</label>
                  <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-lg" placeholder="เช่น CAM-001" value={formData.sn} onChange={e => setFormData({...formData, sn: e.target.value})} />
                </div>
              </div>
              {formData.category === 'อื่นๆ' && (
                <div>
                  <label className="block text-base sm:text-lg font-bold text-blue-600 mb-2">เพิ่มหมวดหมู่ใหม่ / พิมพ์ระบุเอง</label>
                  <input type="text" autoFocus className="w-full px-4 py-3 bg-blue-50 border border-blue-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-lg text-blue-800" placeholder="พิมพ์ชื่อหมวดหมู่ใหม่..." value={formData.newCategory} onChange={e => setFormData({...formData, newCategory: e.target.value})} />
                </div>
              )}
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">สถานที่จัดเก็บ / ห้อง</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-lg" value={formData.location} onChange={e => setFormData({...formData, location: e.target.value, newLocation: e.target.value !== 'อื่นๆ' ? '' : formData.newLocation})}>
                  <option value="" disabled>-- เลือกสถานที่ --</option>
                  {settingsOptions.locations.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {formData.location === 'อื่นๆ' && (
                <div>
                  <label className="block text-base sm:text-lg font-bold text-blue-600 mb-2">เพิ่มสถานที่ใหม่ / พิมพ์ระบุเอง</label>
                  <input type="text" autoFocus className="w-full px-4 py-3 bg-blue-50 border border-blue-300 rounded-xl font-bold focus:ring-2 focus:ring-blue-500 outline-none text-lg text-blue-800" placeholder="พิมพ์ชื่อสถานที่จัดเก็บใหม่..." value={formData.newLocation} onChange={e => setFormData({...formData, newLocation: e.target.value})} />
                </div>
              )}
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">สถานะ</label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none text-lg" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                  {STATUSES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-8">
              <button onClick={() => setShowForm(false)} className="flex-1 py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors text-lg">ยกเลิก</button>
              <button onClick={handleSave} className="flex-1 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-lg shadow-blue-200 transition-colors text-lg">บันทึกข้อมูล</button>
            </div>
          </div>
        </div>
      )}

      {/* Borrow Modal */}
      {showBorrow && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl">
            <h3 className="text-2xl font-black text-slate-800 mb-6 text-center">บันทึกการให้ยืม</h3>
            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">ผู้ให้ยืม (จนท.) <span className="text-rose-500">*</span></label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-purple-500 outline-none text-lg text-slate-700" value={borrowData.staff} onChange={e => setBorrowData({...borrowData, staff: e.target.value, newStaff: e.target.value !== 'อื่นๆ' ? '' : borrowData.newStaff})}>
                  <option value="" disabled>-- เลือกชื่อเจ้าหน้าที่ --</option>
                  {(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {borrowData.staff === 'อื่นๆ' && (
                <div>
                  <input type="text" autoFocus className="w-full px-4 py-3 bg-purple-50 border border-purple-300 rounded-xl font-bold focus:ring-2 focus:ring-purple-500 outline-none text-lg text-purple-800" placeholder="พิมพ์ชื่อเจ้าหน้าที่ใหม่..." value={borrowData.newStaff} onChange={e => setBorrowData({...borrowData, newStaff: e.target.value})} />
                </div>
              )}
              <hr className="border-slate-100 my-4" />
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">ชื่อผู้ยืม <span className="text-rose-500">*</span></label>
                <input type="text" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-purple-500 outline-none text-lg" placeholder="ชื่อ-สกุล หรือ แผนก" value={borrowData.borrower} onChange={e => setBorrowData({...borrowData, borrower: e.target.value})} />
              </div>
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">กำหนดคืน</label>
                <input type="date" className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold text-slate-700 focus:ring-2 focus:ring-purple-500 outline-none text-lg" value={borrowData.returnDate} onChange={e => setBorrowData({...borrowData, returnDate: e.target.value})} />
              </div>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowBorrow(null)} className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl text-lg">ยกเลิก</button>
              <button onClick={handleBorrow} disabled={!borrowData.borrower || !borrowData.staff} className="flex-1 py-4 bg-purple-600 disabled:bg-purple-300 text-white font-bold rounded-xl shadow-lg shadow-purple-200 text-lg transition-colors">ยืนยัน</button>
            </div>
          </div>
        </div>
      )}

      {/* Return Modal */}
      {showReturn && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl text-center">
            <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6"><Icons.CheckCircle /></div>
            <h3 className="text-2xl font-black text-slate-800 mb-6">บันทึกรับคืนอุปกรณ์</h3>
            <div className="text-left mb-8 space-y-4">
              <div>
                <label className="block text-base sm:text-lg font-bold text-slate-700 mb-2">ผู้รับคืน (จนท.) <span className="text-rose-500">*</span></label>
                <select className="w-full px-4 py-3 bg-slate-50 border border-slate-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-lg text-slate-700" value={returnData.staff} onChange={e => setReturnData({...returnData, staff: e.target.value, newStaff: e.target.value !== 'อื่นๆ' ? '' : returnData.newStaff})}>
                  <option value="" disabled>-- เลือกชื่อเจ้าหน้าที่ --</option>
                  {(settingsOptions.staff || []).map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              {returnData.staff === 'อื่นๆ' && (
                <div>
                  <input type="text" autoFocus className="w-full px-4 py-3 bg-emerald-50 border border-emerald-300 rounded-xl font-bold focus:ring-2 focus:ring-emerald-500 outline-none text-lg text-emerald-800" placeholder="พิมพ์ชื่อเจ้าหน้าที่ใหม่..." value={returnData.newStaff} onChange={e => setReturnData({...returnData, newStaff: e.target.value})} />
                </div>
              )}
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowReturn(null)} className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl text-lg">ยกเลิก</button>
              <button onClick={handleReturn} disabled={!returnData.staff} className="flex-1 py-4 bg-emerald-600 disabled:bg-emerald-300 text-white font-bold rounded-xl shadow-lg shadow-emerald-200 text-lg transition-colors">รับคืน</button>
            </div>
          </div>
        </div>
      )}

      {/* History Modal */}
      {showHistory && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-md w-full max-h-[80vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-black text-slate-800">ประวัติการยืม-คืน</h3>
              <button onClick={() => setShowHistory(null)} className="text-slate-400 hover:text-slate-600 p-2"><Icons.X /></button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar pr-2 space-y-4">
              {items.find(i => i.id === showHistory)?.history?.length > 0 ? items.find(i => i.id === showHistory).history.slice().reverse().map((h, idx) => (
                <div key={idx} className={`p-5 rounded-xl border ${h.type === 'borrow' ? 'bg-purple-50 border-purple-100' : 'bg-emerald-50 border-emerald-100'}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <span className={`text-sm font-black px-3 py-1.5 rounded-md ${h.type === 'borrow' ? 'bg-purple-200 text-purple-700' : 'bg-emerald-200 text-emerald-700'}`}>{h.type === 'borrow' ? 'ยืมออก' : 'รับคืน'}</span>
                    <span className="text-base font-bold text-slate-500">{new Date(h.date).toLocaleString('th-TH')}</span>
                  </div>
                  {h.type === 'borrow' ? (
                    <div className="text-lg text-slate-700"><p className="mb-1"><span className="font-bold text-slate-900">ผู้ยืม:</span> {h.borrower}</p><p><span className="font-bold text-slate-900">ผู้ให้ยืม (จนท.):</span> {h.staffOut || '-'}</p></div>
                  ) : (
                    <div className="text-lg text-slate-700"><p><span className="font-bold text-slate-900">ผู้รับคืน (จนท.):</span> {h.staffIn || '-'}</p></div>
                  )}
                </div>
              )) : (
                <div className="text-center py-8 text-slate-400 font-bold text-xl">ยังไม่มีประวัติการใช้งาน</div>
              )}
            </div>
            <div className="mt-6 pt-4 border-t border-slate-100">
              <button onClick={() => setShowHistory(null)} className="w-full py-4 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl transition-colors text-lg">ปิดหน้าต่าง</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal 2: ยืนยันการลบอุปกรณ์ในตารางหลัก (Main Items) */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]">
          <div className="bg-white rounded-3xl p-8 max-w-sm w-full text-center shadow-2xl">
            <div className="w-20 h-20 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-6"><Icons.Trash /></div>
            <h3 className="text-2xl font-black text-slate-800 mb-2">ลบอุปกรณ์?</h3>
            <p className="text-slate-500 mb-8 text-lg">ข้อมูลนี้จะถูกลบถาวร ไม่สามารถกู้คืนได้</p>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(null)} className="flex-1 py-4 bg-slate-100 text-slate-700 font-bold rounded-xl text-lg">ยกเลิก</button>
              <button onClick={handleDelete} className="flex-1 py-4 bg-rose-600 text-white font-bold rounded-xl shadow-lg shadow-rose-200 text-lg">ยืนยันการลบ</button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
