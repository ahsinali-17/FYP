import React, { useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { Camera, RefreshCcw, Play, Trash2 } from "lucide-react";
import NameInput from "./NameInput";

const LiveScanUpload = ({
  image,
  setImage,
  onCapture,
  loading,
  hasResult,
  onAnalyze,
  onClear,
  deviceName,
  onDeviceNameChange,
}) => {
  const webcamRef = useRef(null);

  // capture photo and convert base64 to blob
  const handleCapture = useCallback(async () => {
    const imageSrc = webcamRef.current.getScreenshot();
    if (!imageSrc) return;
    setImage(imageSrc); // set preview immediately
    // convert base64 to blob for the backend formData
    const res = await fetch(imageSrc);
    const blob = await res.blob();
    onCapture(blob);
  }, [webcamRef, onCapture]);

  const handleRetake = () => {
    setImage(null);
    onClear();
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 flex flex-col h-full">
      <div className="mb-6">
        <h2 className="text-xl font-bold text-slate-800">
          Live Device Capture
        </h2>
        <p className="text-sm text-slate-500 mt-1">
          Take a real-time photo to generate a verified live report.
        </p>
      </div>

      <div className="mb-6">
        <NameInput
          deviceName={deviceName}
          onDeviceNameChange={onDeviceNameChange}
          disabled={loading}
          isLiveScan={true}
          helperText="Enter the device name/model for the live scan."
        />
      </div>

      <div className="grow flex flex-col items-center justify-center bg-slate-50 border-2 border-slate-200 rounded-xl overflow-hidden relative min-h-75">
        {!image && !hasResult ? (
          <Webcam
            audio={false}
            ref={webcamRef}
            screenshotFormat="image/jpeg"
            screenshotQuality={0.8}
            videoConstraints={{
              facingMode: "environment",
              width: 1920,
              height: 1080,
            }}
            className="w-full h-full object-cover"
          />
        ) : (
          <img
            src={image}
            alt="Captured preview"
            className="w-full h-full object-contain"
          />
        )}

        {loading && (
          <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center z-10">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-end">
        {!image && !hasResult ? (
          <button
            onClick={handleCapture}
            className="flex items-center justify-center gap-2 px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium transition-colors w-full sm:w-auto cursor-pointer"
          >
            <Camera size={18} />
            Capture Photo
          </button>
        ) : (
          <>
            {!hasResult && (
              <>
                <button
                  onClick={handleRetake}
                  disabled={loading}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-lg font-medium transition-colors disabled:opacity-50 w-full sm:w-auto cursor-pointer"
                >
                  <RefreshCcw size={18} />
                  Retake
                </button>

                <button
                  onClick={onAnalyze}
                  disabled={loading || !deviceName.trim()}
                  className="flex items-center justify-center gap-2 px-6 py-2.5 bg-violet-700 hover:bg-violet-800 text-white rounded-lg font-medium transition-colors disabled:opacity-50 w-full sm:w-auto cursor-pointer shadow-sm"
                >
                  <Play size={18} />
                  Run Live Scan
                </button>
              </>
            )}

            {hasResult && (
              <button
                onClick={handleRetake}
                className="flex items-center justify-center gap-2 px-6 py-2.5 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-medium transition-colors w-full sm:w-auto cursor-pointer"
              >
                <Trash2 size={18} />
                Clear Result
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default LiveScanUpload;
