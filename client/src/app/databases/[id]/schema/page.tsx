"use client";
import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { ArrowLeft, RefreshCw, Database, Key, ChevronDown, ChevronRight, Search, FileText, Hash, Calendar, ToggleRight, Link } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface Column {
  name: string;
  type: string;
  nullable: boolean;
  default: string | null;
  constraints: string[];
  length?: number;
  precision?: number;
  scale?: number;
  extra?: string;
}

interface Table {
  type: string;
  columns: Column[];
}

interface MongoField {
  name: string;
  type: string;
  sample_value?: string;
}

interface Collection {
  type: string;
  count: number;
  size: number;
  avgObjSize: number;
  fields: MongoField[];
}

interface Schema {
  tables?: { [key: string]: Table };
  collections?: { [key: string]: Collection };
  summary: {
    total_tables?: number;
    total_collections?: number;
    schema_name?: string;
    database_name?: string;
  };
  updated_at: string;
  from_cache?: boolean;
}

interface DatabaseInfo {
  id: number;
  name: string;
  db_type: string;
  host: string;
  port: number;
  database: string;
}

export default function SchemaPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id;

  const [database, setDatabase] = useState<DatabaseInfo | null>(null);
  const [schema, setSchema] = useState<Schema | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedTables, setExpandedTables] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchDatabase();
    fetchSchema();
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
    }
  };

  const fetchSchema = async (refresh = false) => {
    try {
      setLoading(!refresh);
      setRefreshing(refresh);
      
      const url = `/databases/connections/${id}/schema/${refresh ? '?refresh=true' : ''}`;
      const response = await apiFetch(url, {
        method: refresh ? 'POST' : 'GET'
      });
      
      if (response.ok) {
        const data = await response.json();
        setSchema(data);
        
        // Auto-expand first few tables
        if (!refresh && (data.tables || data.collections)) {
          const items = Object.keys(data.tables || data.collections || {}).slice(0, 3);
          setExpandedTables(new Set(items));
        }
      }
    } catch (error) {
      console.error("Failed to fetch schema:", error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const toggleTable = (tableName: string) => {
    setExpandedTables(prev => {
      const newSet = new Set(prev);
      if (newSet.has(tableName)) {
        newSet.delete(tableName);
      } else {
        newSet.add(tableName);
      }
      return newSet;
    });
  };

  const getTypeIcon = (type: string) => {
    if (type.includes('int') || type.includes('numeric') || type.includes('decimal')) return <Hash className="w-3 h-3" />;
    if (type.includes('char') || type.includes('text')) return <FileText className="w-3 h-3" />;
    if (type.includes('date') || type.includes('time')) return <Calendar className="w-3 h-3" />;
    if (type.includes('bool')) return <ToggleRight className="w-3 h-3" />;
    if (type.includes('json') || type === 'object') return <>{`{}`}</>;
    if (type.includes('array')) return <>[  ]</>;
    return <Database className="w-3 h-3" />;
  };

  const getConstraintBadge = (constraints: string[]) => {
    if (constraints.includes('PRIMARY KEY')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800" title="Primary Key">
          <Key className="w-3 h-3 mr-1" />
          PK
        </span>
      );
    }
    if (constraints.includes('FOREIGN KEY')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800" title="Foreign Key">
          <Link className="w-3 h-3 mr-1" />
          FK
        </span>
      );
    }
    if (constraints.includes('UNIQUE')) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800" title="Unique">
          U
        </span>
      );
    }
    return null;
  };

  const filteredItems = () => {
    if (!schema) return {};
    
    const items = schema.tables || schema.collections || {};
    if (!searchTerm) return items;
    
    const filtered: any = {};
    Object.entries(items).forEach(([name, data]) => {
      // Check table/collection name
      if (name.toLowerCase().includes(searchTerm.toLowerCase())) {
        filtered[name] = data;
      } else {
        // Check column/field names
        const hasMatchingColumn = 
          (data as Table).columns?.some(col => col.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
          (data as Collection).fields?.some(field => field.name.toLowerCase().includes(searchTerm.toLowerCase()));
        
        if (hasMatchingColumn) {
          filtered[name] = data;
        }
      }
    });
    
    return filtered;
  };

  if (loading || !database) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-slate-600">Loading schema...</p>
        </div>
      </div>
    );
  }

  const items = filteredItems();

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
                <h1 className="text-2xl font-bold text-slate-900">Database Schema: {database.name}</h1>
                <p className="text-sm text-slate-600 mt-1">
                  {database.db_type === 'postgresql' ? 'PostgreSQL' : 
                   database.db_type === 'mysql' ? 'MySQL' : 
                   database.db_type === 'mongodb' ? 'MongoDB' : 'Database'} 
                  {' • '}{database.host}:{database.port}/{database.database}
                </p>
              </div>
            </div>
            <button
              onClick={() => fetchSchema(true)}
              disabled={refreshing}
              className="btn-secondary flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              {refreshing ? 'Refreshing...' : 'Refresh Schema'}
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {schema && (
          <>
            {/* Summary */}
            <div className="card p-6 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-slate-900">Schema Summary</h3>
                  <div className="mt-2 flex items-center space-x-4 text-sm text-slate-600">
                    <span>
                      {schema.summary.total_tables !== undefined 
                        ? `${schema.summary.total_tables} Tables` 
                        : `${schema.summary.total_collections} Collections`}
                    </span>
                    <span>•</span>
                    <span>
                      Last updated: {new Date(schema.updated_at).toLocaleString()}
                      {schema.from_cache && ' (cached)'}
                    </span>
                  </div>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="Search tables/columns..."
                    className="pl-10 pr-4 py-2 w-64 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>
            </div>

            {/* Tables/Collections */}
            <div className="space-y-4">
              {Object.entries(items).length === 0 ? (
                <div className="card p-8 text-center text-slate-500">
                  No {schema.tables ? 'tables' : 'collections'} found
                  {searchTerm && ' matching your search'}
                </div>
              ) : (
                Object.entries(items as Record<string, Table | Collection>).map(([name, data]) => {
                  const isExpanded = expandedTables.has(name);
                  const isTable = 'columns' in data;
                  
                  return (
                    <div key={name} className="card overflow-hidden">
                      <button
                        onClick={() => toggleTable(name)}
                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-slate-50 transition-colors"
                      >
                        <div className="flex items-center">
                          {isExpanded ? (
                            <ChevronDown className="w-4 h-4 text-slate-600 mr-2" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-slate-600 mr-2" />
                          )}
                          <Database className="w-4 h-4 text-slate-500 mr-2" />
                          <span className="font-medium text-slate-900">{name}</span>
                          {!isTable && (
                            <span className="ml-3 text-sm text-slate-500">
                              ({(data as Collection).count} documents)
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-2">
                          {isTable && (
                            <span className="text-sm text-slate-500">
                              {(data as Table).columns.length} columns
                            </span>
                          )}
                        </div>
                      </button>
                      
                      {isExpanded && (
                        <div className="border-t border-slate-200">
                          {isTable ? (
                            // SQL Table Columns
                            <div className="overflow-x-auto">
                              <table className="w-full">
                                <thead className="bg-slate-50">
                                  <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                      Column
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                      Type
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                      Nullable
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                      Default
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                      Constraints
                                    </th>
                                  </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-200">
                                  {(data as Table).columns.map((column) => (
                                    <tr key={column.name} className="hover:bg-slate-50">
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                          <span className="font-medium text-slate-900">
                                            {column.name}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                          <span className="text-slate-500">
                                            {getTypeIcon(column.type)}
                                          </span>
                                          <span className="text-sm text-slate-600">
                                            {column.type}
                                            {column.length && `(${column.length})`}
                                            {column.precision && `(${column.precision}${column.scale ? `,${column.scale}` : ''})`}
                                          </span>
                                        </div>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className={`text-sm ${column.nullable ? 'text-slate-500' : 'font-medium text-slate-900'}`}>
                                          {column.nullable ? 'Yes' : 'No'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <span className="text-sm text-slate-600">
                                          {column.default || '-'}
                                        </span>
                                      </td>
                                      <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center space-x-2">
                                          {getConstraintBadge(column.constraints)}
                                          {column.extra && (
                                            <span className="text-xs text-slate-500">
                                              {column.extra}
                                            </span>
                                          )}
                                        </div>
                                      </td>
                                    </tr>
                                  ))}
                                </tbody>
                              </table>
                            </div>
                          ) : (
                            // MongoDB Collection Fields
                            <div className="p-6">
                              <div className="mb-4 grid grid-cols-3 gap-4 text-sm">
                                <div>
                                  <span className="text-slate-500">Documents:</span>
                                  <span className="ml-2 font-medium text-slate-900">
                                    {(data as Collection).count.toLocaleString()}
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Total Size:</span>
                                  <span className="ml-2 font-medium text-slate-900">
                                    {((data as Collection).size / 1024 / 1024).toFixed(2)} MB
                                  </span>
                                </div>
                                <div>
                                  <span className="text-slate-500">Avg Document:</span>
                                  <span className="ml-2 font-medium text-slate-900">
                                    {((data as Collection).avgObjSize / 1024).toFixed(2)} KB
                                  </span>
                                </div>
                              </div>
                              
                              {(data as Collection).fields.length > 0 && (
                                <div className="space-y-2">
                                  <h4 className="text-sm font-medium text-slate-700 mb-2">
                                    Sample Fields (from first document)
                                  </h4>
                                  {(data as Collection).fields.map((field) => (
                                    <div
                                      key={field.name}
                                      className="flex items-center justify-between py-2 px-3 bg-slate-50 rounded"
                                    >
                                      <div className="flex items-center space-x-2">
                                        <span className="text-slate-500">
                                          {getTypeIcon(field.type)}
                                        </span>
                                        <span className="font-medium text-slate-900">
                                          {field.name}
                                        </span>
                                      </div>
                                      <div className="flex items-center space-x-4">
                                        <span className="text-sm text-slate-600">
                                          {field.type}
                                        </span>
                                        {field.sample_value && (
                                          <span className="text-xs text-slate-500 max-w-xs truncate">
                                            Sample: {field.sample_value}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}