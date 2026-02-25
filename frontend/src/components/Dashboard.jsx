import { useEffect, useState } from "react";
import { api } from "../services/api";
import {
  Calendar, AlertTriangle, FileCheck, LayoutGrid,
  CheckCircle2, Clock, ArrowRight
} from "lucide-react";
import HeatMap from "./HeatMap";

const BADGE = { bajo: "badge-bajo", medio: "badge-medio", alto: "badge-alto" };
const BADGE_LBL = { bajo: "Bajo", medio: "Medio", alto: "Alto" };

function formatDate(v) {
  if (!v) return "—";
  return new Date(v + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}
function daysUntil(d) {
  if (!d) return null;
  return Math.ceil((new Date(d + "T00:00:00") - new Date()) / 86400000);
}

/* ─── Skeleton ─────────────────────────────────────── */
function KpiSkeleton() {
  return (
    <div className="kpi-card">
      <div className="kpi-icon skeleton" style={{ width: 52, height: 52 }} />
      <div className="flex-1 space-y-2">
        <div className="skeleton rounded" style={{ height: 12, width: "60%" }} />
        <div className="skeleton rounded" style={{ height: 28, width: "35%" }} />
      </div>
    </div>
  );
}

/* ─── KPI Card ──────────────────────────────────────── */
function KpiCard({ icon: Icon, label, value, iconBg, iconColor, borderColor, subtitle }) {
  return (
    <div className={`kpi-card border-l-4 ${borderColor}`}>
      <div className={`kpi-icon ${iconBg}`}>
        <Icon size={24} className={iconColor} />
      </div>
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</p>
        <p className="mt-0.5 text-3xl font-bold text-slate-800">{value}</p>
        {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

export default function Dashboard({ clientId, refreshKey }) {
  const [data, setData] = useState({ pendingCertificates: [], visitHistory: [] });
  const [allOrders, setAll] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const TODAY = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    let m = true;
    setLoading(true); setError("");
    Promise.all([api.getDashboard(clientId), api.getOrders()])
      .then(([dash, orders]) => {
        if (!m) return;
        setData(dash);
        setAll(orders);
      })
      .catch((e) => { if (m) setError(e.message); })
      .finally(() => { if (m) setLoading(false); });
    return () => { m = false; };
  }, [clientId, refreshKey]);

  /* ── Derived KPIs ─────────────────────────────────── */
  const serviciosHoy = allOrders.filter(
    (o) => o.applicationDate === TODAY && o.status !== "cancelado"
  ).length;

  // "Reentry alerts": completed orders whose last chemical tiempoReingreso > 0 and applied today
  const alertasReingreso = allOrders.filter((o) => {
    if (o.status !== "completado") return false;
    if (o.applicationDate !== TODAY) return false;
    return o.chemicalsUsed?.some((c) => (c.tiempoReingreso || 0) > 0);
  }).length;

  const certsPorFirmar = allOrders.filter(
    (o) => o.status === "completado" && !o.certificate?.issued
  ).length;

  /* ── Next visit ────────────────────────────────────── */
  const upcoming = [...allOrders]
    .filter((o) => o.nextVisitDate && o.status !== "cancelado")
    .sort((a, b) => new Date(a.nextVisitDate) - new Date(b.nextVisitDate))[0];
  const daysLeft = upcoming ? daysUntil(upcoming.nextVisitDate) : null;

  if (error) {
    return (
      <div className="card p-6 border-l-4 border-red-500">
        <p className="font-semibold text-red-700">Error cargando dashboard</p>
        <p className="text-sm text-red-500 mt-1">{error}</p>
      </div>
    );
  }

  return (
    <section className="space-y-6 animate-fade-in">

      {/* ── KPI Row ─────────────────────────────────── */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {loading ? (
          [0, 1, 2].map((i) => <KpiSkeleton key={i} />)
        ) : (
          <>
            <KpiCard
              icon={Calendar}
              label="Servicios de Hoy"
              value={serviciosHoy}
              iconBg="bg-blue-50"
              iconColor="text-blue-700"
              borderColor="border-blue-500"
              subtitle={`Al ${new Date().toLocaleDateString("es-MX", { day: "2-digit", month: "short" })}`}
            />
            <KpiCard
              icon={AlertTriangle}
              label="Alertas de Reingreso"
              value={alertasReingreso}
              iconBg="bg-amber-50"
              iconColor="text-amber-600"
              borderColor="border-amber-400"
              subtitle="Áreas con químicos activos hoy"
            />
            <KpiCard
              icon={FileCheck}
              label="Certificados por Firmar"
              value={certsPorFirmar}
              iconBg="bg-red-50"
              iconColor="text-red-600"
              borderColor="border-red-500"
              subtitle="Servicios completados sin emitir"
            />
          </>
        )}
      </div>

      {/* ── Next visit alert ─────────────────────────── */}
      {!loading && upcoming && (
        <div className={`card p-4 border-l-4 flex items-start gap-4 ${daysLeft !== null && daysLeft <= 7 ? "border-amber-400 bg-amber-50" : "border-blue-400 bg-blue-50"}`}>
          <div className={`flex-shrink-0 w-14 h-14 rounded-xl flex flex-col items-center justify-center text-center ${daysLeft !== null && daysLeft <= 7 ? "bg-amber-100 text-amber-700" : "bg-blue-100 text-blue-700"}`}>
            {daysLeft !== null && daysLeft > 0 && <><span className="text-xl font-bold leading-none">{daysLeft}</span><span className="text-[9px] uppercase font-semibold">días</span></>}
            {daysLeft === 0 && <span className="text-xs font-bold">Hoy</span>}
            {daysLeft !== null && daysLeft < 0 && <span className="text-xs font-bold">Vencido</span>}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-slate-800">
              {daysLeft === 0 ? "¡Visita programada para hoy!" : daysLeft < 0 ? "Visita vencida – requiere reprogramar" : `Próxima visita en ${daysLeft} día${daysLeft !== 1 ? "s" : ""}`}
            </p>
            <p className="text-xs text-slate-600 mt-0.5">{upcoming.pestType} · Técnico: {upcoming.assignedTechnician}</p>
            <p className="text-xs text-slate-400 mt-0.5">{formatDate(upcoming.nextVisitDate)} · {upcoming.clientName}</p>
          </div>
          <ArrowRight size={18} className="flex-shrink-0 text-slate-300 self-center" />
        </div>
      )}

      {/* ── Heatmap ──────────────────────────────────── */}
      {!loading && <HeatMap orders={allOrders} />}

      {/* ── Two-col: pending certs + history ─────────── */}
      {loading ? (
        <div className="grid gap-5 lg:grid-cols-2">
          {[0, 1].map((i) => (
            <div key={i} className="card p-5 space-y-3">
              <div className="skeleton rounded" style={{ height: 18, width: "50%" }} />
              {[0, 1, 2].map((j) => <div key={j} className="skeleton rounded-xl" style={{ height: 64 }} />)}
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Pending certs */}
          <article className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <FileCheck size={15} className="text-amber-500" />
                Certificados pendientes
              </h4>
              <span className="badge badge-medio">{data.pendingCertificates.length}</span>
            </div>
            <div className="space-y-2">
              {data.pendingCertificates.length === 0 ? (
                <div className="rounded-xl bg-green-50 border border-green-200 p-4 flex items-center gap-3">
                  <CheckCircle2 size={18} className="text-green-600 flex-shrink-0" />
                  <p className="text-sm text-green-700 font-medium">¡Al día! Sin certificados pendientes.</p>
                </div>
              ) : data.pendingCertificates.map((o) => (
                <div key={o.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 flex items-start justify-between gap-2 card-hover">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{o.pestType}</p>
                    <p className="text-xs text-slate-500 mt-0.5">Aplic: {formatDate(o.applicationDate)} · {o.assignedTechnician}</p>
                  </div>
                  <span className={`badge ${BADGE[o.infestationLevel] || ""}`}>{BADGE_LBL[o.infestationLevel] || o.infestationLevel}</span>
                </div>
              ))}
            </div>
          </article>

          {/* Visit history */}
          <article className="card p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="font-bold text-slate-800 flex items-center gap-2">
                <Clock size={15} className="text-blue-500" />
                Historial de visitas
              </h4>
              <span className="badge badge-completado">{data.visitHistory.length}</span>
            </div>
            <ul className="space-y-2">
              {data.visitHistory.length === 0 && (
                <li className="text-sm text-slate-400 py-2">No hay visitas completadas aún.</li>
              )}
              {data.visitHistory.map((o) => (
                <li key={o.id} className="rounded-xl border border-slate-100 bg-slate-50 p-3 card-hover">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">{o.pestType}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{formatDate(o.applicationDate)}</p>
                    </div>
                    <span className={`badge ${BADGE[o.infestationLevel] || ""}`}>{BADGE_LBL[o.infestationLevel] || o.infestationLevel}</span>
                  </div>
                </li>
              ))}
            </ul>
          </article>
        </div>
      )}
    </section>
  );
}
