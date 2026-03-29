import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, updateDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Expense } from '../types';
import { CheckCircle2, XCircle, Clock, FileText, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../lib/utils';

interface ApprovalsProps {
  profile: User | null;
}

export default function Approvals({ profile }: ApprovalsProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const fetchApprovals = async () => {
      // In a real app, this query would be more complex based on approval rules
      // For now, managers see all pending expenses in their company
      const q = query(
        collection(db, 'expenses'),
        where('companyId', '==', profile.companyId),
        where('status', '==', 'pending')
      );
      const querySnapshot = await getDocs(q);
      const expenseData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(expenseData);
      if (expenseData.length > 0) setSelectedExpense(expenseData[0]);
      setLoading(false);
    };

    fetchApprovals();
  }, [profile]);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedExpense || !profile) return;
    
    setActionLoading(true);
    try {
      const expenseRef = doc(db, 'expenses', selectedExpense.id);
      await updateDoc(expenseRef, {
        status,
        // In a real app, update currentStep and approvalHistory
      });
      
      setExpenses(prev => prev.filter(e => e.id !== selectedExpense.id));
      setSelectedExpense(expenses.find(e => e.id !== selectedExpense.id) || null);
      setComment('');
    } catch (err) {
      console.error(err);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="serif text-4xl font-light">Pending Approvals</h1>
          <p className="text-sm text-gray-500">Review and authorize reimbursement claims from your department.</p>
        </div>
        <div className="flex items-center gap-8">
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total Outstanding</p>
            <p className="serif text-2xl font-light">${expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Queue Count</p>
            <p className="serif text-2xl font-light">{expenses.length} Claims</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-12">
        {/* Left: List */}
        <div className="col-span-1 space-y-4">
          {expenses.map((expense) => (
            <div
              key={expense.id}
              onClick={() => setSelectedExpense(expense)}
              className={cn(
                "cursor-pointer rounded-xl border p-6 transition-all",
                selectedExpense?.id === expense.id
                  ? "border-[#1a1a1a] bg-white shadow-md"
                  : "border-gray-100 bg-white/50 hover:border-gray-200"
              )}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold">
                    {expense.authorUid.charAt(0)}
                  </div>
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">Employee #{expense.authorUid.slice(0, 4)}</p>
                    <p className="text-[8px] font-semibold uppercase tracking-widest text-gray-400">{format(new Date(expense.date), 'MMM dd, yyyy')}</p>
                  </div>
                </div>
                <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[8px] font-bold uppercase tracking-widest text-blue-600">{expense.category}</span>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <p className="serif text-xl font-light">${expense.amount.toLocaleString()}</p>
                <ChevronRight className="h-4 w-4 text-gray-300" />
              </div>
            </div>
          ))}
          {expenses.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 text-center text-gray-400">
              <CheckCircle2 className="mb-4 h-12 w-12 opacity-20" />
              <p className="text-xs font-bold uppercase tracking-widest">Queue Clear</p>
              <p className="text-[10px] uppercase tracking-widest">No pending approvals found.</p>
            </div>
          )}
        </div>

        {/* Right: Details */}
        <div className="col-span-2">
          {selectedExpense ? (
            <div className="rounded-2xl bg-white p-12 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-8">
                <div className="space-y-1">
                  <h2 className="serif text-3xl font-light">Review Pending: Claim #{selectedExpense.id.slice(0, 6)}</h2>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Submitted 2 hours ago by Employee</p>
                </div>
                <div className="flex gap-2">
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 text-gray-400 hover:bg-gray-50">
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <button className="flex h-10 w-10 items-center justify-center rounded-full border border-gray-100 text-gray-400 hover:bg-gray-50">
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="space-y-2">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Documentation</p>
                    <div className="group relative aspect-video overflow-hidden rounded-xl bg-gray-50">
                      {selectedExpense.receiptUrl ? (
                        <img src={selectedExpense.receiptUrl} alt="Receipt" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <FileText className="h-12 w-12 text-gray-200" />
                        </div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
                        <button className="flex items-center gap-2 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">
                          View Full Receipt
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-3 rounded-xl bg-blue-50 p-4">
                      <ShieldCheck className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">Workflow Intelligence</p>
                        <p className="text-[8px] font-semibold uppercase tracking-widest text-blue-500">Policy Validation: Passed automatically via AI audit.</p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Compliance Checklist</p>
                      <ul className="space-y-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600">
                        <li className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-green-500" />
                          Itemized receipts required for all expenses over $25.00
                        </li>
                        <li className="flex items-center gap-2">
                          <div className="h-1 w-1 rounded-full bg-green-500" />
                          Travel expenses must be within the $450/day cap for Tier 1 cities.
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="space-y-8">
                  <div className="space-y-4">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Manager Decision</p>
                    <textarea
                      rows={4}
                      className="w-full rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs outline-none focus:border-[#1a1a1a]"
                      placeholder="Add a comment for the employee..."
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAction('rejected')}
                      className="border border-gray-200 py-4 text-[10px] font-bold uppercase tracking-widest text-red-600 hover:bg-red-50 disabled:opacity-50"
                    >
                      Reject Claim
                    </button>
                    <button
                      disabled={actionLoading}
                      onClick={() => handleAction('approved')}
                      className="bg-[#1a1a1a] py-4 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      Approve Claim
                    </button>
                  </div>

                  <div className="rounded-xl bg-gray-50 p-6">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Q4 Budget Remaining</p>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">$42,800</p>
                    </div>
                    <div className="mt-3 h-1.5 w-full rounded-full bg-gray-200">
                      <div className="h-full w-[65%] rounded-full bg-[#1a1a1a]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex h-full items-center justify-center rounded-2xl border-2 border-dashed border-gray-100 bg-white/50">
              <div className="text-center text-gray-400">
                <Clock className="mx-auto mb-4 h-12 w-12 opacity-20" />
                <p className="text-xs font-bold uppercase tracking-widest">Select a claim to review</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
