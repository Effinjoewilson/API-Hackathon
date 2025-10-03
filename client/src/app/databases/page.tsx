"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Database, Clock, Check, X, RefreshCw, Key } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface DatabaseConnection {
  id: number;
  name: string;
  description: string;
  db_type: string;
  host: string;
  port: number;
  database: string;
  connection_status: string;
  last_tested: string | null;
  last_error: string;
  created_at: string;
  updated_at: string;
}

export default function DatabasesPage() {
  const router = useRouter();
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");

  useEffect(() => {
    fetchDatabases();
  }, [searchTerm, selectedType, selectedStatus]);

  const fetchDatabases = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedType) params.append("db_type", selectedType);
      if (selectedStatus) params.append("status", selectedStatus);

      const response = await apiFetch(`/databases/connections/?${params}`);
      const data = await response.json();
      setDatabases(data);
    } catch (error) {
      console.error("Failed to fetch databases:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this database connection?")) return;

    try {
      await apiFetch(`/databases/connections/${id}/`, { method: "DELETE" });
      fetchDatabases();
    } catch (error) {
      console.error("Failed to delete database:", error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      postgresql: "🐘",
      mysql: "🐬",
      mongodb: "🍃",
      mssql: "🏢",
    };
    return icons[type] || "🗄️";
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "failed":
        return "bg-red-100 text-red-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: { [key: string]: string } = {
      postgresql: "PostgreSQL",
      mysql: "MySQL",
      mongodb: "MongoDB",
      mssql: "SQL Server",
    };
    return labels[type] || type;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading databases...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-slate-900">Database Connections</h1>
              <p className="mt-1 text-sm text-slate-600">Manage your database connections</p>
            </div>
            <button
              onClick={() => router.push("/databases/new")}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Database
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search databases..."
                className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
            >
              <option value="">All Types</option>
              <option value="postgresql">PostgreSQL</option>
              <option value="mysql">MySQL</option>
              <option value="mongodb">MongoDB</option>
              <option value="mssql">SQL Server</option>
            </select>
            <select
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="failed">Failed</option>
              <option value="unchecked">Not Tested</option>
            </select>
          </div>
        </div>

        {/* Database List */}
        {databases.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <Database className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No databases yet</h3>
            <p className="text-slate-600 mb-4">Get started by adding your first database connection</p>
            <button
              onClick={() => router.push("/databases/new")}
              className="btn-primary"
            >
              Add Your First Database
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {databases.map((db) => (
              <div key={db.id} className="card-hover p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">{getTypeIcon(db.db_type)}</span>
                      <h3 className="text-lg font-semibold text-slate-900">{db.name}</h3>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-indigo-100 text-indigo-700">
                        {getTypeLabel(db.db_type)}
                      </span>
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${getStatusColor(db.connection_status)}`}>
                        {db.connection_status === "active" && <Check className="w-3 h-3 inline mr-1" />}
                        {db.connection_status === "failed" && <X className="w-3 h-3 inline mr-1" />}
                        {db.connection_status}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{db.description || "No description"}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-slate-500">
                      <span className="flex items-center">
                        <Database className="w-3 h-3 mr-1" />
                        {db.host}:{db.port}/{db.database}
                      </span>
                      {db.last_tested && (
                        <span className="flex items-center">
                          <Clock className="w-3 h-3 mr-1" />
                          Tested {new Date(db.last_tested).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    {db.last_error && db.connection_status === "failed" && (
                      <div className="mt-2 text-xs text-red-600 bg-red-50 px-2 py-1 rounded">
                        {db.last_error}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/databases/${db.id}/schema`)}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="View Schema"
                    >
                      <Key className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/databases/${db.id}/test`)}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Test Connection"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/databases/${db.id}/edit`)}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Edit Database"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => handleDelete(db.id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete Database"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
                      