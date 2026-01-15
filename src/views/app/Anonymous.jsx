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
import { smartImageLoader } from "@tools/smartImageLoader"

//#region [Welcome]
const Welcome = (props) => {
    const [allImagesLoaded, setAllImagesLoaded] = createSignal(false)
    const enterDelay = {
      logo: 0,
      title: 0,
      subTitle: 0,
      image: 0,
      enterButton: 0,
    }

    onMount(() => {
        // set background
        if (props.cover?.colors?.background) {
            setBackground(props.cover.colors.background)
        }

        //preload all images before to render the page
        if (props.cover?.images) {
            loadImages()
        }

        // Registra il listener per sapere quando tutte le immagini sono caricate
        const unsubscribe = smartImageLoader.onAllLoaded((isLoaded) => {
            setAllImagesLoaded(isLoaded)
            console.log("Tutte le immagini caricate:", isLoaded)
        })
    })

    const loadImages = async () => {
        const images = [props.cover?.images?.logo?.url]
        await smartImageLoader.load(images)
    }

    const setBackground = (color = "transparent") => {
        const el = document.getElementById("backgroundContainer")
        if (!el) return false
        while (el.firstChild) el.removeChild(el.firstChild)
        el.style.backgroundImage = "none"
        el.style.backgroundColor = color
        return true
    }

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

    return (
        <Container>
            <Show when={allImagesLoaded()}>
                {/* LOGO */}
                <Show when={props.cover?.images?.logo?.url}>
                    <CoverLogo
                        src={props.cover.images.logo.url}
                        alt={props.cover.images.logo.alt ?? "Cover logo"}
                        style={{
                            width: props.cover.images.logo.width ?? "100px",
                        }}
                        animate={{ opacity: [0, 1], scale: [0.9, 1] }}
                        transition={{
                            duration: 1,
                            easing: "ease-in-out",
                        }}
                    />
                </Show>

                {/* TITLE */}
                <Show
                    when={props.cover?.text?.title}
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
                                <span
                                    style={{
                                        color: "var(--color-secondary)",
                                    }}
                                >
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
                                <span
                                    style={{
                                        color: "var(--color-secondary)",
                                    }}
                                >
                                    nella{" "}
                                </span>
                                <span style={{ color: "var(--color-white)" }}>
                                    tua esperienza in
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
                                <span
                                    style={{
                                        color: "var(--color-primary)",
                                    }}
                                >
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
                            duration: 1.5,
                            easing: "ease-in-out",
                            delay: 0.5,
                        }}
                    >
                        {props.cover.text.title}
                    </BigTitle>
                </Show>

                {/* SUBTITLE */}
                <Show when={props.cover?.text?.subTitle}>
                    <SubTitle
                        color={
                            props.cover.colors.secondary ?? {
                                color: "var(--color-secondary)",
                            }
                        }
                        animate={{ opacity: [0, 1] }}
                        transition={{
                            duration: 1.5,
                            easing: "ease-in-out",
                            delay: 1,
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
            </Show>
            <ArButtonContainer
                id="ArButtonContainer"
                animate={{ opacity: [0, 1] }}
                transition={{
                    duration: 1.5,
                    easing: "ease-in-out",
                    delay: 2,
                }}
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
