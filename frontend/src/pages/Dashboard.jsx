import { useEffect, useMemo, useState } from "react";
import { apiFetch, clearToken } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function Dashboard() {
  const nav = useNavigate();
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

  function logout() {
    clearToken();
    localStorage.removeItem("pulsecrm_tenant");
    nav("/login");
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Dashboard</h1>
          <small style={{ color: "#555" }}>
            Tenant: <b>{tenantId || "(vazio)"}</b>
          </small>
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/leads"><button style={{ padding: "10px 12px" }}>Leads</button></Link>
          <button onClick={logout} style={{ padding: "10px 12px" }}>Sair</button>
        </div>
      </div>

      <hr style={{ margin: "16px 0" }} />

      {err ? <pre style={{ color: "crimson" }}>{err}</pre> : null}
      {loading && !stats ? <p>Carregando...</p> : null}

      {stats ? (
        <>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(5, minmax(0, 1fr))", gap: 12 }}>
            <Card title="Total" value={stats.total} />
            <Card title="New" value={statusMap.New || 0} />
            <Card title="Contacted" value={statusMap.Contacted || 0} />
            <Card title="Qualified" value={statusMap.Qualified || 0} />
            <Card title="Lost" value={statusMap.Lost || 0} />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: 12, marginTop: 12 }}>
            <div style={panel}>
              <h3 style={{ marginTop: 0 }}>Últimos Leads</h3>
              {stats.latest?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {stats.latest.map((x) => (
                    <li key={x.id} style={{ marginBottom: 6 }}>
                      <b>{x.name}</b> — {x.status} — {x.source || "-"}{" "}
                      <small style={{ color: "#666" }}>
                        ({new Date(x.createdAtUtc).toLocaleString()})
                      </small>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhum lead ainda.</p>
              )}
            </div>

            <div style={panel}>
              <h3 style={{ marginTop: 0 }}>Top Sources</h3>
              {stats.topSources?.length ? (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {stats.topSources.map((s) => (
                    <li key={s.source}>
                      <b>{s.source}</b> — {s.count}
                    </li>
                  ))}
                </ul>
              ) : (
                <p>Nenhuma source cadastrada.</p>
              )}
            </div>
          </div>
        </>
      ) : null}
    </div>
  );
}

function Card({ title, value }) {
  return (
    <div style={card}>
      <div style={{ color: "#666", fontSize: 12 }}>{title}</div>
      <div style={{ fontSize: 26, fontWeight: "bold" }}>{value}</div>
    </div>
  );
}

const card = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 12,
};

const panel = {
  border: "1px solid #ddd",
  borderRadius: 10,
  padding: 12,
};