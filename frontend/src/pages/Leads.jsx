import { useEffect, useMemo, useState } from "react";
import { apiFetch, clearToken } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Leads() {
  const nav = useNavigate();
  const tenantId = localStorage.getItem("pulsecrm_tenant") || "";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  // filtros/paginação
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState({ total: 0, page: 1, pageSize: 10, items: [] });

  // criar lead
  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    status: "New",
    source: "",
  });

  const [editingId, setEditingId] = useState(null);
  const [editLead, setEditLead] = useState({ name: "", email: "", phone: "", status: "New", source: "" });

  const totalPages = useMemo(() => {
    return Math.max(1, Math.ceil((data.total || 0) / (data.pageSize || pageSize)));
  }, [data.total, data.pageSize, pageSize]);

  async function load() {
    setLoading(true);
    setErr("");

    try {
      const qs = new URLSearchParams();
      qs.set("page", String(page));
      qs.set("pageSize", String(pageSize));
      if (search.trim()) qs.set("search", search.trim());
      if (status) qs.set("status", status);
      if (source.trim()) qs.set("source", source.trim());

      const r = await apiFetch(`/leads?${qs.toString()}`, { tenantId });
      setData(r);
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, pageSize]);

  function logout() {
    clearToken();
    localStorage.removeItem("pulsecrm_tenant");
    nav("/login");
  }

  function startEdit(lead) {
    setEditingId(lead.id);
    setEditLead({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        status: lead.status || "New",
        source: lead.source || "",
    });
 }

 async function saveEdit() {
   setErr("");
   if (!editingId) return;

   if (!editLead.name.trim()) {
       setErr("Nome é obrigatório.");
       return;
   }

   try {
       await apiFetch(`/leads/${editingId}`, {
       tenantId,
       method: "PUT",
       body: JSON.stringify({
           name: editLead.name.trim(),
           email: editLead.email.trim() || null,
           phone: editLead.phone.trim() || null,
           status: editLead.status || "New",
           source: editLead.source.trim() || null,
           ownerUserId: null,
       }),
      });

       setEditingId(null);
       await load();
   } catch (e) {
       setErr(String(e.message || e));
   }
  }

    async function removeLead(id) {
    const ok = confirm("Tem certeza que deseja excluir este lead?");
    if (!ok) return;

   try {
       await apiFetch(`/leads/${id}`, { tenantId, method: "DELETE" });
       await load();
   } catch (e) {
       setErr(String(e.message || e));
   }
 }

  async function onApplyFilters(e) {
    e.preventDefault();
    setPage(1);
    await load();
  }

  async function onCreateLead(e) {
    e.preventDefault();
    setErr("");

    if (!newLead.name.trim()) {
      setErr("Nome é obrigatório.");
      return;
    }

    try {
      await apiFetch("/leads", {
        tenantId,
        method: "POST",
        body: JSON.stringify({
          name: newLead.name.trim(),
          email: newLead.email.trim() || null,
          phone: newLead.phone.trim() || null,
          status: newLead.status || "New",
          source: newLead.source.trim() || null,
          ownerUserId: null,
        }),
      });

      setNewLead({ name: "", email: "", phone: "", status: "New", source: "" });
      setPage(1);
      await load();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
        <div>
          <h1 style={{ margin: 0 }}>Leads</h1>
          <small style={{ color: "#555" }}>
            Tenant: <b>{tenantId || "(vazio)"}</b>
          </small>
        </div>
        <button onClick={logout} style={{ padding: "10px 12px" }}>Sair</button>
      </div>

      <hr style={{ margin: "16px 0" }} />

      {/* Filtros */}
      <form onSubmit={onApplyFilters} style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr auto", gap: 12 }}>
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou telefone..."
          style={{ padding: 10 }}
        />

        <select value={status} onChange={(e) => setStatus(e.target.value)} style={{ padding: 10 }}>
          <option value="">Status (todos)</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Lost">Lost</option>
        </select>

        <input
          value={source}
          onChange={(e) => setSource(e.target.value)}
          placeholder="Source (ex: Instagram)"
          style={{ padding: 10 }}
        />

        <button style={{ padding: 10 }} disabled={loading}>
          {loading ? "..." : "Aplicar"}
        </button>
      </form>

      {err ? <pre style={{ color: "crimson", marginTop: 12 }}>{err}</pre> : null}

      {/* Criar lead */}
      <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
        <h3 style={{ marginTop: 0 }}>Novo Lead</h3>

        <form onSubmit={onCreateLead} style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1.5fr auto", gap: 10 }}>
          <input
            value={newLead.name}
            onChange={(e) => setNewLead((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nome"
            style={{ padding: 10 }}
          />
          <input
            value={newLead.email}
            onChange={(e) => setNewLead((p) => ({ ...p, email: e.target.value }))}
            placeholder="Email"
            style={{ padding: 10 }}
          />
          <input
            value={newLead.phone}
            onChange={(e) => setNewLead((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Telefone"
            style={{ padding: 10 }}
          />
          <select
            value={newLead.status}
            onChange={(e) => setNewLead((p) => ({ ...p, status: e.target.value }))}
            style={{ padding: 10 }}
          >
            <option value="New">New</option>
            <option value="Contacted">Contacted</option>
            <option value="Qualified">Qualified</option>
            <option value="Lost">Lost</option>
          </select>
          <input
            value={newLead.source}
            onChange={(e) => setNewLead((p) => ({ ...p, source: e.target.value }))}
            placeholder="Source"
            style={{ padding: 10 }}
          />
          <button style={{ padding: 10 }}>Criar</button>
        </form>
      </div>

      {/* Tabela */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
          <p style={{ margin: 0 }}>
            Total: <b>{data.total}</b>
          </p>

          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <small>PageSize</small>
            <select value={pageSize} onChange={(e) => { setPage(1); setPageSize(Number(e.target.value)); }} style={{ padding: 8 }}>
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 10 }}>
          <thead>
            <tr>
              {["Nome", "Email", "Telefone", "Status", "Source", "Criado em", "Ações"].map((h) => (
                <th key={h} style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "10px 8px" }}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} style={{ padding: 12 }}>Carregando...</td></tr>
            ) : data.items.length === 0 ? (
              <tr><td colSpan={7} style={{ padding: 12 }}>Nenhum lead encontrado.</td></tr>
            ) : (
              data.items.map((x) => (
                <tr key={x.id}>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}><b>{x.name}</b></td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>{x.email || "-"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>{x.phone || "-"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>{x.status}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>{x.source || "-"}</td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>
                    {new Date(x.createdAtUtc).toLocaleString()}
                  </td>
                  <td style={{ padding: "10px 8px", borderBottom: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", gap: 8 }}>
                        <button onClick={() => startEdit(x)} style={{ padding: "6px 8px" }}>Editar</button>
                        <button onClick={() => removeLead(x.id)} style={{ padding: "6px 8px" }}>Excluir</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        
        {editingId ? (
            <div style={{ marginTop: 16, padding: 12, border: "1px solid #ddd", borderRadius: 8 }}>
                <h3 style={{ marginTop: 0 }}>Editar Lead</h3>

                <div style={{ display: "grid", gridTemplateColumns: "2fr 2fr 1.5fr 1fr 1.5fr auto auto", gap: 10 }}>
                <input value={editLead.name} onChange={(e) => setEditLead(p => ({ ...p, name: e.target.value }))} placeholder="Nome" style={{ padding: 10 }} />
                <input value={editLead.email} onChange={(e) => setEditLead(p => ({ ...p, email: e.target.value }))} placeholder="Email" style={{ padding: 10 }} />
                <input value={editLead.phone} onChange={(e) => setEditLead(p => ({ ...p, phone: e.target.value }))} placeholder="Telefone" style={{ padding: 10 }} />
                <select value={editLead.status} onChange={(e) => setEditLead(p => ({ ...p, status: e.target.value }))} style={{ padding: 10 }}>
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Lost">Lost</option>
                </select>
                <input value={editLead.source} onChange={(e) => setEditLead(p => ({ ...p, source: e.target.value }))} placeholder="Source" style={{ padding: 10 }} />

                <button onClick={saveEdit} style={{ padding: 10 }}>Salvar</button>
                <button onClick={() => setEditingId(null)} style={{ padding: 10 }}>Cancelar</button>
                </div>
            </div>
        ) : null}

        {/* Paginação */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 12 }}>
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            style={{ padding: "8px 10px" }}
          >
            ◀ Anterior
          </button>

          <div>
            Página <b>{page}</b> de <b>{totalPages}</b>
          </div>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            style={{ padding: "8px 10px" }}
          >
            Próxima ▶
          </button>
        </div>
      </div>
    </div>
  );
}