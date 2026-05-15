import React, { useState, useEffect } from "react";
import { supabase } from "../../supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Loader2,
  Calendar,
  Folder,
  ChevronDown,
  ChevronRight,
  Download,
} from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { logNotification } from "../../utils/triggerNotification";
import ViewModal from "./ViewModal";
import InspectionRow from "./InspectionRow";
import ConfirmModal from "../ConfirmModal";
import { TabHeader, HistoryToolbar, PaginationFooter } from "./HistorySharedUI";

const ITEMS_PER_PAGE = 5;

const BatchScansTab = ({
  filter,
  searchTerm,
  debouncedSearchTerm,
  page,
  setPage,
  selectedIds,
  setSelectedIds,
  processingState,
  setProcessingState,
  deleteModalData,
  setDeleteModalData,
  handleFilterChange,
  handleSearchChange,
  handleTabChange,
}) => {
  const queryClient = useQueryClient();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;

  const [expandedBatchId, setExpandedBatchId] = useState(null);
  const [viewModalData, setViewModalData] = useState(null);

  const isAnyProcessing = processingState.id !== null;

  // Clear inner selections when expanding a new batch
  useEffect(() => {
    setSelectedIds([]);
  }, [expandedBatchId, setSelectedIds]);

  // outer batch query
  const { data, isFetching } = useQuery({
    queryKey: ["historyData", "batch", page, filter, debouncedSearchTerm],
    placeholderData: (previousData) => previousData,
    keepPreviousData: true,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;

      let query = supabase
        .from("batches")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // search filter
      if (debouncedSearchTerm) {
        if (debouncedSearchTerm.length === 36) {
          query = query.or(`batch_name.ilike.%${debouncedSearchTerm}%,id.eq.${debouncedSearchTerm}`);
        } else {
          query = query.ilike('batch_name', `%${debouncedSearchTerm}%`);
        }
      }

      // defect filters
      if (filter !== "All") {
        let innerQuery = supabase.from("inspections").select("batch_id").eq("user_id", user.id).not("batch_id", "is", null);
        
        if (filter === "Defect") innerQuery = innerQuery.ilike("prediction", "%defect%");
        if (filter === "Clean") innerQuery = innerQuery.not("prediction", "ilike", "%defect%");

        const { data: matchingInnerItems } = await innerQuery.limit(1000);
        const matchingBatchIds = matchingInnerItems ? [...new Set(matchingInnerItems.map((i) => i.batch_id))] : [];

        if (matchingBatchIds.length > 0) {
            query = query.in("id", matchingBatchIds);
        } else {
            query = query.eq("id", "00000000-0000-0000-0000-000000000000"); // Force empty result
        }
      }

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;

      const { data: profile } = await supabase.from("profiles").select("confidence_threshold").eq("id", user.id).single();
      return {
        items: data || [],
        count: count || 0,
        userThreshold: profile?.confidence_threshold || 80,
      };
    },
  });

  // expended batch query
  const { data: expandedItems = [], isFetching: loadingExpanded } = useQuery({
    queryKey: ["expandedBatch", expandedBatchId, filter],
    enabled: !!expandedBatchId,
    keepPreviousData: true,
    queryFn: async () => {
      let query = supabase
        .from("inspections")
        .select("*")
        .eq("batch_id", expandedBatchId)
        .order("created_at", { ascending: false });
      
      if (filter === "Defect") query = query.ilike("prediction", "%defect%");
      if (filter === "Clean") query = query.not("prediction", "ilike", "%defect%");
      
      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    },
  });

  const visibleItems = data?.items || [];
  const totalPages = Math.max(1, Math.ceil((data?.count || 0) / ITEMS_PER_PAGE));
  const userThreshold = data?.userThreshold || 80;

  const selectableIds = expandedBatchId ? expandedItems.map((i) => i.id) : visibleItems.map((b) => b.id);
  const isAllSelected = selectableIds.length > 0 && selectableIds.every((id) => selectedIds.includes(id));
  const isMultiSelected = selectedIds.length > 1;

  const handleSelectAll = () => isAllSelected ? setSelectedIds([]) : setSelectedIds(selectableIds);
  const handleGenericSelect = (id) => setSelectedIds((prev) => prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]);

  const handleOuterBatchSelect = (batchId) => {
    if (expandedBatchId && expandedBatchId !== batchId) {
      setExpandedBatchId(null);
      setSelectedIds([batchId]);
    } else handleGenericSelect(batchId);
  };

  const promptDelete = () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : selectableIds;
    if (targetIds.length === 0) return toast.info("No items to delete.");
    setDeleteModalData({
      ids: targetIds,
      type: !expandedBatchId ? "batch" : "single",
      isClearAll: selectedIds.length === 0,
    });
  };

  const executeDelete = async () => {
    if (!deleteModalData) return;
    const { ids, type } = deleteModalData;
    setProcessingState({ id: "bulk", action: "delete" });

    try {
      const { data: { user } } = await supabase.auth.getUser();
      await axios.delete(`${backendUrl}/api/inspections/history/delete`, {
        data: { user_id: user.id, type, ids },
      });

      queryClient.invalidateQueries({ queryKey: ["historyData"] });
      queryClient.invalidateQueries({ queryKey: ["expandedBatch"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });

      setSelectedIds([]);
      if (type === "batch" && ids.includes(expandedBatchId)) setExpandedBatchId(null);
      if (type === "single" && expandedBatchId) {
        const remainingInnerItems = expandedItems.filter((item) => !ids.includes(item.id));
        if (remainingInnerItems.length === 0) setExpandedBatchId(null);
      }
      if (selectableIds.length === ids.length && page > 1 && !expandedBatchId) setPage(page - 1);

      toast.success(`Successfully deleted ${ids.length} item(s).`);
    } catch (error) {
      toast.error("Failed to perform deletion.");
    } finally {
      setProcessingState({ id: null, action: null });
      setDeleteModalData(null);
    }
  };

  const handleDownloadBatchReport = async (batchId) => {
    if (isAnyProcessing) return;
    setProcessingState({ id: batchId, action: "download_batch" });
    try {
      let itemsForManifest = expandedBatchId === batchId && expandedItems.length > 0
          ? expandedItems
          : (await supabase.from("inspections").select("*").eq("batch_id", batchId)).data || [];

      const { generateBatchManifest } = await import("../../utils/generatePDF");
      await generateBatchManifest(batchId, itemsForManifest);
      await logNotification("batch", "Manifest Generated", `Batch Manifest generated for Batch #${batchId}`);
    } catch (error) {
      toast.error("Failed to generate batch manifest.");
    } finally {
      setProcessingState({ id: null, action: null });
    }
  };

  const handleDownload = async (item) => {
    if (isAnyProcessing) return;
    setProcessingState({ id: item.id, action: "download" });
    try {
      const { generateSingleReport } = await import("../../utils/generatePDF");
      await generateSingleReport(item);
      await logNotification("scan", "Report Generated", `Report generated for Asset: ${item.device_name}`);
    } catch (error) {
      toast.error("Failed to generate report.");
    } finally {
      setProcessingState({ id: null, action: null });
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <TabHeader
        activeTab="batch"
        onTabChange={handleTabChange}
        onPromptDelete={promptDelete}
        isDeleteDisabled={visibleItems.length === 0 || isAnyProcessing}
        isProcessing={processingState.id === "bulk"}
        selectedCount={selectedIds.length}
      />
      <HistoryToolbar
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filter={filter}
        onFilterChange={handleFilterChange}
        isSingleTab={false}
      />

      <div className="bg-white rounded-t-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="h-[70vh] overflow-y-auto relative custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-200">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200 shadow-sm">
              <tr>
                <th className="p-4 w-12 text-center bg-slate-50">
                  {!expandedBatchId && (
                    <input
                      type="checkbox"
                      aria-label="Select all visible items"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      disabled={visibleItems.length === 0 || isAnyProcessing}
                      className="w-4 h-4 text-violet-600 bg-white border-slate-300 rounded cursor-pointer disabled:opacity-50"
                    />
                  )}
                </th>
                <th className="p-4 w-16 bg-slate-50"></th>
                <th className="p-4 bg-slate-50">Batch Info</th>
                <th className="p-4 bg-slate-50">Date</th>
                <th className="p-4 bg-slate-50">Total Items</th>
                <th className="p-4 text-right bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleItems.length === 0 && !isFetching ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center text-slate-400 font-medium">
                    No records found.
                  </td>
                </tr>
              ) : isFetching ? (
                <tr>
                  <td colSpan="6" className="p-10 text-center">
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                      <Loader2 className="animate-spin text-violet-700" size={32} />
                    </div>
                  </td>
                </tr>
              ) : (
                visibleItems.map((batch) => {
                  const isExpanded = expandedBatchId === batch.id;
                  const batchItems = isExpanded ? expandedItems : [];
                  return (
                    <React.Fragment key={`batch-${batch.id}`}>
                      <tr
                        onClick={() => {
                          setSelectedIds([]);
                          setExpandedBatchId(isExpanded ? null : batch.id);
                        }}
                        className={`cursor-pointer hover:bg-violet-50 transition-colors group ${selectedIds.includes(batch.id) ? "bg-violet-50/50" : ""}`}
                      >
                        <td className="p-4 text-center" onClick={(e) => e.stopPropagation()}>
                          {!isExpanded ? (
                            <input
                              type="checkbox"
                              aria-label={`Select batch ${batch.batch_name || batch.id}`}
                              checked={selectedIds.includes(batch.id)}
                              onChange={() => handleOuterBatchSelect(batch.id)}
                              disabled={isAnyProcessing}
                              className="w-4 h-4 text-violet-600 bg-white border-slate-300 rounded cursor-pointer disabled:opacity-50"
                            />
                          ) : (
                            <input
                              type="checkbox"
                              aria-label="Select all visible batch items"
                              checked={isAllSelected}
                              onChange={handleSelectAll}
                              disabled={isAnyProcessing || batchItems.length === 0}
                              className="w-4 h-4 text-violet-600 bg-white border-slate-300 rounded cursor-pointer disabled:opacity-50"
                            />
                          )}
                        </td>
                        <td className="p-4 text-center cursor-pointer">
                          {isExpanded ? (
                            <ChevronDown className="text-violet-500 inline" size={20} />
                          ) : (
                            <ChevronRight className="text-slate-400 group-hover:text-violet-500 inline" size={20} />
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-violet-100 rounded-lg text-violet-700">
                              <Folder size={20} />
                            </div>
                            <div>
                              <p className="font-bold text-slate-700">
                                Batch: {batch.id}
                              </p>
                              <p className="text-xs text-slate-400">{batch?.batch_name || "Contains multiple devices"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="p-4 text-sm text-slate-600">
                          <div className="flex items-center gap-2">
                            <Calendar size={14} className="text-slate-400" />
                            {new Date(batch.created_at).toLocaleDateString()}
                          </div>
                        </td>
                        <td className="p-4 text-sm font-bold text-slate-700">
                          {batch.total_images} Devices
                        </td>
                        <td className="cursor-pointer p-4 text-right" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={async () => await handleDownloadBatchReport(batch.id)}
                            disabled={isAnyProcessing || isMultiSelected}
                            className="p-2 text-slate-400 hover:text-violet-700 hover:bg-violet-100 rounded-lg cursor-pointer"
                          >
                            {processingState.id === batch.id && processingState.action === "download_batch" ? (
                              <Loader2 size={18} className="animate-spin" />
                            ) : (
                              <Download size={18} />
                            )}
                          </button>
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50 border-b-2 border-violet-100">
                          <td colSpan="6" className="p-0">
                            <div className="pl-16 pr-4 py-4">
                              <table className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
                                <tbody className="divide-y divide-slate-100">
                                  {loadingExpanded ? (
                                    <tr>
                                      <td className="p-4 text-center text-sm text-slate-400">
                                        <Loader2 className="animate-spin inline mr-2 text-violet-500" size={16} /> Loading items...
                                      </td>
                                    </tr>
                                  ) : batchItems.length === 0 ? (
                                    <tr>
                                      <td className="p-4 text-center text-sm text-slate-400">
                                        No items match current filters.
                                      </td>
                                    </tr>
                                  ) : (
                                    batchItems.map((item) => (
                                      <InspectionRow
                                        key={item.id}
                                        item={item}
                                        isSelected={selectedIds.includes(item.id)}
                                        onSelect={() => handleGenericSelect(item.id)}
                                        isMultiSelected={isMultiSelected}
                                        onView={() => setViewModalData(item)}
                                        onDownload={() => handleDownload(item)}
                                        isDownloading={processingState.id === item.id && processingState.action === "download"}
                                        isDisabled={isAnyProcessing}
                                        isChild={false}
                                      />
                                    ))
                                  )}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      <PaginationFooter
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        totalCount={data?.count}
        isFetching={isFetching}
      />
      <ViewModal
        viewModalData={viewModalData}
        setViewModalData={setViewModalData}
        threshold={userThreshold}
      />
      <ConfirmModal
        isOpen={!!deleteModalData}
        onClose={() => setDeleteModalData(null)}
        onConfirm={executeDelete}
        title={
          deleteModalData?.isClearAll
            ? "Delete All Visible Records"
            : `Delete ${deleteModalData?.ids.length} Selected Item(s)`
        }
        message="Are you sure you want to permanently delete? This action cannot be undone."
        confirmText="Yes, Delete Permanently"
        isDestructive={true}
      />
    </div>
  );
};

export default BatchScansTab;