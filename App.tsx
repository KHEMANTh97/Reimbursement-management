import { useState, useRef } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import { User } from '../types';
import { Upload, FileText, CheckCircle2, AlertCircle, Loader2, Trash2 } from 'lucide-react';
import { extractExpenseFromReceipt } from '../services/geminiService';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

interface SubmitExpenseProps {
  profile: User | null;
}

export default function SubmitExpense({ profile }: SubmitExpenseProps) {
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [category, setCategory] = useState('Meals');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [receipt, setReceipt] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setOcrLoading(true);
    setError('');
    
    const reader = new FileReader();
    reader.onload = async (event) => {
      const base64 = event.target?.result as string;
      setReceipt(base64);
      const base64Data = base64.split(',')[1];
      
      try {
        const data = await extractExpenseFromReceipt(base64Data, file.type);
        if (data) {
          setAmount(data.amount.toString());
          setCurrency(data.currency);
          setCategory(data.category);
          setDate(data.date);
          setDescription(data.description);
        }
      } catch (err: any) {
        setError('Failed to extract data from receipt. Please enter manually.');
      } finally {
        setOcrLoading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    
    setLoading(true);
    setError('');
    try {
      await addDoc(collection(db, 'expenses'), {
        authorUid: profile.uid,
        amount: parseFloat(amount),
        currency,
        category,
        description,
        date,
        status: 'pending',
        companyId: profile.companyId,
        currentStep: 1,
        createdAt: serverTimestamp(),
        receiptUrl: receipt, // In a real app, upload to storage first
      });
      setSuccess(true);
      setTimeout(() => navigate('/'), 2000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl space-y-12">
      <div className="flex items-center justify-between">
        <h1 className="serif text-4xl font-light">Submit Expense</h1>
        <button className="flex items-center gap-2 bg-[#1a1a1a] px-6 py-2 text-[10px] font-semibold uppercase tracking-widest text-white transition-opacity hover:opacity-90">
          Submit Expense
        </button>
      </div>

      <div className="grid grid-cols-2 gap-12">
        {/* Left: OCR Upload */}
        <div className="space-y-8">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              "group relative flex aspect-video cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed transition-all",
              receipt ? "border-[#1a1a1a] bg-white" : "border-gray-200 bg-gray-50 hover:border-[#1a1a1a]"
            )}
          >
            {receipt ? (
              <img src={receipt} alt="Receipt" className="h-full w-full rounded-2xl object-cover opacity-50" />
            ) : (
              <div className="flex flex-col items-center space-y-4 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white shadow-sm">
                  <Upload className="h-6 w-6 text-gray-400" />
                </div>
                <div className="space-y-1">
                  <p className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]">Scan or Upload Receipt</p>
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">Drag your receipt here or click to browse files</p>
                </div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-[8px] font-bold uppercase tracking-widest text-blue-600">AI-Powered OCR Enabled</span>
              </div>
            )}
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*,application/pdf"
            />
            {ocrLoading && (
              <div className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-white/80">
                <Loader2 className="h-8 w-8 animate-spin text-[#1a1a1a]" />
                <p className="mt-2 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">Analyzing Receipt...</p>
              </div>
            )}
          </div>

          {receipt && (
            <div className="flex items-center justify-between rounded-xl bg-green-50 p-4">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">OCR Scan Successful</p>
                  <p className="text-[8px] font-semibold uppercase tracking-widest text-green-500">Validated against Starbucks Corp.</p>
                </div>
              </div>
              <button onClick={() => setReceipt(null)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          )}

          <div className="space-y-6">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">My Submission History</h2>
            <div className="space-y-4">
              {[
                { merchant: 'Client Dinner - Blue Ginger', date: 'May 12, 2024', amount: '$142.50', status: 'Submitted' },
                { merchant: 'NYC Conference Flight', date: 'May 08, 2024', amount: '$580.00', status: 'Fully Reimbursed' },
              ].map((item, i) => (
                <div key={i} className="flex items-center justify-between border-b border-gray-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded bg-gray-100">
                      <FileText className="h-4 w-4 text-gray-400" />
                    </div>
                    <div>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">{item.merchant}</p>
                      <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-400">{item.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">{item.amount}</p>
                    <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-400">{item.status}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Form */}
        <div className="rounded-2xl bg-white p-8 shadow-sm">
          <h2 className="serif text-xl font-light">Expense Details</h2>
          <form onSubmit={handleSubmit} className="mt-8 space-y-8">
            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Amount</label>
                <div className="flex items-center gap-2 border-b border-gray-200 py-2">
                  <span className="text-sm font-bold text-gray-400">$</span>
                  <input
                    type="number"
                    step="0.01"
                    required
                    className="w-full bg-transparent text-sm font-bold outline-none"
                    placeholder="0.00"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Currency</label>
                <select
                  className="w-full border-b border-gray-200 bg-transparent py-2 text-sm font-bold outline-none"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value)}
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="SGD">SGD - Singapore Dollar</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-8">
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Category</label>
                <select
                  className="w-full border-b border-gray-200 bg-transparent py-2 text-sm font-bold outline-none"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Meals">Meals</option>
                  <option value="Travel">Travel</option>
                  <option value="Supplies">Supplies</option>
                  <option value="Software">Software</option>
                  <option value="Hardware">Hardware</option>
                </select>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Transaction Date</label>
                <input
                  type="date"
                  required
                  className="w-full border-b border-gray-200 bg-transparent py-2 text-sm font-bold outline-none"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Description</label>
              <textarea
                required
                rows={3}
                className="w-full border-b border-gray-200 bg-transparent py-2 text-sm font-bold outline-none"
                placeholder="Describe the purpose of this expense..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            {error && <p className="text-xs text-red-500">{error}</p>}
            {success && <p className="text-xs text-green-500">Expense submitted successfully!</p>}

            <div className="flex gap-4 pt-4">
              <button 
                type="button"
                onClick={() => {
                  setAmount('');
                  setReceipt(null);
                  setDescription('');
                }}
                className="flex-1 border border-gray-200 py-3 text-[10px] font-bold uppercase tracking-widest text-gray-600 hover:bg-gray-50"
              >
                Clear Form
              </button>
              <button
                disabled={loading}
                className="flex-1 bg-[#1a1a1a] py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              >
                {loading ? 'Submitting...' : 'Finalize Submission'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
