import React, { useState } from 'react';
import { auth, googleProvider, db, handleFirestoreError, OperationType } from '../firebase';
import { signInWithPopup, GoogleAuthProvider } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp, collection, getDocFromServer } from 'firebase/firestore';
import { motion } from 'motion/react';
import { LogIn, Building2, ShieldCheck, UserCircle } from 'lucide-react';
import { getCountries, CountryData } from '../services/currencyService';

interface AuthProps {
  onAuthSuccess: (user: any) => void;
}

export default function Auth({ onAuthSuccess }: AuthProps) {
  const [loading, setLoading] = useState(false);
  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [countries, setCountries] = useState<CountryData[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<CountryData | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      const userDoc = await getDoc(doc(db, 'users', user.uid)).catch(e => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`));
      
      if (userDoc.exists()) {
        onAuthSuccess(userDoc.data());
      } else {
        // First login
        setCurrentUser(user);
        const fetchedCountries = await getCountries();
        setCountries(fetchedCountries);
        setShowCompanySetup(true);
      }
    } catch (error) {
      console.error("Login Error:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCompanySetup = async () => {
    if (!selectedCountry || !companyName || !currentUser) return;
    
    setLoading(true);
    try {
      const companyId = doc(collection(db, 'companies')).id;
      const companyPath = `companies/${companyId}`;
      const companyData = {
        name: companyName,
        country: selectedCountry.name,
        currency: selectedCountry.currencyCode,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'companies', companyId), companyData).catch(e => handleFirestoreError(e, OperationType.WRITE, companyPath));
      
      const userPath = `users/${currentUser.uid}`;
      const userData = {
        uid: currentUser.uid,
        name: currentUser.displayName || 'Admin',
        email: currentUser.email,
        role: 'admin',
        companyId: companyId,
        managerId: null,
        createdAt: serverTimestamp(),
      };
      
      await setDoc(doc(db, 'users', currentUser.uid), userData).catch(e => handleFirestoreError(e, OperationType.WRITE, userPath));
      
      // Default approval flow
      const flowPath = `approvalFlows/${companyId}`;
      await setDoc(doc(db, 'approvalFlows', companyId), {
        companyId,
        steps: [{ role: 'manager', userId: null, isManager: true }],
        rules: { type: 'percentage', value: 100 },
        createdAt: serverTimestamp(),
      }).catch(e => handleFirestoreError(e, OperationType.WRITE, flowPath));
      
      onAuthSuccess(userData);
    } catch (error) {
      console.error("Setup Error:", error);
    } finally {
      setLoading(false);
    }
  };

  if (showCompanySetup) {
    return (
      <div className="min-h-screen bg-[#0a0502] flex items-center justify-center p-4">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-md w-full bg-[#151619] border border-[#2a2b2e] rounded-2xl p-8 shadow-2xl"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-3 bg-[#3a1510] rounded-xl">
              <Building2 className="w-6 h-6 text-[#ff4e00]" />
            </div>
            <h2 className="text-2xl font-bold text-white">Setup Company</h2>
          </div>
          
          <p className="text-gray-400 mb-8">Welcome! Since this is your first login, let's set up your organization.</p>
          
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Company Name</label>
              <input 
                type="text" 
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                className="w-full bg-[#0a0502] border border-[#2a2b2e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff4e00] transition-colors"
                placeholder="Acme Corp"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">Country (Sets Default Currency)</label>
              <select 
                onChange={(e) => {
                  const country = countries.find(c => c.name === e.target.value);
                  setSelectedCountry(country || null);
                }}
                className="w-full bg-[#0a0502] border border-[#2a2b2e] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff4e00] transition-colors"
              >
                <option value="">Select a country</option>
                {countries.map(country => (
                  <option key={country.name} value={country.name}>
                    {country.name} ({country.currencyCode})
                  </option>
                ))}
              </select>
            </div>
            
            <button 
              onClick={handleCompanySetup}
              disabled={loading || !companyName || !selectedCountry}
              className="w-full py-4 bg-[#ff4e00] hover:bg-[#e64600] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ff4e00]/20 flex items-center justify-center gap-2"
            >
              {loading ? "Setting up..." : "Complete Setup"}
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0502] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Atmospheric Background */}
      <div className="absolute inset-0 atmosphere pointer-events-none" />
      
      <div className="max-w-6xl w-full grid md:grid-cols-2 gap-12 items-center relative z-10">
        <div className="text-left">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex items-center gap-2 mb-6">
              <div className="w-10 h-10 bg-[#ff4e00] rounded-lg flex items-center justify-center">
                <ShieldCheck className="text-white w-6 h-6" />
              </div>
              <span className="text-white font-bold text-xl tracking-tight">Institutional Ledger</span>
            </div>
            <h1 className="text-6xl font-light text-white leading-tight mb-6">
              Elevated Financial <br />
              <span className="font-bold text-[#ff4e00]">Integrity</span> for the <br />
              Modern Enterprise.
            </h1>
            <div className="space-y-4 text-gray-400 max-w-md">
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-[#ff4e00] rounded-full" />
                <p>Audit-Ready Compliance with architectural precision.</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-1.5 h-1.5 bg-[#ff4e00] rounded-full" />
                <p>Instant Disbursement workflows that prioritize speed.</p>
              </div>
            </div>
          </motion.div>
        </div>

        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-[#151619]/80 backdrop-blur-xl border border-white/10 rounded-3xl p-10 shadow-2xl"
        >
          <div className="mb-10">
            <h2 className="text-3xl font-bold text-white mb-2">Welcome Back</h2>
            <p className="text-gray-400">Access your organizational portal to manage reimbursements.</p>
          </div>

          <div className="space-y-6">
            <button 
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full py-4 bg-white hover:bg-gray-100 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-3 shadow-xl"
            >
              {loading ? (
                <div className="w-6 h-6 border-2 border-black/20 border-t-black rounded-full animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Sign in with Google
                </>
              )}
            </button>
            
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-white/10"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-[#151619] px-2 text-gray-500">Or initiate new partnership</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleGoogleLogin}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2 group"
              >
                <UserCircle className="w-6 h-6 text-gray-400 group-hover:text-[#ff4e00] transition-colors" />
                <span className="text-xs font-medium text-gray-400">Join Team</span>
              </button>
              <button 
                onClick={handleGoogleLogin}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors flex flex-col items-center gap-2 group"
              >
                <Building2 className="w-6 h-6 text-gray-400 group-hover:text-[#ff4e00] transition-colors" />
                <span className="text-xs font-medium text-gray-400">Create Company</span>
              </button>
            </div>
          </div>

          <div className="mt-10 flex justify-center gap-6 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
            <span>256-bit Encrypted</span>
            <span>SSO Supported</span>
          </div>
        </motion.div>
      </div>

      <style>{`
        .atmosphere {
          background: 
            radial-gradient(circle at 50% 30%, #3a1510 0%, transparent 60%),
            radial-gradient(circle at 10% 80%, #ff4e00 0%, transparent 50%);
          filter: blur(80px);
          opacity: 0.4;
        }
      `}</style>
    </div>
  );
}

// Helper to handle collection import
// (Removed duplicate import)
