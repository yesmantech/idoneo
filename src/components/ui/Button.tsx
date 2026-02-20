import React from 'react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    fullWidth?: boolean;
    isLoading?: boolean;
    icon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size = 'md', fullWidth = false, isLoading, icon, children, disabled, ...props }, ref) => {

        const baseStyles = "relative overflow-hidden font-bold inline-flex items-center justify-center gap-2 transition-all duration-300 ease-ios active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none select-none";

        const sizes = {
            sm: "h-[40px] px-4 text-[14px] rounded-xl",
            md: "h-[56px] px-8 text-[16px] rounded-2xl",
            lg: "h-[64px] px-10 text-[18px] rounded-[20px]",
        };

        const variants = {
            primary: "bg-brand-cyan text-white shadow-lg shadow-brand-cyan/20 hover:shadow-brand-cyan/30 hover:-translate-y-0.5",
            secondary: "bg-canvas-light dark:bg-slate-800 text-text-primary dark:text-white hover:bg-[#E5E7EB] dark:hover:bg-slate-700",
            outline: "bg-transparent border-2 border-slate-200 dark:border-slate-700 text-text-primary dark:text-white hover:border-brand-blue hover:text-brand-blue",
            ghost: "bg-transparent text-text-secondary hover:text-brand-blue hover:bg-canvas-light/50 dark:hover:bg-slate-800/50",
        };

        const widthStyles = fullWidth ? "w-full" : "w-auto";

        return (
            <button
                ref={ref}
                className={cn(baseStyles, sizes[size], variants[variant], widthStyles, className)}
                disabled={isLoading || disabled}
                {...props}
            >


                {isLoading ? (
                    <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : (
                    <>
                        {icon && <span className="flex-shrink-0 relative z-10">{icon}</span>}
                        <span className="relative z-10">{children}</span>
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = "Button";
