import { createSignal, onMount, Show } from "solid-js"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"
import Fa from "solid-fa"
import {
    Centered,
    BigTitle,
    Title,
    SubTitle,
    FitHeight,
} from "@components/smallElements"
import Message from "@components/Message"

import { faSadCry, faStar } from "@fortawesome/free-solid-svg-icons"

//#region [Welcome]
const Welcome = (props) => {
    onMount(() => {
        if (props.cover.colors.background) {
          clearBackground(props.cover.colors.background)
        }
    })

    const Container = styled("div")`
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 1rem;
        text-align: center;
    `

    const ArButtonContainer = styled(Motion.div)`
        z-index: 1000;
    `

    const CoverLogo = styled(Motion.img)`
        margin-bottom: 2rem;
    `

    const CoverTitle = styled(Motion.p)`
        text-align: center;
    `

    // utility: clear #backgroundContainer and set custom background color
    const clearBackground = (color = "transparent") => {
        const el = document.getElementById("backgroundContainer")
        if (!el) return false
        while (el.firstChild) el.removeChild(el.firstChild)
        el.style.backgroundImage = "none"
        el.style.backgroundColor = color
        return true
    }

    return (
        <Container>
            {/* LOGO */}
            <Show when={props.cover.logo.url}>
                <CoverLogo
                    src={props.cover.logo.url}
                    alt={props.cover.logo.alt ?? "Cover logo"}
                    style={{
                        width: props.cover.logo.width ?? "100px",
                    }}
                    animate={{ opacity: [0, 1], scale: [0.95, 1] }}
                    transition={{ duration: 0.6, easing: "ease-in-out" }}
                />
            </Show>

            {/* TITLE */}
            <Show
                when={props.cover.text.title}
                fallback={
                    <>
                        <BigTitle
                            animate={{ opacity: [0, 1] }}
                            transition={{
                                duration: 0.5,
                                easing: "ease-in-out",
                                delay: 0,
                            }}
                        >
                            <span style={{ color: "var(--color-secondary)" }}>
                                Benvenuto
                            </span>
                        </BigTitle>
                        <BigTitle
                            animate={{ opacity: [0, 1] }}
                            transition={{
                                duration: 0.5,
                                easing: "ease-in-out",
                                delay: 0.25,
                            }}
                        >
                            <span style={{ color: "var(--color-secondary)" }}>
                                nella{" "}
                            </span>
                            <span style={{ color: "var(--color-white)" }}>
                                tua esperienza di
                            </span>
                        </BigTitle>
                        <BigTitle
                            color={"var(--color-primary)"}
                            animate={{ opacity: [0, 1] }}
                            transition={{
                                duration: 0.5,
                                easing: "ease-in-out",
                                delay: 0.5,
                            }}
                        >
                            <span style={{ color: "var(--color-primary)" }}>
                                Realtà Aumentata
                            </span>
                        </BigTitle>
                    </>
                }
            >
                <BigTitle
                    color={
                        props.cover.colors.primary ?? {
                            color: "var(--color-primary)",
                        }
                    }
                    animate={{ opacity: [0, 1] }}
                    transition={{
                        duration: 0.5,
                        easing: "ease-in-out",
                    }}
                >
                    {props.cover.text.title}
                </BigTitle>
            </Show>

            {/* SUBTITLE */}
            <Show when={props.cover.text.subTitle}>
                <SubTitle
                    color={
                        props.cover.colors.secondary ?? {
                            color: "var(--color-secondary)",
                        }
                    }
                    animate={{ opacity: [0, 1] }}
                    transition={{
                        duration: 0.5,
                        easing: "ease-in-out",
                    }}
                >
                    {props.cover.text.subTitle}
                </SubTitle>
            </Show>

            <FitHeight style={{ "justify-content": "center" }}>
                {props.coverTitle !== null && (
                    <CoverTitle
                        id="cover"
                        animate={{ opacity: [0, 1] }}
                        transition={{
                            duration: 1,
                            easing: "ease-in-out",
                            delay: 1,
                        }}
                    >
                        <Fa
                            icon={faStar}
                            color={"var(--color-secondary)"}
                            translateY={-0.5}
                            size="3x"
                            class="icon"
                        />
                        {props.coverTitle}
                    </CoverTitle>
                )}
            </FitHeight>

            <ArButtonContainer
                id="ArButtonContainer"
                animate={{ opacity: [0, 1] }}
                transition={{ duration: 1, easing: "ease-in-out", delay: 1 }}
            />
        </Container>
    )
}

//#region [Unavailable]
const Unavailable = () => {
    return (
        <Message icon={faSadCry} showReadMore={false}>
            Spiacenti, l'esperienza AR che stai cercando non è più disponibile.
            <br></br>
            <br></br>
            Verifica il link o contatta chi ti ha condiviso questa esperienza
            per ottenere un nuovo collegamento.
        </Message>
    )
}

//#region [Main]
export default function Main(props) {
    const [markerValid, setMarkerValid] = createSignal(false)

    onMount(() => {
        if (props.marker?.games != null) {
            if (props.marker.games.length > 0) {
                setMarkerValid(() => true)

                setTimeout(() => {
                    props.initScene()
                }, 50)
            }
        }
    })

    return (
        <Centered>
            {markerValid() ? (
                <Welcome
                    coverTitle={props.marker.coverTitle}
                    cover={props.marker.cover}
                />
            ) : (
                <Unavailable />
            )}
        </Centered>
    )
}
