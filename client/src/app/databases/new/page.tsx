"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Database, AlertCircle, Eye, EyeOff, Check } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface FormData {
    name: string;
    description: string;
    db_type: string;
    host: string;
    port: number;
    database: string;
    schema: string;
    username: string;
    password: string;
    ssl_enabled: boolean;
    mongodb_connection_type: string;
}

export default function NewDatabasePage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [testing, setTesting] = useState(false);
    const [errors, setErrors] = useState<any>({});
    const [showPassword, setShowPassword] = useState(false);
    const [testResult, setTestResult] = useState<{
        success: boolean;
        message: string;
        server_info?: any;
    } | null>(null);

    const [formData, setFormData] = useState<FormData>({
        name: "",
        description: "",
        db_type: "postgresql",
        host: "localhost",
        port: 5432,
        database: "",
        schema: "",
        username: "",
        password: "",
        ssl_enabled: false,
        mongodb_connection_type: "standard",
    });

    const defaultPorts: { [key: string]: number } = {
        postgresql: 5432,
        mysql: 3306,
        mongodb: 27017,
        mssql: 1433,
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;

        if (name === 'db_type') {
            // Update port when database type changes
            setFormData(prev => ({
                ...prev,
                [name]: value,
                port: defaultPorts[value] || 5432,
                schema: value === 'postgresql' ? 'public' : '', // Set default schema for PostgreSQL
                mongodb_connection_type: value === 'mongodb' ? prev.mongodb_connection_type : 'standard',
            }));
        } else if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData(prev => ({ ...prev, [name]: checked }));
        } else if (name === 'port') {
            setFormData(prev => ({ ...prev, [name]: parseInt(value) || 0 }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleTest = async () => {
        setTesting(true);
        setTestResult(null);

        try {
            // First create a temporary connection to test
            const testResponse = await apiFetch("/databases/connections/", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            if (testResponse.ok) {
                const tempDb = await testResponse.json();

                // Test the connection
                const response = await apiFetch(`/databases/connections/${tempDb.id}/test/`, {
                    method: "POST",
                });

                const result = await response.json();
                setTestResult(result);

                // Delete the temporary connection
                await apiFetch(`/databases/connections/${tempDb.id}/`, {
                    method: "DELETE",
                });
            } else {
                const data = await testResponse.json();
                setTestResult({
                    success: false,
                    message: Object.values(data).flat().join(", "),
                });
            }
        } catch (error) {
            setTestResult({
                success: false,
                message: "Failed to test connection",
            });
        } finally {
            setTesting(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        try {
            const response = await apiFetch("/databases/connections/", {
                method: "POST",
                body: JSON.stringify(formData),
            });

            if (response.ok) {
                router.push("/databases");
            } else {
                const data = await response.json();
                setErrors(data);
            }
        } catch (error) {
            console.error("Failed to create database:", error);
        } finally {
            setLoading(false);
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

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="bg-white border-b border-slate-200">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
                    <div className="flex items-center">
                        <button
                            onClick={() => router.push("/databases")}
                            className="mr-4 p-2 text-slate-600 hover:text-slate-900"
                        >
                            <ArrowLeft className="w-5 h-5" />
                        </button>
                        <h1 className="text-2xl font-bold text-slate-900">Add New Database</h1>
                    </div>
                </div>
            </div>

            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Basic Information */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Basic Information</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Database Name *
                                </label>
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="e.g., Production Database"
                                    required
                                />
                                {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Description
                                </label>
                                <textarea
                                    name="description"
                                    value={formData.description}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder="Brief description of this database connection..."
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Database Type *
                                </label>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                    {[
                                        { value: 'postgresql', label: 'PostgreSQL', icon: '🐘' },
                                        { value: 'mysql', label: 'MySQL', icon: '🐬' },
                                        { value: 'mongodb', label: 'MongoDB', icon: '🍃' },
                                        { value: 'mssql', label: 'SQL Server', icon: '🏢' },
                                    ].map((type) => (
                                        <label
                                            key={type.value}
                                            className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${formData.db_type === type.value
                                                ? 'border-indigo-500 bg-indigo-50'
                                                : 'border-slate-200 hover:border-slate-300'
                                                }`}
                                        >
                                            <input
                                                type="radio"
                                                name="db_type"
                                                value={type.value}
                                                checked={formData.db_type === type.value}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <span className="text-2xl mr-2">{type.icon}</span>
                                            <span className="text-sm font-medium">{type.label}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Connection Details */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Connection Details</h2>

                        <div className="space-y-4">
                            {formData.db_type === 'mongodb' && (
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Connection Type
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${formData.mongodb_connection_type === 'standard'
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="mongodb_connection_type"
                                                value="standard"
                                                checked={formData.mongodb_connection_type === 'standard'}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <span className="text-sm font-medium">Standard (Host & Port)</span>
                                        </label>
                                        <label className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${formData.mongodb_connection_type === 'atlas'
                                            ? 'border-indigo-500 bg-indigo-50'
                                            : 'border-slate-200 hover:border-slate-300'
                                            }`}>
                                            <input
                                                type="radio"
                                                name="mongodb_connection_type"
                                                value="atlas"
                                                checked={formData.mongodb_connection_type === 'atlas'}
                                                onChange={handleChange}
                                                className="sr-only"
                                            />
                                            <span className="text-sm font-medium">MongoDB Atlas (Cloud)</span>
                                        </label>
                                    </div>
                                    {formData.mongodb_connection_type === 'atlas' && (
                                        <p className="mt-2 text-xs text-slate-500">
                                            For Atlas, use your cluster address (e.g., cluster0.xxxxx.mongodb.net) as the host, without the port.
                                        </p>
                                    )}
                                </div>
                            )}

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Host *
                                    </label>
                                    <input
                                        type="text"
                                        name="host"
                                        value={formData.host}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder={
                                            formData.db_type === 'mongodb' && formData.mongodb_connection_type === 'atlas'
                                                ? "cluster0.xxxxx.mongodb.net"
                                                : "localhost"
                                        }
                                        required
                                    />
                                    {errors.host && <p className="mt-1 text-sm text-red-600">{errors.host}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Port {formData.db_type === 'mongodb' && formData.mongodb_connection_type === 'atlas' ? '(not used for Atlas)' : '*'}
                                    </label>
                                    <input
                                        type="number"
                                        name="port"
                                        value={formData.port}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        required={!(formData.db_type === 'mongodb' && formData.mongodb_connection_type === 'atlas')}
                                        disabled={formData.db_type === 'mongodb' && formData.mongodb_connection_type === 'atlas'}
                                    />
                                    {errors.port && <p className="mt-1 text-sm text-red-600">{errors.port}</p>}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Database Name *
                                    </label>
                                    <input
                                        type="text"
                                        name="database"
                                        value={formData.database}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder={formData.db_type === 'mongodb' ? 'mydb' : 'database_name'}
                                        required
                                    />
                                    {errors.database && <p className="mt-1 text-sm text-red-600">{errors.database}</p>}
                                </div>

                                {formData.db_type === 'postgresql' && (
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">
                                            Schema
                                        </label>
                                        <input
                                            type="text"
                                            name="schema"
                                            value={formData.schema}
                                            onChange={handleChange}
                                            className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                            placeholder="public"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Authentication */}
                    <div className="card p-6">
                        <h2 className="text-lg font-semibold text-slate-900 mb-4">Authentication</h2>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Username *
                                </label>
                                <input
                                    type="text"
                                    name="username"
                                    value={formData.username}
                                    onChange={handleChange}
                                    className="w-full px-4 py-2 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    placeholder={formData.db_type === 'postgresql' ? 'postgres' : 'root'}
                                    required
                                />
                                {errors.username && <p className="mt-1 text-sm text-red-600">{errors.username}</p>}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Password *
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={formData.password}
                                        onChange={handleChange}
                                        className="w-full px-4 py-2 pr-10 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                        placeholder="••••••••"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-600 hover:text-slate-800"
                                    >
                                        {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                    </button>
                                </div>
                                {errors.password && <p className="mt-1 text-sm text-red-600">{errors.password}</p>}
                            </div>

                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="ssl_enabled"
                                    name="ssl_enabled"
                                    checked={formData.ssl_enabled}
                                    onChange={handleChange}
                                    className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                />
                                <label htmlFor="ssl_enabled" className="ml-2 block text-sm text-slate-700">
                                    Enable SSL/TLS Connection
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Test Result */}
                    {testResult && (
                        <div className={`card p-6 ${testResult.success ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                            <div className="flex items-start">
                                <div className={`p-2 rounded-lg ${testResult.success ? 'bg-green-100' : 'bg-red-100'}`}>
                                    {testResult.success ? (
                                        <Check className="w-5 h-5 text-green-600" />
                                    ) : (
                                        <AlertCircle className="w-5 h-5 text-red-600" />
                                    )}
                                </div>
                                <div className="ml-3 flex-1">
                                    <h3 className={`text-sm font-medium ${testResult.success ? 'text-green-800' : 'text-red-800'}`}>
                                        {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                                    </h3>
                                    <p className={`mt-1 text-sm ${testResult.success ? 'text-green-700' : 'text-red-700'}`}>
                                        {testResult.message}
                                    </p>
                                    {testResult.success && testResult.server_info && (
                                        <div className="mt-2 text-xs text-green-600">
                                            <p>Version: {testResult.server_info.version?.split('\n')[0]}</p>
                                            {testResult.server_info.current_database && (
                                                <p>Database: {testResult.server_info.current_database}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex justify-end space-x-4">
                        <button
                            type="button"
                            onClick={() => router.push("/databases")}
                            className="px-6 py-2 border border-slate-200 text-slate-700 rounded-lg hover:bg-slate-50"
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={testing || !formData.host || !formData.database || !formData.username || !formData.password}
                            className="px-6 py-2 border border-indigo-200 text-indigo-700 rounded-lg hover:bg-indigo-50 flex items-center"
                        >
                            {testing ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-indigo-600 mr-2"></div>
                                    Testing...
                                </>
                            ) : (
                                <>
                                    <Database className="w-4 h-4 mr-2" />
                                    Test Connection
                                </>
                            )}
                        </button>
                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary flex items-center"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                    Creating...
                                </>
                            ) : (
                                <>
                                    <Save className="w-4 h-4 mr-2" />
                                    Create Database
                                </>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}