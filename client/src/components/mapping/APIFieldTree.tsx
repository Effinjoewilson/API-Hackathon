"use client";
import { useState } from "react";
import { ChevronRight, ChevronDown, Hash, FileText, Calendar, ToggleRight, Database } from "lucide-react";
import TypeBadge from "./TypeBadge";

interface APIFieldTreeProps {
  data: any;
  onFieldDragStart: (field: any) => void;
  onFieldDragEnd: () => void;
}

export default function APIFieldTree({ data, onFieldDragStart, onFieldDragEnd }: APIFieldTreeProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(['root']));

  const toggleExpand = (path: string) => {
    setExpanded(prev => {
      const newSet = new Set(prev);
      if (newSet.has(path)) {
        newSet.delete(path);
      } else {
        newSet.add(path);
      }
      return newSet;
    });
  };

  const getTypeIcon = (value: any) => {
    const type = typeof value;
    if (type === 'number') return <Hash className="w-3 h-3" />;
    if (type === 'string') return <FileText className="w-3 h-3" />;
    if (type === 'boolean') return <ToggleRight className="w-3 h-3" />;
    if (Array.isArray(value)) return <Database className="w-3 h-3" />;
    return <Database className="w-3 h-3" />;
  };

  const renderField = (key: string, value: any, path: string, level: number = 0) => {
    const currentPath = path ? `${path}.${key}` : key;
    const isObject = typeof value === 'object' && value !== null && !Array.isArray(value);
    const isArray = Array.isArray(value);
    const hasChildren = isObject || (isArray && value.length > 0 && typeof value[0] === 'object');
    const isExpanded = expanded.has(currentPath);

    return (
      <div key={currentPath} className="select-none">
        <div
          className={`flex items-center py-1.5 px-2 hover:bg-slate-50 rounded cursor-move transition-all duration-200 ${level > 0 ? 'ml-4' : ''
            } ${!hasChildren ? 'hover:scale-105 hover:shadow-md' : ''}`}
          draggable={!hasChildren}
          onDragStart={(e) => {
            if (!hasChildren) {
              e.dataTransfer.effectAllowed = 'copy';
              e.currentTarget.classList.add('opacity-50', 'scale-95');
              onFieldDragStart({ path: currentPath, type: typeof value, sampleValue: value });
            }
          }}
          onDragEnd={(e) => {
            e.currentTarget.classList.remove('opacity-50', 'scale-95');
            onFieldDragEnd();
          }}
        >
          {hasChildren && (
            <button
              onClick={() => toggleExpand(currentPath)}
              className="p-0.5 hover:bg-slate-100 rounded mr-1"
            >
              {isExpanded ? (
                <ChevronDown className="w-3 h-3 text-slate-600" />
              ) : (
                <ChevronRight className="w-3 h-3 text-slate-600" />
              )}
            </button>
          )}
          {!hasChildren && <div className="w-4 mr-1" />}

          <div className="flex items-center flex-1 min-w-0">
            <span className="text-slate-500 mr-2">{getTypeIcon(value)}</span>
            <span className="text-sm font-medium text-slate-700 truncate">{key}</span>
            <TypeBadge type={typeof value} className="ml-2" />
            {!hasChildren && value !== null && value !== undefined && (
              <span className="ml-2 text-xs text-slate-500 truncate">
                {String(value).substring(0, 20)}
                {String(value).length > 20 && '...'}
              </span>
            )}
          </div>
        </div>

        {hasChildren && isExpanded && (
          <div>
            {isObject && Object.entries(value).map(([k, v]) => renderField(k, v, currentPath, level + 1))}
            {isArray && value[0] && typeof value[0] === 'object' &&
              Object.entries(value[0]).map(([k, v]) => renderField(k, v, `${currentPath}[0]`, level + 1))
            }
          </div>
        )}
      </div>
    );
  };

  if (!data || Object.keys(data).length === 0) {
    return (
      <div className="p-4 bg-slate-50 rounded-lg text-sm text-slate-500 text-center">
        No API response data available
      </div>
    );
  }

  return (
    <div className="bg-slate-50 rounded-lg p-3 max-h-[500px] overflow-y-auto">
      {typeof data === 'object' && !Array.isArray(data) ? (
        Object.entries(data).map(([key, value]) => renderField(key, value, ''))
      ) : Array.isArray(data) && data.length > 0 ? (
        renderField('[0]', data[0], '')
      ) : (
        <div className="text-sm text-slate-500">Invalid data format</div>
      )}
    </div>
  );
}