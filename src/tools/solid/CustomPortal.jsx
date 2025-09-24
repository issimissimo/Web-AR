// components/CustomPortal.jsx
import { onMount, onCleanup, children } from 'solid-js';
import { render } from 'solid-js/web';

export default function CustomPortal(props) {
    const c = children(() => props.children);
    let _disposer = null;
    let _observer = null;
    let _wrapper = null;
    // Default target is 'plugins-ui', but can be overridden via props
    const targetId = props.targetId || 'plugins-ui';

    onMount(() => {
        // create a detached host and render immediately so children onMount runs
        const unique = Math.random().toString(36).slice(2, 9);
        const host = document.createElement('div');
        host.id = `custom-portal-host-${unique}`;

        try {
            _disposer = render(() => {
                return c();
            }, host);
            console.log('CustomPortal: Rendered children into detached host', host.id);
        } catch (err) {
            console.error('CustomPortal initial render error:', err);
        }

        // function to attach host children into the target container
        const attachTo = (container) => {
            if (!container) return;
            _wrapper = document.createElement('div');
            _wrapper.id = props.wrapperId || `custom-portal-${unique}`;
            // move host children into wrapper
            while (host.firstChild) _wrapper.appendChild(host.firstChild);
            container.appendChild(_wrapper);
            console.log('CustomPortal: Attached content to', container);
        };

        // If target already exists, attach immediately
        const existing = document.getElementById(targetId);
        if (existing) {
            console.log(`CustomPortal: Found existing target #${targetId}, attaching`);
            attachTo(existing);
            return;
        }

        // Otherwise wait for it (indefinitely)
        _observer = new MutationObserver(() => {
            const found = document.getElementById(targetId);
            if (found) {
                console.log(`CustomPortal: Element #${targetId} appeared in DOM`);
                if (_observer) { _observer.disconnect(); _observer = null; }
                attachTo(found);
            }
        });

        _observer.observe(document.body, { childList: true, subtree: true });
        console.log(`CustomPortal: Waiting for element #${targetId}...`);
    });

    onCleanup(() => {
        console.log('CustomPortal: Cleanup called');
        if (_observer) {
            try { _observer.disconnect(); } catch (e) { }
            _observer = null;
        }
        if (_disposer) {
            try { _disposer(); console.log('CustomPortal: Disposer called successfully'); } catch (e) { console.warn('Error disposing plugin portal:', e); }
            _disposer = null;
        }
        if (_wrapper && _wrapper.parentNode) {
            try { _wrapper.parentNode.removeChild(_wrapper); } catch (e) { }
            _wrapper = null;
        }
    });

    return null; // does not render anything into the parent component
}