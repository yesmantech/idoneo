import React, { useRef, useEffect, useState } from 'react';
import { useChat } from '@ai-sdk/react';
import { motion, AnimatePresence } from 'framer-motion';
import { DefaultChatTransport } from 'ai';
import ReactMarkdown from 'react-markdown';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { ArrowUp, Bot, User, Sparkles, RotateCcw, ArrowLeft, Mic, Copy, Check, ThumbsUp, ThumbsDown, MoreVertical, Trash2, X, Plus, MessageSquare, Mail, Link2, BookOpen, AlertCircle, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { supabase } from '@/lib/supabaseClient';

// iOS-style Share icon (square open at top + upward arrow)
const IosShareIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 3v12" />
        <path d="m8 7 4-4 4 4" />
        <path d="M7 10H5a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-8a2 2 0 0 0-2-2h-2" />
    </svg>
);

// =============================================
// Feedback Modal — Tier S
// =============================================
const ISSUE_CATEGORIES = [
    { label: 'Non accurato', emoji: '❌' },
    { label: 'Non utile', emoji: '🤷' },
    { label: 'Troppo lungo', emoji: '📏' },
    { label: 'Altro', emoji: '💬' },
];

function FeedbackModal({ isOpen, onClose, type, messageContent }: { isOpen: boolean; onClose: () => void; type: 'like' | 'dislike'; messageContent?: string }) {
    const [text, setText] = useState('');
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [submitted, setSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { user } = useAuth();

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
            setSubmitted(false);
            setText('');
            setSelectedCategory(null);
        } else {
            document.body.style.overflow = '';
        }
        return () => { document.body.style.overflow = ''; };
    }, [isOpen]);

    const handleSubmit = async () => {
        if (isSubmitting) return;
        setIsSubmitting(true);
        try {
            await supabase.from('question_reports').insert({
                user_id: user?.id,
                report_type: 'ai_feedback',
                reason: selectedCategory || 'Feedback AI',
                description: [
                    text ? `Dettagli: ${text}` : '',
                    messageContent ? `Risposta AI: ${messageContent.slice(0, 500)}` : '',
                ].filter(Boolean).join('\n\n') || null,
                question_id: null,
            });
        } catch (e) {
            console.error('Error submitting AI feedback:', e);
        }
        setIsSubmitting(false);
        setSubmitted(true);
        setTimeout(onClose, 1800);
    };

    // Stagger children
    const containerVariants = {
        hidden: {},
        visible: {
            transition: { staggerChildren: 0.08, delayChildren: 0.15 }
        }
    };
    const itemVariants = {
        hidden: { opacity: 0, y: 16 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] } }
    };

    return (
        <AnimatePresence>
            {isOpen && (
                <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%', transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
                    transition={{ duration: 0.45, ease: [0.32, 1, 0.23, 1] }}
                    className="fixed inset-0 z-[110] bg-white dark:bg-[#000000] flex flex-col"
                >
                    {/* Header */}
                    <div className="flex items-center justify-between px-5 py-4">
                        <div className="w-8" />
                        <h3 className="text-[17px] font-semibold text-black dark:text-white tracking-tight">Feedback</h3>
                        <motion.button
                            whileTap={{ scale: 0.85 }}
                            onClick={onClose}
                            className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 dark:bg-[#1C1C1E] hover:bg-gray-200 dark:hover:bg-[#2C2C2E] transition-colors"
                        >
                            <X className="w-[18px] h-[18px] text-gray-400 dark:text-[#EBEBF5]/60" />
                        </motion.button>
                    </div>

                    {/* Separator */}
                    <div className="h-px bg-gradient-to-r from-transparent via-gray-200 dark:via-[#2A2A2A] to-transparent" />

                    {submitted ? (
                        /* ===== Success State ===== */
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                            className="flex-1 flex flex-col items-center justify-center gap-5 px-8"
                        >
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 15, delay: 0.1 }}
                                className="w-20 h-20 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 flex items-center justify-center shadow-lg shadow-green-500/20"
                            >
                                <Check className="w-10 h-10 text-white" strokeWidth={3} />
                            </motion.div>
                            <motion.p
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3, duration: 0.4 }}
                                className="text-[20px] font-semibold text-black dark:text-white"
                            >
                                Grazie per il feedback!
                            </motion.p>
                            <motion.p
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 0.6 }}
                                transition={{ delay: 0.45, duration: 0.4 }}
                                className="text-[15px] text-gray-500 dark:text-gray-400 text-center"
                            >
                                Il tuo contributo ci aiuta a migliorare l'esperienza.
                            </motion.p>
                        </motion.div>
                    ) : (
                        /* ===== Form State ===== */
                        <>
                            <motion.div
                                variants={containerVariants}
                                initial="hidden"
                                animate="visible"
                                className="flex-1 overflow-y-auto px-5 py-6 space-y-7"
                            >
                                {/* Hero Icon */}
                                <motion.div variants={itemVariants} className="flex flex-col items-center gap-3 pt-2 pb-4">
                                    <motion.div
                                        initial={{ scale: 0, rotate: -20 }}
                                        animate={{ scale: 1, rotate: 0 }}
                                        transition={{ type: 'spring', stiffness: 400, damping: 12, delay: 0.2 }}
                                        className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${type === 'like'
                                            ? 'bg-gradient-to-br from-[#06D6D3] to-[#0095FF] shadow-[#0095FF]/20'
                                            : 'bg-gradient-to-br from-orange-400 to-red-500 shadow-red-500/20'
                                            }`}
                                    >
                                        {type === 'like'
                                            ? <ThumbsUp className="w-7 h-7 text-white" fill="currentColor" />
                                            : <ThumbsDown className="w-7 h-7 text-white" fill="currentColor" />}
                                    </motion.div>
                                    <p className="text-[15px] text-gray-500 dark:text-[#8E8E93] text-center max-w-[280px]">
                                        {type === 'like' ? 'Cosa ti è piaciuto di questa risposta?' : 'Cosa possiamo migliorare?'}
                                    </p>
                                </motion.div>

                                {/* Issue Category Chips */}
                                <motion.div variants={itemVariants} className="space-y-3">
                                    <label className="text-[13px] font-semibold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider block px-1">Categoria</label>
                                    <div className="flex flex-wrap gap-2">
                                        {ISSUE_CATEGORIES.map(cat => (
                                            <motion.button
                                                key={cat.label}
                                                whileTap={{ scale: 0.93 }}
                                                onClick={() => setSelectedCategory(selectedCategory === cat.label ? null : cat.label)}
                                                className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[14px] font-medium transition-all duration-200 border ${selectedCategory === cat.label
                                                    ? 'bg-[#0095FF]/10 dark:bg-[#0095FF]/15 border-[#0095FF] text-[#0095FF]'
                                                    : 'bg-gray-50 dark:bg-[#1C1C1E] border-gray-200 dark:border-[#333] text-gray-700 dark:text-gray-300 hover:border-gray-300 dark:hover:border-[#444]'
                                                    }`}
                                            >
                                                <span>{cat.emoji}</span>
                                                <span>{cat.label}</span>
                                            </motion.button>
                                        ))}
                                    </div>
                                </motion.div>

                                {/* Textarea */}
                                <motion.div variants={itemVariants} className="space-y-3">
                                    <label className="text-[13px] font-semibold text-gray-400 dark:text-[#8E8E93] uppercase tracking-wider block px-1">Dettagli</label>
                                    <div className="relative group">
                                        <textarea
                                            value={text}
                                            onChange={(e) => setText(e.target.value)}
                                            maxLength={2000}
                                            placeholder="Racconta di più per aiutarci a migliorare…"
                                            className="w-full h-36 bg-gray-50 dark:bg-[#1C1C1E] border border-gray-200 dark:border-[#333] rounded-2xl p-4 text-[15px] text-black dark:text-white placeholder:text-gray-400 dark:placeholder:text-[#555] outline-none resize-none transition-all duration-300 focus:border-[#0095FF] focus:ring-2 focus:ring-[#0095FF]/10 focus:shadow-[0_0_0_4px_rgba(0,149,255,0.06)]"
                                        />
                                        <div className={`absolute bottom-3 right-4 text-[11px] font-semibold tabular-nums transition-colors duration-300 ${text.length > 1800 ? 'text-red-400' : text.length > 0 ? 'text-[#0095FF]' : 'text-gray-300 dark:text-gray-600'
                                            }`}>
                                            {text.length} / 2000
                                        </div>
                                    </div>
                                </motion.div>
                            </motion.div>

                            {/* Submit Footer */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.4, duration: 0.4, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] }}
                                className="px-5 py-4 border-t border-gray-100 dark:border-[#1A1A1A] pb-safe"
                            >
                                <Button
                                    variant="primary"
                                    fullWidth
                                    size="md"
                                    onClick={handleSubmit}
                                    disabled={!selectedCategory && text.length === 0}
                                >
                                    Invia feedback
                                </Button>
                            </motion.div>
                        </>
                    )}
                </motion.div>
            )}
        </AnimatePresence>
    );
}

