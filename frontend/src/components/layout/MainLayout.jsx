import React from "react";
import { useSelector } from "react-redux";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function MainLayout({ children }) {
  const { sidebarOpen } = useSelector((state) => state.ui);

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-50">
      {/* =====================================================
          SIDEBAR
      ===================================================== */}
      <Sidebar />

      {/* =====================================================
          HEADER
      ===================================================== */}
      <Header />

      {/* =====================================================
          MAIN CONTENT
      ===================================================== */}
      <main
        className={`
          relative min-h-screen
          pt-[72px]
          transition-all duration-300 ease-in-out
          ${sidebarOpen ? "ml-64" : "ml-0 lg:ml-20"}
        `}
      >
        {/* Background Decorative Elements */}
        <div className="pointer-events-none fixed inset-0 -z-0 overflow-hidden">
          {/* Top Right Glow */}
          <div
            className="
              absolute
              -right-32
              top-20
              h-96
              w-96
              rounded-full
              bg-amber-100/30
              blur-3xl
            "
          />

          {/* Bottom Left Glow */}
          <div
            className="
              absolute
              -bottom-40
              -left-32
              h-96
              w-96
              rounded-full
              bg-orange-100/20
              blur-3xl
            "
          />

          {/* Center Soft Glow */}
          <div
            className="
              absolute
              left-1/2
              top-1/2
              h-72
              w-72
              -translate-x-1/2
              -translate-y-1/2
              rounded-full
              bg-slate-200/20
              blur-3xl
            "
          />
        </div>

        {/* =================================================
            PAGE CONTENT
        ================================================= */}
        <div className="relative z-10 p-4 sm:p-5 lg:p-6 xl:p-7">
          <div
            className="
              mx-auto
              w-full
              max-w-[1800px]
            "
          >
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
