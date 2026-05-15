import React from 'react';
import { Tag } from 'lucide-react';

const DeviceInput = ({ 
  deviceName, 
  onDeviceNameChange,
  label = "Device Identifier",
  placeholder = "e.g., iPhone 13 Pro - Order #994",
  helperText = "Leave blank to auto-generate a timestamped ID.",
  disabled = false,
  isLiveScan = false
}) => {
  return (
    <div className="w-full relative">
      <label className="text-sm font-medium text-slate-700 mb-1.5 flex items-center justify-between">
        <span>{label}</span>
       {!isLiveScan && (
          <span className="text-xs font-normal text-slate-400 bg-slate-100 px-2 py-0.5 rounded-md">Optional</span>
        )}
      </label>
      
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Tag className={`h-5 w-5 ${disabled ? 'text-slate-300' : 'text-slate-400'}`} />
        </div>
        
        <input
          type="text"
          value={deviceName}
          onChange={(e) => {
           if (onDeviceNameChange) onDeviceNameChange(e);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all 
            ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100' : 'hover:bg-slate-100'}`}
        />
      </div>
      <p className="text-xs text-slate-400 mt-2">
         {helperText}
      </p>
    </div>
  );
};

export default DeviceInput;