// =============================================
// Share Sheet Modal (Native iOS Replica)
// =============================================
function ShareSheet({ text, onClose }: { text: string; onClose: () => void }) {
    const [copied, setCopied] = useState(false);

    // Prevent body scroll when open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => { setCopied(false); onClose(); }, 1500);
    };

    return (
        <AnimatePresence>
            {/* Backdrop Blur & Dim */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0, transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
                transition={{ duration: 0.4, ease: 'easeOut' }}
                onClick={onClose}
                className="fixed inset-0 z-[100] bg-black/45 backdrop-blur-[8px]"
            />

            {/* Bottom Sheet */}
            <motion.div
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%', transition: { duration: 0.35, ease: [0.4, 0, 1, 1] } }}
                transition={{ duration: 0.45, ease: [0.32, 1, 0.23, 1] }}
                className="fixed bottom-0 left-0 right-0 z-[101] bg-[#F2F2F7] dark:bg-[#1C1C1E] rounded-t-[20px] pb-safe flex flex-col max-h-[90vh] shadow-2xl"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-300 dark:border-[#38383A]/50">
                    <div className="w-8" /> {/* Spacer */}
                    <span className="text-sm font-semibold text-black dark:text-white">chatgpt.com</span>
                    <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 dark:bg-[#2C2C2E] hover:opacity-80 transition-opacity">
                        <X className="w-5 h-5 text-gray-500 dark:text-[#EBEBF5]/60" />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
                    {/* Contacts Row */}
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 mask-edges">
                        {[1, 2, 3, 4, 5].map((i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 shadow-md"></div>
                                <span className="text-xs text-black dark:text-[#EBEBF5]/60">Utente {i}</span>
                            </div>
                        ))}
                    </div>

                    {/* Apps Row */}
                    <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4 mask-edges">
                        {[
                            { icon: MessageSquare, name: 'Messaggi', color: 'bg-green-500' },
                            { icon: Mail, name: 'Mail', color: 'bg-blue-500' },
                            { icon: Link2, name: 'Copia link', color: 'bg-gray-400 dark:bg-gray-600' },
                            { icon: BookOpen, name: 'Note', color: 'bg-yellow-500' }
                        ].map((app, i) => (
                            <div key={i} className="flex flex-col items-center gap-1.5 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white shadow-md ${app.color}`}>
                                    <app.icon className="w-7 h-7" />
                                </div>
                                <span className="text-xs text-black dark:text-[#EBEBF5]/60">{app.name}</span>
                            </div>
                        ))}
                    </div>

                    {/* Actions List */}
                    <div className="bg-white dark:bg-[#2C2C2E] rounded-[14px] overflow-hidden">
                        <button onClick={handleCopy} className="w-full flex items-center justify-between px-4 py-3.5 border-b border-gray-200 dark:border-[#38383A] hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors active:bg-gray-100 dark:active:bg-[#4A4A4C]">
                            <span className="text-[17px] text-black dark:text-white">{copied ? 'Copiato!' : 'Copia'}</span>
                            {copied ? <Check className="w-5 h-5 text-green-500" /> : <Copy className="w-5 h-5 text-gray-500 dark:text-[#EBEBF5]/60" />}
                        </button>
                        <button className="w-full flex items-center justify-between px-4 py-3.5 hover:bg-gray-50 dark:hover:bg-[#3A3A3C] transition-colors active:bg-gray-100 dark:active:bg-[#4A4A4C]">
                            <span className="text-[17px] text-black dark:text-white">Aggiungi a nuova nota rapida</span>
                            <Plus className="w-5 h-5 text-gray-500 dark:text-[#EBEBF5]/60" />
                        </button>
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}

// =============================================
// Action Row sub-component with interactive state
// =============================================
function MessageActions({ text }: { text: string }) {
    const [toastMessage, setToastMessage] = useState<string | null>(null);
    const [reaction, setReaction] = useState<'like' | 'dislike' | null>(null);
    const [isShareOpen, setIsShareOpen] = useState(false);
    const [feedbackModalState, setFeedbackModalState] = useState<{ isOpen: boolean; type: 'like' | 'dislike' }>({ isOpen: false, type: 'like' });

    const showToast = (msg: string) => {
        setToastMessage(msg);
        setTimeout(() => setToastMessage(null), 2000);
    };

    const handleCopy = async () => {
        await navigator.clipboard.writeText(text);
        showToast('Messaggio copiato');
    };

    const handleShare = async () => {
        const shareData = { title: 'AI Coach', text };
        if (navigator.share && (typeof navigator.canShare !== 'function' || navigator.canShare(shareData))) {
            try { await navigator.share(shareData); } catch { /* user cancelled */ }
            return; // Always return — never fall through to custom sheet
        }
        // Only for browsers without navigator.share
        setIsShareOpen(true);
    };

    const handleReaction = (type: 'like' | 'dislike') => {
        const newReaction = reaction === type ? null : type;
        setReaction(newReaction);
        if (newReaction === 'like') {
            // Like: only show dismissible toast, no modal
            showToast('Grazie per il feedback!');
        } else if (newReaction === 'dislike') {
            // Dislike: open feedback modal directly, no toast
            setFeedbackModalState({ isOpen: true, type: 'dislike' });
        }
    };

    // Scale-up pop for like/dislike (1.2x bounce as in reference)
    const reactionSpring = { type: 'spring' as const, stiffness: 500, damping: 15 };

    return (
        <div className="flex items-center gap-3 mt-3 text-gray-400 dark:text-gray-500">
            {/* Floating Feedback Toast */}
            <AnimatePresence>
                {toastMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -40, x: '-50%' }}
                        animate={{ opacity: 1, y: 0, x: '-50%' }}
                        exit={{ opacity: 0, y: -20, x: '-50%', transition: { duration: 0.2, ease: 'easeIn' } }}
                        transition={{ duration: 0.3, ease: [0.18, 0.89, 0.32, 1.28] }}
                        className="fixed top-20 left-1/2 z-50 flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-[#2C2C2E] border border-gray-100 dark:border-[#3A3A3C] shadow-[0_4px_12px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_12px_rgba(0,0,0,0.3)] rounded-full whitespace-nowrap"
                    >
                        <div className="w-5 h-5 rounded-full bg-green-500 flex items-center justify-center flex-shrink-0">
                            <Check className="w-3 h-3 text-white" strokeWidth={3} />
                        </div>
                        <span className="text-[14px] font-medium text-black dark:text-white">{toastMessage}</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Buttons */}
            <motion.button
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.1 }}
                onClick={handleCopy}
                className="p-1.5 rounded-lg transition-colors hover:text-black dark:hover:text-white outline-none tap-highlight-transparent"
                title="Copia testo"
            >
                <Copy className="w-[18px] h-[18px]" />
            </motion.button>

            <motion.button
                whileTap={{ scale: 1.2 }}
                transition={reactionSpring}
                onClick={() => handleReaction('like')}
                className={`p-1.5 rounded-lg transition-colors outline-none tap-highlight-transparent ${reaction === 'like' ? 'text-black dark:text-white' : 'hover:text-black dark:hover:text-white'}`}
                title="Ottima risposta"
            >
                <ThumbsUp className="w-[18px] h-[18px]" fill={reaction === 'like' ? 'currentColor' : 'none'} />
            </motion.button>

            <motion.button
                whileTap={{ scale: 1.2 }}
                transition={reactionSpring}
                onClick={() => handleReaction('dislike')}
                className={`p-1.5 rounded-lg transition-colors outline-none tap-highlight-transparent ${reaction === 'dislike' ? 'text-black dark:text-white' : 'hover:text-black dark:hover:text-white'}`}
                title="Risposta scadente"
            >
                <ThumbsDown className="w-[18px] h-[18px]" fill={reaction === 'dislike' ? 'currentColor' : 'none'} />
            </motion.button>

            <motion.button
                whileTap={{ scale: 0.85 }}
                transition={{ duration: 0.1 }}
                onClick={handleShare}
                className="p-1.5 rounded-lg transition-colors outline-none tap-highlight-transparent hover:text-black dark:hover:text-white"
                title="Condividi"
            >
                <IosShareIcon className="w-[18px] h-[18px]" />
            </motion.button>

            {/* Mount ShareSheet portal when open */}
            {isShareOpen && <ShareSheet text={text} onClose={() => setIsShareOpen(false)} />}

            {/* Mount Feedback Modal when open */}
            <FeedbackModal isOpen={feedbackModalState.isOpen} type={feedbackModalState.type} messageContent={text} onClose={() => setFeedbackModalState(prev => ({ ...prev, isOpen: false }))} />
        </div>
    );
}

