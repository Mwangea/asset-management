import React from 'react';
import { Link } from 'react-router-dom';

const UnauthorizedPage: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-sky-50 to-sky-100">
      <div className="p-8 bg-white rounded-lg shadow-md max-w-md w-full mx-4 sm:mx-0 border border-sky-200">
        {/* Wave decoration at the top */}
        <div className="relative h-20 mb-6 overflow-hidden">
          <div className="absolute inset-0 bg-sky-400 rounded-t-lg">
            <svg className="absolute bottom-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320">
              <path
                fill="#ffffff"
                fillOpacity="1"
                d="M0,128L48,112C96,96,192,64,288,64C384,64,480,96,576,128C672,160,768,192,864,181.3C960,171,1056,117,1152,101.3C1248,85,1344,107,1392,117.3L1440,128L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              ></path>
            </svg>
          </div>
          <div className="absolute top-4 left-0 w-full text-center text-white">
            <svg 
              className="inline-block h-6 w-6 mb-1"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
              />
            </svg>
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-sky-700 mb-4 text-center">Access Restricted</h1>
        
        <div className="p-5 mb-6 bg-sky-50 rounded-lg border-l-4 border-sky-500">
          <p className="text-gray-600 mb-3">
            You don't have permission to access this page. This area requires different access privileges.
          </p>
          <p className="text-gray-500 text-sm">
            If you believe this is an error, please contact your system administrator.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between">
          <Link 
            to="/" 
            className="px-4 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors text-center shadow-sm"
          >
            Back to Home
          </Link>
          <Link 
            to="/login" 
            className="px-4 py-3 bg-sky-500 hover:bg-sky-600 text-white rounded-md transition-colors text-center shadow-sm"
          >
            Sign In
          </Link>
        </div>
        
        <div className="mt-8 border-t border-gray-200 pt-4">
          <p className="text-center text-gray-400 text-xs">
            Need assistance? Contact <a href="mailto:support@example.com" className="text-sky-500 hover:underline">support@example.com</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default UnauthorizedPage;