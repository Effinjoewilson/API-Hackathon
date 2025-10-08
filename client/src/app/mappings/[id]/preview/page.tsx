"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, Eye } from "lucide-react";
import { apiFetch } from "@/lib/api";
import PreviewPanel from "@/components/mapping/PreviewPanel";

interface MappingDetails {
  id: number;
  name: string;
  api_endpoint_name: string;
  database_name: string;
  target_table: string;
  field_mappings: any[];
}

interface TestResult {
  sample_size: number;
  transformed_data: any[];
  sql_preview: string;
  target_table: string;
}

export default function PreviewMappingPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [mapping, setMapping] = useState<MappingDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [sampleSize, setSampleSize] = useState(5);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchMapping();
  }, [id]);

  useEffect(() => {
    if (mapping) {
      runTest();
    }
  }, [mapping]);

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

  const runTest = async () => {
    setTesting(true);
    setError(null);

    try {
      const response = await apiFetch(`/mappings/data-mappings/${id}/test/`, {
        method: "POST",
        body: JSON.stringify({ sample_size: sampleSize }),
      });

      if (response.ok) {
        const data = await response.json();
        setTestResult(data);
      } else {
        const errorData = await response.json();
        setError(errorData.error || "Failed to run test");
      }
    } catch (error) {
      setError("Failed to connect to server");
      console.error("Failed to test mapping:", error);
    } finally {
      setTesting(false);
    }
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
                <h1 className="text-2xl font-bold text-slate-900">Preview Mapping: {mapping.name}</h1>
                <p className="text-sm text-slate-600 mt-1">
                  {mapping.api_endpoint_name} → {mapping.database_name} / {mapping.target_table}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <label className="text-sm text-slate-600">Sample Size:</label>
                <select
                  value={sampleSize}
                  onChange={(e) => setSampleSize(parseInt(e.target.value))}
                  className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="1">1 record</option>
                  <option value="5">5 records</option>
                  <option value="10">10 records</option>
                  <option value="20">20 records</option>
                </select>
              </div>
              <button
                onClick={runTest}
                disabled={testing}
                className="btn-secondary flex items-center"
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${testing ? 'animate-spin' : ''}`} />
                {testing ? 'Refreshing...' : 'Refresh Preview'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error running preview</h3>
                <p className="mt-1 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        ) : testResult ? (
          <PreviewPanel
            transformedData={testResult.transformed_data}
            sqlPreview={testResult.sql_preview}
            targetTable={testResult.target_table}
          />
        ) : (
          <div className="text-center py-12">
            <Eye className="w-12 h-12 text-slate-400 mx-auto mb-4" />
            <p className="text-slate-600">No preview data available</p>
          </div>
        )}
      </div>
    </div>
  );
}