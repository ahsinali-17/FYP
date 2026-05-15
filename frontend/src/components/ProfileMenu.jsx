import React, { useState, useEffect, useRef } from "react";
import { supabase } from "../supabase";
import { User, Key, Camera, LogOut, Eye, EyeOff, ExternalLink } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { logNotification } from "../utils/triggerNotification";

const ProfileMenu = () => {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [user, setUser] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Password Modal States
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        if (user.app_metadata.provider === "google") {
          setAvatarUrl(user.user_metadata.avatar_url);
        } else {
          const { data } = await supabase
            .from("profiles")
            .select("avatar_url")
            .eq("id", user.id)
            .single();
          setAvatarUrl(data?.avatar_url);
        }
      }
    };
    fetchUser();
  }, []);

  const handleAvatarUpload = async (event) => {
    try {
      setLoading(true);
      const file = event.target.files[0];
      if (!file) return;

      const toastId = toast.loading("Uploading image...");
      const fileExt = file.name.split(".").pop();
      const fileName = `${user.id}-${Math.random()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage.from("avatars").upload(fileName, file);
      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(fileName);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setAvatarUrl(publicUrl);
      
      // Log the profile update
      await logNotification('profile', 'Profile Picture Updated', 'Your account avatar was changed successfully.');
      
      toast.update(toastId, { render: "Profile picture updated!", type: "success", isLoading: false, autoClose: 2000 });
    } catch (error) {
      toast.dismiss();
      toast.error("Upload failed: " + error.message);
    } finally {
      setLoading(false);
      setIsOpen(false);
    }
  };

  const handleChangePassword = async () => {
    try {
      setLoading(true);

      // Verify Current Password by re-authenticating
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
      });

      if (signInError) {
        throw new Error("Incorrect current password.");
      }

      // Update to New Password
      const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
      });

      if (updateError) throw updateError;

      // Log the security event
      await logNotification('security', 'Password Changed', 'Your account password was updated successfully.');

      toast.success("Password changed successfully!");
      setShowPasswordModal(false);
      setCurrentPassword("");
      setNewPassword("");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const isEmailUser = user?.app_metadata?.provider === "email";

  return (
    <div className="relative z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden border-2 border-white shadow-sm hover:ring-2 ring-violet-700 transition-all cursor-pointer"
      > 
        {avatarUrl ? (
          <img src={avatarUrl} alt="Profile" className="w-full h-full object-cover object-top" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-500 bg-slate-100">
            <User size={20} />
          </div>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 py-2 overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-4 py-3 border-b border-slate-50 bg-slate-50/50">
            <p className="text-sm font-bold text-slate-800 truncate">{user?.email}</p>
            <p className="text-xs text-slate-500 capitalize flex items-center gap-1 mt-0.5">
              Logged in via {user?.app_metadata?.provider || "User"}
            </p>
          </div>

          {isEmailUser && (
            <div>
              <button onClick={() => fileInputRef.current.click()} className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2 cursor-pointer transition-colors">
                <Camera size={16} /> Change Photo
              </button>
              <input type="file" ref={fileInputRef} onChange={handleAvatarUpload} className="hidden" accept="image/*" />
            </div>
          )}

          {isEmailUser && (
            <button
              onClick={() => {
                setIsOpen(false);
                setShowPasswordModal(true);
              }}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <Key size={16} /> Change Password
            </button>
          )}

          {/* Google Account Link */}
          {!isEmailUser && (
            <a 
              href="https://myaccount.google.com/" 
              target="_blank" 
              rel="noopener noreferrer"
              onClick={() => setIsOpen(false)}
              className="w-full text-left px-4 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 hover:text-violet-700 flex items-center gap-2 cursor-pointer transition-colors"
            >
              <ExternalLink size={16} /> Manage Google Account
            </a>
          )}
        </div>
      )}

      {/* Password Modal */}
      {showPasswordModal && (
        <div className="fixed inset-[40vh] bg-slate-900/40 drop-shadow-xl flex items-center justify-center z-100 animate-in fade-in duration-200">
          <div className="bg-white p-6 rounded-2xl w-full max-w-sm shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-200">
            
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-violet-100 text-violet-700 rounded-full flex items-center justify-center">
                <Key size={20} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-800">Change Password</h3>
                <p className="text-xs text-slate-500">Secure your account</p>
              </div>
            </div>

            {/* Current Password Input */}
            <div className="space-y-4 mb-6">
              <div className="space-y-1.5">
                <label htmlFor="current-password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">Current Password</label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="Enter current password"
                    value={currentPassword}
                    id="current-password"
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full p-3 pr-10 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-violet-700 focus:bg-white transition-all outline-none text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* New Password Input */}
              <div className="space-y-1.5">
                <label htmlFor="new-password" className="text-xs font-bold text-slate-600 uppercase tracking-wider">New Password</label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="Enter new password"
                    value={newPassword}
                    id="new-password"
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-3 pr-10 border border-slate-200 bg-slate-50 rounded-xl focus:ring-2 focus:ring-violet-700 focus:bg-white transition-all outline-none text-sm"
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowNewPassword(!showNewPassword)} 
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => {
                  setShowPasswordModal(false);
                  setCurrentPassword("");
                  setNewPassword("");
                }}
                className="flex-1 py-2.5 text-sm font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleChangePassword}
                disabled={loading || !newPassword || !currentPassword}
                className="flex-1 py-2.5 text-sm font-bold text-white bg-violet-700 hover:bg-violet-800 rounded-xl disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed transition-colors shadow-md shadow-violet-500/20"
              >
                {loading ? "Updating..." : "Update Password"}
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;


