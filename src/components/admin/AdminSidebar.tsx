import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
    LayoutDashboard,
    Newspaper,
    Trophy,
    FileQuestion,
    Users,
    Settings,
    ArrowLeft,
    ChevronDown,
    AlertTriangle
} from 'lucide-react';

// ================== TYPES ==================

interface NavItem {
    icon: React.ElementType;
    label: string;
    path: string;
    exact?: boolean;
    children?: { label: string; path: string }[];
}

// ================== NAVIGATION CONFIG ==================

const MENU_ITEMS: NavItem[] = [
    {
        icon: LayoutDashboard,
        label: 'Dashboard',
        path: '/admin',
        exact: true,
    },
    {
        icon: Newspaper,
        label: 'Blog',
        path: '/admin/blog',
        children: [
            { label: 'Articoli', path: '/admin/blog' },
            { label: 'Categorie', path: '/admin/blog/categorie' },
            { label: 'Tag', path: '/admin/blog/tag' },
        ],
    },
    {
        icon: Trophy,
        label: 'Concorsi',
        path: '/admin/structure',
        children: [
            { label: 'Struttura', path: '/admin/structure' },
            { label: 'Quiz', path: '/admin/quiz' },
        ],
    },
    {
        icon: FileQuestion,
        label: 'Domande',
        path: '/admin/questions',
        children: [
            { label: 'Lista', path: '/admin/questions' },
            { label: 'Import CSV', path: '/admin/upload-csv' },
            { label: 'Immagini', path: '/admin/images' },
        ],
    },
    {
        icon: Users,
        label: 'Utenti',
        path: '/admin/users',
    },
    {
        icon: AlertTriangle,
        label: 'Segnalazioni',
        path: '/admin/reports',
    },
];

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
        <aside className="w-[280px] bg-[#E9EEF4] dark:bg-slate-900 border-r border-slate-200/50 dark:border-slate-800 hidden lg:flex flex-col h-screen sticky top-0 z-20 transition-colors">
            {/* Logo / Brand */}
            <div className="p-6 pb-8">
                <Link to="/admin" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-10 h-10 bg-gradient-to-br from-[#00B1FF] to-[#0091D5] rounded-[14px] flex items-center justify-center font-black text-white text-xl shadow-md shadow-[#00B1FF]/20">
                        I
                    </div>
                    <div>
                        <div className="font-black text-slate-900 dark:text-white text-base tracking-tight leading-none">IDONEO</div>
                        <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mt-1">Admin Panel</div>
                    </div>
                </Link>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 space-y-1 overflow-y-auto scrollbar-hide pb-4">
                {MENU_ITEMS.map(item => {
                    const Icon = item.icon;
                    const isActive = isItemActive(item) || isChildActive(item);
                    const isExpanded = expandedItems.includes(item.path);

                    if (item.children && item.children.length > 0) {
                        return (
                            <div key={item.path} className="mb-1">
                                <button
                                    onClick={() => toggleExpanded(item.path)}
                                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group justify-between
                                        ${isActive
                                            ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                            : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                                        }`}
                                >
                                    <span className="flex items-center gap-3">
                                        {isActive && <div className="w-1 h-4 bg-[#00B1FF] rounded-full -ml-2 mr-1" />}
                                        <Icon className={`w-5 h-5 ${isActive ? 'text-[#00B1FF]' : 'text-slate-400 group-hover:text-slate-500'}`} />
                                        <span>{item.label}</span>
                                    </span>
                                    <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`} />
                                </button>

                                {/* Children */}
                                <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? 'max-h-96 opacity-100 mt-1 mb-2' : 'max-h-0 opacity-0'}`}>
                                    <div className="ml-8 pl-4 border-l-2 border-slate-200 space-y-1">
                                        {item.children.map(child => {
                                            const childActive = location.pathname === child.path ||
                                                (child.path !== '/admin' && location.pathname.startsWith(child.path));

                                            return (
                                                <Link
                                                    key={child.path}
                                                    to={child.path}
                                                    className={`block px-4 py-2 text-sm font-medium rounded-xl transition-all ${childActive
                                                        ? 'text-[#00B1FF] bg-[#00B1FF]/5 dark:bg-[#00B1FF]/10'
                                                        : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-white/50 dark:hover:bg-slate-800/50'
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
                        <div key={item.path} className="mb-1">
                            <Link
                                to={item.path}
                                className={`w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-200 group
                                    ${isActive
                                        ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-sm'
                                        : 'text-slate-500 hover:bg-white/50 dark:hover:bg-slate-800/50 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                {isActive && <div className="w-1 h-4 bg-[#00B1FF] rounded-full -ml-2 mr-1" />}
                                <Icon className={`w-5 h-5 ${isActive ? 'text-[#00B1FF]' : 'text-slate-400 group-hover:text-slate-500'}`} />
                                <span>{item.label}</span>
                            </Link>
                        </div>
                    );
                })}
            </nav>

            {/* Footer */}
            <div className="p-4 border-t border-slate-200/50">
                <Link
                    to="/"
                    className="flex items-center gap-3 px-4 py-3 text-sm font-semibold text-slate-500 hover:text-[#00B1FF] rounded-2xl hover:bg-white/50 transition-all group"
                >
                    <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform duration-200" />
                    <span>Torna al sito</span>
                </Link>
            </div>
        </aside>
    );
}
