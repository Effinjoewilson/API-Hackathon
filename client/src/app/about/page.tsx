'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import { Loader2, FileText, Download, AlertCircle, CheckCircle2, RefreshCw, Clock } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface Documentation {
  setup: string;
  developer: string;
  api: string;
  design: string;
}

type TabType = string;

const markdownComponents = {
  pre: ({ ...props }: any) => (
    <pre className="bg-gray-100 p-4 rounded-lg overflow-x-auto" {...props} />
  ),
  code: ({ className, children, ...props }: any) => {
    const isInline = !className?.includes('language-');
    return isInline ? (
      <code className="bg-gray-100 px-1 py-0.5 rounded text-sm" {...props}>
        {children}
      </code>
    ) : (
      <code className={className} {...props}>
        {children}
      </code>
    );
  },
  table: ({ ...props }: any) => (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200" {...props} />
    </div>
  ),
};

export default function About() {
  const [loading, setLoading] = useState(false);
  const [checkingExisting, setCheckingExisting] = useState(true);
  const [documentation, setDocumentation] = useState<Documentation>({
    setup: '',
    developer: '',
    api: '',
    design: ''
  });
  const [error, setError] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);
  const [progress, setProgress] = useState('');

  useEffect(() => {
    checkExistingDocumentation();
  }, []);

  const checkExistingDocumentation = async () => {
    setCheckingExisting(true);
    setError('');

    try {
      const response = await apiFetch('/activities/generate-documentation/', {
        method: 'GET',
      });

      if (response.status === 401) {
        setError('You need to be logged in to view documentation');
        return;
      }

      const data = await response.json();

      if (data.success && data.exists && data.documentation) {
        // Data already has sections
        setDocumentation({
          setup: data.documentation.setup || '',
          developer: data.documentation.developer || '',
          api: data.documentation.api || '',
          design: data.documentation.design || '',
        });

        setCreatedAt(new Date(data.created_at).toLocaleString());
        setUpdatedAt(new Date(data.updated_at).toLocaleString());
      } else {
        // No documentation exists
        setDocumentation({ setup: '', developer: '', api: '', design: '' });
      }

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      console.error('Failed to check existing documentation:', err);
      setError('Failed to load documentation. Please ensure you are logged in. ' + errorMessage);
    } finally {
      setCheckingExisting(false);
    }
  };


  const generateDocumentation = async (regenerate = false) => {
    setLoading(true);
    setError('');
    setProgress(regenerate ? 'Regenerating documentation...' : 'Initializing documentation generation...');

    try {
      // Add a small delay to show the initial message
      await new Promise(resolve => setTimeout(resolve, 500));
      setProgress('Analyzing API endpoints and database schemas...');

      const response = await apiFetch('/activities/generate-documentation/', {
        method: 'POST',
        credentials: "include",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ regenerate })
      });

      if (response.status === 401) {
        setError('You need to be logged in to generate documentation');
        setProgress('');
        setLoading(false);
        return;
      }

      setProgress('Processing documentation content...');
      const data = await response.json();

      if (data.success) {
        setProgress('Formatting documentation sections...');
        // Parse the markdown content and split into sections
        const sections = parseSections(data.documentation);
        setDocumentation(sections);
        setCreatedAt(new Date(data.created_at).toLocaleString());
        setUpdatedAt(new Date(data.updated_at).toLocaleString());
        setProgress('');
      } else {
        setError(data.error || 'Failed to generate documentation');
        setProgress('');
      }
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError('Failed to generate documentation: ' + errorMessage);
      setProgress('');
    } finally {
      setLoading(false);
    }
  };

  const downloadMarkdown = () => {
    const fullContent = `# System Documentation

Generated on: ${updatedAt || new Date().toLocaleString()}

## Setup Guide
${documentation.setup}

## Developer Manual
${documentation.developer}

## API Documentation
${documentation.api}

## Design Documentation
${documentation.design}
`;
    const blob = new Blob([fullContent], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `documentation_${new Date().toISOString().split('T')[0]}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const parseSections = (markdown: string): Documentation => {
    const sections: Documentation = { setup: '', developer: '', api: '', design: '' };

    // More flexible regex to match headers with numbers and variations
    const lines = markdown.split('\n');
    let currentSection = '';
    let currentContent: string[] = [];

    lines.forEach((line, index) => {
      // Check for any header that contains our keywords
      const headerMatch = line.match(/^#+\s*(?:\d+\.\s*)?(.*)$/i);
      if (headerMatch) {
        const headerText = headerMatch[1].toLowerCase();

        // Save previous section content
        if (currentSection && currentContent.length > 0) {
          sections[currentSection as keyof Documentation] = currentContent.join('\n').trim();
        }

        // Check which section this header belongs to
        if (headerText.includes('setup') || headerText.includes('installation')) {
          currentSection = 'setup';
          currentContent = [line]; // Include the header
        } else if (headerText.includes('developer') || headerText.includes('development')) {
          currentSection = 'developer';
          currentContent = [line];
        } else if (headerText.includes('api')) {
          currentSection = 'api';
          currentContent = [line];
        } else if (headerText.includes('design') || headerText.includes('architecture')) {
          currentSection = 'design';
          currentContent = [line];
        } else if (currentSection) {
          // If we have a current section, add this line to it
          currentContent.push(line);
        }
      } else if (currentSection) {
        currentContent.push(line);
      }
    });

    // Don't forget the last section
    if (currentSection && currentContent.length > 0) {
      sections[currentSection as keyof Documentation] = currentContent.join('\n').trim();
    }

    // If no sections were parsed, put all content in the first tab
    if (!sections.setup && !sections.developer && !sections.api && !sections.design) {
      sections.setup = markdown;
    }

    return sections;
  };

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
        <Tabs defaultValue="about" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="about">About</TabsTrigger>
            <TabsTrigger value="documentation">Documentation</TabsTrigger>
          </TabsList>

          <TabsContent value="about">
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
          </TabsContent>

          <TabsContent value="documentation">
            {checkingExisting ? (
              <div className="container mx-auto py-8">
                <div className="flex items-center justify-center min-h-[400px]">
                  <Card className="p-6">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <p className="text-gray-700">Checking for existing documentation...</p>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="container mx-auto py-8">
                <div className="flex justify-between items-center mb-6">
                  <div>
                    <h1 className="text-3xl font-bold flex items-center gap-2">
                      <FileText className="h-8 w-8" />
                      System Documentation
                    </h1>
                    <div className="mt-2 space-y-1">
                      {createdAt && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Created: {createdAt}
                        </p>
                      )}
                      {updatedAt && updatedAt !== createdAt && (
                        <p className="text-sm text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Last updated: {updatedAt}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="space-x-4">
                    {documentation.setup ? (
                      <>
                        <Button
                          onClick={() => generateDocumentation(true)}
                          disabled={loading}
                          variant="default"
                          className="min-w-[180px]"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                              Regenerating...
                            </>
                          ) : (
                            <>
                              <RefreshCw className="mr-2 h-4 w-4" />
                              Regenerate
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={downloadMarkdown}
                          disabled={loading}
                          variant="outline"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download
                        </Button>
                      </>
                    ) : (
                      <>
                        <Button
                          onClick={() => generateDocumentation(false)}
                          disabled={loading}
                          className="min-w-[200px]"
                        >
                          {loading ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              <span>Generating...</span>
                            </>
                          ) : (
                            <>
                              <RefreshCw className="w-4 h-4" />
                              <span>Generate Documentation</span>
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => {
                            const content = Object.values(documentation).join('\n\n');
                            const blob = new Blob([content], { type: 'text/markdown' });
                            const url = URL.createObjectURL(blob);
                            const a = document.createElement('a');
                            a.href = url;
                            a.download = 'documentation.md';
                            document.body.appendChild(a);
                            a.click();
                            document.body.removeChild(a);
                            URL.revokeObjectURL(url);
                          }}
                          disabled={!documentation.setup}
                          variant="outline"
                          className="flex items-center space-x-2"
                        >
                          <Download className="w-4 h-4" />
                          <span>Download Markdown</span>
                        </Button>
                      </>
                    )}
                  </div>
                </div>

                {loading && (
                  <Card className="mb-6 p-6 bg-blue-50 border-blue-200">
                    <div className="flex items-center space-x-3">
                      <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                      <div>
                        <p className="font-medium text-blue-900">
                          {documentation.setup ? 'Regenerating Documentation' : 'Generating Documentation'}
                        </p>
                        <p className="text-sm text-blue-700">{progress}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {error && !loading && (
                  <Card className="mb-6 p-6 bg-red-50 border-red-200">
                    <div className="flex items-center space-x-3">
                      <AlertCircle className="h-5 w-5 text-red-600" />
                      <div>
                        <p className="font-medium text-red-900">Error</p>
                        <p className="text-sm text-red-700">{error}</p>
                      </div>
                    </div>
                  </Card>
                )}

                {!documentation.setup && !loading && !error && (
                  <Card className="p-12 text-center">
                    <FileText className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No Documentation Generated</h3>
                    <p className="text-gray-500 mb-6 max-w-md mx-auto">
                      Click the "Generate Documentation" button to create comprehensive system documentation
                      based on your API endpoints, database schemas, and mappings.
                    </p>
                    <Button onClick={() => generateDocumentation(false)}>
                      <FileText className="mr-2 h-4 w-4" />
                      Generate Documentation
                    </Button>
                  </Card>
                )}

                {documentation.setup && !loading && (
                  <Tabs defaultValue="setup" className="w-full">
                    <TabsList className="mb-4 grid w-full grid-cols-4">
                      <TabsTrigger value="setup" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        Setup Guide
                      </TabsTrigger>
                      <TabsTrigger value="developer" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        Developer Manual
                      </TabsTrigger>
                      <TabsTrigger value="api" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        API Documentation
                      </TabsTrigger>
                      <TabsTrigger value="design" className="data-[state=active]:bg-primary data-[state=active]:text-white">
                        Design Documentation
                      </TabsTrigger>
                    </TabsList>

                    <Card className="p-6 min-h-[500px]">
                      <TabsContent value="setup" asChild>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown components={markdownComponents}>
                            {documentation.setup}
                          </ReactMarkdown>
                        </div>
                      </TabsContent>

                      <TabsContent value="developer" asChild>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown components={markdownComponents}>
                            {documentation.developer}
                          </ReactMarkdown>
                        </div>
                      </TabsContent>

                      <TabsContent value="api" asChild>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown components={markdownComponents}>
                            {documentation.api}
                          </ReactMarkdown>
                        </div>
                      </TabsContent>

                      <TabsContent value="design" asChild>
                        <div className="prose prose-sm max-w-none">
                          <ReactMarkdown components={markdownComponents}>
                            {documentation.design}
                          </ReactMarkdown>
                        </div>
                      </TabsContent>
                    </Card>
                  </Tabs>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}