import { useMemo, useRef, useEffect } from "react";

/**
 * HeatMap – SVG dot-map of service locations colored by infestation level.
 * Props: orders (array)
 */

const COLORS = { alto: "#ef4444", medio: "#f59e0b", bajo: "#22c55e" };

function normalize(values) {
    const min = Math.min(...values);
    const max = Math.max(...values);
    const range = max - min || 1;
    return values.map((v) => (v - min) / range);
}

export default function HeatMap({ orders = [] }) {
    const svgRef = useRef(null);
    const W = 400, H = 220, PAD = 28;

    const points = useMemo(() => {
        const valid = orders.filter(
            (o) => o.location?.gps?.lat != null && o.location?.gps?.lng != null
        );
        if (!valid.length) return [];

        const lats = valid.map((o) => o.location.gps.lat);
        const lngs = valid.map((o) => o.location.gps.lng);
        const normLat = normalize(lats);
        const normLng = normalize(lngs);

        return valid.map((o, i) => ({
            id: o.id,
            x: PAD + normLng[i] * (W - PAD * 2),
            // lat increases north, so invert y
            y: H - PAD - normLat[i] * (H - PAD * 2),
            level: o.infestationLevel || "bajo",
            label: `${o.clientName} · ${o.pestType}`,
            address: o.location.address,
        }));
    }, [orders]);

    if (!orders.length) return null;

    return (
        <article className="card p-5">
            <div className="flex items-center justify-between mb-3">
                <h4 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-blue-600"><circle cx="12" cy="12" r="10" /><line x1="2" y1="12" x2="22" y2="12" /><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" /></svg>
                    Mapa de actividad – Este mes
                </h4>
                <div className="flex items-center gap-3 text-[10px] font-semibold text-slate-500">
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />Alto</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />Medio</span>
                    <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-green-500 inline-block" />Bajo</span>
                </div>
            </div>

            <div className="rounded-xl border border-slate-100 bg-slate-50 overflow-hidden">
                <svg
                    ref={svgRef}
                    viewBox={`0 0 ${W} ${H}`}
                    width="100%"
                    style={{ display: "block", maxHeight: 220 }}
                    aria-label="Mapa de calor de actividad de plagas"
                >
                    {/* Grid lines */}
                    {[0.25, 0.5, 0.75].map((f) => (
                        <g key={f}>
                            <line x1={PAD} y1={H - PAD - f * (H - PAD * 2)} x2={W - PAD} y2={H - PAD - f * (H - PAD * 2)} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                            <line x1={PAD + f * (W - PAD * 2)} y1={PAD} x2={PAD + f * (W - PAD * 2)} y2={H - PAD} stroke="#e2e8f0" strokeWidth="1" strokeDasharray="4 4" />
                        </g>
                    ))}

                    {/* Axis border */}
                    <rect x={PAD} y={PAD} width={W - PAD * 2} height={H - PAD * 2} fill="none" stroke="#e2e8f0" strokeWidth="1" rx="4" />

                    {/* Points with glow */}
                    {points.map((p) => {
                        const color = COLORS[p.level] || COLORS.bajo;
                        return (
                            <g key={p.id}>
                                {/* glow */}
                                <circle cx={p.x} cy={p.y} r={14} fill={color} opacity={0.12} />
                                {/* dot */}
                                <circle cx={p.x} cy={p.y} r={7} fill={color} opacity={0.85} stroke="#fff" strokeWidth={2} />
                                {/* hover title */}
                                <title>{p.label}{"\n"}{p.address}</title>
                            </g>
                        );
                    })}

                    {/* No data message */}
                    {points.length === 0 && (
                        <text x={W / 2} y={H / 2} textAnchor="middle" fill="#94a3b8" fontSize="13">Sin datos de ubicación GPS</text>
                    )}
                </svg>
            </div>

            <p className="mt-2 text-[11px] text-slate-400">{points.length} servicio{points.length !== 1 ? "s" : ""} ubicado{points.length !== 1 ? "s" : ""} · Pasa el cursor sobre un punto para ver detalles</p>
        </article>
    );
}
