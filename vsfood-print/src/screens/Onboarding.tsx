export function Onboarding({ onStart }: { onStart: () => void }) {
  return (
    <div className="center-screen">
      <div className="brand-mark" style={{ width: 56, height: 56, borderRadius: 16, fontSize: 24 }}>
        V
      </div>
      <div>
        <h1 style={{ fontSize: 20, fontWeight: 700, margin: 0 }}>Bem-vindo ao VSFood Print</h1>
        <p style={{ color: "var(--muted)", fontSize: 14, marginTop: 8, maxWidth: 320 }}>
          Conecte este computador à sua loja para começar a imprimir pedidos automaticamente.
        </p>
      </div>
      <button className="btn btn-primary" style={{ padding: "12px 28px", fontSize: 14 }} onClick={onStart}>
        Conectar minha loja
      </button>
    </div>
  );
}
