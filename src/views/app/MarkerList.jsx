import { createEffect, createSignal, Show } from "solid-js"
import { useFirebase } from "@hooks/useFirebase"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"
import Header from "./Header"
import {
    Container,
    FitHeightScrollable,
    AdaptableHeightScrollable,
} from "@components/smallElements"
// import Button from "@components/button"
import Message from "@components/Message"
import Loader from "@components/Loader"
import Fa from "solid-fa"
import { faEye, faClock, faPen } from "@fortawesome/free-solid-svg-icons"
import SvgIcon from "@components/SvgIcon"

//#region [STATS]
const InfoContainer = styled("div")`
    box-sizing: border-box;
    display: flex;
    border: none;
    background: #458dfa28;
    border-color: var(--color-secondary);
    color: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 0px 90px 90px 0px;
    font-size: 0.7rem;
    font-weight: 500;
    padding: 0.5rem;
    gap: 0.5rem;
`

const StatisticsContainer = styled("div")`
    box-sizing: border-box;
    display: flex;
    /* width: 20%; */
    border: none;
    background: #458dfa28;
    border-color: var(--color-secondary);
    color: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 90px;
    font-size: 0.7rem;
    font-weight: 500;
    padding: 0.5rem;
`

const StaticText = styled("p")`
    margin: 0;
    margin-left: 0.5rem;
    margin-right: 0.5rem;
`

const Stats = (props) => {
    return (
        <>
            <InfoContainer class="glass">
                <>
                    <Fa icon={faPen} size="1x" translateX={0} class="icon" />
                    <StaticText>
                        {props.created.toDate().toLocaleDateString()}
                    </StaticText>
                </>
                <>
                    <Fa icon={faClock} size="1x" translateX={0} class="icon" />
                    <Show
                        when={props.lastSee}
                        fallback={<StaticText>n/a</StaticText>}
                    >
                        <StaticText>
                            {`${props.lastSee.toDate().toLocaleDateString()} ${props.lastSee
                                .toDate()
                                .toLocaleTimeString([], {
                                    hour: "2-digit",
                                    minute: "2-digit",
                                })}`}
                        </StaticText>
                    </Show>
                </>
                <>
                    <StatisticsContainer class="glass">
                        <Fa
                            icon={faEye}
                            size="1x"
                            translateX={0}
                            class="icon"
                        />
                        <StaticText>{props.views}</StaticText>
                    </StatisticsContainer>
                </>
            </InfoContainer>
        </>
    )
}

//#region [MARKER]
const MarkerContainer = styled(Motion.div)`
    margin-top: 2rem;
    margin-bottom: 1rem;
    background: ${(props) =>
        props.isClicked
            ? "color-mix(in srgb, var(--color-secondary), transparent 85%)"
            : "transparent"};
`

const NameContainer = styled("div")`
    box-sizing: border-box;
    color: var(--color-primary);
    width: fit-content;
`

const Name = styled("p")`
    font-weight: 400;
    margin: 0;
    margin-top: 0.3rem;
`

const BottomContainer = styled("div")`
    box-sizing: border-box;
    display: flex;
    width: 100%;
    margin-top: 0.5rem;
    gap: 0.75rem;
`

const Marker = (props) => {
    const [isClicked, setIsClicked] = createSignal(false)

    const handleMarkerClicked = () => {
        setIsClicked(true)
        setTimeout(() => {
            setIsClicked(false)
            // console.log(props.marker)
            props.onClick()
        }, 200)
    }

    return (
        <MarkerContainer
            onClick={handleMarkerClicked}
            animate={{ opacity: [0, 1] }}
            transition={{
                duration: 0.5,
                easing: "ease-in-out",
                delay: props.delay,
            }}
            isClicked={isClicked()}
        >
            <NameContainer class="glass">
                <Name>{props.marker.name}</Name>
            </NameContainer>

            <BottomContainer>
                <Stats
                    views={props.marker.views}
                    lastSee={props.marker.lastSee}
                    created={props.marker.created}
                ></Stats>
            </BottomContainer>
        </MarkerContainer>
    )
}

//#region [EMPTY]
const EmptyContainer = styled("div")`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-direction: column;
    text-align: center;
    padding: 1rem;
    padding-top: 3rem;
    padding-bottom: 3rem;
`

const EmptyTitle = styled("p")`
    font-family: "SebinoSoftMedium";
    font-size: var(--font-size-xlarge);
    margin: 0;
    margin-top: 1rem;
`

const EmptySubtitle = styled("p")`
    font-family: "SebinoSoftLight";
    margin: 0;
`

const Empty = () => {
    return (
        <EmptyContainer>
            <SvgIcon
                src={"icons/empty-wallet.svg"}
                color={"var(--color-secondary)"}
                size={60}
            />
            <EmptyTitle>Non hai nessun ambiente</EmptyTitle>
            <EmptySubtitle>Inizia creandone uno con il tasto + qui sotto</EmptySubtitle>
        </EmptyContainer>
    )
}

