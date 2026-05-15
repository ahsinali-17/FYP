import React, { useState, useEffect } from "react";
import MetaData from "../components/MetaData";
import SingleScansTab from "../components/History/SingleScansTab";
import BatchScansTab from "../components/History/BatchScansTab";
import { logNotification } from "../utils/triggerNotification";
import {useDebounce} from "../hooks/useDebounce";
import { toast } from "react-toastify";

const History = () => {
  const [activeTab, setActiveTab] = useState("single");
  const [filter, setFilter] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  
  const [selectedIds, setSelectedIds] = useState([]);
  const [processingState, setProcessingState] = useState({ id: null, action: null });
  const [deleteModalData, setDeleteModalData] = useState(null);

   const isAnyProcessing = processingState.id !== null;
   const debouncedSearchTerm = useDebounce(searchTerm, 500);

  // Automatically clear selections
  useEffect(() => {
    setSelectedIds([]);
    setPage(1);
  }, [debouncedSearchTerm]);

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setFilter("All");
    setSearchTerm("");
    setSelectedIds([]);
    setPage(1);
  };

  const handleFilterChange = (f) => { 
    setFilter(f); 
    setPage(1); 
    setSelectedIds([]);
  };

  const handleSearchChange = (e) => { 
    setSearchTerm(e.target.value); 
  };

   const handleDownload = async (item) => {
      if (isAnyProcessing) return;
      setProcessingState({ id: item.id, action: "download" });
      try {
        const { generateSingleReport } = await import("../utils/generatePDF");
        await generateSingleReport(item);
        await logNotification("scan", "Report Generated", `Report generated for Asset: ${item.device_name || "Unknown Device"}`);
      } catch (error) {
        console.log(error)
        toast.error("Failed to generate report.");
      } finally {
        setProcessingState({ id: null, action: null });
      }
    };

  const sharedState = {
    filter, searchTerm, debouncedSearchTerm, page, setPage,
    selectedIds, setSelectedIds,
    processingState, setProcessingState,
    deleteModalData, setDeleteModalData, isAnyProcessing,
    handleFilterChange, handleSearchChange, handleTabChange, handleDownload
  };

  return (
    <>
      <MetaData
        title="History"
        description="Review past AI inspections, download reports, and manage your scan history."
      />
      <div>
        {activeTab === "single" ? (
          <SingleScansTab {...sharedState} />
        ) : (
          <BatchScansTab {...sharedState} />
        )}
      </div>
    </>
  );
};

export default History;