import React, { useState } from "react";
import {
  MessageSquare,
  Send,
  Mail,
  User,
  HelpCircle,
  ArrowLeft,
  CheckCircle,
  FileQuestionMark,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";
import { logNotification } from "../utils/triggerNotification";
import axios from "axios";
import { supabase } from "../supabase";
import MetaData from '../components/MetaData';

const ContactSupport = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false); // NEW: Tracks if the form was successfully sent
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "Technical Issue",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {data:{user}} = await supabase.auth.getUser();
      const tempFormData = {
        ...formData,
        user_id: user ? user.id : null,
      };
      const backendUrl =
        import.meta.env.VITE_BACKEND_URL || "http://localhost:3000";
      await axios.post(`${backendUrl}/api/support/ticket`, tempFormData);

      setIsSubmitted(true);

      // NEW: Log to the Notification Bell
      await logNotification(
        "support",
        "Ticket Received",
        `Your support ticket regarding "${formData.subject}" is under review.`,
      );
    } catch (error) {
      console.error("Submission failed:", error);
      toast.error("Failed to submit ticket. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      subject: "Technical Issue",
      message: "",
    });
    setIsSubmitted(false);
  };

  return (
    <>
    <MetaData 
        title="Contact Support" 
        description="Get help with your ScreenSense AI inspection needs." 
      />
    <div className="max-w-4xl mx-auto animate-in fade-in duration-500 px-6">
      <div className="mb-8 text-center md:text-left">
        <h1 className="text-3xl font-bold text-slate-800 mb-2">
          Contact Support
        </h1>
        <p className="text-slate-500">
          Need help with a scan or have a question? Our team is here for you.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Side: Dynamic Area (Form OR Success Screen) */}
        <div className="md:col-span-2 bg-white p-6 md:p-8 rounded-2xl shadow-sm border border-slate-100 relative overflow-hidden">
          {isSubmitted ? (
            /* SUCCESS STATE UI */
            <div className="flex flex-col items-center justify-center py-12 text-center animate-in zoom-in-95 duration-500">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800 mb-2">
                Ticket Received!
              </h2>
              <p className="text-slate-600 mb-8 max-w-md mx-auto">
                Thank you for reaching out, {formData.name.split(" ")[0]}. Our
                support team has received your message regarding{" "}
                <strong>"{formData.subject}"</strong> and will look back at it
                shortly.
              </p>

              <button
                onClick={resetForm}
                className="px-6 py-3 bg-black border-2 border-slate-200 hover:bg-slate-50 hover:text-slate-700 text-slate-100 font-bold rounded-xl transition-colors cursor-pointer"
              >
                Send Another
              </button>
            </div>
          ) : (
            /* --- THE FORM --- */
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <User size={16} className="text-slate-400" /> Your Name
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                    <Mail size={16} className="text-slate-400" /> Email Address
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
                    placeholder="john@company.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  What do you need help with?
                </label>
                <select
                  value={formData.subject}
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 appearance-none transition-all cursor-pointer"
                >
                  <option value="Technical Issue">
                    Technical Issue / Bug Report
                  </option>
                  <option value="Billing">Billing & Subscription</option>
                  <option value="Feature Request">Feature Request</option>
                  <option value="Other">Other Inquiry</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">
                  Message
                </label>
                <textarea
                  required
                  rows={5}
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all resize-none"
                  placeholder="Describe your issue in detail..."
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-4 bg-violet-700 hover:bg-violet-800 text-white font-bold rounded-xl shadow-lg shadow-violet-500/30 transition-all flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
              >
                {isSubmitting ? (
                  <>Sending Message...</>
                ) : (
                  <>
                    Send Message <Send size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Side: Info Cards */}
        <div className="space-y-6">
          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-600 mb-4">
              <MessageSquare size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Response Time</h3>
            <p className="text-sm text-slate-600">
              Our enterprise support team typically responds to all inquiries
              within <strong>2-4 business hours</strong>.
            </p>
          </div>

          <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
            <div className="w-12 h-12 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-600 mb-4">
              <FileQuestionMark size={24} />
            </div>
            <h3 className="font-bold text-slate-800 mb-2">Have a Question?</h3>
            <Link
              to="/faq"
              className="text-sm text-slate-600 hover:underline hover:text-violet-700 cursor-pointer"
            >
              FAQ
            </Link>
          </div>
        </div>
      </div>
    </div>
    </>
  );
};

export default ContactSupport;



