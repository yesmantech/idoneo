import React, { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Sparkles, Trophy, User } from 'lucide-react';

/**
 * Floating pill bottom navigation — nav2 Skitla reference.
 * Dark glassmorphism pill, icon-only, sliding highlight pill,
 * contextual blue glow on active icon.
 */

const NAV_ITEMS = [
    { label: 'Home', path: '/', Icon: Home },
    { label: 'Bandi', path: '/bandi', Icon: FileText },
    { label: 'AI', path: '/ai-assistant', Icon: Sparkles },
    { label: 'Classifiche', path: '/leaderboard', Icon: Trophy },
    { label: 'Profilo', path: '/profile', Icon: User },
];

const BRAND_GLOW = '#00B1FF';

export default function BottomNavigation() {
    const location = useLocation();
    const navRef = useRef<HTMLElement>(null);
    const itemRefs = useRef<(HTMLAnchorElement | null)[]>([]);

    const activeIndex = NAV_ITEMS.findIndex(item =>
        item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
    );

    // Track the sliding pill position
    const [pillStyle, setPillStyle] = useState({ left: 0, width: 0 });

    useEffect(() => {
        const activeEl = itemRefs.current[activeIndex];
        const navEl = navRef.current;
        if (activeEl && navEl) {
            const navRect = navEl.getBoundingClientRect();
            const itemRect = activeEl.getBoundingClientRect();
            setPillStyle({
                left: itemRect.left - navRect.left,
                width: itemRect.width,
            });
        }
    }, [activeIndex]);

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
        >
            <nav
                ref={navRef}
                className="pointer-events-auto relative flex items-center"
                style={{
                    background: 'rgba(10, 10, 14, 0.88)',
                    backdropFilter: 'blur(40px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(40px) saturate(180%)',
                    borderRadius: '28px',
                    padding: '6px',
                    width: 'min(88%, 380px)',
                    border: '1px solid rgba(255, 255, 255, 0.06)',
                    boxShadow: '0 8px 40px rgba(0, 0, 0, 0.5), inset 0 0.5px 0 rgba(255, 255, 255, 0.04)',
                }}
            >
                {/* Sliding highlight pill */}
                <div
                    style={{
                        position: 'absolute',
                        top: '6px',
                        left: `${pillStyle.left}px`,
                        width: `${pillStyle.width}px`,
                        height: 'calc(100% - 12px)',
                        borderRadius: '22px',
                        background: 'rgba(255, 255, 255, 0.08)',
                        transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1), width 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: 'none',
                    }}
                />

                {/* Active glow — behind the sliding pill */}
                <div
                    style={{
                        position: 'absolute',
                        top: '50%',
                        left: `${pillStyle.left + pillStyle.width / 2}px`,
                        width: '48px',
                        height: '48px',
                        borderRadius: '50%',
                        background: BRAND_GLOW,
                        opacity: 0.12,
                        filter: 'blur(20px)',
                        transform: 'translate(-50%, -50%)',
                        transition: 'left 0.35s cubic-bezier(0.4, 0, 0.2, 1)',
                        pointerEvents: 'none',
                    }}
                />

                {NAV_ITEMS.map((item, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            ref={(el) => { itemRefs.current[index] = el; }}
                            className="relative flex items-center justify-center flex-1 z-10"
                            style={{
                                height: '44px',
                                borderRadius: '22px',
                                WebkitTapHighlightColor: 'transparent',
                                textDecoration: 'none',
                            }}
                            aria-label={item.label}
                        >
                            <item.Icon
                                size={22}
                                color={isActive ? '#FFFFFF' : 'rgba(255, 255, 255, 0.35)'}
                                strokeWidth={isActive ? 2.2 : 1.6}
                                style={{
                                    transition: 'color 0.2s ease, stroke-width 0.2s ease',
                                    filter: isActive
                                        ? `drop-shadow(0 0 8px ${BRAND_GLOW}50)`
                                        : 'none',
                                }}
                            />
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
