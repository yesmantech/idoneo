import { useEffect } from 'react';

interface SEOProps {
    title: string;
    description?: string;
    canonical?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    noindex?: boolean;
    type?: 'website' | 'article';
    publishedTime?: string;
    modifiedTime?: string;
    author?: string;
}

/**
 * SEO Component - Sets document title and meta tags
 * Works with React 19 (no external dependencies)
 */
export function SEO({
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    ogImage,
    noindex = false,
    type = 'website',
    publishedTime,
    modifiedTime,
    author,
}: SEOProps) {
    useEffect(() => {
        // Set document title
        document.title = title;

        // Helper to set or create meta tag
        const setMeta = (name: string, content: string, property = false) => {
            const attr = property ? 'property' : 'name';
            let meta = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute(attr, name);
                document.head.appendChild(meta);
            }
            meta.content = content;
        };

        // Basic meta
        if (description) setMeta('description', description);

        // Robots
        if (noindex) {
            setMeta('robots', 'noindex, nofollow');
        } else {
            setMeta('robots', 'index, follow');
        }

        // Open Graph
        setMeta('og:title', ogTitle || title, true);
        setMeta('og:type', type, true);
        if (ogDescription || description) setMeta('og:description', ogDescription || description || '', true);
        if (ogImage) setMeta('og:image', ogImage, true);
        if (canonical) setMeta('og:url', canonical, true);

        // Twitter Card
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', ogTitle || title);
        if (ogDescription || description) setMeta('twitter:description', ogDescription || description || '');
        if (ogImage) setMeta('twitter:image', ogImage);

        // Article specific
        if (type === 'article') {
            if (publishedTime) setMeta('article:published_time', publishedTime, true);
            if (modifiedTime) setMeta('article:modified_time', modifiedTime, true);
            if (author) setMeta('article:author', author, true);
        }

        // Canonical link
        if (canonical) {
            let link = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
            if (!link) {
                link = document.createElement('link');
                link.rel = 'canonical';
                document.head.appendChild(link);
            }
            link.href = canonical;
        }

        // Cleanup function
        return () => {
            // Reset title on unmount (optional)
            document.title = 'IDONEO';
        };
    }, [title, description, canonical, ogTitle, ogDescription, ogImage, noindex, type, publishedTime, modifiedTime, author]);

    return null;
}

/**
 * Generate JSON-LD structured data for blog posts
 */
export function generateBlogPostJsonLd(post: {
    title: string;
    description?: string;
    slug: string;
    coverImage?: string;
    authorName?: string;
    publishedAt?: string;
    updatedAt?: string;
    categoryName?: string;
}) {
    const baseUrl = 'https://idoneo.it';

    return {
        '@context': 'https://schema.org',
        '@type': 'BlogPosting',
        headline: post.title,
        description: post.description,
        image: post.coverImage,
        author: {
            '@type': 'Person',
            name: post.authorName || 'Team IDONEO',
        },
        publisher: {
            '@type': 'Organization',
            name: 'IDONEO',
            logo: {
                '@type': 'ImageObject',
                url: `${baseUrl}/logo.png`,
            },
        },
        datePublished: post.publishedAt,
        dateModified: post.updatedAt || post.publishedAt,
        mainEntityOfPage: {
            '@type': 'WebPage',
            '@id': `${baseUrl}/blog/${post.slug}`,
        },
        articleSection: post.categoryName,
    };
}

/**
 * Generate JSON-LD for breadcrumbs
 */
export function generateBreadcrumbJsonLd(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: item.url,
        })),
    };
}

/**
 * Generate JSON-LD for FAQ blocks
 */
export function generateFaqJsonLd(faqs: { question: string; answer: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: faqs.map(faq => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
                '@type': 'Answer',
                text: faq.answer,
            },
        })),
    };
}

/**
 * Component to inject JSON-LD into the page
 */
export function JsonLd({ data }: { data: object | object[] }) {
    useEffect(() => {
        const scripts: HTMLScriptElement[] = [];
        const dataArray = Array.isArray(data) ? data : [data];

        dataArray.forEach((d, i) => {
            const script = document.createElement('script');
            script.type = 'application/ld+json';
            script.text = JSON.stringify(d);
            script.id = `json-ld-${i}`;
            document.head.appendChild(script);
            scripts.push(script);
        });

        return () => {
            scripts.forEach(script => script.remove());
        };
    }, [data]);

    return null;
}
