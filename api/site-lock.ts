import type { VercelRequest, VercelResponse } from '@vercel/node';

// =============================================================================
// API ROUTE: /api/site-lock
// Validates credentials server-side and returns a token
// =============================================================================

const COOKIE_NAME = 'idoneo_site_lock';
const TOKEN_VALUE = 'authenticated_v1';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days

export default function handler(req: VercelRequest, res: VercelResponse) {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
        const origin = req.headers.origin || '';
        const allowedOrigins = ['https://idoneo.ai', 'capacitor://localhost', 'http://localhost'];
        if (allowedOrigins.includes(origin)) {
            res.setHeader('Access-Control-Allow-Origin', origin);
        }
        res.setHeader('Access-Control-Allow-Methods', 'POST, GET');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(200).end();
    }

    // GET — check if already authenticated
    if (req.method === 'GET') {
        const enabled = process.env.SITE_LOCK_ENABLED;
        if (enabled !== 'true') {
            return res.json({ locked: false });
        }

        const cookie = req.cookies?.[COOKIE_NAME];
        return res.json({
            locked: true,
            authenticated: cookie === TOKEN_VALUE,
        });
    }

    // POST — authenticate
    if (req.method === 'POST') {
        const enabled = process.env.SITE_LOCK_ENABLED;
        if (enabled !== 'true') {
            return res.json({ success: true, locked: false });
        }

        const { username, password } = req.body || {};
        const validUser = process.env.SITE_LOCK_USERNAME || 'admin';
        const validPass = process.env.SITE_LOCK_PASSWORD || '';

        if (username === validUser && password === validPass && validPass !== '') {
            // Set HttpOnly cookie
            res.setHeader(
                'Set-Cookie',
                `${COOKIE_NAME}=${TOKEN_VALUE}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${MAX_AGE}`
            );
            return res.json({ success: true });
        }

        return res.status(401).json({ success: false, error: 'Credenziali non valide' });
    }

    return res.status(405).json({ error: 'Method not allowed' });
}
