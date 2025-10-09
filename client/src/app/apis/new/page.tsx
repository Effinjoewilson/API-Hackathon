"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Plus, Trash2, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface FormData {
  name: string;
  description: string;
  base_url: string;
  endpoint_path: string;
  http_method: string;
  auth_type: string;
  auth_credentials: any;
  headers: { [key: string]: string };
  query_params: { [key: string]: string };
  body_schema: any;
  body_template: any;
  content_type: string;
  category: string;
  tags: string[];
  is_active: boolean;
}

export default function NewAPIPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<any>({});

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    base_url: "",
    endpoint_path: "",
    http_method: "GET",
    auth_type: "none",
    auth_credentials: {},
    headers: {},
    query_params: {},
    body_schema: {},
    body_template: {},
    content_type: "application/json",
    category: "",
    tags: [],
    is_active: true,
  });

  const [newHeader, setNewHeader] = useState({ key: "", value: "" });
  const [newParam, setNewParam] = useState({ key: "", value: "" });
  const [newTag, setNewTag] = useState("");
  const [bodyTemplateString, setBodyTemplateString] = useState("");

  const validateJSON = (str: string): boolean => {
    try {
      JSON.parse(str);
      return true;
    } catch {
      return false;
    }
  };

  const handleBodyTemplateChange = (value: string) => {
    setBodyTemplateString(value);
    if (value.trim() === "") {
      setFormData(prev => ({ ...prev, body_template: {} }));
    } else if (validateJSON(value)) {
      try {
        setFormData(prev => ({ ...prev, body_template: JSON.parse(value) }));
      } catch {
        // Invalid JSON, don't update
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});

    try {
      const response = await apiFetch("/apis/endpoints/", {
        method: "POST",
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        router.push("/apis");
      } else {
        const data = await response.json();
        setErrors(data);
      }
    } catch (error) {
      console.error("Failed to create API:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const addHeader = () => {
    if (newHeader.key && newHeader.value) {
      setFormData(prev => ({
        ...prev,
        headers: { ...prev.headers, [newHeader.key]: newHeader.value }
      }));
      setNewHeader({ key: "", value: "" });
    }
  };

  const removeHeader = (key: string) => {
    setFormData(prev => {
      const newHeaders = { ...prev.headers };
      delete newHeaders[key];
      return { ...prev, headers: newHeaders };
    });
  };

  const addParam = () => {
    if (newParam.key && newParam.value) {
      setFormData(prev => ({
        ...prev,
        query_params: { ...prev.query_params, [newParam.key]: newParam.value }
      }));
      setNewParam({ key: "", value: "" });
    }
  };

  const removeParam = (key: string) => {
    setFormData(prev => {
      const newParams = { ...prev.query_params };
      delete newParams[key];
      return { ...prev, query_params: newParams };
    });
  };

  const addTag = () => {
    if (newTag && !formData.tags.includes(newTag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag]
      }));
      setNewTag("");
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const updateAuthCredentials = (key: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      auth_credentials: { ...prev.auth_credentials, [key]: value }
    }));
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/apis")}
              className="mr-4 p-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Add New API</h1>
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
                  API Name *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="e.g., User Management API"
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
                  placeholder="Brief description of what this API does..."
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">Select category</option>
                    <option value="internal">Internal</option>
                    <option value="external">External</option>
                    <option value="webhook">Webhook</option>
                    <option value="utility">Utility</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    name="is_active"
                    value={formData.is_active.toString()}
                    onChange={(e) => setFormData(prev => ({ ...prev, is_active: e.target.value === "true" }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="true">Active</option>
                    <option value="false">Inactive</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Endpoint Configuration */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Endpoint Configuration</h2>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    HTTP Method *
                  </label>
                  <select
                    name="http_method"
                    value={formData.http_method}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="GET">GET</option>
                    <option value="POST">POST</option>
                    <option value="PUT">PUT</option>
                    <option value="PATCH">PATCH</option>
                    <option value="DELETE">DELETE</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Authentication Type
                  </label>
                  <select
                    name="auth_type"
                    value={formData.auth_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="none">No Authentication</option>
                    <option value="api_key">API Key</option>
                    <option value="bearer">Bearer Token</option>
                    <option value="oauth">OAuth 2.0</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Base URL *
                </label>
                <input
                  type="url"
                  name="base_url"
                  value={formData.base_url}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="https://api.example.com"
                  required
                />
                {errors.base_url && <p className="mt-1 text-sm text-red-600">{errors.base_url}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Endpoint Path *
                </label>
                <input
                  type="text"
                  name="endpoint_path"
                  value={formData.endpoint_path}
                  onChange={handleChange}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  placeholder="/users/{id}"
                  required
                />
                {errors.endpoint_path && <p className="mt-1 text-sm text-red-600">{errors.endpoint_path}</p>}
              </div>
            </div>
          </div>

          {/* Authentication Credentials */}
          {formData.auth_type !== "none" && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Authentication Credentials</h2>

              {formData.auth_type === "api_key" && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      API Key *
                    </label>
                    <input
                      type="password"
                      value={formData.auth_credentials.api_key || ""}
                      onChange={(e) => updateAuthCredentials("api_key", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder="Your API key"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Key Location
                      </label>
                      <select
                        value={formData.auth_credentials.key_location || "header"}
                        onChange={(e) => updateAuthCredentials("key_location", e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      >
                        <option value="header">Header</option>
                        <option value="query">Query Parameter</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Key Name
                      </label>
                      <input
                        type="text"
                        value={formData.auth_credentials.key_name || "X-API-Key"}
                        onChange={(e) => updateAuthCredentials("key_name", e.target.value)}
                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        placeholder="X-API-Key"
                      />
                    </div>
                  </div>
                </div>
              )}

              {formData.auth_type === "bearer" && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Bearer Token *
                  </label>
                  <input
                    type="password"
                    value={formData.auth_credentials.token || ""}
                    onChange={(e) => updateAuthCredentials("token", e.target.value)}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Your bearer token"
                  />
                </div>
              )}
            </div>
          )}

          {/* Request Body Template - Show only for POST, PUT, PATCH */}
          {(formData.http_method === "POST" || formData.http_method === "PUT" || formData.http_method === "PATCH") && (
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Request Body Template</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Content Type
                  </label>
                  <select
                    name="content_type"
                    value={formData.content_type}
                    onChange={handleChange}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="application/json">JSON</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Body Template
                  </label>
                  <div className="relative">
                    <textarea
                      value={bodyTemplateString}
                      onChange={(e) => handleBodyTemplateChange(e.target.value)}
                      className="w-full h-48 px-4 py-3 border border-slate-200 rounded-lg font-mono text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      placeholder={`
                        {
                          "name": "Effin joe",
                          "email": "effin.joe@gmail.com",
                          "age": 30
                        }
                      `}
                    />
                    {bodyTemplateString && !validateJSON(bodyTemplateString) && (
                      <p className="absolute -bottom-6 left-0 text-sm text-red-600">Invalid JSON format</p>
                    )}
                  </div>
                  <p className="mt-8 text-sm text-slate-500">
                    This template will be used as the default request body when testing the API
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Headers */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Headers</h2>

            <div className="space-y-3">
              {Object.entries(formData.headers).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={key}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                    disabled
                  />
                  <input
                    type="text"
                    value={value}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                    disabled
                  />
                  <button
                    type="button"
                    onClick={() => removeHeader(key)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Header name"
                  value={newHeader.key}
                  onChange={(e) => setNewHeader(prev => ({ ...prev, key: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Header value"
                  value={newHeader.value}
                  onChange={(e) => setNewHeader(prev => ({ ...prev, value: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addHeader}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Query Parameters */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Query Parameters</h2>

            <div className="space-y-3">
              {Object.entries(formData.query_params).map(([key, value]) => (
                <div key={key} className="flex items-center space-x-2">
                  <input
                    type="text"
                    value={key}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                    disabled
                  />
                  <input
                    type="text"
                    value={value}
                    className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50"
                    disabled
                  />
                  <button
                    type="button"
                    onClick={() => removeParam(key)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Parameter name"
                  value={newParam.key}
                  onChange={(e) => setNewParam(prev => ({ ...prev, key: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <input
                  type="text"
                  placeholder="Parameter value"
                  value={newParam.value}
                  onChange={(e) => setNewParam(prev => ({ ...prev, value: e.target.value }))}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addParam}
                  className="p-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Tags */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Tags</h2>

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2 mb-3">
                {formData.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-indigo-50 text-indigo-600 rounded-md text-sm flex items-center"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-2 text-indigo-800 hover:text-indigo-900"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  placeholder="Add a tag"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  className="flex-1 px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
                >
                  Add Tag
                </button>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end space-x-4">
            <button
              type="button"
              onClick={() => router.push("/apis")}
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
                  Creating...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Create API
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}