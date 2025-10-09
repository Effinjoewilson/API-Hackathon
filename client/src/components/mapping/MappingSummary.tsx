"use client";
import { CheckCircle, AlertTriangle, XCircle } from "lucide-react";

interface MappingSummaryProps {
  mappings: any[];
  apiSample: any;
  validations: any;
  validationErrors?: {field: string; message: string}[];
}

export default function MappingSummary({ 
  mappings, 
  apiSample, 
  validations,
  validationErrors = [] 
}: MappingSummaryProps) {
  const getFieldValue = (path: string) => {
    const parts = path.split('.');
    let value = apiSample;
    for (const part of parts) {
      if (value && typeof value === 'object') {
        value = value[part];
      } else {
        return null;
      }
    }
    return value;
  };

  const getStatusIcon = (mapping: any) => {
    // Use validation from mapping if available, otherwise fall back to validations prop
    const validation = mapping.validation || validations[`${mapping.source_path}->${mapping.target_column}`];
    
    if (!validation) return null;
    
    if (validation.compatible && !validation.conversion_needed) {
      return <CheckCircle className="w-4 h-4 text-green-600" />;
    } else if (validation.compatible && validation.conversion_needed) {
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    } else {
      return <XCircle className="w-4 h-4 text-red-600" />;
    }
  };

  const getTypeDisplay = (mapping: any) => {
    const validation = mapping.validation || validations[`${mapping.source_path}->${mapping.target_column}`];
    
    if (validation?.transformed_type && validation.transformed_type !== validation.source_type) {
      // Show transformation flow: source → transformed → target
      return (
        <div className="flex items-center space-x-1 text-xs">
          <span className="text-slate-600">{validation.source_type}</span>
          <span className="text-slate-400">→</span>
          <span className="font-medium text-indigo-600">{validation.transformed_type}</span>
          <span className="text-slate-400">→</span>
          <span className="text-slate-600">{validation.target_type}</span>
        </div>
      );
    } else {
      // No transformation, just show source → target
      return (
        <div className="flex items-center space-x-1 text-xs">
          <span className="text-slate-600">{validation?.source_type || 'unknown'}</span>
          <span className="text-slate-400">→</span>
          <span className="text-slate-600">{validation?.target_type || 'unknown'}</span>
        </div>
      );
    }
  };

  // Calculate statistics based on current validation state
  const stats = mappings.reduce((acc, mapping) => {
    const validation = mapping.validation || validations[`${mapping.source_path}->${mapping.target_column}`];
    
    if (!validation) return acc;
    
    if (validation.compatible && !validation.conversion_needed) {
      acc.valid++;
    } else if (validation.compatible && validation.conversion_needed) {
      acc.needsConversion++;
    } else {
      acc.invalid++;
    }
    
    return acc;
  }, { valid: 0, needsConversion: 0, invalid: 0 });

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
      <h3 className="text-lg font-semibold text-slate-900 mb-4">Mapping Summary</h3>
      
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-slate-200">
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-2">Source Field</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-2">Sample Value</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-2">Target Column</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-2">Type Flow</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-2">Status</th>
              <th className="text-left text-xs font-medium text-slate-500 uppercase tracking-wider pb-2">Transforms</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {mappings.map((mapping, index) => {
              const sampleValue = mapping.sampleValue || getFieldValue(mapping.source_path);
              
              return (
                <tr key={index} className="hover:bg-slate-50">
                  <td className="py-3 text-sm text-slate-700">{mapping.source_path}</td>
                  <td className="py-3 text-sm text-slate-600">
                    {sampleValue !== null && sampleValue !== undefined ? 
                      String(sampleValue).substring(0, 30) + (String(sampleValue).length > 30 ? '...' : '') 
                      : <span className="text-slate-400">null</span>
                    }
                  </td>
                  <td className="py-3 text-sm text-slate-700">{mapping.target_column}</td>
                  <td className="py-3">
                    {getTypeDisplay(mapping)}
                  </td>
                  <td className="py-3">
                    <div className="flex items-center">
                      {getStatusIcon(mapping)}
                    </div>
                  </td>
                  <td className="py-3">
                    {mapping.transformations && mapping.transformations.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {mapping.transformations.map((t: string, i: number) => (
                          <span key={i} className="text-xs bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-slate-400">None</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      
      <div className="mt-4 pt-4 border-t border-slate-200">
        <div className="flex items-center justify-between text-sm">
          <span className="text-slate-600">
            Total mappings: <span className="font-medium text-slate-900">{mappings.length}</span>
          </span>
          <div className="flex items-center space-x-4">
            <span className="flex items-center">
              <CheckCircle className="w-4 h-4 text-green-600 mr-1" />
              <span className="text-slate-600">Valid: {stats.valid}</span>
            </span>
            <span className="flex items-center">
              <AlertTriangle className="w-4 h-4 text-yellow-600 mr-1" />
              <span className="text-slate-600">Needs conversion: {stats.needsConversion}</span>
            </span>
            <span className="flex items-center">
              <XCircle className="w-4 h-4 text-red-600 mr-1" />
              <span className="text-slate-600">Invalid: {stats.invalid}</span>
            </span>
          </div>
        </div>
      </div>

      {/* Validation Summary */}
      <div className="mt-6 p-4 bg-slate-50 rounded-lg">
        <h4 className="text-sm font-semibold text-slate-700 mb-2">Validation Details</h4>
        
        {/* Show any warnings or errors */}
        <div className="space-y-2">
          {mappings.map((mapping, idx) => {
            const validation = mapping.validation || validations[`${mapping.source_path}->${mapping.target_column}`];
            
            if (validation?.warning) {
              return (
                <div key={idx} className="flex items-start text-sm">
                  <AlertTriangle className="w-4 h-4 text-amber-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700">{mapping.source_path} → {mapping.target_column}:</span>
                    <span className="ml-2 text-amber-700">{validation.warning}</span>
                  </div>
                </div>
              );
            }
            
            if (validation && !validation.compatible) {
              return (
                <div key={idx} className="flex items-start text-sm">
                  <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div>
                    <span className="font-medium text-slate-700">{mapping.source_path} → {mapping.target_column}:</span>
                    <span className="ml-2 text-red-700">Incompatible types</span>
                  </div>
                </div>
              );
            }
            
            return null;
          })}
          
          {stats.valid === mappings.length && (
            <div className="flex items-center text-sm text-green-700">
              <CheckCircle className="w-4 h-4 mr-2" />
              All mappings are valid and ready to execute!
            </div>
          )}
        </div>
      </div>

      {/* Required Fields Validation */}
      {validationErrors.length > 0 && (
        <div className="mt-4 p-4 bg-red-50 rounded-lg">
          <h4 className="text-sm font-semibold text-red-700 mb-2">Required Fields Missing</h4>
          <div className="space-y-2">
            {validationErrors.map((error, idx) => (
              <div key={idx} className="flex items-start text-sm">
                <XCircle className="w-4 h-4 text-red-600 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <span className="font-medium text-red-700">{error.field}:</span>
                  <span className="ml-2 text-red-600">{error.message}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}