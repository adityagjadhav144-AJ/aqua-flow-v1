import React, { useState } from 'react';
import { useAppStore } from '../../store/useAppStore';
import { db } from '../../services/db';
import { NotificationItem } from '../../types';
import { X, Bell, MessageSquare, CheckCheck, ShieldCheck } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export const NotificationCenter: React.FC = () => {
  const { isNotifCenterOpen, toggleNotifCenter } = useAppStore();
  const [tab, setTab] = useState<'all' | 'whatsapp' | 'push'>('all');

  if (!isNotifCenterOpen) return null;

  const notifications = db.getData().notifications;
  const filtered = notifications.filter((n) => (tab === 'all' ? true : n.channel === tab));

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col animate-in slide-in-from-right duration-200">
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-cyan-100 text-cyan-700 flex items-center justify-center font-bold">
              <Bell size={16} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-900">Notification Center</h2>
              <p className="text-[11px] text-slate-500">Push alerts & Simulated WhatsApp chats</p>
            </div>
          </div>
          <button
            onClick={toggleNotifCenter}
            className="p-1.5 rounded-full hover:bg-slate-200 text-slate-500 cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="px-4 pt-3 pb-2 flex gap-2 border-b border-slate-100">
          <button
            onClick={() => setTab('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              tab === 'all' ? 'bg-cyan-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            All Updates
          </button>
          <button
            onClick={() => setTab('whatsapp')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 cursor-pointer ${
              tab === 'whatsapp' ? 'bg-emerald-600 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            <MessageSquare size={13} />
            <span>WhatsApp Previews</span>
          </button>
          <button
            onClick={() => setTab('push')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              tab === 'push' ? 'bg-slate-800 text-white shadow-xs' : 'bg-slate-100 text-slate-600'
            }`}
          >
            In-App Push
          </button>
        </div>

        {/* Notifications List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filtered.length === 0 ? (
            <div className="text-center py-12 text-slate-400 text-xs">
              No notifications yet.
            </div>
          ) : (
            filtered.map((item) => {
              if (item.channel === 'whatsapp') {
                return (
                  <div
                    key={item.id}
                    className="bg-[#EFEAE2] p-3 rounded-2xl border border-[#DAD3C8] shadow-xs space-y-2"
                  >
                    {/* Simulated WhatsApp chat header */}
                    <div className="flex items-center justify-between text-[11px] text-slate-700">
                      <div className="flex items-center gap-1.5 font-semibold text-emerald-800">
                        <MessageSquare size={12} className="text-emerald-600" />
                        <span>{item.whatsappMeta?.sender || 'AquaFlow Official'}</span>
                        <ShieldCheck size={13} className="text-emerald-600 inline" />
                      </div>
                      <span className="text-[10px] text-slate-500">
                        {formatDistanceToNow(new Date(item.ts), { addSuffix: true })}
                      </span>
                    </div>

                    {/* WhatsApp Speech Bubble */}
                    <div className="bg-white rounded-xl p-3 shadow-xs text-xs text-slate-800 leading-relaxed relative">
                      <div className="font-bold text-slate-900 mb-1">{item.title}</div>
                      <p className="whitespace-pre-line">{item.body}</p>
                      <div className="flex justify-end items-center gap-1 mt-2 text-[10px] text-slate-400">
                        <span>Delivered</span>
                        <CheckCheck size={13} className="text-cyan-500" />
                      </div>
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={item.id}
                  className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-xs flex items-start gap-3 hover:border-cyan-200 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-cyan-50 text-cyan-600 flex items-center justify-center shrink-0 mt-0.5">
                    <Bell size={15} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline justify-between gap-1 mb-1">
                      <div className="text-xs font-bold text-slate-900 truncate">
                        {item.title}
                      </div>
                      <span className="text-[10px] text-slate-400 shrink-0">
                        {formatDistanceToNow(new Date(item.ts), { addSuffix: true })}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 leading-relaxed">{item.body}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
