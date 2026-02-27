import { useNavigate } from "react-router-dom";
import { clearToken } from "../lib/api";

export default function LogoutButton() {
  const nav = useNavigate();

  return (
    <button
      onClick={() => {
        clearToken();
        localStorage.removeItem("pulsecrm_tenant");
        nav("/login");
      }}
      className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
    >
      Sair
    </button>
  );
}