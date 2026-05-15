import React from 'react'
import { Download, Trash2, X, Smartphone, AlertTriangle } from 'lucide-react';

const ViewModal = ({ viewModalData, setViewModalData, threshold = 80 }) => {
  return (
    <>
        {viewModalData && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex justify-center items-center z-50 p-4 animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl w-full max-w-5xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl">
                
                {/* Modal Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                            <Smartphone className="text-violet-700"/> 
                            {viewModalData.device_name || `Device Scan #${viewModalData.id}`}
                        </h2>
                        <p className="text-sm text-slate-500 mt-1">Scanned on {new Date(viewModalData.created_at).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setViewModalData(null)} className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer">
                        <X size={24} />
                    </button>
                </div>

                {/* Modal Body*/}
                <div className="p-6 overflow-y-auto grow flex flex-col md:flex-row gap-6 bg-slate-50">
                    
                    {/* Original Image */}
                    <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 text-center">Original Upload</h3>
                        <div className="grow flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden max-h-75">
                            {viewModalData.image_url ? (
                                <img src={viewModalData.image_url} alt="Original" className="max-h-full object-contain" />
                            ) : <p className="text-slate-400 text-sm">Image lost.</p>}
                        </div>
                    </div>

                    {/* AI Annotated Image */}
                    <div className="flex-1 bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col">
                        <h3 className="text-sm font-bold text-violet-700 uppercase tracking-wider mb-4 text-center">AI Detection Result</h3>
                        <div className="grow flex items-center justify-center bg-slate-100 rounded-lg overflow-hidden max-h-75 relative">
                            {viewModalData.annotated_image_url || viewModalData.image_url ? (
                                <img src={viewModalData.annotated_image_url || viewModalData.image_url} alt="AI Annotated" className="max-h-full object-contain" />
                            ) : <p className="text-slate-400 text-sm">Image lost.</p>}
                            
                            {/* Overlay Badges */}
                            <div className="w-[90%] absolute top-4 flex flex-row-reverse justify-between gap-2 items-center">
                                <span className={`px-3 py-1.5 rounded-full text-xs font-bold shadow-md border ${
                                    viewModalData.prediction?.toLowerCase().includes('defect') ? 'bg-red-100 text-red-600 border-red-200' : 'bg-emerald-100 text-emerald-600 border-emerald-200'
                                }`}>
                                    {viewModalData.prediction} ({(viewModalData.confidence || 0).toFixed(1)}%)
                                </span>
                                
                                {/* LOW CONFIDENCE BADGE */}
                                {viewModalData.confidence && viewModalData.confidence < threshold && (
                                    <span className="flex items-center gap-1 bg-amber-100 text-amber-600 border border-amber-200 px-2 py-1 rounded shadow-sm text-xs font-bold uppercase tracking-wider">
                                        <AlertTriangle size={12} />
                                        Manual Review
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
      )}
      </>
  )
}

export default ViewModal