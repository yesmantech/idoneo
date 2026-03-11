import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Sparkles, Trophy, User } from 'lucide-react';

/**
 * Floating pill-style bottom navigation (Skitla reference).
 * - Adapts to light/dark theme
 * - Icon-only navigation
 * - Active item gets a pill highlight with brand color accent
 */

const NAV_ITEMS = [
    { label: 'Home', path: '/', Icon: Home },
    { label: 'Bandi', path: '/bandi', Icon: FileText },
    { label: 'AI', path: '/ai-assistant', Icon: Sparkles },
    { label: 'Classifiche', path: '/leaderboard', Icon: Trophy },
    { label: 'Profilo', path: '/profile', Icon: User },
];

const BRAND_BLUE = '#00B1FF';

export default function BottomNavigation() {
    const location = useLocation();

    // Dark mode detection
    const [isDark, setIsDark] = useState(() =>
        document.documentElement.classList.contains('dark')
    );

    useEffect(() => {
        const observer = new MutationObserver(() => {
            setIsDark(document.documentElement.classList.contains('dark'));
        });
        observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
        return () => observer.disconnect();
    }, []);

    const activeIndex = NAV_ITEMS.findIndex(item =>
        item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
    );

    // Theme-aware colors
    const pillBg = isDark
        ? 'rgba(15, 15, 20, 0.88)'
        : 'rgba(255, 255, 255, 0.92)';
    const pillBorder = isDark
        ? '1px solid rgba(255, 255, 255, 0.08)'
        : '1px solid rgba(0, 0, 0, 0.06)';
    const pillShadow = isDark
        ? '0 8px 32px rgba(0, 0, 0, 0.5), inset 0 0.5px 0 rgba(255, 255, 255, 0.06)'
        : '0 4px 24px rgba(0, 0, 0, 0.08), 0 1px 4px rgba(0, 0, 0, 0.04)';
    const activeItemBg = isDark
        ? 'rgba(255, 255, 255, 0.12)'
        : 'rgba(0, 177, 255, 0.08)';
    const activeColor = isDark ? '#FFFFFF' : BRAND_BLUE;
    const inactiveColor = isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.28)';

    return (
        <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
            style={{ paddingBottom: 'max(10px, env(safe-area-inset-bottom, 10px))' }}
        >
            <nav
                className="pointer-events-auto flex items-center justify-around"
                style={{
                    background: pillBg,
                    backdropFilter: 'blur(28px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                    borderRadius: '26px',
                    padding: '8px 6px',
                    width: 'min(90%, 400px)',
                    border: pillBorder,
                    boxShadow: pillShadow,
                    transition: 'background 0.3s ease, box-shadow 0.3s ease, border 0.3s ease',
                }}
            >
                {NAV_ITEMS.map((item, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex items-center justify-center relative"
                            style={{
                                width: isActive ? '54px' : '46px',
                                height: '42px',
                                borderRadius: '18px',
                                background: isActive ? activeItemBg : 'transparent',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                WebkitTapHighlightColor: 'transparent',
                                textDecoration: 'none',
                            }}
                            aria-label={item.label}
                        >
                            <item.Icon
                                size={isActive ? 23 : 21}
                                color={isActive ? activeColor : inactiveColor}
                                strokeWidth={isActive ? 2.2 : 1.8}
                                style={{
                                    transition: 'all 0.2s ease',
                                    filter: isActive
                                        ? isDark
                                            ? 'drop-shadow(0 0 6px rgba(255, 255, 255, 0.25))'
                                            : 'drop-shadow(0 0 4px rgba(0, 177, 255, 0.3))'
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
