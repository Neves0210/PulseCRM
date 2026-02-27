import { useEffect, useMemo, useState } from "react";
import AppShell from "../components/AppShell";
import LogoutButton from "../components/LogoutButton";
import Badge from "../components/Badge";
import { apiFetch, clearToken } from "../lib/api";
import { useNavigate } from "react-router-dom";

function toneFromStatus(status) {
  if (status === "Qualified") return "success";
  if (status === "Lost") return "danger";
  if (status === "Contacted") return "warning";
  return "neutral";
}

export default function Leads() {
  const nav = useNavigate();
  const tenantId = localStorage.getItem("pulsecrm_tenant") || "";

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [source, setSource] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [data, setData] = useState({ total: 0, page: 1, pageSize: 10, items: [] });

  const [newLead, setNewLead] = useState({
    name: "",
    email: "",
    phone: "",
    status: "New",
    source: "",
  });

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

  function logout() {
    clearToken();
    localStorage.removeItem("pulsecrm_tenant");
    nav("/login");
  }

  return (
    <AppShell title="Leads" subtitle={`Tenant: ${tenantId}`} right={<LogoutButton />}>
      {err ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      {/* filtros */}
      <form onSubmit={onApplyFilters} className="grid grid-cols-1 gap-3 md:grid-cols-[2fr_1fr_1fr_auto]">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome, email ou telefone..."
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        />

        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        >
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
          className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
        />

        <button
          disabled={loading}
          className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? "..." : "Aplicar"}
        </button>
      </form>

      {/* novo lead */}
      <div className="mt-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Novo Lead</div>
        <form
          onSubmit={onCreateLead}
          className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[2fr_2fr_1.5fr_1fr_1.5fr_auto]"
        >
          <input
            value={newLead.name}
            onChange={(e) => setNewLead((p) => ({ ...p, name: e.target.value }))}
            placeholder="Nome"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={newLead.email}
            onChange={(e) => setNewLead((p) => ({ ...p, email: e.target.value }))}
            placeholder="Email"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={newLead.phone}
            onChange={(e) => setNewLead((p) => ({ ...p, phone: e.target.value }))}
            placeholder="Telefone"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <select
            value={newLead.status}
            onChange={(e) => setNewLead((p) => ({ ...p, status: e.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
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
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <button className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800">
            Criar
          </button>
        </form>
      </div>

      {/* tabela */}
      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
          <div className="text-sm text-slate-700">
            Total: <b className="text-slate-900">{data.total}</b>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">PageSize</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPage(1);
                setPageSize(Number(e.target.value));
              }}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            >
              <option value={5}>5</option>
              <option value={10}>10</option>
              <option value={20}>20</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-[900px] w-full">
            <thead className="bg-slate-50">
              <tr>
                {["Nome", "Email", "Telefone", "Status", "Source", "Criado em"].map((h) => (
                  <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-600">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-sm text-slate-500">
                    Carregando...
                  </td>
                </tr>
              ) : data.items.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-6 text-sm text-slate-500">
                    Nenhum lead encontrado.
                  </td>
                </tr>
              ) : (
                data.items.map((x) => (
                  <tr key={x.id} className="border-t border-slate-100">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">{x.name}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{x.email || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">{x.phone || "-"}</td>
                    <td className="px-4 py-3 text-sm">
                      <Badge tone={toneFromStatus(x.status)}>{x.status}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm text-slate-600">{x.source || "-"}</td>
                    <td className="px-4 py-3 text-sm text-slate-600">
                      {new Date(x.createdAtUtc).toLocaleString("pt-BR")}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* paginação */}
        <div className="flex items-center justify-between border-t border-slate-200 p-4">
          <button
            disabled={page <= 1 || loading}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            ◀ Anterior
          </button>

          <div className="text-sm text-slate-600">
            Página <b className="text-slate-900">{page}</b> de{" "}
            <b className="text-slate-900">{totalPages}</b>
          </div>

          <button
            disabled={page >= totalPages || loading}
            onClick={() => setPage((p) => p + 1)}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-60"
          >
            Próxima ▶
          </button>
        </div>
      </div>
    </AppShell>
  );
}