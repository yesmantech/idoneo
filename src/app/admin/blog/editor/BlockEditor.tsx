import React from 'react';
import { ContentBlock } from '@/types/blog';

// ================== TYPES ==================

interface BlockEditorProps {
    content: ContentBlock[];
    onAdd: (type: ContentBlock['type']) => void;
    onUpdate: (index: number, updates: Partial<ContentBlock>) => void;
    onRemove: (index: number) => void;
    onMove: (index: number, direction: 'up' | 'down') => void;
}

interface BlockWrapperProps {
    key?: React.Key;
    index: number;
    type: string;
    isFirst: boolean;
    isLast: boolean;
    onMove: (index: number, direction: 'up' | 'down') => void;
    onRemove: (index: number) => void;
    children: React.ReactNode;
}

// ================== BLOCK WRAPPER ==================

function BlockWrapper({ index, type, isFirst, isLast, onMove, onRemove, children }: BlockWrapperProps) {
    return (
        <div className="border border-slate-200 dark:border-slate-700 rounded-lg p-4 relative group">
            <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                    onClick={() => onMove(index, 'up')}
                    disabled={isFirst}
                    className="p-1 text-slate-400 hover:text-[var(--foreground)] disabled:opacity-30"
                    aria-label="Move up"
                >
                    ↑
                </button>
                <button
                    onClick={() => onMove(index, 'down')}
                    disabled={isLast}
                    className="p-1 text-slate-400 hover:text-[var(--foreground)] disabled:opacity-30"
                    aria-label="Move down"
                >
                    ↓
                </button>
                <button
                    onClick={() => onRemove(index)}
                    className="p-1 text-rose-400 hover:text-rose-600"
                    aria-label="Remove block"
                >
                    ✕
                </button>
            </div>
            <div className="text-xs font-bold text-[var(--foreground)] opacity-30 uppercase mb-2">{type}</div>
            {children}
        </div>
    );
}

// ================== INDIVIDUAL BLOCK EDITORS ==================

interface ParagraphBlockProps {
    text: string;
    onChange: (text: string) => void;
}

function ParagraphBlock({ text, onChange }: ParagraphBlockProps) {
    return (
        <textarea
            value={text}
            onChange={(e) => onChange(e.target.value)}
            placeholder="Scrivi il testo..."
            className="w-full p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-[var(--foreground)] opacity-80 min-h-[100px] resize-y focus:outline-none focus:ring-1 focus:ring-emerald-500/50"
        />
    );
}

interface HeadingBlockProps {
    level: 2 | 3;
    text: string;
    onChangeLevel: (level: 2 | 3) => void;
    onChangeText: (text: string) => void;
}

