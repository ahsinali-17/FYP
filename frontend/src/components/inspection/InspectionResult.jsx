import React, { useState } from 'react';
import { Download, CheckCircle, AlertCircle, AlertTriangle, Camera } from 'lucide-react';
import { logNotification } from '../../utils/triggerNotification';
import { toast } from 'react-toastify';

const InspectionResult = ({ result, isAnalyzing, con_threshold }) => {
    const [isGenerating, setIsGenerating] = useState(false);

    const handleDownload = async () => {
        if (!result) return;
        setIsGenerating(true);
        
        try {
            const { generateSingleReport } = await import('../../utils/generatePDF');
            await generateSingleReport(result);
            await logNotification(
                'scan',
                'Report Generated',
                `Condition Report generated for Asset: ${result.device_name || 'Unknown Device'}`
            );
        } catch (error) {
            console.error("PDF Generation Error:", error);
            toast.error("Failed to generate report.");
        } finally {
            setIsGenerating(false);
        }
    };

    if (isAnalyzing) {
        return (
            <div className="w-full h-full min-h-125 flex flex-col items-center justify-center border-2 border-gray-200 rounded-xl bg-gray-50 p-8 animate-in fade-in">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-700 mb-4"></div>
                <h3 className="text-lg font-semibold text-gray-700">AI is analyzing the image...</h3>
                <p className="text-sm text-gray-500 mt-2">Running deep learning models to detect defects.</p>
            </div>
        );
    }

    if (!result) return null;

    const isDefective = result.prediction?.toLowerCase().includes('defect');
    const needsReview = result.confidence && parseInt(result.confidence.split('%')[0]) < con_threshold;
    
    const statusColor = isDefective ? 'text-red-600' : 'text-emerald-600';
    const badgeBg = isDefective ? 'bg-red-100 border-red-200' : 'bg-emerald-100 border-emerald-200';
    const StatusIcon = isDefective ? AlertCircle : CheckCircle;

    return (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex flex-col h-full relative overflow-hidden w-full animate-in slide-in-from-right-4 duration-500">
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold text-gray-900">Analysis Result</h2>
                {result.is_live_scan && (
                    <span className="flex items-center gap-1.5 px-3 py-1 bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider shadow-sm">
                        <Camera size={14} />
                        Verified Live
                    </span>
                )}
            </div>

            <div className="grow flex items-center justify-center bg-gray-100 rounded-lg overflow-hidden mb-6 border border-gray-200 min-h-[40vh]">
                {result.annotated_image_url || result.result_image || result.image_url || result.original_url ? (
                    <img 
                        src={result.annotated_image_url || result.result_image || result.image_url || result.original_url} 
                        alt="AI Analysis" 
                        className="max-h-[40vh] object-contain"
                    />
                ) : (
                    <p className="text-gray-400">No image available</p>
                )}
            </div>

            <div className={`p-4 rounded-lg border ${badgeBg} mb-6`}>
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                        <StatusIcon className={`w-6 h-6 mr-2 ${statusColor}`} />
                        <span className={`text-lg font-bold ${statusColor}`}>{result.status || result.prediction}</span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        {needsReview && (
                            <span className="flex items-center gap-1 bg-amber-100 text-amber-600 border border-amber-200 p-2 rounded text-xs font-bold uppercase tracking-wider animate-pulse">
                                <AlertTriangle size={12} />
                                Review
                            </span>
                        )}
                        <span className="text-gray-600 font-semibold bg-white px-3 py-1 rounded-full text-sm shadow-sm border border-gray-100 text-center">
                            Confidence: {result.confidence || 100}
                        </span>
                    </div>
                </div>
                {isDefective && (
                    <p className="text-red-600 text-sm mt-2 font-medium">
                        Detected Issue: {result.defect_type || result.type || result.prediction}
                    </p>
                )}
            </div>

            <button
                onClick={handleDownload}
                disabled={isGenerating}
                className="w-full flex items-center justify-center py-3 px-4 bg-slate-900 hover:bg-violet-800 text-white rounded-xl font-medium transition-colors shadow-sm disabled:bg-slate-400 disabled:cursor-not-allowed cursor-pointer"
            >
                <Download className="w-5 h-5 mr-2" />
                {isGenerating ? 'Generating PDF...' : 'Download Condition Report'}
            </button>
        </div>
    );
};

export default InspectionResult;