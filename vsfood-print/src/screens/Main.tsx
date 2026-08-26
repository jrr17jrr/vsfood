import { useEffect, useState } from "react";
import {
  disconnectDevice,
  getSettings,
  listPrinters,
  onConnectionStatus,
  onJobFailed,
  onJobPrinted,
  onPrinterStatus,
  printTestPage,
  selectPrinter,
  setAutoPrint,
  setAutoStart,
  type PrinterInfo,
} from "../lib/tauri";

type LastOrder = { number: string; status: "printed" | "failed"; at: string; message?: string };

export function Main({
  restaurantName,
  onOpenHistory,
  onDisconnected,
}: {
  restaurantName: string;
  onOpenHistory: () => void;
  onDisconnected: () => void;
}) {
  const [online, setOnline] = useState(true);
  const [printerAvailable, setPrinterAvailable] = useState(true);
  const [printers, setPrinters] = useState<PrinterInfo[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [pickingPrinter, setPickingPrinter] = useState(false);
  const [autoPrint, setAutoPrintState] = useState(false);
  const [autoStart, setAutoStartState] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<string | null>(null);
  const [lastOrder, setLastOrder] = useState<LastOrder | null>(null);

  useEffect(() => {
    (async () => {
      const settings = await getSettings();
      setSelected(settings.selectedPrinter);
      setAutoPrintState(settings.autoPrint);
      setAutoStartState(settings.autoStart);
      setPrinterAvailable(settings.printerAvailable);
    })();

    const unlisten1 = onConnectionStatus(setOnline);
    const unlisten2 = onPrinterStatus(setPrinterAvailable);
    const unlisten3 = onJobPrinted((number) => setLastOrder({ number, status: "printed", at: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) }));
    const unlisten4 = onJobFailed(({ number, error }) =>
      setLastOrder({ number, status: "failed", at: new Date().toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }), message: error }),
    );

    return () => {
      unlisten1.then((f) => f());
      unlisten2.then((f) => f());
      unlisten3.then((f) => f());
      unlisten4.then((f) => f());
    };
  }, []);

  async function openPrinterPicker() {
    setPickingPrinter((v) => !v);
    if (printers.length === 0) setPrinters(await listPrinters());
  }

  async function handleSelectPrinter(name: string) {
    setSelected(name);
    setPickingPrinter(false);
    await selectPrinter(name);
  }

  async function handleTestPrint() {
    setTesting(true);
    setTestResult(null);
    try {
      await printTestPage();
      setTestResult("Página de teste enviada.");
    } catch (e) {
      setTestResult(String(e));
    } finally {
      setTesting(false);
    }
  }

  async function handleToggleAutoPrint(value: boolean) {
    setAutoPrintState(value);
    await setAutoPrint(value);
  }

  async function handleToggleAutoStart(value: boolean) {
    setAutoStartState(value);
    await setAutoStart(value);
  }

  async function handleDisconnect() {
    await disconnectDevice();
    onDisconnected();
  }

  return (
    <div className="app">
      <div className="brand">
        <div className="brand-mark">V</div>
        <span className="brand-title">
          VSFood<span style={{ color: "var(--primary)" }}>Print</span>
        </span>
      </div>

      <div className="status-row">
        <span className={`dot ${online ? "online" : "offline"}`} />
        {online ? "Conectado" : "Sem conexão com o VSFood"}
      </div>

      <div className="card">
        <span className="restaurant-name">{restaurantName}</span>
      </div>

      <div className="card">
        <span className="card-title">Impressora</span>
        <div className="row">
          <div>
            <p className="label">{selected ?? "Nenhuma selecionada"}</p>
            <p className="sublabel">
              {!selected ? "Escolha uma impressora abaixo" : printerAvailable ? "Status: Pronta" : "Impressora indisponível"}
            </p>
          </div>
          {!printerAvailable && selected && <span className="pill warn">Indisponível</span>}
        </div>

        {pickingPrinter && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {printers.length === 0 && <p className="sublabel">Nenhuma impressora encontrada no Windows.</p>}
            {printers.map((p) => (
              <button key={p.name} className="btn" onClick={() => handleSelectPrinter(p.name)}>
                {p.name} {p.isDefault ? "(padrão)" : ""}
              </button>
            ))}
          </div>
        )}

        <div style={{ display: "flex", gap: 8 }}>
          <button className="btn" style={{ flex: 1 }} onClick={openPrinterPicker}>
            Alterar impressora
          </button>
          <button className="btn" style={{ flex: 1 }} onClick={handleTestPrint} disabled={!selected || testing}>
            {testing ? "Imprimindo..." : "Imprimir teste"}
          </button>
        </div>
        {testResult && <p className="sublabel">{testResult}</p>}
      </div>

      <div className="card">
        <span className="card-title">Automação</span>
        <div className="row">
          <div>
            <p className="label">Imprimir pedidos automaticamente</p>
          </div>
          <button className={`switch ${autoPrint ? "on" : ""}`} onClick={() => handleToggleAutoPrint(!autoPrint)} />
        </div>
        <div className="row">
          <div>
            <p className="label">Iniciar com o Windows</p>
          </div>
          <button className={`switch ${autoStart ? "on" : ""}`} onClick={() => handleToggleAutoStart(!autoStart)} />
        </div>
      </div>

      <div className="card">
        <span className="card-title">Último pedido</span>
        {lastOrder ? (
          <div className="row">
            <p className="label">#{lastOrder.number}</p>
            <span className={`pill ${lastOrder.status === "printed" ? "ok" : "warn"}`}>
              {lastOrder.status === "printed" ? `Impresso às ${lastOrder.at} ✓` : `Falhou às ${lastOrder.at} ⚠`}
            </span>
          </div>
        ) : (
          <p className="sublabel">Nenhum pedido ainda.</p>
        )}
      </div>

      <div style={{ display: "flex", justifyContent: "space-between" }}>
        <button className="link" onClick={onOpenHistory}>
          Ver histórico
        </button>
        <button className="link" onClick={handleDisconnect}>
          Desconectar
        </button>
      </div>

      <p className="footer-version">VSFood Print v0.1.0</p>
    </div>
  );
}
