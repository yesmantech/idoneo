import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost, ContentBlock } from "@/types/blog";
import { SEO, JsonLd, generateBlogPostJsonLd, generateBreadcrumbJsonLd, generateFaqJsonLd } from "@/components/SEO";
import { Search, Menu, ChevronLeft, Clock, Calendar, Share2, Twitter, Linkedin, Link as LinkIcon } from "lucide-react";

// =============================================================================
// CONTENT RENDERER - Clean typography for article body
// =============================================================================
function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
    return (
        <div className="space-y-6">
            {blocks.map((block, idx) => {
                switch (block.type) {
                    case 'paragraph':
                        return (
                            <p
                                key={idx}
                                className="text-[17px] leading-[1.7] text-slate-700"
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
                                    className="text-[22px] font-bold text-slate-900 mt-10 mb-4 scroll-mt-20"
                                >
                                    {block.text}
                                </h2>
                            );
                        }
                        return (
                            <h3
                                key={idx}
                                id={`heading-${idx}`}
                                className="text-[18px] font-bold text-slate-900 mt-8 mb-3 scroll-mt-20"
                            >
                                {block.text}
                            </h3>
                        );

                    case 'list':
                        return (
                            <ul key={idx} className="space-y-3 my-6">
                                {block.items.map((item, i) => (
                                    <li key={i} className="flex items-start gap-3 text-[17px] leading-[1.6] text-slate-700">
                                        <span className="flex-shrink-0 w-2 h-2 rounded-full bg-[#00B1FF] mt-2.5" />
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ul>
                        );

                    case 'callout':
                        const variants: Record<string, { bg: string; border: string; icon: string }> = {
                            tip: { bg: 'bg-emerald-50', border: 'border-l-emerald-500', icon: '💡' },
                            warning: { bg: 'bg-amber-50', border: 'border-l-amber-500', icon: '⚠️' },
                            note: { bg: 'bg-blue-50', border: 'border-l-blue-500', icon: '📝' },
                            example: { bg: 'bg-purple-50', border: 'border-l-purple-500', icon: '📌' },
                        };
                        const v = variants[block.variant] || variants.note;
                        return (
                            <div key={idx} className={`${v.bg} ${v.border} border-l-4 rounded-r-xl p-5 my-8`}>
                                <div className="font-semibold text-slate-900 mb-2 flex items-center gap-2">
                                    <span>{v.icon}</span> {block.title}
                                </div>
                                <div className="text-slate-600 text-[15px] leading-relaxed">{block.text}</div>
                            </div>
                        );

                    case 'faq':
                        return (
                            <div key={idx} className="space-y-3 my-8">
                                {block.items.map((item, i) => (
                                    <details key={i} className="bg-slate-50 rounded-xl overflow-hidden group">
                                        <summary className="px-5 py-4 cursor-pointer font-semibold text-slate-900 hover:text-[#00B1FF] list-none flex items-center justify-between">
                                            {item.question}
                                            <span className="text-slate-400 group-open:rotate-180 transition-transform text-sm">▼</span>
                                        </summary>
                                        <div className="px-5 pb-4 text-slate-600 text-[15px] leading-relaxed border-t border-slate-100 pt-4 mx-5 mt-0">
                                            {item.answer}
                                        </div>
                                    </details>
                                ))}
                            </div>
                        );

                    case 'cta':
                        return (
                            <div key={idx} className="bg-gradient-to-br from-[#00B1FF] to-[#0099e6] rounded-2xl p-8 my-10 text-white text-center">
                                <h3 className="text-xl font-bold mb-2">{block.title}</h3>
                                <p className="opacity-90 mb-6 text-[15px]">{block.description}</p>
                                <Link
                                    to={block.buttonUrl}
                                    className="inline-block bg-white text-[#00B1FF] font-bold px-6 py-3 rounded-full hover:scale-105 transition-transform"
                                >
                                    {block.buttonText}
                                </Link>
                            </div>
                        );

                    case 'image':
                        return (
                            <figure key={idx} className="my-8">
                                <img src={block.url} alt={block.alt} className="rounded-xl w-full" />
                                {block.caption && (
                                    <figcaption className="text-center text-sm text-slate-500 mt-3">
                                        {block.caption}
                                    </figcaption>
                                )}
                            </figure>
                        );

                    case 'table':
                        return (
                            <div key={idx} className="overflow-x-auto my-8 rounded-xl border border-slate-200">
                                <table className="min-w-full bg-white">
                                    <thead className="bg-slate-50">
                                        <tr>
                                            {block.headers.map((h, i) => (
                                                <th key={i} className="text-left px-5 py-3 font-semibold text-slate-900 text-sm">
                                                    {h}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {block.rows.map((row, ri) => (
                                            <tr key={ri}>
                                                {row.map((cell, ci) => (
                                                    <td key={ci} className="px-5 py-3 text-sm text-slate-600">
                                                        {cell}
                                                    </td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        );

                    default:
                        return null;
                }
            })}
        </div>
    );
}

// =============================================================================
// RELATED POST CARD - TON-style
// =============================================================================
function RelatedPostCard({ post, formatDate }: { post: BlogPost; formatDate: (d: string | null) => string }) {
    return (
        <Link
            to={`/blog/${post.slug}`}
            className="group block"
        >
            {/* Cover Image */}
            {post.cover_image_url && (
                <div className="aspect-[16/10] overflow-hidden rounded-2xl mb-4 bg-slate-100">
                    <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                </div>
            )}

            {/* Meta Row */}
            <div className="flex items-center gap-2 text-[13px] text-slate-500 mb-2">
                <span>{formatDate(post.published_at)}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <span>{post.reading_time_minutes} min read</span>
            </div>

            {/* Title */}
            <h3 className="text-[17px] font-bold text-slate-900 group-hover:text-[#00B1FF] transition-colors leading-snug mb-2">
                {post.title}
            </h3>

            {/* Subtitle/Snippet */}
            {post.subtitle && (
                <p className="text-[14px] text-slate-600 line-clamp-2">
                    {post.subtitle}
                </p>
            )}
        </Link>
    );
}

// =============================================================================
// MAIN BLOG POST PAGE - TON Foundation Style
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
            month: 'short'
        });
    };

    const formatFullDate = (dateStr: string | null) => {
        if (!dateStr) return '';
        return new Date(dateStr).toLocaleDateString('it-IT', {
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        });
    };

    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';

    const copyLink = async () => {
        await navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    // Structured data
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
            items.push({ name: post.category.name, url: `https://idoneo.it/blog/categoria/${post.category.slug}` });
        }
        if (post) {
            items.push({ name: post.title, url: `https://idoneo.it/blog/${post.slug}` });
        }
        return generateBreadcrumbJsonLd(items);
    }, [post]);

    const faqItems = useMemo(() => {
        if (!post?.content) return [];
        const faqs: { question: string; answer: string }[] = [];
        post.content.forEach(block => {
            if (block.type === 'faq') {
                faqs.push(...block.items);
            }
        });
        return faqs;
    }, [post]);

    if (loading) {
        return (
            <div className="min-h-screen bg-white flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-[#00B1FF] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-white">
            {/* SEO */}
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
            <JsonLd data={[
                blogPostJsonLd,
                breadcrumbJsonLd,
                ...(faqItems.length > 0 ? [generateFaqJsonLd(faqItems)] : [])
            ].filter(Boolean)} />

            {/* ============================================================= */}
            {/* HEADER - TON Style: Logo + Blog | Search + Menu */}
            {/* ============================================================= */}
            <header className="sticky top-0 z-50 bg-white border-b border-slate-100">
                <div className="max-w-[680px] mx-auto px-5 h-14 flex items-center justify-between">
                    {/* Left: Logo + Blog */}
                    <Link to="/blog" className="flex items-center gap-2">
                        <div className="w-7 h-7 rounded-lg bg-[#00B1FF] flex items-center justify-center text-white font-bold text-sm">
                            I
                        </div>
                        <span className="font-bold text-slate-900">Blog</span>
                    </Link>

                    {/* Right: Search + Menu */}
                    <div className="flex items-center gap-3">
                        <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                            <Search className="w-5 h-5 text-slate-600" />
                        </button>
                        <button className="w-9 h-9 rounded-full hover:bg-slate-100 flex items-center justify-center transition-colors">
                            <Menu className="w-5 h-5 text-slate-600" />
                        </button>
                    </div>
                </div>
            </header>

            {/* ============================================================= */}
            {/* ARTICLE CONTENT */}
            {/* ============================================================= */}
            <main className="max-w-[680px] mx-auto px-5 py-8">

                {/* Meta Row: Date · Category · Read Time */}
                <div className="flex items-center gap-2 text-[14px] text-slate-500 mb-5">
                    <span>{formatDate(post.published_at)}</span>
                    <span className="w-1 h-1 rounded-full bg-slate-300" />
                    {post.category && (
                        <>
                            <span className="flex items-center gap-1">
                                <span>📰</span>
                                <span>{post.category.name}</span>
                            </span>
                            <span className="w-1 h-1 rounded-full bg-slate-300" />
                        </>
                    )}
                    <span>{post.reading_time_minutes} min read</span>
                </div>

                {/* Title */}
                <h1 className="text-[28px] md:text-[32px] font-bold text-slate-900 leading-[1.2] mb-5">
                    {post.title}
                </h1>

                {/* Author + Share Row */}
                <div className="flex items-center justify-between mb-8">
                    {/* Author */}
                    <div className="flex items-center gap-2">
                        {post.author?.avatar_url ? (
                            <img
                                src={post.author.avatar_url}
                                alt={post.author.display_name}
                                className="w-8 h-8 rounded-full object-cover"
                            />
                        ) : (
                            <div className="w-8 h-8 rounded-full bg-[#00B1FF] flex items-center justify-center text-white font-bold text-sm">
                                I
                            </div>
                        )}
                        <span className="text-[14px] font-medium text-slate-700">
                            {post.author?.display_name || 'Idoneo'}
                        </span>
                    </div>

                    {/* Share Icons */}
                    <div className="flex items-center gap-1">
                        <a
                            href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener"
                            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        >
                            <Twitter className="w-4 h-4 text-slate-600" />
                        </a>
                        <a
                            href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                            target="_blank"
                            rel="noopener"
                            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                        >
                            <Linkedin className="w-4 h-4 text-slate-600" />
                        </a>
                        <button
                            onClick={copyLink}
                            className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors relative"
                        >
                            <LinkIcon className="w-4 h-4 text-slate-600" />
                            {copied && (
                                <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-xs bg-slate-900 text-white px-2 py-1 rounded">
                                    Copiato!
                                </span>
                            )}
                        </button>
                    </div>
                </div>

                {/* Cover Image */}
                {post.cover_image_url && (
                    <div className="rounded-2xl overflow-hidden mb-10">
                        <img
                            src={post.cover_image_url}
                            alt={post.title}
                            className="w-full h-auto"
                        />
                    </div>
                )}

                {/* Subtitle/Intro - if exists, show as lead paragraph */}
                {post.subtitle && (
                    <p className="text-[18px] text-slate-600 leading-[1.6] mb-8 font-medium">
                        {post.subtitle}
                    </p>
                )}

                {/* Article Body */}
                <ContentRenderer blocks={post.content || []} />

                {/* Bottom Share Row */}
                <div className="border-t border-slate-100 pt-8 mt-12">
                    <div className="flex items-center justify-between">
                        <span className="text-[14px] text-slate-500">Condividi questo articolo</span>
                        <div className="flex items-center gap-1">
                            <a
                                href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(post.title)}&url=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener"
                                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <Twitter className="w-4 h-4 text-slate-600" />
                            </a>
                            <a
                                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`}
                                target="_blank"
                                rel="noopener"
                                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <Linkedin className="w-4 h-4 text-slate-600" />
                            </a>
                            <button
                                onClick={copyLink}
                                className="w-9 h-9 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                            >
                                <LinkIcon className="w-4 h-4 text-slate-600" />
                            </button>
                        </div>
                    </div>
                </div>
            </main>

            {/* ============================================================= */}
            {/* RELATED POSTS - TON Style */}
            {/* ============================================================= */}
            {relatedPosts.length > 0 && (
                <section className="max-w-[680px] mx-auto px-5 py-12 border-t border-slate-100">
                    <h2 className="text-[28px] font-bold text-slate-900 mb-8">
                        Related Posts
                    </h2>
                    <div className="space-y-10">
                        {relatedPosts.map(p => (
                            <RelatedPostCard key={p.id} post={p} formatDate={formatDate} />
                        ))}
                    </div>
                </section>
            )}

            {/* ============================================================= */}
            {/* FOOTER */}
            {/* ============================================================= */}
            <footer className="border-t border-slate-100 py-8">
                <div className="max-w-[680px] mx-auto px-5">
                    <div className="flex items-center justify-between text-[13px] text-slate-500">
                        <Link to="/" className="flex items-center gap-2 hover:text-slate-900 transition-colors">
                            <div className="w-6 h-6 rounded-md bg-[#00B1FF] flex items-center justify-center text-white font-bold text-xs">
                                I
                            </div>
                            <span className="font-medium">Idoneo</span>
                        </Link>
                        <div className="flex items-center gap-4">
                            <Link to="/privacy" className="hover:text-slate-900 transition-colors">Privacy</Link>
                            <Link to="/terms" className="hover:text-slate-900 transition-colors">Termini</Link>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
