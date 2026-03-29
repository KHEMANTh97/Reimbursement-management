import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Upload, 
  FileText, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  X,
  Receipt,
  Calendar,
  DollarSign,
  Tag,
  ChevronRight,
  ArrowRight
} from 'lucide-react';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { extractExpenseFromReceipt } from '../services/geminiService';
import { toast } from 'sonner';

interface ExpenseFormProps {
  user: any;
  company: any;
  initialFile?: File | null;
  onSuccess: () => void;
}

export default function ExpenseForm({ user, company, initialFile, onSuccess }: ExpenseFormProps) {
  const [loading, setLoading] = useState(false);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [file, setFile] = useState<File | null>(initialFile || null);
  const [preview, setPreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    amount: '',
    currency: company.currency,
    category: 'Travel',
    description: '',
    date: new Date().toISOString().split('T')[0],
    merchantName: ''
  });

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialFile) {
      processFile(initialFile);
    }
  }, [initialFile]);

  const processFile = (selectedFile: File) => {
    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreview(reader.result as string);
      handleOCR(reader.result as string, selectedFile.type);
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;
    processFile(selectedFile);
  };

  const handleOCR = async (base64: string, mimeType: string) => {
    setOcrLoading(true);
    try {
      const base64Data = base64.split(',')[1];
      const result = await extractExpenseFromReceipt(base64Data, mimeType);
      if (result) {
        setFormData({
          amount: result.amount.toString(),
          currency: result.currency || company.currency,
          category: result.category || 'Travel',
          description: result.description || '',
          date: result.date || new Date().toISOString().split('T')[0],
          merchantName: result.merchantName || ''
        });
      }
    } catch (error) {
      console.error("OCR Error:", error);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const expenseData = {
        ...formData,
        amount: parseFloat(formData.amount),
        employeeId: user.uid,
        companyId: user.companyId,
        status: 'pending',
        currentStep: 0,
        createdAt: serverTimestamp(),
        receiptUrl: preview // In a real app, upload to Firebase Storage
      };
      
      const expensePath = 'expenses';
      await addDoc(collection(db, 'expenses'), expenseData).catch(e => handleFirestoreError(e, OperationType.CREATE, expensePath));
      toast.success('Expense submitted successfully!');
      onSuccess();
    } catch (error) {
      console.error("Submit Error:", error);
      toast.error('Failed to submit expense. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold text-white">Submit Expense</h2>
        <button onClick={onSuccess} className="p-2 hover:bg-white/5 rounded-full transition-colors">
          <X className="w-6 h-6 text-gray-500" />
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upload Section */}
        <div className="space-y-6">
          <div className="bg-[#151619] border border-white/5 rounded-2xl p-8 flex flex-col items-center justify-center text-center relative overflow-hidden group min-h-[400px]">
            {preview ? (
              <div className="relative w-full h-full flex flex-col items-center">
                <img src={preview} alt="Receipt" className="max-h-[300px] rounded-xl object-contain mb-4" />
                <button 
                  onClick={() => { setFile(null); setPreview(null); }}
                  className="absolute top-0 right-0 p-2 bg-red-500 text-white rounded-full shadow-lg"
                >
                  <X className="w-4 h-4" />
                </button>
                {ocrLoading && (
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex flex-col items-center justify-center rounded-xl">
                    <Loader2 className="w-10 h-10 text-[#ff4e00] animate-spin mb-4" />
                    <p className="text-sm font-bold text-white">AI-Powered OCR Enabled</p>
                    <p className="text-xs text-gray-400">Extracting details from your receipt...</p>
                  </div>
                )}
                {!ocrLoading && (
                  <div className="flex items-center gap-2 text-green-500 font-bold text-sm bg-green-500/10 px-4 py-2 rounded-full">
                    <CheckCircle2 className="w-4 h-4" />
                    OCR Scan Successful
                  </div>
                )}
              </div>
            ) : (
              <>
                <div className="w-20 h-20 bg-[#ff4e00]/10 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <Upload className="w-10 h-10 text-[#ff4e00]" />
                </div>
                <h3 className="text-xl font-bold text-white mb-2">Scan or Upload Receipt</h3>
                <p className="text-gray-500 mb-8 max-w-xs">Drag your receipt here or click to browse files. AI will auto-fill the details.</p>
                <input 
                  type="file" 
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*,application/pdf"
                  className="hidden"
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="px-8 py-3 bg-white text-black font-bold rounded-xl hover:bg-gray-100 transition-all shadow-xl"
                >
                  Browse Files
                </button>
                <div className="mt-8 flex items-center gap-2 text-[10px] text-gray-600 uppercase tracking-widest font-bold">
                  <ShieldCheck className="w-3 h-3" />
                  AI-Powered OCR Enabled
                </div>
              </>
            )}
          </div>

          <div className="bg-[#151619] border border-white/5 rounded-2xl p-6">
            <h4 className="text-sm font-bold text-white mb-4 uppercase tracking-widest">Compliance Checklist</h4>
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Itemized receipts required for all expenses over $25.00
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <CheckCircle2 className="w-4 h-4 text-green-500" />
                Travel expenses must be within the $450/day cap for Tier 1 cities.
              </div>
              <div className="flex items-center gap-3 text-xs text-gray-400">
                <AlertCircle className="w-4 h-4 text-red-500" />
                Alcohol is strictly non-reimbursable unless client-facing.
              </div>
            </div>
          </div>
        </div>

        {/* Right: Form Section */}
        <form onSubmit={handleSubmit} className="bg-[#151619] border border-white/5 rounded-2xl p-8 space-y-6">
          <h3 className="text-xl font-bold text-white mb-6">Expense Details</h3>
          
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Amount</label>
              <div className="relative">
                <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="number" 
                  step="0.01"
                  required
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full bg-[#0a0502] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#ff4e00] transition-colors"
                  placeholder="0.00"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Currency</label>
              <input 
                type="text" 
                required
                value={formData.currency}
                onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                className="w-full bg-[#0a0502] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff4e00] transition-colors"
                placeholder="USD"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</label>
              <select 
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full bg-[#0a0502] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff4e00] transition-colors"
              >
                <option value="Travel">Travel</option>
                <option value="Meals">Meals</option>
                <option value="Software">Software</option>
                <option value="Hardware">Hardware</option>
                <option value="General">General</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Transaction Date</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                <input 
                  type="date" 
                  required
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full bg-[#0a0502] border border-white/5 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-[#ff4e00] transition-colors"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
            <textarea 
              required
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full bg-[#0a0502] border border-white/5 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-[#ff4e00] transition-colors min-h-[120px]"
              placeholder="Describe the purpose of this expense..."
            />
          </div>

          <div className="pt-6 flex gap-4">
            <button 
              type="button"
              onClick={() => setFormData({ amount: '', currency: company.currency, category: 'Travel', description: '', date: new Date().toISOString().split('T')[0], merchantName: '' })}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-xl transition-all"
            >
              Clear Form
            </button>
            <button 
              type="submit"
              disabled={loading || ocrLoading}
              className="flex-[2] py-4 bg-[#ff4e00] hover:bg-[#e64600] disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ff4e00]/20 flex items-center justify-center gap-2"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-5 h-5" />}
              Finalize Submission
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

import { ShieldCheck } from 'lucide-react';
