"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Play, Database, Clock, Check, X, AlertCircle, RotateCcw } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface DatabaseInfo {
  id: number;
  name: string;
  db_type: string;
  host: string;
  port: number;
  database: string;
  connection_status: string;
  last_error: string;
  last_tested: string | null;
}

interface TestLog {
  id: number;
  tested_at: string;
  is_successful: boolean;
  response_time_ms: number;
  error_message: string;
  test_query: string;
  server_info: any;
}

export default function TestDatabasePage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [database, setDatabase] = useState<DatabaseInfo | null>(null);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [currentTest, setCurrentTest] = useState<{
    success: boolean;
    message: string;
    server_info?: any;
    response_time_ms: number;
  } | null>(null);

  useEffect(() => {
    fetchDatabase();
    fetchTestHistory();
  }, [id]);

  const fetchDatabase = async () => {
    try {
      const response = await apiFetch(`/databases/connections/${id}/`);
      if (response.ok) {
        const data = await response.json();
        setDatabase(data);
      }
    } catch (error) {
      console.error("Failed to fetch database:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestHistory = async () => {
    try {
      const response = await apiFetch(`/databases/connections/${id}/test_history/`);
      if (response.ok) {
        const data = await response.json();
        setTestLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch test history:", error);
    }
  };

  const runTest = async () => {
    setTesting(true);
    setCurrentTest(null);

    try {
      const response = await apiFetch(`/databases/connections/${id}/test/`, {
        method: "POST",
      });

      const data = await response.json();
      setCurrentTest(data);
      
      // Refresh database info and history
      fetchDatabase();
      fetchTestHistory();
    } catch (error) {
      setCurrentTest({
        success: false,
        message: "Failed to run test",
        response_time_ms: 0,
      });
    } finally {
      setTesting(false);
    }
  };

  const getDbIcon = (type: string) => {
    const icons: { [key: string]: string } = {
      postgresql: "🐘",
      mysql: "🐬",
      mongodb: "🍃",
      mssql: "🏢",
    };
    return icons[type] || "🗄️";
  };

  if (loading || !database) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading database...</p>
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
                onClick={() => router.push("/databases")}
                className="mr-4 p-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <div className="flex items-center space-x-3">
                  <span className="text-2xl">{getDbIcon(database.db_type)}</span>
                  <h1 className="text-2xl font-bold text-slate-900">Test Connection: {database.name}</h1>
                </div>
                <p className="text-sm text-slate-600 mt-1">
                  {database.host}:{database.port}/{database.database}
                </p>
              </div>
            </div>
            <button
              onClick={runTest}
              disabled={testing}
              className="btn-primary flex items-center"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Testing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4 mr-2" />
                  Run Test
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Current Status */}
          <div className="space-y-6">
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Connection Status</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Status</span>
                  <div className="flex items-center">
                    {database.connection_status === 'active' ? (
                      <>
                        <Check className="w-4 h-4 text-green-600 mr-2" />
                        <span className="text-sm font-medium text-green-600">Active</span>
                      </>
                    ) : database.connection_status === 'failed' ? (
                      <>
                        <X className="w-4 h-4 text-red-600 mr-2" />
                        <span className="text-sm font-medium text-red-600">Failed</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-gray-500 mr-2" />
                        <span className="text-sm font-medium text-gray-600">Not Tested</span>
                      </>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Database Type</span>
                  <span className="text-sm font-medium text-slate-900">
                    {database.db_type === 'postgresql' ? 'PostgreSQL' :
                     database.db_type === 'mysql' ? 'MySQL' :
                     database.db_type === 'mongodb' ? 'MongoDB' : 
                     database.db_type === 'mssql' ? 'SQL Server' : database.db_type}
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-3 border-b border-slate-100">
                  <span className="text-sm text-slate-600">Last Tested</span>
                  <span className="text-sm font-medium text-slate-900">
                    {database.last_tested 
                      ? new Date(database.last_tested).toLocaleString() 
                      : 'Never'
                    }
                  </span>
                </div>
                
                {database.last_error && (
                  <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-start">
                      <AlertCircle className="w-5 h-5 text-red-600 mt-0.5 mr-2 flex-shrink-0" />
                      <div>
                        <p className="text-sm font-medium text-red-800">Last Error</p>
                        <p className="text-sm text-red-700 mt-1">{database.last_error}</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Current Test Result */}
            {currentTest && (
              <div className={`card p-6 ${currentTest.success ? 'border-green-200' : 'border-red-200'}`}>
                <div className="flex items-start">
                  <div className={`p-2 rounded-lg ${currentTest.success ? 'bg-green-100' : 'bg-red-100'}`}>
                    {currentTest.success ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                  <div className="ml-3 flex-1">
                    <h3 className={`text-lg font-semibold ${currentTest.success ? 'text-green-900' : 'text-red-900'}`}>
                      {currentTest.success ? 'Connection Test Passed' : 'Connection Test Failed'}
                    </h3>
                    <p className={`mt-1 text-sm ${currentTest.success ? 'text-green-700' : 'text-red-700'}`}>
                      {currentTest.message}
                    </p>
                    
                    <div className="mt-3 flex items-center space-x-4 text-sm">
                      <span className={currentTest.success ? 'text-green-600' : 'text-red-600'}>
                        <Clock className="w-4 h-4 inline mr-1" />
                        {currentTest.response_time_ms}ms
                      </span>
                    </div>
                    
                    {currentTest.success && currentTest.server_info && (
                      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                        <h4 className="text-sm font-medium text-gray-700 mb-2">Server Information</h4>
                        <div className="space-y-1 text-xs text-gray-600">
                          {Object.entries(currentTest.server_info).map(([key, value]) => (
                            <div key={key} className="flex">
                              <span className="font-medium capitalize">{key.replace('_', ' ')}:</span>
                              <span className="ml-2">{String(value).substring(0, 100)}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Test History */}
          <div className="card p-6">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">Test History</h3>
            
            {testLogs.length === 0 ? (
              <p className="text-sm text-slate-500 text-center py-8">No tests run yet</p>
            ) : (
              <div className="space-y-3">
                {testLogs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-3 rounded-lg border ${
                      log.is_successful 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <div className={`p-1.5 rounded ${
                          log.is_successful ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          {log.is_successful ? (
                            <Check className="w-3 h-3 text-green-600" />
                          ) : (
                            <X className="w-3 h-3 text-red-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`text-sm font-medium ${
                              log.is_successful ? 'text-green-900' : 'text-red-900'
                            }`}>
                              {log.is_successful ? 'Success' : 'Failed'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {log.response_time_ms}ms
                            </span>
                          </div>
                          {log.error_message && (
                            <p className="text-xs text-red-700 mt-1">{log.error_message}</p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            Query: <code className="bg-gray-100 px-1 py-0.5 rounded">{log.test_query}</code>
                          </p>
                        </div>
                      </div>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {new Date(log.tested_at).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}                        