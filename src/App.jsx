import React, { useMemo, useState } from "react";

// MDEC Stock Lite Preview
// Stable Canvas version
// - No external icon library
// - No Firebase
// - No Tailwind dependency for layout/color
// - Responsive desktop/mobile preview
// - All visible action buttons show feedback or demo modal

const ITEMS = [
  {
    id: "MDEC-CAM-001",
    name: "Sony A7 IV",
    sn: "CAM-A7IV-001",
    category: "กล้อง",
    department: "ภาพนิ่ง",
    location: "ตู้กล้อง A1",
    status: "available",
    owner: "",
  },
  {
    id: "MDEC-LEN-004",
    name: "Sony FE 24-70mm F2.8 GM",
    sn: "LEN-2470-004",
    category: "เลนส์",
    department: "ภาพนิ่ง",
    location: "ตู้เลนส์ A2",
    status: "borrowed",
    borrower: "งานประชาสัมพันธ์",
    due: "30 เม.ย. 2569",
    owner: "",
  },
  {
    id: "MDEC-MIC-003",
    name: "Wireless Microphone Set",
    sn: "MIC-WL-003",
    category: "ไมโครโฟน",
    department: "เครื่องเสียง",
    location: "ห้องเก็บเสียง",
    status: "event",
    borrower: "โครงการอบรม NotebookLM",
    due: "29 เม.ย. 2569",
    owner: "",
  },
  {
    id: "MDEC-TRI-002",
    name: "Manfrotto Tripod",
    sn: "TRI-MAN-002",
    category: "ขาตั้ง",
    department: "วิดีโอ",
    location: "ตู้วิดีโอ B1",
    status: "maintenance",
    owner: "",
  },
  {
    id: "MDEC-LGT-006",
    name: "LED Panel Light 60W",
    sn: "LGT-LED-006",
    category: "ไฟสตูดิโอ",
    department: "วิดีโอ",
    location: "ชั้นวางไฟ",
    status: "available",
    owner: "",
  },
  {
    id: "MDEC-OWN-001",
    name: "SSD Portable 1TB",
    sn: "SSD-PER-001",
    category: "อุปกรณ์บันทึกข้อมูล",
    department: "ภาพนิ่ง",
    location: "ลิ้นชักทีมภาพนิ่ง",
    status: "available",
    owner: "ครูศิริชัย",
  },
];

const HISTORY_BY_ITEM_ID = {
  "MDEC-CAM-001": [
    {
      type: "borrow",
      borrower: "งานถ่ายภาพกิจกรรมรับสมัคร",
      staffOut: "ครูศิริชัย",
      borrowAt: "2569-04-22 09:15",
      expectedReturn: "2569-04-22 16:30",
      returnedAt: "2569-04-22 16:10",
      staffIn: "เจ้าหน้าที่ MDEC 1",
      condition: "ปกติ",
      note: "ใช้งานเรียบร้อย ไม่มีปัญหา",
    },
    {
      type: "event",
      borrower: "งานประชุมใหญ่ประจำเดือน",
      staffOut: "ทีมภาพนิ่ง",
      borrowAt: "2569-04-05 08:30",
      expectedReturn: "2569-04-05 12:00",
      returnedAt: "2569-04-05 11:45",
      staffIn: "ครูศิริชัย",
      condition: "ปกติ",
      note: "คืนครบพร้อมแบตเตอรี่",
    },
  ],
  "MDEC-LEN-004": [
    {
      type: "borrow",
      borrower: "งานประชาสัมพันธ์",
      staffOut: "เจ้าหน้าที่ MDEC 2",
      borrowAt: "2569-04-29 13:20",
      expectedReturn: "2569-04-30 15:00",
      returnedAt: "",
      staffIn: "",
      condition: "ยังไม่คืน",
      note: "ยืมพร้อมกล้อง Sony A7 IV",
    },
  ],
};

const STAFF = ["ครูศิริชัย", "เจ้าหน้าที่ MDEC 1", "เจ้าหน้าที่ MDEC 2", "ทีมภาพนิ่ง", "ทีมวิดีโอ", "ทีมเครื่องเสียง"];

const DEPARTMENTS = [
  { value: "all", label: "ทั้งหมด", icon: "📦" },
  { value: "ภาพนิ่ง", label: "ภาพนิ่ง", icon: "📷" },
  { value: "วิดีโอ", label: "วิดีโอ", icon: "🎥" },
  { value: "เครื่องเสียง", label: "เครื่องเสียง", icon: "🔊" },
  { value: "ห้องประชุม", label: "ห้องประชุม", icon: "👥" },
];

const STATUS = {
  available: { label: "พร้อมใช้", icon: "✅", tone: "green" },
  borrowed: { label: "ถูกยืม", icon: "🕘", tone: "purple" },
  event: { label: "ออกงาน", icon: "🚚", tone: "orange" },
  maintenance: { label: "ส่งซ่อม", icon: "🛠️", tone: "red" },
};

const TOOL_ITEMS = [
  { id: "year", label: "สำรองประวัติยืม-คืน", desc: "Export และล้างประวัติรายปี", icon: "🎓", panel: "สำรอง/ล้างประวัติยืม-คืน" },
  { id: "bundle", label: "จัดการเซ็ต", desc: "รวมอุปกรณ์ที่ใช้บ่อย", icon: "🧩", panel: "จัดการเซ็ต" },
  { id: "dashboard", label: "ภาพรวมวันนี้", desc: "ดู Dashboard แบบเต็ม", icon: "📊", panel: "ภาพรวมวันนี้" },
  { id: "history", label: "ประวัติการทำงาน", desc: "ดูรายการล่าสุด", icon: "🕘", panel: "ประวัติการทำงาน" },
  { id: "export", label: "สำรองข้อมูล CSV", desc: "ดาวน์โหลดข้อมูลเก็บไว้", icon: "⬇️", panel: "สำรองข้อมูล CSV" },
  { id: "import", label: "นำเข้า CSV", desc: "เพิ่มข้อมูลหลายรายการ", icon: "⬆️", panel: "นำเข้า CSV" },
  { id: "settings", label: "ตั้งค่าระบบ", desc: "หมวดหมู่ สถานที่ เจ้าหน้าที่", icon: "⚙️", panel: "ตั้งค่าระบบ" },
];

const initialFilters = {
  status: "all",
  category: "all",
  location: "all",
  ownership: "all",
};

function getCounts(items) {
  return {
    all: items.length,
    available: items.filter((item) => item.status === "available").length,
    borrowed: items.filter((item) => item.status === "borrowed").length,
    event: items.filter((item) => item.status === "event").length,
    maintenance: items.filter((item) => item.status === "maintenance").length,
  };
}

function filterItems(items, department, query, filters) {
  const q = String(query || "").trim().toLowerCase();

  return items.filter((item) => {
    const matchDepartment = department === "all" || item.department === department;
    const matchText =
      q === "" ||
      item.name.toLowerCase().includes(q) ||
      item.sn.toLowerCase().includes(q) ||
      item.id.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q) ||
      item.department.toLowerCase().includes(q) ||
      item.location.toLowerCase().includes(q) ||
      String(item.owner || "").toLowerCase().includes(q) ||
      String(item.borrower || "").toLowerCase().includes(q);

    const matchStatus = filters.status === "all" || item.status === filters.status;
    const matchCategory = filters.category === "all" || item.category === filters.category;
    const matchLocation = filters.location === "all" || item.location === filters.location;
    const matchOwnership =
      filters.ownership === "all" ||
      (filters.ownership === "personal" && Boolean(item.owner)) ||
      (filters.ownership === "center" && !item.owner);

    return matchDepartment && matchText && matchStatus && matchCategory && matchLocation && matchOwnership;
  });
}

