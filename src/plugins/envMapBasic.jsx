import { onMount, createSignal, createMemo, createEffect, on } from "solid-js"
import { useGame } from "@js/gameBase"
import { styled } from "solid-styled-components"
import SceneManager from "@js/sceneManager"
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader"
import { EquirectangularReflectionMapping } from "three"
import Toolbar from "@views/ar-overlay/Toolbar"
import {
    faChevronLeft,
    faChevronRight,
} from "@fortawesome/free-solid-svg-icons"
import ButtonCircle from "@components/ButtonCircle"
import Fa from "solid-fa"
import Reticle from "@js/reticle"


export default function envMapBasic(props) {
    const [index, setIndex] = createSignal(0)
    const [loading, setLoading] = createSignal(false)
    const [lastSavedGameData, setLastSavedGameData] = createSignal({})
    let files
    const hdrLoader = new HDRLoader()

    /*
     * Put here derived functions from Game
     */
    const { game } = useGame("envMapBasic", props.id, {
        onTap: () => { },

        renderLoop: () => { },

        close: () => { },
    })

    /*
     * On mount
     */
    onMount(async () => {
        files = await listFiles("hdr/list.json")

        // load data
        await game.loadGameData()

        // set default data if no data are saved
        if (!game.gameData()) {
            console.log(">>>>>>>>>>>>> NESSUN DATO DA CARICARE!!!")
            const newData = {
                fileName: files[index()],
                exposure: 1,
            }
            game.setGameData(newData)
        } else {
            const newIndex = files.findIndex(
                (el) => el === game.gameData().fileName
            )
            setIndex(newIndex)
        }

        // reset
        setLastSavedGameData(() => game.gameData())

        // load hdr
        loadEnv(() => {
            /*
             * Don't forget to call "game.setInitialized()" at finish
             */
            game.setInitialized()
        })
    })

    const next = () => {
        setIndex((i) => (i + 1) % files.length)
        finalize()
    }
    const prev = () => {
        setIndex((i) => (i - 1 + files.length) % files.length)
        finalize()
    }

    const finalize = () => {
        const newData = {
            fileName: files[index()],
            exposure: game.gameData().exposure,
        }
        game.setGameData(newData)
        loadEnv()
    }

    const hasUnsavedChanges = createMemo(
        () =>
            JSON.stringify(game.gameData()) !==
            JSON.stringify(lastSavedGameData())
    )

    const handleSave = async () => {
        // save data
        await game.saveGameData()
        // reset
        setLastSavedGameData(game.gameData())
    }

    function loadEnv(callback = null) {
        setLoading(true)
        const filePath = "images/hdr/" + game.gameData().fileName
        hdrLoader.load(filePath, (envMap) => {
            setLoading(false)
            envMap.mapping = EquirectangularReflectionMapping
            SceneManager.scene.environment = envMap
            SceneManager.scene.environmentIntensity = game.gameData().exposure

            const defaultLight =
                SceneManager.scene.getObjectByName("defaultLight")
            if (defaultLight) {
                SceneManager.scene.remove(SceneManager.light)
                console.log("******************defaultLight rimossa!")
            }
            callback?.()
        })
    }

    async function listFiles(folderUrl) {
        const res = await fetch(folderUrl)
        if (!res.ok) throw new Error("Errore nel caricamento dei file")
        return await res.json() // array di nomi file
    }

    //region RETICLE AND BLURRED COVER

    createEffect(
        on(
            () => [props.enabled, props.selected],
            ([enabled, selected]) => {
                if (
                    (game.appMode === "load" &&
                        enabled && game.gameDetails.interactable) ||
                    (game.appMode === "save" && selected)
                ) {
                    console.log("ADESSO DEVO SETTARE RETICLE PER ENVMAP")
                    Reticle.setEnabled(false);
                    game.handleBlurredCover({
                        visible: false,
                    })
                }
            }
        )
    )


    // region RENDER

    const Container = styled("div")`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    `

    const SliderContainer = styled("div")`
        width: 100%;
        display: flex;
        justify-content: space-between;
        align-items: center;
    `

    const FileNameContainer = styled("div")`
        font-size: small;
        font-weight: 500;
        padding: 1rem;
        padding-top: 0.5rem;
        padding-bottom: 0.5rem;
        border-radius: 90px;
    `

    const renderView = () => {
        return (
            <>
                {props.selected && (
                    <>
                        <Container>
                            <SliderContainer data-interactive>
                                <ButtonCircle onClick={prev} border={false} theme={'dark'}>
                                    <Fa
                                        icon={faChevronLeft}
                                        size="1x"
                                        class="icon"
                                    />
                                </ButtonCircle>
                                <FileNameContainer class="glass">
                                    {loading()
                                        ? "caricamento..."
                                        : files[index()]}
                                </FileNameContainer>
                                <ButtonCircle onClick={next} border={false} theme={'dark'}>
                                    <Fa
                                        icon={faChevronRight}
                                        size="1x"
                                        class="icon"
                                    />
                                </ButtonCircle>
                            </SliderContainer>
                        </Container>

                        <Toolbar
                            buttons={["save"]}
                            onSave={handleSave}
                            saveActive={hasUnsavedChanges()}
                        />
                    </>
                )}
            </>
        )
    }

    // Delegate mounting to the shared game hook
    game.mountView(renderView)
}
