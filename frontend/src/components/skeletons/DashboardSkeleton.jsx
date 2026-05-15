import React from 'react';

const DashboardSkeleton = () => {
  return (
    <div className="w-full h-full p-6 animate-pulse">
      
      {/* Fake Page Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="h-8 bg-slate-200 rounded-lg w-64"></div>
        <div className="h-10 bg-slate-200 rounded-xl w-32"></div>
      </div>

      {/* Fake Stat Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-32 flex flex-col justify-between">
            <div className="h-4 bg-slate-100 rounded w-1/3"></div>
            <div className="h-8 bg-slate-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>

      {/* Fake Main Content Area */}
      <div className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm h-96 flex flex-col gap-4">
        <div className="h-6 bg-slate-200 rounded w-48 mb-4"></div>
        <div className="h-full bg-slate-50 rounded-xl w-full border-2 border-dashed border-slate-100"></div>
      </div>
      
    </div>
  );
};

export default DashboardSkeleton;