function runPreviewTests() {
  console.assert(Array.isArray(ITEMS), "ITEMS should be an array");
  console.assert(ITEMS.length === 6, "Preview should have 6 demo items");
  console.assert(getCounts(ITEMS).available === 3, "Available count should be 3");
  console.assert(filterItems(ITEMS, "ภาพนิ่ง", "", initialFilters).length === 3, "Photo department should have 3 items");
  console.assert(filterItems(ITEMS, "all", "sony", initialFilters).length === 2, "Search 'sony' should return 2 items");
  console.assert(filterItems(ITEMS, "all", "", { ...initialFilters, status: "available" }).length === 3, "Available filter should return 3 items");
  console.assert(filterItems(ITEMS, "all", "", { ...initialFilters, ownership: "personal" }).length === 1, "Personal filter should return 1 item");
  console.assert(ITEMS.filter((item) => item.status === "available").length === 3, "There should be 3 selectable available items in preview");
  console.assert(ITEMS.filter((item) => item.status === "borrowed" || item.status === "event").length === 2, "There should be 2 returnable items in preview");
  console.assert(STAFF.length >= 3, "Borrow/return flow should have staff options");
  console.assert(TOOL_ITEMS.some((tool) => tool.panel === "สำรอง/ล้างประวัติยืม-คืน"), "Borrow-return history backup tool should exist");
  console.assert(HISTORY_BY_ITEM_ID["MDEC-CAM-001"][0].borrowAt && HISTORY_BY_ITEM_ID["MDEC-CAM-001"][0].returnedAt, "History should keep borrow and return date/time");
}

runPreviewTests();

