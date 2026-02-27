import { useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { apiFetch, clearToken } from "../lib/api";
import { Link, useNavigate } from "react-router-dom";

export default function Kanban() {
  const nav = useNavigate();
  const tenantId = localStorage.getItem("pulsecrm_tenant") || "";

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);

  // criar deal
  const [newDeal, setNewDeal] = useState({ title: "", company: "", amount: "", stageId: "" });

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const s = await apiFetch("/pipeline/stages", { tenantId });
      setStages(s);

      const d = await apiFetch("/deals", { tenantId });
      setDeals(d);

      // default stage para criar deal
      if (!newDeal.stageId && s?.length) {
        setNewDeal((p) => ({ ...p, stageId: s[0].id }));
      }
    } catch (e) {
      setErr(String(e.message || e));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const dealsByStage = useMemo(() => {
    const m = new Map();
    for (const st of stages) m.set(st.id, []);
    for (const d of deals) {
      if (!m.has(d.stageId)) m.set(d.stageId, []);
      m.get(d.stageId).push(d);
    }
    return m;
  }, [stages, deals]);

  const totals = useMemo(() => {
    const open = deals.filter((d) => d.status === "Open");
    const won = deals.filter((d) => d.status === "Won");
    const lost = deals.filter((d) => d.status === "Lost");

    return {
      openCount: open.length,
      wonCount: won.length,
      lostCount: lost.length,
      openSum: sumAmount(open),
      wonSum: sumAmount(won),
      lostSum: sumAmount(lost),
    };
  }, [deals]);

  function logout() {
    clearToken();
    localStorage.removeItem("pulsecrm_tenant");
    nav("/login");
  }

  async function onDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const toStageId = String(over.id);

    const deal = deals.find((x) => x.id === dealId);
    if (!deal) return;

    if (deal.stageId === toStageId) return;

    // otimismo leve: atualiza UI antes, e se falhar, recarrega
    setDeals((prev) => prev.map((x) => (x.id === dealId ? { ...x, stageId: toStageId } : x)));

    try {
      await apiFetch(`/deals/${dealId}/move`, {
        tenantId,
        method: "PATCH",
        body: JSON.stringify({ toStageId }),
      });
    } catch (e) {
      setErr(String(e.message || e));
      await loadAll();
    }
  }

  async function createDeal(e) {
    e.preventDefault();
    setErr("");

    if (!newDeal.stageId) {
      setErr("Escolha uma coluna (stage).");
      return;
    }
    if (!newDeal.title.trim()) {
      setErr("Título é obrigatório.");
      return;
    }

    const amountNum =
      newDeal.amount.trim() === "" ? null : Number(String(newDeal.amount).replace(",", "."));

    if (amountNum !== null && Number.isNaN(amountNum)) {
      setErr("Amount inválido.");
      return;
    }

    try {
      await apiFetch("/deals", {
        tenantId,
        method: "POST",
        body: JSON.stringify({
          stageId: newDeal.stageId,
          title: newDeal.title.trim(),
          company: newDeal.company.trim() || null,
          amount: amountNum,
        }),
      });

      setNewDeal((p) => ({ ...p, title: "", company: "", amount: "" }));
      await loadAll();
    } catch (e) {
      setErr(String(e.message || e));
    }
  }

  return (
    <div style={{ fontFamily: "Arial", padding: 24 }}>
      <TopBar tenantId={tenantId} onLogout={logout} />

      {err ? <pre style={{ color: "crimson", marginTop: 12 }}>{err}</pre> : null}

      <div style={{ marginTop: 12, padding: 12, border: "1px solid #ddd", borderRadius: 10 }}>
        <h3 style={{ marginTop: 0 }}>Novo Deal</h3>
        <form
          onSubmit={createDeal}
          style={{ display: "grid", gridTemplateColumns: "2fr 1.5fr 1fr 1.2fr auto", gap: 10 }}
        >
          <input
            value={newDeal.title}
            onChange={(e) => setNewDeal((p) => ({ ...p, title: e.target.value }))}
            placeholder="Título (ex: Plano anual - Empresa X)"
            style={{ padding: 10 }}
          />
          <input
            value={newDeal.company}
            onChange={(e) => setNewDeal((p) => ({ ...p, company: e.target.value }))}
            placeholder="Empresa"
            style={{ padding: 10 }}
          />
          <input
            value={newDeal.amount}
            onChange={(e) => setNewDeal((p) => ({ ...p, amount: e.target.value }))}
            placeholder="Valor (ex: 25000)"
            style={{ padding: 10 }}
          />
          <select
            value={newDeal.stageId}
            onChange={(e) => setNewDeal((p) => ({ ...p, stageId: e.target.value }))}
            style={{ padding: 10 }}
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button style={{ padding: 10 }} disabled={loading}>
            Criar
          </button>
        </form>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12, marginTop: 12 }}>
        <div style={miniCard}>
          <div style={{ color: "#666", fontSize: 12 }}>Forecast (Open)</div>
          <div style={{ fontSize: 22, fontWeight: "bold" }}>{brl(totals.openSum)}</div>
          <small style={{ color: "#666" }}>{totals.openCount} deals</small>
        </div>

        <div style={miniCard}>
          <div style={{ color: "#666", fontSize: 12 }}>Ganho (Won)</div>
          <div style={{ fontSize: 22, fontWeight: "bold" }}>{brl(totals.wonSum)}</div>
          <small style={{ color: "#666" }}>{totals.wonCount} deals</small>
        </div>

        <div style={miniCard}>
          <div style={{ color: "#666", fontSize: 12 }}>Perdido (Lost)</div>
          <div style={{ fontSize: 22, fontWeight: "bold" }}>{brl(totals.lostSum)}</div>
          <small style={{ color: "#666" }}>{totals.lostCount} deals</small>
        </div>
      </div>

      <div style={{ marginTop: 12 }}>
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div style={board}>
            {stages.map((s) => {
              const list = dealsByStage.get(s.id) || [];
              return (
                <StageColumn
                  key={s.id}
                  stage={s}
                  deals={list}
                  sum={sumAmount(list)}
                />
              );
            })}
          </div>
        </DndContext>
      </div>
    </div>
  );
}

