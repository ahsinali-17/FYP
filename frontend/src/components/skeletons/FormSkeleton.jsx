import React from 'react';

const FormSkeleton = () => {
  return (
    <div className="w-full h-full p-6 animate-pulse flex flex-col gap-6">
      <div className="h-8 bg-slate-200 rounded-lg w-64 mb-2"></div>
      
      {/* Fake Input Groups */}
      {[1, 2, 3].map((i) => (
        <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <div className="h-4 bg-slate-200 rounded w-32 mb-4"></div>
          <div className="h-12 bg-slate-100 rounded-xl w-full max-w-lg"></div>
        </div>
      ))}
    </div>
  );
};

export default FormSkeleton;