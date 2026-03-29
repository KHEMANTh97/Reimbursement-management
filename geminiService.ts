import { useEffect, useState } from 'react';
import { collection, query, where, getDocs, addDoc, doc, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { User, ApprovalRule, Role } from '../types';
import { Users, ShieldCheck, Plus, Trash2, Save, UserPlus, Mail, Briefcase, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsProps {
  profile: User | null;
}

export default function Settings({ profile }: SettingsProps) {
  const [users, setUsers] = useState<User[]>([]);
  const [rules, setRules] = useState<ApprovalRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'users' | 'rules'>('users');

  // New User Form
  const [newUser, setNewUser] = useState({ name: '', email: '', role: 'employee' as Role, managerUid: '' });
  const [userLoading, setUserLoading] = useState(false);

  useEffect(() => {
    if (!profile) return;

    const fetchData = async () => {
      const usersQ = query(collection(db, 'users'), where('companyId', '==', profile.companyId));
      const usersSnap = await getDocs(usersQ);
      setUsers(usersSnap.docs.map(doc => doc.data() as User));

      const rulesQ = query(collection(db, 'approvalRules'), where('companyId', '==', profile.companyId));
      const rulesSnap = await getDocs(rulesQ);
      setRules(rulesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as ApprovalRule)));

      setLoading(false);
    };

    fetchData();
  }, [profile]);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!profile) return;
    setUserLoading(true);
    try {
      // In a real app, use a cloud function to create auth user and profile
      // For now, just create the profile (auth user must exist or be created separately)
      const userRef = doc(collection(db, 'users'));
      const userData = { ...newUser, uid: userRef.id, companyId: profile.companyId };
      await setDoc(userRef, userData);
      setUsers(prev => [...prev, userData as User]);
      setNewUser({ name: '', email: '', role: 'employee', managerUid: '' });
    } catch (err) {
      console.error(err);
    } finally {
      setUserLoading(false);
    }
  };

  if (loading) return null;

  return (
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <h1 className="serif text-4xl font-light">Institutional Configuration</h1>
          <p className="text-sm text-gray-500">Define the architectural integrity of your financial workflows.</p>
        </div>
        <div className="flex gap-4">
          <button
            onClick={() => setActiveTab('users')}
            className={cn(
              "px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
              activeTab === 'users' ? "bg-[#1a1a1a] text-white" : "border border-gray-200 text-gray-400 hover:bg-gray-50"
            )}
          >
            Team Management
          </button>
          <button
            onClick={() => setActiveTab('rules')}
            className={cn(
              "px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-all",
              activeTab === 'rules' ? "bg-[#1a1a1a] text-white" : "border border-gray-200 text-gray-400 hover:bg-gray-50"
            )}
          >
            Approval Rules
          </button>
        </div>
      </div>

      {activeTab === 'users' ? (
        <div className="grid grid-cols-3 gap-12">
          {/* User List */}
          <div className="col-span-2 space-y-8">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                <h2 className="serif text-xl font-light">Active Personnel</h2>
                <div className="flex gap-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                  <span>Total Members: {users.length}</span>
                  <span>Roles Assigned: 3 Types</span>
                </div>
              </div>
              <div className="mt-6 overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b border-gray-50 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                      <th className="pb-4">Employee</th>
                      <th className="pb-4">Current Role</th>
                      <th className="pb-4">Reporting To</th>
                      <th className="pb-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {users.map((user) => (
                      <tr key={user.uid} className="group hover:bg-gray-50">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-[10px] font-bold">
                              {user.name.charAt(0)}
                            </div>
                            <div>
                              <p className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]">{user.name}</p>
                              <p className="text-[10px] font-semibold uppercase tracking-widest text-gray-400">{user.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <span className={cn(
                            "rounded-full px-3 py-1 text-[8px] font-bold uppercase tracking-widest",
                            user.role === 'admin' ? "bg-purple-50 text-purple-600" :
                            user.role === 'manager' ? "bg-blue-50 text-blue-600" :
                            "bg-gray-50 text-gray-600"
                          )}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-4 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                          {users.find(u => u.uid === user.managerUid)?.name || 'Direct Report'}
                        </td>
                        <td className="py-4">
                          <button className="text-gray-300 hover:text-red-500">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Add User Form */}
          <div className="space-y-8">
            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-6">
                <UserPlus className="h-5 w-5 text-gray-400" />
                <h2 className="serif text-xl font-light">Invite Team Members</h2>
              </div>
              <form onSubmit={handleAddUser} className="mt-8 space-y-6">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Full Name</label>
                  <div className="flex items-center gap-2 border-b border-gray-100 py-2">
                    <Briefcase className="h-4 w-4 text-gray-300" />
                    <input
                      type="text"
                      required
                      className="w-full bg-transparent text-xs font-bold outline-none"
                      placeholder="Jane Smith"
                      value={newUser.name}
                      onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Email Address</label>
                  <div className="flex items-center gap-2 border-b border-gray-100 py-2">
                    <Mail className="h-4 w-4 text-gray-300" />
                    <input
                      type="email"
                      required
                      className="w-full bg-transparent text-xs font-bold outline-none"
                      placeholder="jane@company.com"
                      value={newUser.email}
                      onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Default Role</label>
                  <select
                    className="w-full border-b border-gray-100 bg-transparent py-2 text-xs font-bold outline-none"
                    value={newUser.role}
                    onChange={(e) => setNewUser({ ...newUser, role: e.target.value as Role })}
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Reporting To</label>
                  <select
                    className="w-full border-b border-gray-100 bg-transparent py-2 text-xs font-bold outline-none"
                    value={newUser.managerUid}
                    onChange={(e) => setNewUser({ ...newUser, managerUid: e.target.value })}
                  >
                    <option value="">Select Manager</option>
                    {users.filter(u => u.role === 'manager' || u.role === 'admin').map(u => (
                      <option key={u.uid} value={u.uid}>{u.name}</option>
                    ))}
                  </select>
                </div>
                <button
                  disabled={userLoading}
                  className="w-full bg-[#1a1a1a] py-3 text-[10px] font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                >
                  {userLoading ? 'Sending Invitation...' : 'Send Invites'}
                </button>
              </form>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <div className="flex items-center gap-2 border-b border-gray-100 pb-6">
                <ShieldCheck className="h-5 w-5 text-blue-600" />
                <h2 className="serif text-xl font-light">Hierarchy Health</h2>
              </div>
              <div className="mt-6 space-y-4">
                <div className="flex items-center justify-between rounded-lg bg-red-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-red-500" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-red-600">Incomplete Profiles</p>
                  </div>
                  <button className="text-[8px] font-bold uppercase tracking-widest text-red-600 underline">View All</button>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-green-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
                    <p className="text-[10px] font-bold uppercase tracking-widest text-green-600">Audit Log Synced</p>
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-green-500">Live</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-3 gap-12">
          {/* Rules List */}
          <div className="col-span-2 space-y-8">
             <div className="rounded-2xl bg-white p-8 shadow-sm">
                <div className="flex items-center justify-between border-b border-gray-100 pb-6">
                  <h2 className="serif text-xl font-light">Active Approval Workflows</h2>
                  <button className="flex items-center gap-2 bg-[#1a1a1a] px-4 py-2 text-[10px] font-bold uppercase tracking-widest text-white">
                    <Plus className="h-4 w-4" /> Add Stage
                  </button>
                </div>
                <div className="mt-8 space-y-8">
                  {rules.length === 0 ? (
                    <div className="py-12 text-center text-gray-400">
                      <ShieldCheck className="mx-auto mb-4 h-12 w-12 opacity-20" />
                      <p className="text-xs font-bold uppercase tracking-widest">No Rules Defined</p>
                    </div>
                  ) : (
                    rules.map((rule) => (
                      <div key={rule.id} className="relative space-y-6">
                        <div className="flex items-center justify-between">
                          <h3 className="serif text-2xl font-light capitalize">{rule.category} Approval Flow</h3>
                          <span className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Threshold: ${rule.threshold}</span>
                        </div>
                        <div className="space-y-4">
                          {rule.steps.map((step, i) => (
                            <div key={i} className="flex items-center gap-6">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1a1a1a] text-[10px] font-bold text-white">
                                {i + 1}
                              </div>
                              <div className="flex-1 rounded-xl border border-gray-100 bg-gray-50 p-4">
                                <div className="flex items-center justify-between">
                                  <p className="text-xs font-bold uppercase tracking-widest text-[#1a1a1a]">{step.role} Approval</p>
                                  <span className="text-[8px] font-bold uppercase tracking-widest text-blue-600">Required</span>
                                </div>
                                <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400">
                                  {step.type === 'specific' ? `Specific User: ${step.specificUserUid}` : `Any ${step.role}`}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  )}
                </div>
             </div>
          </div>

          {/* Rule Config Sidebar */}
          <div className="space-y-8">
            <div className="rounded-2xl bg-[#1a1a1a] p-8 text-white shadow-sm">
              <h2 className="serif text-xl font-light">Rule Logic Engine</h2>
              <p className="mt-2 text-[10px] font-semibold uppercase tracking-widest text-gray-400">Configure sequential validation stages</p>
              
              <div className="mt-8 space-y-6">
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Percentage Rule</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest">Auto-approve if &lt; $50 (5% random audit)</p>
                </div>
                <div className="rounded-xl bg-white/5 p-4">
                  <p className="text-[8px] font-bold uppercase tracking-widest text-gray-400">Threshold Alert</p>
                  <p className="mt-1 text-[10px] font-semibold uppercase tracking-widest text-red-400">Notify CFO for claims &gt; $5,000</p>
                </div>
              </div>
            </div>

            <div className="rounded-2xl bg-white p-8 shadow-sm">
              <h2 className="serif text-xl font-light">Quick Status Overview</h2>
              <div className="mt-6 space-y-4">
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-gray-400">Active Rules</span>
                  <span className="text-[#1a1a1a]">{rules.length}</span>
                </div>
                <div className="flex justify-between text-[10px] font-bold uppercase tracking-widest">
                  <span className="text-gray-400">Pending Sync</span>
                  <span className="text-red-500">2</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
