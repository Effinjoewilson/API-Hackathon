"use client";
import { useState } from "react";
import { Trash2, Settings, AlertTriangle, CheckCircle, XCircle, ArrowRight } from "lucide-react";
import TransformDialog from "./TransformDialog";

interface MappingLineProps {
  mapping: any;
  validation?: any;
  isSelected: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onUpdate: (updates: any) => void;
}

export default function MappingLine({
  mapping,
  validation,
  isSelected,
  onSelect,
  onDelete,
  onUpdate
}: MappingLineProps) {
  const [showTransformDialog, setShowTransformDialog] = useState(false);

  const getStatusIcon = () => {
    if (!validation) return null;

    if (validation.compatible && !validation.conversion_needed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (validation.compatible && validation.conversion_needed) {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getFormatValidation = () => {
    if (!mapping.sampleValue) return null;

    const value = String(mapping.sampleValue);
    const validations: { type: "error" | "warning"; message: string }[] = [];

    if (mapping.target_column.toLowerCase().includes("email")) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(value)) {
        validations.push({ type: "error", message: "Invalid email format" });
      }
    }

    if (mapping.target_column.toLowerCase().includes("phone")) {
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(value)) {
        validations.push({ type: "error", message: "Invalid phone format" });
      }
    }

    if (
      mapping.target_column.toLowerCase().includes("date") ||
      mapping.target_column.toLowerCase().includes("_at")
    ) {
      const dateRegex = /^\d{4}-\d{2}-\d{2}/;
      if (!dateRegex.test(value) && isNaN(Date.parse(value))) {
        validations.push({ type: "warning", message: "May need date formatting" });
      }
    }

    return validations;
  };

  return (
    <>
      <div
        className={`p-3 rounded-lg border transition-all cursor-pointer ${
          isSelected ? "border-indigo-500 bg-indigo-50" : "border-slate-200 hover:border-slate-300"
        }`}
        onClick={onSelect}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center flex-1 min-w-0">
            <div className="flex-1">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-slate-700 truncate">
                  {mapping.source_path}
                </span>
                <ArrowRight className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <span className="text-sm font-medium text-slate-700 truncate">
                  {mapping.target_column}
                </span>
                {getStatusIcon()}
              </div>

              {mapping.transformations.length > 0 && (
                <div className="mt-1 flex items-center space-x-1">
                  <span className="text-xs text-slate-500">Transforms:</span>
                  {mapping.transformations.map((t: string, i: number) => (
                    <span
                      key={i}
                      className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded"
                    >
                      {t}
                    </span>
                  ))}
                </div>
              )}

              {/* ✅ Tooltip showing transformation effect */}
              {validation?.transformed_type &&
                validation.transformed_type !== validation.source_type && (
                  <div className="text-xs text-slate-500 mt-1">
                    Type after transformation:{" "}
                    <span className="font-medium">{validation.transformed_type}</span>
                  </div>
                )}

              {validation?.warning && (
                <div className="mt-1 text-xs text-amber-600 flex items-center">
                  <AlertTriangle className="w-3 h-3 mr-1" />
                  {validation.warning}
                </div>
              )}

              {/* ✅ Format validation display */}
              {getFormatValidation()?.map((v, i) => (
                <div
                  key={i}
                  className={`mt-1 text-xs flex items-center ${
                    v.type === "error" ? "text-red-600" : "text-amber-600"
                  }`}
                >
                  {v.type === "error" ? (
                    <XCircle className="w-3 h-3 mr-1" />
                  ) : (
                    <AlertTriangle className="w-3 h-3 mr-1" />
                  )}
                  {v.message}
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-center space-x-2 ml-4">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowTransformDialog(true);
              }}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded"
              title="Configure transforms"
            >
              <Settings className="w-4 h-4" />
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onDelete();
              }}
              className="p-1.5 text-slate-500 hover:text-red-600 hover:bg-red-50 rounded"
              title="Delete mapping"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {showTransformDialog && (
        <TransformDialog
          mapping={{
            ...mapping,
            sampleValue: mapping.sampleValue,
            source_type: mapping.source_type,
            target_type: mapping.target_type
          }}
          onClose={() => setShowTransformDialog(false)}
          onSave={(updates) => {
            onUpdate(updates);
            setShowTransformDialog(false);
          }}
        />
      )}
    </>
  );
}