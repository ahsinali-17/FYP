const supabase = require("../config/supabaseClient");
const createTicket = async (req, res) => {
  try {
    const { name, email, subject, message, user_id } = req.body;
    console.log("Received Ticket Data:", { name, email, subject, message, user_id });
    if (!name || !email || !message) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const { error } = await supabase
      .from('support_tickets')
      .insert([{ user_name: name, user_email: email, subject, message, user_id }]);

    if (error) throw error;

    return res.status(201).json({ success: true, message: "Ticket created" });
  } catch (error) {
    console.error("Ticket Error:", error);
    return res.status(500).json({ error: "Failed to submit ticket" });
  }
}

module.exports = { createTicket };