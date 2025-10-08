"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Save } from "lucide-react";
import { apiFetch } from "@/lib/api";
import MappingCanvas from "@/components/mapping/MappingCanvas";

interface FormData {
  name: string;
  description: string;
  api_endpoint: number | any;
  database: number | any;
  target_table: string;
  field_mappings: any[];
  update_on_conflict: boolean;
  conflict_columns: string[];
  batch_size: number;
  status: string;
}

export default function EditMappingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<FormData | null>(null);

  useEffect(() => {
    fetchMapping();
  }, [id]);

  const fetchMapping = async () => {
    try {
      const response = await apiFetch(`/mappings/data-mappings/${id}/`);
      const data = await response.json();
      setFormData(data);
    } catch (error) {
      console.error("Failed to fetch mapping:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!formData) return;

    setSaving(true);
    try {
      const submitData = {
        ...formData,
        api_endpoint: typeof formData.api_endpoint === 'object' ? formData.api_endpoint.id : formData.api_endpoint,
        database: typeof formData.database === 'object' ? formData.database.id : formData.database
      };

      const response = await apiFetch(`/mappings/data-mappings/${id}/`, {
        method: "PUT",
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        router.push("/mappings");
      }
    } catch (error) {
      console.error("Failed to update mapping:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading || !formData) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading mapping...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center">
            <button
              onClick={() => router.push("/mappings")}
              className="mr-4 p-2 text-slate-600 hover:text-slate-900"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-2xl font-bold text-slate-900">Edit Mapping</h1>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="space-y-6">
          {/* Basic Information */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Mapping Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Status
                  </label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="draft">Draft</option>
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Batch Size
                  </label>
                  <input
                    type="number"
                    value={formData.batch_size}
                    onChange={(e) => setFormData({ ...formData, batch_size: parseInt(e.target.value) || 100 })}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    min="1"
                    max="1000"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Field Mappings */}
          <MappingCanvas
            apiId={typeof formData.api_endpoint === 'object' ? formData.api_endpoint.id : formData.api_endpoint}
            databaseId={typeof formData.database === 'object' ? formData.database.id : formData.database}
            tableName={formData.target_table}
            initialMappings={formData.field_mappings}
            onMappingsChange={(mappings) => setFormData({ ...formData, field_mappings: mappings })}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-4">
            <button
              onClick={() => router.push("/mappings")}
              className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || formData.field_mappings.length === 0}
              className="btn-primary flex items-center"
            >
              {saving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}