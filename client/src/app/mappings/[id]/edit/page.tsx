"use client";
import { useState, useEffect, useCallback } from "react";
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
  const [processedMappings, setProcessedMappings] = useState<any[]>([]);

  useEffect(() => {
    fetchMapping();
  }, [id]);

  const fetchMapping = async () => {
    try {
      const response = await apiFetch(`/mappings/data-mappings/${id}/`);
      const data = await response.json();

      // Process mappings to add validation info
      const mappings = processExistingMappings(data.field_mappings);

      setFormData(data);
      setProcessedMappings(mappings);
    } catch (error) {
      console.error("Failed to fetch mapping:", error);
    } finally {
      setLoading(false);
    }
  };

  const processExistingMappings = (mappings: any[]): any[] => {
    if (!mappings || mappings.length === 0) return [];

    return mappings.map(mapping => {
      const sourceType = mapping.source_type || 'string';
      const targetType = mapping.target_type || 'string';
      const transformations = mapping.transformations || [];

      // Get the type after transformations
      const transformedType = getTransformedType(sourceType, transformations);

      // Check if types are compatible
      const compatibility = checkTypeCompatibility(sourceType, targetType, transformations);

      // Create validation info
      const validation = {
        source_type: sourceType,
        transformed_type: transformedType,
        target_type: targetType,
        compatible: true, // Always true for saved mappings
        conversion_needed: false, // Set to false by default for saved mappings
        warning: undefined // Only show warning if there's a transformation
      };

      // Only show conversion info if there are actual transformations
      if (transformations.length > 0) {

      } else if (sourceType.toLowerCase() !== targetType.toLowerCase()) {
      }

      return {
        ...mapping,
        source_type: sourceType,
        target_type: targetType,
        transformations: transformations,
        default_value: mapping.default_value || null,
        skip_if_null: mapping.skip_if_null || false,
        is_required: mapping.is_required || false,
        validation: validation,
        _fromSavedData: true
      };
    });
  };

  const checkTypeCompatibility = (sourceType: string, targetType: string, transformations: string[] = []): boolean => {
    const source = sourceType.toLowerCase();
    const target = targetType.toLowerCase();

    // If there are transformations, check the final transformed type
    if (transformations.length > 0) {
      const transformedType = getTransformedType(sourceType, transformations);
      return isCompatibleType(transformedType.toLowerCase(), target);
    }

    // Direct type compatibility check
    return isCompatibleType(source, target);
  };

  const isCompatibleType = (source: string, target: string): boolean => {
    // Direct match
    if (source === target) return true;

    // Compatible type mappings
    const compatibilityMap: { [key: string]: string[] } = {
      // String types
      'string': ['varchar', 'text', 'char', 'character varying', 'nvarchar', 'ntext', 'longtext', 'mediumtext', 'tinytext'],
      'varchar': ['string', 'text', 'char', 'character varying'],
      'text': ['string', 'varchar', 'char', 'longtext'],

      // Number types
      'integer': ['int', 'bigint', 'smallint', 'tinyint'],
      'int': ['integer', 'bigint', 'smallint'],
      'bigint': ['int', 'integer'],
      'number': ['int', 'integer', 'bigint', 'float', 'double', 'decimal', 'numeric'],

      // Boolean types
      'boolean': ['bool', 'bit', 'tinyint(1)'],
      'bool': ['boolean', 'bit'],

      // Date types
      'date': ['datetime', 'timestamp'],
      'datetime': ['date', 'timestamp'],

      // JSON/Object types
      'object': ['json', 'jsonb', 'text', 'array'],
      'json': ['object', 'jsonb', 'text'],
      'array': ['json', 'jsonb', 'object'],
    };

    // Check if source type is compatible with target
    if (compatibilityMap[source]) {
      if (compatibilityMap[source].includes(target)) return true;
    }

    // Check reverse mapping
    for (const [key, values] of Object.entries(compatibilityMap)) {
      if (values.includes(source) && key === target) return true;
      if (values.includes(source) && values.includes(target)) return true;
    }

    return false;
  };

  const getTransformedType = (originalType: string, transformations: string[]): string => {
    let outputType = originalType;

    transformations.forEach(transform => {
      switch (transform) {
        case "lowercase":
        case "uppercase":
        case "trim":
        case "capitalize":
        case "title_case":
        case "snake_case":
        case "camel_case":
        case "remove_special_chars":
        case "truncate_50":
        case "truncate_255":
        case "to_string":
        case "escape_sql":
        case "normalize_phone":
        case "normalize_email":
        case "json_stringify":
        case "format_date_us":
        case "format_date_iso":
          outputType = "string";
          break;

        case "parse_int":
        case "boolean_to_bit":
          outputType = "integer";
          break;

        case "parse_float":
        case "to_timestamp":
          outputType = "float";
          break;

        case "parse_bool":
          outputType = "boolean";
          break;

        case "parse_date":
          outputType = "date";
          break;

        case "parse_datetime":
          outputType = "datetime";
          break;

        case "json_parse":
          outputType = "object";
          break;
      }
    });

    return outputType;
  };

  const getConversionMessage = (
    sourceType: string,
    transformedType: string,
    targetType: string,
    transformations: string[]
  ): string | undefined => {
    // No transformations = no conversion message needed
    if (transformations.length === 0) {
      return undefined;
    }

    const transformDescriptions = transformations.map(t => {
      switch (t) {
        case 'parse_int': return 'Convert to integer';
        case 'parse_float': return 'Convert to float';
        case 'parse_bool': return 'Convert to boolean';
        case 'parse_date': return 'Parse as date';
        case 'parse_datetime': return 'Parse as datetime';
        case 'to_string': return 'Convert to string';
        case 'json_stringify': return 'Convert to JSON string';
        case 'json_parse': return 'Parse JSON';
        case 'lowercase': return 'Convert to lowercase';
        case 'uppercase': return 'Convert to uppercase';
        case 'trim': return 'Trim whitespace';
        case 'boolean_to_bit': return 'Convert boolean to bit (0/1)';
        default: return t.replace(/_/g, ' ');
      }
    }).join(' → ');

    return `${transformDescriptions} (${sourceType} → ${transformedType} → ${targetType})`;
  };

  // Memoized callback to handle mapping changes
  const handleMappingsChange = useCallback((updatedMappings: any[]) => {
    if (!formData) return;

    // Process new/updated mappings to ensure they have validation info
    const processedUpdatedMappings = updatedMappings.map(mapping => {
      // If this mapping already has validation and is from saved data, keep it
      if (mapping._fromSavedData && mapping.validation) {
        return mapping;
      }

      // Otherwise, process it
      const transformedType = getTransformedType(
        mapping.source_type || 'string',
        mapping.transformations || []
      );

      const validation = mapping.validation || {
        source_type: mapping.source_type || 'string',
        transformed_type: transformedType,
        target_type: mapping.target_type || 'string',
        compatible: true,
        conversion_needed: transformedType !== (mapping.target_type || 'string'),
        warning: getConversionMessage(
          mapping.source_type || 'string',
          transformedType,
          mapping.target_type || 'string',
          mapping.transformations || []
        )
      };

      return {
        ...mapping,
        validation: validation
      };
    });

    setFormData({
      ...formData,
      field_mappings: processedUpdatedMappings
    });
  }, [formData]);

  const handleSubmit = async () => {
    if (!formData) return;

    setSaving(true);
    try {
      // Clean up mappings before sending to backend
      const cleanedMappings = formData.field_mappings.map(mapping => {
        // Remove UI-specific fields
        const { validation, _fromSavedData, sampleValue, ...cleanMapping } = mapping;
        return {
          source_path: cleanMapping.source_path,
          source_type: cleanMapping.source_type || 'string',
          target_column: cleanMapping.target_column,
          target_type: cleanMapping.target_type || 'string',
          transformations: cleanMapping.transformations || [],
          is_required: cleanMapping.is_required || false,
          default_value: cleanMapping.default_value || null,
          skip_if_null: cleanMapping.skip_if_null || false
        };
      });

      const submitData = {
        ...formData,
        api_endpoint: typeof formData.api_endpoint === 'object' ? formData.api_endpoint.id : formData.api_endpoint,
        database: typeof formData.database === 'object' ? formData.database.id : formData.database,
        field_mappings: cleanedMappings
      };

      const response = await apiFetch(`/mappings/data-mappings/${id}/`, {
        method: "PUT",
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        router.push("/mappings");
      } else {
        const errorData = await response.json();
        console.error("Failed to update mapping:", errorData);
        alert("Failed to update mapping. Please check the console for details.");
      }
    } catch (error) {
      console.error("Failed to update mapping:", error);
      alert("An error occurred while saving. Please try again.");
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
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <button
                onClick={() => router.push("/mappings")}
                className="mr-4 p-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold text-slate-900">Edit Mapping</h1>
            </div>
            <div className="text-sm text-slate-600">
              ID: {id}
            </div>
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
                  value={formData.description || ''}
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

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="update_on_conflict"
                  checked={formData.update_on_conflict || false}
                  onChange={(e) => setFormData({ ...formData, update_on_conflict: e.target.checked })}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="update_on_conflict" className="ml-2 block text-sm text-slate-700">
                  Update existing records on conflict (Upsert)
                </label>
              </div>
            </div>
          </div>

          {/* Source & Target Info (Read-only) */}
          <div className="card p-6">
            <h2 className="text-lg font-semibold text-slate-900 mb-4">Source & Target</h2>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
              <div>
                <span className="text-slate-500">API Endpoint:</span>
                <p className="font-medium text-slate-700">
                  {typeof formData.api_endpoint === 'object' ? formData.api_endpoint.name : `ID: ${formData.api_endpoint}`}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Database:</span>
                <p className="font-medium text-slate-700">
                  {typeof formData.database === 'object' ? formData.database.name : `ID: ${formData.database}`}
                </p>
              </div>
              <div>
                <span className="text-slate-500">Target Table:</span>
                <p className="font-medium text-slate-700">{formData.target_table}</p>
              </div>
            </div>
          </div>

          {/* Field Mappings */}
          <MappingCanvas
            apiId={typeof formData.api_endpoint === 'object' ? formData.api_endpoint.id : formData.api_endpoint}
            databaseId={typeof formData.database === 'object' ? formData.database.id : formData.database}
            tableName={formData.target_table}
            initialMappings={processedMappings}
            onMappingsChange={handleMappingsChange}
          />

          {/* Actions */}
          <div className="flex justify-end space-x-4 pb-8">
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