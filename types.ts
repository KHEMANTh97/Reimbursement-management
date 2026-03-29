import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, addDoc } from 'firebase/firestore';
import { useNavigate, Link } from 'react-router-dom';
import { auth, db } from '../firebase';
import { ShieldCheck, UserPlus } from 'lucide-react';

export default function Signup() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('');
  const [countries, setCountries] = useState<any[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,currencies')
      .then(res => res.json())
      .then(data => {
        const sorted = data.sort((a: any, b: any) => a.name.common.localeCompare(b.name.common));
        setCountries(sorted);
      });
  }, []);

  const handleCountryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selected = countries.find(c => c.name.common === e.target.value);
    setCountry(e.target.value);
    if (selected && selected.currencies) {
      const firstCurrency = Object.keys(selected.currencies)[0];
      setCurrency(firstCurrency);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create Company
      const companyRef = await addDoc(collection(db, 'companies'), {
        name: companyName,
        currency,
        country,
        adminUid: user.uid,
      });

      // Create User Profile
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        name,
        email,
        role: 'admin',
        companyId: companyRef.id,
      });

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
            Establish Your <br />
            Corporate <br />
            Infrastructure.
          </h1>
          <p className="mt-6 max-w-md text-sm text-gray-400">
            Join the modern enterprise standard for financial integrity and automated reimbursement management.
          </p>
        </div>
        <div className="text-xs text-gray-500">
          © 2024 INSTITUTIONAL LEDGER. ALL RIGHTS RESERVED.
        </div>
      </div>

      {/* Right Side: Form */}
      <div className="flex w-full items-center justify-center p-8 lg:w-1/2">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-2">
            <h2 className="serif text-4xl font-light">Create Company</h2>
            <p className="text-sm text-gray-500">Initialize your organization's ledger and admin account.</p>
          </div>

          <form onSubmit={handleSignup} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Admin Name</label>
                <input
                  type="text"
                  required
                  className="w-full border-b border-gray-300 bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#1a1a1a]"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
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
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Company Name</label>
              <input
                type="text"
                required
                className="w-full border-b border-gray-300 bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#1a1a1a]"
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Country</label>
                <select
                  required
                  className="w-full border-b border-gray-300 bg-transparent py-2 text-sm outline-none transition-colors focus:border-[#1a1a1a]"
                  value={country}
                  onChange={handleCountryChange}
                >
                  <option value="">Select Country</option>
                  {countries.map((c: any) => (
                    <option key={c.name.common} value={c.name.common}>{c.name.common}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Default Currency</label>
                <input
                  type="text"
                  readOnly
                  className="w-full border-b border-gray-300 bg-transparent py-2 text-sm outline-none"
                  placeholder="USD"
                  value={currency}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Security Code (Password)</label>
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
              {loading ? 'Initializing...' : (
                <>
                  <UserPlus className="h-4 w-4" />
                  Create Company
                </>
              )}
            </button>
          </form>

          <div className="text-center">
            <Link to="/login" className="text-[10px] font-semibold uppercase tracking-widest text-gray-400 hover:text-[#1a1a1a]">
              Already have an account? Authenticate
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
