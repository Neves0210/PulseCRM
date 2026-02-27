import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");
const TENANT_ID = import.meta.env.VITE_TENANT_ID || "";

export default function App() {
  const [apiStatus, setApiStatus] = useState("...");
  const [apiError, setApiError] = useState("");

  useEffect(() => {
    async function run() {
      try {
        setApiError("");
        const r = await fetch(`${API_URL}/health`, {
          headers: {
            // health no seu backend é público, mas deixar não atrapalha
            ...(TENANT_ID ? { "X-Tenant-Id": TENANT_ID } : {}),
          },
        });

        if (!r.ok) {
          setApiStatus("ERRO");
          setApiError(`HTTP ${r.status}`);
          return;
        }

        setApiStatus("OK");
      } catch (e) {
        setApiStatus("ERRO");
        setApiError(String(e?.message || e));
      }
    }

    if (!API_URL) {
      setApiStatus("ERRO");
      setApiError("VITE_API_URL não configurado");
      return;
    }

    run();
  }, []);

  return (
    <div style={{ fontFamily: "Arial", padding: 24 }}>
      <h1>PulseCRM</h1>
      <p>API: {API_URL || "(vazio)"}</p>
      <p>Tenant: {TENANT_ID || "(vazio)"}</p>
      <p>Health: {apiStatus}</p>
      {apiError ? <pre>{apiError}</pre> : null}
    </div>
  );
}