import { onMount, createSignal, createEffect, useContext, Show } from "solid-js"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"

import {
    Container,
    FitHeight,
    FitHeightScrollable,
} from "@components/smallElements"
import Button from "@components/button"
import ButtonSecondary from "@components/ButtonSecondary"
import ButtonCircle from "@components/ButtonCircle"
import SvgIcon from "@components/SvgIcon"
import { Context } from "@views/ar-overlay/arSession"
import Fa from "solid-fa"
import {
    faPlus,
    faXmark,
    faLocationCrosshairs,
    faSadTear,
    faCheck,
    faTrash,
    faLocationDot,
} from "@fortawesome/free-solid-svg-icons"

import { PLUGINS_CATEGORIES, PLUGINS_LIST } from "@plugins/pluginsIndex"

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

const CategoriesPicker = (props) => {
    const STATE = {
        NONE: "none",
        CURRENT: "current",
        NEW: "new",
    }

    const [state, setState] = createSignal(STATE.CURRENT)

    const CategoriesContainer = styled("div")`
        display: flex;
        justify-content: space-around;
        width: 100%;
        box-sizing: border-box;
    `

    // return (
    //     <CategoriesContainer>
    //         {props.visible && (
    //             <>
    //                 <CategoryItem
    //                     name={"installate"}
    //                     icon={"someicon"}
    //                     selected={state() === STATE.CURRENT}
    //                     onClick={() => setState(state() === STATE.CURRENT ? STATE.NONE : STATE.CURRENT)}
    //                 />
    //                 {PLUGINS_CATEGORIES.map((category) => (
    //                     <CategoryItem
    //                         name={category.name}
    //                         icon={category.icon}
    //                         selected={state() === STATE.NEW &&
    //                             props.currentCategoryName === category.name
    //                             ? true
    //                             : false
    //                         }
    //                         onClick={(name) => {
    //                             if (state() === STATE.NEW &&
    //                                 props.currentCategoryName === name) {
    //                                 setState(STATE.NONE);
    //                             }
    //                             else{
    //                                 setState(STATE.NEW);
    //                                 props.onCategoryPicked(name);
    //                             }
    //                         }}
    //                     />
    //                 ))}
    //             </>
    //         )}
    //     </CategoriesContainer>
    // )
    return (
        <CategoriesContainer>
            {props.visible && (
                <>
                    <CategoryItem
                        name={"installate"}
                        icon={"someicon"}
                        selected={props.state === props.STATE.CURRENT}
                        onClick={() =>
                            props.setState(
                                props.state === props.STATE.CURRENT
                                    ? props.STATE.NONE
                                    : props.STATE.CURRENT
                            )
                        }
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

const InventoryItem = (props) => {
    const ItemContainer = styled(Motion.div)`
        margin-top: 2rem;
        /* margin-bottom: 2rem; */
    `

    const ItemHeader = styled("div")`
        display: flex;
        align-items: center;
    `

    const ItemIconContainer = styled("div")`
        width: 60px;
        height: 50px;
        display: flex;
        align-items: center;
    `

    const ItemContent = styled("div")`
        flex: 1;
        box-sizing: border-box;
        margin-left: 60px;
    `

    const ItemTitle = styled("p")`
        font-size: 1rem;
        margin: 0;
    `

    const ItemDescription = styled("div")`
        font-size: small;
        width: auto;
        opacity: 0.75;
        line-height: 180%;
        margin-bottom: 1rem;
    `

    const SpecsContainer = styled("div")`
        display: flex;
        font-size: small;
        color: var(--color-secondary);
        gap: 0.5rem;
        align-items: center;
    `

    return (
        <ItemContainer
        // enabled={props.enabled}
        // animate={{ opacity: [0, props.enabled ? 1 : 0.5] }}
        // transition={{ duration: 1, easing: "ease-in-out", delay: 0.5 }}
        >
            <ItemHeader>
                <ItemIconContainer>
                    {/* <SvgIcon src={props.icon} size={40} color={'var(--color-secondary)'} /> */}
                </ItemIconContainer>

                <ItemTitle>{props.title}</ItemTitle>
            </ItemHeader>

            <ItemContent>
                <ItemDescription>{props.description}</ItemDescription>

                {props.enabled &&
                    props.available &&
                    props.localizationRequired && (
                        <SpecsContainer>
                            <Fa
                                icon={faLocationCrosshairs}
                                size="1x"
                                translateX={0}
                                class="icon"
                            />
                            Richiede localizzazione
                        </SpecsContainer>
                    )}
                {!props.available && props.enabled && (
                    <SpecsContainer>
                        <Fa
                            icon={faCheck}
                            size="1x"
                            translateX={0}
                            class="icon"
                        />
                        Aggiunto
                    </SpecsContainer>
                )}
                {!props.enabled && (
                    <SpecsContainer>
                        <Fa
                            icon={faSadTear}
                            size="1x"
                            translateX={0}
                            class="icon"
                        />
                        Non disponibile
                    </SpecsContainer>
                )}

                {props.enabled && props.available && (
                    <Button
                        style={{ "margin-top": "1rem" }}
                        active={true}
                        small={true}
                    // onClick={handleModifyMarker}
                    >
                        Aggiungi
                        <Fa
                            icon={faPlus}
                            size="1x"
                            translateX={1}
                            class="icon"
                        />
                    </Button>
                )}
            </ItemContent>
        </ItemContainer>
    )
}

//#region [INVENTORY]

const Inventory = (props) => {
    const STATE = {
        NONE: "none",
        CURRENT: "current",
        NEW: "new",
    }

    const [state, setState] = createSignal(STATE.CURRENT)
    const [currentCategoryName, setCurrentCategoryName] = createSignal(null)
    const [visible, setVisible] = createSignal(false)
    const [selectedPlugin, setSelectedPlugin] = createSignal(null)
    const context = useContext(Context)

    createEffect(() => {
        console.log("SELECTED PLUGIN:", selectedPlugin())
    })

    // const handleSetVisible = () => {
    //     setVisible(() => !visible())
    //     // props.onToggleUi(visible());
    //     context.handleBlurredCover({ visible: visible() })
    // }

    const InventoryContainer = styled("div")`
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-top: 1rem;
        /* background-color: green; */
    `

    // const InventoryItemsContainer = styled(FitHeightScrollable)`
    //     margin-bottom: 2rem;
    // `

    onMount(() => {
        setCurrentCategoryName(() => PLUGINS_CATEGORIES[0].name)
        // console.log(PLUGINS_LIST)

        console.log(props.marker)
    })

    const handleCategorySelected = (categoryName) => {
        setSelectedPlugin(null);
        setCurrentCategoryName(() => categoryName)
    }

    const getPluginTitle = (pluginName) => {
        const pluginSpecs = PLUGINS_LIST.find((g) => g.fileName === pluginName)
        return pluginSpecs.title
    }

    const getPluginLocalized = (pluginName) => {
        const pluginSpecs = PLUGINS_LIST.find((g) => g.fileName === pluginName)
        return pluginSpecs.localized
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
        const pluginSpecs = PLUGINS_LIST.find((g) => g.fileName === pluginName)
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
        const previousSelectedId = props.selectedGameId
        const newSelectedId = id !== props.selectedGameId ? id : null

        props.setSelectedGameId(null) // importante! dobbiamo cancellare il DOM prima di procedere

        console.log(
            `Game selection change: ${previousSelectedId} -> ${newSelectedId}`
        )

        // IMPORTANTE: Aggiungi un piccolo delay per permettere al createEffect di pulire
        // il DOM prima che il nuovo componente tenti di montare la sua view
        setTimeout(() => {
            props.setSelectedGameId(newSelectedId)
            console.log(`Game selection changed: ${newSelectedId}`)
        }, 10)
    }

    const handleSelectNewPlugin = (newPlugin) => {
        if (selectedPlugin()) {
            if (!newPlugin || newPlugin.fileName === selectedPlugin().fileName) {
                setSelectedPlugin(null);
                return;
            }
        }
        setSelectedPlugin(newPlugin);
    }

    const Middle = styled("div")`
        /* display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: flex-start; */
        position: relative;
        display: flex;
        flex-direction: column;

        /* background-color: #1100ff; */
        flex: 1;
    `

    const GameUI = styled("div")`
        /* display: flex;
        flex-wrap: wrap;    
        gap: 1rem;
        align-items: flex-start; */
        visibility: ${(props) => (props.visible ? "visible" : "hidden")};
        pointer-events: ${(props) => (props.visible ? "auto" : "none")};
        opacity: ${(props) => (props.visible ? 1 : 0)};
        display: flex;
        flex-direction: column;
        position: relative;

        /* background-color: #d16eb02d; */
        flex: 1;
        margin-bottom: 2rem;
    `

    const CurrentItemsContainer = styled("div")`
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        /* align-items: flex-start; */
        /* background-color: #ffee0039; */
    `

    const NewPanelContainer = styled("div")`
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        bottom: 2rem;
        /* display: flex;
    flex-direction: column; */
        flex: 1;
        /* background-color: #00ff8839; */
        /* margin-bottom: 2rem; */
    `

    const PluginListContainer = styled("div")`
        position: absolute;
        display: flex;
        flex-direction: column-reverse;
        gap: 1rem;
        /* display: flex;
        align-items: center;
        justify-content: center; */
        background-color: #ff00006e;
        /* height: 60px; */
        overflow-y: auto;
        width: 100%;
        height: 50%;
    `

    const PluginDetailsContainer = styled("div")`
        position: absolute;
        width: 100%;
        /* display: flex;
        align-items: center;
        justify-content: center; */
        background-color: #3700ff37;
        top: 50%;
        bottom: 0;
        /* height: 60px; */
    `

    const Bottom = styled("div")`
        display: flex;
        align-items: center;
        justify-content: center;
        /* background-color: red; */
        /* height: 60px; */
    `

    //#region [ToggleButton]
    const StyledToggleButton = styled("div")`
        position: relative;
        display: flex;
        gap: 0.5rem;
        align-items: center;
        width: fit-content;
        height: fit-content;
        /* width: ${(props) => props.width || "100%"}; */
        flex-shrink: 0;
        padding: 0.4rem;
        padding-left: 1.2rem;
        padding-right: 1.2rem;
        /* margin-bottom: 1rem; */
        font-size: small;
        font-weight: 400;
        font-family: inherit;
        border-radius: 90px;
        background: ${(props) =>
            props.isOn
                ? "var(--color-secondary)"
                : props.theme === "dark"
                    ? 'var(--color-dark-transparent)'
                    : 'var(--color-background-transparent)'
        };
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

    //#region [RETURN]

    return (
        <InventoryContainer id="InventoryContainer">
            {/* <CategoriesPicker
                // visible={visible()}
                visible={true}
                currentCategoryName={currentCategoryName()}
                onCategoryPicked={(name) => handleCategorySelected(name)}
            ></CategoriesPicker> */}

            {/* <Button
                active={true}
                icon={!visible() ? faPlus : faXmark}
                border={!visible()}
                background={visible() && 'transparent'}
                onClick={handleSetVisible}
            >
                {!visible() ? "" : "Chiudi"}
            </Button> */}

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
                                {getPluginLocalized(game.name) && (
                                    <Fa
                                        icon={faLocationDot}
                                        size="1x"
                                        translateX={0}
                                    />
                                )}
                                <SvgIcon
                                    src={getPluginIcon(game.name)}
                                    size={16}
                                />
                                {getPluginTitle(game.name)}
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
                                            isOn={selectedPlugin() ? selectedPlugin().fileName === plugin.fileName : false}
                                        >
                                            {plugin.localized && (
                                                <Fa
                                                    icon={faLocationDot}
                                                    size="1x"
                                                    translateX={0}
                                                />
                                            )}
                                            <SvgIcon
                                                src={getPluginIcon(
                                                    plugin.fileName
                                                )}
                                                size={16}
                                            />
                                            {plugin.title}
                                        </ToggleButton>
                                    )
                            )}
                        </PluginListContainer>

                        <Show when={selectedPlugin()}>
                            <PluginDetailsContainer id="PluginDetailsContainer">
                                {selectedPlugin().description}
                            </PluginDetailsContainer>
                        </Show>
                    </NewPanelContainer>
                </Show>

                {/* UI OF THE GAMES !!! N.B. We can't use Show here
                because the dome element is observed and must be present*/}
                <GameUI id="plugins-ui"
                    visible={state() !== STATE.NEW} />
            </Middle>

            {/* CATEGORY PICKER */}
            {context.appMode === "save" && (
                <Bottom data-interactive>
                    <CategoriesPicker
                        // visible={visible()}
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

export default Inventory