const WELCOME_MESSAGE = {
    id: 'welcome-msg',
    role: 'assistant' as const,
    parts: [{ type: 'text' as const, text: "Ciao! Sono il tuo **Assistente 360°**. Sono qui per aiutarti a ottimizzare la preparazione, analizzare i tuoi errori e creare il piano di studio perfetto. Da cosa vogliamo iniziare oggi?" }],
};

const SUGGESTIONS = [
    "Come organizzo lo studio?",
    "Simula un quiz di logica",
    "Analizza i miei punti deboli",
    "Scrivi un piano settimanale"
];

// =============================================
// Outer wrapper: loads saved messages then mounts the inner chat
// =============================================
export default function AiChatInterface() {
    const { user } = useAuth();
    const [savedMessages, setSavedMessages] = useState<any[] | null>(null); // null = loading

    useEffect(() => {
        if (!user?.id) {
            setSavedMessages([WELCOME_MESSAGE]);
            return;
        }
        (async () => {
            try {
                const { data, error } = await supabase
                    .from('ai_chat_messages')
                    .select('messages')
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (error || !data?.messages || !Array.isArray(data.messages) || data.messages.length === 0) {
                    setSavedMessages([WELCOME_MESSAGE]);
                } else {
                    setSavedMessages(data.messages);
                }
            } catch {
                setSavedMessages([WELCOME_MESSAGE]);
            }
        })();
    }, [user?.id]);

    // Show loading state while fetching saved messages
    if (savedMessages === null) {
        return (
            <div className="flex flex-col h-full w-full max-w-4xl mx-auto items-center justify-center">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-inner animate-pulse">
                    <Sparkles className="w-5 h-5 text-white" />
                </div>
                <p className="mt-3 text-sm text-black/50 dark:text-white/50">Caricamento chat...</p>
            </div>
        );
    }

    // Only mount the inner chat AFTER messages are loaded
    return <AiChatInner key={user?.id || 'anon'} initialMessages={savedMessages} />;
}

