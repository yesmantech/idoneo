import { useEffect } from 'react';

// =============================================================================
// SEO HEAD - Dynamic meta tags for SEO optimization
// =============================================================================

interface SEOProps {
    title?: string;
    description?: string;
    image?: string;
    url?: string;
    type?: 'website' | 'article' | 'profile';
    noindex?: boolean;
    structuredData?: object;
}

const DEFAULT_TITLE = 'Idoneo - Preparati ai Concorsi Pubblici';
const DEFAULT_DESCRIPTION = 'Idoneo è la piattaforma n°1 per prepararti ai concorsi pubblici. Quiz, simulazioni e statistiche per Polizia, Carabinieri, Forze Armate e molto altro.';
const DEFAULT_IMAGE = 'https://idoneo.ai/icon-512x512.png';
const SITE_URL = 'https://idoneo.ai';

/**
 * SEO component for managing document head meta tags
 * Updates title, Open Graph, Twitter Cards, and structured data
 */
export default function SEOHead({
    title,
    description = DEFAULT_DESCRIPTION,
    image = DEFAULT_IMAGE,
    url,
    type = 'website',
    noindex = false,
    structuredData
}: SEOProps) {
    const fullTitle = title ? `${title} | Idoneo` : DEFAULT_TITLE;
    const fullUrl = url ? `${SITE_URL}${url}` : SITE_URL;

    useEffect(() => {
        // Update document title
        document.title = fullTitle;

        // Helper to set meta tag
        const setMeta = (name: string, content: string, property = false) => {
            const attr = property ? 'property' : 'name';
            let element = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement;

            if (!element) {
                element = document.createElement('meta');
                element.setAttribute(attr, name);
                document.head.appendChild(element);
            }
            element.setAttribute('content', content);
        };

        // Basic meta tags
        setMeta('description', description);
        setMeta('robots', noindex ? 'noindex, nofollow' : 'index, follow');

        // Open Graph
        setMeta('og:title', fullTitle, true);
        setMeta('og:description', description, true);
        setMeta('og:image', image, true);
        setMeta('og:url', fullUrl, true);
        setMeta('og:type', type, true);
        setMeta('og:site_name', 'Idoneo', true);
        setMeta('og:locale', 'it_IT', true);

        // Twitter Cards
        setMeta('twitter:card', 'summary_large_image');
        setMeta('twitter:title', fullTitle);
        setMeta('twitter:description', description);
        setMeta('twitter:image', image);

        // Canonical URL
        let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
        if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
        }
        canonical.setAttribute('href', fullUrl);

        // Structured Data (JSON-LD)
        if (structuredData) {
            let script = document.querySelector('script[data-seo="structured-data"]') as HTMLScriptElement;
            if (!script) {
                script = document.createElement('script');
                script.setAttribute('type', 'application/ld+json');
                script.setAttribute('data-seo', 'structured-data');
                document.head.appendChild(script);
            }
            script.textContent = JSON.stringify(structuredData);
        }

        // Cleanup on unmount (optional - keeps last values)
        return () => {
            // We don't remove meta tags on unmount to prevent flash
        };
    }, [fullTitle, description, image, fullUrl, type, noindex, structuredData]);

    return null; // This component doesn't render anything
}

// =============================================================================
// STRUCTURED DATA HELPERS
// =============================================================================

export function getOrganizationSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: 'Idoneo',
        url: SITE_URL,
        logo: DEFAULT_IMAGE,
        description: DEFAULT_DESCRIPTION,
        sameAs: [
            'https://www.instagram.com/idoneo.app/',
            // Add other social links
        ]
    };
}

export function getWebsiteSchema() {
    return {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Idoneo',
        url: SITE_URL,
        description: DEFAULT_DESCRIPTION,
        potentialAction: {
            '@type': 'SearchAction',
            target: `${SITE_URL}/search?q={search_term_string}`,
            'query-input': 'required name=search_term_string'
        }
    };
}

export function getQuizSchema(quizName: string, description: string) {
    return {
        '@context': 'https://schema.org',
        '@type': 'Quiz',
        name: quizName,
        description: description,
        educationalLevel: 'Concorso Pubblico',
        provider: {
            '@type': 'Organization',
            name: 'Idoneo',
            url: SITE_URL
        }
    };
}

export function getBreadcrumbSchema(items: { name: string; url: string }[]) {
    return {
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: items.map((item, index) => ({
            '@type': 'ListItem',
            position: index + 1,
            name: item.name,
            item: `${SITE_URL}${item.url}`
        }))
    };
}
