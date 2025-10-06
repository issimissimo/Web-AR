import {
    onMount,
    onCleanup,
    createSignal,
    createEffect,
    useContext,
    Show,
    on,
} from "solid-js"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"
import Button from "@components/button"
import Message from "@components/Message"
import SvgIcon from "@components/SvgIcon"
import { Context } from "@views/ar-overlay/arSession"
import Fa from "solid-fa"
import {
    faPlus,
    faLocationDot,
    faHandPointUp,
} from "@fortawesome/free-solid-svg-icons"

import { PLUGINS_CATEGORIES, PLUGINS_LIST } from "@plugins/pluginsIndex"

//region CATEGORY ITEM

const CategoryItem = (props) => {
    const CategoryItemContainer = styled(Motion.div)`
        display: flex;
        flex-direction: column;
        align-items: center;
        width: 40px;
        box-sizing: border-box;
    `

    const IconContainer = styled("div")`
        display: flex;
        justify-content: center;
        box-sizing: border-box;
        width: 35px;
        height: 35px;
        position: relative;
    `

    const CategoryName = styled("p")`
        font-size: 0.7rem;
    `

    const BorderBottomBar = styled(Motion.div)`
        position: absolute;
        left: 0;
        bottom: 0;
        width: 100%;
        height: 2px;
        background: var(--color-primary);
        transform-origin: left;
    `

    return (
        <CategoryItemContainer
            animate={{ opacity: [0, 1], scale: props.selected ? 1 : 0.8 }}
            transition={{ duration: 0.5, easing: "ease-in-out", delay: 0 }}
            onClick={() => props.onClick(props.name)}
        >
            <IconContainer selected={props.selected}>
                <SvgIcon
                    src={props.icon}
                    size={25}
                    color={"var(--color-primary)"}
                />
                <BorderBottomBar
                    animate={{ scaleX: props.selected ? 1 : 0 }}
                    transition={{ duration: 0.3, easing: "ease-in-out" }}
                    initial={false}
                />
            </IconContainer>

            <CategoryName>{props.name}</CategoryName>
        </CategoryItemContainer>
    )
}

//region CATEGORY PICKER

const CategoriesPicker = (props) => {

    const _defaultCategoryName = "Modifica";

    onMount(() => {
        props.onCategoryPicked(_defaultCategoryName)
    })

    const CategoriesContainer = styled("div")`
        display: flex;
        justify-content: space-around;
        width: 100%;
        box-sizing: border-box;
    `
    return (
        <CategoriesContainer>
            {props.visible && (
                <>
                    <CategoryItem
                        name={_defaultCategoryName}
                        icon={"someicon"}
                        selected={props.state === props.STATE.CURRENT}
                        onClick={() => {
                            props.setState(
                                props.state === props.STATE.CURRENT
                                    ? props.STATE.NONE
                                    : props.STATE.CURRENT
                            )
                            props.onCategoryPicked(_defaultCategoryName)
                        }}
                    />
                    {PLUGINS_CATEGORIES.map((category) => (
                        <CategoryItem
                            name={category.name}
                            icon={category.icon}
                            selected={
                                props.state === props.STATE.NEW &&
                                    props.currentCategoryName === category.name
                                    ? true
                                    : false
                            }
                            onClick={(name) => {
                                if (
                                    props.state === props.STATE.NEW &&
                                    props.currentCategoryName === name
                                ) {
                                    props.setState(props.STATE.NONE)
                                } else {
                                    props.setState(props.STATE.NEW)
                                    props.onCategoryPicked(name)
                                }
                            }}
                        />
                    ))}
                </>
            )}
        </CategoriesContainer>
    )
}

//region UI

