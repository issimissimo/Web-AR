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

import {
    faSadCry,
} from "@fortawesome/free-solid-svg-icons"
import { smartImageLoader } from "@tools/smartImageLoader"

//#region [Welcome]
const Welcome = (props) => {
    const [allImagesLoaded, setAllImagesLoaded] = createSignal(false)
    const enterDelayIncrement = 0.75
    const enterDelay = {
        logo: 0,
        title: 0,
        subTitle: 0,
        hero: 0,
        enterButton: 0,
    }

    onMount(() => {
        // setup delay
        if (props.cover?.images?.logo?.url) {
            enterDelay.title += enterDelayIncrement
        }
        enterDelay.subTitle += enterDelay.title + enterDelayIncrement
        if (props.cover?.images?.hero?.url) {
            enterDelay.hero += enterDelay.subTitle + enterDelayIncrement
        }
        enterDelay.enterButton += enterDelay.hero
            ? enterDelay.hero + enterDelayIncrement
            : enterDelay.subTitle + enterDelayIncrement

        // set background
        if (props.cover?.colors?.background) {
            setBackground(props.cover.colors.background)
        }
        changeColors()

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

    const changeColors = () => {
        if (props.cover?.colors?.primary) {
            document.documentElement.style.setProperty(
                "--color-primary",
                props.cover.colors.primary
            )
        }
        if (props.cover?.colors?.secondary) {
            document.documentElement.style.setProperty(
                "--color-secondary",
                props.cover.colors.secondary
            )
        }
        if (props.cover?.colors?.accent) {
            document.documentElement.style.setProperty(
                "--color-accent",
                props.cover.colors.accent
            )
        }
        if (props.cover?.colors?.background) {
            document.documentElement.style.setProperty(
                "--color-background",
                props.cover.colors.background
            )
        }
    }

    const setBackground = (color = "transparent") => {
        const el = document.getElementById("backgroundContainer")
        if (!el) return false
        // while (el.firstChild) el.removeChild(el.firstChild)
        // el.style.backgroundImage = "none"
        // animate background color from CSS var --color-background to new color
        const root = document.documentElement
        const from =
            getComputedStyle(root)
                .getPropertyValue("--color-background")
                ?.trim() || "transparent"
        el.style.backgroundColor = from
        el.style.transition = "background-color 2000ms ease-in-out"
        requestAnimationFrame(() => {
            el.style.backgroundColor = color
        })
        return true
    }

    const Container = styled("div")`
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 1.5rem;
        text-align: center;
    `

    const Spacer = styled("div")`
        flex: 1;
    `

    const TitleStyled = styled(BigTitle)`
        /* flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end; */
        width: 80%;
    `

    const ArButtonContainer = styled(Motion.div)`
        /* width: 100%; */
        margin-top: 1.6rem;
        z-index: 1000;
    `

    const Image = styled(Motion.img)`
        margin-bottom: 2rem;
    `

    const CoverTitle = styled(Motion.p)`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        font-size: var(--font-size-xlarge);
        font-family: "SebinoSoftSemiBold";
        color: var(--color-secondary);
        margin-bottom: 3rem;
    `

    const DisclaimerStyled = styled(Motion.div)`
        flex: 1;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    `

    const DisclaimerLink = styled("p")`
        text-decoration: underline;
        text-underline-offset: 4px;
        cursor: pointer;
        text-decoration-thickness: 1px;
        text-decoration-color: inherit;
        font-size: var(--font-size-medium);
    `

    return (
        <Container id="0001">
            <Show when={allImagesLoaded()}>
                <Spacer></Spacer>
                {/* LOGO */}
                <Show when={props.cover?.images?.logo?.url}>
                    <Image
                        src={props.cover.images.logo.url}
                        alt={props.cover.images.logo.alt ?? "Cover logo"}
                        style={{
                            width: props.cover.images.logo.width ?? "100px",
                        }}
                        animate={{ opacity: [0, 1], scale: [0.9, 1] }}
                        transition={{
                            duration: 0.8,
                            easing: "ease-in-out",
                            delay: enterDelay.logo,
                        }}
                    />
                </Show>

                {/* TITLE */}
                <Show
                    when={props.cover?.text?.title}
                    fallback={
                        <>
                            <TitleStyled
                                animate={{ opacity: [0, 1] }}
                                transition={{
                                    duration: 0.5,
                                    easing: "ease-in-out",
                                    delay: enterDelay.title,
                                }}
                            >
                                <span style={{ color: "var(--color-primary)" }}>
                                    {props.coverTitle}
                                </span>
                            </TitleStyled>
                            <SubTitle
                                animate={{ opacity: [0, 1] }}
                                transition={{
                                    duration: 0.5,
                                    easing: "ease-in-out",
                                    delay: enterDelay.subTitle,
                                }}
                            >
                                La tua esperienza<br></br> in Realtà Aumentata
                            </SubTitle>
                        </>
                    }
                >
                    <BigTitle
                        style={{ fontSize: "var(--font-size-small)" }}
                        color={
                            props.cover.colors.primary ?? {
                                color: "var(--color-primary)",
                            }
                        }
                        animate={{ opacity: [0, 1] }}
                        transition={{
                            duration: 1.5,
                            easing: "ease-in-out",
                            delay: enterDelay.title - 0.5,
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
                            delay: enterDelay.subTitle - 0.5,
                        }}
                    >
                        {props.cover.text.subTitle}
                    </SubTitle>
                </Show>

                {/* HERO IMAGE */}
                <Show when={props.cover?.images?.hero?.url}>
                    <Image
                        src={props.cover.images.hero.url}
                        alt={props.cover.images.hero.alt ?? "Cover hero"}
                        style={{
                            width: props.cover.images.hero.width ?? "200px",
                        }}
                        animate={{ opacity: [0, 1] }}
                        transition={{
                            duration: 0.8,
                            easing: "ease-in-out",
                            delay: enterDelay.hero - 0.5,
                        }}
                    />
                </Show>
            </Show>
            <ArButtonContainer
                id="ArButtonContainer"
                animate={{ opacity: [0, 1] }}
                transition={{
                    duration: 1.5,
                    easing: "ease-in-out",
                    delay: enterDelay.enterButton - 0.5,
                }}
            />
            <DisclaimerStyled>
                <DisclaimerLink onClick={() => props.onDisclaimer?.()}>
                    Disclaimer
                </DisclaimerLink>
            </DisclaimerStyled>
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
