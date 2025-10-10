export default function About() {
  return (
    <div className="min-h-screen bg-slate-50">
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl font-bold text-slate-900">About EndpointX</h1>
          <p className="mt-2 text-lg text-slate-600">
            API Development & Integration Platform
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-8">
          <div className="prose prose-slate max-w-none">
            <h2 className="text-2xl font-bold text-slate-900 mb-4">Our Mission</h2>
            <p className="text-slate-600 leading-relaxed mb-6">
              EndpointX is designed to streamline the complex process of API integration and data flow management. 
              We empower developers to build, test, and deploy API connections with confidence.
            </p>

            <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-8">Key Features</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
              <div className="flex items-start">
                <div className="p-2 bg-indigo-100 rounded-lg">
                  <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-slate-900">Instant API Configuration</h4>
                  <p className="text-sm text-slate-600 mt-1">Set up secure API endpoints with authentication and rate limiting in minutes</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="p-2 bg-green-100 rounded-lg">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-slate-900">Multi-Database Support</h4>
                  <p className="text-sm text-slate-600 mt-1">Connect to PostgreSQL, MySQL, MSSQL,  MongoDB, and more with secure credential management</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-slate-900">Visual Data Mapping</h4>
                  <p className="text-sm text-slate-600 mt-1">Intuitive drag-and-drop interface for mapping API responses to database fields</p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="p-2 bg-orange-100 rounded-lg">
                  <svg className="w-5 h-5 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div className="ml-4">
                  <h4 className="font-medium text-slate-900">End-to-End Testing</h4>
                  <p className="text-sm text-slate-600 mt-1">Validate data flows with comprehensive testing and monitoring tools</p>
                </div>
              </div>
            </div>

            <h3 className="text-xl font-semibold text-slate-900 mb-3 mt-8">Built for Developers</h3>
            <p className="text-slate-600 leading-relaxed mb-6">
              Whether you're building microservices, integrating third-party APIs, or managing complex data pipelines, 
              EndpointX provides the tools you need to work efficiently and confidently.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}