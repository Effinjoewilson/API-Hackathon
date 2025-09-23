export default function Footer() {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row justify-between items-center">
          <div className="flex items-center">
            <p className="text-sm text-slate-600">
              © {new Date().getFullYear()} EndpointX. All rights reserved.
            </p>
          </div>
          <div className="flex items-center space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">
              Documentation
            </a>
            <a href="#" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">
              API Reference
            </a>
            <a href="#" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">
              Support
            </a>
            <a href="#" className="text-sm text-slate-600 hover:text-indigo-600 transition-colors">
              Privacy Policy
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}