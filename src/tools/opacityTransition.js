/**
 * Smoothly transitions the opacity of elements
 * @param {Element[] | NodeList | string} elements - Array of elements, NodeList, or CSS selector
 * @param {number} targetOpacity - Target opacity value (0-1)
 * @param {number} duration - Transition duration in milliseconds
 * @param {number} delay - Optional delay before transition starts in milliseconds (default: 0)
 * @returns {Promise} - Resolves when transition is complete
 */
export const opacityTransition = (elements, targetOpacity, duration, delay = 0) => {
    return new Promise((resolve) => {
        // Convert selector string to elements
        let elementsArray = elements;
        if (typeof elements === 'string') {
            elementsArray = document.querySelectorAll(elements);
        } else if (!Array.isArray(elements) && !(elements instanceof NodeList)) {
            elementsArray = [elements];
        }

        // Apply transition style to all elements
        elementsArray.forEach((el) => {
            if (el) {
                el.style.transition = `opacity ${duration}ms ease-in-out`;
            }
        });

        // Start transition after delay
        setTimeout(() => {
            elementsArray.forEach((el) => {
                if (el) {
                    el.style.opacity = targetOpacity;
                }
            });

            // Resolve promise when transition completes
            setTimeout(() => {
                resolve();
            }, duration);
        }, delay);
    });
};

/**
 * Fade out multiple elements
 * @param {Element[] | NodeList | string} elements
 * @param {number} duration - Transition duration in milliseconds
 * @param {number} delay - Optional delay in milliseconds
 * @returns {Promise}
 */
export const fadeOut = (elements, duration = 300, delay = 0) => {
    return opacityTransition(elements, 0, duration, delay);
};

/**
 * Fade in multiple elements
 * @param {Element[] | NodeList | string} elements
 * @param {number} duration - Transition duration in milliseconds
 * @param {number} delay - Optional delay in milliseconds
 * @returns {Promise}
 */
export const fadeIn = (elements, duration = 300, delay = 0) => {
    return opacityTransition(elements, 1, duration, delay);
};
