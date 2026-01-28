import { createSignal, onMount, Show, onCleanup } from "solid-js"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"
import { Centered } from "@components/smallElements"
import Message from "@components/Message"
import { faSadCry } from "@fortawesome/free-solid-svg-icons"
import { smartImageLoader } from "@tools/smartImageLoader"
import { config } from "@js/config"

// UI management
import { storeColors, setColors } from "@tools/UIcolorManager"
import { fadeOut } from "@tools/UIopacityManager"

//#region [Welcome]
const Welcome = (props) => {
    const [allImagesLoaded, setAllImagesLoaded] = createSignal(false)
    const enterDelayIncrement = config.ui.enterDelay
    const enterDuration = config.ui.enterDuration
    const enterDelay = {
        logo: 0,
        title: 0,
        subTitle: 0,
        hero: 0,
        ARButton: 0,
    }

    const ArButtonThemes = {
        default: {
            background: "var(--color-background)",
            color: "var(--color-accent)",
            borderColor: "var(--color-accent)",
            activeBackground: "var(--color-accent)",
            activeColor: "var(--color-background)",
            activeBorderColor: "var(--color-accent)",
        },
        reverse: {
            background: "var(--color-accent)",
            color: "var(--color-background)",
            borderColor: "var(--color-background)",
            activeBackground: "var(--color-background)",
            activeColor: "var(--color-accent)",
            activeBorderColor: "var(--color-background)",
        },
    }

    // setup ARButton theme (here, NOT onMount!!!)
    let ARButtonTheme = {}

    if (props.cover?.ARButton?.customTheme) {
        ARButtonTheme.background =
            props.cover.ARButton.customTheme.background,
            ARButtonTheme.color = props.cover.ARButton.customTheme.color,
            ARButtonTheme.activeBackground =
                props.cover.ARButton.customTheme.activeBackground,
            ARButtonTheme.activeColor =
                props.cover.ARButton.customTheme.activeColor
    }
    else {
        ARButtonTheme =
            ArButtonThemes[props.cover?.ARButton?.theme ?? "default"]
    }

    const handleARButtonClick = (e) => {
        // Store the custom colors
        // before to set all them to transparent
        storeColors()

        // Trigger exit animations
        const exitDuration = enterDuration * 1000
        const logo = document.getElementById("logo")
        if (logo) fadeOut(logo, exitDuration, enterDelay.logo * 1000 /2)
        const title = document.getElementById("title")
        if (title) fadeOut(title, exitDuration, enterDelay.title * 1000 /2)
        const subtitle = document.getElementById("subtitle")
        if (subtitle)
            fadeOut(subtitle, exitDuration, enterDelay.subTitle * 1000/2)
        const hero = document.getElementById("hero")
        if (hero) fadeOut(hero, exitDuration, enterDelay.hero * 1000/2)
        const arButton = document.getElementById("ArButtonContainer")
        if (arButton)
            fadeOut(arButton, exitDuration, enterDelay.ARButton * 1000/2 )

        setTimeout(
            () => {
                setColors(
                    [
                        {
                            colorName: "--color-primary",
                            colorValue: "transparent",
                        },
                        {
                            colorName: "--color-secondary",
                            colorValue: "transparent",
                        },
                        {
                            colorName: "--color-accent",
                            colorValue: "transparent",
                        },
                        {
                            colorName: "--color-background",
                            colorValue: "transparent",
                        },
                    ],
                    1000 /2,
                ) // 300ms smooth transition

                // let's wait for colors go to transparent
                // and next finally send the event to proceed to enter in AR Session
                setTimeout(() => {
                    document.dispatchEvent(
                        new CustomEvent("exitAnimationsEnded"),
                    )
                }, 1000 /2)
            },
            (enterDelay.logo +
                enterDelay.title +
                enterDelay.subTitle +
                enterDelay.hero +
                enterDelay.ARButton) *
                1000 /2,
        )
    }

    onMount(() => {
        // setup delay
        if (props.cover?.images?.logo?.url) {
            enterDelay.title += enterDelay.logo + enterDelayIncrement
        }
        enterDelay.subTitle += enterDelay.title + enterDelayIncrement
        if (props.cover?.images?.hero?.url) {
            enterDelay.hero += enterDelay.subTitle + enterDelayIncrement
        }
        enterDelay.ARButton += enterDelay.hero
            ? enterDelay.hero + enterDelayIncrement
            : enterDelay.subTitle + enterDelayIncrement

        // Store original colors FIRST (get actual computed values, not var() references)
        storeColors()

        // Setup UI colors with fallback to stored originals
        const colorsToSet = [
            {
                colorName: "--color-primary",
                colorValue: props.cover?.colors?.primary,
            },
            {
                colorName: "--color-secondary",
                colorValue: props.cover?.colors?.secondary,
            },
            {
                colorName: "--color-accent",
                colorValue: props.cover?.colors?.accent,
            },
            {
                colorName: "--color-background",
                colorValue: props.cover?.colors?.background,
            },
        ].filter((c) => c.colorValue) // Only set colors that have actual values

        if (colorsToSet.length > 0) {
            setColors(colorsToSet)
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

        // Listener for AR Button clicked
        document.addEventListener("arButtonClicked", handleARButtonClick)
    })

    onCleanup(() => {
        document.removeEventListener("arButtonClicked", handleARButtonClick)
    })

    const loadImages = async () => {
        const images = [
            props.cover?.images?.logo?.url,
            props.cover?.images?.hero?.url,
        ]
        await smartImageLoader.load(images)
    }

    const Container = styled("div")`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
    `
    const Spacer = styled("div")`
        flex: 1;
    `
    const TitleStyled = styled(Motion.p)`
        font-size: 2.4rem;
        font-family: "SebinoSoftMedium";
        line-height: 120%;
        color: ${(props) => props.color ?? "var(--color-primary)"};
        margin: 0;
        width: 80%;
    `
    const SubTitleStyled = styled(Motion.p)`
        font-size: 1.3rem;
        font-family: "SebinoSoftMedium";
        line-height: 130%;
        color: ${(props) => props.color ?? "var(--color-secondary)"};
        margin: 0;
        width: 90%;
    `

    const ArButtonStyled = styled(Motion.div)`
        margin-top: 1.6rem;
        z-index: 1000;
        /* width: 80%; */

        & button {
            background: ${(props) => props.theme.background} !important;
            color: ${(props) => props.theme.color} !important;
        }

        & button:active {
            background: ${(props) => props.theme.activeBackground} !important;
            color: ${(props) => props.theme.activeColor} !important;
        }
    `

    const LogoImageStyled = styled(Motion.img)`
        margin-bottom: ${(props) => props.marginBottom};
    `
    const HeroImageStyled = styled(Motion.img)`
        margin-top: 1rem;
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
        font-size: var(--font-size-small);
    `

    return (
        <Container>
            <Show when={allImagesLoaded()}>
                <Spacer />
                {/* LOGO */}
                <Show when={props.cover?.images?.logo?.url}>
                    <LogoImageStyled
                        id="logo"
                        src={props.cover.images.logo.url}
                        alt={props.cover.images.logo.alt ?? "Cover logo"}
                        style={{
                            width: props.cover.images.logo.width ?? "100px",
                        }}
                        marginBottom={
                            props.cover.images.logo.marginBottom ?? "1rem"
                        }
                        animate={{ opacity: [0, 1], scale: [0.9, 1] }}
                        transition={{
                            duration: enterDuration,
                            easing: "ease-in-out",
                            delay: enterDelay.logo,
                        }}
                    />
                </Show>

                {/* TITLE */}
                <TitleStyled
                    id="title"
                    color={props.cover?.color?.primary}
                    animate={{ opacity: [0, 1] }}
                    transition={{
                        duration: enterDuration,
                        easing: "ease-in-out",
                        delay: enterDelay.title,
                    }}
                >
                    {props.cover?.text?.title ?? props.name}
                </TitleStyled>

                {/* SUBTITLE */}
                <SubTitleStyled
                    id="subtitle"
                    color={props.cover?.color?.secondary}
                    animate={{ opacity: [0, 1] }}
                    transition={{
                        duration: enterDuration,
                        easing: "ease-in-out",
                        delay: enterDelay.subTitle,
                    }}
                >
                    {props.cover?.text?.subTitle ?? "La tua esperienza in AR"}
                </SubTitleStyled>

                {/* HERO IMAGE */}
                <Show when={props.cover?.images?.hero?.url}>
                    <HeroImageStyled
                        id="hero"
                        src={props.cover.images.hero.url}
                        alt={props.cover.images.hero.alt ?? "Cover hero"}
                        style={{
                            width: props.cover.images.hero.width ?? "200px",
                        }}
                        animate={{ opacity: [0, 1] }}
                        transition={{
                            duration: enterDuration,
                            easing: "ease-in-out",
                            delay: enterDelay.hero,
                        }}
                    />
                </Show>
            </Show>
            <ArButtonStyled
                id="ArButtonContainer"
                theme={ARButtonTheme}
                style={{
                    "margin-top": props.cover?.ARButton?.marginTop ?? "1rem",
                }}
                animate={{ opacity: [0, 1] }}
                transition={{
                    duration: enterDuration,
                    easing: "ease-in-out",
                    delay: enterDelay.ARButton * 2,
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
            <span style={{ color: "var(--color-secondary)" }}>
                Verifica il link o contatta chi ti ha condiviso questa
                esperienza per ottenere un nuovo collegamento.
            </span>
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
                    name={props.marker.name}
                    cover={props.marker.cover}
                    setUIColors={props.setUIColors}
                />
            ) : (
                <Unavailable />
            )}
        </Centered>
    )
}
