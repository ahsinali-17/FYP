import { supabase } from '../supabase';
import axios from 'axios';

export const logNotification = async (type, title, message) => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // 1. Log to the database ledger
        await supabase.from('notifications').insert([{
            user_id: user.id, type, title, message, is_read: false
        }]);
        window.dispatchEvent(new Event('refresh_notifications'));

        // 2. Fetch email preferences
        const { data: profile } = await supabase
            .from('profiles')
            .select('email_notifications')
            .eq('id', user.id)
            .single();

        // 3. If emails are ON, tell the backend to send one!
        if (profile?.email_notifications) {
            const backendUrl = import.meta.env.VITE_BACKEND_URL;
            axios.post(`${backendUrl}/api/email/notify`, {
                email: user.email,
                subject: title,
                body: message
            }).catch(err => console.error("Email API failed:", err));
        }
    } catch (error) {
        console.error("Failed to trigger notification:", error);
    }
};