import { onMount, createSignal } from "solid-js"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"
import { faSadCry, faExclamation } from "@fortawesome/free-solid-svg-icons"
import { init } from "@hooks/useQRCode"

import { Centered } from "@components/smallElements"
import { SubTitle } from "@components/smallElements"
import Message from "@components/Message"
import Fa from "solid-fa"

import isMobile from "@tools/mobileCheck"
import whichBrowser from "@tools/browserDetect"

const VIEWS = {
    DESKTOP_UNSUPPORTED: "DesktopUnsupported",
    ANDROID_DEVICE_UNSUPPORTED: "AndroidDeviceUnsupported",
    ANDROID_BROWSER_UNSUPPORTED: "AndroidBrowserUnsupported",
    IOS_BROWSER_UNSUPPORTED: "iOSBrowserUnsupported",
}

const Container = styled(Centered)`
    justify-content: center;
    text-align: center;
`

const QrCodeContainer = styled(Motion.div)`
    width: 100%;
    display: flex;
    display: ${(props) => (props.isVisible ? "flex" : "none")};
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
`

const QrCodeImg = styled("img")`
    text-align: center;
    z-index: 99;
    width: 150px;
`

const Link = styled("p")`
    text-decoration: underline;
    text-underline-offset: 4px;
    cursor: pointer;
    text-decoration-thickness: 1px;
    text-decoration-color: inherit;
    font-size: var(--font-size-small);
    color: var(--color-secondary);
`

export default function ARUnsupported() {
    const [currentView, setCurrentView] = createSignal(null)
    let _isIOS, _isMobile, _browserName

    onMount(() => {
        // create Qr Code
        init()

        console.log("is iOS:", window.iOS)
        console.log("is mobile:", isMobile())
        console.log("browser:", whichBrowser())

        _isIOS = window.iOS
        _isMobile = isMobile()
        _browserName = whichBrowser()

        if (!_isMobile) {
            setCurrentView(VIEWS.DESKTOP_UNSUPPORTED)
            return
        }
        if (_isIOS) {
            setCurrentView(VIEWS.IOS_BROWSER_UNSUPPORTED)
            return
        }
        if (_browserName !== "Chrome") {
            setCurrentView(VIEWS.ANDROID_BROWSER_UNSUPPORTED)
            return
        }
        setCurrentView(VIEWS.ANDROID_DEVICE_UNSUPPORTED)
    })

    const handleOpenDeviceLink = () =>{
        console.log("link---")
        window.open("https://www.issimissimo.com/prod/AR-Web/compatible-devices.html","_self")
    }

    const DesktopUnsupported = () => {
        return (
            <>
                Questa app di Realtà Aumentata è progettata per dispositivi
                mobile
                <br></br>
                <br></br>{" "}
                <span style={{ color: "var(--color-secondary)" }}>
                    Apri il link o scansiona il QrCode con un dispositivo
                    compatibile <br></br>
                    <br></br>
                    <span style={{ "font-family": "SebinoSoftBold" }}>
                        Android con Chrome <br></br> iOS con Safari{" "}
                    </span>
                </span>
            </>
        )
    }

    const AndroidDeviceUnsupported = () => {
        return (
            <>
                <Fa icon={faSadCry} size="3x" color="var(--color-secondary)" />
                <p>
                    Il tuo dispositivo purtroppo non è compatibile con questa
                    app di Realtà Aumentata
                </p>
                <Link onClick={handleOpenDeviceLink}>
                    Guarda l'elenco dei
                    <br /> dispositivi Android compatibili
                </Link>
            </>
        )
    }

    const AndroidBrowserUnsupported = () => {
        return (
            <>
                <Fa
                    icon={faExclamation}
                    size="3x"
                    color="var(--color-secondary)"
                />
                <p>
                    Il tuo browser Android non è compatibile con questa app di
                    Realtà Aumentata
                </p>
                <p style={{ color: "var(--color-secondary)" }}>Apri il link o scansiona il QR Code <br/> con Chrome</p>
            </>
        )
    }

    const IOSBrowserUnsupported = () => {
        return (
            <>
                <Fa
                    icon={faExclamation}
                    size="3x"
                    color="var(--color-secondary)"
                />
                <p>
                    Il tuo browser iOS non è compatibile con questa app di
                    Realtà Aumentata
                </p>
                <p style={{ color: "var(--color-secondary)" }}>Apri il link o scansiona il QR Code <br/> con Safari</p>
            </>
        )
    }

    const renderView = () => {
        switch (currentView()) {
            case VIEWS.DESKTOP_UNSUPPORTED:
                return <DesktopUnsupported />

            case VIEWS.ANDROID_DEVICE_UNSUPPORTED:
                return <AndroidDeviceUnsupported />

            case VIEWS.ANDROID_BROWSER_UNSUPPORTED:
                return <AndroidBrowserUnsupported />

            case VIEWS.IOS_BROWSER_UNSUPPORTED:
                return <IOSBrowserUnsupported />
        }
    }

    return (
        <Container>
            {renderView()}
            <QrCodeContainer
                isVisible={currentView() === VIEWS.DESKTOP_UNSUPPORTED}
                animate={{ opacity: [0, 1] }}
                transition={{
                    duration: 1,
                    easing: "ease-in-out",
                    delay: 0.5,
                }}
            >
                <QrCodeImg id="qr-code" />
            </QrCodeContainer>
        </Container>
    )
}
