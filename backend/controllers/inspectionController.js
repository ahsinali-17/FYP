const supabase = require("../config/supabaseClient");
const { analyzeImageWithAI } = require("../services/aiService");

const analyzeInspection = async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  if (!req.body.user_id)
    return res.status(400).json({ error: "Missing user_id" });

  const batchId = req.body.batch_id || null;
  const fileName = `${Date.now()}_${req.file.originalname}`;
  const filePath = batchId ? `batches/${batchId}/${fileName}` : fileName;

  // convert string 'true'/'false' from FormData to boolean
  const isLiveScan = req.body.is_live_scan === 'true' || req.body.is_live_scan === true;

  // upload original image
  const { error: uploadError } = await supabase.storage
    .from("scans")
    .upload(filePath, req.file.buffer, { contentType: req.file.mimetype });

  if (uploadError) {
    console.error("Storage Error:", uploadError);
    return res
      .status(500)
      .json({
        error: "Failed to upload file to storage",
        details: uploadError.message,
      });
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("scans").getPublicUrl(filePath);

  let finalResult;
  let isDummyResponse = false;
  let annotatedPublicUrl = null;

  // ai api call
  try {
    const aiData = await analyzeImageWithAI(
      req.file.buffer,
      req.file.originalname,
    );

    if (aiData.annotated_image) {
      const imageBuffer = Buffer.from(aiData.annotated_image, "base64");
      const annotatedFileName = `annotated_${fileName}`;
      const annotatedFilePath = batchId
        ? `batches/${batchId}/${annotatedFileName}`
        : annotatedFileName;

      const { error: annotatedUploadError } = await supabase.storage
        .from("scans")
        .upload(annotatedFilePath, imageBuffer, { contentType: "image/jpeg" });

      if (!annotatedUploadError) {
        const {
          data: { publicUrl: annUrl },
        } = supabase.storage.from("scans").getPublicUrl(annotatedFilePath);
        annotatedPublicUrl = annUrl;
      } else {
        console.error(
          "Failed to upload annotated image:",
          annotatedUploadError,
        );
      }
    }

    finalResult = {
      prediction: aiData.prediction,
      confidence:
        aiData.prediction === "Defect Detected"
          ? parseFloat((aiData.confidence * 100).toFixed(1))
          : 100.0,
      defect_type: aiData.defect_type,
      annotated_image: annotatedPublicUrl,
    };
  } catch (aiError) {
    console.warn(
      "⚠️ AI Model Unreachable or Failed. Generating Dummy Response.",
    );
    return res.status(503).json({ error: "AI Service Unavailable", details: aiError.message });
    // isDummyResponse = true;

    // const isDefect = Math.random() > 0.5;
    // finalResult = {
    //   prediction: isDefect ? "Defect Detected" : "Clean",
    //   confidence: 95.0,
    //   defect_type: isDefect ? "Screen Crack" : "None",
    //   annotated_image: publicUrl,
    // };
  }

  // database insertion
  try {
    //if (!isDummyResponse) { 
      const { error: dbError } = await supabase.from("inspections").insert({
        user_id: req.body.user_id,
        batch_id: batchId,
        image_url: publicUrl,
        annotated_image_url: annotatedPublicUrl ? annotatedPublicUrl : publicUrl,
        filename: fileName,
        device_name: req.body.device_name || "Unknown Device",
        prediction: finalResult.prediction,
        confidence: finalResult.confidence,
        defect_type: finalResult.defect_type,
        is_live_scan: isLiveScan 
      });

      if (dbError) {
        console.error("DB Insert Error:", dbError);
        return res
          .status(500)
          .json({
            error: "Failed to save inspection to database",
            details: dbError.message,
          });
     // }
    }

    return res.json({
      prediction: finalResult.prediction,
      type: finalResult.defect_type,
      confidence: `${finalResult.confidence}%`,
      original_url: publicUrl,
      device_name: req.body.device_name || "Unknown Device",
      result_image: finalResult.annotated_image || publicUrl,
      color: finalResult.prediction.includes("Defect") ? "red" : "green",
      is_live_scan: isLiveScan
    });
  } catch (serverError) {
    console.error("Critical Server Error:", serverError);
    return res
      .status(500)
      .json({ error: "DataBase Insertion Error", details: serverError.message });
  }
}

