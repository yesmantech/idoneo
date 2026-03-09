import React, { useState } from 'react';
import { User } from 'lucide-react';

interface UserAvatarProps {
    src?: string | null;
    name?: string;
    alt?: string;
    size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
    className?: string;
}

export const UserAvatar: React.FC<UserAvatarProps> = ({
    src,
    name = 'Utente',
    alt,
    size = 'md',
    className = ''
}) => {
    const [imgError, setImgError] = useState(false);

    // Size mappings
    const sizeClasses = {
        sm: 'w-8 h-8',
        md: 'w-10 h-10',
        lg: 'w-12 h-12',
        xl: 'w-16 h-16',
        '2xl': 'w-20 h-20',
    };

    const iconSizes = {
        sm: 'w-4 h-4',
        md: 'w-5 h-5',
        lg: 'w-6 h-6',
        xl: 'w-8 h-8',
        '2xl': 'w-10 h-10',
    };

    const emojiSizes = {
        sm: 'text-[14px]',
        md: 'text-[18px]',
        lg: 'text-[22px]',
        xl: 'text-[30px]',
        '2xl': 'text-[38px]',
    };

    // Consistent premium gradient
    const gradient = 'bg-gradient-to-br from-slate-100 to-slate-200 dark:from-slate-700 dark:to-slate-600';

    // Handle emoji avatar format: "emoji:😀:#007AFF"
    if (src && src.startsWith('emoji:')) {
        const parts = src.split(':');
        const emoji = parts[1] || '😀';
        const bgColor = parts.slice(2).join(':') || '#007AFF';
        return (
            <div
                className={`relative rounded-full overflow-hidden flex items-center justify-center ${sizeClasses[size]} ${className}`}
                style={{ backgroundColor: bgColor }}
            >
                <span className={emojiSizes[size]} style={{ lineHeight: 1 }}>{emoji}</span>
            </div>
        );
    }

    if (src && !imgError) {
        return (
            <div className={`relative rounded-full overflow-hidden bg-slate-100 dark:bg-[#111] ${sizeClasses[size]} ${className}`}>
                <img
                    src={src}
                    alt={alt || name}
                    className="w-full h-full object-cover"
                    onError={() => setImgError(true)}
                />
            </div>
        );
    }

    return (
        <div
            className={`
                flex items-center justify-center rounded-full text-slate-400 dark:text-slate-300 shadow-inner
                ${gradient} 
                ${sizeClasses[size]} 
                ${className}
            `}
        >
            <User className={`${iconSizes[size]}`} />
        </div>
    );
};
