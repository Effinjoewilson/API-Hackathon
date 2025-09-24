"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Plus, Search, Filter, MoreVertical, Play, Edit, Trash2, Clock, Check, X } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface APIEndpoint {
  id: number;
  name: string;
  description: string;
  base_url: string;
  endpoint_path: string;
  http_method: string;
  auth_type: string;
  category: string;
  tags: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
  full_url: string;
}

export default function APIsPage() {
  const router = useRouter();
  const [apis, setApis] = useState<APIEndpoint[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedAuthType, setSelectedAuthType] = useState("");

  useEffect(() => {
    fetchAPIs();
  }, [searchTerm, selectedCategory, selectedAuthType]);

  const fetchAPIs = async () => {
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (selectedCategory) params.append("category", selectedCategory);
      if (selectedAuthType) params.append("auth_type", selectedAuthType);

      const response = await apiFetch(`/apis/endpoints/?${params}`);
      const data = await response.json();
      setApis(data);
    } catch (error) {
      console.error("Failed to fetch APIs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this API?")) return;

    try {
      await apiFetch(`/apis/endpoints/${id}/`, { method: "DELETE" });
      fetchAPIs();
    } catch (error) {
      console.error("Failed to delete API:", error);
    }
  };

  const getMethodColor = (method: string) => {
    const colors: { [key: string]: string } = {
      GET: "bg-green-100 text-green-700",
      POST: "bg-blue-100 text-blue-700",
      PUT: "bg-yellow-100 text-yellow-700",
      PATCH: "bg-orange-100 text-orange-700",
      DELETE: "bg-red-100 text-red-700",
    };
    return colors[method] || "bg-gray-100 text-gray-700";
  };

  const getAuthTypeLabel = (authType: string) => {
    const labels: { [key: string]: string } = {
      none: "No Auth",
      api_key: "API Key",
      bearer: "Bearer Token",
      oauth: "OAuth 2.0",
    };
    return labels[authType] || authType;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading APIs...</p>
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
              <h1 className="text-2xl font-bold text-slate-900">API Endpoints</h1>
              <p className="mt-1 text-sm text-slate-600">Manage and test your API configurations</p>
            </div>
            <button
              onClick={() => router.push("/apis/new")}
              className="btn-primary flex items-center"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add API
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
                placeholder="Search APIs..."
                className="pl-10 pr-4 py-2 w-full border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="internal">Internal</option>
              <option value="external">External</option>
              <option value="webhook">Webhook</option>
            </select>
            <select
              className="px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
              value={selectedAuthType}
              onChange={(e) => setSelectedAuthType(e.target.value)}
            >
              <option value="">All Auth Types</option>
              <option value="none">No Auth</option>
              <option value="api_key">API Key</option>
              <option value="bearer">Bearer Token</option>
              <option value="oauth">OAuth 2.0</option>
            </select>
          </div>
        </div>

        {/* API List */}
        {apis.length === 0 ? (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-slate-100 rounded-full mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-slate-900 mb-2">No APIs yet</h3>
            <p className="text-slate-600 mb-4">Get started by adding your first API endpoint</p>
            <button
              onClick={() => router.push("/apis/new")}
              className="btn-primary"
            >
              Add Your First API
            </button>
          </div>
        ) : (
          <div className="mt-6 space-y-4">
            {apis.map((api) => (
              <div key={api.id} className="card-hover p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-semibold text-slate-900">{api.name}</h3>
                      <span className={`px-2.5 py-0.5 rounded-md text-xs font-medium ${getMethodColor(api.http_method)}`}>
                        {api.http_method}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md text-xs font-medium bg-slate-100 text-slate-700">
                        {getAuthTypeLabel(api.auth_type)}
                      </span>
                      {api.is_active ? (
                        <span className="flex items-center text-xs text-green-600">
                          <Check className="w-3 h-3 mr-1" />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center text-xs text-red-600">
                          <X className="w-3 h-3 mr-1" />
                          Inactive
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-sm text-slate-600">{api.description || "No description"}</p>
                    <div className="mt-2 flex items-center space-x-4 text-xs text-slate-500">
                      <code className="bg-slate-100 px-2 py-1 rounded">{api.full_url}</code>
                      {api.category && (
                        <span className="flex items-center">
                          <Filter className="w-3 h-3 mr-1" />
                          {api.category}
                        </span>
                      )}
                      <span className="flex items-center">
                        <Clock className="w-3 h-3 mr-1" />
                        Updated {new Date(api.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    {api.tags.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {api.tags.map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-indigo-50 text-indigo-600 text-xs rounded-md">
                            {tag}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => router.push(`/apis/${api.id}/test`)}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Test API"
                    >
                      <Play className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => router.push(`/apis/${api.id}/edit`)}
                      className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-slate-50 rounded-lg transition-colors"
                      title="Edit API"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(api.id)}
                      className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Delete API"
                    >
                      <Trash2 className="w-4 h-4" />
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