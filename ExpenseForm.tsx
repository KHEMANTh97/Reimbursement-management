import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  TrendingUp, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  ArrowUpRight, 
  Receipt, 
  FileSearch,
  Plus,
  Upload,
  ChevronRight
} from 'lucide-react';
import { db } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';

interface DashboardProps {
  user: any;
  company: any;
  onNewExpense: (file?: File) => void;
}

export default function Dashboard({ user, company, onNewExpense }: DashboardProps) {
  const [expenses, setExpenses] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0
  });

  useEffect(() => {
    const q = query(
      collection(db, 'expenses'),
      where('companyId', '==', user.companyId),
      orderBy('createdAt', 'desc'),
      limit(5)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const expenseData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setExpenses(expenseData);
      
      // Calculate stats (in a real app, this would be a separate query or aggregation)
      const allExpenses = snapshot.docs.map(doc => doc.data());
      setStats({
        total: allExpenses.reduce((acc, curr: any) => acc + curr.amount, 0),
        pending: allExpenses.filter((e: any) => e.status === 'pending').length,
        approved: allExpenses.filter((e: any) => e.status === 'approved').length,
        rejected: allExpenses.filter((e: any) => e.status === 'rejected').length
      });
    });

    return () => unsubscribe();
  }, [user.companyId]);

  const statCards = [
    { label: 'Total Expenses', value: `$${stats.total.toLocaleString()}`, icon: TrendingUp, color: 'text-white', bg: 'bg-white/5', trend: '+12% from last month' },
    { label: 'Pending Approvals', value: stats.pending, icon: Clock, color: 'text-[#ff4e00]', bg: 'bg-[#3a1510]', trend: 'Awaiting manager review' },
    { label: 'Approved Amount', value: `$${stats.approved.toLocaleString()}`, icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-500/10', trend: 'Settled this month' },
    { label: 'Rejected Claims', value: stats.rejected, icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', trend: 'Action required on 1 claim' },
  ];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Welcome back, {user.name.split(' ')[0]}.</h1>
          <p className="text-gray-400">You have <span className="text-[#ff4e00] font-bold">{stats.pending} pending</span> reimbursements requiring attention.</p>
        </div>
        <button 
          onClick={() => onNewExpense()}
          className="px-6 py-3 bg-[#ff4e00] hover:bg-[#e64600] text-white font-bold rounded-xl transition-all shadow-lg shadow-[#ff4e00]/20 flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Reimbursement
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-[#151619] border border-white/5 rounded-2xl p-6 relative overflow-hidden group"
          >
            <div className={`p-3 rounded-xl ${stat.bg} w-fit mb-4`}>
              <stat.icon className={`w-6 h-6 ${stat.color}`} />
            </div>
            <p className="text-sm text-gray-500 font-medium mb-1">{stat.label}</p>
            <h3 className="text-2xl font-bold text-white mb-2">{stat.value}</h3>
            <p className="text-[10px] text-gray-600 uppercase tracking-widest font-bold">{stat.trend}</p>
            
            <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
              <ArrowUpRight className="w-4 h-4 text-gray-500" />
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Expenses */}
        <div className="lg:col-span-2 bg-[#151619] border border-white/5 rounded-2xl overflow-hidden">
          <div className="p-6 border-b border-white/5 flex items-center justify-between">
            <h3 className="text-lg font-bold text-white">Recent Expense Claims</h3>
            <button className="text-xs font-bold text-[#ff4e00] uppercase tracking-widest hover:underline">View all history</button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="text-[10px] text-gray-500 uppercase tracking-widest font-bold border-b border-white/5">
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Category</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 text-sm font-medium text-gray-300">{expense.date}</td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center">
                          <Receipt className="w-4 h-4 text-[#ff4e00]" />
                        </div>
                        <span className="text-sm font-bold text-white">{expense.category}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm font-bold text-white">{expense.currency} {expense.amount.toLocaleString()}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${
                        expense.status === 'approved' ? 'bg-green-500/10 text-green-500' :
                        expense.status === 'rejected' ? 'bg-red-500/10 text-red-500' :
                        'bg-[#ff4e00]/10 text-[#ff4e00]'
                      }`}>
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button className="p-2 hover:bg-white/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                        <ChevronRight className="w-4 h-4 text-gray-500" />
                      </button>
                    </td>
                  </tr>
                ))}
                {expenses.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                      No recent expenses found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Smart Upload Widget */}
        <div className="space-y-6">
          <div className="bg-[#151619] border border-white/5 rounded-2xl p-6 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-[#ff4e00]/5 to-transparent pointer-events-none" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold text-white mb-4">Smart Upload</h3>
              <input 
                type="file" 
                id="smart-upload"
                className="hidden" 
                accept="image/*,application/pdf"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onNewExpense(file);
                }}
              />
              <label 
                htmlFor="smart-upload"
                className="border-2 border-dashed border-white/10 rounded-2xl p-8 flex flex-col items-center justify-center text-center group hover:border-[#ff4e00]/50 transition-colors cursor-pointer"
              >
                <div className="w-16 h-16 bg-[#ff4e00]/10 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <Upload className="w-8 h-8 text-[#ff4e00]" />
                </div>
                <h4 className="text-sm font-bold text-white mb-2">OCR Receipt Scanner</h4>
                <p className="text-xs text-gray-500 mb-6">Drop your receipt here to auto-fill expense details using AI technology.</p>
                <div className="px-6 py-2.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-gray-100 transition-colors">
                  Browse Files
                </div>
                <p className="mt-4 text-[10px] text-gray-600 uppercase tracking-widest font-bold">Supports JPG, PNG, PDF (Max 10MB)</p>
              </label>
            </div>
          </div>

          <div className="bg-[#151619] border border-white/5 rounded-2xl p-6">
            <h3 className="text-lg font-bold text-white mb-4">Budget Utilization</h3>
            <div className="space-y-6">
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                  <span className="text-gray-500">Q4 Travel Budget</span>
                  <span className="text-white">$8,500 / $10k</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '85%' }}
                    className="h-full bg-[#ff4e00]"
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs font-bold uppercase tracking-widest mb-2">
                  <span className="text-gray-500">General Expenses</span>
                  <span className="text-white">$2,100 / $5k</span>
                </div>
                <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: '42%' }}
                    className="h-full bg-blue-500"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
