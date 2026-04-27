import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { motion, AnimatePresence } from 'framer-motion';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-bg-dark flex items-center justify-center p-8">
        <div className="space-y-4 text-center">
          <h1 className="text-5xl font-display font-black tracking-tighter text-white animate-pulse">RELAY</h1>
          <div className="w-48 h-1 bg-white/5 rounded-full overflow-hidden mx-auto">
            <motion.div 
              className="h-full bg-white"
              animate={{ x: [-200, 200] }}
              transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
            />
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