export default function MdecStockLitePreview() {
  const [dark, setDark] = useState(false);
  const [department, setDepartment] = useState("all");
  const [query, setQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState(initialFilters);
  const [compact, setCompact] = useState(true);
  const [toolsOpen, setToolsOpen] = useState(false);
  const [panel, setPanel] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(STAFF[0]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [toast, setToast] = useState("พร้อมพรีวิว — ยังไม่ได้เชื่อมฐานข้อมูลจริง");

  const counts = useMemo(() => getCounts(ITEMS), []);
  const categories = useMemo(() => Array.from(new Set(ITEMS.map((item) => item.category))), []);
  const locations = useMemo(() => Array.from(new Set(ITEMS.map((item) => item.location))), []);
  const filteredItems = useMemo(() => filterItems(ITEMS, department, query, filters), [department, query, filters]);
  const selectedItems = useMemo(() => ITEMS.filter((item) => selectedIds.includes(item.id)), [selectedIds]);
  const activeFilterCount = Object.values(filters).filter((value) => value !== "all").length + (department !== "all" ? 1 : 0) + (query.trim() ? 1 : 0);

  const openPanel = (name) => {
    setPanel(name);
    setToolsOpen(false);
    setSelectedStaff(STAFF[0]);
    setToast(`เปิดตัวอย่าง: ${name} — พรีวิวนี้ยังไม่บันทึกข้อมูลจริง`);
  };

  const mockSuccess = (message) => {
    if (String(message).includes("ยืมออก") || String(message).includes("ออกงาน")) {
      setSelectedIds([]);
    }
    setPanel(null);
    setToolsOpen(false);
    setToast(`จำลองสำเร็จ: ${message} — เวอร์ชันจริงจะบันทึกลง Firebase`);
  };

  const toggleSelectItem = (item) => {
    if (item.status !== "available") {
      setToast(`เลือกไม่ได้: ${item.name} ยังไม่พร้อมใช้งาน`);
      return;
    }
    setSelectedIds((current) => {
      if (current.includes(item.id)) return current.filter((id) => id !== item.id);
      return [...current, item.id];
    });
    setToast(`เลือกอุปกรณ์: ${item.name}`);
  };

  const openBorrowFromSelection = () => {
    if (selectedIds.length === 0) {
      setToast("กรุณาเลือกอุปกรณ์ที่มีสถานะ ‘พร้อมใช้’ ก่อนกดยืมออก");
      setFilters((current) => ({ ...current, status: "available" }));
      setShowFilters(true);
      return;
    }
    openPanel("ยืมออก / ออกงาน");
  };

  const updateFilter = (key, value) => {
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const clearFilters = () => {
    setDepartment("all");
    setQuery("");
    setFilters(initialFilters);
    setToast("ล้างตัวกรองแล้ว — แสดงรายการทั้งหมด");
  };

  return (
    <div className={`mdec-lite ${dark ? "dark" : "light"}`}>
      <style>{css}</style>
      <main className="page">
        <div className="container">
          <Header dark={dark} setDark={setDark} openTools={() => setToolsOpen(true)} />

          <div className="toast">{toast}</div>

          <section className="statsGrid">
            <StatCard label="ทั้งหมด" value={counts.all} detail="รายการในระบบ" icon="📦" tone="blue" />
            <StatCard label="พร้อมใช้งาน" value={counts.available} detail="หยิบใช้ได้ทันที" icon="✅" tone="green" />
            <StatCard label="ถูกยืม" value={counts.borrowed} detail="รอรับคืน" icon="🕘" tone="purple" />
            <StatCard label="ออกงาน" value={counts.event} detail="ใช้นอกสถานที่" icon="🚚" tone="orange" />
            <StatCard label="ส่งซ่อม" value={counts.maintenance} detail="ยังไม่พร้อมใช้" icon="🛠️" tone="red" />
          </section>

          <section className="quickGrid">
            <ActionButton icon="➕" title="เพิ่มอุปกรณ์" desc="เพิ่มรายการใหม่" tone="blue" onClick={() => openPanel("เพิ่มอุปกรณ์")} />
            <ActionButton icon="▦" title="โหมดสแกน" desc="สแกน QR / Barcode" tone="amber" onClick={() => openPanel("สแกน QR")} />
            <ActionButton icon="↩️" title="ติดตามของรอคืน" desc="รับคืนตามรายการ" tone="green" onClick={() => openPanel("รับคืน")} />
            <ActionButton icon="📤" title="ยืมออก / ออกงาน" desc="เลือกของแล้วทำรายการ" tone="purple" onClick={openBorrowFromSelection} />
          </section>

          <section className="card listSection">
            <div className="listHeader">
              <div>
                <h2>ตารางรายการอุปกรณ์</h2>
                <p>แสดง {filteredItems.length} จาก {ITEMS.length} รายการ • ค้นหา กรอง และเลือกยืมได้จากตารางนี้</p>
              </div>
              <div className="searchTools">
                <div className="searchBox">
                  <span>🔎</span>
                  <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="ค้นหาชื่อ / S.N. / รหัส / สถานที่" />
                </div>
                <button className={`secondaryBtn ${activeFilterCount ? "active" : ""}`} onClick={() => setShowFilters((value) => !value)}>
                  ตัวกรอง{activeFilterCount ? ` (${activeFilterCount})` : ""}
                </button>
                <button className="secondaryBtn blue" onClick={() => setCompact((value) => !value)}>
                  {compact ? "ดูแบบง่าย" : "ดูแบบกระชับ"}
                </button>
              </div>
            </div>

            {showFilters && (
              <FilterPanel
                categories={categories}
                locations={locations}
                filters={filters}
                updateFilter={updateFilter}
                clearFilters={clearFilters}
              />
            )}

            <div className="deptScroll">
              {DEPARTMENTS.map((dept) => (
                <button key={dept.value} className={`deptChip ${department === dept.value ? "selected" : ""}`} onClick={() => setDepartment(dept.value)}>
                  <span>{dept.icon}</span> {dept.label}
                </button>
              ))}
            </div>

            {filteredItems.length === 0 ? (
              <div className="emptyState">ไม่พบรายการที่ค้นหา ลองล้างตัวกรองหรือเปลี่ยนคำค้นหา</div>
            ) : compact ? (
              <CompactTable items={filteredItems} openPanel={openPanel} selectedIds={selectedIds} toggleSelectItem={toggleSelectItem} />
            ) : (
              <div className="itemList">
                {filteredItems.map((item) => (
                  <ItemCard key={item.id} item={item} openPanel={openPanel} selected={selectedIds.includes(item.id)} toggleSelectItem={toggleSelectItem} />
                ))}
              </div>
            )}
          </section>

          <section className="infoGrid">
            <InfoCard tone="sky" icon="🎓" title="สำรองประวัติยืม-คืน" subtitle="เพิ่มจากเว็บเดิมโดยไม่เปลี่ยนวิธีใช้งานหลัก">
              สิ้นปีการศึกษา: ดาวน์โหลดประวัติยืม-คืนเป็น CSV → ตรวจไฟล์สำรอง → ล้างเฉพาะประวัติ โดยรายการอุปกรณ์ยังอยู่ครบ
            </InfoCard>
            <InfoCard tone="red" icon="⚠️" title="ของใกล้ครบกำหนด" subtitle="ช่วยเตือนก่อนลืมคืน">
              <b>Wireless Microphone Set</b><br />กำหนดคืนวันนี้ • โครงการอบรม NotebookLM
            </InfoCard>
            <div className="card infoCard">
              <div className="infoHead">
                <span className="bubble tone-blue">▦</span>
                <div>
                  <h3>ระบบ QR พร้อมใช้</h3>
                  <p>พิมพ์สติ๊กเกอร์แล้วติดอุปกรณ์ได้</p>
                </div>
              </div>
              <button className="fullBtn" onClick={() => openPanel("พิมพ์ QR จากรายการที่เลือก")}>พิมพ์ QR จากรายการที่เลือก</button>
            </div>
            <InfoCard tone="green" icon="⬇️" title="ประหยัดฐานข้อมูล" subtitle="เก็บข้อมูลเท่าที่จำเป็น">
              เก็บประวัติตามปีการศึกษา และดาวน์โหลดสำรองก่อนล้างประวัติ
            </InfoCard>
          </section>
        </div>
      </main>

      <BorrowSelectionBar selectedItems={selectedItems} clearSelection={() => setSelectedIds([])} startBorrow={openBorrowFromSelection} />

      <MobileNav openPanel={openPanel} openTools={() => setToolsOpen(true)} startBorrow={openBorrowFromSelection} selectedCount={selectedIds.length} />

      {panel && <DemoModal panel={panel} close={() => setPanel(null)} selectedStaff={selectedStaff} setSelectedStaff={setSelectedStaff} selectedItems={selectedItems} mockSuccess={mockSuccess} />}
      {toolsOpen && <ToolsModal close={() => setToolsOpen(false)} openPanel={openPanel} />}
    </div>
  );
}

function Header({ dark, setDark, openTools }) {
  return (
    <header className="card header">
      <div className="brand">
        <div className="logo">📦</div>
        <div>
          <div className="titleLine">
            <h1>MDEC-Stock</h1>
            <span className="badge">v20.6 BYOD (Pro)</span>
          </div>
          <p>ระบบจัดการสต๊อก ศูนย์มัลติมีเดียทางการศึกษา</p>
        </div>
      </div>
      <div className="headerActions">
        <button className="ghostBtn" onClick={() => setDark((value) => !value)}>{dark ? "☀️ โหมดสว่าง" : "🌙 โหมดมืด"}</button>
        <button className="darkBtn" onClick={openTools}>⌄ เครื่องมือเพิ่มเติม</button>
      </div>
    </header>
  );
}

function StatCard({ label, value, detail, icon, tone }) {
  return (
    <div className="card statCard">
      <div>
        <p>{label}</p>
        <strong>{value}</strong>
        <small>{detail}</small>
      </div>
      <span className={`bubble tone-${tone}`}>{icon}</span>
    </div>
  );
}

function ActionButton({ icon, title, desc, tone, wide, onClick }) {
  return (
    <button className={`actionBtn toneBg-${tone} ${wide ? "wide" : ""}`} onClick={onClick}>
      <span>{icon}</span>
      <div>
        <strong>{title}</strong>
        <small>{desc}</small>
      </div>
    </button>
  );
}

function FilterPanel({ categories, locations, filters, updateFilter, clearFilters }) {
  return (
    <div className="filterPanel">
      <SelectField label="สถานะ" value={filters.status} onChange={(value) => updateFilter("status", value)}>
        <option value="all">สถานะทั้งหมด</option>
        <option value="available">พร้อมใช้</option>
        <option value="borrowed">ถูกยืม</option>
        <option value="event">ออกงาน</option>
        <option value="maintenance">ส่งซ่อม</option>
      </SelectField>
      <SelectField label="หมวดหมู่" value={filters.category} onChange={(value) => updateFilter("category", value)}>
        <option value="all">หมวดหมู่ทั้งหมด</option>
        {categories.map((category) => <option key={category} value={category}>{category}</option>)}
      </SelectField>
      <SelectField label="สถานที่จัดเก็บ" value={filters.location} onChange={(value) => updateFilter("location", value)}>
        <option value="all">ทุกสถานที่</option>
        {locations.map((location) => <option key={location} value={location}>{location}</option>)}
      </SelectField>
      <SelectField label="ประเภททรัพย์สิน" value={filters.ownership} onChange={(value) => updateFilter("ownership", value)}>
        <option value="all">ทั้งหมด</option>
        <option value="center">ของศูนย์</option>
        <option value="personal">ของส่วนตัว</option>
      </SelectField>
      <button className="clearBtn" onClick={clearFilters}>ล้างตัวกรอง</button>
    </div>
  );
}

function SelectField({ label, value, onChange, children }) {
  return (
    <label className="selectField">
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(event.target.value)}>{children}</select>
    </label>
  );
}

function ItemCard({ item, openPanel, selected, toggleSelectItem }) {
  const status = STATUS[item.status] || STATUS.available;
  return (
    <article className="itemCard">
      <div className="itemMain">
        <span className="bubble tone-blue">📦</span>
        <div>
          <div className="itemTitle">
            <h3>{item.name}</h3>
            {item.owner && <span className="ownerTag">🏷️ ของส่วนตัว</span>}
          </div>
          <p>{item.id} • S.N. {item.sn} • {item.location}</p>
          {(item.borrower || item.due) && <div className="borrowNote">{item.borrower} <span>|</span> กำหนดคืน: {item.due}</div>}
        </div>
      </div>
      <div className="itemMeta">
        <span className="miniChip">{item.department}</span>
        <span className="miniChip blue">{item.category}</span>
        <StatusPill status={status} />
        <button
          className={`selectBtn ${selected ? "selected" : ""}`}
          disabled={item.status !== "available"}
          onClick={() => toggleSelectItem(item)}
        >
          {item.status !== "available" ? "เลือกไม่ได้" : selected ? "เลือกแล้ว" : "เลือกยืม"}
        </button>
        <button className="moreBtn" onClick={() => openPanel(`ดูรายละเอียด: ${item.name}`)}>⋯</button>
      </div>
    </article>
  );
}

function CompactTable({ items, openPanel, selectedIds, toggleSelectItem }) {
  return (
    <div className="tableWrap">
      <table>
        <thead>
          <tr><th>เลือก</th><th>อุปกรณ์</th><th>ฝ่าย</th><th>สถานที่</th><th>สถานะ</th></tr>
        </thead>
        <tbody>
          {items.map((item) => {
            const selected = selectedIds.includes(item.id);
            return (
              <tr key={item.id} onClick={() => openPanel(`ดูรายละเอียด: ${item.name}`)}>
                <td onClick={(event) => event.stopPropagation()}>
                  <button className={`selectBtn small ${selected ? "selected" : ""}`} disabled={item.status !== "available"} onClick={() => toggleSelectItem(item)}>
                    {selected ? "✓" : "+"}
                  </button>
                </td>
                <td><b>{item.name}</b><small>{item.id} • {item.sn}</small></td>
                <td>{item.department}</td>
                <td>{item.location}</td>
                <td><StatusPill status={STATUS[item.status]} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

function StatusPill({ status }) {
  return <span className={`statusPill tone-${status.tone}`}><i />{status.label}</span>;
}

function InfoCard({ tone, icon, title, subtitle, children }) {
  return (
    <div className="card infoCard">
      <div className="infoHead">
        <span className={`bubble tone-${tone}`}>{icon}</span>
        <div>
          <h3>{title}</h3>
          <p>{subtitle}</p>
        </div>
      </div>
      <div className={`infoBody tone-${tone}`}>{children}</div>
    </div>
  );
}

function DemoModal({ panel, close, selectedStaff, setSelectedStaff, selectedItems, mockSuccess }) {
  const isReturn = panel === "รับคืน";
  const isBorrow = panel === "ยืมออก / ออกงาน";
  const isAdd = panel === "เพิ่มอุปกรณ์";
  const isScan = panel === "สแกน QR";
  const isYear = panel === "สำรอง/ล้างประวัติยืม-คืน";
  const isDetail = panel.startsWith("ดูรายละเอียด:");
  const detailName = isDetail ? panel.replace("ดูรายละเอียด: ", "") : "";
  const detailItem = isDetail ? ITEMS.find((item) => item.name === detailName) : null;
  const detailHistory = detailItem ? (HISTORY_BY_ITEM_ID[detailItem.id] || []) : [];
  const [checkedIds, setCheckedIds] = useState(() => selectedItems.map((item) => item.id));
  const [borrowerName, setBorrowerName] = useState("");
  const [returnDate, setReturnDate] = useState("");
  const [returnTime, setReturnTime] = useState("");
  const [borrowNote, setBorrowNote] = useState("");
  const returnableItems = ITEMS.filter((item) => item.status === "borrowed" || item.status === "event");
  const [returnCheckedIds, setReturnCheckedIds] = useState(() => returnableItems.map((item) => item.id));
  const [returnCondition, setReturnCondition] = useState("ปกติ");
  const [returnNote, setReturnNote] = useState("");

  const checkedCount = selectedItems.filter((item) => checkedIds.includes(item.id)).length;
  const allChecked = selectedItems.length > 0 && checkedCount === selectedItems.length;
  const canConfirmBorrow = !isBorrow || (selectedItems.length > 0 && allChecked && borrowerName.trim() && returnDate && returnTime);
  const returnCheckedCount = returnableItems.filter((item) => returnCheckedIds.includes(item.id)).length;
  const allReturnChecked = returnableItems.length > 0 && returnCheckedCount === returnableItems.length;
  const canConfirmReturn = !isReturn || (returnableItems.length > 0 && allReturnChecked && returnCondition);

  const toggleChecklist = (id) => {
    setCheckedIds((current) => {
      if (current.includes(id)) return current.filter((itemId) => itemId !== id);
      return [...current, id];
    });
  };

  const toggleAllChecklist = () => {
    setCheckedIds(() => (allChecked ? [] : selectedItems.map((item) => item.id)));
  };

  const toggleReturnChecklist = (id) => {
    setReturnCheckedIds((current) => {
      if (current.includes(id)) return current.filter((itemId) => itemId !== id);
      return [...current, id];
    });
  };

  const toggleAllReturnChecklist = () => {
    setReturnCheckedIds(() => (allReturnChecked ? [] : returnableItems.map((item) => item.id)));
  };

  return (
    <div className="modalBackdrop" onClick={close}>
      <div className={`modal ${isBorrow || isReturn ? "checkoutModal" : ""}`} onClick={(event) => event.stopPropagation()}>
        <div className="modalHead">
          <div>
            <small>ตัวอย่างหน้าต่างการทำงาน</small>
            <h2>{panel}</h2>
            <p>พรีวิวนี้จำลอง flow การกดปุ่มเท่านั้น ยังไม่เชื่อมฐานข้อมูลจริง</p>
          </div>
          <button onClick={close}>✕</button>
        </div>

        {isAdd && (
          <div className="formStack">
            <input placeholder="ชื่ออุปกรณ์ เช่น Sony A7 IV" />
            <input placeholder="รหัส S.N. / รหัส MDEC" />
            <div className="twoCols">
              <select><option>ภาพนิ่ง</option><option>วิดีโอ</option><option>เครื่องเสียง</option></select>
              <select><option>พร้อมใช้</option><option>ส่งซ่อม</option></select>
            </div>
            <button className="fullBtn" onClick={() => mockSuccess("บันทึกอุปกรณ์ตัวอย่าง")}>บันทึกตัวอย่าง</button>
          </div>
        )}

        {isScan && (
          <div className="formStack">
            <div className="scanBox"><strong>▦</strong><p>พื้นที่จำลองการสแกน QR</p><small>เวอร์ชันจริงจะเปิดกล้องหรือรับค่าจากเครื่องยิงบาร์โค้ด</small></div>
            <input defaultValue="MDEC-CAM-001" />
          </div>
        )}

        {isBorrow && (
          <div className="formStack checkoutStack">
            <section className="selectedChecklist">
              <div className="checklistHeader">
                <div>
                  <h3>อุปกรณ์ที่เลือก {selectedItems.length} รายการ</h3>
                  <p>เช็กรายการอุปกรณ์ก่อนยืนยัน</p>
                </div>
                <div className="checklistActions">
                  <button type="button" className="selectAllChecklistBtn" disabled={selectedItems.length === 0} onClick={toggleAllChecklist}>
                    {allChecked ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </button>
                  <span className="reviewHint">ⓘ ตรวจสอบอุปกรณ์ก่อนยืนยัน</span>
                </div>
              </div>

              <div className="checklistRows">
                {selectedItems.length === 0 ? (
                  <div className="emptyChecklist">ยังไม่ได้เลือกอุปกรณ์ กลับไปกด “เลือกยืม” จากรายการอุปกรณ์ก่อน</div>
                ) : selectedItems.map((item) => {
                  const checked = checkedIds.includes(item.id);
                  return (
                    <button key={item.id} type="button" className={`checkRow ${checked ? "checked" : ""}`} onClick={() => toggleChecklist(item.id)}>
                      <span className="checkBox">{checked ? "✓" : ""}</span>
                      <span className="checkName">{item.name}</span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="checkoutFormCard">
              <label className="selectField"><span>เจ้าหน้าที่ผู้ให้ยืม / ผู้นำออกงาน</span><select value={selectedStaff} onChange={(event) => setSelectedStaff(event.target.value)}>{STAFF.map((staff) => <option key={staff} value={staff}>{staff}</option>)}</select></label>
              <label className="selectField"><span>ชื่อผู้ยืม / ชื่องาน</span><input value={borrowerName} onChange={(event) => setBorrowerName(event.target.value)} placeholder="กรอกชื่อผู้ยืม หรือชื่องาน" /></label>
              <div className="borrowDateGrid">
                <label className="selectField"><span>กำหนดคืนวันที่</span><input type="date" value={returnDate} onChange={(event) => setReturnDate(event.target.value)} /></label>
                <label className="selectField"><span>กำหนดคืนเวลา</span><input type="time" value={returnTime} onChange={(event) => setReturnTime(event.target.value)} /></label>
              </div>
              <label className="selectField"><span>หมายเหตุก่อนยืม</span><textarea value={borrowNote} onChange={(event) => setBorrowNote(event.target.value)} placeholder="เช่น ใช้ออกงานประชุม / อุปกรณ์มีรอยเดิม / ขาดอุปกรณ์บางชิ้น" rows={4} /></label>
              <div className="confirmNote">ⓘ ระบบจะบันทึกว่า “{selectedStaff}” เป็นผู้ให้ยืม / ผู้นำออกงาน{returnDate && returnTime ? ` และกำหนดคืน ${returnDate} เวลา ${returnTime} น.` : ""}{borrowNote.trim() ? ` พร้อมหมายเหตุ: ${borrowNote}` : ""}</div>
            </section>

            <button className="fullBtn purple checkoutCta" disabled={!canConfirmBorrow} onClick={() => mockSuccess(`${panel} ${selectedItems.length} รายการ โดย ${selectedStaff} | ผู้ยืม/งาน: ${borrowerName.trim()} | กำหนดคืน: ${returnDate} ${returnTime} น.${borrowNote.trim() ? ` | หมายเหตุ: ${borrowNote.trim()}` : ""}`)}>
              {canConfirmBorrow ? "ยืนยันยืมออก / ออกงาน" : !allChecked ? `กรุณาเช็กอุปกรณ์ให้ครบ ${checkedCount}/${selectedItems.length}` : !borrowerName.trim() ? "กรุณากรอกชื่อผู้ยืม / ชื่องาน" : "กรุณาเลือกวันและเวลาที่กำหนดคืน"}
            </button>
          </div>
        )}

        {isReturn && (
          <div className="formStack checkoutStack">
            <section className="selectedChecklist returnChecklist">
              <div className="checklistHeader">
                <div>
                  <h3>รายการรอรับคืน {returnableItems.length} รายการ</h3>
                  <p>เช็กของที่กลับเข้าศูนย์ก่อนยืนยันรับคืน</p>
                </div>
                <div className="checklistActions">
                  <button type="button" className="selectAllChecklistBtn" disabled={returnableItems.length === 0} onClick={toggleAllReturnChecklist}>
                    {allReturnChecked ? "ยกเลิกทั้งหมด" : "เลือกทั้งหมด"}
                  </button>
                  <span className="reviewHint">ⓘ ตรวจสภาพและจำนวนอุปกรณ์ก่อนคืนเข้าระบบ</span>
                </div>
              </div>

              <div className="checklistRows">
                {returnableItems.length === 0 ? (
                  <div className="emptyChecklist">ไม่มีอุปกรณ์ที่รอรับคืนในขณะนี้</div>
                ) : returnableItems.map((item) => {
                  const checked = returnCheckedIds.includes(item.id);
                  return (
                    <button key={item.id} type="button" className={`checkRow ${checked ? "checked" : ""}`} onClick={() => toggleReturnChecklist(item.id)}>
                      <span className="checkBox">{checked ? "✓" : ""}</span>
                      <span className="checkName">{item.name}<small>{item.borrower ? `ผู้ยืม/งาน: ${item.borrower}` : ""}{item.due ? ` • กำหนดคืน: ${item.due}` : ""}</small></span>
                    </button>
                  );
                })}
              </div>
            </section>

            <section className="checkoutFormCard">
              <label className="selectField"><span>เจ้าหน้าที่ผู้รับคืน</span><select value={selectedStaff} onChange={(event) => setSelectedStaff(event.target.value)}>{STAFF.map((staff) => <option key={staff} value={staff}>{staff}</option>)}</select></label>
              <label className="selectField"><span>สภาพอุปกรณ์หลังคืน</span><select value={returnCondition} onChange={(event) => setReturnCondition(event.target.value)}><option>ปกติ</option><option>มีรอย / ต้องตรวจเพิ่ม</option><option>ชำรุด / ส่งซ่อม</option><option>คืนไม่ครบ</option></select></label>
              <label className="selectField"><span>หมายเหตุหลังคืน</span><textarea value={returnNote} onChange={(event) => setReturnNote(event.target.value)} placeholder="เช่น อุปกรณ์ปกติ / ขาตั้งมีรอย / สายหาย 1 เส้น / ต้องส่งตรวจสภาพ" rows={4} /></label>
              <div className="confirmNote">ⓘ ระบบจะบันทึกว่า “{selectedStaff}” เป็นผู้รับคืน และสถานะหลังคืนคือ “{returnCondition}”{returnNote.trim() ? ` พร้อมหมายเหตุ: ${returnNote}` : ""}</div>
            </section>

            <button className="fullBtn green checkoutCta returnCta" disabled={!canConfirmReturn} onClick={() => mockSuccess(`${panel} ${returnCheckedCount} รายการ โดย ${selectedStaff} | สภาพ: ${returnCondition}${returnNote.trim() ? ` | หมายเหตุ: ${returnNote.trim()}` : ""}`)}>
              {canConfirmReturn ? "ยืนยันรับคืน" : `กรุณาเช็กของเข้าศูนย์ให้ครบ ${returnCheckedCount}/${returnableItems.length}`}
            </button>
          </div>
        )}

        {isYear && (
          <div className="formStack">
            <div className="infoBody tone-sky">
              แนวทางนี้จะเพิ่มเฉพาะระบบสำรองประวัติยืม-คืนจากเว็บเดิม: ดาวน์โหลดไฟล์ CSV ก่อน แล้วจึงล้างเฉพาะประวัติรายปี โดยในไฟล์จะมีวัน-เวลาที่ยืม, กำหนดคืน, วัน-เวลาที่คืนจริง, เจ้าหน้าที่ให้ยืม และเจ้าหน้าที่รับคืน โดยไม่ลบรายการอุปกรณ์หลัก
            </div>
            <button className="fullBtn green" onClick={() => mockSuccess("ดาวน์โหลดประวัติยืม-คืน CSV พร้อมวันเวลายืม-คืน")}>1. ดาวน์โหลดประวัติยืม-คืน CSV พร้อมวันเวลา</button>
            <button className="fullBtn" onClick={() => mockSuccess("ดาวน์โหลดรายการอุปกรณ์ปัจจุบัน CSV")}>2. ดาวน์โหลดรายการอุปกรณ์ปัจจุบัน CSV</button>
            <button className="dangerBtn" onClick={() => mockSuccess("ล้างเฉพาะประวัติยืม-คืนหลังสำรองแล้ว")}>3. ล้างเฉพาะประวัติยืม-คืนหลังสำรองแล้ว</button>
          </div>
        )}

        {isDetail && <ItemHistoryDetail item={detailItem} history={detailHistory} />}

        {!isAdd && !isScan && !isReturn && !isBorrow && !isYear && !isDetail && <div className="selectedItem"><b>{panel}</b><small>เมนูนี้ในเวอร์ชันจริงจะเชื่อมกับฟีเจอร์เดิมของระบบ เช่น Export CSV, ตั้งค่า, จัดการเซ็ต หรือประวัติการทำงาน</small></div>}
      </div>
    </div>
  );
}

function ItemHistoryDetail({ item, history }) {
  if (!item) return <div className="selectedItem"><b>ไม่พบข้อมูลอุปกรณ์</b><small>ลองเปิดรายการใหม่อีกครั้ง</small></div>;

  return (
    <div className="historyDetail">
      <div className="historySummary">
        <b>{item.name}</b>
        <small>{item.id} • S.N. {item.sn}</small>
      </div>
      <div className="historyHint">ประวัติจะเก็บวัน-เวลาที่ยืม, กำหนดคืน, วัน-เวลาคืนจริง และเจ้าหน้าที่ที่เกี่ยวข้อง</div>
      {history.length === 0 ? (
        <div className="emptyChecklist">ยังไม่มีประวัติการยืม-คืนของอุปกรณ์นี้</div>
      ) : (
        <div className="historyTimeline">
          {history.map((entry, index) => (
            <div key={index} className="historyEntry">
              <div className={`historyBadge ${entry.returnedAt ? "done" : "active"}`}>{entry.returnedAt ? "คืนแล้ว" : "ยังไม่คืน"}</div>
              <div className="historyContent">
                <h3>{entry.type === "event" ? "ออกงาน" : "ยืมอุปกรณ์"}: {entry.borrower}</h3>
                <div className="historyGrid">
                  <span>ยืมเมื่อ</span><b>{entry.borrowAt || "-"}</b>
                  <span>กำหนดคืน</span><b>{entry.expectedReturn || "-"}</b>
                  <span>คืนจริง</span><b>{entry.returnedAt || "ยังไม่คืน"}</b>
                  <span>ผู้ให้ยืม</span><b>{entry.staffOut || "-"}</b>
                  <span>ผู้รับคืน</span><b>{entry.staffIn || "-"}</b>
                  <span>สภาพหลังคืน</span><b>{entry.condition || "-"}</b>
                </div>
                {entry.note && <p className="historyNote">หมายเหตุ: {entry.note}</p>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ToolsModal({ close, openPanel }) {
  return (
    <div className="modalBackdrop" onClick={close}>
      <div className="modal wideModal" onClick={(event) => event.stopPropagation()}>
        <div className="modalHead"><div><small>เมนูรอง</small><h2>เครื่องมือเพิ่มเติม</h2><p>ซ่อนเมนูที่ไม่ใช้บ่อยไว้ตรงนี้ หน้าแรกจะได้ไม่รก</p></div><button onClick={close}>✕</button></div>
        <div className="toolsGrid">
          {TOOL_ITEMS.map((tool) => <button key={tool.id} onClick={() => openPanel(tool.panel)}><span>{tool.icon}</span><div><b>{tool.label}</b><small>{tool.desc}</small></div></button>)}
        </div>
      </div>
    </div>
  );
}

function BorrowSelectionBar({ selectedItems, clearSelection, startBorrow }) {
  if (selectedItems.length === 0) return null;
  return (
    <div className="borrowBar">
      <div>
        <strong>เลือกแล้ว {selectedItems.length} รายการ</strong>
        <small>{selectedItems.map((item) => item.name).join(" • ")}</small>
      </div>
      <button onClick={startBorrow}>ยืมรายการที่เลือก</button>
      <button className="clear" onClick={clearSelection}>ล้าง</button>
    </div>
  );
}

function MobileNav({ openPanel, openTools, startBorrow, selectedCount }) {
  return (
    <nav className="mobileNav">
      <div>
        <button onClick={() => openPanel("เพิ่มอุปกรณ์")}><span>➕</span><b>เพิ่ม</b></button>
        <button onClick={() => openPanel("สแกน QR")}><span>▦</span><b>สแกน</b></button>
        <button onClick={() => openPanel("รับคืน")}><span>↩️</span><b>คืน</b></button>
        <button onClick={startBorrow}><span>📤</span><b>{selectedCount ? `ยืม ${selectedCount}` : "ยืม"}</b></button>
        <button onClick={openTools}><span>☰</span><b>เมนู</b></button>
      </div>
    </nav>
  );
}

const css = `
:root {
  font-family: ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
}
.mdec-lite {
  --page: #f1f5f9;
  --card: #ffffff;
  --soft: #f8fafc;
  --text: #0f172a;
  --text2: #334155;
  --muted: #64748b;
  --faint: #94a3b8;
  --border: #e2e8f0;
  --border2: #f1f5f9;
  --overlay: rgba(15, 23, 42, 0.55);
  --shadow: 0 14px 40px rgba(15, 23, 42, 0.08);
  --blue: #2563eb;
  --indigo: #4f46e5;
  --checkout-bg: linear-gradient(145deg, #ffffff, #f8fbff);
  --checkout-panel: #f8fafc;
  --checkout-row: #ffffff;
  --checkout-row-hover: #eff6ff;
  --checkout-text: #0f172a;
  --checkout-muted: #64748b;
  --checkout-border: #dbeafe;
  --checkout-input: #ffffff;
  --checkout-note-bg: #eff6ff;
  --checkout-note-border: #bfdbfe;
  --checkout-note-text: #1d4ed8;
  min-height: 100vh;
  background: var(--page);
  color: var(--text);
}
.mdec-lite.dark {
  --page: #020617;
  --card: #0f172a;
  --soft: #111c2f;
  --text: #f8fafc;
  --text2: #cbd5e1;
  --muted: #94a3b8;
  --faint: #64748b;
  --border: #334155;
  --border2: #1e293b;
  --overlay: rgba(2, 6, 23, 0.72);
  --shadow: 0 18px 48px rgba(0, 0, 0, 0.32);
  --checkout-bg: linear-gradient(145deg, rgba(2, 18, 45, .98), rgba(4, 23, 54, .96));
  --checkout-panel: rgba(5, 26, 61, .62);
  --checkout-row: rgba(8, 33, 73, .72);
  --checkout-row-hover: rgba(11, 43, 92, .82);
  --checkout-text: #f8fafc;
  --checkout-muted: #93a4bd;
  --checkout-border: rgba(96, 165, 250, .34);
  --checkout-input: rgba(2, 11, 29, .45);
  --checkout-note-bg: rgba(37,99,235,.18);
  --checkout-note-border: rgba(37,99,235,.75);
  --checkout-note-text: #dbeafe;
}
* { box-sizing: border-box; }
button, input, select { font: inherit; }
button { cursor: pointer; }
.page { min-height: 100vh; padding: 28px; padding-bottom: 110px; }
.container { max-width: 1440px; margin: 0 auto; display: flex; flex-direction: column; gap: 22px; }
.card { background: var(--card); border: 1px solid #dbe4f0; border-radius: 24px; box-shadow: 0 10px 28px rgba(15, 23, 42, 0.07); }
.mdec-lite.dark .card { border-color: var(--border2); box-shadow: var(--shadow); }
.header { padding: 24px; display: flex; align-items: center; justify-content: space-between; gap: 24px; }
.brand { display: flex; align-items: center; gap: 16px; min-width: 0; }
.logo { width: 56px; height: 56px; border-radius: 20px; display: grid; place-items: center; color: white; font-size: 30px; background: #2563eb; box-shadow: 0 12px 28px rgba(37,99,235,.24); flex: 0 0 auto; }
.titleLine { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; }
h1, h2, h3, p { margin: 0; }
h1 { font-size: clamp(22px, 4vw, 40px); line-height: 1; font-weight: 950; }
.header p, .listHeader p, .infoHead p, .modalHead p { color: var(--muted); font-weight: 700; margin-top: 6px; }
.badge { background: #dbeafe; color: #1d4ed8; border: 1px solid #bfdbfe; border-radius: 10px; padding: 6px 10px; font-size: 12px; font-weight: 950; }
.headerActions { display: flex; gap: 10px; flex-wrap: wrap; }
.ghostBtn, .darkBtn, .secondaryBtn, .clearBtn { border-radius: 18px; border: 1px solid var(--border); padding: 12px 16px; font-weight: 950; background: var(--soft); color: var(--text2); }
.darkBtn { background: var(--text); color: var(--card); border-color: var(--text); }
.mdec-lite.dark .darkBtn { background: #f8fafc; color: #0f172a; }
.toast { border-radius: 24px; padding: 14px 18px; font-size: 14px; font-weight: 850; color: #1d4ed8; background: #eff6ff; border: 1px solid #bfdbfe; }
.mdec-lite.dark .toast { color: #dbeafe; background: rgba(37,99,235,.15); border-color: rgba(37,99,235,.45); }
.statsGrid { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 16px; }
.statCard { padding: 20px; display: flex; justify-content: space-between; align-items: flex-start; overflow: hidden; border-top: 4px solid #3b82f6; }
.statCard p { color: var(--muted); font-weight: 850; font-size: 14px; }
.statCard strong { display: block; font-size: 42px; line-height: 1; margin-top: 6px; }
.statCard small { display: block; color: var(--faint); font-weight: 800; margin-top: 6px; }
.bubble { display: inline-grid; place-items: center; width: 48px; height: 48px; border-radius: 18px; font-size: 24px; border: 1px solid transparent; flex: 0 0 auto; }
.tone-blue { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
.tone-green { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
.tone-purple { background: #f5f3ff; color: #6d28d9; border-color: #ddd6fe; }
.tone-orange { background: #fff7ed; color: #c2410c; border-color: #fed7aa; }
.tone-red { background: #fff1f2; color: #be123c; border-color: #fecdd3; }
.tone-amber { background: #fffbeb; color: #b45309; border-color: #fde68a; }
.tone-sky { background: #f0f9ff; color: #0369a1; border-color: #bae6fd; }
.mdec-lite.dark .tone-blue, .mdec-lite.dark .tone-green, .mdec-lite.dark .tone-purple, .mdec-lite.dark .tone-orange, .mdec-lite.dark .tone-red, .mdec-lite.dark .tone-amber, .mdec-lite.dark .tone-sky { color: #dbeafe; background: rgba(59,130,246,.14); border-color: rgba(59,130,246,.35); }
.quickGrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; }
.actionBtn { border: 0; color: white; border-radius: 18px; padding: 16px 18px; text-align: left; display: flex; align-items: center; gap: 14px; transition: transform .15s ease; }
.actionBtn:hover { transform: translateY(-2px); }
.actionBtn span { font-size: 25px; width: 48px; height: 48px; border-radius: 18px; display: grid; place-items: center; background: rgba(255,255,255,.2); flex: 0 0 auto; }
.actionBtn strong { display: block; font-size: 18px; }
.actionBtn small { display: block; color: rgba(255,255,255,.78); font-weight: 750; margin-top: 3px; }
.actionBtn.wide { grid-column: span 1; }
.toneBg-blue { background: #2563eb; box-shadow: 0 18px 40px rgba(37,99,235,.22); }
.toneBg-amber { background: #f59e0b; box-shadow: 0 18px 40px rgba(245,158,11,.22); }
.toneBg-green { background: #059669; box-shadow: 0 18px 40px rgba(5,150,105,.22); }
.toneBg-purple { background: #7c3aed; box-shadow: 0 18px 40px rgba(124,58,237,.22); }
.listSection { padding: 22px; display: flex; flex-direction: column; gap: 18px; }
.listHeader { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; }
.listHeader h2 { font-size: 28px; font-weight: 950; }
.searchTools { display: flex; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.searchBox { position: relative; min-width: 320px; flex: 1; }
.searchBox span { position: absolute; left: 16px; top: 50%; transform: translateY(-50%); color: var(--faint); }
.searchBox input, .selectField select, .modal input, .modal select, .modal textarea { width: 100%; border: 1px solid var(--border); background: var(--soft); color: var(--text); border-radius: 18px; padding: 13px 14px; font-weight: 850; outline: none; }
.searchBox input { padding-left: 46px; }
.secondaryBtn.active { color: #b45309; background: #fffbeb; border-color: #fde68a; }
.secondaryBtn.blue { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
.filterPanel { display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 12px; padding: 16px; background: var(--soft); border: 1px solid var(--border2); border-radius: 24px; }
.selectField span { display: block; color: var(--muted); font-size: 12px; font-weight: 950; margin-bottom: 6px; }
.clearBtn { align-self: end; height: 48px; background: var(--card); }
.deptScroll { display: flex; gap: 8px; overflow-x: auto; padding-bottom: 4px; }
.deptChip { flex: 0 0 auto; border-radius: 18px; padding: 12px 16px; border: 1px solid var(--border2); background: var(--soft); color: var(--text2); font-weight: 950; }
.deptChip.selected { background: var(--text); color: var(--card); border-color: var(--text); }
.mdec-lite.dark .deptChip.selected { background: #f8fafc; color: #0f172a; border-color: #f8fafc; }
.itemList { display: grid; gap: 12px; }
.itemCard { background: var(--card); border: 1px solid var(--border2); border-radius: 26px; padding: 16px; box-shadow: var(--shadow); display: flex; align-items: center; justify-content: space-between; gap: 16px; }
.itemMain { display: flex; gap: 14px; min-width: 0; }
.itemTitle { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
.itemTitle h3 { font-size: 18px; font-weight: 950; }
.itemMain p { color: var(--faint); font-weight: 750; margin-top: 4px; }
.ownerTag { color: #a21caf; background: #fdf4ff; border: 1px solid #f5d0fe; border-radius: 999px; padding: 5px 8px; font-size: 12px; font-weight: 950; }
.borrowNote { margin-top: 8px; display: inline-flex; gap: 8px; flex-wrap: wrap; background: var(--soft); color: var(--text2); border: 1px solid var(--border2); border-radius: 14px; padding: 8px 10px; font-size: 13px; font-weight: 850; }
.itemMeta { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; align-items: center; }
.miniChip { background: var(--soft); color: var(--text2); border: 1px solid var(--border2); border-radius: 999px; padding: 7px 10px; font-size: 13px; font-weight: 900; }
.miniChip.blue { color: #1d4ed8; background: #eff6ff; border-color: #bfdbfe; }
.statusPill { display: inline-flex; align-items: center; gap: 7px; border-radius: 999px; border: 1px solid currentColor; padding: 7px 10px; font-size: 13px; font-weight: 950; }
.statusPill i { width: 8px; height: 8px; border-radius: 99px; background: currentColor; }
.moreBtn { width: 40px; height: 40px; border-radius: 16px; border: 1px solid var(--border2); background: var(--soft); color: var(--muted); font-size: 20px; font-weight: 950; }
.selectBtn { border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; border-radius: 16px; padding: 10px 12px; font-size: 13px; font-weight: 950; white-space: nowrap; }
.selectBtn.selected { border-color: #a7f3d0; background: #ecfdf5; color: #047857; }
.selectBtn:disabled { opacity: .45; cursor: not-allowed; filter: grayscale(.35); }
.selectBtn.small { width: 38px; height: 38px; padding: 0; display: inline-grid; place-items: center; font-size: 18px; }
.tableWrap { overflow-x: auto; border: 1px solid #cbd5e1; border-radius: 18px; }
table { width: 100%; min-width: 760px; border-collapse: collapse; background: var(--card); }
th { background: #e2e8f0; color: #334155; padding: 14px; text-align: left; font-weight: 950; }
.mdec-lite.dark th { background: var(--soft); color: var(--muted); }
td { padding: 14px; border-top: 1px solid #e2e8f0; color: var(--text2); font-weight: 750; }
.mdec-lite.dark td { border-top-color: var(--border2); }
td b { display: block; color: var(--text); } td small { display: block; color: var(--faint); margin-top: 3px; }
.emptyState { padding: 38px; text-align: center; color: var(--faint); background: var(--soft); border: 1px dashed var(--border); border-radius: 24px; font-weight: 900; }
.infoGrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px; }
.infoCard { padding: 20px; }
.infoHead { display: flex; gap: 12px; align-items: center; margin-bottom: 14px; }
.infoHead h3 { font-weight: 950; } .infoHead p { font-size: 13px; }
.infoBody { border: 1px solid currentColor; border-radius: 18px; padding: 13px; font-size: 13px; line-height: 1.55; font-weight: 800; }
.fullBtn, .dangerBtn { width: 100%; border: 0; border-radius: 18px; padding: 14px 16px; background: var(--blue); color: white; font-weight: 950; }
.fullBtn.green { background: #059669; } .fullBtn.purple { background: #7c3aed; }
.dangerBtn { color: #be123c; background: #fff1f2; border: 1px solid #fecdd3; }
.modalBackdrop { position: fixed; inset: 0; z-index: 50; display: flex; justify-content: center; align-items: center; padding: 16px; background: var(--overlay); backdrop-filter: blur(8px); }
.modal { width: min(100%, 570px); max-height: 88vh; overflow-y: auto; background: var(--card); color: var(--text); border: 1px solid var(--border); border-radius: 30px; box-shadow: 0 24px 80px rgba(0,0,0,.36); padding: 22px; }
.checkoutModal { width: min(100%, 920px); background: var(--checkout-bg); color: var(--checkout-text); border-color: var(--checkout-border); box-shadow: 0 28px 90px rgba(0,0,0,.28), inset 0 0 0 1px rgba(147,197,253,.08); }
.checkoutModal .modalHead h2 { color: var(--checkout-text); }
.checkoutModal .modalHead p { color: var(--checkout-muted); }
.checkoutModal .modalHead button { background: var(--checkout-panel); color: var(--checkout-muted); border-color: var(--checkout-border); }
.wideModal { width: min(100%, 760px); }
.modalHead { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 18px; }
.modalHead small { color: var(--blue); font-weight: 950; }
.modalHead h2 { font-size: 26px; font-weight: 950; margin-top: 4px; }
.modalHead button { width: 42px; height: 42px; border-radius: 16px; border: 1px solid var(--border2); background: var(--soft); color: var(--muted); font-weight: 950; }
.formStack { display: grid; gap: 12px; }
.checkoutStack { gap: 16px; }
.selectedChecklist, .checkoutFormCard { border: 1px solid var(--checkout-border); background: var(--checkout-panel); border-radius: 24px; padding: 16px; box-shadow: inset 0 1px 0 rgba(255,255,255,.04); }
.checklistHeader { display: flex; align-items: center; justify-content: space-between; gap: 12px; margin-bottom: 12px; }
.checklistHeader h3 { font-size: 22px; font-weight: 950; color: var(--checkout-text); }
.checklistHeader p, .reviewHint { color: var(--checkout-muted); font-weight: 850; font-size: 13px; }
.reviewHint { white-space: nowrap; }
.checklistActions { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; justify-content: flex-end; }
.selectAllChecklistBtn { border: 1px solid var(--checkout-border); background: var(--checkout-row); color: var(--checkout-text); border-radius: 14px; padding: 9px 12px; font-size: 13px; font-weight: 950; white-space: nowrap; }
.selectAllChecklistBtn:hover { border-color: #8b5cf6; background: var(--checkout-row-hover); }
.selectAllChecklistBtn:disabled { opacity: .45; cursor: not-allowed; }
.checklistRows { display: grid; gap: 10px; }
.checkRow { width: 100%; display: grid; grid-template-columns: auto 1fr; align-items: center; gap: 14px; text-align: left; border: 1px solid var(--checkout-border); background: var(--checkout-row); color: var(--checkout-text); border-radius: 18px; padding: 12px 14px; transition: transform .14s ease, border-color .14s ease, background .14s ease; }
.checkRow:hover { transform: translateY(-1px); border-color: #8b5cf6; background: var(--checkout-row-hover); }
.checkRow.checked .checkBox { background: linear-gradient(135deg, #7c3aed, #9333ea); color: white; border-color: rgba(216,180,254,.65); box-shadow: 0 0 20px rgba(124,58,237,.35); }
.checkBox { width: 34px; height: 34px; border-radius: 10px; display: grid; place-items: center; border: 1px solid var(--checkout-border); background: var(--checkout-panel); font-size: 22px; font-weight: 950; }
.checkName { font-size: 18px; font-weight: 950; letter-spacing: -.01em; }
.checkName small { display: block; margin-top: 4px; color: var(--checkout-muted); font-size: 12px; font-weight: 800; letter-spacing: 0; }
.returnChecklist .checkRow.checked .checkBox { background: linear-gradient(135deg, #059669, #10b981); border-color: rgba(167,243,208,.72); box-shadow: 0 0 20px rgba(5,150,105,.32); }
.returnCta { background: linear-gradient(135deg, #059669, #10b981, #047857); box-shadow: 0 18px 42px rgba(5,150,105,.30); }
.emptyChecklist { border: 1px dashed var(--checkout-border); color: var(--checkout-muted); border-radius: 16px; padding: 18px; text-align: center; font-weight: 850; }
.checkoutFormCard { display: grid; gap: 12px; }
.borrowDateGrid { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.checkoutFormCard .selectField span { color: var(--checkout-muted); }
.checkoutFormCard input, .checkoutFormCard select, .checkoutFormCard textarea { background: var(--checkout-input); border-color: var(--checkout-border); color: var(--checkout-text); }
.checkoutFormCard textarea { min-height: 96px; resize: vertical; line-height: 1.55; }
.confirmNote { border: 1px solid var(--checkout-note-border); background: var(--checkout-note-bg); color: var(--checkout-note-text); border-radius: 16px; padding: 14px 16px; font-weight: 900; }
.checkoutCta { min-height: 62px; font-size: 22px; background: linear-gradient(135deg, #7c3aed, #9333ea, #6d28d9); box-shadow: 0 18px 42px rgba(124,58,237,.36); }
.checkoutCta:disabled { opacity: .55; cursor: not-allowed; filter: grayscale(.25); }
.twoCols { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
.scanBox, .selectedItem { background: var(--soft); border: 1px solid var(--border2); border-radius: 22px; padding: 18px; text-align: center; }
.scanBox strong { font-size: 52px; }
.scanBox p, .selectedItem b { display: block; font-weight: 950; }
.scanBox small, .selectedItem small { display: block; color: var(--muted); font-weight: 750; margin-top: 5px; }
.historyDetail { display: grid; gap: 12px; }
.historySummary { background: var(--soft); border: 1px solid var(--border2); border-radius: 22px; padding: 16px; }
.historySummary b { display: block; font-size: 18px; font-weight: 950; color: var(--text); }
.historySummary small { display: block; color: var(--muted); font-weight: 750; margin-top: 4px; }
.historyHint { border: 1px solid #bfdbfe; background: #eff6ff; color: #1d4ed8; border-radius: 18px; padding: 12px 14px; font-size: 13px; font-weight: 850; }
.mdec-lite.dark .historyHint { background: rgba(37,99,235,.16); border-color: rgba(96,165,250,.36); color: #dbeafe; }
.historyTimeline { display: grid; gap: 12px; }
.historyEntry { display: grid; grid-template-columns: auto 1fr; gap: 12px; border: 1px solid var(--border2); background: var(--soft); border-radius: 22px; padding: 14px; }
.historyBadge { align-self: start; border-radius: 999px; padding: 7px 10px; font-size: 12px; font-weight: 950; white-space: nowrap; }
.historyBadge.done { color: #047857; background: #ecfdf5; border: 1px solid #a7f3d0; }
.historyBadge.active { color: #c2410c; background: #fff7ed; border: 1px solid #fed7aa; }
.historyContent h3 { font-size: 16px; font-weight: 950; margin-bottom: 10px; color: var(--text); }
.historyGrid { display: grid; grid-template-columns: 110px 1fr; gap: 7px 10px; font-size: 13px; }
.historyGrid span { color: var(--muted); font-weight: 800; }
.historyGrid b { color: var(--text2); font-weight: 950; }
.historyNote { margin-top: 10px; color: var(--muted); font-size: 13px; font-weight: 800; }
.toolsGrid { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
.toolsGrid button { text-align: left; display: flex; gap: 12px; align-items: center; background: var(--soft); color: var(--text); border: 1px solid var(--border2); border-radius: 22px; padding: 14px; }
.toolsGrid span { font-size: 26px; width: 46px; height: 46px; border-radius: 18px; display: grid; place-items: center; background: var(--card); }
.toolsGrid b { display: block; font-weight: 950; }.toolsGrid small { display: block; color: var(--muted); font-weight: 750; margin-top: 3px; }
.borrowBar { position: fixed; left: 50%; bottom: 88px; transform: translateX(-50%); z-index: 39; width: min(920px, calc(100% - 28px)); display: grid; grid-template-columns: 1fr auto auto; gap: 10px; align-items: center; background: var(--card); color: var(--text); border: 1px solid var(--border); border-radius: 24px; padding: 12px; box-shadow: 0 20px 70px rgba(15,23,42,.24); }
.borrowBar strong { display: block; font-weight: 950; }
.borrowBar small { display: block; color: var(--muted); font-weight: 750; max-width: 100%; overflow: hidden; white-space: nowrap; text-overflow: ellipsis; }
.borrowBar button { border: 0; border-radius: 16px; padding: 12px 14px; background: #7c3aed; color: white; font-weight: 950; }
.borrowBar button.clear { background: var(--soft); color: var(--text2); border: 1px solid var(--border2); }
.mobileNav { display: none; position: fixed; left: 0; right: 0; bottom: 0; z-index: 40; padding: 10px 12px 12px; background: linear-gradient(to top, var(--page) 74%, transparent); }
.mobileNav > div { max-width: 430px; margin: 0 auto; display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; background: var(--card); border: 1px solid var(--border); box-shadow: 0 18px 60px rgba(0,0,0,.22); border-radius: 24px; padding: 8px; }
.mobileNav button { border: 0; background: transparent; color: var(--text2); border-radius: 16px; padding: 6px 2px; display: flex; flex-direction: column; align-items: center; gap: 2px; }
.mobileNav span { width: 34px; height: 34px; display: grid; place-items: center; border-radius: 14px; background: var(--soft); }
.mobileNav b { font-size: 11px; }
@media (max-width: 1024px) { .statsGrid { grid-template-columns: repeat(3, 1fr); } .infoGrid { grid-template-columns: repeat(2, 1fr); } .filterPanel { grid-template-columns: repeat(2, 1fr); } .listHeader { flex-direction: column; } .searchTools { width: 100%; justify-content: stretch; } .searchBox { min-width: 0; width: 100%; } }
@media (max-width: 720px) { .page { padding: 16px 14px 108px; } .container { gap: 16px; } .header { border-radius: 24px; padding: 16px; flex-direction: column; align-items: stretch; } .brand { align-items: flex-start; } .logo { width: 50px; height: 50px; border-radius: 18px; } .headerActions { display: none; } .statsGrid { grid-template-columns: repeat(2, 1fr); gap: 10px; } .statCard { padding: 14px; border-radius: 22px; } .statCard strong { font-size: 32px; } .quickGrid { grid-template-columns: repeat(2, 1fr); gap: 10px; } .actionBtn, .actionBtn.wide { grid-column: span 1; border-radius: 22px; padding: 13px; gap: 10px; } .actionBtn span { width: 40px; height: 40px; border-radius: 15px; font-size: 20px; } .actionBtn strong { font-size: 14px; } .actionBtn small { font-size: 11px; } .listSection { padding: 16px; border-radius: 24px; } .searchTools { display: grid; grid-template-columns: 1fr 1fr; } .searchBox { grid-column: span 2; } .filterPanel { grid-template-columns: 1fr; } .itemCard { flex-direction: column; align-items: stretch; border-radius: 22px; } .itemMain { gap: 10px; } .itemMeta { justify-content: flex-start; } .infoGrid { grid-template-columns: 1fr; } .toolsGrid { grid-template-columns: 1fr; } .twoCols, .borrowDateGrid { grid-template-columns: 1fr; } .modalBackdrop { align-items: flex-end; padding: 10px; } .modal { border-radius: 28px 28px 20px 20px; padding: 18px; } .checkoutModal { width: 100%; } .checklistHeader { align-items: flex-start; flex-direction: column; } .checklistActions { width: 100%; justify-content: space-between; } .reviewHint { white-space: normal; } .checkRow { grid-template-columns: auto 1fr; padding: 11px; gap: 10px; } .checkName { font-size: 15px; } .checkBox { width: 30px; height: 30px; border-radius: 9px; font-size: 18px; } .checkoutCta { font-size: 17px; min-height: 56px; } .borrowBar { bottom: 86px; grid-template-columns: 1fr; } .borrowBar button { width: 100%; } .mobileNav { display: block; } }
`;
