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

      nav("/dashboard");
    } catch (err) {
      setError(String(err.message || err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto flex min-h-screen max-w-[1100px] items-center justify-center p-6">
        <div className="grid w-full grid-cols-1 gap-6 md:grid-cols-2">
          {/* Left */}
          <div className="hidden md:block">
            <div className="rounded-3xl bg-slate-900 p-8 text-white shadow-sm">
              <div className="text-2xl font-semibold">PulseCRM</div>
              <div className="mt-2 text-white/70">
                CRM multi-tenant com Dashboard, Leads e Pipeline Kanban.
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-medium">Stack</div>
                  <div className="mt-1 text-sm text-white/70">
                    React + Vite + Tailwind • ASP.NET Core • PostgreSQL • JWT
                  </div>
                </div>
                <div className="rounded-2xl bg-white/10 p-4">
                  <div className="text-sm font-medium">Dica</div>
                  <div className="mt-1 text-sm text-white/70">
                    Use o TenantId do ambiente e faça login para acessar o painel.
                  </div>
                </div>
              </div>

              <div className="mt-6 text-xs text-white/60">
                © {new Date().getFullYear()} PulseCRM
              </div>
            </div>
          </div>

          {/* Right */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
            <div className="text-xl font-semibold text-slate-900">Entrar</div>
            <div className="mt-1 text-sm text-slate-500">
              Acesse sua conta para abrir o painel.
            </div>

            <form onSubmit={onSubmit} className="mt-6 grid gap-4">
              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">
                  TenantId
                </span>
                <input
                  value={tenantId}
                  onChange={(e) => setTenantId(e.target.value)}
                  placeholder="GUID do tenant"
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">Email</span>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>

              <label className="grid gap-1">
                <span className="text-sm font-medium text-slate-700">Senha</span>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
                />
              </label>

              <button
                disabled={loading}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {loading ? "Entrando..." : "Entrar"}
              </button>

              {error ? (
                <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
                  {error}
                </div>
              ) : null}

              <div className="text-xs text-slate-500">
                Demo: <span className="font-medium">gabriel@demo.com</span> /{" "}
                <span className="font-medium">Admin@123</span>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}