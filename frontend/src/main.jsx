import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import Login from "./pages/Login";
import Leads from "./pages/Leads";

function Protected({ children }) {
  const token = localStorage.getItem("pulsecrm_token");
  return token ? children : <Navigate to="/login" replace />;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/leads" replace />} />
        <Route path="/login" element={<Login />} />
        <Route
          path="/leads"
          element={
            <Protected>
              <Leads />
            </Protected>
          }
        />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);