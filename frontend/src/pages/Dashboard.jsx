import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import LogoutButton from "../components/LogoutButton";
import { apiFetch } from "../lib/api";

function Card({ title, value }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
    </div>
  );
}

export default function Dashboard() {
  const tenantId = localStorage.getItem("pulsecrm_tenant") || "";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      setErr("");
      try {
        const r = await apiFetch("/leads/stats", { tenantId });
        setStats(r);
      } catch (e) {
        setErr(String(e.message || e));
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const statusMap = useMemo(() => {
    const m = {};
    if (stats?.byStatus) {
      for (const s of stats.byStatus) m[s.status] = s.count;
    }
    return m;
  }, [stats]);

  return (
    <AppShell title="Dashboard" subtitle={`Tenant: ${tenantId}`} right={<LogoutButton />}>
      {err ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      {loading && !stats ? (
        <div className="text-sm text-slate-500">Carregando...</div>
      ) : null}

      {stats ? (
        <>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-5">
            <Card title="Total" value={stats.total} />
            <Card title="New" value={statusMap.New || 0} />
            <Card title="Contacted" value={statusMap.Contacted || 0} />
            <Card title="Qualified" value={statusMap.Qualified || 0} />
            <Card title="Lost" value={statusMap.Lost || 0} />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-[1.2fr_0.8fr]">
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">
                Últimos Leads
              </div>
              <div className="mt-3">
                {stats.latest?.length ? (
                  <ul className="space-y-2">
                    {stats.latest.map((x) => (
                      <li key={x.id} className="rounded-xl bg-slate-50 p-3">
                        <div className="font-semibold text-slate-900">
                          {x.name}
                        </div>
                        <div className="mt-1 text-sm text-slate-600">
                          {x.status} • {x.source || "-"} •{" "}
                          {new Date(x.createdAtUtc).toLocaleString("pt-BR")}
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">
                    Nenhum lead ainda.
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
              <div className="text-sm font-semibold text-slate-900">
                Top Sources
              </div>
              <div className="mt-3">
                {stats.topSources?.length ? (
                  <ul className="space-y-2">
                    {stats.topSources.map((s) => (
                      <li
                        key={s.source}
                        className="flex items-center justify-between rounded-xl bg-slate-50 p-3"
                      >
                        <div className="font-medium text-slate-900">
                          {s.source}
                        </div>
                        <div className="text-sm text-slate-600">{s.count}</div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <div className="text-sm text-slate-500">
                    Nenhuma source cadastrada.
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      ) : null}
    </AppShell>
  );
}