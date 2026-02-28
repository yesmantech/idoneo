import { Shield, Swords, Landmark, HeartPulse, BookOpen, Scale, Building2, BarChart3, GraduationCap, TrainFront, type LucideIcon } from 'lucide-react';

export interface CategoryStyle {
    Icon: LucideIcon;
    color: string;
    bg: string;
    bgLight: string;
}

/** Shared category → Icon + Color mapping for iOS-native flat icon squares */
export function getCategoryStyle(catTitle?: string): CategoryStyle {
    const lower = (catTitle || "").toLowerCase();

    // 🎖️ Forze Armate — rich amber
    if (lower.includes('armate') || lower.includes('esercito') || lower.includes('marina') || lower.includes('aeronautica'))
        return { Icon: Swords, color: '#FBBF24', bg: '#422006', bgLight: '#FEF3C7' };

    // 👮 Forze dell'Ordine — vivid blue
    if (lower.includes('ordine') || lower.includes('polizia') || lower.includes('carabinieri') || lower.includes('finanza') || lower.includes('agente') || lower.includes('guardia'))
        return { Icon: Shield, color: '#60A5FA', bg: '#172554', bgLight: '#DBEAFE' };

    // 🏛️ Pubblica Amministrazione — vibrant purple
    if (lower.includes('amministra') || lower.includes('pubblica') || lower.includes('ministero') || lower.includes('inps'))
        return { Icon: Landmark, color: '#A78BFA', bg: '#2E1065', bgLight: '#EDE9FE' };

    // 🏥 Sanità — bold red
    if (lower.includes('sanità') || lower.includes('sanita') || lower.includes('infermier') || lower.includes('medic') || lower.includes('ospedale') || lower.includes('asl'))
        return { Icon: HeartPulse, color: '#F87171', bg: '#450A0A', bgLight: '#FEE2E2' };

    // 📚 Istruzione — warm orange
    if (lower.includes('istruzione') || lower.includes('scuola') || lower.includes('docent') || lower.includes('insegn'))
        return { Icon: BookOpen, color: '#FB923C', bg: '#431407', bgLight: '#FFEDD5' };

    // ⚖️ Giustizia — deep indigo
    if (lower.includes('giustizia') || lower.includes('magistrat') || lower.includes('tribunale') || lower.includes('avvocat'))
        return { Icon: Scale, color: '#818CF8', bg: '#1E1B4B', bgLight: '#E0E7FF' };

    // 🏢 Enti Locali — bright teal
    if (lower.includes('locali') || lower.includes('comun') || lower.includes('regione') || lower.includes('provinci'))
        return { Icon: Building2, color: '#2DD4BF', bg: '#042F2E', bgLight: '#CCFBF1' };

    // 📊 Agenzia delle Entrate — hot pink
    if (lower.includes('entrate') || lower.includes('agenzia') || lower.includes('fisco') || lower.includes('dogane'))
        return { Icon: BarChart3, color: '#F472B6', bg: '#500724', bgLight: '#FCE7F3' };

    // 🎓 Università — sky blue
    if (lower.includes('università') || lower.includes('universita') || lower.includes('accademi'))
        return { Icon: GraduationCap, color: '#38BDF8', bg: '#0C4A6E', bgLight: '#E0F2FE' };

    // 🚂 Infrastrutture e Trasporti — emerald green
    if (lower.includes('infrastruttur') || lower.includes('trasport') || lower.includes('ferrov') || lower.includes('anas'))
        return { Icon: TrainFront, color: '#4ADE80', bg: '#052E16', bgLight: '#DCFCE7' };

    // Default — brand blue
    return { Icon: Shield, color: '#38BDF8', bg: '#0C4A6E', bgLight: '#E0F2FE' };
}
