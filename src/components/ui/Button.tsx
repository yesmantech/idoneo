import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost';
    fullWidth?: boolean;
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', fullWidth = false, isLoading, icon, children, disabled, ...props }, ref) => {

        const baseStyles = "h-[56px] rounded-pill font-bold text-[16px] inline-flex items-center justify-center gap-2 transition-all duration-300 ease-ios disabled:opacity-80 disabled:cursor-not-allowed";

        const variants = {
            primary: "bg-brand-cyan text-white shadow-[0_4px_12px_rgba(6,214,211,0.25)] hover:bg-[#05bfbc] hover:scale-[1.02] hover:shadow-[0_6px_16px_rgba(6,214,211,0.35)] active:scale-[0.98]",
            secondary: "bg-canvas-light text-text-primary hover:bg-[#E5E7EB] hover:scale-[1.02] active:scale-[0.98]",
            ghost: "bg-transparent text-text-secondary hover:text-brand-blue hover:bg-canvas-light/50",
        };

        const widthStyles = fullWidth ? "w-full" : "w-auto px-8";

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], widthStyles, className)}
                disabled={isLoading || disabled}
                {...props}
            >
                {isLoading ? (
                    <div className="w-6 h-6 border-[3px] border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                    <>
                        {icon && <span className="flex-shrink-0">{icon}</span>}
                        {children}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";
