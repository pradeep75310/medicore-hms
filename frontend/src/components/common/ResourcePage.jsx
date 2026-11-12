
import React, { useEffect, useMemo, useState } from "react";
import {
  FiEdit2,
  FiPlus,
  FiRefreshCw,
  FiSearch,
  FiTrash2,
  FiPower,
  FiCheckCircle,
  FiX,
  FiInbox,
  FiSave,
  FiShield,
} from "react-icons/fi";
import toast from "react-hot-toast";
import { useSelector } from "react-redux";
import PageHeader from "./PageHeader";

const normalizeRole = (role) =>
  String(role || "").trim().toUpperCase();

const getRowId = (row) =>
  row?.id ?? row?.patient_id ?? row?.doctor_id ?? row?.uuid;

const getRows = (data) =>
  Array.isArray(data)
    ? data
    : data?.results || data?.data || data?.items || [];

export default function ResourcePage({
  title,
  subtitle,
  api,
  columns,
  fields = [],
  transformCreate = (value) => value,
  canWrite = true,
  canCreate = canWrite,
  manageRoles = null,
  showEdit = true,
  showDeactivate = true,
  showDelete = true,
  deactivateField = "is_active",
  emptyMessage = "No records found.",
  searchPlaceholder,
}) {
  const role = useSelector((state) => state.auth.role);

  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [editing, setEditing] = useState(null);

  const currentRole = normalizeRole(role);

  const canManage =
    manageRoles === null
      ? canWrite
      : manageRoles.some(
          (allowedRole) =>
            normalizeRole(allowedRole) === currentRole
        );

  const canEditRows =
    canManage && showEdit && !!api?.update;

  const canDeactivateRows =
    canManage && showDeactivate && !!api?.update;

  const canDeleteRows =
    canManage && showDelete && !!api?.remove;

  const load = async () => {
    setLoading(true);

    try {
      const data = await api.list(
        search.trim()
          ? { search: search.trim() }
          : undefined
      );

      setRows(getRows(data));
    } catch (error) {
      toast.error(
        error?.message || "Failed to load records."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(load, 250);

    return () => clearTimeout(timer);
  }, [search]);

  const initial = useMemo(
    () =>
      Object.fromEntries(
        fields.map((field) => [
          field.name,
          field.default ?? "",
        ])
      ),
    [fields]
  );

  const startEdit = (row) => {
    setEditing(row);
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);

    try {
      const formData = new FormData(event.currentTarget);

      const payload = Object.fromEntries(
        formData.entries()
      );

      const id = getRowId(editing);

      if (id !== undefined && id !== null) {
        if (!api?.update) {
          throw new Error(
            "Update operation is not available."
          );
        }

        await api.update(
          id,
          transformCreate(payload, editing)
        );

        toast.success("Updated successfully.");
      } else {
        if (!api?.create) {
          throw new Error(
            "Create operation is not available."
          );
        }

        await api.create(
          transformCreate(payload)
        );

        toast.success("Created successfully.");
      }

      setEditing(null);
      await load();
    } catch (error) {
      toast.error(
        error?.message || "Operation failed."
      );
    } finally {
      setSaving(false);
    }
  };

  const changeActiveState = async (
    row,
    nextActive
  ) => {
    const id = getRowId(row);

    if (
      id === undefined ||
      id === null ||
      !api?.update
    ) {
      toast.error(
        "Status update operation is not available."
      );
      return;
    }

    const actionLabel = nextActive
      ? "activate"
      : "deactivate";

    const confirmed = window.confirm(
      `Are you sure you want to ${actionLabel} this ${title
        .toLowerCase()
        .replace(/s$/, "")}?`
    );

    if (!confirmed) return;

    setActionId(id);

    try {
      await api.update(id, {
        [deactivateField]: nextActive,
      });

      toast.success(
        nextActive
          ? "Record activated successfully."
          : "Record deactivated successfully."
      );

      await load();
    } catch (error) {
      toast.error(
        error?.message ||
          `Failed to ${actionLabel} record.`
      );
    } finally {
      setActionId(null);
    }
  };

  const remove = async (row) => {
    const id = getRowId(row);

    if (
      id === undefined ||
      id === null ||
      !api?.remove
    ) {
      toast.error(
        "Delete operation is not available."
      );
      return;
    }

    const confirmed = window.confirm(
      `Delete this ${title
        .toLowerCase()
        .replace(
          /s$/,
          ""
        )}? This action cannot be undone.`
    );

    if (!confirmed) return;

    setActionId(id);

    try {
      await api.remove(id);

      toast.success("Deleted successfully.");

      await load();
    } catch (error) {
      toast.error(
        error?.message ||
          "Failed to delete record."
      );
    } finally {
      setActionId(null);
    }
  };

  const renderField = (field) => {
    const value =
      editing?.[field.name] ??
      field.default ??
      "";

    const baseClass = `
      w-full
      h-11
      rounded-xl
      border
      border-slate-200
      bg-slate-50
      px-3.5
      text-sm
      text-slate-800
      outline-none
      transition-all
      duration-200
      placeholder:text-slate-400
      focus:border-amber-500
      focus:bg-white
      focus:ring-4
      focus:ring-amber-500/10
    `;

    if (field.type === "select") {
      return (
        <select
          name={field.name}
          defaultValue={value}
          required={field.required}
          className={baseClass}
        >
          {field.options?.map((option) => (
            <option
              key={option.value}
              value={option.value}
            >
              {option.label}
            </option>
          ))}
        </select>
      );
    }

    if (field.type === "textarea") {
      return (
        <textarea
          name={field.name}
          defaultValue={value}
          required={field.required}
          placeholder={field.placeholder}
          className={`${baseClass} h-auto min-h-28 py-3 resize-y`}
        />
      );
    }

    return (
      <input
        name={field.name}
        type={field.type || "text"}
        defaultValue={value}
        required={field.required}
        placeholder={field.placeholder}
        className={baseClass}
      />
    );
  };

  const hasActions =
    canEditRows ||
    canDeactivateRows ||
    canDeleteRows;

  return (
    <div className="space-y-5">

      {/* ================= PAGE HEADER ================= */}
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          canCreate ? (
            <button
              type="button"
              className="
                inline-flex
                w-full
                lg:w-auto
                items-center
                justify-center
                gap-2
                rounded-xl
                bg-gradient-to-r
                from-amber-500
                to-orange-600
                px-5
                py-2.5
                text-sm
                font-semibold
                text-white
                shadow-lg
                shadow-orange-500/20
                transition-all
                duration-200
                hover:-translate-y-0.5
                hover:from-amber-600
                hover:to-orange-700
                hover:shadow-xl
                active:translate-y-0
              "
              onClick={() => setEditing(initial)}
            >
              <FiPlus size={18} />
              Add New
            </button>
          ) : null
        }
      />

      {/* ================= SEARCH TOOLBAR ================= */}
      <div
        className="
          relative
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          p-4
          shadow-sm
        "
      >
        {/* Background decoration */}
        <div className="pointer-events-none absolute -right-10 -top-16 h-32 w-32 rounded-full bg-amber-100/40 blur-3xl" />

        <div className="relative flex flex-col gap-3 sm:flex-row">

          {/* Search */}
          <div
            className="
              group
              flex
              min-h-12
              flex-1
              items-center
              rounded-xl
              border
              border-slate-200
              bg-slate-50
              px-4
              transition-all
              duration-200
              focus-within:border-amber-400
              focus-within:bg-white
              focus-within:ring-4
              focus-within:ring-amber-500/10
            "
          >
            <FiSearch
              size={18}
              className="
                shrink-0
                text-slate-400
                transition-colors
                group-focus-within:text-amber-500
              "
            />

            <input
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder={
                searchPlaceholder ||
                `Search ${title.toLowerCase()}...`
              }
              className="
                ml-3
                w-full
                bg-transparent
                text-sm
                text-slate-800
                outline-none
                placeholder:text-slate-400
              "
            />

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="
                  flex
                  h-7
                  w-7
                  shrink-0
                  items-center
                  justify-center
                  rounded-lg
                  text-slate-400
                  transition-colors
                  hover:bg-slate-200
                  hover:text-slate-700
                "
              >
                <FiX size={15} />
              </button>
            )}
          </div>

          {/* Refresh */}
          <button
            type="button"
            onClick={load}
            disabled={loading}
            title="Refresh"
            className="
              flex
              h-12
              w-full
              items-center
              justify-center
              gap-2
              rounded-xl
              border
              border-slate-200
              bg-white
              px-4
              text-sm
              font-semibold
              text-slate-600
              shadow-sm
              transition-all
              duration-200
              hover:border-amber-300
              hover:bg-amber-50
              hover:text-amber-600
              disabled:cursor-not-allowed
              disabled:opacity-50
              sm:w-auto
            "
          >
            <FiRefreshCw
              size={17}
              className={
                loading ? "animate-spin" : ""
              }
            />

            <span className="sm:hidden">
              Refresh
            </span>
          </button>
        </div>
      </div>

      {/* ================= DATA TABLE ================= */}
      <div
        className="
          overflow-hidden
          rounded-2xl
          border
          border-slate-200
          bg-white
          shadow-sm
        "
      >
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3, 4, 5].map((item) => (
              <div
                key={item}
                className="flex items-center gap-4"
              >
                <div className="h-10 flex-1 animate-pulse rounded-lg bg-slate-100" />
                <div className="h-10 w-24 animate-pulse rounded-lg bg-slate-100" />
              </div>
            ))}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-max text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80">
                  {columns.map((column) => (
                    <th
                      key={column.key}
                      className="
                        px-5
                        py-4
                        text-left
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                        whitespace-nowrap
                      "
                    >
                      {column.label}
                    </th>
                  ))}

                  {hasActions && (
                    <th
                      className="
                        px-5
                        py-4
                        text-right
                        text-[11px]
                        font-bold
                        uppercase
                        tracking-wider
                        text-slate-500
                        whitespace-nowrap
                      "
                    >
                      Actions
                    </th>
                  )}
                </tr>
              </thead>

              <tbody className="divide-y divide-slate-100">
                {rows.map((row, index) => {
                  const id = getRowId(row);

                  const active =
                    row?.[deactivateField] !== false;

                  const isActionLoading =
                    actionId === id;

                  return (
                    <tr
                      key={id ?? index}
                      className="
                        group
                        bg-white
                        transition-all
                        duration-200
                        hover:bg-slate-50/80
                      "
                    >
                      {columns.map((column) => (
                        <td
                          key={column.key}
                          className="
                            px-5
                            py-4
                            text-sm
                            text-slate-700
                            whitespace-nowrap
                          "
                        >
                          {column.render
                            ? column.render(row)
                            : row?.[column.key] ?? "—"}
                        </td>
                      ))}

                      {hasActions && (
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-1.5">

                            {/* Edit */}
                            {canEditRows && (
                              <button
                                type="button"
                                title="Edit"
                                disabled={isActionLoading}
                                onClick={() =>
                                  startEdit(row)
                                }
                                className="
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-xl
                                  text-slate-500
                                  transition-all
                                  duration-200
                                  hover:bg-amber-50
                                  hover:text-amber-600
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                "
                              >
                                <FiEdit2 size={16} />
                              </button>
                            )}

                            {/* Activate / Deactivate */}
                            {canDeactivateRows && (
                              <button
                                type="button"
                                title={
                                  active
                                    ? "Deactivate"
                                    : "Activate"
                                }
                                disabled={isActionLoading}
                                onClick={() =>
                                  changeActiveState(
                                    row,
                                    !active
                                  )
                                }
                                className={`
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-xl
                                  transition-all
                                  duration-200
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                  ${
                                    active
                                      ? "text-amber-500 hover:bg-amber-50"
                                      : "text-emerald-500 hover:bg-emerald-50"
                                  }
                                `}
                              >
                                {active ? (
                                  <FiPower size={17} />
                                ) : (
                                  <FiCheckCircle size={17} />
                                )}
                              </button>
                            )}

                            {/* Delete */}
                            {canDeleteRows && (
                              <button
                                type="button"
                                title="Delete"
                                disabled={isActionLoading}
                                onClick={() =>
                                  remove(row)
                                }
                                className="
                                  flex
                                  h-9
                                  w-9
                                  items-center
                                  justify-center
                                  rounded-xl
                                  text-slate-400
                                  transition-all
                                  duration-200
                                  hover:bg-red-50
                                  hover:text-red-500
                                  disabled:cursor-not-allowed
                                  disabled:opacity-40
                                "
                              >
                                <FiTrash2 size={16} />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Empty State */}
        {!loading && !rows.length && (
          <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <div
              className="
                mb-4
                flex
                h-16
                w-16
                items-center
                justify-center
                rounded-2xl
                bg-gradient-to-br
                from-slate-100
                to-slate-50
                text-slate-400
              "
            >
              <FiInbox size={28} />
            </div>

            <h3 className="text-sm font-bold text-slate-700">
              No records found
            </h3>

            <p className="mt-1.5 max-w-sm text-xs leading-5 text-slate-400">
              {emptyMessage}
            </p>

            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                className="
                  mt-4
                  text-xs
                  font-semibold
                  text-amber-600
                  hover:text-amber-700
                "
              >
                Clear search
              </button>
            )}
          </div>
        )}

        {/* Table Footer */}
        {!loading && rows.length > 0 && (
          <div
            className="
              flex
              flex-col
              gap-2
              border-t
              border-slate-200
              bg-slate-50/70
              px-5
              py-3
              sm:flex-row
              sm:items-center
              sm:justify-between
            "
          >
            <p className="text-xs text-slate-500">
              Showing{" "}
              <span className="font-bold text-slate-700">
                {rows.length}
              </span>{" "}
              record{rows.length !== 1 ? "s" : ""}
            </p>

            <div className="flex items-center gap-1.5 text-xs text-slate-400">
              <FiShield size={13} />
              Secure data management
            </div>
          </div>
        )}
      </div>

      {/* ================= PREMIUM MODAL ================= */}
      {editing && (
        <div
          className="
            fixed
            inset-0
            z-50
            flex
            items-center
            justify-center
            bg-slate-950/60
            p-4
            backdrop-blur-sm
          "
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) {
              if (!saving) setEditing(null);
            }
          }}
        >
          <div
            className="
              w-full
              max-w-3xl
              max-h-[92vh]
              overflow-hidden
              rounded-3xl
              border
              border-white/20
              bg-white
              shadow-2xl
            "
          >

            {/* Modal Header */}
            <div
              className="
                relative
                overflow-hidden
                border-b
                border-slate-200
                bg-gradient-to-br
                from-slate-900
                via-slate-800
                to-slate-900
                px-6
                py-5
              "
            >
              <div className="absolute -right-10 -top-16 h-40 w-40 rounded-full bg-amber-500/20 blur-3xl" />

              <div className="relative flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div
                    className="
                      flex
                      h-11
                      w-11
                      shrink-0
                      items-center
                      justify-center
                      rounded-xl
                      bg-gradient-to-br
                      from-amber-400
                      to-orange-600
                      text-white
                      shadow-lg
                      shadow-orange-500/20
                    "
                  >
                    {getRowId(editing) ? (
                      <FiEdit2 size={19} />
                    ) : (
                      <FiPlus size={20} />
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-white">
                      {getRowId(editing)
                        ? `Edit ${title}`
                        : `Add ${title}`}
                    </h3>

                    <p className="mt-0.5 text-xs text-slate-400">
                      {getRowId(editing)
                        ? "Update the record information below."
                        : "Enter the required information to create a new record."}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  disabled={saving}
                  className="
                    flex
                    h-9
                    w-9
                    shrink-0
                    items-center
                    justify-center
                    rounded-xl
                    text-slate-400
                    transition-all
                    hover:bg-white/10
                    hover:text-white
                    disabled:opacity-40
                  "
                >
                  <FiX size={19} />
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="max-h-[calc(92vh-150px)] overflow-y-auto">
              <form
                onSubmit={save}
                className="grid gap-5 p-6 md:grid-cols-2"
              >
                {fields.map((field) => (
                  <div
                    key={field.name}
                    className={
                      field.full
                        ? "md:col-span-2"
                        : ""
                    }
                  >
                    <label className="mb-2 block text-xs font-bold uppercase tracking-wide text-slate-600">
                      {field.label}
                      {field.required && (
                        <span className="ml-1 text-red-500">
                          *
                        </span>
                      )}
                    </label>

                    {renderField(field)}
                  </div>
                ))}

                {/* Modal Footer */}
                <div
                  className="
                    md:col-span-2
                    mt-2
                    flex
                    flex-col-reverse
                    gap-3
                    border-t
                    border-slate-100
                    pt-5
                    sm:flex-row
                    sm:justify-end
                  "
                >
                  <button
                    type="button"
                    className="
                      h-11
                      rounded-xl
                      border
                      border-slate-200
                      bg-white
                      px-5
                      text-sm
                      font-semibold
                      text-slate-600
                      transition-all
                      hover:bg-slate-50
                      hover:text-slate-800
                      disabled:opacity-50
                    "
                    onClick={() =>
                      setEditing(null)
                    }
                    disabled={saving}
                  >
                    Cancel
                  </button>

                  <button
                    type="submit"
                    disabled={saving}
                    className="
                      inline-flex
                      h-11
                      items-center
                      justify-center
                      gap-2
                      rounded-xl
                      bg-gradient-to-r
                      from-amber-500
                      to-orange-600
                      px-6
                      text-sm
                      font-semibold
                      text-white
                      shadow-lg
                      shadow-orange-500/20
                      transition-all
                      hover:from-amber-600
                      hover:to-orange-700
                      hover:shadow-xl
                      disabled:cursor-not-allowed
                      disabled:opacity-50
                    "
                  >
                    {saving ? (
                      <>
                        <span
                          className="
                            h-4
                            w-4
                            animate-spin
                            rounded-full
                            border-2
                            border-white/40
                            border-t-white
                          "
                        />
                        Saving...
                      </>
                    ) : (
                      <>
                        <FiSave size={16} />
                        {getRowId(editing)
                          ? "Save Changes"
                          : "Create Record"}
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}