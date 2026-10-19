import React, { useEffect, useState } from 'react';
import { Bell, Search } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { Notification } from '../../types';

interface TopBarProps {
  title: string;
  subtitle?: string;
}

export default function TopBar({ title, subtitle }: TopBarProps) {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifs, setShowNotifs] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from('notifications')
      .select('*')
      .eq('user_id', profile.id)
      .eq('read', false)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => setNotifications(data ?? []));
  }, [profile?.id]);

  const markRead = async (id: string) => {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const markAllRead = async () => {
    if (!profile) return;
    await supabase.from('notifications').update({ read: true }).eq('user_id', profile.id);
    setNotifications([]);
    setShowNotifs(false);
  };

  const typeColors: Record<string, string> = {
    info: 'bg-blue-50 border-blue-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200',
    error: 'bg-red-50 border-red-200',
  };

  return (
    <header className="bg-white border-b border-cpecb-border px-6 py-4 flex items-center justify-between shadow-sm">
      <div>
        <h1 className="text-navy-900 font-bold text-xl leading-tight">{title}</h1>
        {subtitle && <p className="text-gray-500 text-sm mt-0.5">{subtitle}</p>}
      </div>

      <div className="flex items-center gap-3">
        {/* Notification bell */}
        <div className="relative">
          <button
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative p-2 text-gray-500 hover:text-navy-900 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <Bell className="w-5 h-5" />
            {notifications.length > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-bold leading-none">
                {notifications.length > 9 ? '9+' : notifications.length}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 bg-white rounded-card shadow-card-hover border border-cpecb-border z-50 animate-fadeIn">
              <div className="flex items-center justify-between px-4 py-3 border-b border-cpecb-border">
                <p className="font-semibold text-navy-900 text-sm">Notifications</p>
                {notifications.length > 0 && (
                  <button onClick={markAllRead} className="text-xs text-royal-500 hover:text-royal-700 font-medium">
                    Mark all read
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="px-4 py-8 text-center text-gray-400 text-sm">No new notifications</div>
                ) : (
                  notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`px-4 py-3 border-b border-cpecb-border last:border-0 ${typeColors[n.type] ?? 'bg-white'} cursor-pointer hover:brightness-95 transition-all`}
                      onClick={() => markRead(n.id)}
                    >
                      <p className="text-navy-900 text-sm font-semibold">{n.title}</p>
                      <p className="text-gray-600 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {new Date(n.created_at).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Avatar */}
        <div className="flex items-center gap-2.5 pl-3 border-l border-cpecb-border">
          {profile?.profile_photo_url ? (
            <img src={profile.profile_photo_url} alt="" className="w-8 h-8 rounded-full object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-full bg-royal-500 flex items-center justify-center text-white text-sm font-bold">
              {[profile?.first_name?.[0], profile?.last_name?.[0]].filter(Boolean).join('') || 'U'}
            </div>
          )}
          <div className="hidden sm:block">
            <p className="text-navy-900 text-sm font-semibold leading-tight">
              {[profile?.first_name, profile?.last_name].filter(Boolean).join(' ') || 'User'}
            </p>
            <p className="text-gray-400 text-xs">{profile?.email}</p>
          </div>
        </div>
      </div>
    </header>
  );
}
