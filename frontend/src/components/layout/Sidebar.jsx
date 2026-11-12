import React, { useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { toggleSidebar } from "../../store/uiSlice";
import { useLocation, Link } from "react-router-dom";
import {
  FiX,
  FiHome,
  FiUsers,
  FiCalendar,
  FiHeart,
  FiFileText,
  FiMonitor,
  FiDroplet,
  FiShoppingCart,
  FiDollarSign,
  FiLayers,
  FiAlertTriangle,
  FiBriefcase,
  FiPackage,
  FiCpu,
  FiActivity,
  FiChevronRight,
} from "react-icons/fi";
import { HiOutlineShieldCheck } from "react-icons/hi2";

const FULL_ACCESS_ROLES = ["SUPER_USER", "SUPER_ADMIN"];

const allMenuItems = [
  { path: "/dashboard", label: "Dashboard", icon: FiHome, roles: null }, // null = everyone
  {
    path: "/hospitals",
    label: "Hospital Setup",
    icon: HiOutlineShieldCheck,
    roles: ["SUPER_ADMIN"],
  },
  {
    path: "/branches",
    label: "Branch Setup",
    icon: FiLayers,
    roles: ["SUPER_USER", "SUPER_ADMIN", "HOSPITAL_ADMIN"],
  },
  {
    path: "/departments",
    label: "Department Setup",
    icon: FiBriefcase,
    roles: ["SUPER_USER", "SUPER_ADMIN", "HOSPITAL_ADMIN"],
  },
  {
    path: "/hospital-admins",
    label: "Hospital Admins",
    icon: HiOutlineShieldCheck,
    roles: ["SUPER_USER", "SUPER_ADMIN"],
  },
  {
    label: "Patient Management",
    icon: FiUsers,
    roles: ["receptionist", "nurse"],
    children: [
      {
        path: "/patients",
        label: "All Patients",
        roles: ["receptionist", "nurse"],
      },
    ],
  },
  {
    path: "/appointments",
    label: "Appointments",
    icon: FiCalendar,
    roles: [
      "SUPER_USER",
      "SUPER_ADMIN",
      "HOSPITAL_ADMIN",
      "doctor",
      "receptionist",
      "patient",
    ],
  },
  {
    path: "/doctors",
    label: "Doctors",
    icon: FiHeart,
    roles: ["doctor", "receptionist"],
  },
  {
    path: "/nurses",
    label: "Nurses",
    icon: FiUsers,
    roles: ["nurse", "receptionist"],
  },
  // { path: '/emr', label: 'EMR / EHR', icon: FiFileText, roles: ['doctor', 'patient'] },
  {
    path: "/telemedicine",
    label: "Telemedicine",
    icon: FiMonitor,
    roles: ["doctor", "patient"],
  },
  {
    path: "/laboratory",
    label: "Laboratory",
    icon: FiDroplet,
    roles: ["lab_technician", "doctor"],
  },
  {
    path: "/pharmacy",
    label: "Pharmacy",
    icon: FiShoppingCart,
    roles: ["pharmacist"],
  },
  {
    path: "/billing",
    label: "Billing & Finance",
    icon: FiDollarSign,
    roles: ["accountant"],
  },
  { path: "/hr", label: "HR & Staff", icon: FiBriefcase, roles: [] }, // full-access only
  {
    path: "/inventory",
    label: "Inventory",
    icon: FiPackage,
    roles: ["pharmacist"],
  },
  {
    path: "/analytics",
    label: "Analytics",
    icon: FiActivity,
    roles: ["accountant"],
  },
];

export default function Sidebar() {
  const { sidebarOpen } = useSelector((state) => state.ui);
  const { role } = useSelector((state) => state.auth);
  const dispatch = useDispatch();
  const location = useLocation();
  const [expandedMenus, setExpandedMenus] = useState([]);

  const currentRole = (role || "").toUpperCase();
  const isFullAccess = FULL_ACCESS_ROLES.some(
    (r) => r.toUpperCase() === currentRole,
  );
  const canSee = (item) => {
    const itemRoles = item.roles;

    // Super User / Super Admin
    // Full access
    if (isFullAccess) {
      return true;
    }

    // Dashboard is visible to everyone
    if (itemRoles === null) {
      return true;
    }

    // =====================================================
    // HOSPITAL ADMIN
    // =====================================================
    if (currentRole === "HOSPITAL_ADMIN") {
      if (item.path === "/hospitals" || item.path === "/hospital-admins") {
        return false;
      }

      return true;
    }

    // =====================================================
    // OTHER ROLES
    // =====================================================

    if (!itemRoles || itemRoles.length === 0) {
      return false;
    }

    return itemRoles.some((r) => r.toUpperCase() === currentRole);
  };

  const menuItems = allMenuItems
    .filter((item) => canSee(item))
    .map((item) =>
      item.children
        ? {
            ...item,
            children: item.children.filter((child) => canSee(child)),
          }
        : item,
    )
    .filter((item) => !item.children || item.children.length > 0);

  const toggleMenu = (label) => {
    setExpandedMenus((prev) =>
      prev.includes(label) ? prev.filter((m) => m !== label) : [...prev, label],
    );
  };

  const isActive = (path) => location.pathname === path;
  const isMenuActive = (item) => {
    if (item.path) return isActive(item.path);
    if (item.children) return item.children.some((c) => isActive(c.path));
    return false;
  };

  return (
    <>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => dispatch(toggleSidebar())}
        />
      )}

      <aside
        className={`
        fixed top-0 left-0 h-full bg-white border-r border-gray-200 z-50
        transition-all duration-300 ease-in-out
        ${sidebarOpen ? "w-64" : "w-0 -translate-x-full lg:w-20 lg:translate-x-0"}
      `}
      >
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <div
            className={`flex items-center gap-2 ${!sidebarOpen && "lg:justify-center"}`}
          >
            <div className="w-9 h-9 bg-gradient-to-br from-medicore-500 to-medicore-700 rounded-lg flex items-center justify-center flex-shrink-0">
              <HiOutlineShieldCheck className="w-5 h-5 text-white" />
            </div>
            {sidebarOpen && (
              <div>
                <h1 className="text-lg font-bold text-medicore-700 leading-tight">
                  MediCore
                </h1>
                <p className="text-[10px] text-gray-400 leading-tight">
                  Enterprise HMS
                </p>
              </div>
            )}
          </div>
          <button
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden text-gray-400 hover:text-gray-600"
          >
            <FiX size={20} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="p-3 overflow-y-auto h-[calc(100vh-4rem)]">
          <div className="space-y-1">
            {menuItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <>
                    <button
                      onClick={() =>
                        sidebarOpen ? toggleMenu(item.label) : null
                      }
                      className={`w-full sidebar-link ${isMenuActive(item) ? "bg-medicore-50 text-medicore-700" : ""} ${!sidebarOpen && "lg:justify-center"}`}
                    >
                      <item.icon size={18} className="flex-shrink-0" />
                      {sidebarOpen && (
                        <>
                          <span className="flex-1 text-left text-sm">
                            {item.label}
                          </span>
                          <FiChevronRight
                            size={14}
                            className={`transition-transform ${expandedMenus.includes(item.label) ? "rotate-90" : ""}`}
                          />
                        </>
                      )}
                    </button>
                    {sidebarOpen && expandedMenus.includes(item.label) && (
                      <div className="ml-8 mt-1 space-y-1">
                        {item.children.map((child) => (
                          <Link
                            key={child.path}
                            to={child.path}
                            className={`block px-3 py-2 text-sm rounded-lg ${isActive(child.path) ? "text-medicore-700 bg-medicore-50" : "text-gray-500 hover:text-gray-700"}`}
                          >
                            {child.label}
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    to={item.path}
                    className={`${isActive(item.path) ? "sidebar-link-active" : "sidebar-link"} ${!sidebarOpen && "lg:justify-center"}`}
                  >
                    <item.icon size={18} className="flex-shrink-0" />
                    {sidebarOpen && (
                      <span className="text-sm">{item.label}</span>
                    )}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </nav>
      </aside>
    </>
  );
}
