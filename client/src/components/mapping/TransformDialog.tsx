"use client";
import { useState, useEffect } from "react";
import { X, Plus, Trash2, Info, Check } from "lucide-react";

interface TransformDialogProps {
  mapping: any;
  onClose: () => void;
  onSave: (updates: any) => void;
}

const AVAILABLE_TRANSFORMS = [
  // String transformations
  { value: 'lowercase', label: 'Lowercase', description: 'Convert to lowercase', category: 'string' },
  { value: 'uppercase', label: 'Uppercase', description: 'Convert to uppercase', category: 'string' },
  { value: 'trim', label: 'Trim', description: 'Remove whitespace', category: 'string' },
  { value: 'capitalize', label: 'Capitalize', description: 'Capitalize first letter', category: 'string' },
  { value: 'title_case', label: 'Title Case', description: 'Title case text', category: 'string' },
  { value: 'snake_case', label: 'Snake Case', description: 'Convert to snake_case', category: 'string' },
  { value: 'camel_case', label: 'Camel Case', description: 'Convert to camelCase', category: 'string' },
  { value: 'remove_special_chars', label: 'Remove Special Chars', description: 'Keep only alphanumeric', category: 'string' },
  { value: 'truncate_50', label: 'Truncate (50 chars)', description: 'Limit to 50 characters', category: 'string' },
  { value: 'truncate_255', label: 'Truncate (255 chars)', description: 'Limit to 255 characters', category: 'string' },

  // Type conversions
  { value: 'to_string', label: 'To String/Varchar', description: 'Convert to text/varchar', category: 'conversion' },
  { value: 'parse_int', label: 'To Integer', description: 'Convert to integer', category: 'conversion' },
  { value: 'parse_float', label: 'To Float/Decimal', description: 'Convert to decimal', category: 'conversion' },
  { value: 'parse_bool', label: 'To Boolean', description: 'Convert to true/false', category: 'conversion' },
  { value: 'json_stringify', label: 'To JSON String', description: 'Convert object to JSON string', category: 'conversion' },
  { value: 'json_parse', label: 'Parse JSON', description: 'Parse JSON string to object', category: 'conversion' },

  // Date/Time transformations
  { value: 'parse_date', label: 'Parse Date', description: 'Parse as date (YYYY-MM-DD)', category: 'datetime' },
  { value: 'parse_datetime', label: 'Parse DateTime', description: 'Parse as datetime', category: 'datetime' },
  { value: 'to_timestamp', label: 'To Timestamp', description: 'Convert to Unix timestamp', category: 'datetime' },
  { value: 'format_date_us', label: 'Format Date (US)', description: 'Format as MM/DD/YYYY', category: 'datetime' },
  { value: 'format_date_iso', label: 'Format Date (ISO)', description: 'Format as YYYY-MM-DD', category: 'datetime' },

  // Database specific
  { value: 'escape_sql', label: 'Escape SQL', description: 'Escape SQL special characters', category: 'database' },
  { value: 'null_to_empty', label: 'Null to Empty String', description: 'Convert null to empty string', category: 'database' },
  { value: 'empty_to_null', label: 'Empty to Null', description: 'Convert empty string to null', category: 'database' },
  { value: 'boolean_to_bit', label: 'Boolean to Bit', description: 'Convert true/false to 1/0', category: 'database' },
  { value: 'normalize_phone', label: 'Normalize Phone', description: 'Format phone number', category: 'validation' },
  { value: 'normalize_email', label: 'Normalize Email', description: 'Lowercase and trim email', category: 'validation' },
];

