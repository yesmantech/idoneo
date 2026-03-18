import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { email, name } = req.body;

    if (!email) {
        return res.status(400).json({ error: 'Email is required' });
    }

    // SEC-019 FIX: Strict email validation to prevent header injection
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (typeof email !== 'string' || !emailRegex.test(email) || email.length > 254) {
        return res.status(400).json({ error: 'Invalid email format' });
    }
    // Reject emails with newlines (header injection vector)
    if (email.includes('\n') || email.includes('\r')) {
        return res.status(400).json({ error: 'Invalid email format' });
    }

    // Simple auth check — only allow calls from our own frontend
    const origin = req.headers.origin || req.headers.referer || '';
    const allowedOrigins = ['https://idoneo.ai', 'https://www.idoneo.ai', 'capacitor://localhost', 'http://localhost'];
    const isAllowed = allowedOrigins.some(o => origin.startsWith(o)) || process.env.NODE_ENV === 'development';
    if (!isAllowed) {
        return res.status(403).json({ error: 'Forbidden' });
    }

    // Sanitize name field — strip newlines and limit length
    const displayName = (typeof name === 'string' ? name.replace(/[\r\n]/g, '').slice(0, 100) : null) || 'Aspirante Idoneo';

    try {
        await resend.emails.send({
            from: 'Idoneo <noreply@idoneo.ai>',
            to: email,
            subject: `Benvenuto su Idoneo, ${displayName}! 🎯`,
            html: `
<!DOCTYPE html>
<html lang="it">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Benvenuto su Idoneo</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f8fafc; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f8fafc; padding: 40px 20px;">
        <tr>
            <td align="center">
                <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 520px; background: white; border-radius: 20px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.06);">
                    
                    <!-- Header gradient -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #0077CC 0%, #00B1FF 50%, #00D4AA 100%); padding: 40px 32px 30px; text-align: center;">
                            <div style="font-size: 48px; margin-bottom: 12px;">🎯</div>
                            <h1 style="color: white; font-size: 26px; font-weight: 800; margin: 0; letter-spacing: -0.5px;">
                                Benvenuto su Idoneo!
                            </h1>
                            <p style="color: rgba(255,255,255,0.85); font-size: 15px; margin: 8px 0 0; font-weight: 500;">
                                La tua preparazione ai concorsi inizia ora
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Body -->
                    <tr>
                        <td style="padding: 32px 28px;">
                            <p style="color: #334155; font-size: 16px; line-height: 1.6; margin: 0 0 20px;">
                                Ciao <strong>${displayName}</strong>,
                            </p>
                            <p style="color: #64748b; font-size: 15px; line-height: 1.7; margin: 0 0 24px;">
                                Il tuo account è stato creato con successo. Sei pronto a prepararti per i concorsi pubblici con quiz ufficiali, simulazioni a tempo e statistiche avanzate.
                            </p>
                            
                            <!-- Features -->
                            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 28px;">
                                <tr>
                                    <td style="padding: 12px 16px; background: #f0f9ff; border-radius: 12px; margin-bottom: 8px;">
                                        <table cellpadding="0" cellspacing="0"><tr>
                                            <td style="padding-right: 12px; font-size: 22px; vertical-align: middle;">📚</td>
                                            <td>
                                                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">Quiz Ufficiali</div>
                                                <div style="font-size: 13px; color: #64748b;">Migliaia di domande da banche dati reali</div>
                                            </td>
                                        </tr></table>
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="padding: 12px 16px; background: #f0fdf4; border-radius: 12px;">
                                        <table cellpadding="0" cellspacing="0"><tr>
                                            <td style="padding-right: 12px; font-size: 22px; vertical-align: middle;">🤖</td>
                                            <td>
                                                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">AI Coach</div>
                                                <div style="font-size: 13px; color: #64748b;">Assistente AI per spiegarti ogni risposta</div>
                                            </td>
                                        </tr></table>
                                    </td>
                                </tr>
                                <tr><td style="height: 8px;"></td></tr>
                                <tr>
                                    <td style="padding: 12px 16px; background: #fefce8; border-radius: 12px;">
                                        <table cellpadding="0" cellspacing="0"><tr>
                                            <td style="padding-right: 12px; font-size: 22px; vertical-align: middle;">🏆</td>
                                            <td>
                                                <div style="font-size: 14px; font-weight: 700; color: #0f172a;">Classifiche & Badge</div>
                                                <div style="font-size: 13px; color: #64748b;">Competi con altri candidati e guadagna premi</div>
                                            </td>
                                        </tr></table>
                                    </td>
                                </tr>
                            </table>
                            
                            <!-- CTA Button -->
                            <table width="100%" cellpadding="0" cellspacing="0">
                                <tr>
                                    <td align="center">
                                        <a href="https://idoneo.ai" style="display: inline-block; background: linear-gradient(135deg, #00B1FF, #00D4AA); color: white; font-size: 16px; font-weight: 800; padding: 14px 40px; border-radius: 14px; text-decoration: none; letter-spacing: -0.3px;">
                                            Inizia a prepararti →
                                        </a>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="padding: 20px 28px 28px; border-top: 1px solid #f1f5f9; text-align: center;">
                            <p style="color: #94a3b8; font-size: 12px; margin: 0 0 4px;">
                                © ${new Date().getFullYear()} Alessandro Valenza — Idoneo
                            </p>
                            <p style="color: #cbd5e1; font-size: 11px; margin: 0;">
                                Hai ricevuto questa email perché hai creato un account su idoneo.ai
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
        });

        return res.status(200).json({ success: true });
    } catch (error: any) {
        console.error('Welcome email error:', error);
        return res.status(500).json({ error: 'Failed to send email' });
    }
}
