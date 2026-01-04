import React from 'react';
import ReactDOM from 'react-dom';

// ================== TYPES ==================

interface Column<T> {
    key: string;
    label: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
    render?: (item: T, index: number) => React.ReactNode;
}

interface MenuItem {
    label: string;
    icon?: string;
    onClick: () => void;
    variant?: 'default' | 'destructive';
}

interface AdminTableProps<T> {
    columns: Column<T>[];
    data: T[];
    loading?: boolean;
    emptyState?: React.ReactNode;
    rowKey: (item: T) => string;
    onRowClick?: (item: T) => void;
    rowActions?: (item: T) => MenuItem[];
}

// ================== ROW ACTIONS MENU ==================

interface RowActionsMenuProps {
    actions: MenuItem[];
}

function RowActionsMenu({ actions }: RowActionsMenuProps) {
    const [open, setOpen] = React.useState(false);
    const [menuPosition, setMenuPosition] = React.useState({ top: 0, left: 0, openUpward: false });
    const buttonRef = React.useRef<HTMLButtonElement>(null);
    const menuRef = React.useRef<HTMLDivElement>(null);

    // Close on outside click or scroll
    React.useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            const target = e.target as Node;
            const isInsideButton = buttonRef.current?.contains(target);
            const isInsideMenu = menuRef.current?.contains(target);

            if (!isInsideButton && !isInsideMenu) {
                setOpen(false);
            }
        };
        const handleScroll = () => setOpen(false);

        if (open) {
            // Use setTimeout to avoid immediate close on the same click
            setTimeout(() => {
                document.addEventListener('mousedown', handleClickOutside);
            }, 0);
            document.addEventListener('scroll', handleScroll, true);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('scroll', handleScroll, true);
        };
    }, [open]);

    // Calculate position when opening
    const handleOpen = (e: React.MouseEvent) => {
        e.stopPropagation();
        if (!open && buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            const menuHeight = (actions.length * 44) + 12;
            const spaceBelow = window.innerHeight - rect.bottom;
            const openUpward = spaceBelow < menuHeight;

            setMenuPosition({
                top: openUpward ? rect.top - menuHeight : rect.bottom + 4,
                left: rect.right - 192,
                openUpward
            });
        }
        setOpen(!open);
    };

    return (
        <>
            <button
                ref={buttonRef}
                onClick={handleOpen}
                className="w-8 h-8 flex items-center justify-center rounded-lg text-[var(--foreground)] opacity-40 hover:bg-slate-100 dark:hover:bg-slate-800 hover:opacity-100 transition-all"
            >
                ⋮
            </button>

            {open && ReactDOM.createPortal(
                <div
                    ref={menuRef}
                    className="fixed w-48 bg-[var(--card)] border border-[var(--card-border)] rounded-xl shadow-2xl z-[9999] py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                    style={{ top: menuPosition.top, left: menuPosition.left }}
                >
                    {actions.map((action, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation();
                                setOpen(false);
                                action.onClick();
                            }}
                            className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-3 transition-colors ${action.variant === 'destructive'
                                ? 'text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-900/20'
                                : 'text-[var(--foreground)] opacity-70 hover:bg-slate-50 dark:hover:bg-slate-800 hover:opacity-100'
                                }`}
                        >
                            {action.icon && <span className="text-base">{action.icon}</span>}
                            <span className="font-medium">{action.label}</span>
                        </button>
                    ))}
                </div>,
                document.body
            )}
        </>
    );
}

// ================== LOADING SKELETON ==================

function TableSkeleton({ columns }: { columns: number }) {
    return (
        <div className="animate-pulse">
            {[1, 2, 3, 4, 5].map(row => (
                <div key={row} className="flex gap-4 px-4 py-3 border-b border-[var(--card-border)]">
                    {Array.from({ length: columns }).map((_, col) => (
                        <div key={col} className="flex-1 h-4 bg-slate-100 dark:bg-slate-800 rounded" />
                    ))}
                </div>
            ))}
        </div>
    );
}

// ================== MAIN COMPONENT ==================

export default function AdminTable<T>({
    columns,
    data,
    loading = false,
    emptyState,
    rowKey,
    onRowClick,
    rowActions,
}: AdminTableProps<T>) {
    if (loading) {
        return (
            <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                <TableSkeleton columns={columns.length} />
            </div>
        );
    }

    if (data.length === 0 && emptyState) {
        return (
            <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--card)] overflow-hidden shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
                {emptyState}
            </div>
        );
    }

    return (
        <div className="rounded-[20px] border border-[var(--card-border)] bg-[var(--card)] shadow-[0_4px_16px_rgba(0,0,0,0.04)]">
            <div className="overflow-x-auto overflow-y-visible">
                <table className="w-full text-left text-sm">
                    {/* Header */}
                    <thead className="bg-slate-50/50 dark:bg-slate-800/30 border-b border-[var(--card-border)]">
                        <tr>
                            {columns.map(col => (
                                <th
                                    key={col.key}
                                    className={`py-4 px-6 text-xs font-bold text-[var(--foreground)] opacity-40 uppercase tracking-widest ${col.align === 'center' ? 'text-center' :
                                        col.align === 'right' ? 'text-right' : 'text-left'
                                        }`}
                                    style={{ width: col.width }}
                                >
                                    {col.label}
                                </th>
                            ))}
                            {rowActions && (
                                <th className="py-3 px-4 w-12" />
                            )}
                        </tr>
                    </thead>

                    {/* Body */}
                    <tbody className="divide-y divide-[var(--card-border)]">
                        {data.map((item, rowIndex) => (
                            <tr
                                key={rowKey(item)}
                                onClick={() => onRowClick?.(item)}
                                className={`transition-all duration-200 group ${onRowClick
                                    ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/50'
                                    : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                                    }`}
                            >
                                {columns.map(col => (
                                    <td
                                        key={col.key}
                                        className={`py-4 px-6 text-[var(--foreground)] opacity-80 font-medium ${col.align === 'center' ? 'text-center' :
                                            col.align === 'right' ? 'text-right' : 'text-left'
                                            }`}
                                    >
                                        {col.render
                                            ? col.render(item, rowIndex)
                                            : String((item as Record<string, unknown>)[col.key] ?? '-')
                                        }
                                    </td>
                                ))}
                                {rowActions && (
                                    <td className="py-3 px-4">
                                        <RowActionsMenu actions={rowActions(item)} />
                                    </td>
                                )}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
