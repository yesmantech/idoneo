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

    // Style helpers
    const baseClasses = "w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all duration-200 group";
    const activeClasses = (active: boolean) => active
        ? "bg-brand-cyan/10 text-brand-cyan shadow-[0_0_15px_rgba(6,214,211,0.15)] border border-brand-cyan/20"
        : "text-slate-500 hover:bg-slate-800 hover:text-slate-200";

    return (
        <aside className="w-[280px] bg-slate-900 border-r border-slate-800 hidden lg:flex flex-col h-screen sticky top-0 shadow-[4px_0_24px_rgba(0,0,0,0.2)] z-20">
            {/* Logo / Brand */}
            <div className="p-6 pb-8">
                <Link to="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-brand-cyan rounded-squircle flex items-center justify-center font-black text-slate-900 text-xl shadow-[0_0_15px_rgba(6,214,211,0.4)]">
                        I
                    </div>
                    <div>
                        <div className="font-black text-white text-base tracking-tight leading-none">IDONEO</div>
                        <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Admin Panel</div>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide pb-4">
                {MENU_ITEMS.map(item => {
                    const isActive = isItemActive(item) || isChildActive(item);
                    const isExpanded = expandedItems.includes(item.path);

                    if (item.children && item.children.length > 0) {
                        return (
                            <div key={item.path} className="mb-2">
                                <button
                                    onClick={() => toggleExpanded(item.path)}
                                    className={`${baseClasses} ${activeClasses(isActive)} justify-between`}
                                >
                                    <span className="flex items-center gap-3">
                                        <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                                        <span className="tracking-tight">{item.label}</span>
                                    </span>
                                    <span className={`text-[10px] text-slate-600 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
                                        ▼
                                    </span>
                                </button>

                                {/* Children */}
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-1 mb-3' : 'max-h-0 opacity-0'}`}>
                                    <div className="ml-4 pl-4 border-l-2 border-slate-800 space-y-1">
                                        {item.children.map(child => {
                                            const childActive = location.pathname === child.path ||
                                                (child.path !== '/admin' && location.pathname.startsWith(child.path));

                                            return (
                                                <Link
                                                    key={child.path}
                                                    to={child.path}
                                                    className={`block px-4 py-2 text-sm font-medium rounded-xl transition-all ${childActive
                                                        ? 'text-brand-cyan bg-brand-cyan/5'
                                                        : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800/50'
                                                        }`}
                                                >
                                                    {child.label}
                                                </Link>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div key={item.path} className="mb-2">
                            <Link
                                to={item.path}
                                className={`${baseClasses} ${activeClasses(isActive)}`}
                            >
                                <span className="text-xl opacity-80 group-hover:opacity-100 transition-opacity">{item.icon}</span>
                                <span className="tracking-tight">{item.label}</span>
                            </Link>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-800">
                <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-bold text-slate-500 hover:text-brand-cyan rounded-2xl hover:bg-brand-cyan/5 transition-all group"
                >
                    <span className="group-hover:-translate-x-1 transition-transform duration-200">←</span>
                    <span>Torna al sito</span>
                </Link>
            </div>
        </aside>
    );
}
