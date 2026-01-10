"use client";

import React, { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost, ContentBlock } from "@/types/blog";
import { SEO, JsonLd, generateBlogPostJsonLd, generateBreadcrumbJsonLd, generateFaqJsonLd } from "@/components/SEO";
import { Search, ChevronLeft, Clock, Calendar, Share2, Twitter, Linkedin, Link as LinkIcon, ArrowLeft, ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { hapticSelection, hapticLight, hapticSuccess } from "@/lib/haptics";
import { cn } from "@/lib/utils";

// =============================================================================
// CONTENT RENDERER - Premium Tier S Typography
// =============================================================================
function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
    return (
        <div className="space-y-8">
            {blocks.map((block, idx) => {
                switch (block.type) {
                    case 'paragraph':
                        return (
                            <p
                                key={idx}
                                className="text-[18px] lg:text-[19px] leading-[1.8] text-slate-600 dark:text-slate-300 font-medium"
                            >
                                {block.text}
                            </p>
                        );

                    case 'heading':
                        if (block.level === 2) {
                            return (
                                <h2
                                    key={idx}
                                    id={`heading-${idx}`}
                                    className="text-[26px] lg:text-[32px] font-black text-slate-900 dark:text-white mt-14 mb-6 tracking-tight leading-tight scroll-mt-24"
                                >
                                    {block.text}
                                </h2>
                            );
                        }
                        return (
                            <h3
                                key={idx}
                                id={`heading-${idx}`}
                                className="text-[22px] lg:text-[24px] font-black text-slate-900 dark:text-white mt-10 mb-4 tracking-tight leading-tight scroll-mt-24"
                            >
                                {block.text}
                            </h3>
                        );

                    case 'list':
                        return (
                            <ul key={idx} className="space-y-4 my-8">
                                {block.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-4 text-[17px] lg:text-[18px] leading-[1.7] text-slate-600 dark:text-slate-300 font-medium group">
                                        <div className="flex-shrink-0 w-6 h-6 rounded-full bg-[#00B1FF]/10 dark:bg-[#00B1FF]/20 flex items-center justify-center mt-0.5 group-hover:bg-[#00B1FF]/20 dark:group-hover:bg-[#00B1FF]/30 transition-colors">
                                            <div className="w-2 h-2 rounded-full bg-[#00B1FF]" />
                                        </div>
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        );

                    case 'callout':
                        const variants: Record<string, { bg: string; darkBg: string; border: string; darkBorder: string; icon: string; text: string; darkText: string; tint: string; darkTint: string }> = {
                            tip: { bg: 'bg-emerald-50', darkBg: 'dark:bg-emerald-900/20', border: 'border-emerald-100', darkBorder: 'dark:border-emerald-900/50', icon: '💡', text: 'text-emerald-900', darkText: 'dark:text-emerald-400', tint: 'bg-emerald-100', darkTint: 'dark:bg-emerald-900/50' },
                            warning: { bg: 'bg-amber-50', darkBg: 'dark:bg-amber-900/20', border: 'border-amber-100', darkBorder: 'dark:border-amber-900/50', icon: '⚠️', text: 'text-amber-900', darkText: 'dark:text-amber-400', tint: 'bg-amber-100', darkTint: 'dark:bg-amber-900/50' },
                            note: { bg: 'bg-blue-50', darkBg: 'dark:bg-blue-900/20', border: 'border-blue-100', darkBorder: 'dark:border-blue-900/50', icon: '📝', text: 'text-blue-900', darkText: 'dark:text-blue-400', tint: 'bg-blue-100', darkTint: 'dark:bg-blue-900/50' },
                            example: { bg: 'bg-purple-50', darkBg: 'dark:bg-purple-900/20', border: 'border-purple-100', darkBorder: 'dark:border-purple-900/50', icon: '📌', text: 'text-purple-900', darkText: 'dark:text-purple-400', tint: 'bg-purple-100', darkTint: 'dark:bg-purple-900/50' },
                        };
                        const v = variants[block.variant] || variants.note;
                        return (
                            <div key={idx} className={cn(v.bg, v.darkBg, "rounded-[24px] p-6 lg:p-8 my-10 border", v.border, v.darkBorder)}>
                                <div className={cn("font-black text-sm uppercase tracking-widest mb-4 flex items-center gap-2.5", v.text, v.darkText)}>
                                    <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-lg", v.tint, v.darkTint)}>
                                        {v.icon}
                                    </div>
                                    <span>{block.title}</span>
                                </div>
                                <div className={cn("text-[17px] font-medium leading-[1.7]", v.text, v.darkText)}>{block.text}</div>
                            </div>
                        );

                    case 'faq':
                        return (
                            <div key={idx} className="space-y-4 my-10">
                                {block.items.map((item, i) => (
                                    <FAQItem key={i} item={item} />
                                ))}
                            </div>
                        );

                    case 'cta':
                        return (
                            <div key={idx} className="bg-gradient-to-br from-[#00B1FF] to-[#0188C5] rounded-[32px] p-8 lg:p-12 my-12 text-white relative overflow-hidden shadow-2xl shadow-[#00B1FF]/30">
                                {/* Decorative circle */}
                                <div className="absolute -right-20 -top-20 w-64 h-64 bg-white/10 rounded-full blur-3xl text-xs" />

                                <div className="relative z-10 text-center">
                                    <h3 className="text-2xl lg:text-3xl font-black mb-4 tracking-tight">{block.title}</h3>
                                    <p className="text-white/80 mb-8 text-[16px] lg:text-[18px] font-medium max-w-lg mx-auto leading-relaxed">{block.description}</p>
                                    <Link
                                        to={block.buttonUrl}
                                        onClick={() => hapticLight()}
                                        className="inline-flex items-center gap-2 bg-white text-[#00B1FF] font-black px-10 py-4 rounded-full hover:scale-105 transition-all shadow-lg active:scale-95"
                                    >
                                        <span>{block.buttonText}</span>
                                        <ArrowLeft className="w-5 h-5 rotate-180" />
                                    </Link>
                                </div>
                            </div>
                        );

                    case 'image':
                        return (
                            <figure key={idx} className="my-12">
                                <div className="rounded-[32px] overflow-hidden shadow-soft bg-slate-100 dark:bg-slate-800">
                                    <img src={block.url} alt={block.alt} className="w-full h-auto" />
                                </div>
                                {block.caption && (
                                    <figcaption className="text-center text-sm font-bold text-slate-400 dark:text-slate-500 mt-5 uppercase tracking-wider">
                                        {block.caption}
                                    </figcaption>
                                )}
                            </figure>
                        );

                    case 'table':
                        return (
                            <div key={idx} className="my-10 overflow-hidden rounded-[24px] border border-slate-200 dark:border-slate-800 shadow-soft bg-white dark:bg-slate-900/50">
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-slate-100 dark:divide-slate-800">
                                        <thead className="bg-slate-50/80 dark:bg-slate-800/80">
                                            <tr>
                                                {block.headers.map((h, i) => (
                                                    <th key={i} className="text-left px-6 py-4 font-black text-slate-900 dark:text-white text-[13px] uppercase tracking-wider">
                                                        {h}
                                                    </th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                                            {block.rows.map((row, ri) => (
                                                <tr key={ri} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/50 transition-colors">
                                                    {row.map((cell, ci) => (
                                                        <td key={ci} className="px-6 py-4 text-[15px] font-medium text-slate-600 dark:text-slate-300">
                                                            {cell}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        );

                    default:
                        return null;
                }
            })}
        </div>
    );
}

function FAQItem({ item }: { key?: React.Key; item: { question: string; answer: string } }) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="bg-white dark:bg-[var(--card)] rounded-[24px] border border-slate-200/60 dark:border-[var(--card-border)] shadow-soft overflow-hidden transition-colors">
            <button
                onClick={() => { hapticLight(); setIsOpen(!isOpen); }}
                className="w-full px-6 py-5 flex items-center justify-between text-left group"
            >
                <span className="font-black text-slate-900 dark:text-white leading-tight group-hover:text-[#00B1FF] transition-colors pr-4">
                    {item.question}
                </span>
                <div className={cn(
                    "w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center shrink-0 transition-transform duration-300",
                    isOpen ? "rotate-180 bg-[#00B1FF]/10 text-[#00B1FF]" : "text-slate-400 dark:text-slate-500"
                )}>
                    <ChevronDown className="w-5 h-5" />
                </div>
            </button>
            <motion.div
                initial={false}
                animate={{ height: isOpen ? 'auto' : 0, opacity: isOpen ? 1 : 0 }}
                className="overflow-hidden"
            >
                <div className="px-6 pb-6 text-slate-500 dark:text-slate-400 font-medium text-[16px] leading-relaxed border-t border-slate-100/50 dark:border-slate-800/50 pt-4">
                    {item.answer}
                </div>
            </motion.div>
        </div>
    );
}

// =============================================================================
// RELATED POST CARD - Tier S
// =============================================================================
function RelatedPostCard({ post, formatDate }: { key?: React.Key; post: BlogPost; formatDate: (d: string | null) => string }) {
    return (
        <Link
            to={`/blog/${post.slug}`}
            onClick={() => hapticLight()}
            className="group block bg-white dark:bg-[var(--card)] rounded-[32px] p-4 shadow-soft hover:shadow-card dark:border dark:border-[var(--card-border)] transition-all active:scale-[0.98]"
        >
            <div className="flex gap-4">
                {/* Cover Mini */}
                {post.cover_image_url && (
                    <div className="w-24 h-24 lg:w-32 lg:h-32 overflow-hidden rounded-[20px] bg-slate-50 dark:bg-slate-800 shrink-0">
                        <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                        />
                    </div>
                )}

                <div className="flex flex-col justify-center min-w-0">
                    {/* Meta */}
                    <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-[#00B1FF] mb-1.5">
                        <span>{formatDate(post.published_at)}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span>{post.reading_time_minutes} min read</span>
                    </div>

                    <h3 className="text-[17px] font-black text-slate-900 dark:text-white group-hover:text-[#00B1FF] transition-colors leading-tight mb-2 line-clamp-2">
                        {post.title}
                    </h3>

                    {post.subtitle && (
                        <p className="text-[13px] text-slate-500 dark:text-slate-400 font-medium line-clamp-1">
                            {post.subtitle}
                        </p>
                    )}
                </div>
            </div>
        </Link>
    );
}

// =============================================================================
// MAIN BLOG POST PAGE - Tier S Premium
// =============================================================================
export default function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!slug) return;
        window.scrollTo(0, 0);
        loadPost();
    }, [slug]);

    const loadPost = async () => {
        const { data: postData, error } = await supabase
            .from('blog_posts')
            .select(`
                *,
                category:blog_categories(*),
                author:blog_authors(*)
            `)
            .eq('slug', slug)
            .eq('status', 'published')
            .single();

        if (error || !postData) {
            navigate('/blog');
            return;
        }

        setPost(postData as BlogPost);

        // Increment view count
        await supabase
            .from('blog_posts')
            .update({ view_count: (postData.view_count || 0) + 1 })
            .eq('id', postData.id);

        // Fetch related posts
        if (postData.category_id) {
            const { data: related } = await supabase
                .from('blog_posts')
                .select('id, slug, title, subtitle, cover_image_url, published_at, reading_time_minutes')
                .eq('category_id', postData.category_id)
                .eq('status', 'published')
                .neq('id', postData.id)
                .limit(3);
            if (related) setRelatedPosts(related as BlogPost[]);
        }

        setLoading(false);
    };

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
        });
    };

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const copyLink = async () => {
        await navigator.clipboard.writeText(shareUrl);
        hapticSuccess();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // SEO Data
    const blogPostJsonLd = useMemo(() => post ? generateBlogPostJsonLd({
        title: post.seo_title || post.title,
        description: post.seo_description || post.subtitle || undefined,
        slug: post.slug,
        coverImage: post.og_image_url || post.cover_image_url || undefined,
        authorName: post.author?.display_name,
        publishedAt: post.published_at || undefined,
        updatedAt: post.updated_at,
        categoryName: post.category?.name,
    }) : null, [post]);

    const breadcrumbJsonLd = useMemo(() => {
        const items = [
            { name: 'Home', url: 'https://idoneo.it/' },
            { name: 'Blog', url: 'https://idoneo.it/blog' },
        ];
        if (post?.category) {
            items.push({ name: post.category.name, url: `https://idoneo.it/blog/categoria/${post.category?.slug}` });
        }
        if (post) {
            items.push({ name: post.title, url: `https://idoneo.it/blog/${post.slug}` });
        }
        return generateBreadcrumbJsonLd(items);
    }, [post]);

    if (loading) {
        return (
            <div className="min-h-screen bg-[#F3F5F7] dark:bg-[var(--background)] flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-[#F3F5F7] dark:bg-[var(--background)] transition-colors duration-300">
            <SEO
                title={`${post.seo_title || post.title} | IDONEO Blog`}
                description={post.seo_description || post.subtitle || undefined}
                canonical={post.canonical_url || `https://idoneo.it/blog/${post.slug}`}
                ogTitle={post.seo_title || post.title}
                ogDescription={post.seo_description || post.subtitle || undefined}
                ogImage={post.og_image_url || post.cover_image_url || undefined}
                noindex={post.is_noindex}
                type="article"
                publishedTime={post.published_at || undefined}
                modifiedTime={post.updated_at}
                author={post.author?.display_name}
            />
            <JsonLd data={[blogPostJsonLd, breadcrumbJsonLd].filter(Boolean)} />

            {/* ============================================================= */}
            {/* HEADER - Glassmorphism UI */}
            {/* ============================================================= */}
            <header className="sticky top-0 z-50 bg-white/80 dark:bg-slate-900/90 backdrop-blur-md border-b border-slate-200/50 dark:border-slate-700/50 pt-safe transition-colors">
                <div className="max-w-4xl mx-auto px-5 h-16 flex items-center justify-between">
                    <button
                        onClick={() => { hapticLight(); navigate('/blog'); }}
                        className="flex items-center gap-2 group p-1 -ml-1 text-[#00B1FF]"
                    >
                        <ChevronLeft className="w-6 h-6" />
                        <span className="font-black text-sm uppercase tracking-wider">Blog</span>
                    </button>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={copyLink}
                            className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors relative"
                        >
                            <LinkIcon className="w-4 h-4" />
                            <AnimatePresence>
                                {copied && (
                                    <motion.span
                                        initial={{ opacity: 0, scale: 0.8 }}
                                        animate={{ opacity: 1, scale: 1 }}
                                        exit={{ opacity: 0 }}
                                        className="absolute -bottom-10 left-1/2 -translate-x-1/2 text-[10px] font-black uppercase bg-slate-900 dark:bg-white text-white dark:text-slate-900 px-3 py-1.5 rounded-full whitespace-nowrap"
                                    >
                                        Copiato!
                                    </motion.span>
                                )}
                            </AnimatePresence>
                        </button>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-5 py-8 md:py-12">
                <div className="max-w-[720px] mx-auto">
                    {/* Meta Row */}
                    <div className="flex items-center gap-2 text-[11px] font-black uppercase tracking-[0.1em] text-[#00B1FF] mb-6">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(post.published_at)}</span>
                        <div className="w-1 h-1 rounded-full bg-slate-300 dark:bg-slate-600" />
                        <span>{post.reading_time_minutes} min read</span>
                    </div>

                    {/* Title */}
                    <h1 className="text-[32px] md:text-[48px] font-black text-slate-900 dark:text-white leading-[1.05] mb-8 tracking-tight">
                        {post.title}
                    </h1>

                    {/* Author Row */}
                    <div className="flex items-center gap-3 mb-10 pb-8 border-b border-slate-200/50 dark:border-slate-800/50">
                        {post.author?.avatar_url ? (
                            <img
                                src={post.author.avatar_url}
                                alt={post.author.display_name}
                                className="w-10 h-10 rounded-full object-cover border border-slate-200 dark:border-slate-800"
                            />
                        ) : (
                            <div className="w-10 h-10 rounded-full bg-[#00B1FF] flex items-center justify-center text-white font-black text-sm">
                                I
                            </div>
                        )}
                        <div>
                            <div className="text-[15px] font-black text-slate-900 dark:text-white truncate">
                                {post.author?.display_name || 'Idoneo'}
                            </div>
                            <div className="text-[12px] font-medium text-slate-500 dark:text-slate-400">
                                Redazione Idoneo
                            </div>
                        </div>
                    </div>

                    {/* Cover Image */}
                    {post.cover_image_url && (
                        <div className="rounded-[32px] overflow-hidden mb-12 shadow-soft aspect-[16/10]">
                            <img
                                src={post.cover_image_url}
                                alt={post.title}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    )}

                    {/* Subtitle/Lead */}
                    {post.subtitle && (
                        <div className="text-[20px] md:text-[22px] text-slate-900 dark:text-slate-200 font-bold leading-relaxed mb-12 pr-4">
                            {post.subtitle}
                        </div>
                    )}

                    {/* Article Body */}
                    <article className="prose prose-slate dark:prose-invert max-w-none">
                        <ContentRenderer blocks={post.content || []} />
                    </article>

                    {/* Share Bottom */}
                    <div className="mt-16 pt-10 border-t border-slate-200/50 dark:border-slate-800/50 flex flex-col md:flex-row items-center justify-between gap-6">
                        <span className="text-sm font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">Condividi la guida</span>
                        <div className="flex items-center gap-3">
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener"
                                onClick={() => hapticLight()}
                                className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-sky-500 hover:border-sky-500 transition-all shadow-sm"
                            >
                                <Twitter className="w-5 h-5" />
                            </a>
                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener"
                                onClick={() => hapticLight()}
                                className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-blue-600 hover:border-blue-600 transition-all shadow-sm"
                            >
                                <Linkedin className="w-5 h-5" />
                            </a>
                            <button
                                onClick={copyLink}
                                className="w-12 h-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-400 hover:text-[#00B1FF] hover:border-[#00B1FF] transition-all shadow-sm"
                            >
                                <LinkIcon className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* ============================================================= */}
            {/* RELATED POSTS - Tier S */}
            {/* ============================================================= */}
            {relatedPosts.length > 0 && (
                <section className="bg-white/50 dark:bg-black/20 border-t border-slate-200/50 dark:border-slate-800/50 py-16">
                    <div className="max-w-4xl mx-auto px-5">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-10 h-10 rounded-2xl bg-[#00B1FF]/10 flex items-center justify-center">
                                <Search className="w-5 h-5 text-[#00B1FF]" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 dark:text-white tracking-tight">Potrebbe interessarti</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {relatedPosts.map(p => (
                                <RelatedPostCard key={p.id} post={p} formatDate={formatDate} />
                            ))}
                        </div>
                    </div>
                </section>
            )}

            {/* Added Footer Space for Mobile Navbar */}
            <div className="pb-32 lg:pb-12" />
        </div>
    );
}
