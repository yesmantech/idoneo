import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: boolean;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ className, error, ...props }, ref) => {
        return (
            <input
                ref={ref}
                className={cn(
                    "w-full h-[56px] px-5 rounded-input bg-canvas-light border-none text-base font-medium text-text-primary placeholder:text-text-tertiary outline-none transition-all duration-300 ease-ios",
                    "focus:shadow-[0_0_0_2px_#06D6D3] focus:bg-white",
                    error && "bg-semantic-errorBg/10 focus:shadow-[0_0_0_2px_#FF3B30]",
                    className
                )}
                {...props}
            />
        );
    }
);

Input.displayName = "Input";
