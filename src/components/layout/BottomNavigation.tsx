import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, FileText, Sparkles, Trophy, User } from 'lucide-react';
import { Capacitor } from '@capacitor/core';

/**
 * Praktika-style bottom navigation (Skitla reference).
 *
 * - Solid white background, tall bar
 * - Lucide icons (high quality) — filled style, only color changes
 * - Bold label when active, medium when inactive
 * - 5 tabs: Home, Bandi, AI (center), Classifiche, Profilo
 * - Brand blue (#0095FF) active color
 */

const NAV_ITEMS = [
    { label: 'Home', path: '/', Icon: Home },
    { label: 'Bandi', path: '/bandi', Icon: FileText },
    { label: 'AI', path: '/ai-assistant', Icon: Sparkles },
    { label: 'Classifiche', path: '/leaderboard', Icon: Trophy },
    { label: 'Profilo', path: '/profile', Icon: User },
];

const ACTIVE_COLOR = '#0095FF';
const INACTIVE_COLOR = '#9CA3AF';

export default function BottomNavigation() {
    const location = useLocation();
    const isNativeApp = Capacitor.isNativePlatform();

    const activeIndex = NAV_ITEMS.findIndex(item =>
        item.path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(item.path)
    );

    return (
        <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-40"
            style={{
                paddingBottom: isNativeApp
                    ? 'env(safe-area-inset-bottom, 0px)'
                    : '0px',
            }}
        >
            <nav
                className="flex items-end justify-around"
                style={{
                    background: '#FFFFFF',
                    paddingTop: '18px',
                    paddingBottom: isNativeApp
                        ? 'max(12px, env(safe-area-inset-bottom, 12px))'
                        : '12px',
                }}
            >
                {NAV_ITEMS.map((item, index) => {
                    const isActive = index === activeIndex;

                    return (
                        <Link
                            key={item.path}
                            to={item.path}
                            className="flex flex-col items-center justify-end flex-1"
                            style={{
                                gap: '6px',
                                WebkitTapHighlightColor: 'transparent',
                                textDecoration: 'none',
                            }}
                        >
                            <item.Icon
                                size={26}
                                color={isActive ? ACTIVE_COLOR : INACTIVE_COLOR}
                                fill={isActive ? ACTIVE_COLOR : 'none'}
                                strokeWidth={isActive ? 2 : 1.8}
                                style={{ transition: 'color 0.15s ease' }}
                            />
                            <span
                                style={{
                                    fontSize: '12px',
                                    fontWeight: isActive ? 700 : 500,
                                    color: isActive ? ACTIVE_COLOR : INACTIVE_COLOR,
                                    transition: 'color 0.15s ease',
                                    lineHeight: 1.3,
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
