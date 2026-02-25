import { useState, useRef } from "react";
import {
  LayoutDashboard, ClipboardList, CalendarDays, Award, Plus, Menu, X, Shield
} from "lucide-react";
import Dashboard from "./components/Dashboard";
import ServiceOrders from "./components/ServiceOrders";
import Agenda from "./components/Agenda";
import CertificateView from "./components/CertificateView";

const NAV = [
  { key: "dashboard", label: "Dashboard", Icon: LayoutDashboard },
  { key: "orders", label: "Admin", Icon: ClipboardList },
  { key: "agenda", label: "Agenda", Icon: CalendarDays },
  { key: "certificate", label: "Certificados", Icon: Award },
];

export default function App() {
  const [activeTab, setActiveTab] = useState("dashboard");
  const [clientId, setClientId] = useState("CLI-001");
  const [refreshKey, setRefreshKey] = useState(0);
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ref so FAB can open the stepper from anywhere
  const serviceOrdersRef = useRef(null);

  function triggerRefresh() { setRefreshKey((v) => v + 1); }

  function navigate(key) { setActiveTab(key); setSidebarOpen(false); }

  function handleFAB() {
    navigate("orders");
    // Small delay so ServiceOrders mounts before we call openForNew
    setTimeout(() => {
      serviceOrdersRef.current?.openForNew?.();
    }, 50);
  }

  const currentLabel = NAV.find((n) => n.key === activeTab)?.label ?? "";

  /* ── Sidebar (desktop) ──────────────────────────────── */
  const SidebarContent = (
    <>
      <div className="flex items-center gap-3 px-5 py-6 border-b border-white/10">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 text-green-300">
          <Shield size={22} />
        </div>
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-widest text-blue-200">Plataforma</p>
          <h1 className="text-lg font-bold text-white leading-tight">Desintesa</h1>
        </div>
      </div>

      <nav className="flex-1 px-3 py-5 space-y-1">
        {NAV.map(({ key, label, Icon }) => (
          <button key={key} className={`sidebar-link${activeTab === key ? " active" : ""}`} onClick={() => navigate(key)}>
            <Icon size={18} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      <div className="px-4 pb-6 border-t border-white/10 pt-4">
        <p className="text-[10px] uppercase tracking-widest text-blue-300 mb-2">Cliente activo</p>
        <input
          className="w-full rounded-lg border border-white/20 bg-white/10 px-3 py-2 text-sm text-white placeholder-blue-300 focus:outline-none focus:ring-2 focus:ring-white/30"
          value={clientId}
          onChange={(e) => setClientId(e.target.value)}
          placeholder="ID cliente (ej. CLI-001)"
        />
      </div>

      <div className="px-5 pb-5">
        <p className="text-[10px] text-blue-400/70">© 2026 Desintesa MVP · v2.0</p>
      </div>
    </>
  );

  return (
    <div className="app-layout">
      {/* ─── Desktop Sidebar ─── */}
      <aside className={`sidebar${sidebarOpen ? " open" : ""}`}>
        {SidebarContent}
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/40 z-40 md:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* ─── Main ─── */}
      <div className="main-content">
        {/* Topbar */}
        <header className="topbar sticky top-0 z-30 flex items-center justify-between border-b border-slate-200 bg-white/90 backdrop-blur-md px-5 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <button className="md:hidden p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 transition" onClick={() => setSidebarOpen(true)}>
              {sidebarOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
            <div>
              <p className="text-[10px] uppercase tracking-widest text-slate-400 leading-none">Desintesa</p>
              <h2 className="text-base font-bold text-slate-800">{currentLabel}</h2>
            </div>
          </div>
          <span className="hidden sm:flex items-center gap-1.5 rounded-full bg-green-50 border border-green-200 px-3 py-1 text-xs font-semibold text-green-700">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse inline-block" />
            Sistema activo
          </span>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-6 lg:p-8 animate-fade-in">
          {activeTab === "dashboard" && <Dashboard clientId={clientId} refreshKey={refreshKey} />}
          {activeTab === "orders" && (
            <ServiceOrders
              ref={serviceOrdersRef}
              onRefresh={triggerRefresh}
              onOpenCertificate={(id) => { setSelectedOrderId(id); navigate("certificate"); }}
            />
          )}
          {activeTab === "agenda" && <Agenda refreshKey={refreshKey} />}
          {activeTab === "certificate" && <CertificateView orderId={selectedOrderId} />}
        </main>
      </div>

      {/* ─── Bottom Nav (mobile) ─── */}
      <nav className="bottom-nav">
        {NAV.map(({ key, label, Icon }) => (
          <button key={key} className={`bottom-nav-item${activeTab === key ? " active" : ""}`} onClick={() => navigate(key)}>
            <Icon size={22} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* ─── FAB ─── */}
      <button className="fab" onClick={handleFAB} title="Nueva orden">
        <Plus size={26} strokeWidth={2.5} />
      </button>
    </div>
  );
}
