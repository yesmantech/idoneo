import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import { AdminLayout, AdminPageHeader } from '@/components/admin';
import {
    HelpCircle,
    Trophy,
    FileText,
    CheckCircle,
    Users,
    ListChecks,
    FolderTree,
    PenSquare,
    Target,
    Upload,
    ImageIcon,
    ChevronRight,
    Clock
} from 'lucide-react';

// ================== TYPES ==================

interface Stats {
    totalQuestions: number;
    totalQuizzes: number;
    totalPosts: number;
    publishedPosts: number;
}

interface StatCardProps {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    label: string;
    value: number;
    link?: string;
}

interface QuickActionProps {
    icon: React.ElementType;
    iconBg: string;
    iconColor: string;
    label: string;
    description: string;
    to: string;
}

// ================== COMPONENTS ==================

function StatCard({ icon: Icon, iconBg, iconColor, label, value, link }: StatCardProps) {
    const content = (
        <div className="bg-white rounded-[20px] p-5 shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 border border-slate-100/50 group">
            <div className="flex items-start justify-between mb-4">
                <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center ${iconBg}`}>
                    <Icon className={`w-5 h-5 ${iconColor}`} />
                </div>
            </div>
            <div className="text-3xl font-bold text-slate-900 mb-1 tracking-tight">
                {value.toLocaleString()}
            </div>
            <div className="text-sm font-medium text-slate-500">{label}</div>
        </div>
    );

    if (link) {
        return <Link to={link} className="block">{content}</Link>;
    }
    return content;
}

function QuickAction({ icon: Icon, iconBg, iconColor, label, description, to }: QuickActionProps) {
    return (
        <Link
            to={to}
            className="flex items-start gap-4 p-5 bg-white rounded-[20px] shadow-[0_4px_16px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-300 border border-slate-100/50 group"
        >
            <div className={`w-11 h-11 rounded-[14px] flex items-center justify-center flex-shrink-0 ${iconBg}`}>
                <Icon className={`w-5 h-5 ${iconColor}`} />
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-[15px] font-semibold text-slate-900 mb-0.5">{label}</div>
                <div className="text-[13px] text-slate-500 line-clamp-1">{description}</div>
            </div>
            <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-slate-400 group-hover:translate-x-0.5 transition-all flex-shrink-0 mt-1" />
        </Link>
    );
}

function EmptyActivityState() {
    return (
        <div className="bg-white rounded-[20px] p-10 shadow-[0_4px_16px_rgba(0,0,0,0.04)] border border-slate-100/50 text-center">
            <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                <Clock className="w-8 h-8 text-slate-300" />
            </div>
            <h3 className="text-lg font-semibold text-slate-700 mb-2">Nessuna attività recente</h3>
            <p className="text-sm text-slate-400 max-w-sm mx-auto">
                Le azioni effettuate dagli admin compariranno qui.
            </p>
        </div>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
                <StatCard
                    icon={HelpCircle}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-500"
                    label="Domande totali"
                    value={loading ? 0 : stats.totalQuestions}
                    link="/admin/questions"
                />
                <StatCard
                    icon={Trophy}
                    iconBg="bg-blue-50"
                    iconColor="text-blue-500"
                    label="Concorsi"
                    value={loading ? 0 : stats.totalQuizzes}
                    link="/admin/quiz"
                />
                <StatCard
                    icon={FileText}
                    iconBg="bg-purple-50"
                    iconColor="text-purple-500"
                    label="Articoli blog"
                    value={loading ? 0 : stats.totalPosts}
                    link="/admin/blog"
                />
                <StatCard
                    icon={CheckCircle}
                    iconBg="bg-emerald-50"
                    iconColor="text-emerald-500"
                    label="Articoli pubblicati"
                    value={loading ? 0 : stats.publishedPosts}
                    link="/admin/blog"
                />
            </div>

            {/* Quick Actions */}
            <div className="mb-8">
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Azioni rapide</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <QuickAction
                        icon={Users}
                        iconBg="bg-blue-50"
                        iconColor="text-blue-500"
                        label="Gestisci utenti"
                        description="Visualizza e modifica gli account"
                        to="/admin/users"
                    />
                    <QuickAction
                        icon={ListChecks}
                        iconBg="bg-emerald-50"
                        iconColor="text-emerald-500"
                        label="Gestisci domande"
                        description="Modifica la banca dati"
                        to="/admin/questions"
                    />
                    <QuickAction
                        icon={FolderTree}
                        iconBg="bg-amber-50"
                        iconColor="text-amber-500"
                        label="Struttura concorsi"
                        description="Categorie e ruoli"
                        to="/admin/structure"
                    />
                    <QuickAction
                        icon={PenSquare}
                        iconBg="bg-purple-50"
                        iconColor="text-purple-500"
                        label="Nuovo articolo"
                        description="Scrivi per il blog"
                        to="/admin/blog/nuovo"
                    />
                    <QuickAction
                        icon={Target}
                        iconBg="bg-rose-50"
                        iconColor="text-rose-500"
                        label="Regole simulazione"
                        description="Configura le prove"
                        to="/admin/rules"
                    />
                    <QuickAction
                        icon={Upload}
                        iconBg="bg-cyan-50"
                        iconColor="text-cyan-500"
                        label="Importa CSV"
                        description="Carica domande in batch"
                        to="/admin/upload-csv"
                    />
                    <QuickAction
                        icon={ImageIcon}
                        iconBg="bg-indigo-50"
                        iconColor="text-indigo-500"
                        label="Gestisci immagini"
                        description="Media library"
                        to="/admin/images"
                    />
                </div>
            </div>

            {/* Recent Activity */}
            <div>
                <h2 className="text-lg font-semibold text-slate-900 mb-4">Attività recente</h2>
                <EmptyActivityState />
            </div>
        </AdminLayout>
    );
}
