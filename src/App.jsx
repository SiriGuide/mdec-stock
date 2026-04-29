import React, { useEffect, useMemo, useRef, useState } from "react";
import { initializeApp } from "firebase/app";
import { getAuth, onAuthStateChanged, signInAnonymously } from "firebase/auth";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  setDoc,
} from "firebase/firestore";
import { getFirestore } from "firebase/firestore";

// ============================================================
// MDEC-Stock App.jsx — Firebase version
// Copy & paste ทับ App.jsx ได้ทั้งไฟล์
// เพิ่มจากเว็บเดิม:
// 1) Export ประวัติยืม-คืน CSV พร้อมวันเวลา
// 2) Export รายการอุปกรณ์ปัจจุบัน CSV
// 3) ล้างเฉพาะ history หลังสำรองแล้ว โดยไม่ลบรายการอุปกรณ์หลัก
// 4) ยืนยันก่อนล้าง 2 ชั้น
// ============================================================

const myFirebaseConfig = {
  apiKey: "AIzaSyA0IFm6icc-QG4ZC2WiuhRa2YquISGH9FM",
  authDomain: "mdec-stock-app.firebaseapp.com",
  projectId: "mdec-stock-app",
  storageBucket: "mdec-stock-app.firebasestorage.app",
  messagingSenderId: "283888438624",
  appId: "1:283888438624:web:6cfe60c58d94dc00fda205",
};

const firebaseConfig =
  typeof __firebase_config !== "undefined" ? JSON.parse(__firebase_config) : myFirebaseConfig;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const IS_CANVAS = typeof __app_id !== "undefined";
const APP_ID = IS_CANVAS ? __app_id : "default-app-id";

const getItemsCol = () =>
  IS_CANVAS
    ? collection(db, "artifacts", APP_ID, "public", "data", "items")
    : collection(db, "mdec_stock", "shared_data", "items");

const getSettingsDoc = () =>
  IS_CANVAS
    ? doc(db, "artifacts", APP_ID, "public", "data", "settings", "global")
    : doc(db, "mdec_stock", "shared_data", "settings", "global");

const getAuditCol = () =>
  IS_CANVAS
    ? collection(db, "artifacts", APP_ID, "public", "data", "audit_logs")
    : collection(db, "mdec_stock", "shared_data", "audit_logs");

const getItemDoc = (id) =>
  IS_CANVAS
    ? doc(db, "artifacts", APP_ID, "public", "data", "items", id)
    : doc(db, "mdec_stock", "shared_data", "items", id);

const ADMIN_PIN = "mdec8203";

const DEFAULT_SETTINGS = {
  categories: ["กล้อง", "เลนส์", "ไมโครโฟน", "ชุดลำโพง", "ถ่าน/แบต", "สายไฟ", "อื่นๆ"],
  locations: ["ตู้ A1", "ห้องเก็บของ 2", "ห้องประชุม 1", "อื่นๆ"],
  staff: ["ครูศิริชัย", "แอดมิน", "ทีมภาพนิ่ง", "ทีมวิดีโอ", "ทีมเครื่องเสียง", "อื่นๆ"],
  bundles: [],
};

const DEPARTMENTS = [
  { id: "ภาพนิ่ง", label: "ฝ่ายภาพนิ่ง", icon: "📷", color: "blue" },
  { id: "วิดีโอ", label: "ฝ่ายวิดีโอ", icon: "🎥", color: "indigo" },
  { id: "เครื่องเสียง", label: "ฝ่ายอุปกรณ์เครื่องเสียง", icon: "🔊", color: "cyan" },
  { id: "ห้องประชุม", label: "ห้องประชุม", icon: "👥", color: "sky" },
  { id: "ob-live", label: "OB-LIVE", icon: "📡", color: "violet" },
];

const STATUSES = [
  { id: "available", label: "พร้อมใช้งาน", tone: "green", dot: "🟢" },
  { id: "in-use", label: "กำลังใช้งาน", tone: "amber", dot: "🟡" },
  { id: "borrowed", label: "ถูกยืม", tone: "purple", dot: "🟣" },
  { id: "out-for-event", label: "ออกงาน", tone: "orange", dot: "🟠" },
  { id: "maintenance", label: "ส่งซ่อม/ชำรุด", tone: "red", dot: "🔴" },
];

function statusInfo(status) {
  return STATUSES.find((s) => s.id === status) || STATUSES[0];
}

function deptInfo(dept) {
  return DEPARTMENTS.find((d) => d.id === dept) || DEPARTMENTS[0];
}

