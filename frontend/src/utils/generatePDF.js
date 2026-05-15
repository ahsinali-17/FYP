import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { supabase } from '../supabase';

import logoImg from '../../public/logo.webp'; 

// shared helper 1: secure image fetcher
const getBase64ImageFromSupabase = async (fullUrl) => {
    try {
        if (!fullUrl) throw new Error("No URL provided");
        const parts = fullUrl.split('/scans/');
        if (parts.length !== 2) throw new Error("Could not extract file path from URL");
        
        const { data: blob, error } = await supabase.storage.from('scans').download(parts[1]);
        if (error) throw error;

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = () => reject("FileReader failed to convert image");
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Supabase Download Error:", error);
        throw error;
    }
};

// shared helper 2: logo fetcher
const getLocalImageBase64 = async (imagePath) => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'Anonymous';
        img.onload = () => {
            const canvas = document.createElement('canvas');
            const size = Math.min(img.width, img.height);
            canvas.width = size;
            canvas.height = size;
            const ctx = canvas.getContext('2d');

            ctx.beginPath();
            ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();

            const xOffset = (img.width - size) / 2;
            const yOffset = (img.height - size) / 2;
            ctx.drawImage(img, xOffset, yOffset, size, size, 0, 0, size, size);

            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => reject("Failed to load logo");
        img.src = imagePath;
    });
};

// shared helper 3: overlay watermark & footer
const applyOverlayAndFooter = (doc, title) => {
    const pageCount = doc.internal.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        
        doc.setGState(new doc.GState({ opacity: 0.22 })); 
        doc.setTextColor(207, 159, 255); 
        doc.setFontSize(70);
        doc.setFont("helvetica", "bold");
        doc.text("SCREENSENSE AI", 135, 225, { angle: 45, align: 'center' });
        doc.setGState(new doc.GState({ opacity: 1.0 })); 
        
        doc.setDrawColor(226, 232, 240);
        doc.setLineWidth(0.5);
        doc.line(14, 278, 196, 278);
        
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184);
        doc.setFont("helvetica", "bold");
        doc.text(`ScreenSense AI - ${title}`, 14, 283);
        
        doc.text(`Page ${i} of ${pageCount}`, 196, 283, { align: 'right' });

        doc.setFont("helvetica", "normal");
        doc.setFontSize(7);
        doc.text("This condition report is system-generated via an automated AI diagnostic pipeline.", 105, 288, { align: 'center' });
    }
};