// =============================================
// Inner chat: useChat is initialized once with the correct messages
// =============================================
function AiChatInner({ initialMessages }: { initialMessages: any[] }) {
    const { user } = useAuth();
    const navigate = useNavigate();
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [inputValue, setInputValue] = useState('');
    const [autoScroll, setAutoScroll] = useState(true);
    const [showMenu, setShowMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    // Close menu on outside click
    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
                setShowMenu(false);
            }
        };
        if (showMenu) document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [showMenu]);

    const { messages, sendMessage, status, error, setMessages } = useChat({
        transport: new DefaultChatTransport({
            api: '/api/chat',
            body: { userId: user?.id },
        }),
        messages: initialMessages,
        onFinish: async ({ messages: finishedMessages }) => {
            if (!user?.id || finishedMessages.length <= 1) return;
            try {
                const toSave = finishedMessages.map((m: any) => ({
                    id: m.id,
                    role: m.role,
                    parts: m.parts?.filter((p: any) => p.type === 'text') || [],
                }));
                await supabase
                    .from('ai_chat_messages')
                    .upsert({ user_id: user.id, messages: toSave, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });
            } catch (e) {
                console.error('Failed to save chat history:', e);
            }
        },
    });

    const isStreaming = status === 'streaming' || status === 'submitted';

    const handleNewChat = async () => {
        if (user?.id) {
            await supabase.from('ai_chat_messages').delete().eq('user_id', user.id);
        }
        setMessages([WELCOME_MESSAGE]);
    };

    const handleScroll = () => {
        if (!scrollContainerRef.current) return;
        const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
        const isAtBottom = scrollHeight - scrollTop - clientHeight < 50;
        setAutoScroll(isAtBottom);
    };

    const scrollToBottom = () => {
        if (autoScroll) {
            // Using instant for streaming text so it doesn't jitter, smooth for new messages
            messagesEndRef.current?.scrollIntoView({ behavior: 'auto' });
        }
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, autoScroll]);

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        const text = inputValue.trim();
        if (!text || isStreaming) return;
        setInputValue('');
        await sendMessage({ text });
    };

    const getMessageText = (m: any): string => {
        if (m.parts) {
            return m.parts
                .filter((p: any) => p.type === 'text')
                .map((p: any) => p.text)
                .join('');
        }
        return m.content || '';
    };

    const getToolInvocations = (m: any): any[] => {
        if (m.parts) {
            return m.parts.filter((p: any) => p.type === 'tool-invocation');
        }
        return m.toolInvocations || [];
    };

    return (
        <div className="relative flex flex-col h-full w-full max-w-3xl mx-auto overflow-hidden bg-white dark:bg-black text-black dark:text-white font-sans">

            {/* Header */}
            <div className="flex-none p-4 flex items-center gap-3 z-10">
                <button
                    onClick={() => navigate(-1)}
                    className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#1E1E1E] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] flex items-center justify-center transition-colors"
                    title="Indietro"
                >
                    <ArrowLeft className="w-4 h-4 text-gray-500 dark:text-gray-400" />
                </button>
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-gray-100 to-gray-200 dark:from-[#1E1E1E] dark:to-[#2A2A2A] border border-gray-200 dark:border-[#333] flex items-center justify-center shadow-inner">
                    <Sparkles className="w-5 h-5 text-black dark:text-white" />
                </div>
                <div className="flex-1">
                    <h2 className="font-semibold text-[17px] text-black dark:text-white tracking-tight">AI Coach</h2>
                    <p className="text-xs text-gray-500 dark:text-[#8E8E93] font-medium">Sempre pronto ad aiutarti</p>
                </div>
                <div className="relative" ref={menuRef}>
                    <button
                        onClick={() => setShowMenu(!showMenu)}
                        className="w-9 h-9 rounded-xl bg-gray-100 dark:bg-[#1E1E1E] hover:bg-gray-200 dark:hover:bg-[#2A2A2A] active:scale-95 flex items-center justify-center transition-all"
                        title="Menu"
                    >
                        <MoreVertical className="w-4 h-4 text-gray-500 dark:text-white" />
                    </button>

                    {/* Dropdown Menu */}
                    {showMenu && (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: -4 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-11 w-48 rounded-[14px] bg-white dark:bg-[#1E1E1E] border border-gray-200 dark:border-[#333] shadow-lg z-50 overflow-hidden"
                        >
                            <button
                                onClick={() => { handleNewChat(); setShowMenu(false); }}
                                disabled={isStreaming}
                                className="w-full flex items-center gap-3 px-4 py-3 text-sm text-black dark:text-white hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors disabled:opacity-50"
                            >
                                <Trash2 className="w-4 h-4" />
                                Nuova Chat
                            </button>
                        </motion.div>
                    )}
                </div>
            </div>

            {/* Messages Area */}
            <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-4 pb-32 pt-2 space-y-6"
            >
                <AnimatePresence initial={false}>
                    {(messages || []).map((m: any) => {
                        const textContent = getMessageText(m);
                        const toolCalls = getToolInvocations(m);

                        return (
                            <motion.div
                                key={m.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.3, ease: [0.2, 0.8, 0.2, 1] }}
                                className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                {/* Assistant Avatar (Optional - keeping minimal per Skitla ref) */}
                                {m.role === 'assistant' && (
                                    <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1E1E1E] flex items-center justify-center flex-shrink-0 mt-1 border border-gray-200 dark:border-[#333]">
                                        <Bot className="w-4 h-4 text-black dark:text-white" />
                                    </div>
                                )}

                                <div className={`max-w-[85%] ${m.role === 'user'
                                    ? 'bg-[#0095FF] text-white rounded-[20px] rounded-br-[12px] px-4 py-3'
                                    : 'bg-transparent text-black dark:text-white px-2 py-1'
                                    }`}>
                                    {textContent && (
                                        <div className="prose prose-sm dark:prose-invert max-w-none prose-p:leading-relaxed prose-headings:mt-3 prose-headings:mb-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0">
                                            <ReactMarkdown>{textContent}</ReactMarkdown>
                                        </div>
                                    )}

                                    {/* AI Action Row */}
                                    {m.role === 'assistant' && m.id !== 'welcome-msg' && !isStreaming && textContent && (
                                        <MessageActions text={textContent} />
                                    )}

                                    {/* Render UI Components from tool calls */}
                                    {toolCalls.map((toolPart: any) => {
                                        const toolInvocation = toolPart.toolInvocation || toolPart;
                                        const toolCallId = toolInvocation.toolCallId || toolPart.toolCallId;

                                        if (toolInvocation.state === 'call' || !('result' in toolInvocation)) {
                                            return (
                                                <motion.div
                                                    initial={{ scale: 0.95, opacity: 0 }}
                                                    animate={{ scale: 1, opacity: 1 }}
                                                    key={toolCallId}
                                                    className="mt-3 p-3 rounded-[16px] bg-gray-100 dark:bg-[#111111] text-gray-500 dark:text-[#8E8E93] text-xs font-medium flex items-center gap-3 border border-gray-200 dark:border-[#2A2A2A] max-w-fit"
                                                >
                                                    <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-[#666] border-t-black dark:border-t-white animate-spin"></div>
                                                    Considerando i dati...
                                                </motion.div>
                                            );
                                        }

                                        const resultStr = toolInvocation.result;
                                        if (!resultStr) return null;

                                        try {
                                            const result = typeof resultStr === 'string' ? JSON.parse(resultStr) : resultStr;

                                            if (toolInvocation.toolName === 'create_study_sessions' && result.rendered_ui === 'action_plan_card') {
                                                return (
                                                    <div key={toolCallId} className="mt-4 p-4 rounded-[20px] border border-gray-200 dark:border-[#2A2A2A] bg-gray-50 dark:bg-[#111111]">
                                                        <h4 className="font-semibold text-sm mb-3 text-black dark:text-white uppercase tracking-wider">{result.goal}</h4>
                                                        <div className="space-y-2">
                                                            {result.sessions.map((session: any, idx: number) => (
                                                                <div key={idx} className="flex items-center justify-between p-3 rounded-[16px] bg-white dark:bg-[#1E1E1E] hover:bg-gray-100 dark:hover:bg-[#2A2A2A] transition-colors">
                                                                    <div>
                                                                        <div className="font-medium text-black dark:text-white text-sm">{session.title}</div>
                                                                        <div className="text-xs text-gray-500 dark:text-[#8E8E93] mt-0.5">{session.duration_min} min • {session.mode === 'sim' ? 'Simulazione' : 'Pratica'}</div>
                                                                    </div>
                                                                    <Button onClick={() => alert('Feature coming soon')} size="sm" variant="primary" className="rounded-full bg-black dark:bg-white text-white dark:text-black hover:bg-gray-800 dark:hover:bg-slate-200">
                                                                        {session.cta_text || 'Avvia'}
                                                                    </Button>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                );
                                            }
                                        } catch (e) {
                                            console.error("Format error in tool result", e);
                                            return null;
                                        }

                                        return null;
                                    })}
                                </div>
                            </motion.div>
                        );
                    })}

                </AnimatePresence>

                {/* Loading indicator */}
                {isStreaming && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex gap-3 justify-start"
                    >
                        <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-[#1E1E1E] flex items-center justify-center flex-shrink-0 mt-1 border border-gray-200 dark:border-[#333]">
                            <Bot className="w-4 h-4 text-black dark:text-white" />
                        </div>
                        <div className="bg-transparent px-2 py-3 flex items-center gap-2">
                            <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-[#666] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-[#666] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                            <span className="w-1.5 h-1.5 bg-gray-300 dark:bg-[#666] rounded-full animate-bounce"></span>
                        </div>
                    </motion.div>
                )}

                {/* Error display */}
                {error && (
                    <div className="flex gap-3 justify-start">
                        <div className="max-w-[85%] rounded-[20px] px-5 py-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800/50 text-sm">
                            ⚠️ Errore: {error.message || 'Si è verificato un errore. Riprova.'}
                        </div>
                    </div>
                )}

                <div ref={messagesEndRef} className="h-4" />
            </div>

            {/* Input Area (Floating Pill) */}
            <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-white via-white/90 dark:from-black dark:via-black/90 to-transparent pt-12 z-20">

                {/* Suggestion Chips */}
                {messages.length <= 1 && (
                    <div className="flex overflow-x-auto gap-2 pb-4 no-scrollbar scroll-smooth [-webkit-overflow-scrolling:touch] max-w-3xl mx-auto px-1">
                        {SUGGESTIONS.map((suggestion, idx) => (
                            <motion.button
                                key={idx}
                                whileHover={{ scale: 0.98 }}
                                whileTap={{ scale: 0.95 }}
                                onClick={() => {
                                    setInputValue('');
                                    sendMessage({ text: suggestion });
                                }}
                                className="flex-none whitespace-nowrap px-4 py-2.5 rounded-[12px] bg-gray-100 dark:bg-[#111111] border border-gray-200 dark:border-[#2A2A2A] text-sm text-black dark:text-white hover:bg-gray-200 dark:hover:bg-[#1E1E1E] transition-colors"
                            >
                                {suggestion}
                            </motion.button>
                        ))}
                    </div>
                )}

                <form onSubmit={handleSend} className="relative flex items-center max-w-3xl mx-auto group">
                    <input
                        className="w-full bg-gray-100 dark:bg-[#1E1E1E] text-black dark:text-white rounded-[26px] h-[52px] pl-6 pr-24 outline-none focus:ring-1 focus:ring-black/10 dark:focus:ring-white/20 transition-all border border-gray-200 dark:border-[#2A2A2A] focus:border-gray-300 dark:focus:border-[#444] placeholder:text-gray-400 dark:placeholder:text-[#666666] text-[15px] shadow-sm"
                        value={inputValue}
                        placeholder="Chiedi un consiglio o come migliorare..."
                        onChange={(e) => setInputValue(e.target.value)}
                        disabled={isStreaming}
                    />
                    <div className="absolute right-2 flex items-center gap-1">
                        <motion.button
                            type="button"
                            whileHover={{ scale: 0.96 }}
                            whileTap={{ scale: 0.9 }}
                            className="w-10 h-10 rounded-full flex items-center justify-center text-gray-400 dark:text-[#8E8E93] hover:text-black dark:hover:text-white transition-colors"
                        >
                            <Mic className="w-5 h-5" />
                        </motion.button>

                        <motion.button
                            type="submit"
                            disabled={isStreaming || !inputValue.trim()}
                            whileHover={{ scale: 0.96 }}
                            whileTap={{ scale: 0.9 }}
                            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all flex-shrink-0 ${inputValue.trim()
                                ? 'bg-[#00B1FF] text-white hover:bg-[#009ee0]'
                                : 'bg-gray-300 dark:bg-[#3A3A3C] text-white dark:text-[#8E8E93] cursor-not-allowed'
                                }`}
                        >
                            <ArrowUp className="w-5 h-5" strokeWidth={2.5} />
                        </motion.button>
                    </div>
                </form>
            </div>
        </div>
    );
}