function toThaiDateTime(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleString("th-TH", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function toThaiDate(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return String(value);
  return date.toLocaleDateString("th-TH");
}

function csvEscape(value) {
  const text = value === null || value === undefined ? "" : String(value);
  return `"${text.replace(/"/g, '""')}"`;
}

function downloadCSV(filename, headers, rows) {
  const csv = [headers, ...rows]
    .map((row) => row.map(csvEscape).join(","))
    .join("
");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function combineDateTime(date, time) {
  if (!date) return "";
  return `${date}T${time || "23:59"}:00`;
}

function makeId(prefix = "item") {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
}

function parseCSVLine(line) {
  const result = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      result.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

export default function App() {
  const [user, setUser] = useState(null);
  const [items, setItems] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [settingsOptions, setSettingsOptions] = useState(DEFAULT_SETTINGS);
  const [firebaseError, setFirebaseError] = useState("");

  const [isAdmin, setIsAdmin] = useState(() => localStorage.getItem("mdec_admin") === "true");
  const [isDarkMode, setIsDarkMode] = useState(() => localStorage.getItem("mdec_theme") === "dark");
  const [pin, setPin] = useState("");

  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterOwner, setFilterOwner] = useState("all");

  const [selectedItems, setSelectedItems] = useState([]);

  const [showLogin, setShowLogin] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settingsTab, setSettingsTab] = useState("categories");
  const [newSettingItem, setNewSettingItem] = useState("");
  const [editingSettingItem, setEditingSettingItem] = useState(null);
  const [deleteSettingConfirm, setDeleteSettingConfirm] = useState(null);

  const [showHistory, setShowHistory] = useState(null);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [scanInput, setScanInput] = useState("");
  const [scanMessage, setScanMessage] = useState("");

  const [showBundleManager, setShowBundleManager] = useState(false);
  const [showBundlePicker, setShowBundlePicker] = useState(false);
  const [bundleForm, setBundleForm] = useState({ id: null, name: "", itemIds: [] });
  const [bundleSearchTerm, setBundleSearchTerm] = useState("");

  const [showQuickReturnModal, setShowQuickReturnModal] = useState(false);
  const [showPersonalItemsModal, setShowPersonalItemsModal] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false);

  const [itemToDelete, setItemToDelete] = useState(null);

  const [formData, setFormData] = useState(emptyForm());

  const [borrowTargetIds, setBorrowTargetIds] = useState([]);
  const [borrowChecklist, setBorrowChecklist] = useState([]);
  const [borrowData, setBorrowData] = useState({
    borrower: "",
    staff: "",
    returnDate: "",
    returnTime: "",
    note: "",
  });

  const [eventTargetIds, setEventTargetIds] = useState([]);
  const [eventChecklist, setEventChecklist] = useState([]);
  const [eventData, setEventData] = useState({
    eventName: "",
    staff: "",
    returnDate: "",
    returnTime: "",
    note: "",
  });

  const [returnTargetIds, setReturnTargetIds] = useState([]);
  const [returnChecklist, setReturnChecklist] = useState([]);
  const [returnData, setReturnData] = useState({
    staff: "",
    condition: "ปกติ",
    note: "",
  });

  const fileInputRef = useRef(null);
  const scanInputRef = useRef(null);

  const theme = isDarkMode ? "dark" : "light";

  useEffect(() => {
    localStorage.setItem("mdec_theme", isDarkMode ? "dark" : "light");
    document.body.style.background = isDarkMode ? "#0f172a" : "#f1f5f9";
  }, [isDarkMode]);

  useEffect(() => {
    const init = async () => {
      try {
        await signInAnonymously(auth);
      } catch (error) {
        setFirebaseError(error.message);
      }
    };
    init();
    return onAuthStateChanged(auth, setUser);
  }, []);

  useEffect(() => {
    if (!user) return;

    const unsubItems = onSnapshot(
      getItemsCol(),
      (snapshot) => {
        const loaded = [];
        snapshot.forEach((docSnap) => loaded.push({ id: docSnap.id, ...docSnap.data() }));
        loaded.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "th", { numeric: true }));
        setItems(loaded);
        setFirebaseError("");
      },
      (error) => setFirebaseError(error.message)
    );

    const unsubSettings = onSnapshot(
      getSettingsDoc(),
      (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setSettingsOptions({
            categories: data.categories || DEFAULT_SETTINGS.categories,
            locations: data.locations || DEFAULT_SETTINGS.locations,
            staff: data.staff || DEFAULT_SETTINGS.staff,
            bundles: data.bundles || [],
          });
        } else {
          setDoc(getSettingsDoc(), DEFAULT_SETTINGS).catch(console.error);
        }
      },
      (error) => setFirebaseError(error.message)
    );

    return () => {
      unsubItems();
      unsubSettings();
    };
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (!showAuditModal && !showDashboard) return;

    return onSnapshot(getAuditCol(), (snapshot) => {
      const logs = [];
      snapshot.forEach((docSnap) => logs.push({ id: docSnap.id, ...docSnap.data() }));
      logs.sort((a, b) => new Date(b.timestamp || 0) - new Date(a.timestamp || 0));
      setAuditLogs(logs);
    });
  }, [user, showAuditModal, showDashboard]);

  useEffect(() => {
    if (showScanModal && scanInputRef.current) scanInputRef.current.focus();
  }, [showScanModal]);

  const filteredItems = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return items.filter((item) => {
      const matchSearch =
        !q ||
        String(item.name || "").toLowerCase().includes(q) ||
        String(item.sn || "").toLowerCase().includes(q) ||
        String(item.id || "").toLowerCase().includes(q) ||
        String(item.location || "").toLowerCase().includes(q) ||
        String(item.category || "").toLowerCase().includes(q) ||
        String(item.owner || "").toLowerCase().includes(q) ||
        String(item.currentBorrower || "").toLowerCase().includes(q) ||
        String(item.currentEvent || "").toLowerCase().includes(q);

      const matchDept = filterDept === "all" || item.department === filterDept;
      const matchCat = filterCategory === "all" || item.category === filterCategory;
      const matchStatus = filterStatus === "all" || item.status === filterStatus;
      const matchLocation = filterLocation === "all" || item.location === filterLocation;
      const matchOwner =
        filterOwner === "all" ||
        (filterOwner === "personal" && item.owner) ||
        (filterOwner === "center" && !item.owner);

      return matchSearch && matchDept && matchCat && matchStatus && matchLocation && matchOwner;
    });
  }, [items, searchTerm, filterDept, filterCategory, filterStatus, filterLocation, filterOwner]);

  const todayStart = new Date().setHours(0, 0, 0, 0);

  const overdueItems = useMemo(() => {
    return items.filter((item) => {
      if (!["borrowed", "out-for-event"].includes(item.status)) return false;
      if (!item.expectedReturn) return false;
      return new Date(item.expectedReturn).getTime() < todayStart;
    });
  }, [items, todayStart]);

  const stats = useMemo(() => {
    const base = { all: 0, available: 0, inUse: 0, borrowed: 0, event: 0, maintenance: 0 };
    items.forEach((item) => {
      const qty = Number(item.quantity) || 1;
      base.all += qty;
      if (item.status === "available") base.available += qty;
      if (item.status === "in-use") base.inUse += qty;
      if (item.status === "borrowed") base.borrowed += qty;
      if (item.status === "out-for-event") base.event += qty;
      if (item.status === "maintenance") base.maintenance += qty;
    });
    return base;
  }, [items]);

  const activeGroups = useMemo(() => {
    const groups = {};
    items.forEach((item) => {
      if (item.status === "borrowed" && item.currentBorrower) {
        const key = `borrow_${item.currentBorrower}`;
        if (!groups[key]) groups[key] = { type: "borrow", name: item.currentBorrower, ids: [] };
        groups[key].ids.push(item.id);
      }
      if (item.status === "out-for-event" && item.currentEvent) {
        const key = `event_${item.currentEvent}`;
        if (!groups[key]) groups[key] = { type: "event", name: item.currentEvent, ids: [] };
        groups[key].ids.push(item.id);
      }
    });
    return Object.values(groups);
  }, [items]);

  async function logAction(action, target, details) {
    if (!user) return;
    try {
      await addDoc(getAuditCol(), {
        timestamp: new Date().toISOString(),
        action,
        target,
        details,
        user: "Admin",
      });
    } catch (error) {
      console.error("Audit log error", error);
    }
  }

  function handleLogin() {
    if (pin === ADMIN_PIN) {
      setIsAdmin(true);
      localStorage.setItem("mdec_admin", "true");
      setPin("");
      setShowLogin(false);
    } else {
      alert("รหัสผ่านไม่ถูกต้อง");
      setPin("");
    }
  }

  function handleLogout() {
    setIsAdmin(false);
    setSelectedItems([]);
    localStorage.removeItem("mdec_admin");
  }

  function openAddForm() {
    setFormData(emptyForm());
    setShowForm(true);
  }

  function openEditForm(item) {
    setFormData({
      id: item.id,
      name: item.name || "",
      sn: item.sn || "",
      department: item.department || "ภาพนิ่ง",
      category: item.category || "",
      newCategory: "",
      location: item.location || "",
      newLocation: "",
      status: item.status || "available",
      quantity: item.quantity || 1,
      owner: item.owner || "",
      newOwner: "",
      isPersonalItem: Boolean(item.owner),
    });
    setShowForm(true);
  }

  async function saveSettings(nextSettings) {
    setSettingsOptions(nextSettings);
    await setDoc(getSettingsDoc(), nextSettings, { merge: true });
  }

  async function handleSaveItem() {
    const name = formData.name.trim();
    const sn = String(formData.sn || "").trim();

    if (!name || !sn) {
      alert("กรุณากรอกชื่ออุปกรณ์และรหัส S.N.");
      return;
    }

    const duplicate = items.some(
      (item) => item.sn && String(item.sn).trim().toLowerCase() === sn.toLowerCase() && item.id !== formData.id
    );
    if (duplicate) {
      alert(`รหัส S.N. ${sn} มีอยู่แล้วในระบบ`);
      return;
    }

    try {
      const nextSettings = { ...settingsOptions };
      let category = formData.category || "อื่นๆ";
      let location = formData.location || "อื่นๆ";
      let owner = "";

      if (formData.category === "อื่นๆ" && formData.newCategory.trim()) {
        category = formData.newCategory.trim();
        nextSettings.categories = uniqueKeepOther(nextSettings.categories, category);
      }
      if (formData.location === "อื่นๆ" && formData.newLocation.trim()) {
        location = formData.newLocation.trim();
        nextSettings.locations = uniqueKeepOther(nextSettings.locations, location);
      }
      if (formData.isPersonalItem) {
        if (formData.owner === "อื่นๆ" && formData.newOwner.trim()) {
          owner = formData.newOwner.trim();
          nextSettings.staff = uniqueKeepOther(nextSettings.staff, owner);
        } else if (formData.owner) {
          owner = formData.owner;
        } else {
          alert("กรุณาเลือกเจ้าของของส่วนตัว");
          return;
        }
      }

      await saveSettings(nextSettings);

      const payload = {
        name,
        sn,
        department: formData.department,
        category,
        location,
        status: formData.status,
        quantity: Number(formData.quantity) || 1,
        owner,
        updatedAt: new Date().toISOString(),
      };

      if (formData.id) {
        await setDoc(getItemDoc(formData.id), payload, { merge: true });
        await logAction("แก้ไขข้อมูล", name, `แก้ไขอุปกรณ์ S.N.: ${sn}`);
        alert("แก้ไขข้อมูลอุปกรณ์สำเร็จ");
      } else {
        const id = makeId("item");
        await setDoc(getItemDoc(id), { ...payload, history: [] });
        await logAction("เพิ่มอุปกรณ์", name, `เพิ่มเข้าสู่ระบบ หมวดหมู่: ${category}`);
        alert("เพิ่มอุปกรณ์ใหม่สำเร็จ");
      }
      setShowForm(false);
    } catch (error) {
      alert(`บันทึกข้อมูลไม่สำเร็จ: ${error.message}`);
    }
  }

  async function handleDeleteItem() {
    if (!itemToDelete) return;
    try {
      await deleteDoc(getItemDoc(itemToDelete.id));
      await logAction("ลบข้อมูล", itemToDelete.name, "ลบอุปกรณ์ออกจากระบบ");
      setItemToDelete(null);
    } catch (error) {
      alert(`ลบไม่สำเร็จ: ${error.message}`);
    }
  }

  function checkPersonalWarning(ids) {
    const personal = ids.map((id) => items.find((item) => item.id === id)).filter((item) => item && item.owner);
    if (personal.length === 0) return true;
    const owners = [...new Set(personal.map((item) => item.owner))].join(", ");
    return window.confirm(`มีของส่วนตัวในรายการนี้
เจ้าของ: ${owners}

ยืนยันว่ารับอนุญาตแล้วและต้องการดำเนินการต่อหรือไม่?`);
  }

  function startBorrow(ids) {
    const valid = ids.filter((id) => items.find((item) => item.id === id)?.status === "available");
    if (valid.length === 0) {
      alert("ไม่มีอุปกรณ์พร้อมใช้งานให้ยืม");
      return;
    }
    setBorrowTargetIds(valid);
    setBorrowChecklist(valid);
    setBorrowData({ borrower: "", staff: "", returnDate: "", returnTime: "", note: "" });
  }

  function startEvent(ids) {
    const valid = ids.filter((id) => items.find((item) => item.id === id)?.status === "available");
    if (valid.length === 0) {
      alert("ไม่มีอุปกรณ์พร้อมใช้งานให้นำออกงาน");
      return;
    }
    setEventTargetIds(valid);
    setEventChecklist(valid);
    setEventData({ eventName: "", staff: "", returnDate: "", returnTime: "", note: "" });
  }

  function startReturn(ids) {
    const valid = ids.filter((id) => ["borrowed", "out-for-event"].includes(items.find((item) => item.id === id)?.status));
    if (valid.length === 0) {
      alert("ไม่มีอุปกรณ์ที่สามารถรับคืนได้");
      return;
    }
    setReturnTargetIds(valid);
    setReturnChecklist(valid);
    setReturnData({ staff: "", condition: "ปกติ", note: "" });
  }

  async function handleBorrow() {
    if (!borrowData.staff || !borrowData.borrower.trim() || !borrowData.returnDate || !borrowData.returnTime || borrowChecklist.length === 0) {
      alert("กรุณากรอกข้อมูลการยืมให้ครบ");
      return;
    }
    if (!checkPersonalWarning(borrowChecklist)) return;

    const expectedReturn = combineDateTime(borrowData.returnDate, borrowData.returnTime);
    const now = new Date().toISOString();
    const names = [];
    try {
      await Promise.all(
        borrowChecklist.map((id) => {
          const item = items.find((i) => i.id === id);
          if (!item || item.status !== "available") return Promise.resolve();
          names.push(item.name);
          const historyEntry = {
            type: "borrow",
            date: now,
            borrower: borrowData.borrower.trim(),
            expectedReturn,
            staffOut: borrowData.staff,
            note: borrowData.note.trim(),
          };
          return setDoc(
            getItemDoc(id),
            {
              status: "borrowed",
              currentBorrower: borrowData.borrower.trim(),
              currentEvent: null,
              expectedReturn,
              currentNote: borrowData.note.trim(),
              history: [...(item.history || []), historyEntry],
              updatedAt: now,
            },
            { merge: true }
          );
        })
      );
      await logAction("ให้ยืมอุปกรณ์", `${borrowChecklist.length} รายการ`, `ผู้ยืม: ${borrowData.borrower}
เจ้าหน้าที่: ${borrowData.staff}
กำหนดคืน: ${toThaiDateTime(expectedReturn)}
รายการ: ${names.join(", ")}`);
      resetBorrow();
      alert("บันทึกการยืมเรียบร้อยแล้ว");
    } catch (error) {
      alert(`บันทึกการยืมไม่สำเร็จ: ${error.message}`);
    }
  }

  async function handleEventOut() {
    if (!eventData.staff || !eventData.eventName.trim() || !eventData.returnDate || !eventData.returnTime || eventChecklist.length === 0) {
      alert("กรุณากรอกข้อมูลการออกงานให้ครบ");
      return;
    }
    if (!checkPersonalWarning(eventChecklist)) return;

    const expectedReturn = combineDateTime(eventData.returnDate, eventData.returnTime);
    const now = new Date().toISOString();
    const names = [];
    try {
      await Promise.all(
        eventChecklist.map((id) => {
          const item = items.find((i) => i.id === id);
          if (!item || item.status !== "available") return Promise.resolve();
          names.push(item.name);
          const historyEntry = {
            type: "event",
            date: now,
            eventName: eventData.eventName.trim(),
            expectedReturn,
            staffOut: eventData.staff,
            note: eventData.note.trim(),
          };
          return setDoc(
            getItemDoc(id),
            {
              status: "out-for-event",
              currentEvent: eventData.eventName.trim(),
              currentBorrower: null,
              expectedReturn,
              currentNote: eventData.note.trim(),
              history: [...(item.history || []), historyEntry],
              updatedAt: now,
            },
            { merge: true }
          );
        })
      );
      await logAction("นำออกงาน", `${eventChecklist.length} รายการ`, `ชื่องาน: ${eventData.eventName}
เจ้าหน้าที่: ${eventData.staff}
กำหนดคืน: ${toThaiDateTime(expectedReturn)}
รายการ: ${names.join(", ")}`);
      resetEvent();
      alert("บันทึกการนำออกงานเรียบร้อยแล้ว");
    } catch (error) {
      alert(`บันทึกการนำออกงานไม่สำเร็จ: ${error.message}`);
    }
  }

  async function handleReturn() {
    if (!returnData.staff || !returnData.condition || returnChecklist.length === 0) {
      alert("กรุณาเลือกเจ้าหน้าที่และเช็กรายการรับคืน");
      return;
    }
    const now = new Date().toISOString();
    const names = [];
    try {
      await Promise.all(
        returnChecklist.map((id) => {
          const item = items.find((i) => i.id === id);
          if (!item || !["borrowed", "out-for-event"].includes(item.status)) return Promise.resolve();
          names.push(item.name);
          const shouldMaintenance = returnData.condition === "ชำรุด / ส่งซ่อม";
          const historyEntry = {
            type: "return",
            date: now,
            staffIn: returnData.staff,
            condition: returnData.condition,
            note: returnData.note.trim(),
          };
          return setDoc(
            getItemDoc(id),
            {
              status: shouldMaintenance ? "maintenance" : "available",
              currentBorrower: null,
              currentEvent: null,
              currentNote: null,
              expectedReturn: null,
              history: [...(item.history || []), historyEntry],
              updatedAt: now,
            },
            { merge: true }
          );
        })
      );
      await logAction("รับคืนอุปกรณ์", `${returnChecklist.length} รายการ`, `ผู้รับคืน: ${returnData.staff}
สภาพหลังคืน: ${returnData.condition}
รายการ: ${names.join(", ")}`);
      resetReturn();
      alert("รับคืนอุปกรณ์เรียบร้อยแล้ว");
    } catch (error) {
      alert(`รับคืนไม่สำเร็จ: ${error.message}`);
    }
  }

  function resetBorrow() {
    setBorrowTargetIds([]);
    setBorrowChecklist([]);
    setBorrowData({ borrower: "", staff: "", returnDate: "", returnTime: "", note: "" });
    setSelectedItems([]);
  }

  function resetEvent() {
    setEventTargetIds([]);
    setEventChecklist([]);
    setEventData({ eventName: "", staff: "", returnDate: "", returnTime: "", note: "" });
    setSelectedItems([]);
  }

  function resetReturn() {
    setReturnTargetIds([]);
    setReturnChecklist([]);
    setReturnData({ staff: "", condition: "ปกติ", note: "" });
    setSelectedItems([]);
  }

  function exportInventoryCSV() {
    const headers = [
      "ชื่ออุปกรณ์",
      "รหัส S.N.",
      "ฝ่าย",
      "หมวดหมู่",
      "สถานที่",
      "สถานะ",
      "จำนวน",
      "เจ้าของ",
      "ผู้ยืม/ชื่องานปัจจุบัน",
      "กำหนดคืน",
      "หมายเหตุปัจจุบัน",
      "อัปเดตล่าสุด",
    ];
    const rows = items.map((item) => [
      item.name || "",
      item.sn || "",
      deptInfo(item.department).label,
      item.category || "",
      item.location || "",
      statusInfo(item.status).label,
      item.quantity || 1,
      item.owner || "",
      item.currentBorrower || item.currentEvent || "",
      toThaiDateTime(item.expectedReturn),
      item.currentNote || "",
      toThaiDateTime(item.updatedAt),
    ]);
    downloadCSV(`MDEC_Inventory_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    logAction("สำรองข้อมูล", "รายการอุปกรณ์ปัจจุบัน", `Export inventory CSV ${rows.length} รายการ`);
  }

  function exportHistoryCSV() {
    const headers = [
      "ชื่ออุปกรณ์",
      "รหัส S.N.",
      "ฝ่าย",
      "หมวดหมู่",
      "สถานที่",
      "ประเภทการทำรายการ",
      "วันเวลาทำรายการ",
      "ผู้ยืม/ชื่องาน",
      "เจ้าหน้าที่ผู้ให้ยืม/นำออก",
      "กำหนดคืน",
      "เจ้าหน้าที่ผู้รับคืน",
      "สภาพหลังคืน",
      "หมายเหตุ",
    ];

    const rows = [];
    items.forEach((item) => {
      (item.history || []).forEach((h) => {
        const typeLabel = h.type === "borrow" ? "ยืมอุปกรณ์" : h.type === "event" ? "ออกงาน" : h.type === "return" ? "รับคืน" : h.type || "";
        rows.push([
          item.name || "",
          item.sn || "",
          deptInfo(item.department).label,
          item.category || "",
          item.location || "",
          typeLabel,
          toThaiDateTime(h.date),
          h.borrower || h.eventName || "",
          h.staffOut || "",
          toThaiDateTime(h.expectedReturn),
          h.staffIn || "",
          h.condition || "",
          h.note || "",
        ]);
      });
    });

    if (rows.length === 0) {
      alert("ยังไม่มีประวัติยืม-คืนให้สำรอง");
      return;
    }

    downloadCSV(`MDEC_Borrow_Return_History_${new Date().toISOString().slice(0, 10)}.csv`, headers, rows);
    logAction("สำรองประวัติ", "ประวัติยืม-คืน", `Export borrow-return history CSV ${rows.length} รายการ`);
  }

  async function clearBorrowReturnHistoryOnly() {
    const hasHistory = items.some((item) => (item.history || []).length > 0);
    if (!hasHistory) {
      alert("ไม่มีประวัติให้ล้าง");
      return;
    }

    const active = items.filter((item) => ["borrowed", "out-for-event"].includes(item.status));
    const warnActive =
      active.length > 0
        ? `

คำเตือน: ยังมีอุปกรณ์ที่ถูกยืมหรือออกงานอยู่ ${active.length} รายการ
ระบบจะล้างเฉพาะ history แต่จะไม่เปลี่ยนสถานะปัจจุบัน`
        : "";

    const ok = window.confirm(
      `คุณดาวน์โหลดไฟล์สำรองประวัติยืม-คืน CSV แล้วใช่หรือไม่?${warnActive}

การทำงานนี้จะล้างเฉพาะ history ของอุปกรณ์ทุกชิ้น ไม่ลบรายการอุปกรณ์หลัก`
    );
    if (!ok) return;

    const typed = window.prompt('เพื่อยืนยัน ให้พิมพ์คำว่า CLEAR');
    if (typed !== "CLEAR") {
      alert("ยกเลิกการล้างประวัติ เพราะพิมพ์คำยืนยันไม่ถูกต้อง");
      return;
    }

    try {
      await Promise.all(items.map((item) => setDoc(getItemDoc(item.id), { history: [] }, { merge: true })));
      await logAction("ล้างประวัติ", "ประวัติยืม-คืนทั้งหมด", `Clear history only: ${items.length} อุปกรณ์`);
      alert("ล้างเฉพาะประวัติยืม-คืนเรียบร้อยแล้ว รายการอุปกรณ์หลักยังอยู่ครบ");
    } catch (error) {
      alert(`ล้างประวัติไม่สำเร็จ: ${error.message}`);
    }
  }

  async function handleSaveSetting() {
    const value = newSettingItem.trim();
    if (!value) return;
    const key = settingsTab;
    if (!["categories", "locations", "staff"].includes(key)) return;

    let next = [...(settingsOptions[key] || [])];
    if (editingSettingItem) {
      next = next.map((item) => (item === editingSettingItem ? value : item));
    } else {
      next = uniqueKeepOther(next, value);
    }

    const nextSettings = { ...settingsOptions, [key]: [...new Set(next)] };
    try {
      await saveSettings(nextSettings);

      if (editingSettingItem && editingSettingItem !== value) {
        await Promise.all(
          items.map((item) => {
            const update = {};
            if (key === "categories" && item.category === editingSettingItem) update.category = value;
            if (key === "locations" && item.location === editingSettingItem) update.location = value;
            if (Object.keys(update).length) return setDoc(getItemDoc(item.id), update, { merge: true });
            return Promise.resolve();
          })
        );
      }

      setNewSettingItem("");
      setEditingSettingItem(null);
    } catch (error) {
      alert(`บันทึกตั้งค่าไม่สำเร็จ: ${error.message}`);
    }
  }

  async function handleDeleteSetting() {
    if (!deleteSettingConfirm) return;
    const key = settingsTab;
    if (!["categories", "locations", "staff"].includes(key)) return;
    const next = (settingsOptions[key] || []).filter((item) => item !== deleteSettingConfirm);
    try {
      await saveSettings({ ...settingsOptions, [key]: next });
      setDeleteSettingConfirm(null);
    } catch (error) {
      alert(`ลบตั้งค่าไม่สำเร็จ: ${error.message}`);
    }
  }

  async function handleSaveBundle() {
    const name = bundleForm.name.trim();
    if (!name || bundleForm.itemIds.length === 0) {
      alert("กรุณาตั้งชื่อเซ็ตและเลือกอุปกรณ์อย่างน้อย 1 ชิ้น");
      return;
    }
    const bundles = settingsOptions.bundles || [];
    const nextBundles = bundleForm.id
      ? bundles.map((b) => (b.id === bundleForm.id ? { ...b, name, itemIds: bundleForm.itemIds } : b))
      : [...bundles, { id: makeId("bundle"), name, itemIds: bundleForm.itemIds }];
    try {
      await saveSettings({ ...settingsOptions, bundles: nextBundles });
      setBundleForm({ id: null, name: "", itemIds: [] });
      alert("บันทึกเซ็ตอุปกรณ์เรียบร้อยแล้ว");
    } catch (error) {
      alert(`บันทึกเซ็ตไม่สำเร็จ: ${error.message}`);
    }
  }

  async function handleDeleteBundle(bundleId) {
    if (!window.confirm("ยืนยันการลบเซ็ตนี้? ไม่กระทบอุปกรณ์จริง")) return;
    const nextBundles = (settingsOptions.bundles || []).filter((b) => b.id !== bundleId);
    await saveSettings({ ...settingsOptions, bundles: nextBundles });
  }

  function selectBundle(bundle, mode) {
    const ids = bundle.itemIds || [];
    if (mode === "borrow") startBorrow(ids);
    if (mode === "event") startEvent(ids);
    if (mode === "return") startReturn(ids);
    setShowBundlePicker(false);
  }

  function handleScanSubmit(event) {
    event.preventDefault();
    const val = scanInput.trim();
    if (!val) return;
    const found = items.find((item) => item.id === val || String(item.sn || "").toLowerCase() === val.toLowerCase());
    if (!found) {
      setScanMessage(`ไม่พบอุปกรณ์รหัส ${val}`);
    } else {
      setSelectedItems((current) => (current.includes(found.id) ? current : [...current, found.id]));
      setScanMessage(`เพิ่ม ${found.name} ลงรายการที่เลือกแล้ว`);
    }
    setScanInput("");
  }

  function handleImportCSV(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const text = String(e.target.result || "");
        const lines = text.split(/
?
/).filter(Boolean);
        let count = 0;
        for (let i = 1; i < lines.length; i++) {
          const cols = parseCSVLine(lines[i]);
          const name = cols[0]?.trim();
          if (!name) continue;
          const id = makeId("item");
          await setDoc(getItemDoc(id), {
            name,
            sn: cols[1] || "",
            category: cols[2] || "อื่นๆ",
            department: cols[3] || "ภาพนิ่ง",
            location: cols[4] || "อื่นๆ",
            quantity: Number(cols[5]) || 1,
            status: "available",
            owner: "",
            history: [],
            updatedAt: new Date().toISOString(),
          });
          count++;
        }
        await logAction("นำเข้าข้อมูล", `Import ${count} รายการ`, `ไฟล์: ${file.name}`);
        alert(`นำเข้าข้อมูลสำเร็จ ${count} รายการ`);
        event.target.value = "";
      } catch (error) {
        alert(`นำเข้า CSV ไม่สำเร็จ: ${error.message}`);
      }
    };
    reader.readAsText(file);
  }

  if (showPrintModal) {
    return (
      <PrintView
        items={items}
        selectedItems={selectedItems}
        close={() => setShowPrintModal(false)}
      />
    );
  }

  return (
    <div className={`app ${theme}`}>
      <style>{styles}</style>

      {showDashboard && (
        <DashboardView
          stats={stats}
          overdueItems={overdueItems}
          auditLogs={auditLogs}
          close={() => setShowDashboard(false)}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
        />
      )}

      <div className="page">
        {firebaseError && (
          <div className="alert alert-danger">
            <b>ฐานข้อมูลมีปัญหา</b>
            <span>{firebaseError}</span>
          </div>
        )}

        <Header
          isAdmin={isAdmin}
          isDarkMode={isDarkMode}
          setIsDarkMode={setIsDarkMode}
          openLogin={() => setShowLogin(true)}
          logout={handleLogout}
          openAddForm={openAddForm}
          openScan={() => setShowScanModal(true)}
          openSettings={() => {
            setSettingsTab("categories");
            setShowSettings(true);
          }}
          openDashboard={() => setShowDashboard(true)}
          openBundleManager={() => setShowBundleManager(true)}
          openBundlePicker={() => setShowBundlePicker(true)}
          openQuickReturn={() => setShowQuickReturnModal(true)}
          openPersonal={() => setShowPersonalItemsModal(true)}
          openAudit={() => setShowAuditModal(true)}
          hasBundles={(settingsOptions.bundles || []).length > 0}
        />

        {overdueItems.length > 0 && (
          <div className="alert alert-danger">
            <b>แจ้งเตือน: มีอุปกรณ์เลยกำหนดคืน {overdueItems.length} รายการ</b>
            <span>ตรวจสอบรายการสีแดงในตาราง หรือเมนูติดตามของรอคืน</span>
          </div>
        )}

        <StatsGrid stats={stats} />

        <FilterPanel
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
          filterDept={filterDept}
          setFilterDept={setFilterDept}
          filterCategory={filterCategory}
          setFilterCategory={setFilterCategory}
          filterStatus={filterStatus}
          setFilterStatus={setFilterStatus}
          filterLocation={filterLocation}
          setFilterLocation={setFilterLocation}
          filterOwner={filterOwner}
          setFilterOwner={setFilterOwner}
          settingsOptions={settingsOptions}
          isAdmin={isAdmin}
          openAddForm={openAddForm}
        />

        <ItemsTable
          items={filteredItems}
          isAdmin={isAdmin}
          selectedItems={selectedItems}
          setSelectedItems={setSelectedItems}
          todayStart={todayStart}
          openHistory={setShowHistory}
          openEdit={openEditForm}
          askDelete={setItemToDelete}
          startBorrow={(id) => startBorrow([id])}
          startEvent={(id) => startEvent([id])}
          startReturn={(id) => startReturn([id])}
        />
      </div>

      {isAdmin && selectedItems.length > 0 && (
        <ActionBar
          count={selectedItems.length}
          clear={() => setSelectedItems([])}
          print={() => setShowPrintModal(true)}
          createBundle={() => {
            setBundleForm({ id: null, name: "", itemIds: [...selectedItems] });
            setShowBundleManager(true);
          }}
          borrow={() => startBorrow(selectedItems)}
          eventOut={() => startEvent(selectedItems)}
          returnIn={() => startReturn(selectedItems)}
        />
      )}

      {showLogin && (
        <LoginModal
          pin={pin}
          setPin={setPin}
          close={() => setShowLogin(false)}
          login={handleLogin}
        />
      )}

      {showForm && (
        <ItemFormModal
          formData={formData}
          setFormData={setFormData}
          settingsOptions={settingsOptions}
          save={handleSaveItem}
          close={() => setShowForm(false)}
        />
      )}

      {itemToDelete && (
        <ConfirmModal
          title="ลบอุปกรณ์?"
          text={`ยืนยันการลบ “${itemToDelete.name}” ออกจากระบบ`}
          confirmText="ยืนยันการลบ"
          tone="danger"
          close={() => setItemToDelete(null)}
          confirm={handleDeleteItem}
        />
      )}

      {showHistory && (
        <HistoryModal
          item={items.find((i) => i.id === showHistory)}
          close={() => setShowHistory(null)}
        />
      )}

      {borrowTargetIds.length > 0 && (
        <BorrowModal
          items={items.filter((item) => borrowTargetIds.includes(item.id))}
          checklist={borrowChecklist}
          setChecklist={setBorrowChecklist}
          data={borrowData}
          setData={setBorrowData}
          staffOptions={settingsOptions.staff}
          close={resetBorrow}
          confirm={handleBorrow}
        />
      )}

      {eventTargetIds.length > 0 && (
        <EventModal
          items={items.filter((item) => eventTargetIds.includes(item.id))}
          checklist={eventChecklist}
          setChecklist={setEventChecklist}
          data={eventData}
          setData={setEventData}
          staffOptions={settingsOptions.staff}
          close={resetEvent}
          confirm={handleEventOut}
        />
      )}

      {returnTargetIds.length > 0 && (
        <ReturnModal
          items={items.filter((item) => returnTargetIds.includes(item.id))}
          checklist={returnChecklist}
          setChecklist={setReturnChecklist}
          data={returnData}
          setData={setReturnData}
          staffOptions={settingsOptions.staff}
          close={resetReturn}
          confirm={handleReturn}
        />
      )}

      {showSettings && (
        <SettingsModal
          settingsTab={settingsTab}
          setSettingsTab={setSettingsTab}
          settingsOptions={settingsOptions}
          newSettingItem={newSettingItem}
          setNewSettingItem={setNewSettingItem}
          editingSettingItem={editingSettingItem}
          setEditingSettingItem={setEditingSettingItem}
          deleteSetting={setDeleteSettingConfirm}
          saveSetting={handleSaveSetting}
          close={() => {
            setShowSettings(false);
            setEditingSettingItem(null);
            setNewSettingItem("");
          }}
          exportInventoryCSV={exportInventoryCSV}
          exportHistoryCSV={exportHistoryCSV}
          clearHistoryOnly={clearBorrowReturnHistoryOnly}
          fileInputRef={fileInputRef}
          handleImportCSV={handleImportCSV}
        />
      )}

      {deleteSettingConfirm && (
        <ConfirmModal
          title="ลบรายการตั้งค่า?"
          text={`รายการ “${deleteSettingConfirm}” จะหายไปจากตัวเลือก`}
          confirmText="ลบรายการ"
          tone="danger"
          close={() => setDeleteSettingConfirm(null)}
          confirm={handleDeleteSetting}
        />
      )}

      {showAuditModal && (
        <AuditModal logs={auditLogs} close={() => setShowAuditModal(false)} />
      )}

      {showScanModal && (
        <ScanModal
          scanInput={scanInput}
          setScanInput={setScanInput}
          scanMessage={scanMessage}
          inputRef={scanInputRef}
          submit={handleScanSubmit}
          close={() => setShowScanModal(false)}
        />
      )}

      {showBundleManager && (
        <BundleManagerModal
          items={items}
          settingsOptions={settingsOptions}
          bundleForm={bundleForm}
          setBundleForm={setBundleForm}
          bundleSearchTerm={bundleSearchTerm}
          setBundleSearchTerm={setBundleSearchTerm}
          save={handleSaveBundle}
          deleteBundle={handleDeleteBundle}
          close={() => setShowBundleManager(false)}
        />
      )}

      {showBundlePicker && (
        <BundlePickerModal
          items={items}
          bundles={settingsOptions.bundles || []}
          selectBundle={selectBundle}
          close={() => setShowBundlePicker(false)}
        />
      )}

      {showQuickReturnModal && (
        <QuickReturnModal
          groups={activeGroups}
          items={items}
          todayStart={todayStart}
          close={() => setShowQuickReturnModal(false)}
          startReturn={(ids) => {
            setShowQuickReturnModal(false);
            startReturn(ids);
          }}
        />
      )}

      {showPersonalItemsModal && (
        <PersonalItemsModal items={items} close={() => setShowPersonalItemsModal(false)} />
      )}
    </div>
  );
}

function emptyForm() {
  return {
    id: "",
    name: "",
    sn: "",
    department: "ภาพนิ่ง",
    category: "",
    newCategory: "",
    location: "",
    newLocation: "",
    status: "available",
    quantity: 1,
    owner: "",
    newOwner: "",
    isPersonalItem: false,
  };
}

function uniqueKeepOther(list = [], value) {
  const noOther = list.filter((item) => item !== "อื่นๆ");
  return [...new Set([...noOther, value, "อื่นๆ"])];
}

function Header(props) {
  const {
    isAdmin,
    isDarkMode,
    setIsDarkMode,
    openLogin,
    logout,
    openAddForm,
    openScan,
    openSettings,
    openDashboard,
    openBundleManager,
    openBundlePicker,
    openQuickReturn,
    openPersonal,
    openAudit,
    hasBundles,
  } = props;

  return (
    <div className="header card">
      <div className="brand">
        <div className="brand-icon">📦</div>
        <div>
          <h1>
            MDEC-Stock <span>v21 Backup History</span>
          </h1>
          <p>ระบบจัดการสต๊อก ศูนย์มัลติมีเดียทางการศึกษา</p>
        </div>
      </div>
      <div className="header-actions">
        <button className="btn ghost" onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? "☀️" : "🌙"}</button>
        {isAdmin ? (
          <>
            <button className="btn amber" onClick={openScan}>▦ สแกน</button>
            <button className="btn green" onClick={openDashboard}>📊 Dashboard</button>
            <button className="btn fuchsia" onClick={openBundleManager}>🧩 จัดการเซ็ต</button>
            {hasBundles && <button className="btn purple" onClick={openBundlePicker}>📦 ใช้งานเซ็ต</button>}
            <button className="btn pink" onClick={openPersonal}>🏷️ ของส่วนตัว</button>
            <button className="btn indigo" onClick={openQuickReturn}>↩️ ติดตามของรอคืน</button>
            <button className="btn ghost" onClick={openAudit}>📋</button>
            <button className="btn ghost" onClick={openSettings}>⚙️ ตั้งค่า</button>
            <button className="btn danger-soft" onClick={logout}>ออก</button>
          </>
        ) : (
          <button className="btn dark" onClick={openLogin}>🔒 เข้าสู่ระบบจัดการ</button>
        )}
      </div>
      {isAdmin && <button className="btn blue mobile-add" onClick={openAddForm}>➕ เพิ่มอุปกรณ์</button>}
    </div>
  );
}

function StatsGrid({ stats }) {
  const cards = [
    ["อุปกรณ์ทั้งหมด", stats.all, "blue"],
    ["พร้อมใช้งาน", stats.available, "green"],
    ["กำลังใช้งาน", stats.inUse, "amber"],
    ["กำลังถูกยืม", stats.borrowed, "purple"],
    ["ออกงาน", stats.event, "orange"],
    ["ส่งซ่อม/ชำรุด", stats.maintenance, "red"],
  ];
  return (
    <div className="stats-grid">
      {cards.map(([label, value, tone]) => (
        <div key={label} className={`stat-card card border-${tone}`}>
          <span>{label}</span>
          <b className={`text-${tone}`}>{value}</b>
        </div>
      ))}
    </div>
  );
}

function FilterPanel(props) {
  const {
    searchTerm,
    setSearchTerm,
    filterDept,
    setFilterDept,
    filterCategory,
    setFilterCategory,
    filterStatus,
    setFilterStatus,
    filterLocation,
    setFilterLocation,
    filterOwner,
    setFilterOwner,
    settingsOptions,
    isAdmin,
    openAddForm,
  } = props;

  return (
    <div className="filter-panel card">
      <div className="filter-row">
        <input className="search" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} placeholder="ค้นหาชื่ออุปกรณ์, S.N., รหัส, สถานที่, เจ้าของ..." />
        <select value={filterLocation} onChange={(e) => setFilterLocation(e.target.value)}>
          <option value="all">สถานที่/ห้อง ทั้งหมด</option>
          {(settingsOptions.locations || []).filter((x) => x !== "อื่นๆ").map((x) => <option key={x}>{x}</option>)}
        </select>
        <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)}>
          <option value="all">หมวดหมู่ทั้งหมด</option>
          {(settingsOptions.categories || []).filter((x) => x !== "อื่นๆ").map((x) => <option key={x}>{x}</option>)}
        </select>
        <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
          <option value="all">สถานะทั้งหมด</option>
          {STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={filterOwner} onChange={(e) => setFilterOwner(e.target.value)}>
          <option value="all">ทรัพย์สินทั้งหมด</option>
          <option value="center">ของศูนย์</option>
          <option value="personal">ของส่วนตัว</option>
        </select>
        {isAdmin && <button className="btn blue" onClick={openAddForm}>➕ เพิ่มอุปกรณ์</button>}
      </div>
      <div className="dept-tabs">
        <button className={filterDept === "all" ? "active" : ""} onClick={() => setFilterDept("all")}>ทั้งหมด</button>
        {DEPARTMENTS.map((d) => (
          <button key={d.id} className={filterDept === d.id ? "active" : ""} onClick={() => setFilterDept(d.id)}>
            {d.icon} {d.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function ItemsTable(props) {
  const {
    items,
    isAdmin,
    selectedItems,
    setSelectedItems,
    todayStart,
    openHistory,
    openEdit,
    askDelete,
    startBorrow,
    startEvent,
    startReturn,
  } = props;

  const selectable = items.filter((item) => ["available", "borrowed", "out-for-event"].includes(item.status));
  const allSelected = selectable.length > 0 && selectable.every((item) => selectedItems.includes(item.id));

  return (
    <div className="table-card card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {isAdmin && <th className="center"><input type="checkbox" checked={allSelected} onChange={(e) => setSelectedItems(e.target.checked ? selectable.map((i) => i.id) : [])} /></th>}
              <th>ชื่ออุปกรณ์ / รหัส</th>
              <th>หมวดหมู่</th>
              <th>ฝ่ายที่รับผิดชอบ</th>
              <th>สถานที่ / ห้อง</th>
              <th>สถานะ</th>
              <th className="center">ประวัติ / จัดการ</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr><td colSpan={isAdmin ? 7 : 6} className="empty">ไม่พบข้อมูล</td></tr>
            ) : items.map((item) => {
              const st = statusInfo(item.status);
              const dept = deptInfo(item.department);
              const isOut = ["borrowed", "out-for-event"].includes(item.status);
              const overdue = isOut && item.expectedReturn && new Date(item.expectedReturn).getTime() < todayStart;
              const checked = selectedItems.includes(item.id);
              return (
                <tr key={item.id} className={overdue ? "overdue" : ""}>
                  {isAdmin && (
                    <td className="center">
                      {["available", "borrowed", "out-for-event"].includes(item.status) ? (
                        <input type="checkbox" checked={checked} onChange={() => setSelectedItems((cur) => cur.includes(item.id) ? cur.filter((id) => id !== item.id) : [...cur, item.id])} />
                      ) : <span className="disabled-box" />}
                    </td>
                  )}
                  <td>
                    <div className="item-name">
                      <b>{item.name}</b>
                      {Number(item.quantity || 1) > 1 && <span className="qty">x{item.quantity}</span>}
                      {item.owner && <span className="owner">ของส่วนตัว: {item.owner}</span>}
                      {overdue && <span className="late">เลยกำหนดคืน</span>}
                    </div>
                    <small>S.N.: {item.sn || "-"}</small>
                    {isOut && (
                      <div className={`current current-${st.tone}`}>
                        {item.status === "out-for-event" ? "ออกงาน" : "ผู้ยืม"}: {item.currentEvent || item.currentBorrower || "-"}
                        <span> | คืน: {toThaiDateTime(item.expectedReturn) || "-"}</span>
                        {item.currentNote && <em>หมายเหตุ: {item.currentNote}</em>}
                      </div>
                    )}
                  </td>
                  <td>{item.category || "-"}</td>
                  <td><span className={`badge badge-${dept.color}`}>{dept.icon} {dept.label}</span></td>
                  <td>{item.location || "-"}</td>
                  <td><span className={`status status-${st.tone}`}>{st.dot} {st.label}</span></td>
                  <td className="center">
                    <div className="row-actions">
                      <button className="icon-btn" onClick={() => openHistory(item.id)}>🕘</button>
                      {isAdmin && item.status === "available" && <button className="icon-btn purple" onClick={() => startBorrow(item.id)}>ยืม</button>}
                      {isAdmin && item.status === "available" && <button className="icon-btn orange" onClick={() => startEvent(item.id)}>ออกงาน</button>}
                      {isAdmin && isOut && <button className="icon-btn green" onClick={() => startReturn(item.id)}>คืน</button>}
                      {isAdmin && <button className="icon-btn blue" onClick={() => openEdit(item)}>แก้</button>}
                      {isAdmin && <button className="icon-btn red" onClick={() => askDelete(item)}>ลบ</button>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ActionBar({ count, clear, print, createBundle, borrow, eventOut, returnIn }) {
  return (
    <div className="action-bar">
      <b>{count}</b><span>รายการที่เลือก</span>
      <button onClick={print}>พิมพ์ QR</button>
      <button onClick={createBundle}>จัดเซ็ต</button>
      <button onClick={borrow}>ยืมออก</button>
      <button onClick={eventOut}>ออกงาน</button>
      <button onClick={returnIn}>รับคืน</button>
      <button className="clear" onClick={clear}>×</button>
    </div>
  );
}

function BaseModal({ title, subtitle, close, children, wide = false }) {
  return (
    <div className="modal-backdrop">
      <div className={`modal ${wide ? "modal-wide" : ""}`}>
        <div className="modal-head">
          <div><h2>{title}</h2>{subtitle && <p>{subtitle}</p>}</div>
          <button onClick={close}>×</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function LoginModal({ pin, setPin, close, login }) {
  return (
    <BaseModal title="เข้าสู่ระบบจัดการ" close={close}>
      <input className="pin" type="password" autoFocus maxLength={8} value={pin} onChange={(e) => setPin(e.target.value)} onKeyDown={(e) => e.key === "Enter" && login()} />
      <div className="modal-actions"><button onClick={close}>ยกเลิก</button><button className="btn blue" onClick={login}>เข้าสู่ระบบ</button></div>
    </BaseModal>
  );
}

function ConfirmModal({ title, text, confirmText, tone, close, confirm }) {
  return (
    <BaseModal title={title} close={close}>
      <p className="confirm-text">{text}</p>
      <div className="modal-actions"><button onClick={close}>ยกเลิก</button><button className={`btn ${tone === "danger" ? "red" : "blue"}`} onClick={confirm}>{confirmText}</button></div>
    </BaseModal>
  );
}

function ItemFormModal({ formData, setFormData, settingsOptions, save, close }) {
  return (
    <BaseModal title={formData.id ? "แก้ไขข้อมูล" : "เพิ่มอุปกรณ์ใหม่"} close={close} wide>
      <div className="form-grid">
        <label className="wide checkbox-row"><input type="checkbox" checked={formData.isPersonalItem} onChange={(e) => setFormData({ ...formData, isPersonalItem: e.target.checked, owner: e.target.checked ? formData.owner : "", newOwner: "" })} /> ระบุว่าเป็นของส่วนตัว</label>
        {formData.isPersonalItem && (
          <label className="wide">เจ้าของ
            <select value={formData.owner} onChange={(e) => setFormData({ ...formData, owner: e.target.value, newOwner: "" })}>
              <option value="">-- เลือกชื่อเจ้าของ --</option>
              {(settingsOptions.staff || []).map((s) => <option key={s}>{s}</option>)}
            </select>
          </label>
        )}
        {formData.isPersonalItem && formData.owner === "อื่นๆ" && (
          <label className="wide">ชื่อเจ้าของใหม่<input value={formData.newOwner} onChange={(e) => setFormData({ ...formData, newOwner: e.target.value })} /></label>
        )}
        <label className="wide">ชื่ออุปกรณ์ *<input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} /></label>
        <label>ฝ่ายที่รับผิดชอบ<select value={formData.department} onChange={(e) => setFormData({ ...formData, department: e.target.value })}>{DEPARTMENTS.map((d) => <option key={d.id} value={d.id}>{d.label}</option>)}</select></label>
        <label>จำนวน<input type="number" min="1" value={formData.quantity} onChange={(e) => setFormData({ ...formData, quantity: e.target.value })} /></label>
        <label>หมวดหมู่<select value={formData.category} onChange={(e) => setFormData({ ...formData, category: e.target.value, newCategory: "" })}><option value="">-- เลือกหมวดหมู่ --</option>{(settingsOptions.categories || []).map((x) => <option key={x}>{x}</option>)}</select></label>
        <label>รหัส S.N. *<input value={formData.sn} onChange={(e) => setFormData({ ...formData, sn: e.target.value })} /></label>
        {formData.category === "อื่นๆ" && <label className="wide">เพิ่มหมวดหมู่ใหม่<input value={formData.newCategory} onChange={(e) => setFormData({ ...formData, newCategory: e.target.value })} /></label>}
        <label className="wide">สถานที่จัดเก็บ<select value={formData.location} onChange={(e) => setFormData({ ...formData, location: e.target.value, newLocation: "" })}><option value="">-- เลือกสถานที่ --</option>{(settingsOptions.locations || []).map((x) => <option key={x}>{x}</option>)}</select></label>
        {formData.location === "อื่นๆ" && <label className="wide">เพิ่มสถานที่ใหม่<input value={formData.newLocation} onChange={(e) => setFormData({ ...formData, newLocation: e.target.value })} /></label>}
        <label className="wide">สถานะ<select value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value })}>{STATUSES.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></label>
      </div>
      <div className="modal-actions"><button onClick={close}>ยกเลิก</button><button className="btn blue" onClick={save}>บันทึกข้อมูล</button></div>
    </BaseModal>
  );
}

function Checklist({ items, checklist, setChecklist, tone = "purple" }) {
  const all = items.length > 0 && checklist.length === items.length;
  return (
    <div className="checklist">
      <div className="checklist-top">
        <b>เช็กรายการอุปกรณ์ ({checklist.length}/{items.length})</b>
        <button onClick={() => setChecklist(all ? [] : items.map((i) => i.id))}>{all ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}</button>
      </div>
      {items.map((item) => (
        <label key={item.id} className={`check-item ${tone}`}>
          <input type="checkbox" checked={checklist.includes(item.id)} onChange={(e) => setChecklist((cur) => e.target.checked ? [...cur, item.id] : cur.filter((id) => id !== item.id))} />
          <span><b>{item.name}</b><small>S.N.: {item.sn || "-"}</small></span>
        </label>
      ))}
    </div>
  );
}

function BorrowModal({ items, checklist, setChecklist, data, setData, staffOptions, close, confirm }) {
  const disabled = !data.staff || !data.borrower.trim() || !data.returnDate || !data.returnTime || checklist.length === 0;
  return (
    <BaseModal title="บันทึกการให้ยืม" subtitle="เลือกเจ้าหน้าที่ กำหนดคืน และตรวจรายการก่อนยืนยัน" close={close} wide>
      <div className="flow-grid">
        <Checklist items={items} checklist={checklist} setChecklist={setChecklist} tone="purple" />
        <div className="flow-form">
          <label>เจ้าหน้าที่ผู้ให้ยืม<select value={data.staff} onChange={(e) => setData({ ...data, staff: e.target.value })}><option value="">-- เลือกเจ้าหน้าที่ --</option>{(staffOptions || []).filter((s) => s !== "อื่นๆ").map((s) => <option key={s}>{s}</option>)}</select></label>
          <label>ชื่อผู้ยืม<input value={data.borrower} onChange={(e) => setData({ ...data, borrower: e.target.value })} /></label>
          <div className="two-cols"><label>กำหนดคืนวันที่<input type="date" value={data.returnDate} onChange={(e) => setData({ ...data, returnDate: e.target.value })} /></label><label>เวลา<input type="time" value={data.returnTime} onChange={(e) => setData({ ...data, returnTime: e.target.value })} /></label></div>
          <label>หมายเหตุก่อนยืม<textarea rows={4} value={data.note} onChange={(e) => setData({ ...data, note: e.target.value })} /></label>
          <div className="note-box">ระบบจะบันทึกวันเวลาที่ยืม, กำหนดคืน, เจ้าหน้าที่ผู้ให้ยืม และหมายเหตุลงประวัติ</div>
        </div>
      </div>
      <div className="modal-actions"><button onClick={close}>ยกเลิก</button><button className="btn purple" disabled={disabled} onClick={confirm}>ยืนยันการยืม</button></div>
    </BaseModal>
  );
}

function EventModal({ items, checklist, setChecklist, data, setData, staffOptions, close, confirm }) {
  const disabled = !data.staff || !data.eventName.trim() || !data.returnDate || !data.returnTime || checklist.length === 0;
  return (
    <BaseModal title="นำอุปกรณ์ออกงาน" subtitle="ตรวจของขึ้นงานและกำหนดวันเวลาคืน" close={close} wide>
      <div className="flow-grid">
        <Checklist items={items} checklist={checklist} setChecklist={setChecklist} tone="orange" />
        <div className="flow-form">
          <label>ผู้นำออก / ผู้รับผิดชอบ<select value={data.staff} onChange={(e) => setData({ ...data, staff: e.target.value })}><option value="">-- เลือกเจ้าหน้าที่ --</option>{(staffOptions || []).filter((s) => s !== "อื่นๆ").map((s) => <option key={s}>{s}</option>)}</select></label>
          <label>ชื่องาน<input value={data.eventName} onChange={(e) => setData({ ...data, eventName: e.target.value })} /></label>
          <div className="two-cols"><label>กำหนดคืนวันที่<input type="date" value={data.returnDate} onChange={(e) => setData({ ...data, returnDate: e.target.value })} /></label><label>เวลา<input type="time" value={data.returnTime} onChange={(e) => setData({ ...data, returnTime: e.target.value })} /></label></div>
          <label>สถานที่ / หมายเหตุ<textarea rows={4} value={data.note} onChange={(e) => setData({ ...data, note: e.target.value })} /></label>
          <div className="note-box orange">ระบบจะบันทึกวันเวลาออกงาน, กำหนดคืน และผู้รับผิดชอบลงประวัติ</div>
        </div>
      </div>
      <div className="modal-actions"><button onClick={close}>ยกเลิก</button><button className="btn orange" disabled={disabled} onClick={confirm}>ยืนยันการนำออกงาน</button></div>
    </BaseModal>
  );
}

function ReturnModal({ items, checklist, setChecklist, data, setData, staffOptions, close, confirm }) {
  const disabled = !data.staff || !data.condition || checklist.length === 0;
  return (
    <BaseModal title="บันทึกรับคืนอุปกรณ์" subtitle="ตรวจของกลับเข้าศูนย์และบันทึกสภาพหลังคืน" close={close} wide>
      <div className="flow-grid">
        <Checklist items={items} checklist={checklist} setChecklist={setChecklist} tone="green" />
        <div className="flow-form">
          <label>เจ้าหน้าที่ผู้รับคืน<select value={data.staff} onChange={(e) => setData({ ...data, staff: e.target.value })}><option value="">-- เลือกเจ้าหน้าที่ --</option>{(staffOptions || []).filter((s) => s !== "อื่นๆ").map((s) => <option key={s}>{s}</option>)}</select></label>
          <label>สภาพอุปกรณ์หลังคืน<select value={data.condition} onChange={(e) => setData({ ...data, condition: e.target.value })}><option>ปกติ</option><option>มีรอย / ต้องตรวจเพิ่ม</option><option>ชำรุด / ส่งซ่อม</option><option>คืนไม่ครบ</option></select></label>
          <label>หมายเหตุหลังคืน<textarea rows={4} value={data.note} onChange={(e) => setData({ ...data, note: e.target.value })} /></label>
          <div className="note-box green">ระบบจะบันทึกวันเวลาคืนจริง, ผู้รับคืน, สภาพหลังคืน และหมายเหตุลงประวัติ</div>
        </div>
      </div>
      <div className="modal-actions"><button onClick={close}>ยกเลิก</button><button className="btn green" disabled={disabled} onClick={confirm}>ยืนยันรับคืน</button></div>
    </BaseModal>
  );
}

function HistoryModal({ item, close }) {
  const history = item?.history || [];
  return (
    <BaseModal title="ประวัติการยืม-คืน" subtitle={item ? `${item.name} • S.N. ${item.sn || "-"}` : ""} close={close} wide>
      {history.length === 0 ? <div className="empty-box">ยังไม่มีประวัติการใช้งาน</div> : (
        <div className="history-list">
          {history.slice().reverse().map((h, i) => (
            <div key={i} className={`history-card ${h.type || ""}`}>
              <div><b>{h.type === "borrow" ? "ยืมอุปกรณ์" : h.type === "event" ? "ออกงาน" : "รับคืน"}</b><span>{toThaiDateTime(h.date)}</span></div>
              {h.borrower && <p><b>ผู้ยืม:</b> {h.borrower}</p>}
              {h.eventName && <p><b>ชื่องาน:</b> {h.eventName}</p>}
              {h.expectedReturn && <p><b>กำหนดคืน:</b> {toThaiDateTime(h.expectedReturn)}</p>}
              {h.staffOut && <p><b>เจ้าหน้าที่ผู้ให้ยืม/นำออก:</b> {h.staffOut}</p>}
              {h.staffIn && <p><b>เจ้าหน้าที่ผู้รับคืน:</b> {h.staffIn}</p>}
              {h.condition && <p><b>สภาพหลังคืน:</b> {h.condition}</p>}
              {h.note && <p><b>หมายเหตุ:</b> {h.note}</p>}
            </div>
          ))}
        </div>
      )}
    </BaseModal>
  );
}

function SettingsModal(props) {
  const {
    settingsTab,
    setSettingsTab,
    settingsOptions,
    newSettingItem,
    setNewSettingItem,
    editingSettingItem,
    setEditingSettingItem,
    deleteSetting,
    saveSetting,
    close,
    exportInventoryCSV,
    exportHistoryCSV,
    clearHistoryOnly,
    fileInputRef,
    handleImportCSV,
  } = props;
  const tabs = [
    ["categories", "หมวดหมู่"],
    ["locations", "สถานที่"],
    ["staff", "เจ้าหน้าที่"],
    ["database", "ฐานข้อมูล"],
  ];
  return (
    <BaseModal title="ตั้งค่าระบบ" close={close} wide>
      <div className="settings-tabs">
        {tabs.map(([key, label]) => <button key={key} className={settingsTab === key ? "active" : ""} onClick={() => { setSettingsTab(key); setEditingSettingItem(null); setNewSettingItem(""); }}>{label}</button>)}
      </div>
      {settingsTab === "database" ? (
        <div className="settings-stack">
          <div className="settings-card">
            <h3>สำรองรายการอุปกรณ์ปัจจุบัน</h3>
            <p>ดาวน์โหลดข้อมูลอุปกรณ์ทั้งหมดออกมาเป็น CSV</p>
            <button className="btn green full" onClick={exportInventoryCSV}>⬇️ ดาวน์โหลดรายการอุปกรณ์ CSV</button>
          </div>
          <div className="settings-card highlight">
            <h3>สำรองประวัติยืม-คืนรายปี</h3>
            <p>ไฟล์นี้จะมีวันเวลาที่ยืม, กำหนดคืน, เวลาคืนจริง, เจ้าหน้าที่ และหมายเหตุ</p>
            <button className="btn green full" onClick={exportHistoryCSV}>⬇️ ดาวน์โหลดประวัติยืม-คืน CSV</button>
            <button className="btn red full" onClick={clearHistoryOnly}>ล้างเฉพาะประวัติยืม-คืนหลังสำรองแล้ว</button>
            <small>ไม่ลบรายการอุปกรณ์หลัก ไม่ลบสถานะปัจจุบัน ไม่ลบหมวดหมู่/สถานที่/เจ้าของ</small>
          </div>
          <div className="settings-card">
            <h3>นำเข้าข้อมูล CSV</h3>
            <p>Format: ชื่อ, S.N., หมวดหมู่, ฝ่าย, สถานที่, จำนวน</p>
            <input ref={fileInputRef} type="file" accept=".csv" hidden onChange={handleImportCSV} />
            <button className="btn blue full" onClick={() => fileInputRef.current?.click()}>⬆️ เลือกไฟล์ CSV</button>
          </div>
        </div>
      ) : (
        <div className="settings-stack">
          <div className="setting-input-row">
            <input value={newSettingItem} onChange={(e) => setNewSettingItem(e.target.value)} placeholder="พิมพ์รายการใหม่" />
            <button className="btn blue" onClick={saveSetting}>{editingSettingItem ? "บันทึก" : "เพิ่ม"}</button>
            {editingSettingItem && <button onClick={() => { setEditingSettingItem(null); setNewSettingItem(""); }}>ยกเลิก</button>}
          </div>
          {(settingsOptions[settingsTab] || []).filter((x) => x !== "อื่นๆ").map((item) => (
            <div key={item} className="setting-row"><b>{item}</b><div><button onClick={() => { setEditingSettingItem(item); setNewSettingItem(item); }}>แก้</button><button className="red-text" onClick={() => deleteSetting(item)}>ลบ</button></div></div>
          ))}
        </div>
      )}
    </BaseModal>
  );
}

function AuditModal({ logs, close }) {
  return (
    <BaseModal title="ประวัติการทำงานส่วนกลาง" close={close} wide>
      {logs.length === 0 ? <div className="empty-box">ยังไม่มีประวัติการทำงาน</div> : <div className="audit-list">{logs.map((log) => <div className="audit-card" key={log.id}><div><b>{log.action}</b><span>{toThaiDateTime(log.timestamp)}</span></div><h3>{log.target}</h3><p>{log.details}</p></div>)}</div>}
    </BaseModal>
  );
}

function ScanModal({ scanInput, setScanInput, scanMessage, inputRef, submit, close }) {
  return (
    <BaseModal title="โหมดสแกนเข้าตะกร้า" subtitle="ใช้เครื่องยิงบาร์โค้ด หรือพิมพ์ S.N. / ID" close={close}>
      <form onSubmit={submit} className="scan-form"><input ref={inputRef} autoFocus value={scanInput} onChange={(e) => setScanInput(e.target.value)} placeholder="สแกน หรือ พิมพ์ที่นี่" />{scanMessage && <div className="note-box">{scanMessage}</div>}</form>
    </BaseModal>
  );
}

function BundleManagerModal({ items, settingsOptions, bundleForm, setBundleForm, bundleSearchTerm, setBundleSearchTerm, save, deleteBundle, close }) {
  const filtered = items.filter((item) => `${item.name} ${item.sn}`.toLowerCase().includes(bundleSearchTerm.toLowerCase()));
  return (
    <BaseModal title="สร้างและจัดการเซ็ตอุปกรณ์" close={close} wide>
      <div className="bundle-layout">
        <div className="bundle-list">
          <h3>เซ็ตที่มีในระบบ</h3>
          {(settingsOptions.bundles || []).map((b) => <button key={b.id} onClick={() => setBundleForm({ id: b.id, name: b.name, itemIds: b.itemIds || [] })}><b>{b.name}</b><span>{(b.itemIds || []).length} ชิ้น</span><em onClick={(e) => { e.stopPropagation(); deleteBundle(b.id); }}>ลบ</em></button>)}
        </div>
        <div className="bundle-edit">
          <label>ชื่อเซ็ต<input value={bundleForm.name} onChange={(e) => setBundleForm({ ...bundleForm, name: e.target.value })} /></label>
          <input value={bundleSearchTerm} onChange={(e) => setBundleSearchTerm(e.target.value)} placeholder="ค้นหาอุปกรณ์" />
          <div className="bundle-items">{filtered.map((item) => <label key={item.id}><input type="checkbox" checked={bundleForm.itemIds.includes(item.id)} onChange={(e) => setBundleForm({ ...bundleForm, itemIds: e.target.checked ? [...bundleForm.itemIds, item.id] : bundleForm.itemIds.filter((id) => id !== item.id) })} /> {item.name} <small>{item.sn}</small></label>)}</div>
          <button className="btn fuchsia full" onClick={save}>บันทึกเซ็ต</button>
        </div>
      </div>
    </BaseModal>
  );
}

function BundlePickerModal({ items, bundles, selectBundle, close }) {
  return (
    <BaseModal title="ใช้งานเซ็ตอุปกรณ์" close={close} wide>
      {bundles.length === 0 ? <div className="empty-box">ยังไม่มีเซ็ตอุปกรณ์</div> : bundles.map((bundle) => {
        const total = (bundle.itemIds || []).length;
        const available = (bundle.itemIds || []).filter((id) => items.find((i) => i.id === id)?.status === "available").length;
        const out = (bundle.itemIds || []).filter((id) => ["borrowed", "out-for-event"].includes(items.find((i) => i.id === id)?.status)).length;
        return <div key={bundle.id} className="bundle-card"><div><b>{bundle.name}</b><span>พร้อมใช้ {available}/{total} • รอรับคืน {out}/{total}</span></div><button onClick={() => selectBundle(bundle, "borrow")}>ยืมเซ็ต</button><button onClick={() => selectBundle(bundle, "event")}>ออกงาน</button><button onClick={() => selectBundle(bundle, "return")}>รับคืน</button></div>;
      })}
    </BaseModal>
  );
}

function QuickReturnModal({ groups, items, todayStart, close, startReturn }) {
  return (
    <BaseModal title="ติดตามสถานะ & รับคืน" subtitle="รวมตามผู้ยืมหรือชื่องาน" close={close} wide>
      {groups.length === 0 ? <div className="empty-box">ไม่มีอุปกรณ์รอรับคืน</div> : groups.map((g, idx) => <div key={idx} className="quick-group"><h3>{g.type === "event" ? "ออกงาน" : "ผู้ยืม"}: {g.name}</h3><div>{g.ids.map((id) => { const item = items.find((i) => i.id === id); const late = item?.expectedReturn && new Date(item.expectedReturn).getTime() < todayStart; return item ? <p key={id}>{item.name} {late && <b className="late-text">เลยกำหนด</b>}</p> : null; })}</div><button className="btn green" onClick={() => startReturn(g.ids)}>รับคืนกลุ่มนี้</button></div>)}
    </BaseModal>
  );
}

function PersonalItemsModal({ items, close }) {
  const groups = {};
  items.forEach((item) => { if (item.owner) { if (!groups[item.owner]) groups[item.owner] = []; groups[item.owner].push(item); } });
  const owners = Object.keys(groups).sort();
  return (
    <BaseModal title="รายการทรัพย์สินส่วนตัว" close={close} wide>
      {owners.length === 0 ? <div className="empty-box">ยังไม่มีของส่วนตัวในระบบ</div> : owners.map((owner) => <div className="personal-group" key={owner}><h3>{owner}</h3>{groups[owner].map((item) => <p key={item.id}>{item.name} • {statusInfo(item.status).label}</p>)}</div>)}
    </BaseModal>
  );
}

function DashboardView({ stats, overdueItems, auditLogs, close, isDarkMode, setIsDarkMode }) {
  const health = stats.all ? Math.round((stats.available / stats.all) * 100) : 0;
  return (
    <div className="dashboard-view">
      <style>{styles}</style>
      <div className="dashboard-head"><h1>ศูนย์ควบคุม MDEC</h1><div><button onClick={() => setIsDarkMode(!isDarkMode)}>{isDarkMode ? "โหมดสว่าง" : "โหมดมืด"}</button><button onClick={close}>ปิด</button></div></div>
      <div className="dashboard-grid"><div className="dash-card total"><span>อุปกรณ์ทั้งหมด</span><b>{stats.all}</b></div><div className="dash-card"><span>สุขภาพสต๊อก</span><b>{health}%</b></div><div className="dash-card"><span>เลยกำหนดคืน</span><b>{overdueItems.length}</b></div></div>
      <div className="dashboard-grid two"><div className="dash-card"><h2>รายการเลยกำหนด</h2>{overdueItems.length === 0 ? <p>ไม่มีรายการเลยกำหนด</p> : overdueItems.map((i) => <p key={i.id}>{i.name} • {i.currentBorrower || i.currentEvent}</p>)}</div><div className="dash-card"><h2>ประวัติล่าสุด</h2>{auditLogs.slice(0, 10).map((l) => <p key={l.id}>{l.action} • {l.target}</p>)}</div></div>
    </div>
  );
}

function PrintView({ items, selectedItems, close }) {
  const selected = selectedItems.map((id) => items.find((item) => item.id === id)).filter(Boolean);
  return (
    <div className="print-view">
      <style>{styles}</style>
      <div className="print-bar"><b>โหมดพิมพ์ QR Code ({selected.length} ดวง)</b><div><button onClick={() => window.print()}>พิมพ์</button><button onClick={close}>ปิด</button></div></div>
      <div className="qr-grid">{selected.map((item) => <div className="qr-card" key={item.id}><img alt="QR" src={`https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(item.id)}`} /><b>{item.name}</b><span>{item.sn}</span></div>)}</div>
    </div>
  );
}

const styles = `
:root{font-family:ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif}.app{min-height:100vh;background:#f1f5f9;color:#0f172a}.app.dark{background:#0f172a;color:#f8fafc}.page{max-width:1500px;margin:auto;padding:28px 24px 130px}.card{background:#fff;border:1px solid #e2e8f0;border-radius:24px;box-shadow:0 12px 30px rgba(15,23,42,.07)}.dark .card{background:#1e293b;border-color:#334155}button,input,select,textarea{font:inherit}button{cursor:pointer}input,select,textarea{border:1px solid #cbd5e1;border-radius:14px;padding:12px 14px;background:#fff;color:#0f172a;font-weight:700;outline:none}.dark input,.dark select,.dark textarea{background:#0f172a;color:#f8fafc;border-color:#475569}textarea{resize:vertical}.header{display:flex;gap:18px;align-items:center;justify-content:space-between;padding:22px;margin-bottom:24px}.brand{display:flex;gap:14px;align-items:center}.brand-icon{width:56px;height:56px;background:#2563eb;color:#fff;border-radius:18px;display:grid;place-items:center;font-size:30px}.brand h1{margin:0;font-size:32px;font-weight:950}.brand h1 span{font-size:12px;background:#dbeafe;color:#1d4ed8;padding:5px 8px;border-radius:8px;vertical-align:middle}.brand p{margin:4px 0 0;color:#64748b;font-weight:700}.header-actions{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.btn{border:0;border-radius:14px;padding:11px 14px;font-weight:950;color:#fff}.btn:disabled{opacity:.5;cursor:not-allowed}.btn.blue{background:#2563eb}.btn.green{background:#059669}.btn.purple{background:#7c3aed}.btn.orange{background:#ea580c}.btn.red{background:#e11d48}.btn.amber{background:#f59e0b}.btn.fuchsia{background:#c026d3}.btn.pink{background:#db2777}.btn.indigo{background:#4f46e5}.btn.dark{background:#0f172a}.btn.ghost{background:#f8fafc;color:#334155;border:1px solid #cbd5e1}.btn.danger-soft{background:#fff1f2;color:#be123c;border:1px solid #fecdd3}.btn.full{width:100%}.mobile-add{display:none}.alert{padding:16px 18px;border-radius:18px;margin-bottom:18px;display:grid;gap:4px}.alert-danger{background:#fff1f2;border-left:5px solid #e11d48;color:#9f1239}.stats-grid{display:grid;grid-template-columns:repeat(6,1fr);gap:14px;margin-bottom:22px}.stat-card{padding:18px;text-align:center;border-top:4px solid #3b82f6}.stat-card span{display:block;color:#64748b;font-weight:800}.stat-card b{font-size:42px;line-height:1;font-weight:950}.text-blue{color:#2563eb}.text-green{color:#059669}.text-amber{color:#f59e0b}.text-purple{color:#7c3aed}.text-orange{color:#ea580c}.text-red{color:#e11d48}.border-blue{border-top-color:#2563eb}.border-green{border-top-color:#059669}.border-amber{border-top-color:#f59e0b}.border-purple{border-top-color:#7c3aed}.border-orange{border-top-color:#ea580c}.border-red{border-top-color:#e11d48}.filter-panel{padding:18px;margin-bottom:22px}.filter-row{display:grid;grid-template-columns:2fr repeat(4,1fr) auto;gap:10px;margin-bottom:12px}.search{width:100%}.dept-tabs{display:flex;gap:8px;overflow:auto;padding-bottom:4px}.dept-tabs button{border:1px solid #cbd5e1;background:#f8fafc;color:#334155;border-radius:14px;padding:12px 16px;font-weight:950;white-space:nowrap}.dept-tabs button.active{background:#0f172a;color:#fff;border-color:#0f172a}.dark .dept-tabs button{background:#0f172a;color:#cbd5e1;border-color:#475569}.dark .dept-tabs button.active{background:#2563eb;color:#fff}.table-card{overflow:hidden}.table-wrap{overflow:auto}table{width:100%;border-collapse:collapse;min-width:1050px}th{background:#e2e8f0;color:#334155;text-align:left;padding:14px;font-weight:950}td{border-top:1px solid #e2e8f0;padding:14px;vertical-align:middle}.dark th{background:#334155;color:#f8fafc}.dark td{border-color:#334155}.center{text-align:center}.empty{padding:40px;text-align:center;color:#64748b}.item-name{display:flex;gap:8px;align-items:center;flex-wrap:wrap}.item-name b{font-size:18px}.item-name small,td small{display:block;color:#64748b;font-weight:700;margin-top:3px}.qty,.owner,.late{font-size:12px;font-weight:950;border-radius:8px;padding:4px 7px}.qty{background:#dbeafe;color:#1d4ed8}.owner{background:#fdf4ff;color:#a21caf}.late{background:#e11d48;color:#fff}.overdue{background:#fff1f2}.dark .overdue{background:rgba(225,29,72,.15)}.current{display:inline-block;margin-top:8px;padding:8px 10px;border-radius:12px;font-size:13px;font-weight:850}.current em{display:block;margin-top:4px}.current-purple{background:#f5f3ff;color:#6d28d9}.current-orange{background:#fff7ed;color:#c2410c}.badge,.status{display:inline-flex;gap:6px;align-items:center;border-radius:12px;padding:7px 10px;font-size:13px;font-weight:950;border:1px solid transparent}.badge-blue{background:#dbeafe;color:#1d4ed8}.badge-indigo{background:#e0e7ff;color:#4338ca}.badge-cyan{background:#cffafe;color:#0e7490}.badge-sky{background:#e0f2fe;color:#0369a1}.badge-violet{background:#ede9fe;color:#6d28d9}.status-green{background:#ecfdf5;color:#047857;border-color:#a7f3d0}.status-amber{background:#fffbeb;color:#b45309;border-color:#fde68a}.status-purple{background:#f5f3ff;color:#6d28d9;border-color:#ddd6fe}.status-orange{background:#fff7ed;color:#c2410c;border-color:#fed7aa}.status-red{background:#fff1f2;color:#be123c;border-color:#fecdd3}.row-actions{display:flex;gap:6px;justify-content:center;flex-wrap:wrap}.icon-btn{border:0;border-radius:10px;background:#f1f5f9;color:#334155;padding:8px 10px;font-size:13px;font-weight:950}.icon-btn.blue{background:#dbeafe;color:#1d4ed8}.icon-btn.green{background:#dcfce7;color:#15803d}.icon-btn.purple{background:#ede9fe;color:#6d28d9}.icon-btn.orange{background:#ffedd5;color:#c2410c}.icon-btn.red{background:#ffe4e6;color:#be123c}.disabled-box{display:inline-block;width:18px;height:18px;background:#cbd5e1;border-radius:4px}.action-bar{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:40;background:rgba(255,255,255,.95);backdrop-filter:blur(14px);border:1px solid #e2e8f0;border-radius:24px;box-shadow:0 18px 60px rgba(15,23,42,.22);padding:12px;display:flex;gap:8px;align-items:center}.action-bar b{background:#4f46e5;color:#fff;border-radius:999px;width:36px;height:36px;display:grid;place-items:center}.action-bar span{font-weight:950;margin-right:8px}.action-bar button{border:0;border-radius:14px;background:#334155;color:#fff;padding:10px 12px;font-weight:950}.action-bar button.clear{background:#f1f5f9;color:#334155}.modal-backdrop{position:fixed;inset:0;background:rgba(15,23,42,.55);display:flex;align-items:center;justify-content:center;padding:16px;z-index:100;backdrop-filter:blur(8px)}.modal{width:min(560px,100%);max-height:90vh;overflow:auto;background:#fff;color:#0f172a;border-radius:28px;padding:22px;box-shadow:0 24px 80px rgba(0,0,0,.35)}.dark .modal{background:#1e293b;color:#f8fafc}.modal-wide{width:min(920px,100%)}.modal-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;margin-bottom:18px}.modal-head h2{margin:0;font-size:26px;font-weight:950}.modal-head p{margin:5px 0 0;color:#64748b;font-weight:750}.modal-head button{border:0;background:#f1f5f9;color:#334155;border-radius:14px;width:40px;height:40px;font-size:24px}.modal-actions{display:flex;gap:10px;justify-content:flex-end;margin-top:18px}.modal-actions button:not(.btn){border:0;border-radius:14px;padding:12px 16px;font-weight:950;background:#f1f5f9;color:#334155}.pin{text-align:center;font-size:32px;letter-spacing:8px;width:100%}.confirm-text{font-size:17px;font-weight:800;color:#475569}.form-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px}.form-grid label,.flow-form label{display:grid;gap:6px;font-weight:950;color:#334155}.dark .form-grid label,.dark .flow-form label{color:#cbd5e1}.form-grid .wide{grid-column:1/-1}.checkbox-row{display:flex!important;align-items:center;gap:8px}.two-cols{display:grid;grid-template-columns:1fr 1fr;gap:10px}.flow-grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.flow-form{display:grid;gap:12px}.checklist{border:1px solid #e2e8f0;border-radius:22px;background:#f8fafc;padding:14px}.dark .checklist{background:#0f172a;border-color:#334155}.checklist-top{display:flex;justify-content:space-between;gap:10px;align-items:center;margin-bottom:10px}.checklist-top b{font-weight:950}.checklist-top button{border:1px solid #cbd5e1;background:#fff;border-radius:12px;padding:8px 10px;font-weight:950}.check-item{display:flex;gap:10px;align-items:flex-start;background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:12px;margin-top:8px}.dark .check-item{background:#1e293b;border-color:#334155}.check-item input{margin-top:4px}.check-item span b{display:block}.check-item span small{display:block;color:#64748b;margin-top:3px}.note-box{border:1px solid #bfdbfe;background:#eff6ff;color:#1d4ed8;border-radius:16px;padding:12px 14px;font-weight:850}.note-box.green{border-color:#a7f3d0;background:#ecfdf5;color:#047857}.note-box.orange{border-color:#fed7aa;background:#fff7ed;color:#c2410c}.history-list,.audit-list,.settings-stack{display:grid;gap:12px}.history-card,.audit-card,.settings-card,.quick-group,.personal-group,.bundle-card{border:1px solid #e2e8f0;background:#f8fafc;border-radius:18px;padding:14px}.dark .history-card,.dark .audit-card,.dark .settings-card,.dark .quick-group,.dark .personal-group,.dark .bundle-card{background:#0f172a;border-color:#334155}.history-card>div,.audit-card>div{display:flex;justify-content:space-between;gap:10px}.history-card span,.audit-card span{color:#64748b;font-weight:800}.history-card p,.audit-card p{margin:7px 0 0}.empty-box{padding:32px;text-align:center;color:#64748b;background:#f8fafc;border-radius:18px;font-weight:900}.settings-tabs{display:flex;gap:8px;overflow:auto;margin-bottom:14px}.settings-tabs button{border:0;border-bottom:3px solid transparent;background:#f8fafc;border-radius:12px;padding:12px 14px;font-weight:950;color:#64748b}.settings-tabs button.active{color:#2563eb;border-color:#2563eb;background:#eff6ff}.setting-input-row{display:flex;gap:8px}.setting-input-row input{flex:1}.setting-row{display:flex;justify-content:space-between;align-items:center;border:1px solid #e2e8f0;border-radius:16px;padding:12px 14px}.setting-row button{margin-left:6px;border:0;border-radius:10px;background:#f1f5f9;padding:8px 10px;font-weight:950}.red-text{color:#be123c!important}.settings-card h3{margin:0 0 6px}.settings-card p,.settings-card small{color:#64748b;font-weight:750}.settings-card.highlight{border-left:5px solid #059669}.scan-form{display:grid;gap:12px}.bundle-layout{display:grid;grid-template-columns:300px 1fr;gap:16px}.bundle-list,.bundle-edit{display:grid;gap:10px;align-content:start}.bundle-list button{text-align:left;border:1px solid #e2e8f0;background:#f8fafc;border-radius:14px;padding:12px;display:grid;gap:4px}.bundle-list span{color:#64748b}.bundle-list em{color:#be123c;font-style:normal;font-weight:950}.bundle-items{max-height:360px;overflow:auto;display:grid;gap:8px}.bundle-items label{border:1px solid #e2e8f0;border-radius:12px;padding:10px}.bundle-card{display:grid;grid-template-columns:1fr auto auto auto;gap:8px;align-items:center;margin-bottom:10px}.bundle-card b{display:block}.bundle-card span{color:#64748b}.bundle-card button{border:0;border-radius:12px;background:#2563eb;color:#fff;padding:10px;font-weight:950}.quick-group{margin-bottom:10px}.quick-group h3{margin:0 0 8px}.quick-group p{margin:4px 0}.late-text{color:#e11d48}.print-view{min-height:100vh;background:#fff;color:#000}.print-bar{position:sticky;top:0;background:#0f172a;color:#fff;padding:14px 20px;display:flex;justify-content:space-between;align-items:center}.print-bar button{margin-left:8px;border:0;border-radius:10px;padding:10px 12px;font-weight:950}.qr-grid{display:grid;grid-template-columns:repeat(5,1fr);gap:14px;padding:20px}.qr-card{border:1px dashed #94a3b8;border-radius:14px;padding:12px;text-align:center;break-inside:avoid}.qr-card img{width:120px;height:120px}.qr-card b,.qr-card span{display:block}.dashboard-view{position:fixed;inset:0;z-index:200;background:#0f172a;color:#fff;padding:28px;overflow:auto}.dashboard-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:18px}.dashboard-head button{margin-left:8px;border:0;border-radius:12px;padding:12px 14px;font-weight:950}.dashboard-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:16px;margin-bottom:16px}.dashboard-grid.two{grid-template-columns:1fr 1fr}.dash-card{background:#1e293b;border:1px solid #334155;border-radius:24px;padding:22px}.dash-card.total{background:linear-gradient(135deg,#2563eb,#4f46e5)}.dash-card span{display:block;color:#cbd5e1;font-weight:800}.dash-card b{font-size:64px}.dash-card p{color:#cbd5e1;font-weight:750}@media(max-width:1100px){.stats-grid{grid-template-columns:repeat(3,1fr)}.filter-row{grid-template-columns:1fr 1fr}.flow-grid,.bundle-layout{grid-template-columns:1fr}.header{align-items:flex-start;flex-direction:column}.header-actions{justify-content:flex-start}.mobile-add{display:inline-block}}@media(max-width:720px){.page{padding:14px 12px 150px}.brand h1{font-size:24px}.stats-grid{grid-template-columns:repeat(2,1fr)}.stat-card b{font-size:34px}.filter-row{grid-template-columns:1fr}.modal-backdrop{align-items:flex-end;padding:8px}.modal{border-radius:24px 24px 16px 16px;padding:18px}.form-grid,.two-cols,.flow-grid{grid-template-columns:1fr}.action-bar{width:calc(100% - 20px);bottom:10px;display:grid;grid-template-columns:40px 1fr 1fr 1fr;gap:6px}.action-bar span{display:none}.action-bar button{font-size:12px;padding:9px}.qr-grid{grid-template-columns:repeat(2,1fr)}.dashboard-grid,.dashboard-grid.two{grid-template-columns:1fr}}
@media print{.print-bar{display:none}.qr-grid{grid-template-columns:repeat(5,1fr);padding:0}.qr-card{border:1px solid #000;border-radius:0}}
`;
