import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";

interface PreviewPanelProps {
  transformedData: any[];
  sqlPreview: string;
  targetTable: string;
}

export default function PreviewPanel({ transformedData, sqlPreview, targetTable }: PreviewPanelProps) {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">Transformed Data Preview</h3>
        
        <div className="space-y-4">
          {transformedData.map((item, index) => (
            <div key={index} className="border border-slate-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-slate-700 mb-2">Record {index + 1}</h4>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div>
                  <h5 className="text-xs font-medium text-slate-500 uppercase mb-2">Original</h5>
                  <pre className="bg-slate-50 p-3 rounded text-xs overflow-auto max-h-48">
                    {JSON.stringify(item.original, null, 2)}
                  </pre>
                </div>
                
                <div>
                  <h5 className="text-xs font-medium text-slate-500 uppercase mb-2">Transformed</h5>
                  <pre className="bg-indigo-50 p-3 rounded text-xs overflow-auto max-h-48">
                    {JSON.stringify(item.transformed, null, 2)}
                  </pre>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-900 mb-4">SQL Preview</h3>
        <p className="text-sm text-slate-600 mb-3">Target table: <span className="font-medium">{targetTable}</span></p>
        
        <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto text-sm">
          {sqlPreview}
        </pre>
      </div>
    </div>
  );
}