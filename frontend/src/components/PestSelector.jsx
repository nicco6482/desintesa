/**
 * PestSelector – visual card grid for quick pest selection.
 * Props: value (string), onChange (fn), readOnly (bool)
 */

const PESTS = [
    { id: "Cucaracha", emoji: "🪳", label: "Cucaracha" },
    { id: "Roedor", emoji: "🐀", label: "Roedor" },
    { id: "Termita", emoji: "🪲", label: "Termita" },
    { id: "Mosquito", emoji: "🦟", label: "Mosquito" },
    { id: "Mosca", emoji: "🪰", label: "Mosca" },
    { id: "Avispa", emoji: "🐝", label: "Avispa" },
    { id: "Hormiga", emoji: "🐜", label: "Hormiga" },
    { id: "Pulga", emoji: "🦗", label: "Pulga" },
];

export default function PestSelector({ value, onChange, readOnly = false }) {
    return (
        <div>
            <div className="pest-grid">
                {PESTS.map((pest) => (
                    <button
                        key={pest.id}
                        type="button"
                        disabled={readOnly}
                        className={`pest-card${value === pest.id ? " selected" : ""}`}
                        onClick={() => onChange(pest.id)}
                    >
                        <span className="pest-emoji">{pest.emoji}</span>
                        <span>{pest.label}</span>
                    </button>
                ))}
            </div>

            {/* Custom input for unlisted pests */}
            <div className="mt-3">
                <label className="label">Otro tipo de plaga (escribir)</label>
                <input
                    className="input"
                    placeholder="Escribe si no está en la lista…"
                    value={!PESTS.find((p) => p.id === value) ? value : ""}
                    readOnly={readOnly}
                    onChange={(e) => onChange(e.target.value)}
                />
            </div>
        </div>
    );
}
