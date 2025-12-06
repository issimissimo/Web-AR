import { createSignal, createMemo, createEffect } from "solid-js";
import { styled } from "solid-styled-components";
import { Motion } from "solid-motionone";


const SvgOverlay = styled(Motion.svg)`
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    z-index: -1;
    height: 100%;
`;


export default function BlurredCover(props) {

    const [visible, setVisible] = createSignal(props.visible || false);
    const [showHole, setShowHole] = createSignal(props.showHole || false);

    const radius = () => props.radius ?? 20;
    const dur = () => props.duration ?? 0.4;

    createEffect(() => {

        // Here we receive props changes!
        setVisible(props.visible);
        setShowHole(props.showHole);
    });


    // dimensioni reactive del viewport
    const [vw, setVw] = createSignal(
        typeof window !== "undefined" ? window.innerWidth : 0
    );
    const [vh, setVh] = createSignal(
        typeof window !== "undefined" ? window.innerHeight : 0
    );

    // lato del foro: 40% della larghezza viewport, con maxSize opzionale
    const holeSide = createMemo(() => {
        const max = props.maxSize ?? 600;
        return Math.min(vw() * 0.5, max);
    });

    // centro in pixel (numeri, NON percentuali)
    const centerX = createMemo(() => vw() / 2);
    const centerY = createMemo(() => vh() / 2);

    const maskId = `calib-hole-${Math.random().toString(36).slice(2)}`;

    const animBlurIn = {
        backdropFilter: ["blur(0px)", "blur(8px)"],
        WebkitBackdropFilter: ["blur(0px)", "blur(8px)"],
    }

    const animBlurOut = {
        backdropFilter: ["blur(8px)", "blur(0px)"],
        WebkitBackdropFilter: ["blur(8px)", "blur(0px)"],
    }

    const getAnimation = () => {
        if (visible() && !showHole()) return animBlurIn;
        if (!visible()) return animBlurOut;
        if (visible() && showHole()) return animBlurOut;
    }

    return (
        <SvgOverlay id="BlurredCover"
            xmlns="http://www.w3.org/2000/svg"
            width={vw()}
            height={vh()}
            viewBox={`0 0 ${Math.max(1, vw())} ${Math.max(1, vh())}`}
            preserveAspectRatio="none"
            animate={getAnimation()}
            transition={{ duration: dur(), easing: "ease-in-out", delay: 0 }}
            initial={false}
        >
            <defs>
                {/* maskUnits userSpaceOnUse: coordinate in pixel del viewport */}
                <mask id={maskId} maskUnits="userSpaceOnUse">
                    {/* tutto visibile */}
                    <rect x="0" y="0" width={vw()} height={vh()} fill="white" />
                    {/* gruppo centrato usando valori numerici */}
                    <g transform={`translate(${centerX()}, ${centerY()})`}>
                        <Motion.rect
                            x={-holeSide() / 2}
                            y={-holeSide() / 2}
                            width={holeSide()}
                            height={holeSide()}
                            rx={radius()}
                            // fill="black" /* nero = "buco" nella mask */
                            initial={{ scale: 0.001 }}
                            animate={{ scale: showHole() && visible() ? 1 : 0.001 }}
                            transition={{ duration: dur(), easing: "ease-in-out" }}
                            /* IMPORTANT: assicurarsi che la scala avvenga dal centro dell'elemento SVG */
                            style={{
                                transformOrigin: "center",
                                transformBox: "fill-box",
                            }}
                        />
                    </g>
                </mask>
            </defs>

            {/* overlay scuro con mask applicata */}
            <Motion.rect
                x="0"
                y="0"
                width={vw()}
                height={vh()}
                // fill="rgba(0,0,0,0.7)"
                mask={`url(#${maskId})`}
                animate={{ fill: visible() ? "rgba(0,0,0,0.7)" : "rgba(0,0,0,0)" }}
                transition={{ duration: dur(), easing: "ease-in-out" }}
                initial={false}
            />

            {/* bordo: identiche dimensioni e animazione per rimanere allineato */}
            <g transform={`translate(${centerX()}, ${centerY()})`}>
                <Motion.rect
                    x={-holeSide() / 2}
                    y={-holeSide() / 2}
                    width={holeSide()}
                    height={holeSide()}
                    rx={radius()}
                    fill="none"
                    // stroke={props.stroke ?? "#ffffff"}
                    // stroke={props.planeFound ? "#f472b6" : "#ffffff"}
                    // stroke-width={props.strokeWidth ?? 3}
                    initial={{ scale: 0.001 }}
                    // animate={{ scale: showHole() && visible() ? 1 : 0.001 }}
                    animate={{
                        scale: showHole() && visible() ? 1 : 0.001,
                        stroke: props.planeFound ? "#f472b6" : "#ffffff",
                        strokeWidth: props.planeFound ? 4 : 1
                    }}
                    transition={{ duration: dur(), easing: "ease-in-out" }}
                    style={{
                        transformOrigin: "center",
                        transformBox: "fill-box",
                    }}
                />
            </g>

        </SvgOverlay>
    );
}
