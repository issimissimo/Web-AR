/**
 * ColorManager - Manages UI color states with ability to store and restore colors
 * Simple functions with module-level state - can be imported and used from any module
 */

const originalColors = new Map();
const colorHistory = [];

/**
 * Store all original colors from CSS custom properties
 * Automatically detects all --color-* properties
 */
export const storeColors = () => {
    const root = document.documentElement;
    const computedStyle = getComputedStyle(root);

    // Iterate through all computed style properties
    for (let i = 0; i < computedStyle.length; i++) {
        const prop = computedStyle[i];
        if (prop.startsWith('--color-')) {
            const value = computedStyle.getPropertyValue(prop).trim();
            originalColors.set(prop, value);
        }
    }

    return Object.fromEntries(originalColors);
};

/**
 * Set new UI colors
 * @param {Object[]} colors - Array of color objects with properties: {colorName, colorValue, delay?}
 * @returns {Promise} - Resolves when all colors are set
 */
export const setColors = (colors = []) => {
    return new Promise((resolve) => {
        // Store colors if not already stored
        if (originalColors.size === 0) {
            storeColors();
        }

        // Save current state to history before changing
        colorHistory.push(new Map(originalColors));

        // Apply new colors with delays
        const maxDelay = Math.max(...colors.map((el) => el.delay ?? 0), 0);

        colors.forEach((el) => {
            setTimeout(() => {
                document.documentElement.style.setProperty(
                    el.colorName,
                    el.colorValue,
                );
            }, el.delay ?? 0);
        });

        // Resolve when all timeouts are done
        setTimeout(() => {
            resolve();
        }, maxDelay + 50);
    });
};

/**
 * Restore all original colors
 * @param {number} duration - Optional CSS transition duration in milliseconds (default: 0)
 * @param {number} delay - Optional delay before restoration in milliseconds (default: 0)
 * @returns {Promise} - Resolves when restoration is complete
 */
export const restoreColors = (duration = 0, delay = 0) => {
    return new Promise((resolve) => {
        const root = document.documentElement;

        // Apply transition if duration is specified
        if (duration > 0) {
            root.style.transition = `all ${duration}ms ease-in-out`;
        }

        setTimeout(() => {
            originalColors.forEach((value, colorName) => {
                root.style.setProperty(colorName, value);
            });

            // Remove transition style
            setTimeout(() => {
                root.style.transition = '';
                resolve();
            }, duration + 50);
        }, delay);
    });
};

/**
 * Restore colors to previous state from history
 * @returns {Promise}
 */
export const restorePreviousState = () => {
    return new Promise((resolve) => {
        if (colorHistory.length > 0) {
            const previousColors = colorHistory.pop();
            const root = document.documentElement;

            previousColors.forEach((value, colorName) => {
                root.style.setProperty(colorName, value);
            });

            resolve();
        } else {
            resolve();
        }
    });
};

/**
 * Get current stored original color value
 * @param {string} colorName - CSS custom property name
 * @returns {string} - Color value or empty string if not found
 */
export const getOriginalColor = (colorName) => {
    return originalColors.get(colorName) ?? '';
};

/**
 * Clear all stored colors
 */
export const clearColors = () => {
    originalColors.clear();
    colorHistory.length = 0;
};

/**
 * Get all stored original colors
 * @returns {Object} - Object with colorName: colorValue pairs
 */
export const getAllOriginalColors = () => {
    return Object.fromEntries(originalColors);
};
