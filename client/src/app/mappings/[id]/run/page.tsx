"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Play, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface MappingDetails {
  id: number;
  name: string;
  description: string;
  api_endpoint_name: string;
  database_name: string;
  target_table: string;
  field_mappings: any[];
  status: string;
  last_run: string | null;
}

interface ExecutionResult {
  id: number;
  status: string;
  total_records: number;
  processed_records: number;
  failed_records: number;
  started_at: string;
  completed_at: string | null;
  execution_time_ms: number | null;
  error_details: any[];
}

export default function RunMappingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [mapping, setMapping] = useState<MappingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [executing, setExecuting] = useState(false);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);

  useEffect(() => {
    fetchMapping();
    fetchExecutionHistory();
  }, [id]);

  const fetchMapping = async () => {
    try {
      const response = await apiFetch(`/mappings/data-mappings/${id}/`);
      const data = await response.json();
      setMapping(data);
    } catch (error) {
      console.error("Failed to fetch mapping:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchExecutionHistory = async () => {
    try {
      const response = await apiFetch(`/mappings/data-mappings/${id}/execution_history/`);
      const data = await response.json();
      setExecutionHistory(data);
    } catch (error) {
      console.error("Failed to fetch execution history:", error);
    }
  };

  const handleExecute = async () => {
    setExecuting(true);
    setExecutionResult(null);

    try {
      const response = await apiFetch(`/mappings/data-mappings/${id}/execute/`, {
        method: "POST",
      });

      const data = await response.json();
      setExecutionResult(data);

      // Refresh history
      fetchExecutionHistory();

      // Update mapping last run
      if (mapping) {
        setMapping({ ...mapping, last_run: new Date().toISOString() });
      }
    } catch (error) {
      console.error("Failed to execute mapping:", error);
    } finally {
      setExecuting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-green-600" />;
      case 'failed':
        return <XCircle className="w-5 h-5 text-red-600" />;
      case 'partial':
        return <AlertCircle className="w-5 h-5 text-yellow-600" />;
      default:
        return <Clock className="w-5 h-5 text-gray-600" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      success: 'bg-green-100 text-green-700',
      failed: 'bg-red-100 text-red-700',
      partial: 'bg-yellow-100 text-yellow-700',
      running: 'bg-blue-100 text-blue-700',
    };

    return (
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[status as keyof typeof styles] || 'bg-gray-100 text-gray-700'}`}>
        {getStatusIcon(status)}
        <span className="ml-1">{status.charAt(0).toUpperCase() + status.slice(1)}</span>
      </span>
    );
  };

  if (loading || !mapping) {
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
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Execute Mapping: {mapping.name}</h1>
                <p className="text-sm text-slate-600 mt-1">{mapping.description}</p>
              </div>
            </div>
            <button
              onClick={handleExecute}
              disabled={executing || mapping.status !== 'active'}
              className="btn-primary flex items-center"
            >
              {executing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Execute Mapping
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Mapping Info */}
          <div className="lg:col-span-1">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Mapping Details</h3>

              <div className="space-y-3">
                <div>
                  <span className="text-sm text-slate-500">Status</span>
                  <p className="font-medium">{mapping.status.charAt(0).toUpperCase() + mapping.status.slice(1)}</p>
                </div>

                <div>
                  <span className="text-sm text-slate-500">API Source</span>
                  <p className="font-medium">{mapping.api_endpoint_name}</p>
                </div>

                <div>
                  <span className="text-sm text-slate-500">Target Database</span>
                  <p className="font-medium">{mapping.database_name}</p>
                </div>

                <div>
                  <span className="text-sm text-slate-500">Target Table</span>
                  <p className="font-medium">{mapping.target_table}</p>
                </div>

                <div>
                  <span className="text-sm text-slate-500">Field Mappings</span>
                  <p className="font-medium">{mapping.field_mappings.length} fields</p>
                </div>

                {mapping.last_run && (
                  <div>
                    <span className="text-sm text-slate-500">Last Run</span>
                    <p className="font-medium">{new Date(mapping.last_run).toLocaleString()}</p>
                  </div>
                )}
              </div>

              {mapping.status !== 'active' && (
                <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                  <div className="flex">
                    <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5" />
                    <p className="ml-2 text-sm text-yellow-700">
                      This mapping is {mapping.status}. Activate it to enable execution.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Execution Results */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Execution */}
            {executionResult && (
              <div className={`card p-6 ${executionResult.status === 'success' ? 'border-green-200' :
                  executionResult.status === 'failed' ? 'border-red-200' :
                    'border-yellow-200'
                }`}>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Execution Result</h3>
                  {getStatusBadge(executionResult.status)}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div>
                    <span className="text-sm text-slate-500">Total Records</span>
                    <p className="text-2xl font-semibold text-slate-900">{executionResult.total_records}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Processed</span>
                    <p className="text-2xl font-semibold text-green-600">{executionResult.processed_records}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Failed</span>
                    <p className="text-2xl font-semibold text-red-600">{executionResult.failed_records}</p>
                  </div>
                  <div>
                    <span className="text-sm text-slate-500">Duration</span>
                    <p className="text-2xl font-semibold text-slate-900">
                      {executionResult.execution_time_ms ? `${executionResult.execution_time_ms}ms` : '-'}
                    </p>
                  </div>
                </div>

                {executionResult.error_details.length > 0 && (
                  <div className="mt-4 p-4 bg-red-50 rounded-lg">
                    <h4 className="text-sm font-medium text-red-900 mb-2">Errors</h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {executionResult.error_details.slice(0, 5).map((error, idx) => (
                        <div key={idx} className="text-sm border-b border-red-200 pb-2 mb-2">
                          {error.record_index !== undefined && (
                            <div className="font-medium text-red-800">
                              Record {error.record_index}
                              {error.stage && <span className="ml-2 text-xs bg-red-100 px-2 py-1 rounded">{error.stage}</span>}
                            </div>
                          )}
                          <div className="text-red-700 mt-1">
                            {error.error || error.general_error || error.batch_error || JSON.stringify(error)}
                          </div>
                          {error.field_values && Object.keys(error.field_values).length > 0 && (
                            <div className="text-xs text-red-600 mt-1">
                              Key fields: {Object.entries(error.field_values)
                                .map(([k, v]) => `${k}: ${v}`)
                                .join(', ')}
                            </div>
                          )}
                          {error.error_type && (
                            <div className="text-xs text-red-500 mt-1">
                              Error type: {error.error_type}
                            </div>
                          )}
                        </div>
                      ))}
                      {executionResult.error_details.length > 5 && (
                        <p className="text-sm text-red-600 font-medium">
                          ... and {executionResult.error_details.length - 5} more errors
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Execution History */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Execution History</h3>

              {executionHistory.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-8">No execution history yet</p>
              ) : (
                <div className="space-y-3">
                  {executionHistory.map((execution) => (
                    <div key={execution.id} className="p-4 bg-slate-50 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-3">
                          {getStatusBadge(execution.status)}
                          <span className="text-sm text-slate-600">
                            {new Date(execution.started_at).toLocaleString()}
                          </span>
                        </div>
                        {execution.execution_time_ms && (
                          <span className="text-sm text-slate-500">{execution.execution_time_ms}ms</span>
                        )}
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="text-slate-500">Total:</span>
                          <span className="ml-1 font-medium">{execution.total_records}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Success:</span>
                          <span className="ml-1 font-medium text-green-600">{execution.processed_records}</span>
                        </div>
                        <div>
                          <span className="text-slate-500">Failed:</span>
                          <span className="ml-1 font-medium text-red-600">{execution.failed_records}</span>
                        </div>
                      </div>

                      {execution.error_details.length > 0 && (
                        <p className="mt-2 text-xs text-red-600">
                          {execution.error_details.length} error{execution.error_details.length !== 1 ? 's' : ''}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}