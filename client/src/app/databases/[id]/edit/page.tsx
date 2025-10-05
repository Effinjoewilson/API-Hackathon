"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface FormData {
  name: string;
  description: string;
  db_type: string;
  host: string;
  port: number;
  database: string;
  schema: string;
  username: string;
  password: string;
  ssl_enabled: boolean;
}

export default function EditDatabasePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(false);
  const [fetchingData, setFetchingData] = useState(true);
  const [errors, setErrors] = useState<any>({});
  const [showPassword, setShowPassword] = useState(false);
  const [passwordChanged, setPasswordChanged] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    db_type: "postgresql",
    host: "localhost",
    port: 5432,
    database: "",
    schema: "",
    username: "",
    password: "",
    ssl_enabled: false,
  });

  useEffect(() => {
    fetchDatabaseData();
  }, [id]);

  const fetchDatabaseData = async () => {
    try {
      const response = await apiFetch(`/databases/connections/${id}/`);
      if (response.ok) {
        const data = await response.json();
        setFormData({
          name: data.name || "",
          description: data.description || "",
          db_type: data.db_type || "postgresql",
          host: data.host || "localhost",
          port: data.port || 5432,
          database: data.database || "",
          schema: data.schema || "",
          username: data.username || "",
          password: "", // Password is not returned for security
          ssl_enabled: data.ssl_enabled || false,
        });
      }
    } catch (error) {
      console.error("Failed to fetch database data:", error);
    } finally {
      setFetchingData(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;

    if (name === 'password') {
      setPasswordChanged(true);
    }

    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else if (name === 'port') {
      setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      // Only send password if it was changed
      const dataToSend = { ...formData };
      if (!passwordChanged || !formData.password) {
        delete (dataToSend as any).password;
      }

      const response = await apiFetch(`/databases/connections/${id}/`, {
        method: "PUT",
        body: JSON.stringify(dataToSend),
      });

      if (response.ok) {
        router.push("/databases");
      } else {
        const data = await response.json();
        setErrors(data);
      }
    } catch (error) {
      console.error("Failed to update database:", error);
    } finally {
      setLoading(false);
    }
  };

  const getDbIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      postgresql: "🐘",
      mysql: "🐬",
      mongodb: "🍃",
      mssql: "🏢",
    };
    return icons[type] || "🗄️";
  };

  if (fetchingData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading database data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/databases")}
              className="mr-4 p-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Edit Database</h1>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Database Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., Production Database"
                  required
                />
                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleChange}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="Brief description of this database connection..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Database Type
                </label>
                <div className="flex items-center space-x-2 p-3 bg-slate-50 rounded-lg">
                  <span className="text-2xl">{getDbIcon(formData.db_type)}</span>
                  <span className="font-medium text-slate-900">
                    {formData.db_type === 'postgresql' ? 'PostgreSQL' :
                      formData.db_type === 'mysql' ? 'MySQL' :
                        formData.db_type === 'mongodb' ? 'MongoDB' :
                          formData.db_type === 'mssql' ? 'SQL Server' : formData.db_type}
                  </span>
                  <span className="text-sm text-slate-500">(cannot be changed)</span>
                </div>
              </div>
            </div>
          </div>

          {/* Connection Details */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Connection Details</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Host *
                  </label>
                  <input
                    type="text"
                    name="host"
                    value={formData.host}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="localhost"
                    required
                  />
                  {errors.host && <p className="mt-1 text-sm text-red-600">{errors.host}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Port *
                  </label>
                  <input
                    type="number"
                    name="port"
                    value={formData.port}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  {errors.port && <p className="mt-1 text-sm text-red-600">{errors.port}</p>}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Database Name *
                  </label>
                  <input
                    type="text"
                    name="database"
                    value={formData.database}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={formData.db_type === 'mongodb' ? 'mydb' : 'database_name'}
                    required
                  />
                  {errors.database && <p className="mt-1 text-sm text-red-600">{errors.database}</p>}
                </div>

                {(formData.db_type === 'postgresql' || formData.db_type === 'mssql') && (
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Schema
                    </label>
                    <input
                      type="text"
                      name="schema"
                      value={formData.schema}
                      onChange={handleChange}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={formData.db_type === 'mssql' ? 'dbo' : 'public'}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Authentication */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Authentication</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Username *
                </label>
                <input
                  type="text"
                  name="username"
                  value={formData.username}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder={formData.db_type === 'postgresql' ? 'postgres' : 'root'}
                  required
                />
                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Password {!passwordChanged && <span className="text-slate-500">(leave blank to keep current)</span>}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder={passwordChanged ? "Enter new password" : "••••••••"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-800"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="ssl_enabled"
                  name="ssl_enabled"
                  checked={formData.ssl_enabled}
                  onChange={handleChange}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="ssl_enabled" className="ml-2 block text-sm text-slate-700">
                  Enable SSL/TLS Connection
                </label>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push("/databases")}
              className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex items-center"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Updating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Update Database
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}