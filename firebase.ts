import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  LayoutDashboard, 
  Receipt, 
  CheckSquare, 
  Users, 
  Settings, 
  LogOut, 
  Menu, 
  X, 
  Mic, 
  MicOff,
  Bell,
  Search,
  User
} from 'lucide-react';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import VoiceAssistant from './VoiceAssistant';

interface LayoutProps {
  user: any;
  company: any;
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onNewExpense: () => void;
}

export default function Layout({ user, company, children, activeTab, setActiveTab, onNewExpense }: LayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isVoiceActive, setIsVoiceActive] = useState(false);

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['admin', 'manager', 'employee'] },
    { id: 'expenses', label: 'Expenses', icon: Receipt, roles: ['admin', 'manager', 'employee'] },
    { id: 'approvals', label: 'Approvals', icon: CheckSquare, roles: ['admin', 'manager'] },
    { id: 'team', label: 'Team Management', icon: Users, roles: ['admin'] },
    { id: 'settings', label: 'Settings', icon: Settings, roles: ['admin'] },
  ];

  const filteredNavItems = navItems.filter(item => item.roles.includes(user.role));

  const handleLogout = () => {
    signOut(auth);
    window.location.reload();
  };

  const handleVoiceNavigate = (page: string) => {
    if (page === 'new_expense') {
      onNewExpense();
    } else {
      setActiveTab(page);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0502] text-white flex overflow-hidden">
      {/* Sidebar */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className="bg-[#151619] border-r border-white/5 flex flex-col relative z-30"
      >
        <div className="p-6 flex items-center justify-between">
          {isSidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-[#ff4e00] rounded-lg flex items-center justify-center">
                <Receipt className="text-white w-5 h-5" />
              </div>
              <span className="font-bold text-lg tracking-tight">Ledger Admin</span>
            </div>
          )}
          <button 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 hover:bg-white/5 rounded-lg transition-colors"
          >
            {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {filteredNavItems.map(item => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 p-4 rounded-xl transition-all group ${
                activeTab === item.id 
                  ? 'bg-[#ff4e00] text-white shadow-lg shadow-[#ff4e00]/20' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? 'text-white' : 'group-hover:text-[#ff4e00]'}`} />
              {isSidebarOpen && <span className="font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-white/5">
          <div className={`flex items-center gap-3 p-4 rounded-xl bg-white/5 mb-4 ${!isSidebarOpen && 'justify-center'}`}>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#ff4e00] to-[#3a1510] flex items-center justify-center font-bold">
              {user.name[0]}
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{user.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{user.role}</p>
              </div>
            )}
          </div>
          <button 
            onClick={handleLogout}
            className={`w-full flex items-center gap-4 p-4 rounded-xl text-gray-400 hover:bg-red-500/10 hover:text-red-500 transition-all ${!isSidebarOpen && 'justify-center'}`}
          >
            <LogOut className="w-5 h-5" />
            {isSidebarOpen && <span className="font-medium">Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col relative overflow-hidden">
        {/* Header */}
        <header className="h-20 bg-[#151619]/50 backdrop-blur-xl border-b border-white/5 px-8 flex items-center justify-between relative z-20">
          <div className="flex items-center gap-4 flex-1 max-w-xl">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="text" 
                placeholder="Search configurations, expenses..."
                className="w-full bg-white/5 border border-white/10 rounded-xl pl-12 pr-4 py-2.5 text-sm focus:outline-none focus:border-[#ff4e00] transition-colors"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={() => setIsVoiceActive(!isVoiceActive)}
              className={`p-3 rounded-xl transition-all flex items-center gap-2 ${
                isVoiceActive ? 'bg-[#ff4e00] text-white' : 'bg-white/5 text-gray-400 hover:text-white'
              }`}
            >
              {isVoiceActive ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
              <span className="text-xs font-bold uppercase tracking-widest">Voice Assistant</span>
            </button>
            
            <button className="relative p-2 text-gray-400 hover:text-white transition-colors">
              <Bell className="w-6 h-6" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-[#ff4e00] rounded-full border-2 border-[#0a0502]"></span>
            </button>
            
            <div className="h-8 w-[1px] bg-white/10"></div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <p className="text-sm font-bold">{user.name}</p>
                <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">{company.name}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center">
                <User className="w-5 h-5 text-gray-400" />
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-8 relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {children}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Voice Assistant Overlay */}
        <AnimatePresence>
          {isVoiceActive && (
            <VoiceAssistant 
              onClose={() => setIsVoiceActive(false)} 
              onNavigate={handleVoiceNavigate}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
