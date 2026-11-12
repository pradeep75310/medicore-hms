
import React from "react";
import { FiInbox, FiChevronRight } from "react-icons/fi";

export default function DataTable({ columns = [], data = [], onRowClick }) {
  return (
    <div className="w-full rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      {/* Table Scroll Area */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-max border-collapse">
          
          {/* Header */}
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className="
                    px-5 py-4
                    text-left
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-500
                    whitespace-nowrap
                  "
                >
                  {col.label}
                </th>
              ))}

              {/* Action column only when row click is available */}
              {onRowClick && (
                <th
                  className="
                    px-5 py-4
                    text-right
                    text-xs
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-500
                    whitespace-nowrap
                  "
                >
                  Action
                </th>
              )}
            </tr>
          </thead>

          {/* Body */}
          <tbody className="divide-y divide-slate-100">
            {data.length > 0 ? (
              data.map((row, idx) => (
                <tr
                  key={row.id || row._id || idx}
                  onClick={() => onRowClick && onRowClick(row)}
                  className={`
                    group
                    bg-white
                    transition-all
                    duration-200
                    ${
                      onRowClick
                        ? "cursor-pointer hover:bg-slate-50"
                        : ""
                    }
                  `}
                >
                  {columns.map((col) => (
                    <td
                      key={col.key}
                      className="
                        px-5
                        py-4
                        text-sm
                        text-slate-700
                        whitespace-nowrap
                      "
                    >
                      {col.render ? col.render(row) : row[col.key] ?? "-"}
                    </td>
                  ))}

                  {/* Row Action */}
                  {onRowClick && (
                    <td className="px-5 py-4 text-right">
                      <div
                        className="
                          inline-flex
                          items-center
                          justify-center
                          w-8
                          h-8
                          rounded-lg
                          text-slate-400
                          transition-all
                          duration-200
                          group-hover:bg-amber-50
                          group-hover:text-amber-600
                        "
                      >
                        <FiChevronRight size={17} />
                      </div>
                    </td>
                  )}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={columns.length + (onRowClick ? 1 : 0)}
                  className="px-6 py-14"
                >
                  <div className="flex flex-col items-center justify-center text-center">
                    <div
                      className="
                        flex
                        items-center
                        justify-center
                        w-14
                        h-14
                        rounded-2xl
                        bg-slate-100
                        text-slate-400
                        mb-4
                      "
                    >
                      <FiInbox size={25} />
                    </div>

                    <h3 className="text-sm font-semibold text-slate-700">
                      No data available
                    </h3>

                    <p className="mt-1 text-xs text-slate-400">
                      There are no records to display at the moment.
                    </p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Footer */}
      {data.length > 0 && (
        <div className="flex items-center justify-between px-5 py-3 bg-slate-50 border-t border-slate-200">
          <p className="text-xs text-slate-500">
            Showing{" "}
            <span className="font-semibold text-slate-700">
              {data.length}
            </span>{" "}
            record{data.length !== 1 ? "s" : ""}
          </p>

          <div className="text-xs text-slate-400">
            Click a row to view details
          </div>
        </div>
      )}
    </div>
  );
}