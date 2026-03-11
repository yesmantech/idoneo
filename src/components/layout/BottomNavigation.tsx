import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Sparkles, Trophy, User } from 'lucide-react';

/**
 * Floating pill bottom navigation.
 * Combines original Idoneo style (icons + labels, brand blue)
 * with Skitla-style floating pill container.
 */

const NAV_ITEMS = [
    { label: 'Home', path: '/', Icon: Home },
    { label: 'Bandi', path: '/bandi', Icon: FileText },
    { label: 'AI', path: '/ai-assistant', Icon: Sparkles },
    { label: 'Classifiche', path: '/leaderboard', Icon: Trophy },
    { label: 'Profilo', path: '/profile', Icon: User },
];

const ACTIVE_COLOR = '#0095FF';

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

    const inactiveColor = isDark ? '#6B7280' : '#9CA3AF';

    const activeIndex = NAV_ITEMS.findIndex(item =>
        item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
    );

    // Theme-aware floating pill
    const pillBg = isDark
        ? 'rgba(10, 10, 14, 0.92)'
        : 'rgba(255, 255, 255, 0.95)';
    const pillBorder = isDark
        ? '1px solid rgba(255, 255, 255, 0.08)'
        : '1px solid rgba(0, 0, 0, 0.06)';
    const pillShadow = isDark
        ? '0 8px 40px rgba(0, 0, 0, 0.55), inset 0 0.5px 0 rgba(255, 255, 255, 0.05)'
        : '0 4px 30px rgba(0, 0, 0, 0.08), 0 1px 3px rgba(0, 0, 0, 0.04)';
    const activePillBg = isDark
        ? 'rgba(0, 149, 255, 0.15)'
        : 'rgba(0, 149, 255, 0.08)';

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
        >
            <nav
                className="pointer-events-auto flex items-center justify-around"
                style={{
                    background: pillBg,
                    backdropFilter: 'blur(28px) saturate(180%)',
                    WebkitBackdropFilter: 'blur(28px) saturate(180%)',
                    borderRadius: '28px',
                    padding: '6px 4px',
                    width: 'min(94%, 420px)',
                    border: pillBorder,
                    boxShadow: pillShadow,
                    transition: 'background 0.3s ease, box-shadow 0.3s ease',
                }}
            >
                {NAV_ITEMS.map((item, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center justify-center flex-1"
                            style={{
                                gap: '3px',
                                padding: '8px 0 6px',
                                borderRadius: '22px',
                                background: isActive ? activePillBg : 'transparent',
                                transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
                                WebkitTapHighlightColor: 'transparent',
                                textDecoration: 'none',
                            }}
                        >
                            <item.Icon
                                size={22}
                                color={isActive ? ACTIVE_COLOR : inactiveColor}
                                strokeWidth={2}
                                style={{ transition: 'color 0.15s ease' }}
                            />
                            <span
                                style={{
                                    fontSize: '10px',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? ACTIVE_COLOR : inactiveColor,
                                    transition: 'color 0.15s ease',
                                    lineHeight: 1,
                                    letterSpacing: '-0.01em',
                                }}
                            >
                                {item.label}
                            </span>
                        </Link>
                    );
                })}
            </nav>
        </div>
    );
}
