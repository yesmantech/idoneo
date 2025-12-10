import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost, BlogCategory, STATUS_CONFIG, BlogPostStatus } from "@/types/blog";
import {
    AdminLayout,
    AdminPageHeader,
    AdminTable,
    StatusBadge,
    EmptyState,
    ConfirmDialog,
} from '@/components/admin';

export default function AdminBlogListPage() {
    const navigate = useNavigate();
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [categories, setCategories] = useState<BlogCategory[]>([]);
    const [loading, setLoading] = useState(true);

    // Filters
    const [statusFilter, setStatusFilter] = useState<BlogPostStatus | 'all'>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        setLoading(true);

        // Load categories
        const { data: cats } = await supabase
            .from('blog_categories')
            .select('*')
            .order('sort_order');
        if (cats) setCategories(cats);

        // Load posts with relations
        const { data: postsData } = await supabase
            .from('blog_posts')
            .select(`
                *,
                category:blog_categories(*),
                author:blog_authors(*)
            `)
            .order('created_at', { ascending: false });
        if (postsData) setPosts(postsData as BlogPost[]);

        setLoading(false);
    };

    // Filter posts
    const filteredPosts = posts.filter(post => {
        if (statusFilter !== 'all' && post.status !== statusFilter) return false;
        if (categoryFilter !== 'all' && post.category_id !== categoryFilter) return false;
        if (searchQuery && !post.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
        return true;
    });

    // Actions
    const handleDelete = async (id: string, title: string) => {
        if (!confirm(`Sei sicuro di voler eliminare "${title}"?\n\nQuesta azione è irreversibile!`)) return;

        await supabase.from('blog_posts').delete().eq('id', id);
        loadData();
    };

    const handleStatusChange = async (id: string, newStatus: BlogPostStatus) => {
        const updates: Partial<BlogPost> = { status: newStatus };
        if (newStatus === 'published') {
            updates.published_at = new Date().toISOString();
        }
        await supabase.from('blog_posts').update(updates).eq('id', id);
        loadData();
    };

    const handleDuplicate = async (post: BlogPost) => {
        const { id, created_at, updated_at, published_at, view_count, ...rest } = post;
        const newPost = {
            ...rest,
            title: `${post.title} (Copia)`,
            slug: `${post.slug}-copia-${Date.now()}`,
            status: 'draft' as BlogPostStatus,
            is_featured: false,
        };
        const { data } = await supabase.from('blog_posts').insert(newPost).select().single();
        if (data) {
            navigate(`/admin/blog/${data.id}`);
        }
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('it-IT', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    // Columns config
    const columns = [
        {
            key: 'title',
            label: 'Titolo',
            render: (post: BlogPost) => (
                <div>
                    <div className="font-medium text-white">{post.title}</div>
                    <div className="text-xs text-slate-500 font-mono">/blog/{post.slug}</div>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Stato',
            width: '120px',
            render: (post: BlogPost) => (
                <StatusBadge
                    label={STATUS_CONFIG[post.status].label}
                    // Map blog colors to badge variants manually since they differ slightly
                    variant={
                        post.status === 'published' ? 'success' :
                            post.status === 'draft' ? 'neutral' :
                                post.status === 'scheduled' ? 'info' :
                                    'warning'
                    }
                />
            )
        },
        {
            key: 'category',
            label: 'Categoria',
            width: '150px',
            render: (post: BlogPost) => (
                <span className="text-sm text-slate-400">
                    {post.category?.name || '-'}
                </span>
            )
        },
        {
            key: 'date',
            label: 'Data',
            width: '120px',
            render: (post: BlogPost) => (
                <span className="text-sm text-slate-400">
                    {formatDate(post.published_at || post.created_at)}
                </span>
            )
        },
        {
            key: 'views',
            label: 'Views',
            width: '80px',
            align: 'right' as const,
            render: (post: BlogPost) => (
                <span className="text-sm text-slate-400 font-mono">
                    {post.view_count}
                </span>
            )
        }
    ];

    // Row Actions
    const rowActions = (post: BlogPost) => [
        {
            label: 'Modifica',
            icon: '✏️',
            onClick: () => navigate(`/admin/blog/${post.id}`),
        },
        {
            label: 'Duplica',
            icon: '📋',
            onClick: () => handleDuplicate(post),
        },
        // Status actions
        ...(post.status === 'published' ? [{
            label: 'Archivia',
            icon: '📦',
            onClick: () => handleStatusChange(post.id, 'archived')
        }] : post.status === 'archived' ? [{
            label: 'Ripristina a Bozza',
            icon: '📝',
            onClick: () => handleStatusChange(post.id, 'draft')
        }] : [{
            label: 'Pubblica',
            icon: '🚀',
            onClick: () => handleStatusChange(post.id, 'published')
        }]),
        {
            label: 'Elimina',
            icon: '🗑️',
            onClick: () => handleDelete(post.id, post.title),
            variant: 'destructive' as const
        }
    ];

    return (
        <AdminLayout>
            <AdminPageHeader
                title="Blog - Articoli"
                subtitle="Gestisci articoli, notizie e aggiornamenti"
                breadcrumb={[
                    { label: 'Admin', path: '/admin' },
                    { label: 'Blog' }
                ]}
                action={{
                    label: 'Nuovo Articolo',
                    icon: '+',
                    onClick: () => navigate('/admin/blog/nuovo')
                }}
            />

            {/* QUICK ACTIONS */}
            <div className="flex gap-4 mb-6">
                <button
                    onClick={() => navigate('/admin/blog/categorie')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors"
                >
                    Gestisci Categorie
                </button>
                <button
                    onClick={() => navigate('/admin/blog/tag')}
                    className="px-4 py-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 text-sm transition-colors"
                >
                    Gestisci Tag
                </button>
            </div>

            {/* FILTERS */}
            <div className="mb-6 p-4 bg-slate-900/50 border border-slate-800 rounded-xl flex flex-col md:flex-row gap-4">
                <div className="flex-1">
                    <input
                        type="text"
                        placeholder="Cerca per titolo..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value as BlogPostStatus | 'all')}
                    className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="all">Tutti gli stati</option>
                    <option value="draft">Bozze</option>
                    <option value="scheduled">Programmati</option>
                    <option value="published">Pubblicati</option>
                    <option value="archived">Archiviati</option>
                </select>

                <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className="px-4 py-2 bg-slate-950 border border-slate-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                >
                    <option value="all">Tutte le categorie</option>
                    {categories.map(cat => (
                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                </select>
            </div>

            {/* TABLE */}
            <AdminTable
                columns={columns}
                data={filteredPosts}
                loading={loading}
                rowKey={p => p.id}
                rowActions={rowActions}
                emptyState={
                    <EmptyState
                        icon="✍️"
                        title="Nessun articolo trovato"
                        description={searchQuery ? "Nessun articolo corrisponde ai criteri di ricerca." : "Inizia a scrivere il tuo primo articolo!"}
                        action={{
                            label: 'Scrivi articolo',
                            onClick: () => navigate('/admin/blog/nuovo')
                        }}
                    />
                }
            />
        </AdminLayout>
    );
}
