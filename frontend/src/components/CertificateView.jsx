import { useEffect, useState } from "react";
import { api } from "../services/api";
import { exportServiceCertificateToPDF } from "../utils/pdf";

function InfoRow({ label, value }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-start gap-0.5">
      <dt className="w-40 flex-shrink-0 text-xs font-semibold uppercase tracking-wide text-slate-400">{label}</dt>
      <dd className="text-sm text-slate-700 font-medium">{value || <span className="text-slate-300">N/A</span>}</dd>
    </div>
  );
}

const INFESTATION_BADGE = { bajo: "badge-bajo", medio: "badge-medio", alto: "badge-alto" };
const INFESTATION_LABEL = { bajo: "Bajo", medio: "Medio", alto: "Alto" };

export default function CertificateView({ orderId }) {
  const [cert, setCert] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!orderId) return;
    let mounted = true;
    setLoading(true); setError("");
    api.getCertificate(orderId)
      .then((r) => { if (mounted) setCert(r); })
      .catch((e) => { if (mounted) { setCert(null); setError(e.message); } })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [orderId]);

  if (!orderId) {
    return (
      <section className="card p-10 text-center animate-fade-in">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="6" /><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11" /></svg>
        </div>
        <h3 className="text-lg font-bold text-slate-700">Generador de Certificados</h3>
        <p className="mt-2 text-sm text-slate-400">Selecciona una orden completada desde el Panel Administrador y haz clic en "Ver cert." para visualizar y exportar su certificado.</p>
      </section>
    );
  }
  if (loading) return <section className="card p-8 text-center text-slate-400 animate-pulse text-sm">Cargando certificado…</section>;
  if (error) return <section className="card p-6 border-l-4 border-red-400"><p className="font-semibold text-red-700">No se pudo generar el certificado</p><p className="text-sm text-red-500 mt-1">{error}</p></section>;
  if (!cert) return null;

  const { order, folio, issuedAt } = cert;
  const issuedFormatted = issuedAt ? new Date(issuedAt).toLocaleString("es-MX", { dateStyle: "long", timeStyle: "short" }) : "Pendiente de emisión";

  return (
    <section className="animate-fade-in space-y-4">
      {/* Actions bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 print-hidden">
        <div>
          <p className="text-xs text-slate-400 font-medium uppercase tracking-wide">Folio</p>
          <p className="font-bold text-slate-800 text-lg">{folio || "PENDIENTE"}</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button className="btn-secondary" onClick={() => window.print()}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" /><rect x="6" y="14" width="12" height="8" /></svg>
            Imprimir
          </button>
          <button className="btn-primary" onClick={() => exportServiceCertificateToPDF(cert)}>
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>
            Exportar PDF
          </button>
        </div>
      </div>

      {/* Certificate document */}
      <div className="card overflow-hidden print:shadow-none">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-900 to-blue-700 px-6 py-5 text-white">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/15">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" opacity=".9" /></svg>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-blue-200">Desintesa</p>
                <h2 className="text-xl font-bold">Certificado de Servicio</h2>
                <p className="text-xs text-blue-200 mt-0.5">Control de Plagas y Desinfección</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-blue-200 uppercase tracking-wide">Folio</p>
              <p className="font-mono font-bold text-lg">{folio || "PENDIENTE"}</p>
              <p className="text-xs text-blue-300 mt-0.5">Emitido: {issuedFormatted}</p>
            </div>
          </div>
        </div>

        {/* Green accent bar */}
        <div className="h-1.5 bg-gradient-to-r from-green-500 to-green-400"></div>

        {/* Body */}
        <div className="p-6 space-y-6">
          {/* Client & service */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" /></svg>
                Datos del cliente
              </h4>
              <dl className="space-y-2">
                <InfoRow label="Razón social" value={order.clientName} />
                <InfoRow label="ID cliente" value={order.clientId} />
                <InfoRow label="Dirección" value={order.location?.address} />
                <InfoRow label="Coordenadas" value={order.location?.gps ? `${order.location.gps.lat}, ${order.location.gps.lng}` : null} />
              </dl>
            </div>
            <div>
              <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
                Detalles del servicio
              </h4>
              <dl className="space-y-2">
                <InfoRow label="Tipo de plaga" value={order.pestType} />
                <InfoRow label="Nivel infest." value={
                  <span className={`badge ${INFESTATION_BADGE[order.infestationLevel] || ""}`}>
                    {INFESTATION_LABEL[order.infestationLevel] || order.infestationLevel}
                  </span>
                } />
                <InfoRow label="Técnico" value={order.assignedTechnician} />
                <InfoRow label="Fecha aplicación" value={order.applicationDate} />
                <InfoRow label="Próxima visita" value={order.nextVisitDate} />
              </dl>
            </div>
          </div>

          {/* Chemicals table */}
          <div>
            <h4 className="font-bold text-blue-900 text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 8v4l3 3" /></svg>
              Productos químicos aplicados
            </h4>
            <div className="overflow-x-auto rounded-xl border border-slate-100">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-4 py-2.5">Producto</th>
                    <th className="px-4 py-2.5">Registro sanitario</th>
                    <th className="px-4 py-2.5">Cant. aplicada</th>
                    <th className="px-4 py-2.5">Dilución</th>
                    <th className="px-4 py-2.5">Lote</th>
                  </tr>
                </thead>
                <tbody>
                  {order.chemicalsUsed.map((c, i) => (
                    <tr key={`${c.name}-${i}`} className="border-t border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-2.5">
                        <p className="font-semibold text-slate-800">{c.name}</p>
                        <p className="text-xs text-slate-400">{c.activeIngredient}</p>
                      </td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{c.sanitaryRegistry}</td>
                      <td className="px-4 py-2.5 font-semibold">{c.cantidadAplicada || "N/A"} <span className="text-slate-400 font-normal">{c.dosisUnidad}</span></td>
                      <td className="px-4 py-2.5 text-slate-600">{c.dilucion || "N/A"}</td>
                      <td className="px-4 py-2.5 font-mono text-xs text-slate-600">{c.lote || "N/A"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {order.serviceNotes && (
            <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-400 mb-1">Notas del servicio</p>
              <p className="text-sm text-slate-700">{order.serviceNotes}</p>
            </div>
          )}

          {/* Legal footer */}
          <div className="rounded-xl border border-green-200 bg-green-50 p-4 flex items-start gap-3">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#15803d" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="flex-shrink-0 mt-0.5"><path d="M12 2L3 7v5c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5z" /></svg>
            <div>
              <p className="text-sm font-semibold text-green-800">Cumplimiento normativo</p>
              <p className="text-xs text-green-700 mt-0.5">Servicio ejecutado conforme a las disposiciones de sanidad ambiental y control integrado de plagas. Todos los productos utilizados cuentan con registro sanitario vigente ante las autoridades competentes.</p>
            </div>
          </div>

          {/* Signature block */}
          <div className="grid gap-6 sm:grid-cols-2 pt-2">
            <div className="border-t-2 border-dashed border-slate-200 pt-3 text-center">
              <p className="text-xs text-slate-400">Firma del técnico responsable</p>
              <p className="text-sm font-semibold text-slate-600 mt-1">{order.assignedTechnician}</p>
            </div>
            <div className="border-t-2 border-dashed border-slate-200 pt-3 text-center">
              <p className="text-xs text-slate-400">Sello digital Desintesa</p>
              <p className="text-xs font-mono text-slate-400 mt-1">#{folio || "PENDIENTE"}</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
