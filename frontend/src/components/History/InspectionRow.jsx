import React from 'react'
import { Eye, Download, Loader2, Camera } from 'lucide-react';

const InspectionRow = ({ 
    item, 
    onView, 
    onDownload, 
    isDownloading, 
    isDisabled, 
    isChild = false,
    isSelected = false,
    onSelect = () => {},
    isMultiSelected = false
}) => {
    const isDefect = item.prediction?.toLowerCase().includes('defect');

    return (
        <tr className={`hover:bg-slate-50 transition-colors group ${isSelected ? 'bg-violet-50/50' : ''}`}>
            
            <td className="p-3 text-center">
                {!isChild && (
                    <input 
                        type="checkbox" 
                        aria-label={`Select device ${item.device_name || item.id}`}
                        checked={isSelected} 
                        onChange={onSelect} 
                        disabled={isDisabled}
                        className="w-4 h-4 text-violet-600 bg-white border-slate-300 rounded focus:ring-violet-500 cursor-pointer disabled:opacity-50" 
                    />
                )}
            </td>

            <td className="p-3 text-center">
                <div className={`w-12 h-12 rounded-lg overflow-hidden border border-slate-200 mx-auto ${isChild ? 'w-10 h-10' : ''}`}>
                    <img src={item.annotated_image_url || item.image_url} alt="Scan" className="w-full h-full object-cover" />
                </div>
            </td>
            <td className="p-3">
                <div className="flex items-center gap-2 mb-0.5">
                    <p className="font-bold text-slate-700 text-sm">#{item.id}</p>
                    {item.is_live_scan && (
                        <span title="Verified Live Scan" className="flex items-center gap-1 px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold uppercase tracking-wider">
                            <Camera size={10} /> Live
                        </span>
                    )}
                </div>
                <p className="text-xs text-slate-600 truncate max-w-37.5">{item.device_name || 'Unknown Device'}</p>
            </td>
            <td className="p-3 text-xs text-slate-600">
                {new Date(item.created_at).toLocaleDateString()}
            </td>
            <td className="p-3">
                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold border ${
                    isDefect ? 'bg-red-50 text-red-700 border-red-200' : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                    {item.defect_type || item.prediction}
                </span>
            </td>
            <td className="p-3 text-xs font-medium text-slate-700">
                {item.confidence ? `${(item.confidence).toFixed(1)}%` : 'N/A'}
            </td>
            <td className="p-3 text-right">
                <div className="flex justify-end gap-1 opacity-100 lg:opacity-0 lg:group-hover:opacity-100 transition-opacity">
                    <button onClick={onView} disabled={isDisabled} title="View Details" className="p-2 text-violet-700 hover:bg-violet-100 rounded-lg transition-colors cursor-pointer disabled:opacity-50">
                        <Eye size={16}/>
                    </button>
                    <button onClick={onDownload} disabled={isDisabled} title="Download PDF" className="p-2 text-violet-700 hover:bg-violet-100 rounded-lg transition-colors disabled:opacity-50 cursor-pointer">
                        {isDownloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
                    </button>
                </div>
            </td>
        </tr>
    );
};

export default InspectionRow;