const deleteBulkHistory = async (req, res) => {
  const { user_id, type, ids } = req.body;

  if (!user_id || !type || !ids || !Array.isArray(ids) || ids.length === 0) {
    return res.status(400).json({ error: "Invalid payload. user_id, type, and an array of ids are required." });
  }

  const extractPath = (url) => {
    if (!url) return null;
    const parts = url.split("/scans/");
    return parts.length === 2 ? parts[1] : null;
  };

  try {
    if (type === 'batch') {
      // 1. Fetch URLs for all batches
      const { data: records, error: fetchError } = await supabase
        .from("inspections")
        .select("image_url, annotated_image_url")
        .eq("user_id", user_id)
        .in("batch_id", ids);

      if (fetchError) throw fetchError;

      // 2. Delete Batches from DB
      const { error: dbError } = await supabase
        .from("batches")
        .delete()
        .eq("user_id", user_id)
        .in("id", ids);

      if (dbError) throw dbError;

      // 3. Clean up Storage
      const filesToDelete = [];
      if (records && records.length > 0) {
        records.forEach((record) => {
          const orig = extractPath(record.image_url);
          const ann = extractPath(record.annotated_image_url);
          if (orig) filesToDelete.push(orig);
          if (ann) filesToDelete.push(ann);
        });
        if (filesToDelete.length > 0) {
          await supabase.storage.from("scans").remove(filesToDelete);
        }
      }

    } else if (type === 'single') {
      // 1. Fetch the records
      const { data: records, error: fetchError } = await supabase
        .from("inspections")
        .select("id, image_url, annotated_image_url, batch_id")
        .eq("user_id", user_id)
        .in("id", ids);

      if (fetchError) throw fetchError;
      if (!records || records.length === 0) return res.status(404).json({ error: "Records not found" });

      // 2. Prepare Storage Cleanup and Map Batch Reductions
      const filesToDelete = [];
      const affectedBatches = {};

      records.forEach((record) => {
        const orig = extractPath(record.image_url);
        const ann = extractPath(record.annotated_image_url);
        if (orig) filesToDelete.push(orig);
        if (ann) filesToDelete.push(ann);

        if (record.batch_id) {
          affectedBatches[record.batch_id] = (affectedBatches[record.batch_id] || 0) + 1;
        }
      });

      // 3. Delete from Storage
      if (filesToDelete.length > 0) {
        await supabase.storage.from("scans").remove(filesToDelete);
      }

      // 4. Delete from DB
      const { error: dbError } = await supabase
        .from("inspections")
        .delete()
        .eq("user_id", user_id)
        .in("id", ids);

      if (dbError) throw dbError;

      // 5. Update parent batch counts safely
      const batchIds = Object.keys(affectedBatches);
      if (batchIds.length > 0) {
        const { data: batches } = await supabase
          .from("batches")
          .select("id, total_images")
          .eq("user_id", user_id)
          .in("id", batchIds);

        if (batches) {
          const batchUpdatePromises = batches.map(batch => {
            const newTotal = batch.total_images - affectedBatches[batch.id];
            if (newTotal <= 0) {
              return supabase.from("batches").delete().eq("id", batch.id).eq("user_id", user_id);
            } else {
              return supabase.from("batches").update({ total_images: newTotal }).eq("id", batch.id).eq("user_id", user_id);
            }
          });
          await Promise.all(batchUpdatePromises);
        }
      }
    } else {
      return res.status(400).json({ error: "Invalid type. Must be 'single' or 'batch'." });
    }

    return res.status(200).json({ success: true, message: `Successfully deleted ${ids.length} item(s).` });

  } catch (error) {
    console.error("Bulk Delete Error:", error);
    return res.status(500).json({ error: "Internal Server Error", details: error.message });
  }
};

module.exports = { analyzeInspection, deleteBulkHistory };