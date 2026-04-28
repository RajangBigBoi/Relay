import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db, createUserWithEmailAndPassword, updateProfile } from '../lib/firebase';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, AlertCircle, Loader2, X, Building2, Briefcase } from 'lucide-react';

export function CreateAccountPage() {
  const [step, setStep] = useState<'details' | 'verify'>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [generatedCode, setGeneratedCode] = useState('');
  const navigate = useNavigate();

  const handleInitiateSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password.length < 6) {
      return setError("Password must be at least 6 characters.");
    }
    
    // Generate a 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedCode(code);
    
    // In a real app, this is where we'd call an API to send the email.
    // For this environment, we'll log it and move to the next step.
    console.log(`[RELAY] Verification code for ${email}: ${code}`);
    setStep('verify');
  };

  const handleFinalizeSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (verificationCode !== generatedCode) {
      return setError("Invalid verification code. Please check your email (or console for demo).");
    }

    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(userCredential.user, { displayName: name });
      
      // AuthContext will automatically detect the new user and bootstrap the profile record
      navigate('/app/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/operation-not-allowed') {
        setError("Sign-in with Email/Password is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.");
      } else if (err.message?.includes('network-request-failed')) {
        setError("Firebase connection error. Please refresh and try again or check your internet.");
      } else {
        setError(err.message || "Registration failed. Please try again.");
      }
      setLoading(false);
    }
  };

  if (step === 'verify') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full bg-white border border-slate-200 p-8 lg:p-12 rounded-3xl shadow-xl shadow-slate-200/50 relative text-center"
        >
          <div className="mb-6 p-4 bg-slate-900 rounded-2xl inline-block mx-auto">
            <Mail className="w-8 h-8 text-white" />
          </div>
          
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Verify your email</h2>
          <p className="text-sm text-slate-500 mb-8 px-4">
            We've sent a 6-digit verification code to <br/>
            <span className="font-bold text-slate-900 break-all">{email}</span>
          </p>

          <AnimatePresence mode="wait">
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-start gap-3 text-red-600 text-[11px] font-semibold mb-6 text-left"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl text-blue-700 text-[10px] font-bold uppercase tracking-widest mb-8">
             Demo Mode: Verification code is {generatedCode}
          </div>

          <form onSubmit={handleFinalizeSignUp} className="space-y-6">
            <div className="relative group">
              <input 
                type="text" 
                maxLength={6}
                required
                autoFocus
                className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-2 py-5 text-center text-3xl font-black tracking-[0.2em] text-slate-900 focus:outline-none focus:ring-4 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder:text-slate-200 sm:tracking-[0.5em]"
                placeholder="000000"
                value={verificationCode}
                onChange={e => setVerificationCode(e.target.value.replace(/\D/g, ''))}
              />
            </div>

            <button
              type="submit"
              disabled={loading || verificationCode.length < 6}
              className="w-full bg-slate-900 text-white py-4 px-6 rounded-xl font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed h-14 flex items-center justify-center translate-z-0"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Verify & Create Account"}
            </button>
          </form>

          <button 
            onClick={() => {
              setStep('details');
              setError('');
            }}
            className="mt-8 text-sm text-slate-500 hover:text-slate-900 font-bold transition-colors block w-full text-center"
          >
            Go back to details
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6 font-sans">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-xl w-full bg-white border border-slate-200 p-8 lg:p-12 rounded-3xl shadow-xl shadow-slate-200/50 relative"
      >
        <button 
          onClick={() => navigate('/')}
          className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-900 hover:bg-slate-50 rounded-full transition-all"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center space-y-2 mb-10">
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Create account</h1>
          <p className="text-slate-500 text-sm">Set up your Relay access.</p>
        </div>

        <form onSubmit={handleInitiateSignUp} className="space-y-6">
          {error && (
            <motion.div 
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              className="p-4 bg-red-50 border border-red-100 rounded-xl flex items-center gap-3 text-red-600 text-xs font-semibold"
            >
              <AlertCircle className="w-4 h-4 shrink-0" />
              {error}
            </motion.div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Full name</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="text" 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder-slate-400"
                  placeholder="John Doe"
                  value={name}
                  onChange={e => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Email address</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input 
                  type="email" 
                  required
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder-slate-400"
                  placeholder="name@hotel.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                />
              </div>
            </div>
          </div>
          
          <div className="space-y-2 group">
            <label className="text-xs font-bold text-slate-700 ml-1 uppercase tracking-wider">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input 
                type="password" 
                required
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-12 pr-4 py-3.5 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-slate-900/5 focus:border-slate-900 transition-all placeholder-slate-400"
                placeholder="Choose a strong password"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-4 px-6 rounded-xl font-bold text-sm tracking-wide hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 h-14 flex items-center justify-center mt-4"
          >
            Continue & Send Code
          </button>
        </form>

        <p className="text-center text-sm text-slate-500 mt-10">
          Already have an account? <Link to="/login" state={{ manual: true }} className="text-slate-900 font-bold hover:underline">Sign in</Link>
        </p>
      </motion.div>
    </div>
  );
}
