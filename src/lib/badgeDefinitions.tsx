import React from 'react';
import { Target, Zap, Trophy, Crown, GraduationCap, Users, ShieldCheck, Crosshair, BookOpen, Moon, Compass, Calendar, Gem, Star } from 'lucide-react';

export interface BadgeDefinition {
    id: string;
    name: string;
    icon: React.ReactNode;
    /** Path to the glossy 3D badge icon (liquid-glass style, like streak flames) */
    imageSrc: string;
    description: string;
    requirement: string;
    color: string;
}

export const BADGE_DEFINITIONS: BadgeDefinition[] = [
    {
        id: 'primo_passo',
        name: 'Primo Passo',
        icon: <Target className="w-8 h-8" />,
        imageSrc: '/icons/badges/primo-passo.png',
        description: 'Benvenuto a bordo! Hai iniziato il tuo percorso verso il successo.',
        requirement: 'Hai completato la tua prima simulazione su Idoneo.',
        color: 'from-blue-400 to-cyan-400'
    },
    {
        id: 'secchione',
        name: 'Secchione',
        icon: <GraduationCap className="w-8 h-8" />,
        imageSrc: '/icons/badges/secchione.png',
        description: 'La perfezione fatta persona. Non hai sbagliato neanche una virgola!',
        requirement: 'Hai ottenuto il 100% in una simulazione ufficiale (min. 10 domande).',
        color: 'from-amber-400 to-orange-500'
    },
    {
        id: 'veterano',
        name: 'Veterano',
        icon: <ShieldCheck className="w-8 h-8" />,
        imageSrc: '/icons/badges/veterano.png',
        description: 'La tua esperienza è un esempio per tutti. Conosci i quiz a memoria!',
        requirement: 'Rispondi correttamente a 1.000 quiz (Raggiungi 1.000 XP).',
        color: 'from-slate-700 to-slate-900'
    },
    {
        id: 'social',
        name: 'Social-ONE',
        icon: <Users className="w-8 h-8" />,
        imageSrc: '/icons/badges/social.png',
        description: 'Studiare in compagnia è meglio! Sei un vero leader della community.',
        requirement: 'Invita con successo 5 amici a iscriversi su Idoneo.',
        color: 'from-pink-400 to-rose-500'
    },
    {
        id: 'inarrestabile',
        name: 'Inarrestabile',
        icon: <Zap className="w-8 h-8" />,
        imageSrc: '/icons/badges/inarrestabile.png',
        description: 'Niente può fermare la tua voglia di imparare. Sei un treno!',
        requirement: 'Mantieni una streak di studio per 30 giorni consecutivi.',
        color: 'from-yellow-400 to-amber-500'
    },
    {
        id: 'cecchino',
        name: 'Cecchino',
        icon: <Crosshair className="w-8 h-8" />,
        imageSrc: '/icons/badges/cecchino.png',
        description: 'Ogni colpo va a segno. La tua precisione è chirurgica.',
        requirement: 'Completa 10 simulazioni di fila con un\'accuratezza superiore al 90%.',
        color: 'from-red-500 to-maroon-700'
    },
    {
        id: 'fulmine',
        name: 'Fulmine',
        icon: <Zap className="w-8 h-8" />,
        imageSrc: '/icons/badges/fulmine.png',
        description: 'Velocità e precisione. Hai finito il test prima ancora di iniziarlo!',
        requirement: 'Completa 5 simulazioni in meno della metà del tempo con un punteggio > 80%.',
        color: 'from-cyan-400 to-blue-600'
    },
    {
        id: 'enciclopedia',
        name: 'Enciclopedia',
        icon: <BookOpen className="w-8 h-8" />,
        imageSrc: '/icons/badges/enciclopedia.png',
        description: 'La tua conoscenza non ha confini. Hai esplorato ogni angolo del sapere.',
        requirement: 'Completa almeno un quiz in tutte le categorie disponibili.',
        color: 'from-emerald-400 to-teal-600'
    },
    {
        id: 'nottambulo',
        name: 'Nottambulo',
        icon: <Moon className="w-8 h-8" />,
        imageSrc: '/icons/badges/nottambulo.png',
        description: 'Il successo non dorme mai. Le tue ore piccole porteranno grandi risultati.',
        requirement: 'Completa 5 simulazioni tra l\'una e le cinque del mattino.',
        color: 'from-indigo-600 to-purple-900'
    },
    {
        id: 'hub_master',
        name: 'Master Hub',
        icon: <Compass className="w-8 h-8" />,
        imageSrc: '/icons/badges/hub-master.png',
        description: 'Sei il re del territorio. Nessun concorso ha segreti per te.',
        requirement: 'Partecipa a simulazioni per 5 concorsi diversi.',
        color: 'from-orange-500 to-red-600'
    },
    {
        id: 'costanza',
        name: 'Costanza',
        icon: <Calendar className="w-8 h-8" />,
        imageSrc: '/icons/badges/costanza.png',
        description: 'Il segreto del successo è la regolarità. Continua così!',
        requirement: 'Completa almeno una simulazione al giorno per 7 giorni di fila.',
        color: 'from-slate-300 to-slate-500' // Silver Tier
    },
    {
        id: 'maratona',
        name: 'Maratoneta',
        icon: <Trophy className="w-8 h-8" />,
        imageSrc: '/icons/badges/maratona.png',
        description: 'Due settimane di dedizione! Sei sulla strada giusta per il successo.',
        requirement: 'Mantieni una streak di studio per 14 giorni consecutivi.',
        color: 'from-yellow-400 to-amber-500' // Gold Tier
    },
    {
        id: 'diamante',
        name: 'Diamante',
        icon: <Gem className="w-8 h-8" />,
        imageSrc: '/icons/badges/diamante.png',
        description: 'Due mesi di costanza! Sei un vero campione di dedizione.',
        requirement: 'Mantieni una streak di studio per 60 giorni consecutivi.',
        color: 'from-blue-400 to-indigo-600' // Sapphire Tier
    },
    {
        id: 'immortale',
        name: 'Immortale',
        icon: <Star className="w-8 h-8" />,
        imageSrc: '/icons/badges/immortale.png',
        description: 'Leggendario! 100 giorni di studio senza sosta. Sei imbattibile.',
        requirement: 'Mantieni una streak di studio per 100 giorni consecutivi.',
        color: 'from-pink-400 via-purple-500 to-cyan-400' // Diamond/Rainbow Tier
    },
    {
        id: 'leggenda',
        name: 'Leggenda',
        icon: <Crown className="w-8 h-8" />,
        imageSrc: '/icons/badges/leggenda.png',
        description: 'Sei tra i migliori aspiranti d\'Italia. Continua a scalare la vetta!',
        requirement: 'Raggiungi la Top 10 nella classifica globale (Gold League).',
        color: 'from-purple-400 to-indigo-600'
    }
];
