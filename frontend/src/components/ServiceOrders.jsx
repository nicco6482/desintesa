import { useEffect, useMemo, useState, forwardRef, useImperativeHandle, useCallback } from "react";
import { api } from "../services/api";
import ChemicalCalculator from "./ChemicalCalculator";
import PestSelector from "./PestSelector";
import {
  User, MapPin, Bug, FlaskConical, PenLine, CheckCircle,
  ChevronLeft, ChevronRight, Check, Wifi, RefreshCw, Pencil, Trash2, Award, Eye
} from "lucide-react";

/* ─── Helpers ────────────────────────────────────────── */
const INFESTATION_BADGE = { bajo: "badge-bajo", medio: "badge-medio", alto: "badge-alto" };
const INFESTATION_LABEL = { bajo: "Bajo", medio: "Medio", alto: "Alto" };
const STATUS_BADGE = { programado: "badge-programado", completado: "badge-completado", cancelado: "badge-cancelado" };
const STATUS_LABEL = { programado: "Programado", completado: "Completado", cancelado: "Cancelado" };

function fmtDate(v) {
  if (!v) return "—";
  return new Date(v + "T00:00:00").toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
}

function createEmptyChemical() {
  return { id: "", name: "", activeIngredient: "", sanitaryRegistry: "", dosisPorLitro: 0, dosisUnidad: "ml", tiempoReingreso: 0, areaM2: "", tankLiters: "", cantidadAplicada: "", dilucion: "", lote: "" };
}

const EMPTY = {
  clientId: "", clientName: "",
  location: { address: "", gps: { lat: "", lng: "" } },
  assignedTechnician: "", pestType: "", infestationLevel: "bajo",
  chemicalsUsed: [createEmptyChemical()],
  applicationDate: "", nextVisitDate: "",
  status: "programado", serviceNotes: ""
};

function toForm(o) {
  if (!o) return EMPTY;
  return {
    clientId: o.clientId, clientName: o.clientName,
    location: { address: o.location?.address || "", gps: { lat: o.location?.gps?.lat ?? "", lng: o.location?.gps?.lng ?? "" } },
    assignedTechnician: o.assignedTechnician || "", pestType: o.pestType || "",
    infestationLevel: o.infestationLevel || "bajo",
    chemicalsUsed: o.chemicalsUsed?.length
      ? o.chemicalsUsed.map((c) => ({ id: c.id || "", name: c.name || "", activeIngredient: c.activeIngredient || "", sanitaryRegistry: c.sanitaryRegistry || "", dosisPorLitro: c.dosisPorLitro || 0, dosisUnidad: c.dosisUnidad || "ml", tiempoReingreso: c.tiempoReingreso || 0, areaM2: c.areaM2 || "", tankLiters: c.tankLiters || "", cantidadAplicada: c.cantidadAplicada != null ? String(c.cantidadAplicada) : "", dilucion: c.dilucion || "", lote: c.lote || "" }))
      : [createEmptyChemical()],
    applicationDate: o.applicationDate || "", nextVisitDate: o.nextVisitDate || "",
    status: o.status || "programado", serviceNotes: o.serviceNotes || ""
  };
}

function validateStep(form, step) {
  const errs = [];
  if (step >= 1) {
    if (!form.clientId || !form.clientName) errs.push("ID y nombre del cliente son obligatorios.");
    if (!form.location.address) errs.push("La dirección es obligatoria.");
    if (form.location.gps.lat === "" || form.location.gps.lng === "") errs.push("Latitud y longitud GPS son obligatorias.");
  }
  if (step >= 2) {
    if (!form.pestType) errs.push("Selecciona el tipo de plaga.");
    if (!form.chemicalsUsed.length) errs.push("Añade al menos un producto químico.");
    else form.chemicalsUsed.forEach((c, i) => {
      if (!c.name || !c.sanitaryRegistry) errs.push(`Producto #${i + 1}: nombre y registro sanitario requeridos.`);
      if (c.cantidadAplicada === "" || Number(c.cantidadAplicada) <= 0) errs.push(`Producto #${i + 1}: cantidad aplicada inválida.`);
      if (!c.dilucion || !c.lote) errs.push(`Producto #${i + 1}: dilución y lote requeridos.`);
    });
  }
  if (step >= 3) {
    if (!form.assignedTechnician) errs.push("Asigna un técnico.");
    if (!form.applicationDate || !form.nextVisitDate) errs.push("Fechas de aplicación y próxima visita son obligatorias.");
    if (form.applicationDate && form.nextVisitDate && new Date(form.nextVisitDate) <= new Date(form.applicationDate))
      errs.push("La próxima visita debe ser posterior a la fecha de aplicación.");
  }
  return errs;
}