export default function TransformDialog({ mapping, onClose, onSave }: TransformDialogProps) {
  const [transformations, setTransformations] = useState<string[]>(mapping.transformations || []);
  const [defaultValue, setDefaultValue] = useState(mapping.default_value || '');
  const [skipIfNull, setSkipIfNull] = useState(mapping.skip_if_null || false);
  const [previewValue, setPreviewValue] = useState<any>('');
  const [transformedPreview, setTransformedPreview] = useState<any>('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Initialize with sample value
  useEffect(() => {
    const sampleValue = mapping.sampleValue || getDefaultSampleValue(mapping.source_type);
    setPreviewValue(sampleValue);
  }, [mapping]);

  // Apply transformations whenever they change
  useEffect(() => {
    applyTransformationsToPreview();
  }, [transformations, previewValue]);

  const getDefaultSampleValue = (type: string) => {
    switch (type) {
      case 'string': return 'Hello World!';
      case 'number': return '123.45';
      case 'boolean': return 'true';
      case 'object': return '{"name": "John", "age": 30}';
      default: return 'Sample Value';
    }
  };

  const applyTransformationsToPreview = () => {
    let result = previewValue;

    try {
      transformations.forEach(transform => {
        switch (transform) {
          // String transformations
          case 'lowercase':
            result = String(result).toLowerCase();
            break;
          case 'uppercase':
            result = String(result).toUpperCase();
            break;
          case 'trim':
            result = String(result).trim();
            break;
          case 'capitalize':
            result = String(result).charAt(0).toUpperCase() + String(result).slice(1).toLowerCase();
            break;
          case 'title_case':
            result = String(result).replace(/\w\S*/g, txt =>
              txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase()
            );
            break;
          case 'snake_case':
            result = String(result).replace(/\s+/g, '_').toLowerCase();
            break;
          case 'camel_case':
            result = String(result).replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) =>
              index === 0 ? word.toLowerCase() : word.toUpperCase()
            ).replace(/\s+/g, '');
            break;
          case 'remove_special_chars':
            result = String(result).replace(/[^a-zA-Z0-9\s]/g, '');
            break;
          case 'truncate_50':
            result = String(result).substring(0, 50);
            break;
          case 'truncate_255':
            result = String(result).substring(0, 255);
            break;

          // Type conversions
          case 'to_string':
            result = String(result);
            break;
          case 'parse_int':
            result = parseInt(String(result)) || 0;
            break;
          case 'parse_float':
            result = parseFloat(String(result)) || 0.0;
            break;
          case 'parse_bool':
            result = ['true', '1', 'yes', 'on'].includes(String(result).toLowerCase());
            break;
          case 'json_stringify':
            if (typeof result === 'object') {
              result = JSON.stringify(result);
            }
            break;
          case 'json_parse':
            try {
              result = JSON.parse(String(result));
            } catch {
              result = '{"error": "Invalid JSON"}';
            }
            break;

          // Date transformations
          case 'parse_date':
            const date = new Date(String(result));
            result = date.toISOString().split('T')[0];
            break;
          case 'parse_datetime':
            result = new Date(String(result)).toISOString();
            break;
          case 'to_timestamp':
            result = new Date(String(result)).getTime();
            break;
          case 'format_date_us':
            const usDate = new Date(String(result));
            result = `${(usDate.getMonth() + 1).toString().padStart(2, '0')}/${usDate.getDate().toString().padStart(2, '0')}/${usDate.getFullYear()}`;
            break;
          case 'format_date_iso':
            result = new Date(String(result)).toISOString().split('T')[0];
            break;

          // Database specific
          case 'escape_sql':
            result = String(result).replace(/'/g, "''");
            break;
          case 'null_to_empty':
            result = result === null || result === undefined ? '' : result;
            break;
          case 'empty_to_null':
            result = String(result).trim() === '' ? null : result;
            break;
          case 'boolean_to_bit':
            result = result ? 1 : 0;
            break;
          case 'normalize_phone':
            result = String(result).replace(/[^0-9]/g, '');
            if (result.length === 10) {
              result = `(${result.substr(0, 3)}) ${result.substr(3, 3)}-${result.substr(6, 4)}`;
            }
            break;
          case 'normalize_email':
            result = String(result).toLowerCase().trim();
            break;
        }
      });
    } catch (error) {
      result = `Error: ${error}`;
    }

    setTransformedPreview(result);
  };

  // Debug: Log transformation results
  useEffect(() => {
    if (transformedPreview !== undefined && transformedPreview !== null) {
      console.log('Transformation Preview:', {
        original: previewValue,
        originalType: typeof previewValue,
        transformed: transformedPreview,
        transformedType: typeof transformedPreview,
        transformations: transformations
      });
    }
  }, [transformedPreview, previewValue, transformations]);

  const addTransform = (transform: string) => {
    if (!transformations.includes(transform)) {
      setTransformations([...transformations, transform]);
    }
  };

  const removeTransform = (index: number) => {
    setTransformations(transformations.filter((_, i) => i !== index));
  };

  const handleSave = () => {
    onSave({
      transformations,
      default_value: defaultValue || null,
      skip_if_null: skipIfNull
    });
  };

  const categories = ['all', 'string', 'conversion', 'datetime', 'database', 'validation'];
  const filteredTransforms = selectedCategory === 'all'
    ? AVAILABLE_TRANSFORMS
    : AVAILABLE_TRANSFORMS.filter(t => t.category === selectedCategory);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <h3 className="text-lg font-semibold text-slate-900">Configure Field Mapping</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-slate-100 rounded transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        <div className="p-6 overflow-y-auto max-h-[calc(90vh-8rem)]">
          {/* Mapping Info */}
          <div className="mb-6 p-4 bg-slate-50 rounded-lg">
            <div className="text-sm text-slate-600">
              <span className="font-medium text-slate-700">{mapping.source_path}</span>
              <span className="mx-2">→</span>
              <span className="font-medium text-slate-700">{mapping.target_column}</span>
            </div>
            <div className="mt-1 text-xs text-slate-500">
              Source Type: {mapping.source_type} → Target Type: {mapping.target_type}
            </div>
          </div>

          {/* Transformation Preview */}
          <div className="mb-6 p-4 bg-indigo-50 rounded-lg">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Live Preview</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-slate-500 mb-1">Sample Input</label>
                <input
                  type="text"
                  value={previewValue}
                  onChange={(e) => setPreviewValue(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm"
                  placeholder="Enter sample value"
                />
              </div>
              <div>
                <label className="block text-xs text-slate-500 mb-1">Transformed Output</label>
                <div className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-sm font-mono">
                  {transformedPreview !== null && transformedPreview !== undefined ? (
                    <span className="text-green-700">{String(transformedPreview)}</span>
                  ) : (
                    <span className="text-slate-400">null</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Active Transformations */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3">
              Active Transformations ({transformations.length})
            </h4>

            {transformations.length > 0 ? (
              <div className="space-y-2">
                {transformations.map((transform, index) => {
                  const transformInfo = AVAILABLE_TRANSFORMS.find(t => t.value === transform);
                  return (
                    <div key={index} className="flex items-center justify-between p-3 bg-indigo-50 rounded-lg">
                      <div className="flex items-center">
                        <span className="text-sm font-medium text-indigo-900 mr-2">
                          {index + 1}.
                        </span>
                        <div>
                          <span className="text-sm font-medium text-indigo-900">
                            {transformInfo?.label || transform}
                          </span>
                          {transformInfo?.description && (
                            <p className="text-xs text-indigo-700 mt-0.5">{transformInfo.description}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={() => removeTransform(index)}
                        className="p-1 text-indigo-600 hover:text-red-600 hover:bg-red-50 rounded"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
                <div className="text-xs text-slate-500 mt-2">
                  Transformations are applied in order from top to bottom
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500 text-center py-4 bg-slate-50 rounded-lg">
                No transformations applied. Select from below to add.
              </p>
            )}
          </div>

          {/* Available Transformations */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-slate-700 mb-3">Available Transformations</h4>

            {/* Category Tabs */}
            <div className="flex flex-wrap gap-2 mb-4">
              {categories.map(category => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-3 py-1 text-xs font-medium rounded-lg transition-colors ${selectedCategory === category
                      ? 'bg-indigo-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                >
                  {category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-64 overflow-y-auto">
              {filteredTransforms.map(transform => (
                <button
                  key={transform.value}
                  onClick={() => addTransform(transform.value)}
                  disabled={transformations.includes(transform.value)}
                  className={`text-left p-3 border rounded-lg transition-all ${transformations.includes(transform.value)
                      ? 'border-green-300 bg-green-50 cursor-not-allowed'
                      : 'border-slate-200 hover:border-indigo-300 hover:bg-indigo-50'
                    }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="text-sm font-medium text-slate-700">
                        {transform.label}
                      </div>
                      <div className="text-xs text-slate-500 mt-0.5">
                        {transform.description}
                      </div>
                    </div>
                    {transformations.includes(transform.value) && (
                      <Check className="w-4 h-4 text-green-600 ml-2 mt-0.5" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Default Value */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Default Value (if source is empty)
            </label>
            <input
              type="text"
              value={defaultValue}
              onChange={(e) => setDefaultValue(e.target.value)}
              placeholder="Value to use if source is empty"
              className="w-full px-3 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
            <p className="mt-1 text-xs text-slate-500">
              This value will be used when the source field is null or empty
            </p>
          </div>

          {/* Options */}
          <div className="mb-6">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={skipIfNull}
                onChange={(e) => setSkipIfNull(e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-slate-700">Skip if null</span>
            </label>
            <p className="mt-1 text-xs text-slate-500 ml-6">
              Don't include this field in the database if the source value is null
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3 p-6 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}