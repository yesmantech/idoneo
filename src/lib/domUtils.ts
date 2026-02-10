/**
 * Utility functions for DOM manipulation
 */

export const removeBootLoader = () => {
    const bootLoader = document.getElementById('boot-loader');
    if (bootLoader) {
        bootLoader.style.opacity = '0';
        setTimeout(() => {
            if (bootLoader.parentNode) {
                bootLoader.parentNode.removeChild(bootLoader);
            }
        }, 500);
    }
};
