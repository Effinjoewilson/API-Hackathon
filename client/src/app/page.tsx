"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";

interface Stats {
  totalAPIs: number;
  totalDatabases: number;
  totalMappings: number;
  successRate: number;
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalAPIs: 0,
    totalDatabases: 0,
    totalMappings: 0,
    successRate: 0,
  });

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch APIs count
      const apisResponse = await apiFetch("/apis/endpoints/");
      const apis = await apisResponse.json();
      
      // Fetch Databases count
      const dbsResponse = await apiFetch("/databases/connections/");
      const dbs = await dbsResponse.json();
      
      // Fetch Mappings count
      const mappingsResponse = await apiFetch("/mappings/data-mappings/");
      const mappings = await mappingsResponse.json();
      
      setStats({
        totalAPIs: apis.length,
        totalDatabases: dbs.length,
        totalMappings: mappings.length,
        successRate: 98.5, // You can calculate this from execution history
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
          <p className="mt-2 text-lg text-slate-600">
            Streamline your API integrations and database connections
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Total APIs</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalAPIs}</p>
              </div>
              <div className="p-3 bg-indigo-50 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Databases</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalDatabases}</p>
              </div>
              <div className="p-3 bg-green-50 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Data Mappings</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.totalMappings}</p>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
            </div>
          </div>

          <div className="card p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-slate-600">Success Rate</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.successRate}%</p>
              </div>
              <div className="p-3 bg-emerald-50 rounded-lg">
                <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        {/* Main Actions Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* API Endpoints */}
          <div className="card-hover p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 ml-3">API Endpoints</h2>
            </div>
            <p className="text-slate-600 mb-4">
              Configure and manage your API endpoints with authentication and rate limiting
            </p>
            <button
              onClick={() => router.push("/apis")}
              className="btn-primary w-full"
            >
              Manage APIs
            </button>
          </div>

          {/* Database Connections */}
          <div className="card-hover p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 ml-3">Databases</h2>
            </div>
            <p className="text-slate-600 mb-4">
              Connect multiple databases with secure credential management
            </p>
            <button
              onClick={() => router.push("/databases")}
              className="btn-primary w-full"
            >
              Add Database
            </button>
          </div>

          {/* Data Mapping */}
          <div className="card-hover p-6">
            <div className="flex items-center mb-4">
              <div className="p-2 bg-purple-100 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-slate-900 ml-3">Data Mappings</h2>
            </div>
            <p className="text-slate-600 mb-4">
              Create visual mappings between API responses and database tables
            </p>
            <button
              onClick={() => router.push("/mappings")}
              className="btn-primary w-full"
            >
              Manage Mappings
            </button>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="mt-8">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">Recent Activity</h3>
          <div className="card">
            <div className="divide-y divide-slate-100">
              <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-slate-900">User API mapped to customers table</p>
                    <p className="text-sm text-slate-500">2 minutes ago</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-green-100 text-green-700">
                  Success
                </span>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-slate-900">New PostgreSQL database added</p>
                    <p className="text-sm text-slate-500">1 hour ago</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-blue-100 text-blue-700">
                  Database
                </span>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-slate-50">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <svg className="w-4 h-4 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                  </div>
                  <div className="ml-4">
                    <p className="font-medium text-slate-900">Product sync mapping executed</p>
                    <p className="text-sm text-slate-500">3 hours ago</p>
                  </div>
                </div>
                <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-purple-100 text-purple-700">
                  Mapping
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}