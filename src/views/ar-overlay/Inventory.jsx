import { onMount, createSignal, useContext } from "solid-js"
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
            onClick={() => props.onCategoryClicked(props.name)}
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
    const CategoriesContainer = styled("div")`
        display: flex;
        justify-content: space-around;
        width: 100%;
        box-sizing: border-box;
    `

    return (
        <CategoriesContainer>
            {props.visible &&
                PLUGINS_CATEGORIES.map((category) => (
                    <CategoryItem
                        name={category.name}
                        icon={category.icon}
                        selected={
                            props.currentCategoryName === category.name
                                ? true
                                : false
                        }
                        onCategoryClicked={(name) =>
                            props.onCategoryPicked(name)
                        }
                    />
                ))}
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
            animate={{ opacity: [0, props.enabled ? 1 : 0.5] }}
            transition={{ duration: 1, easing: "ease-in-out", delay: 0.5 }}
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
    const [currentCategoryName, setCurrentCategoryName] = createSignal(null);
    const [visible, setVisible] = createSignal(false)
    const context = useContext(Context)

    const handleSetVisible = () => {
        setVisible(() => !visible())
        // props.onToggleUi(visible());
        context.handleBlurredCover({ visible: visible() })
    }

    const getRunningPlugins = () => {

    }

    const InventoryContainer = styled("div")`
        flex: 1;
        display: flex;
        flex-direction: column;
        margin-top: 1rem;
        /* background-color: green; */
    `

    const InventoryItemsContainer = styled(FitHeightScrollable)`
        margin-bottom: 2rem;
    `

    onMount(() => {
        setCurrentCategoryName(() => PLUGINS_CATEGORIES[0].name)
        // console.log(PLUGINS_LIST)

        console.log(props.marker)
        console.log(props.gamesRunning)
    })

    const handleCategorySelected = (categoryName) => {
        setCurrentCategoryName(() => categoryName)
    }

    const getPluginTitle = (pluginName) => {
        const pluginSpecs = PLUGINS_LIST.find((g) => g.fileName === pluginName);
        return pluginSpecs.title;
    }

    const getPluginsAvailableByName = (pluginName) => {
        const pluginSpecs = PLUGINS_LIST.find((g) => g.fileName === pluginName)
        const totalAllowed = pluginSpecs.allowed
        // console.log("totalAllowed:", totalAllowed)
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
        const previousSelectedId = props.selectedGameId;
        const newSelectedId = id !== props.selectedGameId ? id : null;

        props.setSelectedGameId(null); // importante! dobbiamo cancellare il DOM prima di procedere

        console.log(`Game selection change: ${previousSelectedId} -> ${newSelectedId}`);

        // IMPORTANTE: Aggiungi un piccolo delay per permettere al createEffect di pulire
        // il DOM prima che il nuovo componente tenti di montare la sua view
        setTimeout(() => {
            props.setSelectedGameId(newSelectedId);
            console.log(`Game selection changed: ${newSelectedId}`);
        }, 10);
    };


    const Middle = styled("div")`
        /* display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        align-items: flex-start; */
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
        display: flex;
        flex-direction: column;
       
        /* background-color: #ff00aa; */
        flex: 1;
    `

    const ItemsContainer = styled("div")`
        display: flex;
        flex-wrap: wrap;
        gap: 1rem;
        /* align-items: flex-start; */
        /* background-color: #ffee00; */
    `

    const Bottom = styled("div")`
        display: flex;
        align-items: center;
        justify-content: center;
        /* background-color: red; */
        /* height: 60px; */
    `

    const StyledToggleButton = styled('div')`
        position: relative;
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
        background: ${props => props.isOn ? 'var(--color-primary)' : 'var(--color-background-transparent)'};
        border: none;
        /* pointer-events: ${(props) => (props.active ? "auto" : "none")}; */
        color: white;
        box-shadow: none;
        outline: none;
        z-index: 1;
        -webkit-tap-highlight-color: transparent;
        transition: background 0.05s, color 0.05s;
    `
    //#region [ToggleButton]
    const ToggleButton = (props) => {

        // const [isOn, setIson] = createSignal(props.isOn ?? false);

        const handleOnClick = () => {
            // setIson(!isOn());

            props.onToggle(props.id)
        }

        return (
            <StyledToggleButton
                data-interactive
                onClick={handleOnClick}
                style={props.style}
                class="glass"
                isOn={props.isOn}
            >
                {props.children}
            </StyledToggleButton>
        )
    };

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

                {/* LIST OF AVAILABLE AND RUNNING GAMES */}
                {context.appMode === "save" &&
                    <ItemsContainer>
                        {
                            props.gamesRunning.map(game => (
                                <ToggleButton
                                    id={game.id}
                                    onToggle={(id) => handleToggle(id)}
                                    isOn={game.id === props.selectedGameId}
                                >
                                    {getPluginTitle(game.name)}
                                </ToggleButton>
                            ))
                        }
                    </ItemsContainer>
                }

                {/* UI OF THE GAMES !!! */}
                <GameUI id="plugins-ui" />

            </Middle>

            {/* CATEGORY PICKER */}
            {context.appMode === "save" &&
                <Bottom data-interactive>
                    <CategoriesPicker
                        // visible={visible()}
                        visible={true}
                        currentCategoryName={currentCategoryName()}
                        onCategoryPicked={(name) => handleCategorySelected(name)}
                    ></CategoriesPicker>
                </Bottom>
            }
        </InventoryContainer>
    )
}

export default Inventory
