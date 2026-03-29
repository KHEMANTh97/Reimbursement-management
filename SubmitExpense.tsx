import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, limit, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { User, Expense } from '../types';
import { TrendingUp, Clock, AlertCircle, FileText, Upload, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import { cn } from '../lib/utils';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface DashboardProps {
  profile: User | null;
}

export default function Dashboard({ profile }: DashboardProps) {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [stats, setStats] = useState({ approved: 0, pending: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;

    const fetchExpenses = async () => {
      const q = query(
        collection(db, 'expenses'),
        where('companyId', '==', profile.companyId),
        orderBy('date', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const expenseData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Expense));
      setExpenses(expenseData);

      // Simple stats (in a real app, use a cloud function or more complex query)
      const allQ = query(collection(db, 'expenses'), where('companyId', '==', profile.companyId));
      const allSnap = await getDocs(allQ);
      const allData = allSnap.docs.map(doc => doc.data() as Expense);
      setStats({
        approved: allData.filter(e => e.status === 'approved').reduce((sum, e) => sum + e.amount, 0),
        pending: allData.filter(e => e.status === 'pending').reduce((sum, e) => sum + e.amount, 0),
        rejected: allData.filter(e => e.status === 'rejected').reduce((sum, e) => sum + e.amount, 0),
      });
      setLoading(false);
    };

    fetchExpenses();
  }, [profile]);

  const chartData = [
    { name: 'Approved', value: stats.approved, color: '#1a1a1a' },
    { name: 'Pending', value: stats.pending, color: '#f5f2ed' },
    { name: 'Rejected', value: stats.rejected, color: '#ef4444' },
  ];

  if (loading) return null;

  return (
    <div className="space-y-12">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="serif text-4xl font-light">Welcome back, {profile?.name.split(' ')[0]}.</h1>
          <p className="text-sm text-gray-500">You have <span className="font-bold text-[#1a1a1a]">{expenses.filter(e => e.status === 'pending').length} pending</span> reimbursements requiring attention.</p>
        </div>
        <button className="flex items-center gap-2 border border-gray-200 px-4 py-2 text-[10px] font-semibold uppercase tracking-widest text-gray-600 hover:bg-gray-50">
          <FileText className="h-4 w-4" />
          Export Report
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-8">
        {[
          { label: 'Approved', amount: stats.approved, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Pending', amount: stats.pending, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-50', sub: '+2.4% vs last month' },
          { label: 'Rejected', amount: stats.rejected, icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', sub: 'Action required on 1 claim' },
        ].map((stat, i) => (
          <div key={i} className="group relative overflow-hidden rounded-2xl bg-white p-8 shadow-sm transition-all hover:shadow-md">
            <div className="flex items-center justify-between">
              <div className={cn("flex h-10 w-10 items-center justify-center rounded-full", stat.bg)}>
                <stat.icon className={cn("h-5 w-5", stat.color)} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">{stat.label}</span>
            </div>
            <div className="mt-6">
              <p className="serif text-3xl font-light">${stat.amount.toLocaleString()}</p>
              {stat.sub && <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">{stat.sub}</p>}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-3 gap-8">
        {/* Table */}
        <div className="col-span-2 space-y-6 rounded-2xl bg-white p-8 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="serif text-xl font-light">Recent Expense Claims</h2>
            <Link to="/submit" className="text-[10px] font-bold uppercase tracking-widest text-gray-400 hover:text-[#1a1a1a]">View all history</Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-gray-100 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <th className="pb-4">Date</th>
                  <th className="pb-4">Category</th>
                  <th className="pb-4">Amount</th>
                  <th className="pb-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {expenses.map((expense) => (
                  <tr key={expense.id} className="group hover:bg-gray-50">
                    <td className="py-4 text-xs font-semibold text-gray-600">{format(new Date(expense.date), 'MMM dd, yyyy')}</td>
                    <td className="py-4">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-gray-300" />
                        <span className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]">{expense.category}</span>
                      </div>
                    </td>
                    <td className="py-4 text-xs font-bold text-[#1a1a1a]">${expense.amount.toLocaleString()}</td>
                    <td className="py-4">
                      <span className={cn(
                        "rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest",
                        expense.status === 'approved' ? "bg-green-50 text-green-600" :
                        expense.status === 'rejected' ? "bg-red-50 text-red-600" :
                        "bg-blue-50 text-blue-600"
                      )}>
                        {expense.status === 'pending' ? 'In Review' : expense.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Sidebar Widgets */}
        <div className="space-y-8">
          {/* Smart Upload */}
          <div className="rounded-2xl bg-[#1a1a1a] p-8 text-white shadow-sm">
            <div className="flex flex-col items-center space-y-6 text-center">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/10">
                <Upload className="h-8 w-8 text-[#f5f2ed]" />
              </div>
              <div className="space-y-2">
                <h3 className="serif text-xl font-light">Smart Upload</h3>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">OCR Receipt Scanner</p>
                <p className="text-xs text-gray-500">Drop your receipt here to auto-fill expense details using AI technology.</p>
              </div>
              <Link to="/submit" className="flex w-full items-center justify-center gap-2 bg-[#f5f2ed] py-3 text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a] transition-opacity hover:opacity-90">
                Browse Files
              </Link>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-500">Supports JPG, PNG, PDF (Max 10MB)</p>
            </div>
          </div>

          {/* Budget Utilization */}
          <div className="rounded-2xl bg-white p-8 shadow-sm">
             <div className="flex items-center justify-between">
                <h3 className="text-[10px] font-bold uppercase tracking-widest text-[#1a1a1a]">Budget Utilization</h3>
                <TrendingUp className="h-4 w-4 text-gray-400" />
             </div>
             <div className="mt-6 space-y-6">
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gray-400">Q4 Travel Budget</span>
                    <span className="text-[#1a1a1a]">$8,500 / $10k</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div className="h-full w-[85%] rounded-full bg-[#1a1a1a]" />
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                    <span className="text-gray-400">General Expenses</span>
                    <span className="text-[#1a1a1a]">$2,100 / $5k</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-gray-100">
                    <div className="h-full w-[42%] rounded-full bg-gray-400" />
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  );
}
