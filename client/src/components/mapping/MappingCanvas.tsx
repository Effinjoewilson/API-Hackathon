"use client";
import { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import APIFieldTree from "./APIFieldTree";
import DBSchemaTree from "./DBSchemaTree";
import MappingLine from "./MappingLine";
import MappingSummary from "./MappingSummary";
import { Sparkles, RefreshCw, Trash2 } from "lucide-react";

interface MappingCanvasProps {
  apiId: number;
  databaseId: number;
  tableName: string;
  initialMappings?: any[];
  onMappingsChange: (mappings: any[]) => void;
}

interface DatabaseColumn {
  name: string;
  type: string;
  nullable: boolean;
  constraints: string[];
}

interface MongoDBField {
  name: string;
  type: string;
  required?: boolean;
  validation?: {
    required?: boolean;
    [key: string]: any;
  };
}

interface DatabaseSchema {
  columns?: DatabaseColumn[];  // For SQL databases
  fields?: MongoDBField[];     // For MongoDB
}

const normalizeMongoDBType = (mongoType: string): string => {
  const typeMap: { [key: string]: string } = {
    'ObjectId': 'objectid',
    'str': 'string',
    'int': 'integer',
    'float': 'float',
    'double': 'float',
    'bool': 'boolean',
    'datetime': 'datetime',
    'date': 'date',
    'array': 'array',
    'array[dict]': 'array',
    'dict': 'object',
    'object': 'object'
  };

  return typeMap[mongoType] || mongoType.toLowerCase();
};

export default function MappingCanvas({
  apiId,
  databaseId,
  tableName,
  initialMappings = [],
  onMappingsChange
}: MappingCanvasProps) {
  const [loading, setLoading] = useState(true);
  const [apiSample, setApiSample] = useState<any>({});
  const [dbSchema, setDbSchema] = useState<any>({});
  const [suggestedMappings, setSuggestedMappings] = useState<any[]>([]);
  const [typeValidations, setTypeValidations] = useState<any>({});
  const [mappings, setMappings] = useState<any[]>(initialMappings);
  const [selectedMapping, setSelectedMapping] = useState<string | null>(null);
  const [draggedField, setDraggedField] = useState<any>(null);
  const [history, setHistory] = useState<any[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [validationRules, setValidationRules] = useState<any>(null);
  const [validationErrors, setValidationErrors] = useState<{ field: string; message: string }[]>([]);

  // Add auto-scroll support
  useEffect(() => {
    let scrollInterval: NodeJS.Timeout;

    const handleDragOver = (e: DragEvent) => {
      const scrollThreshold = 100;
      const scrollSpeed = 10;

      if (scrollInterval) clearInterval(scrollInterval);

      const nearTop = e.clientY < scrollThreshold;
      const nearBottom = e.clientY > window.innerHeight - scrollThreshold;

      if (nearTop || nearBottom) {
        scrollInterval = setInterval(() => {
          if (nearTop) {
            window.scrollBy(0, -scrollSpeed);
          } else {
            window.scrollBy(0, scrollSpeed);
          }
        }, 20);
      }
    };

    const handleDragEnd = () => {
      if (scrollInterval) clearInterval(scrollInterval);
    };

    document.addEventListener("dragover", handleDragOver);
    document.addEventListener("dragend", handleDragEnd);

    return () => {
      if (scrollInterval) clearInterval(scrollInterval);
      document.removeEventListener("dragover", handleDragOver);
      document.removeEventListener("dragend", handleDragEnd);
    };
  }, []);

  useEffect(() => {
    fetchValidationRules();
  }, []);

  const fetchValidationRules = async () => {
    try {
      const response = await apiFetch("/mappings/data-mappings/validation_rules/");
      const rules = await response.json();
      setValidationRules(rules);
    } catch (error) {
      console.error("Failed to fetch validation rules:", error);
    }
  };

  useEffect(() => {
    fetchPreviewData();
  }, [apiId, databaseId, tableName]);

  useEffect(() => {
    onMappingsChange(mappings);
  }, [mappings]);

  const fetchPreviewData = async () => {
    setLoading(true);
    try {
      const requestData = {
        api_endpoint_id: apiId,
        database_id: databaseId,
        target_table: tableName
      };

      console.log("Sending preview request with data:", requestData);

      const response = await apiFetch("/mappings/data-mappings/preview/", {
        method: "POST",
        body: JSON.stringify(requestData)
      });

      if (response.ok) {
        const data = await response.json();
        console.log("Preview data received:", data);
        setApiSample(data.api_sample);
        setDbSchema(data.db_schema);
        setSuggestedMappings(data.suggested_mappings);
        setTypeValidations(data.type_validations);
      } else {
        const errorData = await response.json();
        console.error("Preview request failed:", errorData);
      }
    } catch (error) {
      console.error("Failed to fetch preview data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAutoMap = () => {
    const newMappings = suggestedMappings
      .filter(s => s.confidence > 80)
      .map(s => ({
        source_path: s.source_path,
        target_column: s.target_column,
        transformations: [],
        default_value: null,
        skip_if_null: false
      }));

    setMappings(newMappings);
  };

  const handleCreateMapping = (sourcePath: string, targetColumn: string) => {
    const exists = mappings.some(
      m => m.source_path === sourcePath && m.target_column === targetColumn
    );

    if (!exists) {
      const sampleValue = getValueFromPath(apiSample, sourcePath);
      const sourceType = typeof sampleValue;

      let targetType = "string";
      if (dbSchema.columns) {
        const column = dbSchema.columns.find((c: any) => c.name === targetColumn);
        targetType = column?.type || "string";
      } else if (dbSchema.fields) {
        // Handle MongoDB fields
        const field = dbSchema.fields.find((f: any) => f.name === targetColumn);
        if (field) {
          targetType = normalizeMongoDBType(field.type);
        }
      }

      const newMapping = {
        source_path: sourcePath,
        target_column: targetColumn,
        source_type: sourceType,
        target_type: targetType,
        sampleValue: sampleValue,
        transformations: [],
        default_value: null,
        skip_if_null: false
      };

      const validatedMapping = updateMappingValidation(newMapping);
      const newMappings = [...mappings, validatedMapping];
      setMappings(newMappings);
      addToHistory(newMappings);
    }
  };

  const getValueFromPath = (obj: any, path: string): any => {
    if (!path) return null;
    const parts = path.split(".").filter(Boolean);
    let value = obj;

    for (const part of parts) {
      if (value && typeof value === "object") {
        if (part === "*" || part === "0") {
          value = Array.isArray(value) && value.length > 0 ? value[0] : null;
        } else {
          value = value[part];
        }
      } else {
        return null;
      }
    }

    return value;
  };

  const handleDeleteMapping = (index: number) => {
    setMappings(mappings.filter((_, i) => i !== index));
  };

  // --- NEW: Type transformation and validation helpers ---

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

        case "empty_to_null":
        case "null_to_empty":
          break;
      }
    });

    return outputType;
  };

  const checkTypeCompatibility = (
    sourceType: string,
    targetType: string
  ): { compatible: boolean; conversion_needed: boolean; warning?: string } => {
    const source = sourceType.toLowerCase();
    const target = targetType.toLowerCase();

    // Direct compatible mappings (no transformation needed)
    const directCompatible = {
      // String types
      'string': ['varchar', 'text', 'char', 'character varying', 'nvarchar', 'ntext', 'longtext', 'mediumtext', 'tinytext', 'string'],

      // Integer types
      'integer': ['int', 'integer', 'bigint', 'smallint', 'tinyint', 'int2', 'int4', 'int8', 'serial', 'bigserial', 'smallserial'],
      'number': ['int', 'integer', 'bigint', 'smallint', 'tinyint', 'float', 'double', 'decimal', 'numeric', 'real', 'double precision', 'money'],

      // Float types
      'float': ['float', 'double', 'decimal', 'numeric', 'real', 'double precision', 'float4', 'float8', 'money'],

      // Boolean types
      'boolean': ['bool', 'boolean', 'bit', 'tinyint(1)'],

      // Date types
      'date': ['date', 'datetime', 'timestamp', 'timestamptz', 'timestamp with time zone', 'timestamp without time zone'],
      'datetime': ['datetime', 'timestamp', 'timestamptz', 'timestamp with time zone', 'timestamp without time zone'],

      // JSON types
      'object': ['json', 'jsonb', 'text', 'longtext', 'nvarchar(max)'],
      'array': ['json', 'jsonb', 'text', 'longtext', 'nvarchar(max)'],
    };

    // MongoDB field types (when source is from MongoDB)
    const mongoDBTypes = {
      'objectid': ['varchar', 'text', 'char', 'string'],
      'string': ['varchar', 'text', 'char', 'string'],
      'int': ['int', 'integer', 'bigint'],
      'long': ['bigint', 'int8'],
      'double': ['double', 'float', 'decimal', 'numeric'],
      'decimal': ['decimal', 'numeric', 'money'],
      'bool': ['boolean', 'bool', 'bit'],
      'date': ['timestamp', 'datetime', 'date'],
      'object': ['json', 'jsonb', 'text'],
      'array': ['json', 'jsonb', 'text'],
    };

    // Check direct compatibility
    for (const [srcType, compatibleTypes] of Object.entries(directCompatible)) {
      if (source.includes(srcType) || srcType === source) {
        for (const compatType of compatibleTypes) {
          if (target.includes(compatType) || compatType === target) {
            return {
              compatible: true,
              conversion_needed: false
            };
          }
        }
      }
    }

    // Check MongoDB compatibility
    for (const [srcType, compatibleTypes] of Object.entries(mongoDBTypes)) {
      if (source === srcType) {
        for (const compatType of compatibleTypes) {
          if (target.includes(compatType)) {
            return {
              compatible: true,
              conversion_needed: false
            };
          }
        }
      }
    }

    // Add MongoDB-specific type handling
    if (target === 'objectid') {
      if (source === 'string') {
        return {
          compatible: true,
          conversion_needed: false,
          warning: 'Ensure string is a valid ObjectId format (24 hex characters)'
        };
      }
    }

    // Handle array[dict] type
    if (target === 'array' || target.includes('array')) {
      if (source === 'array' || source === 'object') {
        return {
          compatible: true,
          conversion_needed: false
        };
      }
      if (source === 'string') {
        return {
          compatible: true,
          conversion_needed: true,
          warning: 'Use json_parse to convert string to array'
        };
      }
    }

    // Handle MongoDB datetime
    if (target === 'datetime' && source === 'string') {
      return {
        compatible: true,
        conversion_needed: true,
        warning: 'Use parse_datetime for MongoDB datetime conversion'
      };
    }

    // Special cases that need transformation
    const needsTransformation = [
      { src: 'string', tgt: ['int', 'integer', 'bigint', 'smallint'], warning: 'Use parse_int to convert string to integer' },
      { src: 'string', tgt: ['float', 'double', 'decimal', 'numeric'], warning: 'Use parse_float to convert string to number' },
      { src: 'string', tgt: ['bool', 'boolean', 'bit'], warning: 'Use parse_bool to convert string to boolean' },
      { src: 'string', tgt: ['date', 'datetime', 'timestamp'], warning: 'Use parse_date or parse_datetime for date conversion' },
      { src: ['int', 'integer', 'float', 'number'], tgt: ['varchar', 'text', 'char'], warning: 'Use to_string to convert number to text' },
      { src: 'boolean', tgt: ['varchar', 'text'], warning: 'Use to_string to convert boolean to text' },
      { src: 'object', tgt: ['varchar', 'text'], warning: 'Use json_stringify to convert object to text' },
    ];

    // Check if transformation is needed
    for (const rule of needsTransformation) {
      const srcMatches = Array.isArray(rule.src)
        ? rule.src.some(s => source.includes(s))
        : source.includes(rule.src);

      const tgtMatches = rule.tgt.some(t => target.includes(t));

      if (srcMatches && tgtMatches) {
        return {
          compatible: true,
          conversion_needed: true,
          warning: rule.warning
        };
      }
    }

    // Incompatible types
    return {
      compatible: false,
      conversion_needed: true,
      warning: `Cannot convert ${sourceType} to ${targetType}`
    };
  };

  const updateMappingValidation = (mapping: any) => {
    const transformedType = getTransformedType(mapping.source_type || "string", mapping.transformations || []);
    const targetType = mapping.target_type || "string";

    const compatible = checkTypeCompatibility(transformedType, targetType);

    return {
      ...mapping,
      validation: {
        source_type: mapping.source_type,
        transformed_type: transformedType,
        target_type: targetType,
        compatible: compatible.compatible,
        conversion_needed: compatible.conversion_needed,
        warning: compatible.warning
      }
    };
  };

  const handleUpdateMapping = (index: number, updates: any) => {
    const newMappings = [...mappings];
    const updatedMapping = { ...newMappings[index], ...updates };
    newMappings[index] = updateMappingValidation(updatedMapping);
    setMappings(newMappings);
    addToHistory(newMappings);
  };

  const getMappingValidation = (sourcePath: string, targetColumn: string) => {
    const mapping = mappings.find(m => m.source_path === sourcePath && m.target_column === targetColumn);
    if (!mapping || !mapping.validation) {
      const key = `${sourcePath}->${targetColumn}`;
      return typeValidations[key];
    }
    return mapping.validation;
  };

  const addToHistory = (newMappings: any[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push([...newMappings]);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
  };

  const undo = () => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setMappings([...history[newIndex]]);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setMappings([...history[newIndex]]);
    }
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((e.ctrlKey || e.metaKey) && (e.key === "y" || (e.key === "z" && e.shiftKey))) {
        e.preventDefault();
        redo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [historyIndex, history]);

  const validateRequiredFields = () => {
    const errors: { field: string; message: string }[] = [];

    // Handle SQL databases
    if (dbSchema?.columns) {
      const requiredColumns = dbSchema.columns.filter((col: DatabaseColumn) =>
        !col.nullable ||
        col.constraints?.includes('PRIMARY KEY') ||
        col.constraints?.includes('NOT NULL')
      );

      requiredColumns.forEach((column: DatabaseColumn) => {
        const isMapped = mappings.some(m => m.target_column === column.name);
        if (!isMapped) {
          errors.push({
            field: column.name,
            message: `Required field "${column.name}" must be mapped`
          });
        }
      });
    }
    // Handle MongoDB
    else if (dbSchema?.fields) {
      console.log("MongoDB fields:", dbSchema.fields);
      // For MongoDB, check for fields that might be required based on validation rules
      dbSchema.fields.forEach((field: any) => {
        // Check if field has required validation
        if (field.required || field.validation?.required) {
          const isMapped = mappings.some(m => m.target_column === field.name);
          if (!isMapped) {
            errors.push({
              field: field.name,
              message: `Required field "${field.name}" must be mapped`
            });
          }
        }

        // Check for specific MongoDB field types that should be required
        if (field.name === '_id' || field.name === 'id') {
          const isMapped = mappings.some(m => m.target_column === field.name);
          if (!isMapped) {
            errors.push({
              field: field.name,
              message: `Primary key field "${field.name}" must be mapped`
            });
          }
        }
      });
    }

    return errors;
  };


  // Update validation whenever mappings change
  useEffect(() => {
    const errors = validateRequiredFields();
    setValidationErrors(errors);
  }, [mappings, dbSchema]);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading mapping data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Field Mapping</h3>
          <div className="flex items-center space-x-3">
            <button
              onClick={undo}
              disabled={historyIndex === 0}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Undo (Ctrl+Z)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"
                />
              </svg>
            </button>

            <button
              onClick={redo}
              disabled={historyIndex === history.length - 1}
              className="p-2 text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Redo (Ctrl+Y)"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 10h-10a8 8 0 00-8 8v2M21 10l-6 6m6-6l-6-6"
                />
              </svg>
            </button>

            <div className="w-px h-6 bg-slate-200" />

            <button
              onClick={handleAutoMap}
              className="flex items-center px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg hover:bg-indigo-100 transition-colors"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              Auto-Map Fields
            </button>
            <button
              onClick={fetchPreviewData}
              className="flex items-center px-4 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50 transition-colors"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </button>
            <button
              onClick={() => setMappings([])}
              className="flex items-center px-4 py-2 border border-red-200 text-red-700 rounded-lg hover:bg-red-50 transition-colors"
              disabled={mappings.length === 0}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Main Canvas */}
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">API Response Fields</h4>
            <APIFieldTree
              data={apiSample}
              onFieldDragStart={setDraggedField}
              onFieldDragEnd={() => setDraggedField(null)}
            />
          </div>

          <div className="relative">
            <h4 className="text-sm font-medium text-slate-700 mb-3 text-center">Mappings</h4>
            <div className="relative min-h-[400px]">
              {mappings.length === 0 ? (
                <div className="text-center py-12">
                  <p className="text-sm text-slate-500">
                    Drag fields from left to right to create mappings
                  </p>
                  <p className="text-xs text-slate-400 mt-2">
                    or use Auto-Map to get started
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {mappings.map((mapping, index) => {
                    const validation = getMappingValidation(mapping.source_path, mapping.target_column);
                    return (
                      <MappingLine
                        key={`${mapping.source_path}-${mapping.target_column}`}
                        mapping={mapping}
                        validation={validation}
                        isSelected={selectedMapping === `${index}`}
                        onSelect={() => setSelectedMapping(`${index}`)}
                        onDelete={() => handleDeleteMapping(index)}
                        onUpdate={(updates) => handleUpdateMapping(index, updates)}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-medium text-slate-700 mb-3">
              Database Table: {tableName}
            </h4>
            <DBSchemaTree
              schema={dbSchema}
              onFieldDrop={(targetColumn) => {
                if (draggedField) {
                  handleCreateMapping(draggedField.path, targetColumn);
                }
              }}
              mappedColumns={mappings.map(m => m.target_column)}
            />
          </div>
        </div>
      </div>

      {mappings.length > 0 && (
        <MappingSummary
          mappings={mappings.map(m => ({
            ...m,
            validation: getMappingValidation(m.source_path, m.target_column)
          }))}
          apiSample={apiSample}
          validations={typeValidations}
          validationErrors={validationErrors}
        />
      )}
    </div>
  );
}
