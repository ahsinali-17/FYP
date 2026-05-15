import React, { useCallback } from 'react';
import { UploadCloud, X, Loader2, ScanLine } from 'lucide-react';
import DeviceNameInput from './NameInput';
import { motion } from 'framer-motion';
import { useDropzone } from 'react-dropzone';

const InspectionUpload = ({ 
  image, 
  imageBlob, 
  loading, 
  isCompressing,
  hasResult, 
  autoRun, 
  onFileChange, 
  onAnalyze, 
  onClear, 
  deviceName, 
  onDeviceNameChange 
}) => {
  
  const onDrop = useCallback(acceptedFiles => {
    if (acceptedFiles && acceptedFiles.length > 0) {
      onFileChange({ target: { files: acceptedFiles } });
    }
  }, [onFileChange]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: { 'image/*': ['.jpeg', '.jpg', '.png', '.webp', '.svg'] },
    multiple: false, 
    disabled: loading || isCompressing || !!image
  });

  const showActionButton = image && !hasResult && !autoRun;

  return (
    <div className="w-full bg-white rounded-2xl shadow-sm border border-slate-100 p-8 h-full flex items-center justify-center flex-col">
      <div className='w-full mb-4'>
        <DeviceNameInput deviceName={deviceName} onDeviceNameChange={onDeviceNameChange}/>
      </div>
      
      {!image ? (
        <div 
          {...getRootProps()} 
          className={`flex flex-col items-center justify-center w-full h-96 border-2 border-dashed rounded-xl cursor-pointer transition-all group outline-none
            ${isDragActive ? 'border-violet-500 bg-violet-100 scale-[1.02]' : 'border-slate-200 bg-slate-50 hover:bg-slate-100 hover:border-violet-500'}
          `}
        >
          <input {...getInputProps()} />
          
          <div className="flex flex-col items-center justify-center pt-5 pb-6 pointer-events-none">
            <div className={`p-4 rounded-full shadow-sm mb-4 transition-transform ${isDragActive ? 'bg-violet-100 scale-110' : 'bg-white group-hover:scale-110'}`}>
              <UploadCloud className={`w-10 h-10 ${isDragActive ? 'text-violet-700' : 'text-violet-500'}`} />
            </div>
            <p className="mb-2 text-lg text-slate-700 font-medium">
              {isDragActive ? 'Drop it here!' : 'Click to browse or drag and drop'}
            </p>
            <p className="text-sm text-slate-400">SVG, PNG, JPG or WEBP</p>
          </div>
        </div>
      ) : (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full relative h-96 bg-slate-900 rounded-xl overflow-hidden flex items-center justify-center"
        >
          <img src={image} alt="Preview" className="max-h-full max-w-full object-contain" />
          
          <button 
            onClick={onClear}
            disabled={loading || isCompressing}
            className="absolute top-4 right-4 p-2 bg-white/20 backdrop-blur-md hover:bg-white/30 rounded-full text-white transition-colors cursor-pointer disabled:opacity-50"
          >
            <X size={20} />
          </button>
        </motion.div>
      )}

      {showActionButton && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          whileHover={{ scale: (loading || isCompressing) ? 1 : 1.02 }}
          whileTap={{ scale: (loading || isCompressing) ? 1 : 0.98 }}
          onClick={onAnalyze}
          disabled={loading || isCompressing || !imageBlob}
          className="mt-6 w-full py-4 bg-violet-700 hover:bg-violet-800 text-white rounded-xl font-semibold shadow-lg shadow-violet-500/30 flex items-center justify-center gap-2 transition-all disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed"
        >
          {isCompressing ? (
            <>
              <Loader2 className="animate-spin" />
              Optimizing Image...
            </>
          ) : loading ? (
            <>
              <Loader2 className="animate-spin" />
              Analyzing Structure...
            </>
          ) : (
            <>
              <ScanLine />
              Run AI Diagnostics
            </>
          )}
        </motion.button>
      )}

      {image && !hasResult && autoRun && (
        <div className="mt-6 flex flex-col items-center justify-center py-2">
            <Loader2 className="animate-spin text-violet-700 mb-2" size={24} />
            <p className="text-slate-500 font-medium text-sm">
                {isCompressing ? "Optimizing image for auto-scan..." : "Auto-analyzing scan..."}
            </p>
        </div>
      )}
    </div>
  );
};

export default InspectionUpload;