function HeadingBlock({ level, text, onChangeLevel, onChangeText }: HeadingBlockProps) {
    return (
        <div className="flex gap-2">
            <select
                value={level}
                onChange={(e) => onChangeLevel(parseInt(e.target.value) as 2 | 3)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[var(--foreground)]"
            >
                <option value={2}>H2</option>
                <option value={3}>H3</option>
            </select>
            <input
                type="text"
                value={text}
                onChange={(e) => onChangeText(e.target.value)}
                placeholder="Titolo sezione..."
                className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-bold text-[var(--foreground)] focus:outline-none"
            />
        </div>
    );
}

interface ListBlockProps {
    ordered: boolean;
    items: string[];
    onChangeOrdered: (ordered: boolean) => void;
    onChangeItems: (items: string[]) => void;
}

function ListBlock({ ordered, items, onChangeOrdered, onChangeItems }: ListBlockProps) {
    const updateItem = (itemIdx: number, value: string) => {
        const newItems = [...items];
        newItems[itemIdx] = value;
        onChangeItems(newItems);
    };

    const removeItem = (itemIdx: number) => {
        const newItems = items.filter((_, i) => i !== itemIdx);
        onChangeItems(newItems.length > 0 ? newItems : ['']);
    };

    const addItem = () => {
        onChangeItems([...items, '']);
    };

    return (
        <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
                <input
                    type="checkbox"
                    checked={ordered}
                    onChange={(e) => onChangeOrdered(e.target.checked)}
                    className="rounded"
                />
                Lista numerata
            </label>
            {items.map((item, itemIdx) => (
                <div key={itemIdx} className="flex gap-2">
                    <span className="text-[var(--foreground)] opacity-30 pt-2 w-6 text-right">
                        {ordered ? `${itemIdx + 1}.` : '•'}
                    </span>
                    <input
                        type="text"
                        value={item}
                        onChange={(e) => updateItem(itemIdx, e.target.value)}
                        placeholder="Elemento lista..."
                        className="flex-1 p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[var(--foreground)]"
                    />
                    <button
                        onClick={() => removeItem(itemIdx)}
                        className="p-2 text-rose-400 hover:text-rose-600"
                        aria-label="Remove item"
                    >
                        ✕
                    </button>
                </div>
            ))}
            <button
                onClick={addItem}
                className="text-sm text-emerald-600 hover:text-emerald-700"
            >
                + Aggiungi elemento
            </button>
        </div>
    );
}

interface CalloutBlockProps {
    variant: 'tip' | 'warning' | 'note' | 'example';
    title: string;
    text: string;
    onChangeVariant: (variant: 'tip' | 'warning' | 'note' | 'example') => void;
    onChangeTitle: (title: string) => void;
    onChangeText: (text: string) => void;
}

function CalloutBlock({ variant, title, text, onChangeVariant, onChangeTitle, onChangeText }: CalloutBlockProps) {
    return (
        <div className="space-y-2">
            <select
                value={variant}
                onChange={(e) => onChangeVariant(e.target.value as typeof variant)}
                className="px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[var(--foreground)]"
            >
                <option value="tip">💡 Tip</option>
                <option value="warning">⚠️ Warning</option>
                <option value="note">📝 Nota</option>
                <option value="example">📌 Esempio</option>
            </select>
            <input
                type="text"
                value={title}
                onChange={(e) => onChangeTitle(e.target.value)}
                placeholder="Titolo callout..."
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded font-medium text-[var(--foreground)]"
            />
            <textarea
                value={text}
                onChange={(e) => onChangeText(e.target.value)}
                placeholder="Contenuto callout..."
                className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[var(--foreground)] opacity-80"
            />
        </div>
    );
}

interface FAQBlockProps {
    items: { question: string; answer: string }[];
    onChangeItems: (items: { question: string; answer: string }[]) => void;
}

function FAQBlock({ items, onChangeItems }: FAQBlockProps) {
    const updateItem = (itemIdx: number, field: 'question' | 'answer', value: string) => {
        const newItems = [...items];
        newItems[itemIdx] = { ...newItems[itemIdx], [field]: value };
        onChangeItems(newItems);
    };

    const removeItem = (itemIdx: number) => {
        const newItems = items.filter((_, i) => i !== itemIdx);
        onChangeItems(newItems.length > 0 ? newItems : [{ question: '', answer: '' }]);
    };

    const addItem = () => {
        onChangeItems([...items, { question: '', answer: '' }]);
    };

    return (
        <div className="space-y-4">
            {items.map((item, itemIdx) => (
                <div key={itemIdx} className="border border-slate-100 dark:border-slate-800 rounded-lg p-3 bg-slate-50 dark:bg-slate-900/50">
                    <div className="flex justify-between items-start mb-2">
                        <span className="text-xs font-bold text-[var(--foreground)] opacity-30">FAQ #{itemIdx + 1}</span>
                        <button
                            onClick={() => removeItem(itemIdx)}
                            className="text-rose-400 hover:text-rose-600 text-sm"
                        >
                            ✕ Rimuovi
                        </button>
                    </div>
                    <input
                        type="text"
                        value={item.question}
                        onChange={(e) => updateItem(itemIdx, 'question', e.target.value)}
                        placeholder="Domanda..."
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded mb-2 font-medium text-[var(--foreground)]"
                    />
                    <textarea
                        value={item.answer}
                        onChange={(e) => updateItem(itemIdx, 'answer', e.target.value)}
                        placeholder="Risposta..."
                        className="w-full p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded min-h-[60px] text-[var(--foreground)] opacity-80"
                    />
                </div>
            ))}
            <button
                onClick={addItem}
                className="text-sm text-emerald-600 hover:text-emerald-700"
            >
                + Aggiungi domanda
            </button>
        </div>
    );
}

interface CTABlockProps {
    title: string;
    description: string;
    buttonText: string;
    buttonUrl: string;
    onChange: (field: 'title' | 'description' | 'buttonText' | 'buttonUrl', value: string) => void;
}

function CTABlock({ title, description, buttonText, buttonUrl, onChange }: CTABlockProps) {
    return (
        <div className="grid grid-cols-2 gap-2">
            <input
                type="text"
                value={title}
                onChange={(e) => onChange('title', e.target.value)}
                placeholder="Titolo CTA..."
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[var(--foreground)]"
            />
            <input
                type="text"
                value={buttonText}
                onChange={(e) => onChange('buttonText', e.target.value)}
                placeholder="Testo pulsante..."
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[var(--foreground)]"
            />
            <input
                type="text"
                value={description}
                onChange={(e) => onChange('description', e.target.value)}
                placeholder="Descrizione..."
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[var(--foreground)] opacity-80"
            />
            <input
                type="text"
                value={buttonUrl}
                onChange={(e) => onChange('buttonUrl', e.target.value)}
                placeholder="URL pulsante..."
                className="p-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded text-[var(--foreground)] text-xs"
            />
        </div>
    );
}

// ================== BLOCK RENDERER ==================

interface BlockRendererProps {
    block: ContentBlock;
    index: number;
    onUpdate: (updates: Partial<ContentBlock>) => void;
}

function BlockRenderer({ block, index, onUpdate }: BlockRendererProps) {
    switch (block.type) {
        case 'paragraph':
            return (
                <ParagraphBlock
                    text={block.text}
                    onChange={(text) => onUpdate({ text })}
                />
            );
        case 'heading':
            return (
                <HeadingBlock
                    level={block.level}
                    text={block.text}
                    onChangeLevel={(level) => onUpdate({ level })}
                    onChangeText={(text) => onUpdate({ text })}
                />
            );
        case 'list':
            return (
                <ListBlock
                    ordered={block.ordered}
                    items={block.items}
                    onChangeOrdered={(ordered) => onUpdate({ ordered })}
                    onChangeItems={(items) => onUpdate({ items })}
                />
            );
        case 'callout':
            return (
                <CalloutBlock
                    variant={block.variant}
                    title={block.title}
                    text={block.text}
                    onChangeVariant={(variant) => onUpdate({ variant })}
                    onChangeTitle={(title) => onUpdate({ title })}
                    onChangeText={(text) => onUpdate({ text })}
                />
            );
        case 'faq':
            return (
                <FAQBlock
                    items={block.items}
                    onChangeItems={(items) => onUpdate({ items })}
                />
            );
        case 'cta':
            return (
                <CTABlock
                    title={block.title}
                    description={block.description}
                    buttonText={block.buttonText}
                    buttonUrl={block.buttonUrl}
                    onChange={(field, value) => onUpdate({ [field]: value })}
                />
            );
        default:
            return <div className="text-slate-400">Blocco non supportato</div>;
    }
}

// ================== MAIN BLOCK EDITOR ==================

const BLOCK_TYPES: { type: ContentBlock['type']; label: string }[] = [
    { type: 'paragraph', label: '+ Paragrafo' },
    { type: 'heading', label: '+ Titolo' },
    { type: 'list', label: '+ Lista' },
    { type: 'callout', label: '+ Callout' },
    { type: 'faq', label: '+ FAQ' },
    { type: 'cta', label: '+ CTA' },
];

export default function BlockEditor({ content, onAdd, onUpdate, onRemove, onMove }: BlockEditorProps) {
    return (
        <div className="bg-[var(--card)] rounded-xl border border-[var(--card-border)] p-6 space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-lg text-[var(--foreground)]">Contenuto</h2>
                <div className="flex gap-2">
                    {BLOCK_TYPES.map(({ type, label }) => (
                        <button
                            key={type}
                            onClick={() => onAdd(type)}
                            className="px-3 py-1 text-sm bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-[var(--foreground)] opacity-70 hover:opacity-100 rounded transition-colors"
                        >
                            {label}
                        </button>
                    ))}
                </div>
            </div>

            {content.length === 0 ? (
                <div className="text-center py-12 text-slate-400">
                    Clicca su un pulsante sopra per aggiungere contenuto
                </div>
            ) : (
                <div className="space-y-4">
                    {content.map((block, idx) => (
                        <BlockWrapper
                            key={idx}
                            index={idx}
                            type={block.type}
                            isFirst={idx === 0}
                            isLast={idx === content.length - 1}
                            onMove={onMove}
                            onRemove={onRemove}
                        >
                            <BlockRenderer
                                block={block}
                                index={idx}
                                onUpdate={(updates) => onUpdate(idx, updates)}
                            />
                        </BlockWrapper>
                    ))}
                </div>
            )}
        </div>
    );
}
