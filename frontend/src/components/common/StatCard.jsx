
import React from "react";
import { FiArrowUpRight, FiArrowDownRight } from "react-icons/fi";

export default function StatCard({
  title,
  value,
  icon,
  change,
  changeType,
  color = "blue",
}) {
  const colorMap = {
    blue: {
      gradient: "from-blue-500 to-indigo-600",
      soft: "bg-blue-50",
      text: "text-blue-600",
      border: "border-blue-100",
      glow: "bg-blue-500/10",
    },

    green: {
      gradient: "from-emerald-500 to-teal-600",
      soft: "bg-emerald-50",
      text: "text-emerald-600",
      border: "border-emerald-100",
      glow: "bg-emerald-500/10",
    },

    purple: {
      gradient: "from-purple-500 to-violet-600",
      soft: "bg-purple-50",
      text: "text-purple-600",
      border: "border-purple-100",
      glow: "bg-purple-500/10",
    },

    orange: {
      gradient: "from-orange-500 to-amber-600",
      soft: "bg-orange-50",
      text: "text-orange-600",
      border: "border-orange-100",
      glow: "bg-orange-500/10",
    },

    red: {
      gradient: "from-red-500 to-rose-600",
      soft: "bg-red-50",
      text: "text-red-600",
      border: "border-red-100",
      glow: "bg-red-500/10",
    },

    cyan: {
      gradient: "from-cyan-500 to-sky-600",
      soft: "bg-cyan-50",
      text: "text-cyan-600",
      border: "border-cyan-100",
      glow: "bg-cyan-500/10",
    },

    pink: {
      gradient: "from-pink-500 to-rose-600",
      soft: "bg-pink-50",
      text: "text-pink-600",
      border: "border-pink-100",
      glow: "bg-pink-500/10",
    },

    yellow: {
      gradient: "from-yellow-400 to-amber-500",
      soft: "bg-yellow-50",
      text: "text-yellow-600",
      border: "border-yellow-100",
      glow: "bg-yellow-500/10",
    },
  };

  const theme = colorMap[color] || colorMap.blue;

  const isUp = changeType === "up";

  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        border-slate-200
        bg-white
        p-5
        shadow-sm
        transition-all
        duration-300
        hover:-translate-y-1
        hover:shadow-xl
        hover:shadow-slate-200/60
      "
    >
      {/* Background Glow */}
      <div
        className={`
          pointer-events-none
          absolute
          -right-12
          -top-12
          h-32
          w-32
          rounded-full
          blur-3xl
          ${theme.glow}
        `}
      />

      {/* Top Content */}
      <div className="relative flex items-start justify-between gap-4">
        
        {/* Text */}
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            {title}
          </p>

          <h3 className="mt-2 text-3xl font-bold tracking-tight text-slate-800">
            {value ?? 0}
          </h3>

          {/* Change */}
          {change && (
            <div className="mt-3 flex items-center gap-2">
              <span
                className={`
                  inline-flex
                  items-center
                  gap-1
                  rounded-lg
                  px-2
                  py-1
                  text-xs
                  font-bold
                  ${
                    isUp
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-red-50 text-red-600"
                  }
                `}
              >
                {isUp ? (
                  <FiArrowUpRight size={13} />
                ) : (
                  <FiArrowDownRight size={13} />
                )}

                {change}
              </span>

              <span className="text-[11px] text-slate-400">
                vs last month
              </span>
            </div>
          )}
        </div>

        {/* Icon */}
        <div
          className={`
            relative
            flex
            h-12
            w-12
            shrink-0
            items-center
            justify-center
            rounded-2xl
            bg-gradient-to-br
            ${theme.gradient}
            text-white
            shadow-lg
            transition-all
            duration-300
            group-hover:scale-110
            group-hover:rotate-2
          `}
        >
          <span className="text-xl">
            {icon}
          </span>

          {/* Icon shine */}
          <div className="absolute inset-0 rounded-2xl bg-white/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
        </div>
      </div>

      {/* Bottom Accent */}
      <div className="relative mt-5">
        <div className="h-1 w-full overflow-hidden rounded-full bg-slate-100">
          <div
            className={`
              h-full
              w-1/3
              rounded-full
              bg-gradient-to-r
              ${theme.gradient}
              transition-all
              duration-500
              group-hover:w-1/2
            `}
          />
        </div>
      </div>

      {/* Bottom Status */}
      <div className="mt-3 flex items-center justify-between">
        <span className="text-[11px] font-medium text-slate-400">
          Current overview
        </span>

        <span
          className={`
            h-2
            w-2
            rounded-full
            ${theme.text.replace("text-", "bg-")}
            shadow-sm
          `}
        />
      </div>
    </div>
  );
}