const UI = (props) => {
    const STATE = {
        NONE: "none",
        CURRENT: "current",
        NEW: "new",
    }

    const [state, setState] = createSignal(STATE.NONE)
    const [currentCategoryName, setCurrentCategoryName] = createSignal(null)
    const [selectedPlugin, setSelectedPlugin] = createSignal(null)
    const context = useContext(Context)



    // Start with the 1st category
    onMount(() => {
        // setCurrentCategoryName(() => PLUGINS_CATEGORIES[0].name);
        if (context.appMode === "save") {
            setState(STATE.CURRENT);
        }
    })

    // Manage the blurred cover
    createEffect(
        on(state, (newState) => {
            // console.log("SELECTED STATE:", newState)

            // If no games are created, OR we are adding,
            // show the blurred background
            if (newState === STATE.NEW || props.marker.games.length === 0) {
                context.handleBlurredCover({
                    visible: true,
                    priority: 999,
                })
            } else {
                context.handleBlurredCover({
                    visible: false,
                    priority: 0,
                })
                if (newState === STATE.NONE) {
                    props.setSelectedGameId(null);
                    props.setHeaderText(null);
                }
            }
        })
    )

    const InventoryContainer = styled("div")`
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-top: 1rem;
        pointer-events: ${(props) => (props.visible ? "auto" : "none")};
        opacity: ${(props) => (props.visible ? 1 : 0)};
    `


    const handleCategorySelected = (categoryName) => {
        setSelectedPlugin(null)
        setCurrentCategoryName(categoryName)
        if (state() !== STATE.NONE) {
            props.setHeaderText(categoryName);
        }
    }

    const getPluginTitle = (pluginName) => {
        const pluginSpecs = PLUGINS_LIST.find((g) => g.fileName === pluginName)
        return pluginSpecs.title
    }

    const getPluginLocalized = (pluginName) => {
        const pluginSpecs = PLUGINS_LIST.find((g) => g.fileName === pluginName)
        return pluginSpecs.localized
    }

    const getPluginInteractable = (pluginName) => {
        const pluginSpecs = PLUGINS_LIST.find((g) => g.fileName === pluginName)
        return pluginSpecs.interactable
    }

    const getPluginIcon = (pluginName) => {
        const pluginSpecs = PLUGINS_LIST.find((g) => g.fileName === pluginName)
        if (pluginSpecs.icon) return pluginSpecs.icon
        const categoryName = pluginSpecs.category
        const categorySpecs = PLUGINS_CATEGORIES.find(
            (g) => g.name === categoryName
        )
        return categorySpecs.icon
    }

    const getPluginAllowed = (pluginName) => {
        // Check if some of the installed games
        // is "interactable", so that means that
        // no other "interactable" plugins are allowed
        let isSomeoneInteractable = false
        for (let i = 0; i < props.marker.games.length; i++) {
            const game = props.marker.games[i]
            const currentGameSpecs = PLUGINS_LIST.find(
                (g) => g.fileName === game.name
            )
            if (currentGameSpecs.interactable) {
                isSomeoneInteractable = true
                break
            }
        }
        const pluginSpecs = PLUGINS_LIST.find((g) => g.fileName === pluginName)
        if (pluginSpecs.interactable && isSomeoneInteractable) {
            return false
        }

        // Now check for the total allowed
        // number
        const totalAllowed = pluginSpecs.allowed
        let nGames = 0
        if (props.marker.games) {
            props.marker.games.map((game) => {
                if (game.name === pluginName) nGames++
            })
            return totalAllowed - nGames
        }
        return totalAllowed
    }

    /**
     * Set the selected game id!
     */
    // const handleToggle = (id) => {
    //     props.setSelectedGameId(id !== props.selectedGameId ? id : null);
    // };

    const handleToggle = (id) => {
        const newSelectedId = id !== props.selectedGameId ? id : null

        props.setSelectedGameId(null) // importante! dobbiamo cancellare il DOM prima di procedere

        // console.log(
        //     `Game selection change: ${previousSelectedId} -> ${newSelectedId}`
        // )

        // IMPORTANTE: Aggiungi un piccolo delay per permettere al createEffect di pulire
        // il DOM prima che il nuovo componente tenti di montare la sua view
        setTimeout(() => {
            props.setSelectedGameId(newSelectedId)
            console.log(`Game selection changed: ${newSelectedId}`)
        }, 10)
    }

    const handleSelectNewPlugin = (newPlugin) => {
        if (selectedPlugin()) {
            if (
                !newPlugin ||
                newPlugin.fileName === selectedPlugin().fileName
            ) {
                setSelectedPlugin(null)
                return
            }
        }
        setSelectedPlugin(newPlugin)
    }

    // Add a new plugin to this marker!!
    const handleAddNewPlugin = () => {
        props.addNewPluginToMarker(selectedPlugin().fileName)
        setSelectedPlugin(null)
        // change view to CURRENT
        setState(STATE.CURRENT)
    }

    const Middle = styled("div")`
        position: relative;
        display: flex;
        flex-direction: column;
        flex: 1;
    `

    const GameUIContainer = styled("div")`
        visibility: ${(props) => (props.visible ? "visible" : "hidden")};
        pointer-events: ${(props) => (props.visible ? "auto" : "none")};
        opacity: ${(props) => (props.visible ? 1 : 0)};
        display: flex;
        flex-direction: column;
        position: relative;
        flex: 1;
        margin-bottom: 2rem;
    `

    const CurrentItemsContainer = styled("div")`
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
    `

    const NewPanelContainer = styled("div")`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 2rem;
        flex: 1;
        display: flex;
        flex-direction: column;
    `

    const PluginListContainer = styled("div")`
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
        overflow-y: auto;
        width: 100%;
    `

    const Bottom = styled("div")`
        display: flex;
        align-items: center;
        justify-content: center;
    `

    // region TOGGLE BUTTON

    const StyledToggleButton = styled("div")`
        position: relative;
        display: flex;
        gap: 0.5rem;
        align-items: center;
        width: fit-content;
        height: fit-content;
        flex-shrink: 0;
        padding: 0.4rem;
        padding-left: 1rem;
        padding-right: 1rem;
        font-size: small;
        font-weight: 400;
        font-family: inherit;
        border-radius: 90px;
        background: ${(props) =>
            props.isOn
                ? "var(--color-secondary)"
                : props.theme === "dark"
                    ? "var(--color-dark-transparent)"
                    : "var(--color-background-transparent)"};
        border: none;
        pointer-events: ${(props) => (props.enabled ? "auto" : "none")};
        opacity: ${(props) => (props.enabled ? 1 : 0.5)};
        color: white;
        box-shadow: none;
        outline: none;
        z-index: 1;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.05s, color 0.05s;
    `

    const ToggleButton = (props) => {
        const handleOnClick = () => {
            props.onToggle(props.id)
        }

        return (
            <StyledToggleButton
                data-interactive
                onClick={handleOnClick}
                style={props.style}
                class="glass"
                isOn={props.isOn}
                enabled={props.enabled ?? true}
                theme={props.theme ?? "dark"}
            >
                {props.children}
            </StyledToggleButton>
        )
    }

    //region PLUGIN DETAILS

    const PluginDetailsContainer = styled("div")`
        flex: 1;
        width: 100%;
        top: 50%;
        bottom: 0;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
    `

    const PluginDetails = () => {
        return (
            <PluginDetailsContainer>
                <SvgIcon
                    translateY={-0.5}
                    src={getPluginIcon(selectedPlugin().fileName)}
                    color={"var(--color-secondary)"}
                    size={40}
                />
                <Message
                    style={{ height: "auto" }}
                    fadeIn={false}
                    showReadMore={false}
                    showDoneButton={false}
                >
                    {selectedPlugin().description}
                </Message>

                <Button
                    onClick={handleAddNewPlugin}
                    small={true}
                    icon={faPlus}
                    width={"65%"}
                >
                    Aggiungi
                </Button>
            </PluginDetailsContainer>
        )
    }

    //#region RENDER

    return (
        <InventoryContainer id="InventoryContainer" visible={props.visible}>
            <Middle id="middle">
                {/* LIST OF RUNNING GAMES */}
                <Show
                    when={
                        context.appMode === "save" && state() === STATE.CURRENT
                    }
                >
                    <CurrentItemsContainer>
                        {props.marker.games.map((game) => (
                            <ToggleButton
                                id={game.id}
                                onToggle={(id) => handleToggle(id)}
                                isOn={game.id === props.selectedGameId}
                                enabled={game.enabled}
                            >
                                <SvgIcon
                                    src={getPluginIcon(game.name)}
                                    size={16}
                                />
                                {getPluginTitle(game.name)}
                                {getPluginLocalized(game.name) && (
                                    <Fa icon={faLocationDot} size="1x" />
                                )}
                                {getPluginInteractable(game.name) && (
                                    <Fa icon={faHandPointUp} size="1x" />
                                )}
                            </ToggleButton>
                        ))}
                    </CurrentItemsContainer>
                </Show>

                {/* LIST OF AVAILABLE GAMES */}
                <Show
                    when={context.appMode === "save" && state() === STATE.NEW}
                >
                    <NewPanelContainer id="NewPanelContainer">
                        <PluginListContainer id="PluginListContainer">
                            {PLUGINS_LIST.map(
                                (plugin) =>
                                    plugin.category ===
                                    currentCategoryName() && (
                                        <ToggleButton
                                            enabled={getPluginAllowed(
                                                plugin.fileName
                                            )}
                                            onToggle={() =>
                                                handleSelectNewPlugin(plugin)
                                            }
                                            isOn={
                                                selectedPlugin()
                                                    ? selectedPlugin()
                                                        .fileName ===
                                                    plugin.fileName
                                                    : false
                                            }
                                        >
                                            <SvgIcon
                                                src={getPluginIcon(
                                                    plugin.fileName
                                                )}
                                                size={16}
                                            />
                                            {plugin.title}
                                            {plugin.localized && (
                                                <Fa
                                                    icon={faLocationDot}
                                                    size="1x"
                                                    translateX={0}
                                                />
                                            )}
                                            {plugin.interactable && (
                                                <Fa
                                                    icon={faHandPointUp}
                                                    size="1x"
                                                />
                                            )}
                                        </ToggleButton>
                                    )
                            )}
                        </PluginListContainer>

                        {/* PLUGIN DETAILS */}
                        <Show when={selectedPlugin()}>
                            <PluginDetails />
                        </Show>
                    </NewPanelContainer>
                </Show>

                {/* UI OF THE GAMES !!! DON'T TOUCH! N.B. We can't use Show here
                because the dome element is observed and must be present*/}
                <GameUIContainer
                    id="plugins-ui"
                    visible={state() !== STATE.NEW}
                >
                    <Show when={props.marker.games.length === 0}>
                        <Message>
                            <div>
                                Aggiungi dei componenti scegliendoli dalle
                                categorie elencate in basso.<br></br> <br></br>
                                <Fa
                                    icon={faLocationDot}
                                    color={"var(--color-secondary)"}
                                    size="1x"
                                />{" "}
                                Alcuni componenti richiedono la localizzazione
                                rispetto a un marker posizionato nell'ambiente
                                in cui ti trovi.
                                <br></br> <br></br>
                                <Fa
                                    icon={faHandPointUp}
                                    color={"var(--color-secondary)"}
                                    size="1x"
                                />{" "}
                                Alcuni componenti richiedono l'interazione
                                dell'utente, e ne puoi aggiungere solo uno.
                                <br></br> <br></br>
                            </div>
                        </Message>
                    </Show>
                </GameUIContainer>
            </Middle>

            {/* CATEGORY PICKER */}
            {context.appMode === "save" && (
                <Bottom data-interactive>
                    <CategoriesPicker
                        visible={true}
                        currentCategoryName={currentCategoryName()}
                        onCategoryPicked={(name) =>
                            handleCategorySelected(name)
                        }
                        state={state()}
                        setState={(newState) => setState(newState)}
                        STATE={STATE}
                    ></CategoriesPicker>
                </Bottom>
            )}
        </InventoryContainer>
    )
}

export default UI
