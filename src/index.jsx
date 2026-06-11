async function View({ folderPath }) {
    if (!folderPath) throw new Error("View requires folderPath prop");

    const SafeView = () => {
        const rootRef = dc.useRef(null);
        const [hijacked, setHijacked] = dc.useState(false);
        const [app, setApp] = dc.useState(null);

        // Layer 1 — CSS Suppression & Height Restoration
        dc.useEffect(() => {
            const FULLTAB_ID = 'fulltab-48-svg-converter';
            let styleEl = document.getElementById(FULLTAB_ID);
            if (!styleEl) {
                styleEl = document.createElement('style');
                styleEl.id = FULLTAB_ID;
                styleEl.innerHTML = `
                    body > .app-container .status-bar,
                    .status-bar, .inline-title, .view-footer,
                    .workspace-leaf-content-footer, .mod-footer,
                    .embedded-backlinks { display: none !important; }
                    .workspace-leaf-content { padding: 0 !important; margin: 0 !important; }
                    .markdown-preview-view, .markdown-preview-section { padding: 0 !important; max-width: 100% !important; }
                    .markdown-preview-sizer { padding: 0 !important; margin: 0 !important; min-height: unset !important; }
                    
                    /* Force workspace-leaf viewport layers to take full height when svg converter is active */
                    .workspace-leaf.svg-converter-active-leaf,
                    .workspace-leaf.svg-converter-active-leaf .workspace-leaf-content,
                    .workspace-leaf.svg-converter-active-leaf .view-content,
                    .workspace-leaf.svg-converter-active-leaf .markdown-source-view,
                    .workspace-leaf.svg-converter-active-leaf .cm-editor,
                    .workspace-leaf.svg-converter-active-leaf .cm-scroller,
                    .workspace-leaf.svg-converter-active-leaf .markdown-preview-view,
                    .workspace-leaf.svg-converter-active-leaf .markdown-preview-sizer {
                        height: 100% !important;
                        max-height: 100% !important;
                        min-height: 100% !important;
                        padding: 0 !important;
                        margin: 0 !important;
                        overflow: hidden !important;
                    }
                `;
                document.head.appendChild(styleEl);
            }
            return () => {
                const el = document.getElementById(FULLTAB_ID);
                if (el) el.remove();
            };
        }, []);

        // Layer 2 — DOM Reparenting & Class Injection
        dc.useEffect(() => {
            const root = rootRef.current;
            if (!root) return;
            let attempts = 0;
            const hijack = () => {
                try {
                    const leaf = root.closest('.workspace-leaf');
                    if (leaf) {
                        leaf.classList.add('svg-converter-active-leaf');
                    }
                    // Fallback across different view modes (Source Mode vs Reading Mode)
                    const scroller = leaf?.querySelector('.cm-scroller') || leaf?.querySelector('.markdown-preview-view') || leaf?.querySelector('.view-content');
                    if (scroller) {
                        scroller.appendChild(root);
                        
                        // Ensure parent can anchor absolute positioned children without breaking its layout
                        if (window.getComputedStyle(scroller).position === 'static') {
                            scroller.style.position = 'relative';
                        }
                        
                        Object.assign(root.style, {
                            position: 'absolute', top: '0', left: '0',
                            width: '100%', height: '100%', zIndex: '10',
                            display: 'flex', flexDirection: 'column',
                            overflow: 'hidden', visibility: 'visible',
                        });
                        setHijacked(true);
                        return true;
                    }
                } catch (e) {}
                return false;
            };
            
            if (hijack()) return;
            const poller = setInterval(() => {
                if (hijack() || attempts++ > 100) clearInterval(poller);
            }, 16);
            return () => clearInterval(poller);
        }, []);

        dc.useEffect(() => {
            const load = async () => {
                try {
                    const appPath = dc.resolvePath("SVGConverter/src/App.jsx") || (folderPath ? (folderPath.replace(/\/[^\/]+\.md$/, '') + '/src/App.jsx') : 'src/App.jsx');
                    const { SVGConverter } = await dc.require(appPath);
                    setApp({ SVGConverter });
                } catch (e) {
                    console.error("Failed to load SVG Converter component:", e);
                }
            };
            load();
        }, []);

        const stopEvents = {
            onPointerDown: (e) => e.stopPropagation(),
            onMouseDown: (e) => e.stopPropagation(),
            onMouseUp: (e) => e.stopPropagation(),
            onClick: (e) => e.stopPropagation(),
            onKeyDown: (e) => e.stopPropagation(),
            onKeyUp: (e) => e.stopPropagation(),
            onTouchStart: (e) => e.stopPropagation(),
            onTouchEnd: (e) => e.stopPropagation(),
        };

        if (!app) {
            return (
                <div
                    ref={rootRef}
                    id="svg-converter-root"
                    style={{
                        width: '100%', height: '100%',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'var(--text-muted)',
                        visibility: hijacked ? 'visible' : 'hidden'
                    }}
                    {...stopEvents}
                >
                    Loading SVG Converter...
                </div>
            );
        }

        const { SVGConverter } = app;
        return (
            <div
                ref={rootRef}
                id="svg-converter-root"
                style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    overflow: 'hidden',
                    visibility: hijacked ? 'visible' : 'hidden'
                }}
                {...stopEvents}
            >
                <SVGConverter folderPath={folderPath} />
            </div>
        );
    };

    return <SafeView />;
}

return { View };
