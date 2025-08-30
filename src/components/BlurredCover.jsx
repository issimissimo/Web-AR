import { Motion } from "solid-motionone"
import { styled } from "solid-styled-components"

const BlurredCover = (props) => {

    const BlurredContainer = styled(Motion)`
    position: absolute;
    pointer-events: none;
  `;

    // valori animazione "in" (entrata)
    const animIn = {
        opacity: [0, 1],
        backdropFilter: ["blur(0px)", "blur(8px)"],
        WebkitBackdropFilter: ["blur(0px)", "blur(8px)"],
        backgroundColor: ["rgba(0,0,0,0)", "rgba(0, 0, 0, 0.5)"],
    }

    // valori animazione "out" (uscita → l’opposto)
    const animOut = {
        opacity: [1, 0],
        backdropFilter: ["blur(8px)", "blur(0px)"],
        WebkitBackdropFilter: ["blur(8px)", "blur(0px)"],
        backgroundColor: ["rgba(0, 0, 0, 0.5)", "rgba(0,0,0,0)"],
    }

    return (
        <BlurredContainer
            style={{
                position: "absolute",
                width: "100%",
                height: "100dvh",
            }}
            animate={props.direction === "in" ? animIn : animOut}
            transition={{ duration: 1, easing: "ease-in-out", delay: 0 }}
            initial={false}
        />
    )
}

export default BlurredCover
