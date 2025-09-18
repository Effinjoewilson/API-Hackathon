export default function Home() {
  return (
    <div className="space-y-10">
      {/* Header */}
      <header className="bg-blue-600 text-white p-6 rounded-lg shadow">
        <h1 className="text-3xl font-bold">API Hackathon Dashboard</h1>
        <p className="text-blue-100">
          Manage API endpoints, integrations, and developer productivity tools.
        </p>
      </header>

      {/* Sections */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* API Endpoints */}
        <div className="p-6 border rounded-lg shadow bg-white">
          <h2 className="text-xl font-semibold mb-3">API Endpoints</h2>
          <p className="text-gray-600 mb-3">
            Configure endpoints with authentication, versioning, and rate-limits.
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
            Manage APIs
          </button>
        </div>

        {/* Database Connections */}
        <div className="p-6 border rounded-lg shadow bg-white">
          <h2 className="text-xl font-semibold mb-3">Database Connections</h2>
          <p className="text-gray-600 mb-3">
            Link APIs to multiple databases with secure credentials.
          </p>
          <button className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700">
            Connect DB
          </button>
        </div>

        {/* Visual Mapping */}
        <div className="p-6 border rounded-lg shadow bg-white">
          <h2 className="text-xl font-semibold mb-3">Visual Mapping</h2>
          <p className="text-gray-600 mb-3">
            Drag-and-drop fields between API endpoints and DB tables.
          </p>
          <button className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700">
            Open Mapper
          </button>
        </div>

        {/* Data Flow Testing */}
        <div className="p-6 border rounded-lg shadow bg-white">
          <h2 className="text-xl font-semibold mb-3">Data Flow Testing</h2>
          <p className="text-gray-600 mb-3">
            Validate and simulate full request-response cycles.
          </p>
          <button className="bg-orange-600 text-white px-4 py-2 rounded hover:bg-orange-700">
            Run Tests
          </button>
        </div>

        {/* AI Assistants */}
        <div className="p-6 border rounded-lg shadow bg-white">
          <h2 className="text-xl font-semibold mb-3">AI Assistants</h2>
          <p className="text-gray-600 mb-3">
            Generate code, docs, and test cases with AI assistance.
          </p>
          <button className="bg-pink-600 text-white px-4 py-2 rounded hover:bg-pink-700">
            Try AI Tools
          </button>
        </div>

        {/* Productivity Insights */}
        <div className="p-6 border rounded-lg shadow bg-white">
          <h2 className="text-xl font-semibold mb-3">Productivity Insights</h2>
          <p className="text-gray-600 mb-3">
            Track API performance, errors, and developer efficiency.
          </p>
          <button className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700">
            View Reports
          </button>
        </div>
      </section>
    </div>
  );
}
