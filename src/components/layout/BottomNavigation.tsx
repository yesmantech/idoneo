import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Sparkles, Trophy, User } from 'lucide-react';

/**
 * Floating pill bottom navigation with SwiftUI glass material.
 * Uses CSS `.glass-ultra-thin` from index.css for Apple-style translucency.
 * Keeps original Idoneo style: icons + labels, brand blue active.
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

    // Active pill background — subtle brand tint
    const activePillBg = isDark
        ? 'rgba(0, 149, 255, 0.12)'
        : 'rgba(0, 149, 255, 0.08)';

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40 flex justify-center pointer-events-none"
            style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom, 8px))' }}
        >
            <nav
                className="pointer-events-auto glass-ultra-thin flex items-center justify-around"
                style={{
                    borderRadius: '26px',
                    padding: '4px',
                    width: 'min(94%, 420px)',
                    transition: 'background 0.3s ease',
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
                                gap: '2px',
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
                                strokeWidth={isActive ? 2.2 : 1.8}
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
