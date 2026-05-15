import React from 'react';
import { Link } from 'react-router-dom';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import MetaData from '../components/MetaData';

const NotFound = () => {
  return (
    <>
      <MetaData 
        title="Page Not Found" 
        description="The page you are looking for doesn't exist." 
      />
    
    <div className="flex flex-col items-center justify-center h-screen w-full bg-slate-50 px-6 text-center">
      <div className="w-20 h-20 bg-violet-100 rounded-full flex items-center justify-center mb-6">
        <AlertCircle className="w-10 h-10 text-violet-700" />
      </div>
      <h1 className="text-4xl font-bold text-slate-900 mb-2">404 - Page Not Found</h1>
      <p className="text-slate-500 max-w-md mb-8">
        The page you are looking for doesn't exist or has been moved to a new URL.
      </p>
      <Link 
        to="/dashboard" 
        className="flex items-center gap-2 px-6 py-3 bg-violet-700 hover:bg-violet-800 text-white rounded-xl font-medium transition-colors shadow-sm"
      >
        <ArrowLeft size={18} />
        Back to Dashboard
      </Link>
    </div>
    </>
  );
};

export default NotFound;
