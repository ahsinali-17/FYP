import React, { useState, useEffect, Suspense } from "react";
import { supabase } from "../supabase";
import InspectionUpload from "../components/inspection/InspectionUpload";
import InspectionResult from "../components/inspection/InspectionResult";
import { toast } from "react-toastify";
import { FileImage, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import MetaData from "../components/MetaData";

// lazy loading
const BatchUpload = React.lazy(() => import("../components/inspection/BatchUpload"));
const LiveScanUpload = React.lazy(() => import("../components/inspection/LiveScanUpload"));

const Inspection = () => {
  const [image, setImage] = useState(null);
  const [imageBlob, setImageBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false); 
  const [result, setResult] = useState(null);
  
  const [activeTab, setActiveTab] = useState("single");
  const [user, setUser] = useState(null);
  const [deviceName, setDeviceName] = useState("");
  const [autoRun, setAutoRun] = useState(false);
  const [con_threshold, setcon_threshold] = useState(80);

  const queryClient = useQueryClient();

  useEffect(() => {
    const getUserAndPrefs = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        const { data } = await supabase.from("profiles").select("auto_run_scans, confidence_threshold").eq("id", user.id).single();
        if (data) {
          setAutoRun(data.auto_run_scans);
          setcon_threshold(data.confidence_threshold);
        }
      }
    };
    getUserAndPrefs();

    supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user || null);
    });
  }, []);

 const performAnalysis = async (fileToAnalyze, nameToUse, isLive = false) => {
    setIsProcessing(true);
    try {
      const formData = new FormData();
      formData.append("file", fileToAnalyze);
      formData.append("is_live_scan", isLive);

      if (user) formData.append("user_id", user.id);

      let finalDeviceName = nameToUse.trim();
      if (finalDeviceName === "") {
        const date = new Date();
        const timeString = date
          .toISOString()
          .replace(/[-:T]/g, "")
          .slice(0, 14);
        finalDeviceName = `Device-${timeString}`;
      }
      formData.append("device_name", finalDeviceName || "Unknown Device");

      const response = await fetch(
        `${import.meta.env.VITE_BACKEND_URL}/api/inspections/analyze`,
        { method: "POST", body: formData },
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Analysis failed due to server error.");
      }

      queryClient.invalidateQueries({ queryKey: ["dashboardData"] });
      queryClient.invalidateQueries({ queryKey: ["historyData"] });

      const data = await response.json();
      setResult(data);
      toast.success("Analysis Complete!");
    } catch (error) {
      console.error("Error:", error);
      if(error.message.includes("No screen detected")) {
        toast.error(error.message);
        handleClear(); 
      } else {
        toast.error("Server Error: " + error.message);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImage(URL.createObjectURL(file));
    setIsCompressing(true); 
    setResult(null);

    try {
      const imageCompression = (await import('browser-image-compression')).default;
      const compressedFile = await imageCompression(file, {
        maxSizeMB: 0.5,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      });

      setIsCompressing(false);
      setImageBlob(compressedFile);

      if (autoRun && activeTab !== 'live') {
        await performAnalysis(compressedFile, deviceName.trim(), activeTab === 'live');
      }
      
    } catch (error) {
      console.error("Pipeline error:", error);
      setIsCompressing(false);
      setImageBlob(file);
      
      if (autoRun && activeTab !== 'live') {
        await performAnalysis(file, deviceName.trim(), activeTab === 'live');
      }
    } 
  };

  const handleDeviceNameChange = (e) => {
    setDeviceName(e.target.value);
    if (autoRun && imageBlob && !isCompressing && activeTab !== 'live') {
      performAnalysis(imageBlob, e.target.value, activeTab === 'live');
    }
  };

  const handleAnalyzeClick = () => {
    if(activeTab === 'live' && !deviceName.trim()) {
      return toast.error("Please enter a device name before analyzing.");
    } else if (!imageBlob && isCompressing) return toast.error("Please wait for image optimization to finish.");
    else if (!imageBlob) return toast.error("No image to analyze.");
    performAnalysis(imageBlob, deviceName, activeTab === 'live');
  };

  const handleLiveCapture = async (blob) => {
    setImageBlob(blob);
    setResult(null);
  };

  const handleClear = () => {
    setImage(null);
    setImageBlob(null);
    setResult(null);
    setDeviceName("");
    setIsCompressing(false);
    setIsProcessing(false);
  };

  const handleTabSwitch = (tab) => {
    setActiveTab(tab);
    handleClear();
  }

  return (
    <>
      <MetaData
        title="Inspection"
        description="Run AI-powered inspections on your devices."
      />
      <div className="space-y-8 max-w-7xl mx-auto">
        
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => handleTabSwitch("single")}
            className={`px-4 py-2 rounded ${activeTab === "single" ? "bg-violet-700 text-white" : "bg-gray-200"} cursor-pointer`}
          >
            Single Scan
          </button>
          <button
            onClick={() => handleTabSwitch("batch")}
            className={`px-4 py-2 rounded ${activeTab === "batch" ? "bg-violet-700 text-white" : "bg-gray-200"} cursor-pointer`}
          >
            Batch Scan
          </button>
          <button
            onClick={() => handleTabSwitch("live")}
            className={`px-4 py-2 rounded ${activeTab === "live" ? "bg-violet-700 text-white" : "bg-emerald-100 text-emerald-700 border-emerald-200"} cursor-pointer font-medium`}
          >
            Live Scan
          </button>
        </div>

        <Suspense fallback={<div className="flex justify-center p-8"><Loader2 className="animate-spin text-violet-700" size={32} /></div>}>
          {activeTab === "batch" ? (
            <BatchUpload userId={user?.id} />
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8 items-start lg:items-stretch">
                <div className="w-full space-y-6">
                  
                  {activeTab === "single" && (
                    <InspectionUpload
                      image={image}
                      imageBlob={imageBlob}
                      loading={isProcessing}
                      isCompressing={isCompressing}
                      hasResult={!!result}
                      autoRun={autoRun}
                      onFileChange={handleFileChange}
                      onAnalyze={handleAnalyzeClick}
                      onClear={handleClear}
                      deviceName={deviceName}
                      onDeviceNameChange={handleDeviceNameChange}
                    />
                  )}

                  {activeTab === "live" && (
                    <LiveScanUpload 
                      image={image}
                      setImage={setImage}
                      onCapture={handleLiveCapture}
                      loading={isProcessing}
                      hasResult={!!result}
                      onAnalyze={handleAnalyzeClick}
                      onClear={handleClear}
                      deviceName={deviceName}
                      onDeviceNameChange={handleDeviceNameChange}
                    />
                  )}

                </div>

                <div className="lg:flex w-full animate-in slide-in-from-bottom-5 fade-in duration-500">
                  {result || isProcessing ? (
                    <InspectionResult
                      result={result}
                      isAnalyzing={isProcessing}
                      con_threshold={con_threshold}
                    />
                  ) : (
                    <div className="w-full h-full min-h-125 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                      <div className="text-center">
                        <FileImage className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                        <p className="text-gray-400 font-medium">
                          Results will appear here
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          Select or capture an image to analyze.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </Suspense>
      </div>
    </>
  );
};

export default Inspection;