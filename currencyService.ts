import { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { LogIn, ShieldCheck } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-[#f5f2ed]">
      {/* Left Side: Branding */}
      <div className="hidden w-1/2 flex-col justify-between bg-[#1a1a1a] p-16 text-white lg:flex">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-8 w-8 text-[#f5f2ed]" />
          <span className="text-xl font-semibold tracking-tight">Institutional Ledger</span>
        </div>
        <div>
          <h1 className="serif text-6xl font-light leading-tight">
            Elevated Financial <br />
            Integrity for the <br />
            Modern Enterprise.
          </h1>
          <div className="mt-12 space-y-6 text-sm text-gray-400">
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
              <span>Audit-Ready Compliance</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="h-1.5 w-1.5 rounded-full bg-gray-500" />
              <span>Instant Disbursement</span>
            </div>
          </div>
        </div>
        <div className="text-xs text-gray-500">
          © 2024 INSTITUTIONAL LEDGER. ALL RIGHTS RESERVED.
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="serif text-4xl font-light">Welcome Back</h2>
            <p className="text-sm text-gray-500">Access your organizational portal to manage reimbursements.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Corporate Email</label>
              <input
                type="email"
                required
                className="w-full border-b border-gray-300 bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#1a1a1a]"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Security Code</label>
                <Link to="#" className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-[#1a1a1a]">Forgot Access?</Link>
              </div>
              <input
                type="password"
                required
                className="w-full border-b border-gray-300 bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#1a1a1a]"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}

            <button
              disabled={loading}
              className="flex w-full items-center justify-center gap-2 bg-[#1a1a1a] py-3 text-xs font-semibold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {loading ? 'Authenticating...' : (
                <>
                  <LogIn className="h-4 w-4" />
                  Authenticate Access
                </>
              )}
            </button>
          </form>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-[10px] font-semibold uppercase tracking-widest text-gray-400">
              <span className="bg-[#f5f2ed] px-2">Or Initiate New Partnership</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <button className="flex items-center justify-center gap-2 border border-gray-200 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600 hover:bg-gray-50">
              Join Team
            </button>
            <Link to="/signup" className="flex items-center justify-center gap-2 border border-gray-200 py-3 text-[10px] font-semibold uppercase tracking-widest text-gray-600 hover:bg-gray-50">
              Create Company
            </Link>
          </div>

          <div className="flex justify-center gap-8 pt-8 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-gray-300" />
              256-BIT ENCRYPTED
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1 w-1 rounded-full bg-gray-300" />
              SSO SUPPORTED
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
