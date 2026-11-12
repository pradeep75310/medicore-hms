
import React from "react";

export default function PageHeader({ title, subtitle, action }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
      {/* Left Content */}
      <div className="min-w-0">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-800">
          {title}
        </h1>

        {subtitle && (
          <p className="mt-1.5 text-sm text-slate-500 leading-relaxed">
            {subtitle}
          </p>
        )}
      </div>

      {/* Right Action */}
      {action && (
        <div className="flex items-center gap-2 shrink-0">
          {action}
        </div>
      )}
    </div>
  );
}