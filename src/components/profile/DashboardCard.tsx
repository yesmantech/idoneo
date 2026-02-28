import React from 'react';
import { ChevronRight, Shield, Swords, Landmark, HeartPulse, BookOpen, Scale, Building2, BarChart3, GraduationCap, TrainFront } from 'lucide-react';

export interface DashboardCardProps {
    key?: React.Key;
    quizId: string;
    title: string;
    category?: string;
    progress: number; // 0-100
    lastPlayed?: Date;
    onClick: () => void;
}

/** Category → Icon + Color mapping for iOS-native flat icon squares */
const getCategoryStyle = (catTitle?: string) => {
    const lower = (catTitle || "").toLowerCase();

    // 🎖️ Forze Armate
    if (lower.includes('armate') || lower.includes('esercito') || lower.includes('marina') || lower.includes('aeronautica'))
        return { Icon: Swords, color: '#F59E0B', bg: 'rgba(245,158,11,0.12)' };

    // 👮 Forze dell'Ordine
    if (lower.includes('ordine') || lower.includes('polizia') || lower.includes('carabinieri') || lower.includes('finanza') || lower.includes('agente') || lower.includes('guardia'))
        return { Icon: Shield, color: '#3B82F6', bg: 'rgba(59,130,246,0.12)' };

    // 🏛️ Pubblica Amministrazione
    if (lower.includes('amministra') || lower.includes('pubblica') || lower.includes('ministero') || lower.includes('inps'))
        return { Icon: Landmark, color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)' };

    // 🏥 Sanità
    if (lower.includes('sanità') || lower.includes('sanita') || lower.includes('infermier') || lower.includes('medic') || lower.includes('ospedale') || lower.includes('asl'))
        return { Icon: HeartPulse, color: '#EF4444', bg: 'rgba(239,68,68,0.12)' };

    // 📚 Istruzione
    if (lower.includes('istruzione') || lower.includes('scuola') || lower.includes('docent') || lower.includes('insegn'))
        return { Icon: BookOpen, color: '#F97316', bg: 'rgba(249,115,22,0.12)' };

    // ⚖️ Giustizia
    if (lower.includes('giustizia') || lower.includes('magistrat') || lower.includes('tribunale') || lower.includes('avvocat'))
        return { Icon: Scale, color: '#6366F1', bg: 'rgba(99,102,241,0.12)' };

    // 🏢 Enti Locali
    if (lower.includes('locali') || lower.includes('comun') || lower.includes('regione') || lower.includes('provinci'))
        return { Icon: Building2, color: '#14B8A6', bg: 'rgba(20,184,166,0.12)' };

    // 📊 Agenzia delle Entrate
    if (lower.includes('entrate') || lower.includes('agenzia') || lower.includes('fisco') || lower.includes('dogane'))
        return { Icon: BarChart3, color: '#EC4899', bg: 'rgba(236,72,153,0.12)' };

    // 🎓 Università
    if (lower.includes('università') || lower.includes('universita') || lower.includes('accademi'))
        return { Icon: GraduationCap, color: '#0EA5E9', bg: 'rgba(14,165,233,0.12)' };

    // 🚂 Infrastrutture e Trasporti
    if (lower.includes('infrastruttur') || lower.includes('trasport') || lower.includes('ferrov') || lower.includes('anas'))
        return { Icon: TrainFront, color: '#22C55E', bg: 'rgba(34,197,94,0.12)' };

    // Default — Shield blue
    return { Icon: Shield, color: '#00B1FF', bg: 'rgba(0,177,255,0.12)' };
};

export default function DashboardCard({ title, category, progress, onClick }: DashboardCardProps) {
    const { Icon, color, bg } = getCategoryStyle(category || title);

    return (
        <button
            onClick={onClick}
            className="w-full bg-white dark:bg-[#1C1C1E] rounded-2xl p-[18px] flex items-center gap-[18px] active:scale-[0.98] active:opacity-80 transition-all text-left group"
        >
            {/* Icon Avatar — iOS flat colored square */}
            <div
                className="w-[46px] h-[46px] rounded-[14px] flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: bg }}
            >
                <Icon className="w-[20px] h-[20px]" style={{ color }} strokeWidth={2} />
            </div>

            <div className="flex-1 min-w-0 flex flex-col justify-center">
                <h3 className="font-semibold text-slate-900 dark:text-white truncate pr-2 text-[15px] mb-[10px] leading-none tracking-wide">{title}</h3>

                {/* Progress Bar */}
                <div className="flex items-center gap-2">
                    <div className="flex-1 h-[6px] bg-slate-100 dark:bg-[#28303F] rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${progress}%`, backgroundColor: color }}
                        />
                    </div>
                </div>
            </div>

            {/* Chevron */}
            <ChevronRight className="w-[18px] h-[18px] text-slate-300 dark:text-slate-500 flex-shrink-0 group-hover:dark:text-white transition-colors" />
        </button>
    );
}