//#region [MARKER-LIST]
const MarkersListContainer = styled("div")`
    width: 100%;
    flex: 1;
    overflow-y: auto;
    margin-bottom: 2rem;
`

const MarkersList = (props) => {
    const firebase = useFirebase()
    const [markers, setMarkers] = createSignal([])
    const [loading, setLoading] = createSignal(false)

    createEffect(() => {
        if (firebase.auth.authLoading() || !firebase.auth.user()) return

        setLoading(() => true)
        loadMarkers()
    })

    /**
     * Load all markers from Firestore
     */
    const loadMarkers = async () => {
        let data = await firebase.firestore.fetchMarkers(
            firebase.auth.user().uid,
        )

        // reorder by timestamp (last is the new one)
        data = data.sort((a, b) => {
            return a.created.seconds - b.created.seconds
        })

        setMarkers(data)

        // hide the spinner
        setLoading(() => false)
    }

    // return (
    //     <Container>
    //         {/* HEADER */}
    //         <Header showBack={false} onClickUser={props.goToUserProfile}>
    //             <span
    //                 style={{
    //                     color: "var(--color-primary)",
    //                     "font-size": "var(--font-size-xxxlarge)",
    //                 }}
    //             >
    //                 BeeAr
    //             </span>
    //         </Header>

    //         {/* CONTENT */}
    //         {loading() ? (
    //             <Loader />
    //         ) : (
    //             <>
    //                 <p
    //                     style={{
    //                         margin: 0,
    //                         color: "var(--color-secondary)",
    //                         "font-size": "var(--font-size-xlarge)",
    //                     }}
    //                 >
    //                     I tuoi ambienti
    //                 </p>
    //                 <FitHeightScrollable
    //                     id="FitHeight"
    //                     style={{ "align-items": "center" }}
    //                     animate={{ opacity: [0, 1] }}
    //                     transition={{
    //                         duration: 0.5,
    //                         easing: "ease-in-out",
    //                         delay: 0.25,
    //                     }}
    //                 >
    //                     {markers().length === 0 ? (
    //                         <Message>
    //                             Non hai ancora nessun ambiente.<br></br> Inizia
    //                             creandone uno<br></br>
    //                             <br></br>
    //                             Un ambiente AR è uno spazio fisico intorno a te
    //                             in cui inserirai oggetti virtuali in realtà
    //                             aumentata,
    //                             <br></br>
    //                             per essere visualizzati da altri nello stesso
    //                             luogo.
    //                         </Message>
    //                     ) : (
    //                         <MarkersListContainer>
    //                             {markers().map((marker) => (
    //                                 <Marker
    //                                     marker={marker}
    //                                     onClick={() =>
    //                                         props.onMarkerClicked(marker)
    //                                     }
    //                                 />
    //                             ))}
    //                         </MarkersListContainer>
    //                     )}

    //                     <button
    //                         onClick={() => props.onCreateNewMarker()}
    //                         style={{
    //                             background: "none",
    //                             border: "none",
    //                             cursor: "pointer",
    //                             padding: 0,
    //                         }}
    //                     >
    //                         <SvgIcon
    //                             src={"icons/plus-circle.svg"}
    //                             color={"var(--color-accent)"}
    //                             size={55}
    //                             translateY={0}
    //                         />
    //                     </button>
    //                 </FitHeightScrollable>
    //             </>
    //         )}
    //     </Container>
    // )

    return (
        <Container>
            {/* HEADER */}
            <Header showBack={false} onClickUser={props.goToUserProfile}>
                <span
                    style={{
                        color: "var(--color-primary)",
                        "font-size": "var(--font-size-xxxlarge)",
                    }}
                >
                    BeeAr
                </span>
            </Header>

            {/* CONTENT */}
            {loading() ? (
                <Loader />
            ) : (
                <>
                    <p
                        style={{
                            margin: 0,
                            color: "var(--color-secondary)",
                            "font-size": "var(--font-size-xlarge)",
                        }}
                    >
                        I tuoi ambienti in AR
                    </p>
                    <AdaptableHeightScrollable
                        id="FitHeight"
                        style={{ "align-items": "center" }}
                        animate={{ opacity: [0, 1] }}
                        transition={{
                            duration: 0.5,
                            easing: "ease-in-out",
                            delay: 0.25,
                        }}
                    >
                        {markers().length === 0 ? (
                            <Empty />
                        ) : (
                            <MarkersListContainer>
                                {markers().map((marker) => (
                                    <Marker
                                        marker={marker}
                                        onClick={() =>
                                            props.onMarkerClicked(marker)
                                        }
                                    />
                                ))}
                            </MarkersListContainer>
                        )}

                        <button
                            onClick={() => props.onCreateNewMarker()}
                            style={{
                                background: "none",
                                border: "none",
                                cursor: "pointer",
                                padding: 0,
                            }}
                        >
                            <SvgIcon
                                src={"icons/plus-circle.svg"}
                                color={"var(--color-accent)"}
                                size={55}
                                translateY={0}
                            />
                        </button>
                    </AdaptableHeightScrollable>
                </>
            )}
        </Container>
    )
}

export default MarkersList
