import React from 'react';
import { Sparkles, AlertCircle, Info, TrendingUp, TrendingDown } from 'lucide-react';

export type InsightPriority = 'low' | 'medium' | 'high';
export type InsightTrend = 'up' | 'down' | 'neutral';

interface AIInsightCardProps {
    title: string;
    description: string;
    priority: InsightPriority;
    trend?: InsightTrend;
    recommendation: string;
}

export function AIInsightCard({ title, description, priority, trend, recommendation }: AIInsightCardProps) {
    const priorityColors = {
        low: 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/30 dark:border-emerald-900/30',
        medium: 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/30 dark:border-amber-900/30',
        high: 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/30 dark:border-rose-900/30'
    };

    const StatusIcon = priority === 'high' ? AlertCircle : priority === 'medium' ? Info : Sparkles;

    return (
        <div className={`p-5 rounded-[24px] border transition-all duration-300 ${priorityColors[priority]} group hover:shadow-lg`}>
            <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                    <StatusIcon className="w-5 h-5 opacity-80" />
                    <h3 className="font-bold text-[15px]">{title}</h3>
                </div>
                {trend && (
                    <div className={`flex items-center gap-1 text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${trend === 'up' ? 'bg-emerald-100/50 text-emerald-700' :
                            trend === 'down' ? 'bg-rose-100/50 text-rose-700' :
                                'bg-slate-100/50 text-slate-700'
                        }`}>
                        {trend === 'up' ? <TrendingUp className="w-3 h-3" /> : trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                        {trend}
                    </div>
                )}
            </div>

            <p className="text-[13px] opacity-80 mb-4 leading-relaxed">
                {description}
            </p>

            <div className="bg-white/40 dark:bg-black/20 p-4 rounded-xl border border-white/20 dark:border-black/10">
                <div className="text-[11px] font-bold uppercase tracking-widest opacity-40 mb-1.5 flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3" />
                    AI Recommendation
                </div>
                <p className="text-[13px] font-medium italic">
                    "{recommendation}"
                </p>
            </div>
        </div>
    );
}
