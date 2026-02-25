import { useEffect, useState } from "react";
import { api } from "../services/api";

function formatDate(value) {
  if (!value) return "—";
  return new Date(value + "T00:00:00").toLocaleDateString("es-MX", { weekday: "short", day: "2-digit", month: "short", year: "numeric" });
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const diff = new Date(dateStr + "T00:00:00") - new Date();
  return Math.ceil(diff / 86400000);
}

const STATUS_COLORS = {
  programado: { dot: "bg-blue-500", bar: "border-blue-200", bg: "bg-blue-50" },
  completado: { dot: "bg-green-500", bar: "border-green-200", bg: "bg-green-50" },
  cancelado: { dot: "bg-slate-400", bar: "border-slate-200", bg: "bg-slate-50" }
};
const STATUS_LABEL = { programado: "Programado", completado: "Completado", cancelado: "Cancelado" };
const STATUS_BADGE = { programado: "badge-programado", completado: "badge-completado", cancelado: "badge-cancelado" };

function groupByWeek(orders) {
  const today = new Date();
  const endOfThisWeek = new Date(today);
  endOfThisWeek.setDate(today.getDate() + (7 - today.getDay()));

  const groups = { "Esta semana": [], "Próximamente": [], "Pasados": [] };
  orders.forEach((o) => {
    const d = new Date(o.nextVisitDate + "T00:00:00");
    if (d < today) groups["Pasados"].push(o);
    else if (d <= endOfThisWeek) groups["Esta semana"].push(o);
    else groups["Próximamente"].push(o);
  });
  return groups;
}

export default function Agenda({ refreshKey }) {
  const [agenda, setAgenda] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    api.getAgenda()
      .then((r) => { if (mounted) setAgenda(r); })
      .catch((e) => { if (mounted) setError(e.message); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [refreshKey]);

  const upcoming = agenda.filter((o) => o.status !== "cancelado");
  const groups = groupByWeek(upcoming);

  return (
    <section className="space-y-5 animate-fade-in">
      {/* Header stats */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" /></svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Esta semana</p>
            <p className="text-xl font-bold text-slate-800">{groups["Esta semana"].length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-700">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" /></svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Próximamente</p>
            <p className="text-xl font-bold text-slate-800">{groups["Próximamente"].length}</p>
          </div>
        </div>
        <div className="card p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12" /></svg>
          </div>
          <div>
            <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Total activos</p>
            <p className="text-xl font-bold text-slate-800">{upcoming.length}</p>
          </div>
        </div>
      </div>

      {loading && <div className="card p-8 text-center text-slate-400 text-sm animate-pulse">Cargando agenda…</div>}
      {error && <div className="card p-5 border-l-4 border-red-400"><p className="text-red-600 text-sm">{error}</p></div>}

      {!loading && !error && (
        <div className="space-y-6">
          {Object.entries(groups).map(([group, items]) => {
            if (items.length === 0) return null;
            return (
              <article key={group} className="card p-5">
                <h4 className="font-bold text-slate-700 text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full inline-block ${group === "Esta semana" ? "bg-blue-500" : group === "Próximamente" ? "bg-green-500" : "bg-slate-400"}`}></span>
                  {group}
                  <span className="ml-auto font-semibold text-slate-400">{items.length}</span>
                </h4>
                <div className="space-y-3">
                  {items.map((o, idx) => {
                    const colors = STATUS_COLORS[o.status] || STATUS_COLORS.programado;
                    const days = daysUntil(o.nextVisitDate);
                    return (
                      <div key={o.id} className={`timeline-item`} style={{ animationDelay: `${idx * 0.05}s` }}>
                        <div className={`timeline-dot ${colors.dot}`} style={{ boxShadow: `0 0 0 3px ${o.status === 'completado' ? '#dcfce7' : o.status === 'cancelado' ? '#f1f5f9' : '#dbeafe'}` }}></div>
                        <div className={`rounded-xl border p-3.5 ${colors.bg} ${colors.bar} card-hover`}>
                          <div className="flex flex-wrap items-start justify-between gap-2">
                            <div>
                              <p className="font-semibold text-slate-800">{o.clientName}</p>
                              <p className="text-sm text-slate-600 mt-0.5">{o.pestType} · Técnico: {o.assignedTechnician}</p>
                              <p className="text-xs text-slate-500 mt-1">{o.location?.address}</p>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="font-bold text-slate-700 text-sm">{formatDate(o.nextVisitDate)}</p>
                              {days !== null && days > 0 && <p className="text-xs text-slate-400 mt-0.5">en {days} día{days !== 1 ? "s" : ""}</p>}
                              {days !== null && days <= 0 && <p className="text-xs text-amber-600 font-semibold mt-0.5">¡Hoy!</p>}
                              <span className={`badge mt-1 ${STATUS_BADGE[o.status] || ""}`}>{STATUS_LABEL[o.status] || o.status}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </article>
            );
          })}
          {upcoming.length === 0 && (
            <div className="card p-8 text-center">
              <p className="text-slate-400 text-sm">No hay servicios activos en la agenda.</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
