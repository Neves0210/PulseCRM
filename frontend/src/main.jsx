import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Kanban from "./pages/Kanban";

function Protected({ children }) {
  const token = localStorage.getItem("pulsecrm_token");
  return token ? children : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/login" element={<Login />} />

        <Route
          path="/dashboard"
          element={
            <Protected>
              <Dashboard />
            </Protected>
          }
        />

        <Route
          path="/leads"
          element={
            <Protected>
              <Leads />
            </Protected>
          }
        />

        <Route
          path="/kanban"
          element={
            <Protected>
              <Kanban />
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);