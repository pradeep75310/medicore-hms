import React from 'react';
import { FiPackage, FiAlertTriangle, FiTruck, FiPlus, FiSearch } from 'react-icons/fi';
import { inventoryItems } from '../../utils/mockData';
import PageHeader from '../../components/common/PageHeader';

export default function Inventory() {
  return (
    <div>
      <PageHeader 
        title="Inventory Management" 
        subtitle="Stock management, supplier tracking, and purchase orders"
        action={
          <div className="flex gap-3">
            <button className="btn-secondary text-sm flex items-center gap-2"><FiTruck size={16} /> Purchase Order</button>
            <button className="btn-primary text-sm flex items-center gap-2"><FiPlus size={16} /> Add Item</button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Items', value: '1,850', icon: <FiPackage />, color: 'bg-blue-50 text-blue-600' },
          { label: 'Low Stock', value: '23', icon: <FiAlertTriangle />, color: 'bg-red-50 text-red-600' },
          { label: 'Suppliers', value: '45', icon: <FiTruck />, color: 'bg-green-50 text-green-600' },
          { label: 'PO Pending', value: '8', icon: <FiPackage />, color: 'bg-yellow-50 text-yellow-600' },
        ].map(stat => (
          <div key={stat.label} className="stat-card flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>{stat.icon}</div>
            <div>
              <p className="text-2xl font-bold text-gray-800">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-800">Inventory Items</h3>
          <div className="flex items-center bg-gray-100 rounded-lg px-3 py-2">
            <FiSearch className="text-gray-400" size={16} />
            <input type="text" placeholder="Search items..." className="bg-transparent border-none outline-none ml-2 text-sm w-48" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                <th className="px-4 py-3">Item</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">Current Stock</th>
                <th className="px-4 py-3">Reorder Level</th>
                <th className="px-4 py-3">Supplier</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {inventoryItems.map(item => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800">{item.name}</p>
                    <p className="text-xs text-gray-400">{item.id}</p>
                  </td>
                  <td className="px-4 py-3"><span className="badge-info">{item.category}</span></td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium text-gray-700">{item.stock}</span>
                      <div className="w-16 bg-gray-100 rounded-full h-2">
                        <div className={`h-2 rounded-full ${item.stock > item.reorderLevel ? 'bg-green-500' : 'bg-red-500'}`} 
                          style={{ width: `${Math.min((item.stock / (item.reorderLevel * 3)) * 100, 100)}%` }}></div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">{item.reorderLevel}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{item.supplier}</td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      item.status === 'In Stock' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>{item.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="px-3 py-1 text-xs bg-medicore-50 text-medicore-700 rounded-lg">Reorder</button>
                      <button className="px-3 py-1 text-xs bg-gray-50 text-gray-700 rounded-lg">Edit</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* AI Prediction */}
      <div className="card mt-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🤖</span>
          <h3 className="text-lg font-semibold text-gray-800">AI Inventory Prediction</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <p className="font-medium text-yellow-800">⚠️ Auto Reorder Suggested</p>
            <p className="text-sm text-yellow-700 mt-2">IV Cannula 18G: Current stock (80) below reorder level (200). Suggested order: 500 units from HealthEquip.</p>
            <button className="mt-3 text-sm text-yellow-800 font-medium underline">Create PO</button>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <p className="font-medium text-blue-800">📊 Demand Forecast</p>
            <p className="text-sm text-blue-700 mt-2">Surgical masks demand expected to increase 25% next month based on seasonal trends and hospital admission patterns.</p>
            <button className="mt-3 text-sm text-blue-800 font-medium underline">View Details</button>
          </div>
        </div>
      </div>
    </div>
  );
}
