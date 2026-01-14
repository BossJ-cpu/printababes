'use client';

import { useState, useEffect } from 'react';

interface Table {
  name: string;
  columns: string[];
  row_count: number;
}

interface TableData {
  columns: string[];
  data: Record<string, any>[];
}

export default function DatabaseManager() {
  const [activeTab, setActiveTab] = useState<'overview' | 'create' | 'manage' | 'columns'>('overview');
  const [tables, setTables] = useState<Table[]>([]);
  const [selectedTable, setSelectedTable] = useState<string>('');
  const [tableData, setTableData] = useState<TableData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [success, setSuccess] = useState<string>('');

  // Create Table Form State
  const [newTableName, setNewTableName] = useState('');
  const [newTableColumns, setNewTableColumns] = useState<Array<{ name: string; type: string; nullable: boolean }>>([
    { name: 'name', type: 'string', nullable: false }
  ]);

  // Add Column Form State
  const [columnTableName, setColumnTableName] = useState('');
  const [newColumnName, setNewColumnName] = useState('');
  const [newColumnType, setNewColumnType] = useState('string');
  const [newColumnNullable, setNewColumnNullable] = useState(false);

  // Row Management State
  const [editingRow, setEditingRow] = useState<Record<string, any> | null>(null);
  const [newRow, setNewRow] = useState<Record<string, any>>({});
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const API_BASE = 'https://printababes-laravel.onrender.com/api';

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchTableData(selectedTable);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/database/tables`);
      const data = await response.json();
      if (data.success) {
        setTables(data.data);
      } else {
        setError(data.message || 'Failed to fetch tables');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    setError('');
    try {
      const response = await fetch(`${API_BASE}/database/tables/${tableName}`);
      const data = await response.json();
      if (data.success) {
        setTableData(data.data);
      } else {
        setError(data.message || 'Failed to fetch table data');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const createTable = async () => {
    if (!newTableName.trim()) {
      setError('Table name is required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/database/tables`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table_name: newTableName,
          columns: newTableColumns,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Table created successfully!');
        setNewTableName('');
        setNewTableColumns([{ name: 'name', type: 'string', nullable: false }]);
        fetchTables();
      } else {
        setError(data.message || 'Failed to create table');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const addColumn = async () => {
    if (!columnTableName || !newColumnName.trim()) {
      setError('Table name and column name are required');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/database/tables/${columnTableName}/columns`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newColumnName,
          type: newColumnType,
          nullable: newColumnNullable,
        }),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Column added successfully!');
        setNewColumnName('');
        setNewColumnType('string');
        setNewColumnNullable(false);
        fetchTables();
        if (selectedTable === columnTableName) {
          fetchTableData(columnTableName);
        }
      } else {
        setError(data.message || 'Failed to add column');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteTable = async (tableName: string) => {
    if (!confirm(`Are you sure you want to delete table "${tableName}"?`)) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/database/tables/${tableName}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Table deleted successfully!');
        if (selectedTable === tableName) {
          setSelectedTable('');
          setTableData(null);
        }
        fetchTables();
      } else {
        setError(data.message || 'Failed to delete table');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const insertRow = async () => {
    if (!selectedTable) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/database/rows/${selectedTable}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newRow),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Row added successfully!');
        setNewRow({});
        setShowAddModal(false);
        fetchTableData(selectedTable);
      } else {
        setError(data.message || 'Failed to add row');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const updateRow = async () => {
    if (!selectedTable || !editingRow) return;

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/database/rows/${selectedTable}/${editingRow.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingRow),
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Row updated successfully!');
        setEditingRow(null);
        setShowEditModal(false);
        fetchTableData(selectedTable);
      } else {
        setError(data.message || 'Failed to update row');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const deleteRow = async (id: number) => {
    if (!selectedTable || !confirm('Are you sure you want to delete this row?')) {
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`${API_BASE}/database/rows/${selectedTable}/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      if (data.success) {
        setSuccess('Row deleted successfully!');
        fetchTableData(selectedTable);
      } else {
        setError(data.message || 'Failed to delete row');
      }
    } catch (err) {
      setError('Network error: ' + (err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const columnTypes = ['string', 'text', 'integer', 'decimal', 'boolean', 'date', 'datetime'];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Database Manager
          </h1>
          <p className="text-gray-600 text-lg max-w-2xl mx-auto">
            Manage your database tables, columns, and data in real-time
          </p>
          <div className="mt-4 px-4 py-2 bg-yellow-50 border border-yellow-200 rounded-lg inline-block">
            <p className="text-sm text-yellow-800">
              ⚠️ Note: Using SQLite on Render - data resets on deployment (demo/testing purposes)
            </p>
          </div>
        </div>

        {/* Alerts */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 flex items-start">
            <svg className="w-5 h-5 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-xl text-green-700 flex items-start">
            <svg className="w-5 h-5 mr-3 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span>{success}</span>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 mb-8 bg-white rounded-2xl p-2 shadow-lg">
          <button
            onClick={() => setActiveTab('overview')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'overview'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📊 Tables Overview
          </button>
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'create'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            ➕ Create Table
          </button>
          <button
            onClick={() => setActiveTab('manage')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'manage'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            📝 Manage Data
          </button>
          <button
            onClick={() => setActiveTab('columns')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'columns'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            🔧 Add Columns
          </button>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          {/* Tables Overview Tab */}
          {activeTab === 'overview' && (
            <div>
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-800">Database Tables</h2>
                <button
                  onClick={fetchTables}
                  disabled={loading}
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                >
                  {loading ? 'Refreshing...' : '🔄 Refresh'}
                </button>
              </div>

              {tables.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
                  </svg>
                  <p className="text-lg">No tables found. Create your first table!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {tables.map((table) => (
                    <div
                      key={table.name}
                      className="border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all bg-gradient-to-br from-white to-blue-50"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <h3 className="text-xl font-bold text-gray-800">{table.name}</h3>
                        <button
                          onClick={() => deleteTable(table.name)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                          title="Delete table"
                        >
                          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                          </svg>
                        </button>
                      </div>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p className="flex items-center">
                          <span className="font-semibold mr-2">📊 Rows:</span>
                          {table.row_count}
                        </p>
                        <p className="flex items-center">
                          <span className="font-semibold mr-2">🔧 Columns:</span>
                          {table.columns.length}
                        </p>
                        <div className="mt-4">
                          <p className="font-semibold mb-2">Columns:</p>
                          <div className="space-y-1 max-h-40 overflow-y-auto">
                            {table.columns.map((col, idx) => (
                              <div key={idx} className="text-xs bg-white px-3 py-1 rounded-lg border border-gray-200">
                                <span className="font-mono text-indigo-600">{col}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Create Table Tab */}
          {activeTab === 'create' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Create New Table</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Table Name</label>
                  <input
                    type="text"
                    value={newTableName}
                    onChange={(e) => setNewTableName(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                    placeholder="e.g., products, customers"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <p className="text-xs text-gray-500 mt-1">Only lowercase letters and underscores allowed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Columns</label>
                  <div className="space-y-3">
                    {newTableColumns.map((col, idx) => (
                      <div key={idx} className="flex gap-3 items-start bg-gray-50 p-4 rounded-xl">
                        <div className="flex-1">
                          <input
                            type="text"
                            value={col.name}
                            onChange={(e) => {
                              const updated = [...newTableColumns];
                              updated[idx].name = e.target.value.toLowerCase().replace(/[^a-z_]/g, '');
                              setNewTableColumns(updated);
                            }}
                            placeholder="Column name"
                            disabled={idx === 0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                          />
                        </div>
                        <div className="flex-1">
                          <select
                            value={col.type}
                            onChange={(e) => {
                              const updated = [...newTableColumns];
                              updated[idx].type = e.target.value;
                              setNewTableColumns(updated);
                            }}
                            disabled={idx === 0}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-200"
                          >
                            {columnTypes.map((type) => (
                              <option key={type} value={type}>{type}</option>
                            ))}
                          </select>
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center cursor-pointer">
                            <input
                              type="checkbox"
                              checked={col.nullable}
                              onChange={(e) => {
                                const updated = [...newTableColumns];
                                updated[idx].nullable = e.target.checked;
                                setNewTableColumns(updated);
                              }}
                              disabled={idx === 0}
                              className="mr-2 w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                            />
                            <span className="text-sm">Nullable</span>
                          </label>
                        </div>
                        {idx > 0 && (
                          <button
                            onClick={() => {
                              setNewTableColumns(newTableColumns.filter((_, i) => i !== idx));
                            }}
                            className="text-red-500 hover:text-red-700"
                          >
                            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={() => {
                      setNewTableColumns([...newTableColumns, { name: '', type: 'string', nullable: false }]);
                    }}
                    className="mt-4 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                  >
                    + Add Column
                  </button>
                </div>

                <button
                  onClick={createTable}
                  disabled={loading || !newTableName.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Creating...' : 'Create Table'}
                </button>
              </div>
            </div>
          )}

          {/* Manage Data Tab */}
          {activeTab === 'manage' && (
            <div>
              <div className="mb-6">
                <label className="block text-sm font-semibold text-gray-700 mb-2">Select Table</label>
                <select
                  value={selectedTable}
                  onChange={(e) => setSelectedTable(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Choose a table --</option>
                  {tables.map((table) => (
                    <option key={table.name} value={table.name}>{table.name}</option>
                  ))}
                </select>
              </div>

              {selectedTable && tableData && (
                <div>
                  <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-bold text-gray-800">
                      Table: <span className="text-indigo-600">{selectedTable}</span>
                    </h3>
                    <button
                      onClick={() => {
                        setNewRow({});
                        setShowAddModal(true);
                      }}
                      className="px-6 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all"
                    >
                      ➕ Add Row
                    </button>
                  </div>

                  {tableData.data.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                      <p>No data in this table. Add your first row!</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse">
                        <thead>
                          <tr className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
                            {tableData.columns.map((col) => (
                              <th key={col} className="px-4 py-3 text-left font-semibold">
                                {col}
                              </th>
                            ))}
                            <th className="px-4 py-3 text-right font-semibold">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {tableData.data.map((row, idx) => (
                            <tr key={idx} className="border-b hover:bg-blue-50 transition-colors">
                              {tableData.columns.map((col) => (
                                <td key={col} className="px-4 py-3 text-sm">
                                  {row[col] !== null && row[col] !== undefined 
                                    ? String(row[col]) 
                                    : <span className="text-gray-400 italic">null</span>}
                                </td>
                              ))}
                              <td className="px-4 py-3 text-right space-x-2">
                                <button
                                  onClick={() => {
                                    setEditingRow(row);
                                    setShowEditModal(true);
                                  }}
                                  className="text-blue-600 hover:text-blue-800"
                                  title="Edit"
                                >
                                  ✏️
                                </button>
                                <button
                                  onClick={() => deleteRow(row.id)}
                                  className="text-red-600 hover:text-red-800"
                                  title="Delete"
                                >
                                  🗑️
                                </button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* Add Row Modal */}
              {showAddModal && tableData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-2xl font-bold mb-6">Add New Row</h3>
                    <div className="space-y-4">
                      {tableData.columns.filter(col => col !== 'id' && col !== 'created_at' && col !== 'updated_at').map((col) => (
                        <div key={col}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {col}
                          </label>
                          <input
                            type="text"
                            value={newRow[col] || ''}
                            onChange={(e) => setNewRow({ ...newRow, [col]: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => setShowAddModal(false)}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={insertRow}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {loading ? 'Adding...' : 'Add Row'}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Edit Row Modal */}
              {showEditModal && editingRow && tableData && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                  <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
                    <h3 className="text-2xl font-bold mb-6">Edit Row</h3>
                    <div className="space-y-4">
                      {tableData.columns.filter(col => col !== 'id' && col !== 'created_at' && col !== 'updated_at').map((col) => (
                        <div key={col}>
                          <label className="block text-sm font-semibold text-gray-700 mb-2">
                            {col}
                          </label>
                          <input
                            type="text"
                            value={editingRow[col] || ''}
                            onChange={(e) => setEditingRow({ ...editingRow, [col]: e.target.value })}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-3 mt-6">
                      <button
                        onClick={() => {
                          setShowEditModal(false);
                          setEditingRow(null);
                        }}
                        className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-xl hover:bg-gray-300 transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={updateRow}
                        disabled={loading}
                        className="flex-1 px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl hover:shadow-lg transition-all disabled:opacity-50"
                      >
                        {loading ? 'Updating...' : 'Update Row'}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Add Columns Tab */}
          {activeTab === 'columns' && (
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-6">Add Column to Existing Table</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Select Table</label>
                  <select
                    value={columnTableName}
                    onChange={(e) => setColumnTableName(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">-- Choose a table --</option>
                    {tables.map((table) => (
                      <option key={table.name} value={table.name}>{table.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Column Name</label>
                  <input
                    type="text"
                    value={newColumnName}
                    onChange={(e) => setNewColumnName(e.target.value.toLowerCase().replace(/[^a-z_]/g, ''))}
                    placeholder="e.g., email, phone_number"
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">Only lowercase letters and underscores allowed</p>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">Column Type</label>
                  <select
                    value={newColumnType}
                    onChange={(e) => setNewColumnType(e.target.value)}
                    className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                  >
                    {columnTypes.filter(t => t !== 'increments').map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={newColumnNullable}
                      onChange={(e) => setNewColumnNullable(e.target.checked)}
                      className="mr-3 w-5 h-5 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">Allow NULL values</span>
                  </label>
                </div>

                <button
                  onClick={addColumn}
                  disabled={loading || !columnTableName || !newColumnName.trim()}
                  className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:shadow-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Adding Column...' : 'Add Column'}
                </button>

                {columnTableName && (
                  <div className="mt-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                    <h3 className="font-bold text-gray-800 mb-4">
                      Current Columns in "{columnTableName}"
                    </h3>
                    <div className="space-y-2">
                      {tables.find(t => t.name === columnTableName)?.columns.map((col, idx) => (
                        <div key={idx} className="bg-white px-4 py-2 rounded-lg border border-gray-200">
                          <span className="font-mono text-indigo-600">{col}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Back to Home Button */}
        <div className="mt-8 text-center">
          <a
            href="/"
            className="inline-block px-8 py-4 bg-gradient-to-r from-gray-700 to-gray-900 text-white rounded-xl font-semibold hover:shadow-xl transition-all"
          >
            ← Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
