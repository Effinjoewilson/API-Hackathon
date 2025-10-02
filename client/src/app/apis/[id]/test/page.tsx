"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, Play, Copy, Check, AlertCircle, RotateCcw, Code } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface APIEndpoint {
  id: number;
  name: string;
  full_url: string;
  http_method: string;
  headers: { [key: string]: string };
  query_params: { [key: string]: string };
  body_template: any;
  content_type: string;
}

interface TestLog {
  id: number;
  tested_at: string;
  response_status: number;
  response_time_ms: number;
  is_success: boolean;
  error_message?: string;
  response_body: any;
}

export default function TestAPIPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [api, setApi] = useState<APIEndpoint | null>(null);
  const [testLogs, setTestLogs] = useState<TestLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [copied, setCopied] = useState(false);

  // Test form data
  const [testHeaders, setTestHeaders] = useState<{ [key: string]: string }>({});
  const [testParams, setTestParams] = useState<{ [key: string]: string }>({});
  const [testBody, setTestBody] = useState("");
  const [bodyError, setBodyError] = useState("");
  const [currentResponse, setCurrentResponse] = useState<any>(null);

  useEffect(() => {
    fetchAPIData();
    fetchTestHistory();
  }, [id]);

  useEffect(() => {
    // Load body template when API data is fetched
    if (api?.body_template && Object.keys(api.body_template).length > 0) {
      setTestBody(JSON.stringify(api.body_template, null, 2));
    }
  }, [api]);

  const fetchAPIData = async () => {
    try {
      const response = await apiFetch(`/apis/endpoints/${id}/`);
      if (response.ok) {
        const data = await response.json();
        setApi(data);
        setTestHeaders(data.headers || {});
        setTestParams(data.query_params || {});
      }
    } catch (error) {
      console.error("Failed to fetch API:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestHistory = async () => {
    try {
      const response = await apiFetch(`/apis/endpoints/${id}/test_history/`);
      if (response.ok) {
        const data = await response.json();
        setTestLogs(data);
      }
    } catch (error) {
      console.error("Failed to fetch test history:", error);
    }
  };

  const handleBodyChange = (value: string) => {
    setTestBody(value);
    setBodyError("");
    
    if (value.trim() && api?.content_type === "application/json") {
      try {
        JSON.parse(value);
      } catch {
        setBodyError("Invalid JSON format");
      }
    }
  };

  const runTest = async () => {
    setTesting(true);
    setCurrentResponse(null);

    // Validate body if required
    let parsedBody = null;
    if ((api?.http_method === "POST" || api?.http_method === "PUT" || api?.http_method === "PATCH") && testBody) {
      if (api.content_type === "application/json") {
        try {
          parsedBody = JSON.parse(testBody);
        } catch {
          setBodyError("Invalid JSON - cannot send request");
          setTesting(false);
          return;
        }
      } else {
        parsedBody = testBody; // Send as-is for other content types
      }
    }

    try {
      const response = await apiFetch(`/apis/endpoints/${id}/test/`, {
        method: "POST",
        body: JSON.stringify({
          headers: testHeaders,
          params: testParams,
          body: parsedBody,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setCurrentResponse(data);
        fetchTestHistory(); // Refresh history
      }
    } catch (error) {
      console.error("Test failed:", error);
      setCurrentResponse({
        is_success: false,
        error_message: "Failed to run test",
        response_status: 0,
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "text-green-600";
    if (status >= 400 && status < 500) return "text-yellow-600";
    if (status >= 500) return "text-red-600";
    return "text-gray-600";
  };

  const resetToTemplate = () => {
    if (api?.body_template && Object.keys(api.body_template).length > 0) {
      setTestBody(JSON.stringify(api.body_template, null, 2));
      setBodyError("");
    }
  };

  const formatJSON = () => {
    if (api?.content_type === 'application/json' && testBody) {
      try {
        const parsed = JSON.parse(testBody);
        setTestBody(JSON.stringify(parsed, null, 2));
        setBodyError("");
      } catch {
        setBodyError("Cannot format - invalid JSON");
      }
    }
  };

  if (loading || !api) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading API...</p>
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
                onClick={() => router.push("/apis")}
                className="mr-4 p-2 text-slate-600 hover:text-slate-900"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">Test API: {api.name}</h1>
                <p className="text-sm text-slate-600 mt-1">
                  {api.http_method} {api.full_url}
                </p>
              </div>
            </div>
            <button
              onClick={runTest}
              disabled={testing || (bodyError !== "")}
              className="btn-primary flex items-center"
            >
              {testing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Running...
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
          {/* Request Configuration */}
          <div className="space-y-6">
            {/* Headers */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Request Headers</h3>
              <div className="space-y-2">
                {Object.entries(testHeaders).length === 0 ? (
                  <p className="text-sm text-slate-500">No headers configured</p>
                ) : (
                  Object.entries(testHeaders).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={key}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm"
                        disabled
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setTestHeaders(prev => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Query Parameters */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Query Parameters</h3>
              <div className="space-y-2">
                {Object.entries(testParams).length === 0 ? (
                  <p className="text-sm text-slate-500">No query parameters configured</p>
                ) : (
                  Object.entries(testParams).map(([key, value]) => (
                    <div key={key} className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={key}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg bg-slate-50 text-sm"
                        disabled
                      />
                      <input
                        type="text"
                        value={value}
                        onChange={(e) => setTestParams(prev => ({ ...prev, [key]: e.target.value }))}
                        className="flex-1 px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Request Body */}
            {(api.http_method === "POST" || api.http_method === "PUT" || api.http_method === "PATCH") && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Request Body</h3>
                  <span className="text-sm text-slate-500 bg-slate-100 px-2 py-1 rounded">
                    {api.content_type}
                  </span>
                </div>
                
                <div className="relative">
                  <textarea
                    value={testBody}
                    onChange={(e) => handleBodyChange(e.target.value)}
                    className={`w-full h-48 px-4 py-3 border ${
                      bodyError ? 'border-red-300' : 'border-slate-200'
                    } rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500`}
                    placeholder={api.content_type === 'application/json' ? '{\n  "key": "value"\n}' : 'key=value&key2=value2'}
                  />
                  {bodyError && (
                    <p className="absolute -bottom-6 left-0 text-sm text-red-600 flex items-center">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      {bodyError}
                    </p>
                  )}
                </div>
                
                <div className="mt-8 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={resetToTemplate}
                    className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
                    disabled={!api.body_template || Object.keys(api.body_template).length === 0}
                  >
                    <RotateCcw className="w-4 h-4 mr-1" />
                    Reset to template
                  </button>
                  
                  {api.content_type === 'application/json' && (
                    <button
                      type="button"
                      onClick={formatJSON}
                      className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
                    >
                      <Code className="w-4 h-4 mr-1" />
                      Format JSON
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Response */}
          <div className="space-y-6">
            {/* Current Response */}
            {currentResponse && (
              <div className="card p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-slate-900">Response</h3>
                  <div className="flex items-center space-x-3">
                    <span className={`font-medium ${getStatusColor(currentResponse.response_status)}`}>
                      {currentResponse.response_status || "Error"}
                    </span>
                    <span className="text-sm text-slate-500">
                      {currentResponse.response_time_ms}ms
                    </span>
                    <button
                      onClick={() => copyToClipboard(JSON.stringify(currentResponse.response_body, null, 2))}
                      className="p-1 text-slate-600 hover:text-indigo-600"
                      title="Copy response"
                    >
                      {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {currentResponse.error_message ? (
                  <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-red-600 mr-2 flex-shrink-0" />
                      <p className="text-sm text-red-700">{currentResponse.error_message}</p>
                    </div>
                  </div>
                ) : (
                  <pre className="bg-slate-900 text-slate-100 p-4 rounded-lg overflow-auto max-h-96 text-sm">
                    {JSON.stringify(currentResponse.response_body, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {/* Test History */}
            <div className="card p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-4">Test History</h3>
              {testLogs.length === 0 ? (
                <p className="text-sm text-slate-500">No tests run yet</p>
              ) : (
                <div className="space-y-2">
                  {testLogs.slice(0, 10).map((log) => (
                    <div key={log.id} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                      <div className="flex items-center space-x-3">
                        <span className={`font-medium text-sm ${getStatusColor(log.response_status)}`}>
                          {log.response_status}
                        </span>
                        <span className="text-sm text-slate-600">
                          {new Date(log.tested_at).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="text-xs text-slate-500">{log.response_time_ms}ms</span>
                        {log.is_success ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <AlertCircle className="w-4 h-4 text-red-600" />
                        )}
                      </div>
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