function mapPayload(form) {
  return {
    ...form,
    location: { address: form.location.address, gps: { lat: Number(form.location.gps.lat), lng: Number(form.location.gps.lng) } },
    chemicalsUsed: form.chemicalsUsed.map((c) => ({ id: c.id, name: c.name.trim(), activeIngredient: c.activeIngredient?.trim() || "", sanitaryRegistry: c.sanitaryRegistry.trim(), dosisPorLitro: Number(c.dosisPorLitro) || 0, dosisUnidad: c.dosisUnidad || "ml", tiempoReingreso: Number(c.tiempoReingreso) || 0, areaM2: c.areaM2 === "" ? null : Number(c.areaM2), tankLiters: c.tankLiters === "" ? null : Number(c.tankLiters), cantidadAplicada: Number(c.cantidadAplicada), dilucion: c.dilucion.trim(), lote: c.lote.trim() }))
  };
}

/* ─── Stepper bar ────────────────────────────────────── */
const STEPS = [
  { num: 1, label: "Cliente & Ubicación", Icon: User },
  { num: 2, label: "Plaga & Dosificación", Icon: Bug },
  { num: 3, label: "Cierre", Icon: PenLine },
];
function StepperBar({ current }) {
  return (
    <div className="stepper-bar">
      {STEPS.map((s, idx) => {
        const state = current > s.num ? "done" : current === s.num ? "active" : "";
        return (
          <div key={s.num} className={`stepper-step ${state}`}>
            <div className="stepper-dot">
              {current > s.num ? <Check size={14} /> : s.num}
            </div>
            <span className="stepper-label hidden sm:inline">{s.label}</span>
            {idx < STEPS.length - 1 && <div className="flex-1 h-0.5 rounded mx-2" style={{ background: current > s.num ? "var(--blue-500)" : "#e2e8f0" }} />}
          </div>
        );
      })}
    </div>
  );
}

