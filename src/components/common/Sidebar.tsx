import React, { useState } from 'react';
import {
  LayoutDashboard, FileText, History, User, LogOut,
  ClipboardList, BarChart2, Settings, Users, ChevronLeft,
  ChevronRight, Bell, Shield
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { UserRole } from '../../types';

type Page =
  | 'dashboard' | 'renew' | 'history' | 'profile'
  | 'officer-dashboard' | 'officer-applications' | 'officer-reports'
  | 'admin-dashboard' | 'admin-renewals' | 'admin-members' | 'admin-reports' | 'admin-settings';

interface SidebarProps {
  currentPage: Page;
  onNavigate: (page: Page) => void;
}

const memberNav = [
  { page: 'dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { page: 'renew' as Page, label: 'Renew Certification', icon: FileText },
  { page: 'history' as Page, label: 'My Applications', icon: History },
  { page: 'profile' as Page, label: 'Profile', icon: User },
];

const officerNav = [
  { page: 'officer-dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { page: 'officer-applications' as Page, label: 'Applications', icon: ClipboardList },
  { page: 'officer-reports' as Page, label: 'Reports', icon: BarChart2 },
];

const adminNav = [
  { page: 'admin-dashboard' as Page, label: 'Dashboard', icon: LayoutDashboard },
  { page: 'admin-renewals' as Page, label: 'Renewals', icon: ClipboardList },
  { page: 'admin-members' as Page, label: 'Members', icon: Users },
  { page: 'admin-reports' as Page, label: 'Reports', icon: BarChart2 },
  { page: 'admin-settings' as Page, label: 'Settings', icon: Settings },
];

function getNav(role: UserRole) {
  if (role === 'admin') return adminNav;
  if (role === 'officer') return officerNav;
  return memberNav;
}

function getRoleLabel(role: UserRole) {
  if (role === 'admin') return 'Administrator';
  if (role === 'officer') return 'Review Officer';
  return 'Member';
}

function getRoleBadgeColor(role: UserRole) {
  if (role === 'admin') return 'bg-red-500/20 text-red-200';
  if (role === 'officer') return 'bg-yellow-500/20 text-yellow-200';
  return 'bg-accent-400/20 text-accent-200';
}

export default function Sidebar({ currentPage, onNavigate }: SidebarProps) {
  const { profile, signOut } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  const navItems = getNav(profile?.role ?? 'member');
  const fullName = [profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User';
  const initials = [profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join('') || 'U';

  return (
    <aside
      className={`flex flex-col transition-all duration-300 shrink-0 ${collapsed ? 'w-16' : 'w-64'}`}
      style={{ background: 'linear-gradient(180deg, #001F5B 0%, #001540 100%)' }}
    >
      {/* Header */}
      <div className={`flex items-center px-4 py-4 border-b border-navy-800 ${collapsed ? 'justify-center' : 'justify-between'}`}>
        {!collapsed && (
          <div className="flex items-center gap-3">
            <img
              src="/CPECB-Logo.png"
              alt="CPECB"
              className="h-9 w-9 object-contain shrink-0"
            />
            <div>
              <p className="text-white font-bold text-sm leading-tight">CPECB</p>
              <p className="text-blue-300 text-xs leading-tight">Renewal Portal</p>
            </div>
          </div>
        )}
        {collapsed && (
          <img
            src="/CPECB-Logo.png"
            alt="CPECB"
            className="h-8 w-8 object-contain"
          />
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-blue-300 hover:text-white hover:bg-navy-800 transition-colors shrink-0"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </button>
      </div>

      {/* User card */}
      {!collapsed && (
        <div className="px-4 py-4 border-b border-navy-800">
          <div className="flex items-center gap-3">
            {profile?.profile_photo_url ? (
              <img src={profile.profile_photo_url} alt="" className="w-9 h-9 rounded-full object-cover" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-royal-500 flex items-center justify-center text-white text-sm font-bold shrink-0">
                {initials}
              </div>
            )}
            <div className="min-w-0">
              <p className="text-white text-sm font-semibold truncate">{fullName}</p>
              <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-0.5 ${getRoleBadgeColor(profile?.role ?? 'member')}`}>
                {getRoleLabel(profile?.role ?? 'member')}
              </span>
            </div>
          </div>
        </div>
      )}

      {collapsed && (
        <div className="px-2 py-3 border-b border-navy-800 flex justify-center">
          {profile?.profile_photo_url ? (
            <img src={profile.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-royal-500 flex items-center justify-center text-white text-xs font-bold">
              {initials}
            </div>
          )}
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(({ page, label, icon: Icon }) => {
          const isActive = currentPage === page;
          return (
            <button
              key={page}
              onClick={() => onNavigate(page)}
              className={`sidebar-link w-full ${isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'} ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {!collapsed && <span>{label}</span>}
            </button>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-3 py-4 border-t border-navy-800 space-y-1">
        {!collapsed && profile?.role === 'admin' && (
          <div className="flex items-center gap-2 px-4 py-2 text-xs text-blue-300">
            <Shield className="w-3 h-3" />
            <span>Admin Access</span>
          </div>
        )}
        <button
          onClick={signOut}
          className={`sidebar-link w-full sidebar-link-inactive ${collapsed ? 'justify-center px-2' : ''}`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!collapsed && <span>Sign Out</span>}
        </button>
      </div>
    </aside>
  );
}

export type { Page };
