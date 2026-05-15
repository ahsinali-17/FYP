import React, { useState } from 'react';
import { supabase } from '../supabase';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import MetaData from '../components/MetaData';

const Login = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false);
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [userName, setUserName] = useState('');
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      toast.error("Error logging in with Google: " + error.message);
    }
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        else toast.success("User Registration successful!");

        if (data.user) {
          await supabase.from('profiles').upsert({
            id: data.user.id,
            email: email,
            user_name: userName,
          });
        }
        setIsSignUp(false);
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        
        navigate('/');
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
    <MetaData 
        title="Login" 
        description="Sign in to your ScreenSense AI account." 
      />
    <div className="min-h-screen flex bg-slate-50">
      <ToastContainer position="top-right" theme="dark" autoClose={2000} />
      
      {/* Left Side*/}
      <div className="hidden lg:flex w-1/2 bg-slate-900 text-white flex-col justify-center px-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top,var(--tw-gradient-stops))] from-violet-700 via-slate-900 to-slate-900"></div>
        <div className="z-10">
          <img src="/logo.webp" alt="Logo" className="w-16 h-16 rounded-full border-2 border-violet-500 object-contain mb-8" />
          <h1 className="text-4xl font-bold mb-4">ScreenSense AI</h1>
          <p className="text-slate-400 text-lg max-w-md">
            Automate your defect detection process with our AI-driven analytics platform. 
          </p>
        </div>
      </div>

      {/* Right Side*/}
      <div className="w-full lg:w-1/2 flex flex-col justify-center items-center p-6 md:p-12">
        
        {/* Mobile Header*/}
        <div className="lg:hidden flex flex-col items-center mb-8 text-center">
            <img src="/logo.png" alt="Logo" className="w-16 h-16 rounded-full border-2 border-violet-500 object-cover mb-4" />
            <h1 className="text-2xl font-bold text-slate-900">ScreenSense AI</h1>
            <p className="text-slate-500 text-sm mt-2">AI-driven defect detection</p>
        </div>

        <div className="w-full max-w-md bg-white md:bg-transparent p-6 md:p-0 rounded-2xl md:rounded-none shadow-sm md:shadow-none border border-slate-100 md:border-none">
          <div className="mb-8 text-center md:text-left">
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-2">
              {isSignUp ? 'Create Account' : 'Welcome Back'}
            </h2>
            <p className="text-slate-500 text-sm md:text-base">
              {isSignUp ? 'Enter your details to get started.' : 'Please enter your credentials to sign in.'}
            </p>
          </div>

          <button
           onClick={handleGoogleLogin}
           type="button"
           className="w-full mb-6 py-3 bg-white border border-slate-200 text-slate-700 font-semibold rounded-lg hover:bg-slate-50 hover:border-slate-200 transition-all flex items-center justify-center gap-3 shadow-sm cursor-pointer"
          >
            <img src="/google.svg" alt="Google" className="w-5 h-5" />
            Sign in with Google
          </button>

         <div className="relative mb-6">
           <div className="absolute inset-0 flex items-center">
             <div className="w-full border-t border-slate-200"></div>
           </div>
           <div className="relative flex justify-center text-sm">
             <span className="px-2 bg-white (md:bg-slate-50) text-slate-500">Or continue with email</span>
           </div>
         </div>

          {/* Form */}
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Username</label>
                <input
                  type="text"
                  required
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                  placeholder="Your username"
                />
              </div>
            )}
            
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Email Address</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                placeholder="abc123@gmail.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-violet-500 focus:border-violet-500 outline-none transition-all"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-3 bg-red-100 text-red-600 text-sm rounded-lg"
              >
                {error}
              </motion.div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-violet-700 hover:bg-violet-800 text-white font-semibold rounded-lg shadow-lg shadow-violet-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              {loading && <Loader2 className="animate-spin" size={20} />}
              {isSignUp ? 'Create Account' : 'Sign In'}
            </button>
          </form>

          <p className="mt-6 text-center text-slate-600">
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-violet-700 font-semibold hover:underline cursor-pointer"
            >
              {isSignUp ? 'Log in' : 'Sign up'}
            </button>
          </p>
        </div>
      </div>
    </div>
    </>
  );
};

export default Login;



