import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import Home from "./pages/Home";

import Dashboard from "./pages/Dashboard";
import AnalysisHistory from "./pages/AnalysisHistory";
import CompareImages from "./pages/CompareImages";
import TimeLapse from "./pages/TimeLapse";
import Monitoring from "./pages/Monitoring";
import GeoGuardian from "./pages/GeoGuardian"; // Import GeoGuardian Page

import Navbar from "./components/NavBar";
import Sidebar from "./components/Sidebar";
import { AnalysisProvider } from "./context/AnalysisContext";

const Layout = ({ children }) => {
  const location = useLocation();
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register" || location.pathname === "/";

  if (isAuthPage) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <Sidebar />
      <div className="flex-1 ml-[320px] flex flex-col overflow-y-auto">
        <Navbar />
        <main className="flex-1 bg-slate-50">
          {children}
        </main>
      </div>
    </div>
  );
};

function App() {
  return (
    <Router>
      <AnalysisProvider>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />


            <Route
              path="/dashboard"
              element={
                  <Dashboard />
              }
            />

            <Route
              path="/geoguardian"
              element={
                  <GeoGuardian />
              }
            />

            <Route
              path="/analysis-history"
              element={
                  <AnalysisHistory />
              }
            />

            <Route
              path="/compare"
              element={
                  <CompareImages />
              }
            />

            <Route
              path="/timelapse"
              element={
                  <TimeLapse />
              }

            />
            <Route
              path="/monitoring"
              element={
                  <Monitoring />
              }
            />

          </Routes>
        </Layout>
      </AnalysisProvider>
    </Router>
  );
}

export default App;