import { Motion } from "solid-motionone"
import { styled } from "solid-styled-components"

const BlurredCover = (props) => {

    const BlurredContainer = styled(Motion)`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        pointer-events: none;
        z-index: -1;
  `;

    // valori animazione "in" (entrata)
    const animIn = {
        opacity: [0, 1],
        backdropFilter: ["blur(0px)", "blur(8px)"],
        WebkitBackdropFilter: ["blur(0px)", "blur(8px)"],
        backgroundColor: ["rgba(0,0,0,0)", "rgba(0, 0, 0, 0.7)"],
    }

    // valori animazione "out" (uscita → l’opposto)
    const animOut = {
        opacity: [1, 0],
        backdropFilter: ["blur(8px)", "blur(0px)"],
        WebkitBackdropFilter: ["blur(8px)", "blur(0px)"],
        backgroundColor: ["rgba(0, 0, 0, 0.7)", "rgba(0,0,0,0)"],
    }

    return (
        <BlurredContainer
            animate={props.direction === "in" ? animIn : animOut}
            transition={{ duration: 1, easing: "ease-in-out", delay: 0 }}
            initial={false}
        />
    )
}

export default BlurredCover
