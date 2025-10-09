"use client";
import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Database, Activity, ArrowRight } from "lucide-react";
import { apiFetch } from "@/lib/api";
import MappingCanvas from "@/components/mapping/MappingCanvas";

interface API {
  id: number;
  name: string;
}

interface DatabaseConnection {
  id: number;
  name: string;
  db_type: string;
}

interface FormData {
  name: string;
  description: string;
  api_endpoint: number | null;
  database: number | null;
  target_table: string;
  field_mappings: any[];
  update_on_conflict: boolean;
  conflict_columns: string[];
  batch_size: number;
  status: string;
}

export default function NewMappingPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [apis, setApis] = useState<API[]>([]);
  const [databases, setDatabases] = useState<DatabaseConnection[]>([]);
  const [tables, setTables] = useState<string[]>([]);
  const [loadingTables, setLoadingTables] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    api_endpoint: null,
    database: null,
    target_table: "",
    field_mappings: [],
    update_on_conflict: false,
    conflict_columns: [],
    batch_size: 100,
    status: "draft",
  });

  useEffect(() => {
    fetchAPIs();
    fetchDatabases();
  }, []);

  useEffect(() => {
    if (formData.database) {
      fetchTables(formData.database);
    }
  }, [formData.database]);

  const fetchAPIs = async () => {
    try {
      const response = await apiFetch("/apis/endpoints/?is_active=true");
      const data = await response.json();
      setApis(data);
    } catch (error) {
      console.error("Failed to fetch APIs:", error);
    }
  };

  const fetchDatabases = async () => {
    try {
      const response = await apiFetch("/databases/connections/?status=active");
      const data = await response.json();
      setDatabases(data);
    } catch (error) {
      console.error("Failed to fetch databases:", error);
    }
  };

  const fetchTables = async (dbId: number) => {
    setLoadingTables(true);
    try {
      const response = await apiFetch(`/databases/connections/${dbId}/schema/`);
      const data = await response.json();

      if (data.tables) {
        setTables(Object.keys(data.tables));
      } else if (data.collections) {
        setTables(Object.keys(data.collections));
      }
    } catch (error) {
      console.error("Failed to fetch tables:", error);
    } finally {
      setLoadingTables(false);
    }
  };

  const handleNext = () => {
    if (step === 1 && formData.name && formData.api_endpoint && formData.database && formData.target_table) {
      setStep(2);
    }
  };

  // Memoize the callback to prevent infinite loops
  const handleMappingsChange = useCallback((mappings: any[]) => {
    setFormData(prev => ({ ...prev, field_mappings: mappings }));
  }, []);

  const handleSubmit = async () => {
    // Validate all mappings before submitting
    const invalidMappings = formData.field_mappings.filter(mapping => {
      return mapping.validation && !mapping.validation.compatible;
    });

    const needsConversionMappings = formData.field_mappings.filter(mapping => {
      return mapping.validation && mapping.validation.compatible && mapping.validation.conversion_needed;
    });

    if (invalidMappings.length > 0 || needsConversionMappings.length > 0) {
      let errorMessage = '';
      if (invalidMappings.length > 0) {
        errorMessage += `${invalidMappings.length} invalid field mapping(s) found.\n`;
      }
      if (needsConversionMappings.length > 0) {
        errorMessage += `${needsConversionMappings.length} mapping(s) need conversion.\n`;
      }
      errorMessage += '\nPlease add appropriate transformations or remove these mappings.';

      alert(errorMessage);
      return;
    }

    setLoading(true);
    try {
      // Transform field_mappings to match backend expectations
      const transformedMappings = formData.field_mappings.map(mapping => ({
        source_path: mapping.source_path,
        source_type: mapping.source_type,
        target_column: mapping.target_column,
        target_type: mapping.target_type,
        transformations: mapping.transformations || [],
        is_required: mapping.is_required || false,
        default_value: mapping.default_value || null
      }));

      const response = await apiFetch("/mappings/data-mappings/", {
        method: "POST",
        body: JSON.stringify({
          ...formData,
          api_endpoint: formData.api_endpoint,
          database: formData.database,
          field_mappings: transformedMappings
        }),
      });

      if (response.ok) {
        const data = await response.json();
        router.push(`/mappings/${data.id}/preview`);
      }
    } catch (error) {
      console.error("Failed to create mapping:", error);
    } finally {
      setLoading(false);
    }
  };

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
            <h1 className="text-2xl font-bold text-slate-900">Create New Mapping</h1>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-6 space-x-4">
            <div className={`flex items-center ${step >= 1 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 1 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
                1
              </div>
              <span className="ml-2 font-medium">Configuration</span>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-400" />
            <div className={`flex items-center ${step >= 2 ? 'text-indigo-600' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center ${step >= 2 ? 'bg-indigo-600 text-white' : 'bg-slate-200'}`}>
                2
              </div>
              <span className="ml-2 font-medium">Visual Field Mapping</span>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {step === 1 && (
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
                    onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="e.g., Sync Product Data to Database"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Description
                  </label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    placeholder="Describe what this mapping does..."
                  />
                </div>
              </div>
            </div>

            {/* Source & Destination */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Source & Destination</h2>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Source API */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Source API *
                    </label>
                    <select
                      value={formData.api_endpoint || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, api_endpoint: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select an API</option>
                      {apis.map(api => (
                        <option key={api.id} value={api.id}>{api.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Target Database */}
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Target Database *
                    </label>
                    <select
                      value={formData.database || ""}
                      onChange={(e) => setFormData(prev => ({ ...prev, database: parseInt(e.target.value) }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="">Select a database</option>
                      {databases.map(db => (
                        <option key={db.id} value={db.id}>
                          {db.name} ({db.db_type})
                        </option>
                      ))}
                    </select>
                  </div>

                  {formData.database && (
                    <div>
                      <label className="block text-sm font-medium text-slate-700 mb-1">
                        Target Table *
                      </label>
                      {loadingTables ? (
                        <div className="w-full px-4 py-2 border border-slate-200 rounded-lg bg-slate-50">
                          <div className="flex items-center">
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                            Loading tables...
                          </div>
                        </div>
                      ) : (
                        <select
                          value={formData.target_table}
                          onChange={(e) => setFormData(prev => ({ ...prev, target_table: e.target.value }))}
                          className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        >
                          <option value="">Select a table</option>
                          {tables.map(table => (
                            <option key={table} value={table}>{table}</option>
                          ))}
                        </select>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Advanced Options */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold text-slate-900 mb-4">Advanced Options</h2>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="update_on_conflict"
                    checked={formData.update_on_conflict}
                    onChange={(e) => setFormData(prev => ({ ...prev, update_on_conflict: e.target.checked }))}
                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                  />
                  <label htmlFor="update_on_conflict" className="ml-2 block text-sm text-slate-700">
                    Update existing records on conflict (Upsert)
                  </label>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Batch Size
                    </label>
                    <input
                      type="number"
                      value={formData.batch_size}
                      onChange={(e) => setFormData(prev => ({ ...prev, batch_size: parseInt(e.target.value) || 100 }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      min="1"
                      max="1000"
                    />
                    <p className="text-xs text-slate-500 mt-1">Number of records to process at once</p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Status
                    </label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="draft">Draft</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => router.push("/mappings")}
                className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleNext}
                disabled={!formData.name || !formData.api_endpoint || !formData.database || !formData.target_table}
                className="btn-primary flex items-center"
              >
                Next: Visual Field Mapping
                <ArrowRight className="w-4 h-4 ml-2" />
              </button>
            </div>
          </div>
        )}

        {step === 2 && formData.api_endpoint && formData.database && (
          <div className="flex flex-col">
            <div className="flex-1 min-h-0">
              <MappingCanvas
                apiId={formData.api_endpoint}
                databaseId={formData.database}
                tableName={formData.target_table}
                initialMappings={formData.field_mappings}
                onMappingsChange={handleMappingsChange}
              />
            </div>

            <div className="flex justify-between mt-6 pb-6">
              <button
                onClick={() => setStep(1)}
                className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Back
              </button>
              <div className="space-x-4">
                <button
                  onClick={() => router.push("/mappings")}
                  className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={loading || formData.field_mappings.length === 0}
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
                      Create Mapping
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}