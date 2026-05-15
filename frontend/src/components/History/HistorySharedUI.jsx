import React from "react";
import { Search, Loader2, Trash2 } from "lucide-react";

export const TabHeader = ({ activeTab, onTabChange, onPromptDelete, isDeleteDisabled, isProcessing, selectedCount }) => (
  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-200 pb-3 gap-4">
    <div className="flex space-x-4">
      <button
        onClick={() => onTabChange("single")}
        className={`cursor-pointer pb-2 px-2 text-sm font-bold transition-all ${activeTab === "single" ? "text-violet-700 border-b-2 border-violet-700" : "text-slate-400 hover:text-slate-600"}`}
      >
        Single Scans
      </button>
      <button
        onClick={() => onTabChange("batch")}
        className={`cursor-pointer pb-2 px-2 text-sm font-bold transition-all ${activeTab === "batch" ? "text-violet-700 border-b-2 border-violet-700" : "text-slate-400 hover:text-slate-600"}`}
      >
        Batch Scans
      </button>
    </div>

    <button
      onClick={onPromptDelete}
      disabled={isDeleteDisabled}
      className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
      ${selectedCount > 0 ? "bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-500/20" : "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"}`}
    >
      {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
      {selectedCount > 0 ? `Delete ${selectedCount} Selected` : `Delete All Visible`}
    </button>
  </div>
);

export const HistoryToolbar = ({ searchTerm, onSearchChange, filter, onFilterChange, isSingleTab }) => {
  // conditionally include 'Live' only for single scans
  const filters = isSingleTab ? ["All", "Defect", "Clean", "Live"] : ["All", "Defect", "Clean"];

  return (
    <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-slate-100">
      <div className="relative w-full md:w-96">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
        <input
          type="text"
          placeholder={isSingleTab ? "Search by ID or Device Name..." : "Search Batch ID..."}
          value={searchTerm}
          onChange={onSearchChange}
          className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-violet-500 text-sm"
        />
      </div>

      <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
        {filters.map((f) => (
          <button
            key={f}
            onClick={() => onFilterChange(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all cursor-pointer whitespace-nowrap flex-1 md:flex-none text-center ${
              filter === f
                ? "bg-slate-800 text-white shadow-md"
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>
    </div>
  );
};

export const PaginationFooter = ({ page, setPage, totalPages, totalCount, isFetching }) => {
  const getPageNumbers = () => {
    const pages = [];
    if (totalPages <= 3) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      let start = Math.max(1, page - 1);
      let end = Math.min(totalPages, page + 1);

      if (page === 1) end = 3;
      if (page === totalPages) start = totalPages - 2;

      for (let i = start; i <= end; i++) pages.push(i);
    }
    return pages;
  };

  return (
    <div className="flex items-center justify-between px-4 py-2.5 bg-white border border-t-0 border-slate-100 rounded-b-2xl shadow-sm">
      <span className="text-xs text-slate-600 font-medium hidden sm:block">
        Showing Page {page} of {totalPages} <span className="text-slate-400 ml-1">({totalCount || 0} Total Items)</span>
      </span>

      <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
        <button
          onClick={() => setPage((p) => Math.max(1, p - 1))}
          disabled={page === 1 || isFetching}
          className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Prev
        </button>

        <div className="flex gap-1">
          {getPageNumbers().map((num) => (
            <button
              key={num}
              onClick={() => setPage(num)}
              disabled={isFetching}
              className={`w-8 h-8 flex items-center justify-center text-xs font-bold rounded-md transition-colors cursor-pointer disabled:opacity-50
                ${page === num ? "bg-violet-700 text-white shadow-sm" : "text-slate-600 hover:bg-slate-100 bg-transparent"}
              `}
            >
              {num}
            </button>
          ))}
        </div>

        <button
          onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          disabled={page >= totalPages || isFetching}
          className="px-3 py-1.5 text-xs font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
        >
          Next
        </button>
      </div>
    </div>
  );
};