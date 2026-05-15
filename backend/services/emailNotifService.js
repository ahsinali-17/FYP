const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail', 
    auth: { 
        user: process.env.EMAIL_USER, 
        pass: process.env.EMAIL_PASS 
    }
});

const sendNotificationEmail = async (email, subject, body) => {
   try {
        const info = await transporter.sendMail({
            from: `"ScreenSense AI" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: `ScreenSense: ${subject}`,
            html: `<div style="padding: 20px; font-family: sans-serif;">
                     <h2>${subject}</h2>
                     <p>${body}</p>
                   </div>`,
            text: `${subject}\n\n${body}` 
        });
        
        return info;
    } catch (error) {
        console.error("Nodemailer Service Error:", error);
        throw new Error("Failed to send email via SMTP");
    }
};

module.exports = {
    sendNotificationEmail
};