import { useState } from "react";
import { pairDevice } from "../lib/tauri";

export function Pairing({ onConnected, onBack }: { onConnected: (restaurantName: string) => void; onBack: () => void }) {
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleConnect() {
    const digits = code.replace(/\D/g, "");
    if (digits.length !== 6) {
      setError("Digite o código de 6 dígitos mostrado no painel.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const session = await pairDevice(digits);
      onConnected(session.restaurantName);
    } catch (e) {
      setError(String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="center-screen">
      <div>
        <h1 style={{ fontSize: 18, fontWeight: 700, margin: 0 }}>Conectar dispositivo</h1>
        <p style={{ color: "var(--muted)", fontSize: 13, marginTop: 8, maxWidth: 300 }}>
          No VSFood web, abra <strong>Painel &gt; Impressão</strong> e clique em{" "}
          <strong>+ Conectar dispositivo</strong> para gerar o código.
        </p>
      </div>

      <input
        className="input-code"
        placeholder="000 000"
        inputMode="numeric"
        maxLength={7}
        value={code}
        onChange={(e) => setCode(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && handleConnect()}
        autoFocus
      />

      {error && <p className="error-text">{error}</p>}

      <button className="btn btn-primary btn-full" onClick={handleConnect} disabled={loading}>
        {loading ? "Conectando..." : "Conectar"}
      </button>
      <button className="link" onClick={onBack}>
        Voltar
      </button>
    </div>
  );
}