function TopBar({ tenantId, onLogout }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 }}>
      <div>
        <h1 style={{ margin: 0 }}>Kanban</h1>
        <small style={{ color: "#555" }}>
          Tenant: <b>{tenantId || "(vazio)"}</b>
        </small>
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <Link to="/dashboard">
          <button style={{ padding: "10px 12px" }}>Dashboard</button>
        </Link>
        <Link to="/leads">
          <button style={{ padding: "10px 12px" }}>Leads</button>
        </Link>
        <button onClick={onLogout} style={{ padding: "10px 12px" }}>
          Sair
        </button>
      </div>
    </div>
  );
}

function StageColumn({ stage, deals, sum }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      style={{
        ...column,
        outline: isOver ? "2px solid #333" : "1px solid #ddd",
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", gap: 10 }}>
        <div>
          <h3 style={{ margin: 0 }}>{stage.name}</h3>
          <small style={{ color: "#666" }}>
            {deals.length} deals • {brl(sum)}
          </small>
        </div>
      </div>

      <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} />
        ))}
      </div>
    </div>
  );
}

function DealCard({ deal }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = {
    ...card,
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.6 : 1,
    cursor: "grab",
  };

  return (
    <div ref={setNodeRef} style={style} {...listeners} {...attributes}>
      <div style={{ fontWeight: "bold" }}>{deal.title}</div>
      <div style={{ color: "#555", marginTop: 4 }}>{deal.company || "-"}</div>
      <div style={{ color: "#111", marginTop: 6 }}>
        {deal.amount == null ? "—" : `R$ ${Number(deal.amount).toLocaleString("pt-BR")}`}
      </div>
      <small style={{ color: "#777" }}>
        Atualizado: {new Date(deal.updatedAtUtc).toLocaleString("pt-BR")}
      </small>
    </div>
  );
}

function sumAmount(list) {
  return list.reduce((acc, d) => acc + (d.amount == null ? 0 : Number(d.amount)), 0);
}

function brl(n) {
  return `R$ ${Number(n || 0).toLocaleString("pt-BR")}`;
}

const board = {
  display: "grid",
  gridTemplateColumns: "repeat(6, minmax(260px, 1fr))",
  gap: 12,
  overflowX: "auto",
  paddingBottom: 8,
};

const column = {
  minHeight: 200,
  background: "#fafafa",
  borderRadius: 12,
  padding: 12,
};

const card = {
  background: "white",
  border: "1px solid #e6e6e6",
  borderRadius: 12,
  padding: 12,
  boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
};

const miniCard = {
  border: "1px solid #ddd",
  borderRadius: 12,
  padding: 12,
  background: "white",
};