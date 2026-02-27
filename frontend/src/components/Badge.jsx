function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

export default function Badge({ tone = "neutral", children }) {
  const cls =
    tone === "success"
      ? "bg-emerald-50 text-emerald-700 ring-emerald-200"
      : tone === "danger"
      ? "bg-rose-50 text-rose-700 ring-rose-200"
      : tone === "warning"
      ? "bg-amber-50 text-amber-800 ring-amber-200"
      : "bg-slate-50 text-slate-700 ring-slate-200";

  return (
    <span
      className={cx(
        "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ring-1",
        cls
      )}
    >
      {children}
    </span>
  );
}