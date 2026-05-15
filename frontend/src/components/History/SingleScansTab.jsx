import React, { useState } from "react";
import { supabase } from "../../supabase";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { toast } from "react-toastify";
import axios from "axios";
import { logNotification } from "../../utils/triggerNotification";
import ViewModal from "./ViewModal";
import InspectionRow from "./InspectionRow";
import ConfirmModal from "../ConfirmModal";
import { TabHeader, HistoryToolbar, PaginationFooter } from "./HistorySharedUI";

const ITEMS_PER_PAGE = 10;

const SingleScansTab = ({
  filter,
  searchTerm,
  debouncedSearchTerm,
  page,
  setPage,
  selectedIds,
  setSelectedIds,
  processingState,
  setProcessingState,
  isAnyProcessing,
  deleteModalData,
  setDeleteModalData,
  handleFilterChange,
  handleSearchChange,
  handleTabChange,
  handleDownload,
}) => {
  const queryClient = useQueryClient();
  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const [viewModalData, setViewModalData] = useState(null);

  const { data, isFetching } = useQuery({
    queryKey: ["historyData", "single", page, filter, debouncedSearchTerm],
    placeholderData: (previousData) => previousData,
    keepPreviousData: true,
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      const from = (page - 1) * ITEMS_PER_PAGE;
      const to = from + ITEMS_PER_PAGE - 1;
      
      let query = supabase
        .from("inspections")
        .select("*", { count: "exact" })
        .eq("user_id", user.id)
        .is("batch_id", null)
        .order("created_at", { ascending: false });

      // apply selected filter
      if (filter === "Defect") query = query.ilike("prediction", "%defect%");
      if (filter === "Clean") query = query.not("prediction", "ilike", "%defect%");
      if (filter === "Live") query = query.eq("is_live_scan", true);

      if (debouncedSearchTerm) {
        const isNum = /^\d+$/.test(debouncedSearchTerm);
        if (isNum)
          query = query.or(`id.eq.${debouncedSearchTerm},device_name.ilike.%${debouncedSearchTerm}%`);
        else 
          query = query.ilike("device_name", `%${debouncedSearchTerm}%`);
      }

      const { data, count, error } = await query.range(from, to);
      if (error) throw error;

      const { data: profile } = await supabase
        .from("profiles")
        .select("confidence_threshold")
        .eq("id", user.id)
        .single();

      return {
        items: data || [],
        count: count || 0,
        userThreshold: profile?.confidence_threshold || 80,
      };
    },
  });

  const visibleItems = data?.items || [];
  const totalPages = Math.max(
    1,
    Math.ceil((data?.count || 0) / ITEMS_PER_PAGE),
  );
  const userThreshold = data?.userThreshold || 80;

  const visibleIds = visibleItems.map((i) => i.id);
  const isAllSelected =
    visibleIds.length > 0 && visibleIds.every((id) => selectedIds.includes(id));
  const isMultiSelected = selectedIds.length > 1;

  const handleSelectAll = () =>
    isAllSelected ? setSelectedIds([]) : setSelectedIds(visibleIds);
  const handleSelect = (id) =>
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id],
    );

  const promptDelete = () => {
    const targetIds = selectedIds.length > 0 ? selectedIds : visibleIds;
    if (targetIds.length === 0) return toast.info("No items to delete.");
    setDeleteModalData({
      ids: targetIds,
      type: "single",
      isClearAll: selectedIds.length === 0,
    });
  };

  const executeDelete = async () => {
    if (!deleteModalData) return;
    const { ids, type } = deleteModalData;
    setProcessingState({ id: "bulk", action: "delete" });

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      await axios.delete(`${backendUrl}/api/inspections/history/delete`, {
        data: { user_id: user.id, type, ids },
      });

      queryClient.invalidateQueries({ queryKey: ["historyData"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });

      setSelectedIds([]);
      if (visibleIds.length === ids.length && page > 1) setPage(page - 1);
      toast.success(`Successfully deleted ${ids.length} item(s).`);
    } catch (error) {
      toast.error("Failed to perform deletion.");
    } finally {
      setProcessingState({ id: null, action: null });
      setDeleteModalData(null);
    }
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <TabHeader
        activeTab="single"
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
        isSingleTab={true}
      />

      <div className="bg-white rounded-t-2xl shadow-sm border border-slate-100 overflow-hidden relative">
        <div className="h-[70vh] overflow-y-auto relative custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-200">
            <thead className="sticky top-0 z-10 bg-slate-50 text-slate-500 text-xs uppercase font-semibold border-b border-slate-200 shadow-sm">
              <tr>
                <th className="p-4 w-12 text-center bg-slate-50">
                  <input
                    type="checkbox"
                    aria-label="Select all visible items"
                    checked={isAllSelected}
                    onChange={handleSelectAll}
                    disabled={visibleItems.length === 0 || isAnyProcessing}
                    className="w-4 h-4 text-violet-600 bg-white border-slate-300 rounded cursor-pointer disabled:opacity-50"
                  />
                </th>
                <th className="p-4 w-16 bg-slate-50"></th>
                <th className="p-4 bg-slate-50">Device Info</th>
                <th className="p-4 bg-slate-50">Date</th>
                <th className="p-4 bg-slate-50">Verdict</th>
                <th className="p-4 bg-slate-50">Confidence</th>
                <th className="p-4 text-right bg-slate-50">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {visibleItems.length === 0 && !isFetching ? (
                <tr>
                  <td
                    colSpan="7"
                    className="p-10 text-center text-slate-400 font-medium"
                  >
                    No records found.
                  </td>
                </tr>
              ) : isFetching ? (
                <tr>
                  <td colSpan="7" className="p-10 text-center">
                    <div className="absolute inset-0 flex items-center justify-center bg-white/50 backdrop-blur-sm z-10">
                      <Loader2
                        className="animate-spin text-violet-700"
                        size={32}
                      />
                    </div>
                  </td>
                </tr>
              ) : (
                visibleItems.map((item) => (
                  <InspectionRow
                    key={item.id}
                    item={item}
                    isSelected={selectedIds.includes(item.id)}
                    onSelect={() => handleSelect(item.id)}
                    isMultiSelected={isMultiSelected}
                    onView={() => setViewModalData(item)}
                    onDownload={() => handleDownload(item)}
                    isDownloading={
                      processingState.id === item.id &&
                      processingState.action === "download"
                    }
                    isDisabled={isAnyProcessing}
                  />
                ))
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

export default SingleScansTab;