/* ─── Main component (forwardRef for FAB) ────────────── */
const ServiceOrders = forwardRef(function ServiceOrders({ onRefresh, onOpenCertificate }, ref) {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState("");
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [syncState, setSyncState] = useState("idle"); // idle | saving | synced
  const [errors, setErrors] = useState([]);
  const [catalog, setCatalog] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [filterStatus, setFilter] = useState("todos");
  const [search, setSearch] = useState("");

  /* expose openForNew to parent (FAB) */
  useImperativeHandle(ref, () => ({
    openForNew() { resetForm(); setFormOpen(true); },
  }));

  async function loadOrders() {
    setLoading(true);
    try { setOrders(await api.getOrders()); }
    catch (e) { setErrors([e.message]); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadOrders(); }, []);
  useEffect(() => {
    let m = true;
    api.getChemicals().then((d) => { if (m) setCatalog(d); }).catch(() => { });
    return () => { m = false; };
  }, []);

  function resetForm() { setForm(EMPTY); setEditingId(""); setStep(1); setErrors([]); setSyncState("idle"); }

  function updateField(path, val) {
    setForm((prev) => {
      const next = structuredClone(prev);
      const keys = path.split(".");
      let ptr = next;
      while (keys.length > 1) ptr = ptr[keys.shift()];
      ptr[keys[0]] = val;
      return next;
    });
  }

  function handleChemChange(i, partial) { setForm((p) => { const n = structuredClone(p); n.chemicalsUsed[i] = { ...n.chemicalsUsed[i], ...partial }; return n; }); }
  function addChem() { setForm((p) => ({ ...p, chemicalsUsed: [...p.chemicalsUsed, createEmptyChemical()] })); }
  function removeChem(i) { setForm((p) => { if (p.chemicalsUsed.length === 1) return p; return { ...p, chemicalsUsed: p.chemicalsUsed.filter((_, idx) => idx !== i) }; }); }

  function tryNext() {
    const errs = validateStep(form, step);
    setErrors(errs);
    if (errs.length === 0) setStep((s) => Math.min(s + 1, 3));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const errs = validateStep(form, 3);
    setErrors(errs);
    if (errs.length) return;

    setSaving(true); setSyncState("saving");
    try {
      const payload = mapPayload(form);
      if (editingId) await api.updateOrder(editingId, payload);
      else await api.createOrder(payload);
      setSyncState("synced");
      await loadOrders();
      onRefresh?.();
      // auto-close after 2s
      setTimeout(() => { resetForm(); setFormOpen(false); setSyncState("idle"); }, 2000);
    } catch (e) {
      setErrors([e.message]);
      setSyncState("idle");
    } finally {
      setSaving(false);
    }
  }

  function handleEdit(o) { setForm(toForm(o)); setEditingId(o.id); setStep(1); setErrors([]); setSyncState("idle"); setFormOpen(true); window.scrollTo({ top: 0, behavior: "smooth" }); }
  async function handleDelete(id) {
    if (!window.confirm("¿Eliminar esta orden?")) return;
    await api.deleteOrder(id); await loadOrders(); onRefresh?.();
  }
  async function handleCertify(id) {
    try { await api.issueCertificate(id); await loadOrders(); onRefresh?.(); onOpenCertificate?.(id); }
    catch (e) { setErrors([e.message]); }
  }

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return [...orders]
      .filter((o) => filterStatus === "todos" || o.status === filterStatus)
      .filter((o) => !q || o.clientName?.toLowerCase().includes(q) || o.pestType?.toLowerCase().includes(q) || o.clientId?.toLowerCase().includes(q))
      .sort((a, b) => new Date(b.applicationDate) - new Date(a.applicationDate));
  }, [orders, filterStatus, search]);

  /* ─── Save button UI ──────────────────────────────── */
  function SaveButton() {
    if (syncState === "synced") {
      return <button type="button" className="btn-synced cursor-default"><CheckCircle size={18} /> Sincronizado</button>;
    }
    if (syncState === "saving") {
      return <button type="button" className="btn-primary opacity-80 cursor-not-allowed" disabled><RefreshCw size={16} className="animate-spin" /> Sincronizando…</button>;
    }
    return <button type="submit" className="btn-primary" disabled={saving}>{editingId ? "Actualizar orden" : "Guardar orden"} <Wifi size={15} /></button>;
  }

  /* ─── Step panels ─────────────────────────────────── */
  function Step1() {
    return (
      <div className="space-y-4 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-blue-50 flex items-center justify-center"><User size={16} className="text-blue-700" /></div>
          <h4 className="font-bold text-slate-700">Datos del cliente</h4>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">ID Cliente</label><input className="input" placeholder="CLI-001" value={form.clientId} onChange={(e) => updateField("clientId", e.target.value)} /></div>
          <div><label className="label">Nombre / Razón social</label><input className="input" placeholder="Nombre del cliente" value={form.clientName} onChange={(e) => updateField("clientName", e.target.value)} /></div>
        </div>

        <div className="flex items-center gap-2 mt-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-green-50 flex items-center justify-center"><MapPin size={16} className="text-green-700" /></div>
          <h4 className="font-bold text-slate-700">Ubicación del servicio</h4>
        </div>
        <div><label className="label">Dirección</label><input className="input" placeholder="Av. Reforma 220, CDMX" value={form.location.address} onChange={(e) => updateField("location.address", e.target.value)} /></div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div><label className="label">Latitud GPS</label><input className="input" type="number" step="any" placeholder="19.4326" value={form.location.gps.lat} onChange={(e) => updateField("location.gps.lat", e.target.value)} /></div>
          <div><label className="label">Longitud GPS</label><input className="input" type="number" step="any" placeholder="-99.1332" value={form.location.gps.lng} onChange={(e) => updateField("location.gps.lng", e.target.value)} /></div>
        </div>
      </div>
    );
  }

  function Step2() {
    return (
      <div className="space-y-5 animate-fade-in">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-xl bg-red-50 flex items-center justify-center"><Bug size={16} className="text-red-600" /></div>
            <h4 className="font-bold text-slate-700">Tipo de plaga</h4>
          </div>
          <PestSelector value={form.pestType} onChange={(v) => updateField("pestType", v)} />
        </div>

        <div>
          <label className="label">Nivel de infestación</label>
          <div className="flex gap-3">
            {["bajo", "medio", "alto"].map((l) => (
              <button key={l} type="button"
                className={`flex-1 rounded-xl border-2 py-3 text-sm font-semibold transition-all ${form.infestationLevel === l ? (l === "bajo" ? "border-green-600 bg-green-50 text-green-700" : l === "medio" ? "border-amber-500 bg-amber-50 text-amber-700" : "border-red-500 bg-red-50 text-red-700") : "border-slate-200 text-slate-500 hover:border-slate-300"}`}
                onClick={() => updateField("infestationLevel", l)}
              >{l.charAt(0).toUpperCase() + l.slice(1)}</button>
            ))}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-purple-50 flex items-center justify-center"><FlaskConical size={16} className="text-purple-700" /></div>
              <h4 className="font-bold text-slate-700">Productos químicos</h4>
            </div>
            <button type="button" className="btn-secondary py-2 px-3 text-xs" style={{ minHeight: 36 }} onClick={addChem}>+ Agregar</button>
          </div>
          <div className="space-y-3">
            {form.chemicalsUsed.map((c, i) => (
              <ChemicalCalculator key={`ch-${i}`} index={i} value={c} catalog={catalog} onChange={handleChemChange} onRemove={removeChem} disableRemove={form.chemicalsUsed.length === 1} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  function Step3() {
    return (
      <div className="space-y-5 animate-fade-in">
        <div className="flex items-center gap-2 mb-1">
          <div className="w-8 h-8 rounded-xl bg-amber-50 flex items-center justify-center"><PenLine size={16} className="text-amber-600" /></div>
          <h4 className="font-bold text-slate-700">Datos de cierre</h4>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <div className="sm:col-span-2"><label className="label">Técnico asignado</label><input className="input" placeholder="Nombre del técnico" value={form.assignedTechnician} onChange={(e) => updateField("assignedTechnician", e.target.value)} /></div>
          <div>
            <label className="label">Estado del servicio</label>
            <select className="input" value={form.status} onChange={(e) => updateField("status", e.target.value)}>
              <option value="programado">Programado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
          <div />
          <div><label className="label">Fecha de aplicación</label><input className="input" type="date" value={form.applicationDate} onChange={(e) => updateField("applicationDate", e.target.value)} /></div>
          <div><label className="label">Próxima visita</label><input className="input" type="date" value={form.nextVisitDate} onChange={(e) => updateField("nextVisitDate", e.target.value)} /></div>
        </div>

        <div><label className="label">Notas del servicio</label><textarea className="input" rows={3} placeholder="Observaciones, áreas tratadas, recomendaciones…" value={form.serviceNotes} onChange={(e) => updateField("serviceNotes", e.target.value)} style={{ minHeight: "auto", paddingTop: 12, paddingBottom: 12 }} /></div>

        {/* Summary card */}
        <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 space-y-2 text-sm">
          <p className="font-semibold text-blue-800 mb-2 text-xs uppercase tracking-wide">Resumen del servicio</p>
          <div className="grid gap-1.5 text-slate-700">
            <p><span className="font-semibold">Cliente:</span> {form.clientName || "—"} ({form.clientId || "—"})</p>
            <p><span className="font-semibold">Ubicación:</span> {form.location.address || "—"}</p>
            <p><span className="font-semibold">Plaga:</span> {form.pestType || "—"} · Nivel: {INFESTATION_LABEL[form.infestationLevel]}</p>
            <p><span className="font-semibold">Productos:</span> {form.chemicalsUsed.filter(c => c.name).map(c => c.name).join(", ") || "—"}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="space-y-5 animate-fade-in">

      {/* ─── Stepper form ─────────────────────────── */}
      <article className="card overflow-hidden">
        {/* Header – always visible */}
        <button type="button" className="flex w-full items-center justify-between px-5 py-4 text-left"
          onClick={() => { if (formOpen) { resetForm(); } setFormOpen(v => !v); }}>
          <h3 className="font-bold text-slate-800 flex items-center gap-2">
            {editingId ? <><Pencil size={16} className="text-blue-600" />Editar orden</> : <><ChevronRight size={16} className="text-slate-400" />Nueva orden de servicio</>}
          </h3>
          <ChevronRight size={18} className={`text-slate-400 transition-transform ${formOpen ? "rotate-90" : ""}`} />
        </button>

        {formOpen && (
          <>
            <StepperBar current={step} />
            <form onSubmit={handleSubmit} className="p-5">
              {step === 1 && <Step1 />}
              {step === 2 && <Step2 />}
              {step === 3 && <Step3 />}

              {/* Error list */}
              {errors.length > 0 && (
                <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4">
                  <p className="text-sm font-semibold text-red-700 mb-1">Corrige los siguientes errores:</p>
                  <ul className="space-y-0.5">{errors.map((e) => <li key={e} className="text-xs text-red-600">• {e}</li>)}</ul>
                </div>
              )}

              {/* Navigation */}
              <div className="mt-6 flex items-center justify-between gap-3">
                {step > 1
                  ? <button type="button" className="btn-secondary" onClick={() => { setStep(s => s - 1); setErrors([]); }}>
                    <ChevronLeft size={16} />Anterior
                  </button>
                  : <button type="button" className="btn-secondary" onClick={() => { resetForm(); setFormOpen(false); }}>Cancelar</button>
                }
                {step < 3
                  ? <button type="button" className="btn-primary" onClick={tryNext}>Siguiente<ChevronRight size={16} /></button>
                  : <SaveButton />
                }
              </div>
            </form>
          </>
        )}
      </article>

      {/* ─── Orders table ─────────────────────────── */}
      <article className="card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <h3 className="font-bold text-slate-800">Órdenes registradas</h3>
          <div className="flex flex-wrap gap-2">
            <input className="input py-2 text-xs" style={{ minHeight: 38, width: 180 }} placeholder="Buscar cliente o plaga…" value={search} onChange={(e) => setSearch(e.target.value)} />
            <select className="input py-2 text-xs" style={{ minHeight: 38, width: 150 }} value={filterStatus} onChange={(e) => setFilter(e.target.value)}>
              <option value="todos">Todos</option>
              <option value="programado">Programado</option>
              <option value="completado">Completado</option>
              <option value="cancelado">Cancelado</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-4 py-3">Cliente</th>
                <th className="px-4 py-3">Plaga</th>
                <th className="px-4 py-3">Aplicación</th>
                <th className="px-4 py-3">Próx. visita</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {loading && <tr><td colSpan={6} className="px-4 py-8 text-center"><div className="flex justify-center gap-2">{[0, 1, 2].map(i => <div key={i} className="skeleton rounded" style={{ height: 12, width: 80, display: "inline-block" }} />)}</div></td></tr>}
              {!loading && filtered.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-slate-400 text-sm">Sin órdenes que coincidan.</td></tr>}
              {!loading && filtered.map((o) => (
                <tr key={o.id} className="table-row">
                  <td className="px-4 py-3">
                    <p className="font-semibold text-slate-800">{o.clientName}</p>
                    <p className="text-xs text-slate-400">{o.clientId}</p>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium">{o.pestType}</p>
                    <span className={`badge mt-1 ${INFESTATION_BADGE[o.infestationLevel] || ""}`}>{INFESTATION_LABEL[o.infestationLevel] || o.infestationLevel}</span>
                  </td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(o.applicationDate)}</td>
                  <td className="px-4 py-3 text-slate-600 text-xs">{fmtDate(o.nextVisitDate)}</td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_BADGE[o.status] || ""}`}>{STATUS_LABEL[o.status] || o.status}</span>
                    {o.certificate?.issued && <span className="ml-1 badge badge-completado">Cert. ✓</span>}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <button className="btn-xs btn-secondary border border-slate-200" onClick={() => handleEdit(o)}><Pencil size={13} />Editar</button>
                      <button className="btn-xs btn-danger border border-red-200 bg-red-50 text-red-700 hover:bg-red-100" onClick={() => handleDelete(o.id)}><Trash2 size={13} />Borrar</button>
                      <button className="btn-xs btn-success bg-green-700 text-white hover:bg-green-800" onClick={() => handleCertify(o.id)} disabled={o.status !== "completado"} style={{ opacity: o.status !== "completado" ? 0.4 : 1 }}><Award size={13} />Cert.</button>
                      <button className="btn-xs btn-secondary border border-slate-200" onClick={() => onOpenCertificate?.(o.id)}><Eye size={13} />Ver</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-slate-100 px-5 py-3 text-xs text-slate-400">
          {filtered.length} de {orders.length} orden{orders.length !== 1 ? "es" : ""}
        </div>
      </article>
    </section>
  );
});

export default ServiceOrders;
