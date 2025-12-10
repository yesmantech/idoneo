import React from 'react';
import { Link, useLocation } from 'react-router-dom';

// ================== TYPES ==================

interface NavItem {
    icon: string;
    label: string;
    path: string;
    exact?: boolean;
    children?: { label: string; path: string }[];
}

// ================== NAVIGATION CONFIG ==================

const MENU_ITEMS: NavItem[] = [
    {
        icon: '📊',
        label: 'Dashboard',
        path: '/admin',
        exact: true,
    },
    {
        icon: '📰',
        label: 'Blog',
        path: '/admin/blog',
        children: [
            { label: 'Articoli', path: '/admin/blog' },
            { label: 'Categorie', path: '/admin/blog/categorie' },
        ],
    },
    {
        icon: '🏆',
        label: 'Concorsi',
        path: '/admin/concorsi',
        children: [
            { label: 'Lista', path: '/admin/concorsi' },
            { label: 'Struttura', path: '/admin/structure' },
        ],
    },
    {
        icon: '📝',
        label: 'Quiz',
        path: '/admin/quiz',
        children: [
            { label: 'Domande', path: '/admin/questions' },
            { label: 'Materie', path: '/admin/quiz' },
            { label: 'Regole', path: '/admin/rules' },
        ],
    },
    {
        icon: '👥',
        label: 'Utenti',
        path: '/admin/utenti',
    },
    {
        icon: '⚙️',
        label: 'Impostazioni',
        path: '/admin/impostazioni',
    },
];

// ================== COMPONENTS ==================

interface NavItemButtonProps {
    item: NavItem;
    isActive: boolean;
    isExpanded: boolean;
    onToggle: () => void;
}

function NavItemButton({ item, isActive, isExpanded, onToggle }: NavItemButtonProps) {
    const hasChildren = item.children && item.children.length > 0;

    const baseClasses = "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150";
    const activeClasses = isActive
        ? "bg-emerald-500/10 text-emerald-400 border-l-2 border-emerald-500"
        : "text-slate-400 hover:bg-slate-800/50 hover:text-white";

    if (hasChildren) {
        return (
            <button
                onClick={onToggle}
                className={`${baseClasses} ${activeClasses} justify-between`}
            >
                <span className="flex items-center gap-3">
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                </span>
                <span className={`text-xs transition-transform ${isExpanded ? 'rotate-180' : ''}`}>
                    ▾
                </span>
            </button>
        );
    }

    return (
        <Link
            to={item.path}
            className={`${baseClasses} ${activeClasses}`}
        >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
        </Link>
    );
}

// ================== MAIN COMPONENT ==================

export default function AdminSidebar() {
    const location = useLocation();
    const [expandedItems, setExpandedItems] = React.useState<string[]>([]);

    // Check if a nav item is active
    const isItemActive = (item: NavItem): boolean => {
        if (item.exact) {
            return location.pathname === item.path;
        }
        return location.pathname.startsWith(item.path);
    };

    // Check if any child is active
    const isChildActive = (item: NavItem): boolean => {
        if (!item.children) return false;
        return item.children.some(child => location.pathname.startsWith(child.path));
    };

    // Auto-expand sections with active children
    React.useEffect(() => {
        const activeParents = MENU_ITEMS
            .filter(item => item.children && (isItemActive(item) || isChildActive(item)))
            .map(item => item.path);

        setExpandedItems(prev => {
            const combined = [...new Set([...prev, ...activeParents])];
            return combined;
        });
    }, [location.pathname]);

    const toggleExpanded = (path: string) => {
        setExpandedItems(prev =>
            prev.includes(path)
                ? prev.filter(p => p !== path)
                : [...prev, path]
        );
    };

    return (
        <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col h-screen sticky top-0">
            {/* Logo / Brand */}
            <div className="p-4 border-b border-slate-800">
                <Link to="/admin" className="flex items-center gap-3">
                    <div className="w-9 h-9 bg-emerald-500 rounded-lg flex items-center justify-center font-bold text-white text-lg">
                        I
                    </div>
                    <div>
                        <div className="font-bold text-white text-sm">IDONEO</div>
                        <div className="text-[10px] text-slate-500 uppercase tracking-wider">Admin</div>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
                {MENU_ITEMS.map(item => {
                    const isActive = isItemActive(item) || isChildActive(item);
                    const isExpanded = expandedItems.includes(item.path);

                    return (
                        <div key={item.path}>
                            <NavItemButton
                                item={item}
                                isActive={isActive}
                                isExpanded={isExpanded}
                                onToggle={() => toggleExpanded(item.path)}
                            />

                            {/* Children */}
                            {item.children && isExpanded && (
                                <div className="ml-8 mt-1 space-y-1">
                                    {item.children.map(child => {
                                        const childActive = location.pathname === child.path ||
                                            (child.path !== '/admin' && location.pathname.startsWith(child.path));

                                        return (
                                            <Link
                                                key={child.path}
                                                to={child.path}
                                                className={`block px-3 py-2 text-sm rounded-lg transition-colors ${childActive
                                                        ? 'text-emerald-400 bg-emerald-500/5'
                                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/30'
                                                    }`}
                                            >
                                                {child.label}
                                            </Link>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-3 border-t border-slate-800">
                <Link
                    to="/"
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-500 hover:text-white rounded-lg hover:bg-slate-800/50 transition-colors"
                >
                    <span>←</span>
                    <span>Torna al sito</span>
                </Link>
                <div className="px-3 py-2 text-[10px] text-slate-600">
                    IDONEO Admin v1.0
                </div>
            </div>
        </aside>
    );
}
