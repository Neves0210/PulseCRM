import { useState } from "react";
import { apiFetch, setToken } from "../lib/api";
import { useNavigate } from "react-router-dom";

const DEFAULT_TENANT = import.meta.env.VITE_TENANT_ID || "";

export default function Login() {
  const nav = useNavigate();

  const [tenantId, setTenantId] = useState(DEFAULT_TENANT);
  const [email, setEmail] = useState("gabriel@demo.com");
  const [password, setPassword] = useState("Admin@123");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const r = await apiFetch("/auth/login", {
        tenantId,
        auth: false,
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      setToken(r.access_token);
      localStorage.setItem("pulsecrm_tenant", tenantId);

      nav("/leads");
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 24, maxWidth: 520 }}>
      <h1>Login</h1>

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 12 }}>
        <label>
          TenantId
          <input
            value={tenantId}
            onChange={(e) => setTenantId(e.target.value)}
            style={{ width: "100%", padding: 10 }}
            placeholder="GUID do tenant"
          />
        </label>

        <label>
          Email
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <label>
          Senha
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: 10 }}
          />
        </label>

        <button disabled={loading} style={{ padding: 12 }}>
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {error ? <pre style={{ color: "crimson" }}>{error}</pre> : null}
      </form>
    </div>
  );
}