import { useEffect, useState, useMemo } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/lib/supabaseClient";
import { BlogPost, BlogCategory, ContentBlock } from "@/types/blog";
import { SEO, JsonLd, generateBlogPostJsonLd, generateBreadcrumbJsonLd, generateFaqJsonLd } from "@/components/SEO";

// Content Block Renderer
function ContentRenderer({ blocks }: { blocks: ContentBlock[] }) {
    return (
        <div className="prose prose-slate prose-lg max-w-none">
            {blocks.map((block, idx) => {
                switch (block.type) {
                    case 'paragraph':
                        return <p key={idx}>{block.text}</p>;

                    case 'heading':
                        const Tag = `h${block.level}` as 'h2' | 'h3';
                        return <Tag key={idx} id={`heading-${idx}`}>{block.text}</Tag>;

                    case 'list':
                        const ListTag = block.ordered ? 'ol' : 'ul';
                        return (
                            <ListTag key={idx} className={`my-6 pl-2 space-y-3 ${block.ordered ? 'list-decimal' : 'list-none'}`}>
                                {block.items.map((item, i) => (
                                    <li key={i} className="flex gap-3 text-slate-700 leading-relaxed">
                                        {!block.ordered && (
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 flex items-center justify-center mt-0.5">
                                                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                                            </span>
                                        )}
                                        {block.ordered && (
                                            <span className="flex-shrink-0 w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 font-bold text-xs flex items-center justify-center mt-0.5">
                                                {i + 1}
                                            </span>
                                        )}
                                        <span>{item}</span>
                                    </li>
                                ))}
                            </ListTag>
                        );

                    case 'callout':
                        const variants = {
                            tip: { bg: 'bg-emerald-50', border: 'border-emerald-200', icon: '💡', color: 'text-emerald-800' },
                            warning: { bg: 'bg-amber-50', border: 'border-amber-200', icon: '⚠️', color: 'text-amber-800' },
                            note: { bg: 'bg-blue-50', border: 'border-blue-200', icon: '📝', color: 'text-blue-800' },
                            example: { bg: 'bg-purple-50', border: 'border-purple-200', icon: '📌', color: 'text-purple-800' },
                        };
                        const v = variants[block.variant];
                        return (
                            <div key={idx} className={`${v.bg} ${v.border} border rounded-xl p-5 my-6 not-prose`}>
                                <div className={`font-bold ${v.color} mb-2`}>{v.icon} {block.title}</div>
                                <div className={`${v.color} opacity-80`}>{block.text}</div>
                            </div>
                        );

                    case 'faq':
                        return (
                            <div key={idx} className="space-y-4 my-8 not-prose">
                                {block.items.map((item, i) => (
                                    <details key={i} className="bg-slate-50 rounded-xl border border-slate-200 overflow-hidden group">
                                        <summary className="px-5 py-4 cursor-pointer font-medium text-slate-900 hover:bg-slate-100">
                                            {item.question}
                                        </summary>
                                        <div className="px-5 pb-4 text-slate-600">{item.answer}</div>
                                    </details>
                                ))}
                            </div>
                        );

                    case 'cta':
                        return (
                            <div key={idx} className="bg-gradient-to-r from-emerald-500 to-emerald-600 rounded-2xl p-6 my-8 text-white not-prose">
                                <h3 className="text-xl font-bold mb-2">{block.title}</h3>
                                <p className="opacity-90 mb-4">{block.description}</p>
                                <Link to={block.buttonUrl} className="inline-block bg-white text-emerald-600 font-bold px-6 py-2 rounded-lg hover:bg-emerald-50 transition-colors">
                                    {block.buttonText}
                                </Link>
                            </div>
                        );

                    case 'image':
                        return (
                            <figure key={idx} className="my-8">
                                <img src={block.url} alt={block.alt} className="rounded-xl w-full" />
                                {block.caption && <figcaption className="text-center text-sm text-slate-500 mt-2">{block.caption}</figcaption>}
                            </figure>
                        );

                    case 'table':
                        return (
                            <div key={idx} className="overflow-x-auto my-6">
                                <table className="min-w-full">
                                    <thead>
                                        <tr>
                                            {block.headers.map((h, i) => <th key={i} className="text-left">{h}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {block.rows.map((row, ri) => (
                                            <tr key={ri}>
                                                {row.map((cell, ci) => <td key={ci}>{cell}</td>)}
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

// Table of Contents
function TableOfContents({ blocks }: { blocks: ContentBlock[] }) {
    const headings = blocks
        .map((b, idx) => b.type === 'heading' ? { ...b, idx } : null)
        .filter(Boolean) as ({ type: 'heading'; level: 2 | 3; text: string; idx: number })[];

    if (headings.length === 0) return null;

    return (
        <nav className="bg-slate-50 rounded-xl p-5 mb-8">
            <h4 className="font-bold text-slate-700 mb-3">📑 Indice dell'articolo</h4>
            <ul className="space-y-2">
                {headings.map(h => (
                    <li key={h.idx} className={h.level === 3 ? 'ml-4' : ''}>
                        <a
                            href={`#heading-${h.idx}`}
                            className="text-emerald-600 hover:text-emerald-700 text-sm"
                        >
                            {h.text}
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

export default function BlogPostPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const [post, setPost] = useState<BlogPost | null>(null);
    const [relatedPosts, setRelatedPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!slug) return;
        loadPost();
    }, [slug]);

    const loadPost = async () => {
        // Fetch the post
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

        // Fetch related posts (same category)
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
            month: 'long',
            year: 'numeric'
        });
    };

    // Share URLs
    const shareUrl = typeof window !== 'undefined' ? window.location.href : '';
    const shareTitle = post?.title || '';

    // Generate structured data
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

    // Extract FAQ items for structured data
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
                <div className="text-slate-500">Caricamento...</div>
            </div>
        );
    }

    if (!post) return null;

    return (
        <div className="min-h-screen bg-white">
            {/* SEO Meta Tags */}
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

            {/* JSON-LD Structured Data */}
            <JsonLd data={[
                blogPostJsonLd,
                breadcrumbJsonLd,
                ...(faqItems.length > 0 ? [generateFaqJsonLd(faqItems)] : [])
            ].filter(Boolean)} />

            {/* Header */}
            <header className="border-b border-slate-100">
                <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/" className="text-xl font-black text-slate-900">IDONEO</Link>
                    <nav className="flex items-center gap-6">
                        <Link to="/blog" className="text-emerald-600 font-medium">← Blog</Link>
                    </nav>
                </div>
            </header>

            <article className="max-w-4xl mx-auto px-6 py-12">
                {/* Breadcrumbs */}
                <nav className="text-sm text-slate-400 mb-6">
                    <Link to="/" className="hover:text-slate-600">Home</Link>
                    <span className="mx-2">›</span>
                    <Link to="/blog" className="hover:text-slate-600">Blog</Link>
                    {post.category && (
                        <>
                            <span className="mx-2">›</span>
                            <span className="text-slate-500">{post.category.name}</span>
                        </>
                    )}
                </nav>

                {/* Category Pill */}
                {post.category && (
                    <span className="inline-block px-3 py-1 bg-emerald-100 text-emerald-700 text-xs font-bold rounded-full mb-4">
                        {post.category.name}
                    </span>
                )}

                {/* Title */}
                <h1 className="text-4xl font-black text-slate-900 mb-4">{post.title}</h1>

                {/* Subtitle */}
                {post.subtitle && (
                    <p className="text-xl text-slate-600 mb-6">{post.subtitle}</p>
                )}

                {/* Meta Row */}
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-8 pb-8 border-b border-slate-100">
                    {post.author && (
                        <div className="flex items-center gap-2">
                            {post.author.avatar_url && (
                                <img src={post.author.avatar_url} alt="" className="w-8 h-8 rounded-full" />
                            )}
                            <span className="font-medium">{post.author.display_name}</span>
                        </div>
                    )}
                    <span>📅 {formatDate(post.published_at)}</span>
                    <span>⏱️ {post.reading_time_minutes} min lettura</span>

                    {/* Share Buttons */}
                    <div className="flex items-center gap-2 ml-auto">
                        <span className="text-slate-400">Condividi:</span>
                        <a href={`https://wa.me/?text=${encodeURIComponent(shareTitle + ' ' + shareUrl)}`} target="_blank" rel="noopener" className="p-2 hover:bg-slate-100 rounded">📱</a>
                        <a href={`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}&text=${encodeURIComponent(shareTitle)}`} target="_blank" rel="noopener" className="p-2 hover:bg-slate-100 rounded">✈️</a>
                        <a href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareTitle)}&url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" className="p-2 hover:bg-slate-100 rounded">🐦</a>
                        <a href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`} target="_blank" rel="noopener" className="p-2 hover:bg-slate-100 rounded">💼</a>
                    </div>
                </div>

                {/* Cover Image */}
                {post.cover_image_url && (
                    <img
                        src={post.cover_image_url}
                        alt={post.title}
                        className="w-full rounded-2xl mb-10"
                    />
                )}

                {/* Table of Contents */}
                <TableOfContents blocks={post.content || []} />

                {/* Content */}
                <ContentRenderer blocks={post.content || []} />

                {/* Bottom CTA */}
                <div className="bg-gradient-to-r from-slate-800 to-slate-900 rounded-2xl p-8 my-12 text-white text-center">
                    <h3 className="text-2xl font-bold mb-2">Inizia a prepararti con IDONEO</h3>
                    <p className="opacity-80 mb-6">Simulazioni, quiz e statistiche per vincere il tuo concorso</p>
                    <Link to="/concorsi" className="inline-block bg-emerald-500 text-white font-bold px-8 py-3 rounded-lg hover:bg-emerald-600 transition-colors">
                        Esplora i Concorsi
                    </Link>
                </div>

                {/* Related Posts */}
                {relatedPosts.length > 0 && (
                    <section className="mt-16">
                        <h3 className="text-xl font-bold text-slate-900 mb-6">Articoli correlati</h3>
                        <div className="grid md:grid-cols-3 gap-6">
                            {relatedPosts.map(p => (
                                <Link
                                    key={p.id}
                                    to={`/blog/${p.slug}`}
                                    className="group bg-slate-50 rounded-xl overflow-hidden hover:shadow-md transition-shadow"
                                >
                                    {p.cover_image_url && (
                                        <div className="aspect-video overflow-hidden">
                                            <img
                                                src={p.cover_image_url}
                                                alt={p.title}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                            />
                                        </div>
                                    )}
                                    <div className="p-4">
                                        <h4 className="font-bold text-slate-900 group-hover:text-emerald-600 transition-colors">{p.title}</h4>
                                        <div className="text-xs text-slate-400 mt-2">{p.reading_time_minutes} min lettura</div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </section>
                )}
            </article>

            {/* Footer */}
            <footer className="bg-slate-50 border-t border-slate-100 py-8">
                <div className="max-w-4xl mx-auto px-6 text-center text-sm text-slate-500">
                    © {new Date().getFullYear()} IDONEO - La piattaforma per prepararti ai concorsi pubblici
                </div>
            </footer>
        </div>
    );
}
