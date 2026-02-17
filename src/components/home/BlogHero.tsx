import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { BlogPost } from '@/types/blog';
import BlogCarousel from './BlogCarousel';

// ================== PLACEHOLDERS FOR TESTING ==================

const PLACEHOLDER_POSTS: BlogPost[] = [
    {
        id: 'p1',
        slug: 'concorso-carabinieri-2024',
        title: 'Concorso Carabinieri 2024: Guida Completa e Requisiti',
        subtitle: 'Tutto quello che devi sapere per affrontare al meglio le prove selettive.',
        content: [],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        reading_time_minutes: 5,
        view_count: 120,
        is_featured: true,
        is_noindex: false,
        cover_image_url: null, // Will use gradient
        category: { id: 'c1', name: 'Guide', slug: 'guide', description: '', created_at: '', sort_order: 1 },
        seo_title: null, seo_description: null, canonical_url: null, og_image_url: null, author_id: null, category_id: null
    },
    {
        id: 'p2',
        slug: 'metodo-studio-efficace',
        title: '5 Tecniche di Memoria per Superare i Quiz',
        subtitle: 'Scopri come memorizzare migliaia di quiz in metà tempo con queste tecniche.',
        content: [],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        reading_time_minutes: 8,
        view_count: 85,
        is_featured: false,
        is_noindex: false,
        cover_image_url: null,
        category: { id: 'c2', name: 'Metodo di Studio', slug: 'metodo', description: '', created_at: '', sort_order: 2 },
        seo_title: null, seo_description: null, canonical_url: null, og_image_url: null, author_id: null, category_id: null
    },
    {
        id: 'p3',
        slug: 'novita-pubblica-amministrazione',
        title: 'Riforma PA: Cosa Cambia nei Concorsi Pubblici',
        subtitle: 'Analisi delle ultime novità legislative e impatto sulle procedure concorsuali.',
        content: [],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        reading_time_minutes: 6,
        view_count: 200,
        is_featured: false,
        is_noindex: false,
        cover_image_url: null,
        category: { id: 'c3', name: 'News', slug: 'news', description: '', created_at: '', sort_order: 3 },
        seo_title: null, seo_description: null, canonical_url: null, og_image_url: null, author_id: null, category_id: null
    },
    {
        id: 'p4',
        slug: 'gestione-ansia-esame',
        title: 'Come Gestire l\'Ansia da Esame: Consigli Pratici',
        subtitle: 'Strategie psicologiche per mantenere la calma e la concentrazione durante la prova.',
        content: [],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        reading_time_minutes: 4,
        view_count: 95,
        is_featured: false,
        is_noindex: false,
        cover_image_url: null,
        category: { id: 'c4', name: 'Benessere', slug: 'benessere', description: '', created_at: '', sort_order: 4 },
        seo_title: null, seo_description: null, canonical_url: null, og_image_url: null, author_id: null, category_id: null
    },
    {
        id: 'p5',
        slug: 'recensione-manuali-2024',
        title: 'I Migliori Manuali per i Concorsi 2024',
        subtitle: 'Una recensione dettagliata delle migliori risorse di studio disponibili sul mercato.',
        content: [],
        status: 'published',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        published_at: new Date().toISOString(),
        reading_time_minutes: 7,
        view_count: 150,
        is_featured: false,
        is_noindex: false,
        cover_image_url: null,
        category: { id: 'c1', name: 'Guide', slug: 'guide', description: '', created_at: '', sort_order: 1 },
        seo_title: null, seo_description: null, canonical_url: null, og_image_url: null, author_id: null, category_id: null
    }
];

// ================== SKELETON ==================

function BlogHeroSkeleton() {
    return (
        <section className="px-4 md:px-8 py-8 overflow-hidden">
            <div className="max-w-7xl mx-auto flex gap-6 overflow-hidden">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="shrink-0 w-[320px] h-[420px] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-[32px]"
                    />
                ))}
            </div>
        </section>
    );
}

// ================== MAIN COMPONENT ==================

export default function BlogHero() {
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchPosts = async () => {
            try {
                const { data } = await supabase
                    .from('blog_posts')
                    .select('id, slug, title, subtitle, cover_image_url, category:blog_categories(name)')
                    .eq('status', 'published')
                    .order('is_featured', { ascending: false })
                    .order('published_at', { ascending: false })
                    .limit(8);

                // Merge fetched data with placeholders if fetched data is scarce
                // For demonstration, we'll ALWAYS add placeholders if we have few posts.
                // In production, we might want to remove this or make it conditional on content population.

                const fetchedPosts = (data as unknown as BlogPost[]) || [];
                const combinedPosts = [...fetchedPosts, ...PLACEHOLDER_POSTS];

                // Deduplicate by ID just in case
                const uniquePosts = Array.from(new Map(combinedPosts.map(p => [p.id, p])).values());

                setPosts(uniquePosts);
            } catch (err) {
                console.error('Failed to fetch blog posts:', err);
                // Fallback to placeholders on error
                setPosts(PLACEHOLDER_POSTS);
            } finally {
                setLoading(false);
            }
        };

        fetchPosts();
    }, []);

    if (loading) return <BlogHeroSkeleton />;

    // Ensure we have something to show
    const displayPosts = posts.length > 0 ? posts : PLACEHOLDER_POSTS;

    return (
        <section className="w-full pt-safe bg-slate-50/50 dark:bg-slate-900/50 overflow-hidden">
            <BlogCarousel posts={displayPosts} />
        </section>
    );
}
