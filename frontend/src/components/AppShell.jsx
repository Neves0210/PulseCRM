import { Link, useLocation } from "react-router-dom";

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function NavItem({ to, label }) {
  const { pathname } = useLocation();
  const active = pathname === to;

  return (
    <Link
      to={to}
      className={cx(
        "flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium transition",
        active
          ? "bg-slate-900 text-white shadow"
          : "text-slate-700 hover:bg-slate-100"
      )}
    >
      <span
        className={cx(
          "h-2 w-2 rounded-full",
          active ? "bg-white/80" : "bg-slate-900/30"
        )}
      />
      {label}
    </Link>
  );
}

export default function AppShell({ title, subtitle, right, children }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto max-w-[1400px] p-4 md:p-6">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-[260px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  PulseCRM
                </div>
                <div className="text-xs text-slate-500">SaaS demo</div>
              </div>
              <div className="h-9 w-9 rounded-xl bg-slate-900" />
            </div>

            <div className="mt-5 space-y-1">
              <NavItem to="/dashboard" label="Dashboard" />
              <NavItem to="/leads" label="Leads" />
              <NavItem to="/kanban" label="Pipeline (Kanban)" />
            </div>

            <div className="mt-6 rounded-xl bg-slate-50 p-3">
              <div className="text-xs text-slate-500">Dica</div>
              <div className="mt-1 text-sm text-slate-700">
                Arraste deals entre colunas e acompanhe o forecast.
              </div>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-4 text-xs text-slate-500">
              © {new Date().getFullYear()} PulseCRM
            </div>
          </aside>

          {/* Main */}
          <main className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
            {/* Topbar */}
            <div className="flex flex-col gap-3 border-b border-slate-200 p-4 md:flex-row md:items-center md:justify-between">
              <div>
                <div className="text-lg font-semibold text-slate-900">
                  {title}
                </div>
                {subtitle ? (
                  <div className="text-sm text-slate-500">{subtitle}</div>
                ) : null}
              </div>
              <div className="flex items-center gap-2">{right}</div>
            </div>

            <div className="p-4 md:p-6">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}