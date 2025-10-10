"use client";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { Activity, ArrowUpDown, Database, ChevronRight } from "lucide-react";

interface Stats {
  totalAPIs: number;
  totalDatabases: number;
  totalMappings: number;
  databaseHealth: number;
}

interface Activity {
  id: number;
  type: 'api_test' | 'mapping_execution' | 'database_test';
  status: 'success' | 'failed' | 'partial';
  title: string;
  timestamp: string;
  details?: string;
}

export default function Home() {
  const router = useRouter();
  const [stats, setStats] = useState<Stats>({
    totalAPIs: 0,
    totalDatabases: 0,
    totalMappings: 0,
    databaseHealth: 0,
  });
  const [activities, setActivities] = useState<Activity[]>([]);
  const [showAllActivities, setShowAllActivities] = useState(false);

  useEffect(() => {
    fetchStats();
    fetchActivities();
  }, []);

  const fetchStats = async () => {
    try {
      // Fetch APIs count
      const apisResponse = await apiFetch("/apis/endpoints/");
      const apis = await apisResponse.json();

      // Fetch Databases count and calculate health
      const dbsResponse = await apiFetch("/databases/connections/");
      const dbs = await dbsResponse.json();

      // Calculate database health based on connection status
      const activeAndFailedConnections = dbs.filter((db: any) => 
        db.connection_status === 'active' || db.connection_status === 'failed'
      );
      const activeConnections = dbs.filter((db: any) => 
        db.connection_status === 'active'
      );

      // Calculate health percentage
      const healthPercentage = activeAndFailedConnections.length > 0
        ? (activeConnections.length / activeAndFailedConnections.length) * 100
        : 100; // If no checked connections, assume 100%

      // Fetch Mappings count
      const mappingsResponse = await apiFetch("/mappings/data-mappings/");
      const mappings = await mappingsResponse.json();

      setStats({
        totalAPIs: apis.length,
        totalDatabases: dbs.length,
        totalMappings: mappings.length,
        databaseHealth: Math.round(healthPercentage),
      });
    } catch (error) {
      console.error("Failed to fetch stats:", error);
    }
  };

  const fetchActivities = async () => {
    try {
      const response = await apiFetch('/activities/recent/');
      const data = await response.json();
      setActivities(data);
    } catch (error) {
      console.error('Failed to fetch activities:', error);
    }
  };

  const getActivityIcon = (type: string, status: string) => {
    if (type === 'api_test') {
      return (
        <div className={`p-2 rounded-lg ${status === 'success' ? 'bg-green-100' : 'bg-red-100'}`}>
          <Activity className={`w-4 h-4 ${status === 'success' ? 'text-green-600' : 'text-red-600'}`} />
        </div>
      );
    } else if (type === 'mapping_execution') {
      return (
        <div className="p-2 bg-purple-100 rounded-lg">
          <ArrowUpDown className="w-4 h-4 text-purple-600" />
        </div>
      );
    } else {
      return (
        <div className="p-2 bg-blue-100 rounded-lg">
          <Database className="w-4 h-4 text-blue-600" />
        </div>
      );
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
                <p className="text-sm text-slate-600">Database Health</p>
                <p className="text-2xl font-bold text-slate-900 mt-1">{stats.databaseHealth}%</p>
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
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
            <button
              onClick={() => setShowAllActivities(!showAllActivities)}
              className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center"
            >
              {showAllActivities ? 'Show Less' : 'View All'}
              <ChevronRight className="w-4 h-4 ml-1" />
            </button>
          </div>

          <div className="card">
            <div className="divide-y divide-slate-100">
              {activities
                .slice(0, showAllActivities ? 10 : 3)
                .map((activity) => (
                  <div key={activity.id} className="p-4 flex items-center justify-between hover:bg-slate-50">
                    <div className="flex items-center">
                      {getActivityIcon(activity.type, activity.status)}
                      <div className="ml-4">
                        <p className="font-medium text-slate-900">{activity.title}</p>
                        <p className="text-sm text-slate-500">
                          {new Date(activity.timestamp).toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full
                        ${activity.status === 'success' ? 'bg-green-100 text-green-700' :
                          activity.status === 'failed' ? 'bg-red-100 text-red-700' :
                            'bg-yellow-100 text-yellow-700'}`}
                    >
                      {activity.status.charAt(0).toUpperCase() + activity.status.slice(1)}
                    </span>
                  </div>
                ))}

              {activities.length === 0 && (
                <div className="p-4 text-center text-slate-500">
                  No recent activity
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}