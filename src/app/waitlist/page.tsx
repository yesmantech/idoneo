import React, { useEffect } from "react";
import {
    Flame, Shield, Siren, Key, MapPin,
    FlameKindling, Star, Plane, Anchor,
    Car, CreditCard, Landmark, Umbrella,
    Building2, Gavel
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";

export default function WaitlistPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    // Capture referral code from URL and store in localStorage
    useEffect(() => {
        const refCode = searchParams.get('ref');
        if (refCode) {
            localStorage.setItem('referral_code', refCode.toUpperCase());
            console.log('Referral code captured:', refCode);
        }
    }, [searchParams]);

    // Icon mapping using close Lucide equivalents

    const icons = [
        // Row 1 (Top)
        { Icon: Flame, bg: "bg-amber-100", color: "text-amber-600", left: "10%", top: "15%" }, // GdF
        { Icon: Shield, bg: "bg-blue-100", color: "text-blue-800", left: "50%", top: "8%" }, // Polizia
        { Icon: Siren, bg: "bg-red-100", color: "text-red-700", left: "85%", top: "18%" }, // Carabinieri

        // Row 2
        { Icon: Key, bg: "bg-sky-100", color: "text-sky-700", left: "30%", top: "25%" }, // Polizia Penitenziaria
        { Icon: MapPin, bg: "bg-cyan-50", color: "text-cyan-600", left: "70%", top: "28%" }, // Pol. Locale

        // Row 3
        { Icon: FlameKindling, bg: "bg-orange-100", color: "text-orange-600", left: "5%", top: "40%" }, // Vigili Fuoco
        { Icon: Star, bg: "bg-emerald-100", color: "text-emerald-700", left: "45%", top: "45%" }, // Esercito
        { Icon: Plane, bg: "bg-sky-50", color: "text-sky-500", left: "90%", top: "42%" }, // Aeronautica

        // Row 4
        { Icon: Anchor, bg: "bg-indigo-100", color: "text-indigo-800", left: "20%", top: "55%" }, // Marina
        { Icon: Car, bg: "bg-lime-100", color: "text-lime-700", left: "65%", top: "58%" }, // Stradale

        // Row 5
        { Icon: CreditCard, bg: "bg-orange-50", color: "text-orange-500", left: "85%", top: "65%" }, // Motorizzazione
        { Icon: Landmark, bg: "bg-blue-50", color: "text-blue-600", left: "40%", top: "68%" }, // Entrate (Center Lowest)
        { Icon: Umbrella, bg: "bg-teal-50", color: "text-teal-600", left: "5%", top: "70%" }, // INPS

        // Row 6 (Bottom Fringe)
        { Icon: Building2, bg: "bg-slate-100", color: "text-slate-700", left: "20%", top: "82%" }, // Interno
        { Icon: Gavel, bg: "bg-purple-100", color: "text-purple-700", left: "75%", top: "80%" }, // Giustizia
    ];

    return (
        <div className="min-h-screen bg-[var(--background)] text-[var(--foreground)] font-sans flex flex-col overflow-hidden transition-colors duration-500">

            {/* Top Half: Floating Coins (45% of screen) */}
            <div className="relative w-full h-[45vh] shrink-0 select-none">
                {icons.map((item, idx) => (
                    <div
                        key={idx}
                        className={`absolute w-16 h-16 md:w-20 md:h-20 rounded-full shadow-md shadow-black/5 dark:shadow-white/5 flex items-center justify-center ${item.bg} dark:bg-opacity-20 backdrop-blur-sm animate-in fade-in zoom-in duration-700`}
                        style={{
                            left: item.left,
                            top: item.top,
                            animationDelay: `${idx * 50}ms`
                        }}
                    >
                        <item.Icon className={`w-8 h-8 md:w-10 md:h-10 ${item.color}`} strokeWidth={2} />
                    </div>
                ))}

                {/* Fade at bottom of icons */}
                <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-[var(--background)] to-transparent" />
            </div>

            {/* Bottom Half: Content */}
            <div className="flex-1 w-full max-w-md mx-auto px-6 flex flex-col items-center justify-start pt-6 space-y-8 animate-in slide-in-from-bottom-10 fade-in duration-700 delay-300 relative z-10 pb-8">

                {/* Hero Text */}
                <div className="space-y-3 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-[var(--foreground)] leading-[1.1]">
                        Passa il tuo<br />prossimo concorso
                    </h1>
                    <h2 className="text-[17px] md:text-lg font-medium text-[var(--foreground)] opacity-60 leading-relaxed max-w-xs mx-auto">
                        Analytics, simulazioni e un piano di studio guidato in un’unica app
                    </h2>
                </div>

                {/* Button */}
                <div className="w-full flex flex-col items-center space-y-4">
                    <button
                        onClick={() => navigate('/login')}
                        className="w-full max-w-[200px] h-12 bg-[#00B1FF] hover:bg-[#0099e6] active:scale-[0.98] transition-all text-white font-bold text-[15px] rounded-full shadow-lg shadow-[#00B1FF]/20 flex items-center justify-center"
                    >
                        Iscriviti alla waitlist
                    </button>

                    <p className="text-[11px] text-[var(--foreground)] opacity-40 font-medium">
                        Niente spam, solo aggiornamenti sui concorsi.
                    </p>
                </div>
            </div>
        </div>
    );
}
