import {
    onMount,
    createSignal,
    createMemo,
} from "solid-js"
import { useGame } from "@js/gameBase"
import { styled } from "solid-styled-components"
import SceneManager from "@js/sceneManager"
import { HDRLoader } from "three/examples/jsm/loaders/HDRLoader"
import { EquirectangularReflectionMapping } from "three"
import Toolbar from "@views/ar-overlay/Toolbar"

export default function envMapBasic(props) {
    const [index, setIndex] = createSignal(0)
    const [lastSavedGameData, setLastSavedGameData] = createSignal({})
    let files
    const hdrLoader = new HDRLoader()

    /*
     * Put here derived functions from Game
     */
    const { game } = useGame("envMapBasic", props.id, {
        onTap: () => {},

        renderLoop: () => {},

        close: () => {},
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
        const filePath = "images/hdr/" + game.gameData().fileName
        hdrLoader.load(filePath, (envMap) => {
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

    /*
     * STYLE
     */
    const Container = styled("div")`
        width: 100%;
        height: 100%;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
    `

    /*
     * RENDER
     */

    const renderView = () => {
        return (
            <>
                {props.selected && (
                    <>
                        <Container>
                            <div
                                style={{
                                    display: "flex",
                                    "align-items": "center",
                                    gap: "1rem",
                                }}
                            >
                                <button onClick={prev}>⬅</button>
                                <span style={{ "font-size": "1.2rem" }}>
                                    {files[index()]}
                                </span>
                                <button onClick={next}>➡</button>
                            </div>
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
