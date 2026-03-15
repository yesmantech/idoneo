import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { Keyboard } from '@capacitor/keyboard';

/**
 * Tracks keyboard height using two sources for maximum responsiveness:
 * 
 * 1. Capacitor Keyboard plugin events (keyboardWillShow/Hide) — fires BEFORE
 *    the keyboard animation starts, giving us the height instantly.
 * 2. MutationObserver on body.style.height as fallback (resize: 'body' mode
 *    sets this after animation completes).
 * 
 * The CSS transition on the consumer matches the iOS keyboard animation
 * (250ms ease-out), so the UI slides in perfect sync.
 */
export function useWindowHeight(): number {
    const [keyboardHeight, setKeyboardHeight] = useState(0);

    useEffect(() => {
        if (!Capacitor.isNativePlatform()) return;

        // --- Primary: Capacitor Keyboard events (instant, fires before animation) ---
        const showListener = Keyboard.addListener('keyboardWillShow', (info) => {
            setKeyboardHeight(info.keyboardHeight);
        });

        const hideListener = Keyboard.addListener('keyboardWillHide', () => {
            setKeyboardHeight(0);
        });

        // --- Fallback: MutationObserver on body.style.height ---
        // (resize: 'body' mode sets body.style.height after keyboard animation)
        const fullHeight = window.innerHeight;
        const observer = new MutationObserver(() => {
            const bodyH = document.body.style.height;
            if (bodyH && bodyH.endsWith('px')) {
                const kbH = Math.max(0, fullHeight - parseFloat(bodyH));
                setKeyboardHeight(prev => prev === 0 ? kbH : prev); // Only use if no event fired
            } else {
                // body.style.height was cleared — keyboard closed
                setKeyboardHeight(prev => prev > 0 ? 0 : prev);
            }
        });

        observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['style'],
        });

        return () => {
            showListener.then(l => l.remove());
            hideListener.then(l => l.remove());
            observer.disconnect();
        };
    }, []);

    return keyboardHeight;
}
