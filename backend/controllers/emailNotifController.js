const { sendNotificationEmail } = require('../services/emailNotifService');

const sendNotification = async (req, res) => {
    try {
        const { email, subject, body } = req.body;

        // 1. Validate payload
        if (!email || !subject || !body) {
            return res.status(400).json({ 
                success: false, 
                error: "Missing required fields: email, subject, or body" 
            });
        }

        // 2. Call the service
        await sendNotificationEmail(email, subject, body);

        // 3. Send success response
        return res.status(200).json({ 
            success: true, 
            message: "Notification email dispatched successfully" 
        });

    } catch (error) {
        console.error("Email Controller Error:", error.message);
        return res.status(500).json({ 
            success: false, 
            error: "Internal Server Error", 
            details: error.message 
        });
    }
};

module.exports = {
    sendNotification
};