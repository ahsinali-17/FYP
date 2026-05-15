import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';
import { toast } from 'react-toastify';
import { User, Bell, Cpu, Save, Loader2 } from 'lucide-react';
import { logNotification } from '../utils/triggerNotification';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'; 
import MetaData from '../components/MetaData';

const Settings = () => {
  const queryClient = useQueryClient();

  const [username, setUsername] = useState(''); 
  const [emailNotifs, setEmailNotifs] = useState(false);
  const [autoRun, setAutoRun] = useState(false);
  const [threshold, setThreshold] = useState(80);

  // fetch profile data
  const { data: profileData, isLoading } = useQuery({
    queryKey: ['userProfile'],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not logged in");

      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') throw error; 

      return {
        id: user.id,
        email: user.email,
        username: profile?.user_name || user.email.split('@')[0],
        emailNotifs: profile?.email_notifications ?? false,
        autoRun: profile?.auto_run_scans ?? false,
        threshold: profile?.confidence_threshold ?? 80
      };
    }
  });

  useEffect(() => {
    if (profileData) {
      setUsername(profileData.username);
      setEmailNotifs(profileData.emailNotifs);
      setAutoRun(profileData.autoRun);
      setThreshold(profileData.threshold);
    }
  }, [profileData]);

  // save account settings
  const accountMutation = useMutation({
    mutationFn: async (newUsername) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: profileData.id, user_name: newUsername });
      if (error) {
        throw error;
      }
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] });
      await logNotification('profile', 'Profile Updated', 'Your account details were updated successfully.');
      toast.success("Account settings saved!");
    },
    onError: (error) => {
      if (error.code === '23505') {
        toast.error("Username already taken.");
      } else {
        toast.error("Failed to save account settings.");
      }
    }
  });

  // save preferences
  const prefsMutation = useMutation({
    mutationFn: async (prefs) => {
      const { error } = await supabase
        .from('profiles')
        .upsert({ 
            id: profileData.id, 
            email_notifications: prefs.emailNotifs,
            auto_run_scans: prefs.autoRun,
            confidence_threshold: prefs.threshold
        });
      if (error) throw error;
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['userProfile'] }); 
      await logNotification('profile', 'Preferences Saved', 'Your system preferences have been updated.');
      toast.success("System preferences saved!");
    },
    onError: () => {
      toast.error("Failed to save preferences.");
    }
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-full min-h-[50vh]">
        <Loader2 className="animate-spin text-violet-700" size={32} />
      </div>
    );
  }

  return (
    <>
      <MetaData 
        title="Settings" 
        description="Manage your personal and AI settings." 
      />
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-500 pb-12">
      
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 text-sm mt-1">Personal & AI Settings</p>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex gap-4 items-center">
            <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500">
              <User size={24} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900">Account</h2>
              <p className="text-sm text-slate-500">Manage your profile information</p>
            </div>
          </div>
          <button 
            onClick={() => accountMutation.mutate(username)}
            disabled={accountMutation.isPending}
            className="flex items-center gap-2 px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
          >
            {accountMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
            <input 
              type="email" 
              value={profileData?.email || ''}
              readOnly
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-lg text-slate-500 text-sm focus:outline-none cursor-not-allowed"
              title="Emails must be changed via account verification."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1.5">Display Name</label>
            <input 
              type="text" 
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full p-3 bg-white border border-slate-200 rounded-lg text-slate-800 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="flex gap-4 items-center mb-6">
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500">
            <Bell size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Notifications</h2>
            <p className="text-sm text-slate-500">Control how you receive updates</p>
          </div>
        </div>

        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer group">
            <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900">Email Notifications</span>
            <input 
              type="checkbox" 
              checked={emailNotifs}
              onChange={(e) => setEmailNotifs(e.target.checked)}
              className="w-4 h-4 text-violet-700 bg-slate-100 border-slate-200 rounded focus:ring-violet-500 cursor-pointer"
            />
          </label>
          <hr className="border-slate-100" />
          <div className="flex items-center justify-between group">
            <label htmlFor="autoRunToggle" className="cursor-pointer">
              <span className="text-sm font-medium text-slate-700 group-hover:text-slate-900 block">Auto-run scans after upload</span>
              <span className="text-xs text-slate-500 font-normal">Applies to Single and Batch scans only.</span>
            </label>
            <input 
              id="autoRunToggle"
              type="checkbox" 
              checked={autoRun}
              onChange={(e) => setAutoRun(e.target.checked)}
              className="w-4 h-4 text-violet-700 bg-slate-100 border-slate-200 rounded focus:ring-violet-500 cursor-pointer ml-4"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-100 p-6 md:p-8">
        <div className="flex gap-4 items-center mb-6">
          <div className="w-12 h-12 bg-slate-50 border border-slate-100 rounded-lg flex items-center justify-center text-slate-500">
            <Cpu size={24} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Model & Scan</h2>
            <p className="text-sm text-slate-500">Tune AI scan behavior</p>
          </div>
        </div>

        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-slate-700">Confidence threshold: {threshold}%</label>
          </div>
          <input 
            type="range" 
            min="50" 
            max="100" 
            value={threshold}
            onChange={(e) => setThreshold(parseInt(e.target.value))}
            className="w-full h-2 bg-slate-200 rounded-lg appearance-auto cursor-pointer accent-[#e04f33]"
          />
          <p className="text-xs text-slate-400 mt-3">
            If the AI's confidence falls below this threshold, the scan will be flagged for manual review.
          </p>
        </div>

        <div className="mt-8 flex justify-end">
          <button 
            onClick={() => prefsMutation.mutate({ emailNotifs, autoRun, threshold })}
            disabled={prefsMutation.isPending}
            className="flex items-center gap-2 px-6 py-2.5 bg-violet-700 hover:bg-violet-800 text-white text-sm font-medium rounded-lg transition-colors disabled:opacity-50 cursor-pointer shadow-sm"
          >
            {prefsMutation.isPending ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            Save Settings
          </button>
        </div>
      </div>
    </div>
    </>
  );
};

export default Settings;