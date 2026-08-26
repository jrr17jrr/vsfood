import { useEffect, useState } from "react";
import { getHistory, type HistoryEntry } from "../lib/tauri";

export function History({ onBack }: { onBack: () => void }) {
  const [entries, setEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    getHistory().then(setEntries);
  }, []);

  return (
    <div className="app">
      <div className="brand">
        <button className="link" onClick={onBack}>
          ← Voltar
        </button>
      </div>
      <h1 style={{ fontSize: 16, fontWeight: 700, margin: 0 }}>Histórico</h1>
      <div className="card">
        <span className="card-title">Últimas impressões</span>
        <div className="history-list">
          {entries.length === 0 && <p className="sublabel">Nenhuma impressão ainda.</p>}
          {entries.map((entry, i) => (
            <div key={i} className="history-item">
              <span>#{entry.orderNumber}</span>
              <span className={`pill ${entry.status === "printed" ? "ok" : "warn"}`}>
                {entry.status === "printed" ? "Impresso ✓" : "Falhou ⚠"}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
