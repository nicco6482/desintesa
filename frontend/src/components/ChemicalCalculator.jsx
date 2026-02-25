import { useMemo } from "react";

const AREA_TO_LITERS_FACTOR = 20;

function toNumber(v) { const p = Number(v); return Number.isFinite(p) ? p : 0; }

function formatDateTime(date) {
  return new Intl.DateTimeFormat("es-MX", { dateStyle: "short", timeStyle: "short" }).format(date);
}

function DoseBar({ applied, recommended, limit }) {
  if (!recommended || recommended <= 0) return null;
  const pct = Math.min((applied / limit) * 100, 100);
  const color = applied > limit ? "#ef4444" : applied >= recommended * 0.8 ? "#22c55e" : "#f59e0b";
  return (
    <div>
      <div className="flex justify-between text-[10px] text-slate-400 mb-1">
        <span>0</span>
        <span>Rec. {recommended.toFixed(1)}</span>
        <span>Lím. {limit.toFixed(1)}</span>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, background: color }} />
      </div>
    </div>
  );
}

export default function ChemicalCalculator({ index, value, catalog, onChange, onRemove, disableRemove }) {
  const selectedChemical = useMemo(() => catalog.find((c) => c.id === value.id) || null, [catalog, value.id]);

  const tankLiters = toNumber(value.tankLiters);
  const areaM2 = toNumber(value.areaM2);
  const mixLiters = tankLiters > 0 ? tankLiters : areaM2 > 0 ? areaM2 / AREA_TO_LITERS_FACTOR : 0;
  const dosePerLiter = selectedChemical?.dosisPorLitro || 0;
  const recommendedDose = mixLiters * dosePerLiter;
  const safeLimit = recommendedDose * 1.1;
  const appliedDose = toNumber(value.cantidadAplicada);
  const hasCalc = recommendedDose > 0;
  const exceedsLimit = hasCalc && appliedDose > safeLimit;
  const isSafe = hasCalc && appliedDose > 0 && !exceedsLimit;

  const reentryAt = selectedChemical
    ? formatDateTime(new Date(Date.now() + Number(selectedChemical.tiempoReingreso || 0) * 3600000))
    : null;

  const borderClass = exceedsLimit ? "border-red-300 bg-red-50/60" : isSafe ? "border-green-300 bg-green-50/60" : "border-slate-200 bg-white";

  function handleCatalogChange(chemicalId) {
    const chem = catalog.find((c) => c.id === chemicalId);
    if (!chem) { onChange(index, { id: "", name: "", activeIngredient: "", sanitaryRegistry: "", dosisPorLitro: 0, dosisUnidad: "ml", tiempoReingreso: 0 }); return; }
    const recalc = mixLiters > 0 ? mixLiters * Number(chem.dosisPorLitro) : 0;
    onChange(index, { id: chem.id, name: chem.nombre, activeIngredient: chem.ingredienteActivo, sanitaryRegistry: chem.registroSanitario, dosisPorLitro: Number(chem.dosisPorLitro), dosisUnidad: chem.unidadDosis, tiempoReingreso: Number(chem.tiempoReingreso), cantidadAplicada: recalc > 0 ? String(recalc.toFixed(2)) : value.cantidadAplicada });
  }

  function applyAutoDose() { if (!hasCalc) return; onChange(index, { cantidadAplicada: recommendedDose.toFixed(2) }); }

  return (
    <div className={`rounded-xl border p-4 transition-colors ${borderClass}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className={`flex h-7 w-7 items-center justify-center rounded-lg text-xs font-bold ${isSafe ? "bg-green-100 text-green-700" : exceedsLimit ? "bg-red-100 text-red-700" : "bg-blue-100 text-blue-700"}`}>{index + 1}</div>
          <p className="text-sm font-semibold text-slate-700">Ficha técnica #{index + 1}</p>
          {isSafe && <span className="badge badge-completado text-[10px]">✓ Dosis segura</span>}
          {exceedsLimit && <span className="badge badge-alto text-[10px]">⚠ Límite excedido</span>}
        </div>
        <button type="button" className="btn-danger py-1 px-2.5 text-xs" onClick={() => onRemove(index)} disabled={disableRemove}>Quitar</button>
      </div>

      {/* Fields */}
      <div className="grid gap-2.5 md:grid-cols-2">
        <div>
          <label className="label">Producto del catálogo</label>
          <select className="input" value={value.id || ""} onChange={(e) => handleCatalogChange(e.target.value)}>
            <option value="">— Seleccionar —</option>
            {catalog.map((c) => <option key={c.id} value={c.id}>{c.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="label">Registro sanitario</label>
          <input className="input bg-slate-50" value={value.sanitaryRegistry || ""} readOnly placeholder="Auto-completado" />
        </div>

        <div>
          <label className="label">Área tratada (m²)</label>
          <input className="input" type="number" step="0.01" min="0" placeholder="Ej. 500" value={value.areaM2 || ""} onChange={(e) => onChange(index, { areaM2: e.target.value })} />
        </div>
        <div>
          <label className="label">Litros de tanque</label>
          <input className="input" type="number" step="0.01" min="0" placeholder="Ej. 20" value={value.tankLiters || ""} onChange={(e) => onChange(index, { tankLiters: e.target.value })} />
        </div>

        <div>
          <label className="label">Cantidad aplicada ({selectedChemical?.unidadDosis || "ml"})</label>
          <input className="input" type="number" step="0.01" min="0" placeholder="0.00" value={value.cantidadAplicada || ""} onChange={(e) => onChange(index, { cantidadAplicada: e.target.value })} />
        </div>
        <div className="flex flex-col justify-end">
          <button type="button" className="btn-secondary w-full" onClick={applyAutoDose} disabled={!hasCalc}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
            Usar dosis sugerida {hasCalc ? `(${recommendedDose.toFixed(2)})` : ""}
          </button>
        </div>

        <div>
          <label className="label">Dilución usada</label>
          <input className="input" placeholder="Ej. 1 ml/L" value={value.dilucion || ""} onChange={(e) => onChange(index, { dilucion: e.target.value })} />
        </div>
        <div>
          <label className="label">Lote del producto</label>
          <input className="input" placeholder="Ej. DEL-2401-A" value={value.lote || ""} onChange={(e) => onChange(index, { lote: e.target.value })} />
        </div>
      </div>

      {/* Technical summary + dose bar */}
      {selectedChemical && (
        <div className="mt-3 rounded-xl border border-dashed border-slate-200 bg-white/80 p-3 space-y-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-slate-600">
            <p><span className="font-semibold text-slate-500">Ingrediente activo:</span> {value.activeIngredient || "—"}</p>
            <p><span className="font-semibold text-slate-500">Dosis/litro:</span> {selectedChemical.dosisPorLitro} {selectedChemical.unidadDosis}/L</p>
            <p><span className="font-semibold text-slate-500">Mezcla estimada:</span> {mixLiters.toFixed(2)} L</p>
            <p><span className="font-semibold text-slate-500">Reingreso:</span> {selectedChemical.tiempoReingreso}h</p>
          </div>
          {hasCalc && (
            <DoseBar applied={appliedDose} recommended={recommendedDose} limit={safeLimit} />
          )}
        </div>
      )}

      {/* Reentry alert */}
      {selectedChemical && reentryAt && (
        <div className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 flex items-center gap-1.5">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>
          <span>Área no habitable hasta: <strong>{reentryAt}</strong></span>
        </div>
      )}
    </div>
  );
}
