import { useEffect, useState } from "react";

const API_URL = (import.meta.env.VITE_API_URL || "http://localhost:5000").replace(/\/+$/, "");

export default function App() {
  const [apiStatus, setApiStatus] = useState("...");

  useEffect(() => {
    fetch(`${API_URL}/health`)
      .then((r) => (r.ok ? "OK" : "ERRO"))
      .then(setApiStatus)
      .catch(() => setApiStatus("ERRO"));
  }, []);

  return (
    <div style={{ fontFamily: "Arial", padding: 24 }}>
      <h1>PulseCRM</h1>
      <p>API: {API_URL}</p>
      <p>Health: {apiStatus}</p>
    </div>
  );
}