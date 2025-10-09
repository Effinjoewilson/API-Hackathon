"use client";
import { useState } from "react";
import { Database, Key, Link2, Hash, FileText, Calendar, ToggleRight, AlertCircle } from "lucide-react";
import TypeBadge from "./TypeBadge";

interface DBSchemaTreeProps {
  schema: any;
  onFieldDrop: (column: string) => void;
  mappedColumns: string[];
  mappingValidations?: { [key: string]: { compatible: boolean; conversion_needed: boolean; warning?: string } };
}

export default function DBSchemaTree({ schema, onFieldDrop, mappedColumns, mappingValidations }: DBSchemaTreeProps) {
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [nearestColumn, setNearestColumn] = useState<string | null>(null);

  // Magnetic snap detection
  const handleDragOver = (e: React.DragEvent, column: string) => {
    e.preventDefault();

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const distance = Math.abs((rect.top + rect.bottom) / 2 - e.clientY);

    const el = e.currentTarget as HTMLElement;

    if (distance < 50) {
      setDragOver(column);
      setNearestColumn(column);

      // Add visual feedback
      el.style.transform = 'scale(1.05)';
      el.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.1)';
    } else {
      el.style.transform = '';
      el.style.boxShadow = '';
      setDragOver(null);
      setNearestColumn(null);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    const el = e.currentTarget as HTMLElement;
    setDragOver(null);
    setNearestColumn(null);
    el.style.transform = '';
    el.style.boxShadow = '';
  };

  const handleDrop = (e: React.DragEvent, column: string) => {
    e.preventDefault();
    const el = e.currentTarget as HTMLElement;
    setDragOver(null);
    setNearestColumn(null);
    el.style.transform = '';
    el.style.boxShadow = '';
    onFieldDrop(column);
  };

  const getTypeIcon = (type: string) => {
    type = type.toLowerCase();
    if (type.includes('int') || type.includes('numeric')) return <Hash className="w-3 h-3" />;
    if (type.includes('char') || type.includes('text')) return <FileText className="w-3 h-3" />;
    if (type.includes('date') || type.includes('time')) return <Calendar className="w-3 h-3" />;
    if (type.includes('bool')) return <ToggleRight className="w-3 h-3" />;
    return <Database className="w-3 h-3" />;
  };

  const getConstraintIcon = (constraints: string[]) => {
    if (constraints.includes('PRIMARY KEY')) {
      return <Key className="w-3 h-3 text-yellow-600" />;
    }
    if (constraints.includes('FOREIGN KEY')) {
      return <Link2 className="w-3 h-3 text-blue-600" />;
    }
    return null;
  };

  const renderColumn = (column: any) => {
    const isMapped = mappedColumns.includes(column.name);
    const validation = mappingValidations?.[column.name];
    const isValidMapping = isMapped && validation?.compatible && !validation?.conversion_needed;
    const isDragOver = dragOver === column.name;

    return (
      <div
        key={column.name}
        className={`p-2 rounded-lg transition-all duration-200 ${isDragOver ? 'bg-indigo-50 ring-2 ring-indigo-500 scale-105 shadow-lg' :
          isValidMapping ? 'bg-green-50' :
            isMapped ? 'bg-amber-50' :
              'hover:bg-slate-50'
          }`}
        onDragOver={(e) => handleDragOver(e, column.name)}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, column.name)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center min-w-0 flex-1">
            <span className="text-slate-500 mr-2">{getTypeIcon(column.type)}</span>
            <span className={`text-sm font-medium truncate ${isMapped ? 'text-green-700' : 'text-slate-700'
              }`}>
              {column.name}
            </span>
            {column.constraints && getConstraintIcon(column.constraints) && (
              <span className="ml-2">{getConstraintIcon(column.constraints)}</span>
            )}
          </div>
          <div className="flex items-center ml-2">
            <TypeBadge type={column.type} size="xs" />
            {column.nullable && (
              <span className="ml-1 text-xs text-slate-400">nullable</span>
            )}
          </div>
        </div>
        {isMapped && (
          <div className={`mt-1 text-xs flex items-center ${isValidMapping ? 'text-green-600' : 'text-amber-600'
            }`}>
            {isValidMapping ? (
              <>
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
                Mapped
              </>
            ) : (
              <>
                <AlertCircle className="w-3 h-3 mr-1" />
                Invalid mapping
              </>
            )}
          </div>
        )}
      </div>
    );
  };

  if (!schema || (!schema.columns && !schema.fields)) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-center">
        No schema information available
      </div>
    );
  }

  const columns = schema.columns || [];
  const fields = schema.fields || [];

  return (
    <div className="bg-slate-50 rounded-lg p-3 max-h-[500px] overflow-y-auto">
      {/* SQL Tables */}
      {columns.length > 0 && (
        <div className="space-y-2">
          {columns.map(renderColumn)}
        </div>
      )}

      {/* MongoDB Collections */}
      {fields.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs text-slate-500 mb-2">
            Collection fields (from sample document)
          </div>
          {fields.map((field: any) => renderColumn({
            ...field,
            constraints: []
          }))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700 flex items-center">
        <AlertCircle className="w-3 h-3 inline mr-1" />
        Drop API fields here to create mappings
      </div>
    </div>
  );
}
