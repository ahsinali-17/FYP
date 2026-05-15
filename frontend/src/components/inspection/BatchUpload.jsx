import React, { useState, useEffect, useCallback } from "react";
import { logNotification } from "../../utils/triggerNotification";
import { Download } from "lucide-react";
import axios from "axios";
import { supabase } from "../../supabase";
import { toast } from "react-toastify";
import InspectionResult from "./InspectionResult";
import BatchNameInput from "./NameInput";
import {
  FileImage,
  X,
  CheckCircle,
  AlertCircle,
  FolderOpen,
} from "lucide-react";
import { useDropzone } from "react-dropzone";
import { useQueryClient } from "@tanstack/react-query";

const BatchUpload = () => {
  const [batchName, setBatchName] = useState("");
  const [currentBatchId, setCurrentBatchId] = useState(null);
  const [files, setFiles] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processStage, setProcessStage] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [results, setResults] = useState([]);
  const [selectedResult, setSelectedResult] = useState(null);
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);
  const [autoRun, setAutoRun] = useState(false);

  const queryClient = useQueryClient();

  useEffect(() => {
    const fetchPref = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from("profiles")
        .select("auto_run_scans")
        .eq("id", user.id)
        .single();
      if (data) setAutoRun(data.auto_run_scans);
    };
    fetchPref();
  }, []);

  const handleDownloadManifest = async () => {
    setIsGeneratingPdf(true);
    try {
      const { generateBatchManifest } = await import("../../utils/generatePDF");
      const { data: realBatchItems, error } = await supabase
        .from("inspections")
        .select("*")
        .eq("batch_id", currentBatchId);
      if (error) throw error;
      if (!realBatchItems || realBatchItems.length === 0) {
        toast.error("No items found for this batch in the database.");
        return;
      }
      await generateBatchManifest(currentBatchId, realBatchItems, batchName);
      await logNotification(
        "batch",
        "Manifest Generated",
        `Batch Manifest generated for Batch #${currentBatchId}.`,
      );
    } catch (error) {
      console.error("PDF Data Fetch Error:", error);
      toast.error("Failed to generate PDF manifest.");
    } finally {
      setIsGeneratingPdf(false);
    }
  };

  const processSelectedFiles = useCallback(
    (selectedFiles) => {
      if (selectedFiles.length === 0) return;

      setFiles((prev) => [...prev, ...selectedFiles]);
      setResults([]);
      setSelectedResult(null);

      if (autoRun) {
        toast.info(`Auto-analyzing ${selectedFiles.length} images...`);
        startBatchProcessing(selectedFiles);
      } else {
        toast.success(
          `Loaded ${selectedFiles.length} images. Ready for review.`,
        );
      }
    },
    [autoRun],
  );

  const onDrop = useCallback(
    (acceptedFiles) => {
      if (acceptedFiles.length === 0) {
        toast.error("No valid images found.");
        return;
      }
      processSelectedFiles(acceptedFiles);
    },
    [processSelectedFiles],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { "image/*": [".jpeg", ".jpg", ".png", ".webp"] },
    disabled: isProcessing,
  });

  const startBatchProcessing = async (filesToProcess = files) => {
    if (filesToProcess.length === 0) return;
    setIsProcessing(true);
    setProcessStage("Initializing Batch");
    setProgress({ current: 1, total: filesToProcess.length });
    const batchResults = [];
    setSelectedResult(null);

    try {
      setProcessStage("Creating Batch");
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("No user found. Please log in.");

      const initResponse = await axios.post(
        `${import.meta.env.VITE_BACKEND_URL}/api/batches/create`,
        {
          user_id: user.id,
          total_images: filesToProcess.length,
          batch_name: batchName.trim() !== "" ? batchName.trim() : null,
        },
      );
      const officialBatchId = initResponse.data.batch_id;
      setCurrentBatchId(officialBatchId);

      const prefix =
        batchName.trim() !== ""
          ? batchName.trim()
          : `Batch-${officialBatchId.slice(0, 8)}`;

      let actualValidCount = 0;

      const imageCompression = (await import('browser-image-compression')).default;
      
      for (let i = 0; i < filesToProcess.length; i++) {
        setProgress({ current: i + 1, total: filesToProcess.length });
        const currentFile = filesToProcess[i];
        const width = Math.max(2, String(filesToProcess.length).length);
        const formattedNumber = String(i + 1).padStart(width, "0");
        const finalDeviceName = `${prefix}-${formattedNumber}`;

        let fileToAnalyze = currentFile;

        setProcessStage("Compressing Image");
        try {
          fileToAnalyze = await imageCompression(currentFile, {
            maxSizeMB: 0.5,
            maxWidthOrHeight: 1920,
            useWebWorker: true,
          });
        } catch (error) {
          console.error("Compression error for file:", currentFile.name, error);
        }

        setProcessStage("Processing Image");
        const formData = new FormData();
        formData.append("file", fileToAnalyze);
        formData.append("user_id", user.id);
        formData.append("batch_id", officialBatchId);
        formData.append("device_name", finalDeviceName);

        try {
          const response = await axios.post(
            `${import.meta.env.VITE_BACKEND_URL}/api/inspections/analyze`,
            formData,
            {
              headers: { "Content-Type": "multipart/form-data" },
            },
          );
          
          batchResults.push({
            fileName: finalDeviceName,
            status: "Success",
            data: response.data,
          });
          
          // 🔥 CRITICAL FIX: Only increment the valid count IF the backend accepted it!
          actualValidCount++; 
          
        } catch (error) {
          // 🔥 UPDATED: Extract the Gemini rejection message from the Axios error object
          const errorMessage = error.response?.data?.error || error.message;
          
          batchResults.push({
            fileName: finalDeviceName,
            status: "Failed",
            error: errorMessage, // Now displays "Upload rejected: No screen detected..." in the UI
          });
        }
      } // <-- End of the for-loop


      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["historyData"] });

      if (actualValidCount !== filesToProcess.length) {
        setProcessStage("Finalizing Batch Data");
        try {
          await supabase
            .from("batches")
            .update({ total_images: actualValidCount })
            .eq("id", officialBatchId)
            .eq("user_id", user.id);
        } catch (dbError) {
          console.error("Failed to reconcile batch count:", dbError);
        }
      }

      await logNotification(
        "batch",
        `Batch #${batchName || officialBatchId.slice(0, 6)} Complete`,
        `Successfully analyzed ${batchResults.filter((r) => r.status === "Success").length} out of ${filesToProcess.length} devices.`,
      );

      setFiles([]);
    } catch (error) {
      console.error("Batch error:", error);
      toast.error("Batch processing failed. Please check your connection.");
    }

    setResults(batchResults);
    setProcessStage("");
    setIsProcessing(false);
    const firstSuccess = batchResults.find((r) => r.status === "Success");
    if (firstSuccess) setSelectedResult(firstSuccess?.data);
  };

  const removeFile = (indexToRemove) => {
    setFiles(files.filter((_, index) => index !== indexToRemove));
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full">
        <div className="mb-6 border-b pb-4 border-gray-100">
          <BatchNameInput
            deviceName={batchName}
            onDeviceNameChange={(e) => setBatchName(e.target.value)}
            label="Batch Name"
            placeholder="e.g., Batch_101 or May_Shipment"
            helperText="Leave blank to auto-generate a unique batch ID."
            disabled={isProcessing}
          />
        </div>

        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Select Files or Folders
        </h2>

        <div className="mb-6">
          <div
            {...getRootProps()}
            className={`border-2 border-dashed rounded-xl p-10 text-center transition-all outline-none
                ${isProcessing ? "opacity-50 cursor-not-allowed border-gray-200 bg-gray-50" : "cursor-pointer"}
                ${isDragActive && !isProcessing ? "border-violet-500 bg-violet-100 scale-[1.02]" : "border-slate-200 hover:border-violet-500 hover:bg-violet-100 bg-gray-50"}
            `}
          >
            <input
              {...getInputProps({ webkitdirectory: "true", directory: "true" })}
            />
            <FolderOpen
              className={`mx-auto h-14 w-14 mb-4 ${isProcessing ? "text-gray-400" : isDragActive ? "text-violet-700" : "text-violet-500"}`}
            />
            <p className="text-gray-700 font-bold mb-1 text-lg">
              {isDragActive
                ? "Drop folders or images here!"
                : "Click to Browse or Drag & Drop"}
            </p>
            <p className="text-sm text-gray-500">
              Automatically extracts JPG, PNG, and WEBP files
            </p>
          </div>
        </div>

        {files.length > 0 &&
          !isProcessing &&
          results.length === 0 &&
          !autoRun && (
            <div className="mb-6 grow">
              <div className="flex justify-between items-center mb-3">
                <h4 className="text-sm font-semibold text-gray-700">
                  Selected Files ({files.length})
                </h4>
                <button
                  onClick={() => setFiles([])}
                  className="text-xs text-red-500 hover:underline font-medium cursor-pointer"
                >
                  Clear All
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-2 pr-2">
                {files.map((file, index) => (
                  <div
                    key={index}
                    className="flex justify-between items-center p-2 bg-gray-50 border border-gray-100 rounded-lg"
                  >
                    <div className="flex items-center space-x-3 overflow-hidden">
                      {URL.createObjectURL(file) ? (
                        <img
                          src={URL.createObjectURL(file)}
                          className="h-10 w-10 border-2 border-violet-500 shrink-0 rounded-lg object-cover"
                        />
                      ) : (
                        <FileImage className="h-5 w-5 text-violet-500 shrink-0" />
                      )}
                      <span className="text-sm text-gray-700 truncate">
                        {file.name}
                      </span>
                    </div>
                    <button
                      onClick={() => removeFile(index)}
                      className="cursor-pointer p-1 text-gray-400 hover:text-red-500 hover:bg-red-100 rounded-md transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <button
                onClick={() => startBatchProcessing()}
                className="w-full py-3 px-4 rounded-lg font-medium text-white transition-colors shadow-sm bg-violet-700 hover:bg-violet-800 cursor-pointer"
              >
                Analyze {files.length} Images
              </button>
            </div>
          )}

        {!isProcessing && results.length > 0 && (
          <div className="mb-6 grow border-t pt-4 border-gray-100">
            <div className="flex justify-between items-center mb-3">
              <h4 className="text-sm font-semibold text-gray-900 mb-3">
                Batch Summary (Click to view)
              </h4>
              <button
                onClick={() => {
                  setResults([]);
                  setSelectedResult(null);
                  setBatchName("");
                  setFiles([]);
                }}
                className="text-xs text-red-500 hover:underline font-medium cursor-pointer"
              >
                Clear All
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
              {results.map((res, index) => (
                <div
                  key={index}
                  onClick={() => {
                    if (res.status === "Success") setSelectedResult(res.data);
                  }}
                  className={`flex justify-between items-center p-3 border rounded-lg transition-colors ${res.status === "Success" ? "cursor-pointer hover:bg-violet-100" : "opacity-75"} ${selectedResult === res.data ? "border-2 border-violet-500 bg-violet-100" : "border-gray-200 bg-white"}`}
                >
                  <span className="font-medium text-sm text-gray-700 truncate w-1/2">
                    {res.fileName}
                  </span>
                  {res.status === "Success" ? (
                    <div className="flex items-center">
                      {res.data.color === "red" ? (
                        <AlertCircle className="w-4 h-4 text-red-500 mr-1" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-emerald-600 mr-1" />
                      )}
                      <span
                        className={`text-sm font-bold ${res.data.color === "red" ? "text-red-600" : "text-emerald-600"}`}
                      >
                        {res.data.status}
                      </span>
                    </div>
                  ) : (
                    <div className="flex items-center text-red-500">
                       <span className="text-sm font-bold">{res.error}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-auto">
          {isProcessing && (
            <div className="mb-4 p-4 bg-violet-100 rounded-lg border border-violet-100">
              <div className="flex justify-between text-sm text-violet-900 font-medium mb-2">
                <span>
                  {processStage}{" "}
                  {processStage.toLowerCase().includes("image")
                    ? `${progress.current} of ${progress.total}`
                    : ""}
                </span>
                <span>
                  {Math.round(((progress.current -1)/ progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-violet-200 rounded-full h-2.5">
                <div
                  className="bg-violet-700 h-2.5 rounded-full transition-all duration-300"
                  style={{
                    width: `${((progress.current -1)/ progress.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>
          )}

          {results.length > 0 && !isProcessing && (
            <button
              onClick={handleDownloadManifest}
              disabled={isGeneratingPdf}
              className="w-full px-6 py-3 bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed cursor-pointer"
            >
              <Download size={18} />
              {isGeneratingPdf ? "Generating..." : "Download Batch Manifest"}
            </button>
          )}
        </div>
      </div>

      <div className="h-full lg:flex w-full animate-in slide-in-from-bottom-5 fade-in duration-500">
        {selectedResult || isProcessing ? (
          <InspectionResult
            result={selectedResult}
            isAnalyzing={isProcessing}
          />
        ) : (
          <div className="h-full w-full min-h-125 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
            <div className="text-center">
              <FolderOpen className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">
                Results will appear here
              </p>
              <p className="text-sm text-gray-400 mt-1">
                Run a batch or select an image from the list
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BatchUpload;