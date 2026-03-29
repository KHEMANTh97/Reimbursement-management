import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CheckCircle2, 
  XCircle, 
  MessageSquare, 
  FileText, 
  ExternalLink, 
  Clock, 
  ArrowRight,
  ChevronDown,
  ChevronUp,
  User,
  Tag,
  DollarSign
} from 'lucide-react';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, addDoc, serverTimestamp, getDoc } from 'firebase/firestore';

interface ApprovalQueueProps {
  user: any;
  company: any;
}

export default function ApprovalQueue({ user, company }: ApprovalQueueProps) {
  const [pendingExpenses, setPendingExpenses] = useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // In a real app, this would be more complex to handle multi-level flows
    // For now, we'll show expenses where the current user is the manager or admin
    const q = query(
      collection(db, 'expenses'),
      where('companyId', '==', user.companyId),
      where('status', '==', 'pending')
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const expenses = await Promise.all(snapshot.docs.map(async (d) => {
        const data = d.data();
        const employeePath = `users/${data.employeeId}`;
        const employeeDoc = await getDoc(doc(db, 'users', data.employeeId)).catch(e => handleFirestoreError(e, OperationType.GET, employeePath));
        return { 
          id: d.id, 
          ...data, 
          employee: (employeeDoc && employeeDoc.exists()) ? employeeDoc.data() : { name: 'Unknown' } 
        };
      }));

      // Filter based on role and manager relationship
      const filtered = expenses.filter(e => {
        if (user.role === 'admin') return true;
        if (user.role === 'manager') {
          return e.employee.managerId === user.uid;
        }
        return false;
      });

      setPendingExpenses(filtered);
    }, (e) => handleFirestoreError(e, OperationType.LIST, 'expenses'));

    return () => unsubscribe();
  }, [user.companyId, user.role, user.uid]);

  const handleAction = async (status: 'approved' | 'rejected') => {
    if (!selectedExpense) return;
    setLoading(true);
    try {
      // Update expense status
      const expensePath = `expenses/${selectedExpense.id}`;
      await updateDoc(doc(db, 'expenses', selectedExpense.id), {
        status: status,
        updatedAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, OperationType.UPDATE, expensePath));

      // Create approval request record
      const requestPath = 'approvalRequests';
      await addDoc(collection(db, 'approvalRequests'), {
        expenseId: selectedExpense.id,
        approverId: user.uid,
        status: status,
        comments: comment,
        stepNumber: selectedExpense.currentStep,
        createdAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, requestPath));

      setSelectedExpense(null);
      setComment('');
    } catch (error) {
      console.error("Action Error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Pending Approvals</h1>
          <p className="text-gray-400">Review and authorize reimbursement claims from your department.</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Queue Count</p>
            <p className="text-lg font-bold text-white">{pendingExpenses.length} Claims</p>
          </div>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
            <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Avg. Turnaround</p>
            <p className="text-lg font-bold text-[#ff4e00]">4.2 Hours</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* List View */}
        <div className="lg:col-span-2 space-y-4">
          {pendingExpenses.map((expense) => (
            <motion.div 
              key={expense.id}
              layoutId={expense.id}
              onClick={() => setSelectedExpense(expense)}
              className={`bg-[#151619] border rounded-2xl p-6 cursor-pointer transition-all hover:border-[#ff4e00]/50 ${
                selectedExpense?.id === expense.id ? 'border-[#ff4e00] ring-1 ring-[#ff4e00]/20' : 'border-white/5'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center font-bold text-gray-400">
                    {expense.employee.name[0]}
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-white">{expense.employee.name}</h4>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Submitted {expense.date}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold text-white">{expense.currency} {expense.amount.toLocaleString()}</p>
                  <span className="px-2 py-0.5 bg-blue-500/10 text-blue-500 text-[10px] font-bold rounded-full uppercase tracking-widest">
                    {expense.category}
                  </span>
                </div>
              </div>
              <p className="text-sm text-gray-400 line-clamp-1 mb-4">{expense.description}</p>
              <div className="flex items-center justify-between pt-4 border-t border-white/5">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <FileText className="w-3 h-3" />
                    Receipt Attached
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                    <Clock className="w-3 h-3" />
                    Step 1 of 2
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-600" />
              </div>
            </motion.div>
          ))}
          {pendingExpenses.length === 0 && (
            <div className="bg-[#151619] border border-dashed border-white/10 rounded-2xl p-12 text-center">
              <CheckCircle2 className="w-12 h-12 text-gray-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-white mb-2">Queue Clear</h3>
              <p className="text-gray-500">All reimbursement claims have been processed.</p>
            </div>
          )}
        </div>

        {/* Detail View */}
        <AnimatePresence mode="wait">
          {selectedExpense ? (
            <motion.div 
              key="detail"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="bg-[#151619] border border-white/5 rounded-2xl p-8 sticky top-8 h-fit space-y-8"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-white">Review Claim</h3>
                <button onClick={() => setSelectedExpense(null)} className="p-2 hover:bg-white/5 rounded-full">
                  <XCircle className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 bg-white/5 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-[#ff4e00]/10 flex items-center justify-center text-[#ff4e00] font-bold">
                    {selectedExpense.employee.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-white">{selectedExpense.employee.name}</p>
                    <p className="text-xs text-gray-500">{selectedExpense.employee.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Amount</p>
                    <p className="text-lg font-bold text-white">{selectedExpense.currency} {selectedExpense.amount.toLocaleString()}</p>
                  </div>
                  <div className="p-4 bg-white/5 rounded-xl">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mb-1">Category</p>
                    <p className="text-lg font-bold text-[#ff4e00]">{selectedExpense.category}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Description</p>
                  <p className="text-sm text-gray-300 leading-relaxed">{selectedExpense.description}</p>
                </div>

                {selectedExpense.receiptUrl && (
                  <div className="space-y-2">
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Documentation</p>
                    <div className="relative group cursor-pointer">
                      <img src={selectedExpense.receiptUrl} alt="Receipt" className="w-full rounded-xl border border-white/10" />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center rounded-xl">
                        <ExternalLink className="w-6 h-6 text-white" />
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-4">
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Manager Decision</p>
                  <textarea 
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Add a comment for the employee..."
                    className="w-full bg-[#0a0502] border border-white/5 rounded-xl p-4 text-sm text-white focus:outline-none focus:border-[#ff4e00] transition-colors min-h-[100px]"
                  />
                  <div className="flex gap-4">
                    <button 
                      onClick={() => handleAction('rejected')}
                      disabled={loading}
                      className="flex-1 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold rounded-xl transition-all"
                    >
                      Reject
                    </button>
                    <button 
                      onClick={() => handleAction('approved')}
                      disabled={loading}
                      className="flex-1 py-3 bg-[#ff4e00] hover:bg-[#e64600] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ff4e00]/20"
                    >
                      Approve
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <div className="bg-[#151619]/50 border border-dashed border-white/10 rounded-2xl p-12 text-center h-fit sticky top-8">
              <p className="text-gray-500 text-sm">Select a claim to review details and documentation.</p>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
