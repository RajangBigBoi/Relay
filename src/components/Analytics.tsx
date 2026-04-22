import React, { useMemo } from 'react';
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend 
} from 'recharts';
import { 
  TrendingUp, 
  Users, 
  AlertCircle, 
  CheckCircle2, 
  Clock,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { DutyLog } from '../types';
import { cn } from '../lib/utils';
import { startOfDay, subDays, format, isSameDay } from 'date-fns';

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function Analytics({ logs }: { logs: DutyLog[] }) {
  // Aggregate Volume for last 7 days
  const dailyVolume = useMemo(() => {
    return Array.from({ length: 7 }).map((_, i) => {
      const date = subDays(startOfDay(new Date()), 6 - i);
      const count = logs.filter(log => {
        const logDate = log.created_at?.toDate ? log.created_at.toDate() : new Date();
        return isSameDay(logDate, date);
      }).length;
      return { day: format(date, 'EEE'), count };
    });
  }, [logs]);

  // Volume by Type
  const volumeByType = useMemo(() => {
    const types: Record<string, number> = {};
    logs.forEach(log => {
      types[log.issue_type] = (types[log.issue_type] || 0) + 1;
    });
    return Object.entries(types).map(([name, value]) => ({ name, value }));
  }, [logs]);

  // Volume by Shift
  const volumeByShift = useMemo(() => {
    const shifts: Record<string, number> = { AM: 0, PM: 0, Night: 0 };
    logs.forEach(log => {
      shifts[log.shift] = (shifts[log.shift] || 0) + 1;
    });
    return Object.entries(shifts).map(([name, value]) => ({ name, value }));
  }, [logs]);

  // Volume by Priority
  const volumeByPriority = useMemo(() => {
    const priorities: Record<string, number> = { Low: 0, Medium: 0, High: 0, Critical: 0 };
    logs.forEach(log => {
      priorities[log.priority] = (priorities[log.priority] || 0) + 1;
    });
    return Object.entries(priorities).map(([name, value]) => ({ name, value }));
  }, [logs]);

  // KPIs
  const totalVolume = logs.length;
  const resolutionRate = logs.length > 0 ? Math.round((logs.filter(l => l.status === 'Resolved').length / logs.length) * 100) : 0;
  const avgResponseTime = '14m'; // Placeholder for complex calc

  return (
    <div className="p-10 space-y-10 max-w-7xl mx-auto custom-scrollbar">
      <div>
        <h2 className="text-3xl font-bold tracking-tight text-white">Operations Intelligence</h2>
        <p className="text-[11px] text-text-muted uppercase tracking-[0.2em] font-black mt-1">Operational performance & trends</p>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Volume', value: totalVolume, trend: '+12%', up: true, icon: TrendingUp },
          { label: 'Resolution Rate', value: `${resolutionRate}%`, trend: '+5%', up: true, icon: CheckCircle2 },
          { label: 'Avg Feedback', value: '4.8', trend: '-2%', up: false, icon: Users },
          { label: 'Response Time', value: avgResponseTime, trend: 'stable', up: true, icon: Clock },
        ].map((kpi, i) => (
          <div key={i} className="bg-glass backdrop-blur-md border border-glass-border p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 bg-white/5 rounded-xl border border-glass-border">
                <kpi.icon className="w-5 h-5 text-text-muted" />
              </div>
              <div className={cn(
                "flex items-center gap-1 text-[10px] font-black uppercase tracking-tighter",
                kpi.trend === 'stable' ? "text-text-muted" : kpi.up ? "text-low" : "text-critical"
              )}>
                {kpi.trend !== 'stable' && (kpi.up ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />)}
                {kpi.trend}
              </div>
            </div>
            <p className="text-text-muted text-[11px] uppercase tracking-widest font-black mb-1">{kpi.label}</p>
            <p className="text-3xl font-black tracking-tighter text-white">{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Volume Chart */}
        <div className="bg-glass border border-glass-border p-8 rounded-[32px] space-y-6">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">7-Day Cumulative Volume</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dailyVolume}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Line type="monotone" dataKey="count" stroke="#FFFFFF" strokeWidth={3} dot={{r: 4, fill: '#FFFFFF'}} activeDot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Volume by Type Chart */}
        <div className="bg-glass border border-glass-border p-8 rounded-[32px] space-y-6">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Volume by Incident Type</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={volumeByType}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94A3B8', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Bar dataKey="value" fill="rgba(255,255,255,0.1)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Shift and Priority Distributions */}
        <div className="bg-glass border border-glass-border p-8 rounded-[32px] space-y-6">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Shift Distribution</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={volumeByShift}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {volumeByShift.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-glass border border-glass-border p-8 rounded-[32px] space-y-6">
          <h3 className="text-sm font-black text-white uppercase tracking-[0.2em]">Priority Matrix</h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={volumeByPriority}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {volumeByPriority.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.name === 'Critical' ? '#EF4444' : entry.name === 'High' ? '#F97316' : entry.name === 'Medium' ? '#FACC15' : '#22C55E'} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '12px', fontSize: '12px' }}
                />
                <Legend iconType="circle" />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
