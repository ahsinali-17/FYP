const supabase = require("../config/supabaseClient");

const createBatch = async (req, res) => {
  console.log("Batch Creation Request Received:");
  try {
    const { user_id, total_images, batch_name } = req.body;

    if (!user_id) {
      return res.status(400).json({ error: "Missing user_id" });
    }

    const { data, error } = await supabase
      .from("batches")
      .insert([{ user_id, total_images, batch_name }])
      .select()
      .single();

    if (error) throw error;

    return res.status(201).json({ batch_id: data.id });
  } catch (error) {
    console.error("Batch Creation Error:", error.message);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = { createBatch };