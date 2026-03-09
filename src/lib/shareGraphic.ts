/**
 * @file shareGraphic.ts
 * @description Generates Tier S share graphics using AI-generated backgrounds.
 *
 * Composes:
 * 1. AI-generated cinematic background (per badge theme)
 * 2. Large badge icon overlay (from app assets)
 * 3. Bold white achievement text
 * 4. "idoneo" brand logo
 *
 * Output: 1080x1080 PNG shared via Web Share API or downloaded.
 */

// Map badge color classes → AI background image file
const BG_MAP: Record<string, string> = {
    'from-blue-400 to-cyan-400': '/icons/share/bg-cyan.png',    // Primo Passo, Fulmine
    'from-amber-400 to-orange-500': '/icons/share/bg-gold.png',    // Secchione
    'from-slate-700 to-slate-900': '/icons/share/bg-slate.png',   // Veterano
    'from-pink-400 to-rose-500': '/icons/share/bg-red.png',     // Social-ONE
    'from-yellow-400 to-amber-500': '/icons/share/bg-gold.png',    // Inarrestabile, Maratoneta
    'from-red-500 to-maroon-700': '/icons/share/bg-red.png',     // Cecchino
    'from-cyan-400 to-blue-600': '/icons/share/bg-cyan.png',    // Fulmine
    'from-emerald-400 to-teal-600': '/icons/share/bg-green.png',   // Enciclopedia
    'from-indigo-600 to-purple-900': '/icons/share/bg-violet.png',  // Nottambulo
    'from-orange-500 to-red-600': '/icons/share/bg-orange.png',  // Hub Master
    'from-slate-300 to-slate-500': '/icons/share/bg-slate.png',   // Costanza
    'from-blue-400 to-indigo-600': '/icons/share/bg-cyan.png',    // Diamante
    'from-pink-400 via-purple-500 to-cyan-400': '/icons/share/bg-violet.png', // Immortale
    'from-purple-400 to-indigo-600': '/icons/share/bg-violet.png',  // Leggenda
};

interface ShareBadgeData {
    name: string;
    description: string;
    imageSrc: string;
    color: string;
}

/** Load image helper */
function loadImage(src: string): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error(`Failed to load: ${src}`));
        img.src = src;
    });
}

/** Word-wrap text to fit within maxWidth */
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let current = '';

    for (const word of words) {
        const test = current ? `${current} ${word}` : word;
        if (ctx.measureText(test).width > maxWidth && current) {
            lines.push(current);
            current = word;
        } else {
            current = test;
        }
    }
    if (current) lines.push(current);
    return lines;
}

/**
 * Generates a Tier S share graphic and returns it as a File.
 */
export async function generateBadgeGraphicFile(badge: ShareBadgeData): Promise<File> {
    const SIZE = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    // 1. Draw AI-generated background
    const bgPath = BG_MAP[badge.color] || '/icons/share/bg-cyan.png';
    try {
        const bgImg = await loadImage(bgPath);
        ctx.drawImage(bgImg, 0, 0, SIZE, SIZE);
    } catch {
        // Fallback: solid dark background
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, SIZE, SIZE);
    }

    // 2. Draw badge icon — large, centered in upper portion
    try {
        const iconImg = await loadImage(badge.imageSrc);
        const iconSize = 480;
        const iconX = (SIZE - iconSize) / 2;
        const iconY = SIZE * 0.08;

        // Subtle shadow behind icon
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 15;
        ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
    } catch {
        // Skip icon if loading fails
    }

    // 3. Achievement text — bold white, centered
    const fontSize = 56;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `900 ${fontSize}px -apple-system, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

    const textY = SIZE * 0.62;
    const maxWidth = SIZE - 120;
    const lineHeight = fontSize * 1.35;
    const lines = wrapText(ctx, badge.description, maxWidth);

    // Text shadow for readability
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 3;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], SIZE / 2, textY + i * lineHeight, maxWidth);
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 4. Brand logo — "idoneo" at bottom
    ctx.font = `900 52px -apple-system, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    ctx.fillStyle = '#00B1FF';
    ctx.fillText('idoneo', SIZE / 2, SIZE - 110);

    // 5. Return the file
    const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
    });

    return new File([blob], `idoneo-${badge.name.toLowerCase().replace(/\s+/g, '-')}.png`, {
        type: 'image/png',
    });
}

interface ShareRecordData {
    label: string;
    value: string | number;
    /** Human-friendly text for the share graphic, e.g. '26 giorni' */
    shareText: string;
    iconSrc: string;
    /** hex color for glow/accent, e.g. '#ef4444' */
    accentColor: string;
    /** AI background key: 'red' | 'gold' | 'cyan' | 'green' | 'violet' | 'orange' | 'slate' */
    bgKey: string;
}

/**
 * Generates a Tier S share graphic for a Personal Record and returns it as a File.
 */
export async function generateRecordGraphicFile(record: ShareRecordData): Promise<File> {
    const SIZE = 1080;
    const canvas = document.createElement('canvas');
    canvas.width = SIZE;
    canvas.height = SIZE;
    const ctx = canvas.getContext('2d')!;

    // 1. Draw AI-generated background (same as badges)
    const bgPath = `/icons/share/bg-${record.bgKey}.png`;
    try {
        const bgImg = await loadImage(bgPath);
        ctx.drawImage(bgImg, 0, 0, SIZE, SIZE);
    } catch {
        ctx.fillStyle = '#0a0a0a';
        ctx.fillRect(0, 0, SIZE, SIZE);
    }

    // 2. Draw record icon — large, centered in upper portion (same as badges)
    try {
        const iconImg = await loadImage(record.iconSrc);
        const iconSize = 480;
        const iconX = (SIZE - iconSize) / 2;
        const iconY = SIZE * 0.08;

        // Subtle shadow behind icon (same as badges)
        ctx.shadowColor = 'rgba(0,0,0,0.5)';
        ctx.shadowBlur = 40;
        ctx.shadowOffsetY = 15;
        ctx.drawImage(iconImg, iconX, iconY, iconSize, iconSize);

        // Reset shadow
        ctx.shadowColor = 'transparent';
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
    } catch { /* skip */ }

    // 3. Achievement text — bold white, centered (same style as badges)
    const description = record.shareText;
    const fontSize = 56;
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.font = `900 ${fontSize}px -apple-system, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;

    const textY = SIZE * 0.62;
    const maxWidth = SIZE - 120;
    const lineHeight = fontSize * 1.35;
    const lines = wrapText(ctx, description, maxWidth);

    // Text shadow for readability (same as badges)
    ctx.shadowColor = 'rgba(0,0,0,0.6)';
    ctx.shadowBlur = 15;
    ctx.shadowOffsetY = 3;

    for (let i = 0; i < lines.length; i++) {
        ctx.fillText(lines[i], SIZE / 2, textY + i * lineHeight, maxWidth);
    }

    // Reset shadow
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // 4. Brand logo — "idoneo" at bottom (same as badges)
    ctx.font = `900 52px -apple-system, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif`;
    ctx.fillStyle = '#00B1FF';
    ctx.fillText('idoneo', SIZE / 2, SIZE - 110);

    // 5. Return the file
    const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((b) => resolve(b!), 'image/png', 1.0);
    });

    return new File([blob], `idoneo-record-${record.label.toLowerCase().replace(/\s+/g, '-')}.png`, {
        type: 'image/png',
    });
}