// single device report
export const generateSingleReport = async (item) => {
    const doc = new jsPDF();
    const isDefect = item.prediction?.toLowerCase().includes('defect');

    // fetch logo and both images simultaneously
    const originalUrl = item.original_url || item.image_url;
    const aiUrl = item.annotated_image_url || item.result_image || item.image_url;

    const [logoBase64, imgDataOriginal, imgDataAi] = await Promise.all([
        getLocalImageBase64(logoImg).catch(() => null),
        originalUrl ? getBase64ImageFromSupabase(originalUrl).catch(() => null) : null,
        aiUrl ? getBase64ImageFromSupabase(aiUrl).catch(() => null) : null
    ]);

    // header
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, 15, 18, 18);
    }

    doc.setFontSize(26);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(79, 70, 229); 
    doc.text("SCREENSENSE AI", 36, 25); 
    
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text("Automated Visual Diagnostics", 36, 32);
    
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Condition Report", 196, 32, { align: 'right' }); 

    doc.setDrawColor(31, 41, 55);
    doc.setLineWidth(0.8);
    doc.line(14, 38, 196, 38); 

    // live scan verification badge
    if (item.is_live_scan) {
        doc.setFillColor(16, 185, 129); 
        doc.roundedRect(165, 14, 31, 7, 1, 1, 'F');
        doc.setFontSize(8);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(255, 255, 255);
        doc.text("VERIFIED LIVE", 180.5, 19, { align: 'center' });
    }

    // inspection details box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252); 
    doc.setLineWidth(0.3);
    doc.roundedRect(14, 44, 182, 42, 2, 2, 'FD');

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42);
    doc.text("Inspection Details", 20, 53);
    
    doc.setDrawColor(226, 232, 240);
    doc.line(20, 56, 190, 56); 

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139); 
    doc.text("Device ID / Name", 20, 64);
    doc.text("Report Tracking ID", 105, 64);
    doc.text("Capture Mode", 20, 76);
    doc.text("Model Framework", 105, 76);

    const reportTrackingId = `REP-${item.id || Math.floor(Math.random() * 10000)}`;

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(15, 23, 42); 
    doc.text(item.device_name || 'N/A', 20, 69);
    doc.text(reportTrackingId, 105, 69);
    doc.text(item.is_live_scan ? "Real-time Live Camera" : "Standard Upload", 20, 81);
    doc.text("DFTR Specialist Model", 105, 81); 

    // final verdict box
    if (isDefect) {
        doc.setFillColor(254, 242, 242); 
        doc.setDrawColor(239, 68, 68);   
    } else {
        doc.setFillColor(240, 253, 244); 
        doc.setDrawColor(34, 197, 94);   
    }
    doc.setLineWidth(0.6);
    doc.roundedRect(14, 90, 182, 38, 2, 2, 'FD');

    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(isDefect ? 153 : 22, isDefect ? 27 : 101, isDefect ? 27 : 52); 
    doc.text("FINAL VERDICT", 20, 98);
    
    doc.setFontSize(22);
    doc.setTextColor(isDefect ? 220 : 22, isDefect ? 38 : 163, isDefect ? 38 : 74); 
    doc.text(item.prediction || 'Unknown', 20, 108);

    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    if (isDefect) {
        doc.text("Defect Classification", 20, 118);
        doc.setFont("helvetica", "bold");
        doc.text(item.defect_type || item.prediction || 'N/A', 20, 123);
    }
    
    doc.setFont("helvetica", "normal");
    doc.text("AI Confidence Score", 105, 118);
    doc.setFont("helvetica", "bold");
    doc.text(`${item.confidence || 100}%`, 105, 123);

    // photographic evidence
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42);
    doc.text("Photographic Evidence", 14, 140);

    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.setLineWidth(0.3);
    doc.roundedRect(14, 144, 182, 115, 2, 2, 'FD'); 

    doc.setLineDashPattern([2, 2], 0);
    doc.line(105, 148, 105, 255);
    doc.setLineDashPattern([], 0); 

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(100, 116, 139);
    doc.text("ORIGINAL CAPTURE", 59.5, 151, { align: 'center' });
    doc.setTextColor(79, 70, 229);
    doc.text("AI DIAGNOSTIC OVERLAY", 150.5, 151, { align: 'center' });

    if (imgDataOriginal) {
        doc.addImage(imgDataOriginal, 'JPEG', 20, 155, 79, 100, undefined, 'FAST');
    } else {
        doc.setFontSize(10);
        doc.setTextColor(220, 38, 38);
        doc.text("(Original locked by server)", 59.5, 200, { align: 'center' });
    }

    if (imgDataAi) {
        doc.addImage(imgDataAi, 'JPEG', 111, 155, 79, 100, undefined, 'FAST');
    } else {
        doc.setFontSize(10);
        doc.setTextColor(220, 38, 38);
        doc.text("(AI Image locked by server)", 150.5, 200, { align: 'center' });
    }

    doc.setFontSize(9);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(100, 116, 139);
    doc.text("Bounding boxes represent exact coordinate matches processed by the neural network.", 105, 265, { align: 'center' });

    applyOverlayAndFooter(doc, "Single Device Condition Report");
    doc.save(`Condition_Report_${item.device_name || 'Device'}_${Date.now()}.pdf`);
};

