import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AdminLayout, AdminPageHeader } from '@/components/admin';

// ================== TYPES ==================

interface Stats {
    totalQuestions: number;
    totalQuizzes: number;
    totalPosts: number;
    publishedPosts: number;
}

interface StatCardProps {
    icon: string;
    label: string;
    value: number;
    change?: string;
    link?: string;
}

// ================== COMPONENTS ==================

function StatCard({ icon, label, value, change, link }: StatCardProps) {
    const content = (
        <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-5 hover:bg-slate-800/50 transition-colors">
            <div className="flex items-start justify-between mb-3">
                <span className="text-2xl">{icon}</span>
                {change && (
                    <span className="text-xs text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">
                        {change}
                    </span>
                )}
            </div>
            <div className="text-3xl font-bold text-white mb-1">
                {value.toLocaleString()}
            </div>
            <div className="text-sm text-slate-400">{label}</div>
        </div>
    );

    if (link) {
        return <Link to={link}>{content}</Link>;
    }
    return content;
}

function QuickAction({ icon, label, to }: { icon: string; label: string; to: string }) {
    return (
        <Link
            to={to}
            className="flex items-center gap-3 p-4 bg-slate-900/50 border border-slate-800 rounded-xl hover:bg-slate-800/50 hover:border-slate-700 transition-all"
        >
            <span className="text-xl">{icon}</span>
            <span className="text-slate-300 font-medium">{label}</span>
            <span className="ml-auto text-slate-500">→</span>
        </Link>
    );
}

// ================== MAIN COMPONENT ==================

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<Stats>({
        totalQuestions: 0,
        totalQuizzes: 0,
        totalPosts: 0,
        publishedPosts: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadStats = async () => {
            try {
                const [questionsRes, quizzesRes, postsRes, publishedRes] = await Promise.all([
                    supabase.from('questions').select('id', { count: 'exact', head: true }),
                    supabase.from('quizzes').select('id', { count: 'exact', head: true }),
                    supabase.from('blog_posts').select('id', { count: 'exact', head: true }),
                    supabase.from('blog_posts').select('id', { count: 'exact', head: true }).eq('status', 'published'),
                ]);

                setStats({
                    totalQuestions: questionsRes.count ?? 0,
                    totalQuizzes: quizzesRes.count ?? 0,
                    totalPosts: postsRes.count ?? 0,
                    publishedPosts: publishedRes.count ?? 0,
                });
            } catch (error) {
                console.error('Failed to load stats:', error);
            } finally {
                setLoading(false);
            }
        };

        loadStats();
    }, []);

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Dashboard"
                subtitle="Panoramica della piattaforma IDONEO"
            />

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <StatCard
                    icon="❓"
                    label="Domande totali"
                    value={loading ? 0 : stats.totalQuestions}
                    link="/admin/questions"
                />
                <StatCard
                    icon="🏆"
                    label="Concorsi"
                    value={loading ? 0 : stats.totalQuizzes}
                    link="/admin/quiz"
                />
                <StatCard
                    icon="📰"
                    label="Articoli blog"
                    value={loading ? 0 : stats.totalPosts}
                    link="/admin/blog"
                />
                <StatCard
                    icon="✅"
                    label="Articoli pubblicati"
                    value={loading ? 0 : stats.publishedPosts}
                    link="/admin/blog"
                />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-white mb-4">Azioni rapide</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    <QuickAction icon="✏️" label="Nuovo articolo" to="/admin/blog/nuovo" />
                    <QuickAction icon="📋" label="Gestisci domande" to="/admin/questions" />
                    <QuickAction icon="🎯" label="Regole simulazione" to="/admin/rules" />
                    <QuickAction icon="📁" label="Struttura concorsi" to="/admin/structure" />
                    <QuickAction icon="📤" label="Importa CSV" to="/admin/upload-csv" />
                    <QuickAction icon="🖼️" label="Gestisci immagini" to="/admin/images" />
                </div>
            </div>

            {/* Recent Activity Placeholder */}
            <div>
                <h2 className="text-lg font-semibold text-white mb-4">Attività recente</h2>
                <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-8 text-center">
                    <p className="text-slate-500">
                        La cronologia delle attività sarà disponibile presto.
                    </p>
                </div>
            </div>
        </AdminLayout>
    );
}
