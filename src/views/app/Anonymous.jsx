import { createSignal, onMount, Show } from "solid-js"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"
import { Centered, Title, SubTitle } from "@components/smallElements"
import Message from "@components/Message"
import { faSadCry } from "@fortawesome/free-solid-svg-icons"
import { smartImageLoader } from "@tools/smartImageLoader"

//#region [Welcome]
const Welcome = (props) => {
    const [allImagesLoaded, setAllImagesLoaded] = createSignal(false)
    const enterDelayIncrement = 0.4
    const enterDuration = 0.8
    const enterDelay = {
        logo: 0,
        title: 0,
        subTitle: 0,
        hero: 0,
        ARButton: 0,
    }

    console.log(enterDelay)

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
            ? enterDelay.hero + enterDelayIncrement * 3
            : enterDelay.subTitle + enterDelayIncrement * 3

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
        const images = [
            props.cover?.images?.logo?.url,
            props.cover?.images?.hero?.url,
        ]
        await smartImageLoader.load(images)
    }

    const changeColors = () => {
        if (props.cover?.colors?.primary) {
            document.documentElement.style.setProperty(
                "--color-primary",
                props.cover.colors.primary,
            )
        }
        if (props.cover?.colors?.secondary) {
            document.documentElement.style.setProperty(
                "--color-secondary",
                props.cover.colors.secondary,
            )
        }
        if (props.cover?.colors?.accent) {
            document.documentElement.style.setProperty(
                "--color-accent",
                props.cover.colors.accent,
            )
        }
        if (props.cover?.colors?.background) {
            document.documentElement.style.setProperty(
                "--color-background",
                props.cover.colors.background,
            )
        }
    }

    const Container = styled("div")`
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
    const TitleStyled = styled(Title)`
        width: 80%;
        margin-top: 0.5rem;
    `
    const SubTitleStyled = styled(SubTitle)`
        width: 90%;
        margin-top: 0.5rem;
    `
    const ArButtonStyled = styled(Motion.div)`
        margin-top: 1.6rem;
        z-index: 1000;
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
        <Container id="0001">
            <Show when={allImagesLoaded()}>
                <Spacer></Spacer>
                {/* LOGO */}
                <Show when={props.cover?.images?.logo?.url}>
                    <LogoImageStyled
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
                    color={props.cover?.color?.primary ?? "var(--color-primary)"}
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
                    color={props.cover?.color?.secondary ?? "var(--color-secondary)"}
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
                style={{
                    "margin-top": props.cover?.ARButton?.marginTop ?? "1rem",
                }}
                animate={{ opacity: [0, 1] }}
                transition={{
                    duration: enterDuration,
                    easing: "ease-in-out",
                    delay: enterDelay.ARButton,
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
                    name={props.marker.name}
                    cover={props.marker.cover}
                />
            ) : (
                <Unavailable />
            )}
        </Centered>
    )
}