// batch manifest
export const generateBatchManifest = async (batchId, batchItems) => {
    const doc = new jsPDF();
    const { data: { user } } = await supabase.auth.getUser();
    const userName = user?.user_metadata?.full_name || user?.email || 'Authorized User';

    const total = batchItems.length;
    const defectiveItems = batchItems.filter(i => i.prediction?.toLowerCase().includes('defect'));
    const defectCount = defectiveItems.length;
    const cleanCount = total - defectCount;
    const CleanRate = total > 0 ? (((cleanCount) / total) * 100).toFixed(1) : 0;

    const logoPromise = getLocalImageBase64(logoImg).catch(() => null);
    const defectImagePromises = defectiveItems.map(item => {
        const url = item.annotated_image_url || item.image_url;
        return url ? getBase64ImageFromSupabase(url).catch(() => null) : null;
    });
    
    const [logoBase64, ...defectImagesBase64] = await Promise.all([logoPromise, ...defectImagePromises]);

    // header
    if (logoBase64) {
        doc.addImage(logoBase64, 'PNG', 14, 15, 18, 18);
    }

    doc.setFontSize(26);
    doc.setTextColor(79, 70, 229); 
    doc.setFont("helvetica", "bold");
    doc.text("SCREENSENSE AI", 36, 25);
    
    doc.setFontSize(16);
    doc.setTextColor(15, 23, 42);
    doc.text(`Batch ID: #${batchId.slice(0,8).toUpperCase()}`, 196, 32, { align: 'right' });
    
    doc.setFontSize(11);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(100, 116, 139);
    doc.text(`Processed: ${new Date().toLocaleString()}`, 36, 32);
    doc.text(`Authorized by: ${userName}`, 36, 38);

    // summary box
    doc.setDrawColor(226, 232, 240);
    doc.setFillColor(248, 250, 252);
    doc.roundedRect(14, 48, 182, 40, 3, 3, 'FD');
    
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(14);
    doc.text(`Total Assets Scanned: ${total}`, 20, 60);
    doc.text(`Clear / Undamaged: ${cleanCount}`, 20, 70);
    doc.text(`Anomalies Detected: ${defectCount}`, 20, 80);
    
    doc.setFontSize(22);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(cleanCount === total ? 22 : 220, 38, 38); 
    doc.text(`Yield Rate: ${CleanRate}%`, 120, 70);

    // ledger table
    autoTable(doc, {
        startY: 95,
        head: [['Scan Ref', 'Asset Tag', 'Timestamp', 'AI Verdict', 'Confidence']],
        body: batchItems.map(item => [
            `#${item.id}`,
            item.device_name || 'N/A',
            new Date(item.created_at).toLocaleTimeString(),
            item.prediction || 'Unknown',
            `${item.confidence || 100}%`
        ]),
        theme: 'striped',
        headStyles: { fillColor: [79, 70, 229] },
        alternateRowStyles: { fillColor: [248, 250, 252] }, 
        didParseCell: function(data) {
            if (data.section === 'body' && data.column.index === 3) {
                if (data.cell.raw && data.cell.raw.toLowerCase().includes('defect')) {
                    data.cell.styles.textColor = [220, 38, 38]; 
                    data.cell.styles.fontStyle = 'bold';
                } else {
                    data.cell.styles.textColor = [22, 163, 74]; 
                }
            }
        }
    });

    if (defectCount > 0) {
        let yPos = doc.lastAutoTable ? doc.lastAutoTable.finalY + 15 : 120;
        
        if (yPos + 100 > 280) {
            doc.addPage();
            yPos = 25;
        }

        doc.setFontSize(16);
        doc.setTextColor(15, 23, 42);
        doc.setFont("helvetica", "bold");
        doc.text("Appendix A: Audit Visual Evidence", 14, yPos);
        yPos += 8;
        
        const boxWidth = 88;
        const boxHeight = 88;
        const imgWidth = 84;
        const imgHeight = 74;
        const colGap = 6;
        
        for (let i = 0; i < defectiveItems.length; i++) {
            const item = defectiveItems[i];
            const isLeft = i % 2 === 0;
            const preFetchedImgData = defectImagesBase64[i]; 
            
            if (isLeft && yPos + boxHeight > 275) {
                doc.addPage();
                yPos = 25;
            }

            const xPos = isLeft ? 14 : 14 + boxWidth + colGap;

            doc.setDrawColor(226, 232, 240);
            doc.setFillColor(248, 250, 252);
            doc.setLineWidth(0.3);
            doc.roundedRect(xPos, yPos, boxWidth, boxHeight, 2, 2, 'FD');

            doc.setFontSize(9);
            doc.setFont("helvetica", "bold");
            doc.setTextColor(15, 23, 42);
            doc.text(`Ref: #${item.id} | Asset: ${item.device_name || 'N/A'}`, xPos + (boxWidth/2), yPos + 6, { align: 'center' });
            
            doc.setFontSize(8);
            doc.setFont("helvetica", "normal");
            doc.setTextColor(220, 38, 38);
            const issueDetail = item.defect_type ? item.defect_type : item.prediction;
            doc.text(`Anomaly: ${issueDetail}`, xPos + (boxWidth/2), yPos + 10, { align: 'center' });
            
            if (preFetchedImgData) {
                doc.addImage(preFetchedImgData, 'JPEG', xPos + 2, yPos + 12, imgWidth, imgHeight, undefined, 'FAST');
            } else {
                doc.setFontSize(8);
                doc.setTextColor(100, 116, 139);
                doc.text("(Image unavailable)", xPos + (boxWidth/2), yPos + (boxHeight/2), { align: 'center' });
            }
            
            if (!isLeft) {
                yPos += boxHeight + 6; 
            }
        }
    }

    applyOverlayAndFooter(doc, "Batch Manifest");
    doc.save(`Batch_Manifest_${batchId.slice(0,6)}_${Date.now()}.pdf`);
};