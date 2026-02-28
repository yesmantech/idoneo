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

    // 🎖️ Forze Armate — rich amber
    if (lower.includes('armate') || lower.includes('esercito') || lower.includes('marina') || lower.includes('aeronautica'))
        return { Icon: Swords, color: '#FBBF24', bg: '#422006' };

    // 👮 Forze dell'Ordine — vivid blue
    if (lower.includes('ordine') || lower.includes('polizia') || lower.includes('carabinieri') || lower.includes('finanza') || lower.includes('agente') || lower.includes('guardia'))
        return { Icon: Shield, color: '#60A5FA', bg: '#172554' };

    // 🏛️ Pubblica Amministrazione — vibrant purple
    if (lower.includes('amministra') || lower.includes('pubblica') || lower.includes('ministero') || lower.includes('inps'))
        return { Icon: Landmark, color: '#A78BFA', bg: '#2E1065' };

    // 🏥 Sanità — bold red
    if (lower.includes('sanità') || lower.includes('sanita') || lower.includes('infermier') || lower.includes('medic') || lower.includes('ospedale') || lower.includes('asl'))
        return { Icon: HeartPulse, color: '#F87171', bg: '#450A0A' };

    // 📚 Istruzione — warm orange
    if (lower.includes('istruzione') || lower.includes('scuola') || lower.includes('docent') || lower.includes('insegn'))
        return { Icon: BookOpen, color: '#FB923C', bg: '#431407' };

    // ⚖️ Giustizia — deep indigo
    if (lower.includes('giustizia') || lower.includes('magistrat') || lower.includes('tribunale') || lower.includes('avvocat'))
        return { Icon: Scale, color: '#818CF8', bg: '#1E1B4B' };

    // 🏢 Enti Locali — bright teal
    if (lower.includes('locali') || lower.includes('comun') || lower.includes('regione') || lower.includes('provinci'))
        return { Icon: Building2, color: '#2DD4BF', bg: '#042F2E' };

    // 📊 Agenzia delle Entrate — hot pink
    if (lower.includes('entrate') || lower.includes('agenzia') || lower.includes('fisco') || lower.includes('dogane'))
        return { Icon: BarChart3, color: '#F472B6', bg: '#500724' };

    // 🎓 Università — sky blue
    if (lower.includes('università') || lower.includes('universita') || lower.includes('accademi'))
        return { Icon: GraduationCap, color: '#38BDF8', bg: '#0C4A6E' };

    // 🚂 Infrastrutture e Trasporti — emerald green
    if (lower.includes('infrastruttur') || lower.includes('trasport') || lower.includes('ferrov') || lower.includes('anas'))
        return { Icon: TrainFront, color: '#4ADE80', bg: '#052E16' };

    // Default — brand blue
    return { Icon: Shield, color: '#38BDF8', bg: '#0C4A6E' };
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
