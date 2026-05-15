import React from 'react';

const TableSkeleton = () => {
  return (
    <div className="w-full h-full p-6 animate-pulse">
      <div className="h-8 bg-slate-200 rounded-lg w-64 mb-8"></div>
      
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Fake Table Header */}
        <div className="h-12 bg-slate-50 border-b border-slate-100 w-full"></div>
        {/* Fake Table Rows */}
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="flex items-center p-4 border-b border-slate-50">
            <div className="h-4 bg-slate-200 rounded w-1/4 mr-4"></div>
            <div className="h-4 bg-slate-100 rounded w-1/4 mr-4"></div>
            <div className="h-4 bg-slate-100 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TableSkeleton;