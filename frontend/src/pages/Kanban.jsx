import { useEffect, useMemo, useState } from "react";
import { DndContext, PointerSensor, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { useDraggable } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";

import AppShell from "../components/AppShell";
import LogoutButton from "../components/LogoutButton";
import Badge from "../components/Badge";
import { apiFetch } from "../lib/api";

function sumAmount(list) {
  return list.reduce((acc, d) => acc + (d.amount == null ? 0 : Number(d.amount)), 0);
}

function brl(n) {
  return `R$ ${Number(n || 0).toLocaleString("pt-BR")}`;
}

function toneFromDealStatus(status) {
  if (status === "Won") return "success";
  if (status === "Lost") return "danger";
  return "neutral";
}

export default function Kanban() {
  const tenantId = localStorage.getItem("pulsecrm_tenant") || "";

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState("");

  const [stages, setStages] = useState([]);
  const [deals, setDeals] = useState([]);

  const [newDeal, setNewDeal] = useState({ title: "", company: "", amount: "", stageId: "" });

  // modal
  const [selectedDeal, setSelectedDeal] = useState(null);

  async function loadAll() {
    setLoading(true);
    setErr("");
    try {
      const s = await apiFetch("/pipeline/stages", { tenantId });
      setStages(s);

      const d = await apiFetch("/deals", { tenantId });
      setDeals(d);

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

  async function onDragEnd(event) {
    const { active, over } = event;
    if (!over) return;

    const dealId = String(active.id);
    const toStageId = String(over.id);

    const deal = deals.find((x) => x.id === dealId);
    if (!deal) return;
    if (deal.stageId === toStageId) return;

    // otimista
    setDeals((prev) => prev.map((x) => (x.id === dealId ? { ...x, stageId: toStageId } : x)));

    try {
      await apiFetch(`/deals/${dealId}/move`, {
        tenantId,
        method: "PATCH",
        body: JSON.stringify({ toStageId }),
      });

      // recarrega para status Open/Won/Lost refletir
      await loadAll();
    } catch (e) {
      setErr(String(e.message || e));
      await loadAll();
    }
  }

  async function createDeal(e) {
    e.preventDefault();
    setErr("");

    if (!newDeal.stageId) return setErr("Escolha uma coluna (stage).");
    if (!newDeal.title.trim()) return setErr("Título é obrigatório.");

    const amountNum =
      newDeal.amount.trim() === "" ? null : Number(String(newDeal.amount).replace(",", "."));

    if (amountNum !== null && Number.isNaN(amountNum)) return setErr("Valor inválido.");

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

  async function saveDealEdits({ id, title, company, amount }) {
    setErr("");

    // atualiza otimista no state
    setDeals((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, title, company: company || null, amount } : d
      )
    );

    try {
      await apiFetch(`/deals/${id}`, {
        tenantId,
        method: "PATCH",
        body: JSON.stringify({
          title,
          company, // pode ser "" para limpar, backend converte para null
          amount,  // pode ser null
        }),
      });
      await loadAll();
      setSelectedDeal(null);
    } catch (e) {
      setErr(String(e.message || e));
      await loadAll();
    }
  }

  async function deleteDeal(id) {
    setErr("");

    // otimista
    setDeals((prev) => prev.filter((d) => d.id !== id));

    try {
      await apiFetch(`/deals/${id}`, {
        tenantId,
        method: "DELETE",
      });
      await loadAll();
      setSelectedDeal(null);
    } catch (e) {
      setErr(String(e.message || e));
      await loadAll();
    }
  }

  return (
    <AppShell title="Pipeline" subtitle={`Tenant: ${tenantId}`} right={<LogoutButton />}>
      {err ? (
        <div className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
          {err}
        </div>
      ) : null}

      {/* Novo Deal */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="text-sm font-semibold text-slate-900">Novo Deal</div>

        <form
          onSubmit={createDeal}
          className="mt-3 grid grid-cols-1 gap-3 md:grid-cols-[2fr_1.5fr_1fr_1.2fr_auto]"
        >
          <input
            value={newDeal.title}
            onChange={(e) => setNewDeal((p) => ({ ...p, title: e.target.value }))}
            placeholder="Título (ex: Plano anual - Empresa X)"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={newDeal.company}
            onChange={(e) => setNewDeal((p) => ({ ...p, company: e.target.value }))}
            placeholder="Empresa"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <input
            value={newDeal.amount}
            onChange={(e) => setNewDeal((p) => ({ ...p, amount: e.target.value }))}
            placeholder="Valor (ex: 25000)"
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          />
          <select
            value={newDeal.stageId}
            onChange={(e) => setNewDeal((p) => ({ ...p, stageId: e.target.value }))}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
          >
            {stages.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
          <button
            disabled={loading}
            className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Criar
          </button>
        </form>
      </div>

      {/* Totais */}
      <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-3">
        <MetricCard title="Forecast (Open)" value={brl(totals.openSum)} sub={`${totals.openCount} deals`} />
        <MetricCard title="Ganho (Won)" value={brl(totals.wonSum)} sub={`${totals.wonCount} deals`} />
        <MetricCard title="Perdido (Lost)" value={brl(totals.lostSum)} sub={`${totals.lostCount} deals`} />
      </div>

      {/* Board */}
      <div className="mt-4">
        <DndContext sensors={sensors} onDragEnd={onDragEnd}>
          <div className="flex gap-3 overflow-x-auto pb-3">
            {stages.map((s) => {
              const list = dealsByStage.get(s.id) || [];
              const sum = sumAmount(list);
              return (
                <StageColumn
                  key={s.id}
                  stage={s}
                  deals={list}
                  sum={sum}
                  onOpenDeal={(deal) => setSelectedDeal(deal)}
                />
              );
            })}
          </div>
        </DndContext>
      </div>

      {/* Modal */}
      {selectedDeal ? (
        <DealModal
          deal={selectedDeal}
          onClose={() => setSelectedDeal(null)}
          onSave={saveDealEdits}
          onDelete={deleteDeal}
        />
      ) : null}
    </AppShell>
  );
}

function MetricCard({ title, value, sub }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="text-xs text-slate-500">{title}</div>
      <div className="mt-1 text-2xl font-semibold text-slate-900">{value}</div>
      <div className="mt-1 text-sm text-slate-500">{sub}</div>
    </div>
  );
}

function StageColumn({ stage, deals, sum, onOpenDeal }) {
  const { isOver, setNodeRef } = useDroppable({ id: stage.id });

  return (
    <div
      ref={setNodeRef}
      className={[
        "min-w-[280px] max-w-[320px] rounded-2xl border bg-slate-50 p-3",
        isOver ? "border-slate-900" : "border-slate-200",
      ].join(" ")}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-slate-900">{stage.name}</div>
          <div className="mt-1 text-xs text-slate-500">
            {deals.length} deals • {brl(sum)}
          </div>
        </div>
        <div className="text-xs text-slate-400">#{stage.order}</div>
      </div>

      <div className="mt-3 grid gap-3">
        {deals.map((d) => (
          <DealCard key={d.id} deal={d} onOpen={() => onOpenDeal(d)} />
        ))}
        {deals.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-200 bg-white p-3 text-xs text-slate-500">
            Arraste deals aqui
          </div>
        ) : null}
      </div>
    </div>
  );
}

function DealCard({ deal, onOpen }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
  });

  const style = {
    transform: CSS.Translate.toString(transform),
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={[
        "rounded-2xl border border-slate-200 bg-white p-3 shadow-sm",
        isDragging ? "opacity-60" : "",
        "cursor-grab active:cursor-grabbing",
      ].join(" ")}
      onDoubleClick={onOpen}
      title="Dê duplo clique para editar"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="text-sm font-semibold text-slate-900">{deal.title}</div>
        <Badge tone={toneFromDealStatus(deal.status)}>{deal.status}</Badge>
      </div>

      <div className="mt-1 text-sm text-slate-600">{deal.company || "-"}</div>

      <div className="mt-2 text-sm font-semibold text-slate-900">
        {deal.amount == null ? "—" : brl(deal.amount)}
      </div>

      <div className="mt-2 text-xs text-slate-500">
        Atualizado: {new Date(deal.updatedAtUtc).toLocaleString("pt-BR")}
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
      >
        Editar
      </button>
    </div>
  );
}

function DealModal({ deal, onClose, onSave, onDelete }) {
  const [title, setTitle] = useState(deal.title || "");
  const [company, setCompany] = useState(deal.company || "");
  const [amountText, setAmountText] = useState(deal.amount == null ? "" : String(deal.amount));
  const [noAmount, setNoAmount] = useState(deal.amount == null);

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function submit(e) {
    e.preventDefault();
    setErr("");

    const cleanTitle = title.trim();
    if (!cleanTitle) return setErr("Título é obrigatório.");

    let amount = null;
    if (!noAmount) {
      const n = amountText.trim() === "" ? null : Number(amountText.replace(",", "."));
      if (n === null || Number.isNaN(n)) return setErr("Valor inválido.");
      amount = n;
    }

    setBusy(true);
    try {
      await onSave({
        id: deal.id,
        title: cleanTitle,
        company: company.trim(),
        amount: noAmount ? null : amount,
      });
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    const ok = window.confirm("Tem certeza que deseja excluir este deal?");
    if (!ok) return;

    setBusy(true);
    try {
      await onDelete(deal.id);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onMouseDown={onClose}
    >
      <div
        className="w-full max-w-xl rounded-3xl bg-white shadow-xl"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3 border-b border-slate-200 p-5">
          <div>
            <div className="text-lg font-semibold text-slate-900">Editar Deal</div>
            <div className="mt-1 text-sm text-slate-500">ID: {deal.id}</div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
          >
            Fechar
          </button>
        </div>

        <form onSubmit={submit} className="grid gap-4 p-5">
          {err ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
              {err}
            </div>
          ) : null}

          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </label>

          <label className="grid gap-1">
            <span className="text-sm font-medium text-slate-700">Empresa</span>
            <input
              value={company}
              onChange={(e) => setCompany(e.target.value)}
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400"
            />
          </label>

          <div className="grid gap-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-slate-700">Valor</span>
              <label className="flex items-center gap-2 text-sm text-slate-600">
                <input
                  type="checkbox"
                  checked={noAmount}
                  onChange={(e) => setNoAmount(e.target.checked)}
                />
                Sem valor
              </label>
            </div>

            <input
              value={amountText}
              onChange={(e) => setAmountText(e.target.value)}
              disabled={noAmount}
              placeholder="ex: 25000"
              className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-slate-400 disabled:bg-slate-50"
            />
          </div>

          <div className="flex flex-col gap-2 pt-2 md:flex-row md:items-center md:justify-between">
            <button
              type="button"
              onClick={remove}
              disabled={busy}
              className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-100 disabled:opacity-60"
            >
              Excluir
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={busy}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-60"
              >
                Cancelar
              </button>

              <button
                disabled={busy}
                className="rounded-xl bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
              >
                Salvar
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}