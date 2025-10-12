import { onMount, createSignal } from "solid-js"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"
import { useFirebase } from "@hooks/useFirebase"

import Header from "./Header"

import Button from "@components/Button"
import ButtonSecondary from "@components/ButtonSecondary"
import { Container, FitHeight, FitHeightScrollable, Title } from "@components/smallElements"

import Fa from "solid-fa"
import {
    faUser,
    faArrowRightFromBracket,
    faTrash,
    faUpload,
    faFile,
} from "@fortawesome/free-solid-svg-icons"

//region FILE ITEM
const FileItem = (props) => {
    const firebase = useFirebase()

    const handleDeleteFile = async () => {
        console.log("cancello:", props.filePath)
        await firebase.storage.deleteFile(props.filePath)
        props.onFileDeleted
    }

    const FileItemContainer = styled(Motion.div)`
        width: 100%;
        display: flex;
        align-items: center;
        box-sizing: border-box;
        box-sizing: border-box;
        padding: 0.3rem;
        margin-bottom: 1rem;
        border-radius: 20px;
        background: var(--color-dark-transparent);
    `

    const FileName = styled("p")`
        margin: 0;
        color: rgb(184, 184, 184);
        flex: 1;
    `
    const FileSize = styled("p")`
        font-size: small;
        margin: 0;
        padding-right: 1rem;
        color: grey;
    `

    return (
        <FileItemContainer class="glass">
            <ButtonSecondary onClick={() => handleDeleteFile(props.file.name)}>
                <Fa icon={faTrash} size="1x" class="icon" />
            </ButtonSecondary>
            <FileName>{props.file.name}</FileName>
            <FileSize>{(props.file.size / 1048576).toFixed(2)+"Mb"}</FileSize>
            
        </FileItemContainer>
    )
}

//region LABEL
const UploadButton = (props) => {
    const StyledLabel = styled("label")`
        position: relative;
        padding: 0.4rem;
        font-size: 1rem;
        font-weight: 700;
        font-family: inherit;
        border-radius: 90px;
        background: var(--color-primary-dark);
        color: white;
        text-align: center;
        font-family: "SebinoSoftMedium";
        /* pointer-events: ${(props) => (props.active ? "auto" : "none")}; */
    `

    const Icon = () => <Fa icon={faUpload} size="1x" translateX={1} class="icon" />

    return (
        <StyledLabel>
            {props.children}
            {props.showIcon && <Icon />}
        </StyledLabel>
    )
}

//region USER PROFILE
const UserProfile = (props) => {
    const firebase = useFirebase()

    const [uploadedFiles, setUploadedFiles] = createSignal([])
    const [selectedFile, setSelectedFile] = createSignal(null)
    const [uploading, setUploading] = createSignal(false)
    const [progress, setProgress] = createSignal(0)
    const [uploadedURL, setUploadedURL] = createSignal(null)
    const [error, setError] = createSignal(null)

    const path = `users/${props.user.uid}/uploads`

    onMount(() => {
        console.log(props.user)
        refreshFileList()
    })

    const refreshFileList = async () => {
        const files = await firebase.storage.listFiles(path)
        if (files) {
            setUploadedFiles(files)
            console.log(uploadedFiles())
        }
    }

    const handleFileSelect = (event) => {
        const file = event.target.files[0]
        if (file) {
            setSelectedFile(file)
            setUploadedURL(null)
            setError(null)
            console.log(
                "File selezionato:",
                file.name,
                "Dimensione:",
                file.size,
                "Tipo:",
                file.type
            )
            handleUpload()
        }
    }

    const handleUpload = async () => {
        const file = selectedFile()
        if (!file) {
            setError("Nessun file selezionato")
            return
        }

        // const user = auth.user()
        // if (!user) {
        //     setError("Utente non autenticato")
        //     return
        // }

        setUploading(true)
        setError(null)
        setProgress(0)

        try {
            // Crea un percorso unico usando timestamp
            const timestamp = Date.now()
            const fileName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_") // Sanitizza il nome
            const path = `users/${props.user.uid}/uploads/${fileName}`

            console.log("Inizio upload su percorso:", path)

            // Upload con monitoraggio progresso
            const url = await firebase.storage.uploadFileWithProgress(
                path,
                file,
                (prog) => {
                    setProgress(Math.round(prog))
                    console.log(`Progresso upload: ${Math.round(prog)}%`)
                }
                // {
                //     contentType: file.type,
                //     customMetadata: {
                //         uploadedBy: props.user.uid,
                //         uploadedAt: new Date().toISOString(),
                //         originalName: file.name,
                //     },
                // }
            )

            setUploadedURL(url)
            console.log("Upload completato! URL:", url)
        } catch (err) {
            console.error("Errore durante l'upload:", err)
            setError(err.message || "Errore durante l'upload")
        } finally {
            setUploading(false)
            refreshFileList()
        }
    }

    const handleLogout = async () => {
        await firebase.auth.logout()
        props.onLogout()
    }

    //region RENDER

    const EmailContainer = styled("div")`
        width: 100%;
        display: flex;
        justify-content: center;
    `

    const Email = styled("p")`
        font-size: 1rem;
    `

    const FileItemsContainer = styled("div")`
        margin-top: 2rem;
        display: flex;
        flex-direction: column;
        align-items: center;
    `

    return (
        <Container id="Container">
            {/* HEADER */}
            <Header showUser={false} showBack={true} onClickBack={props.onBack}>
                <span style={{ color: "var(--color-secondary)" }}>I tuoi </span>
                <span style={{ color: "var(--color-white)" }}>dati</span>
            </Header>

            {props.user ? (
                <FitHeightScrollable id="FitHeight">
                    <FitHeightScrollable
                        id="FitHeightScrollable"
                        style={{ "margin-top": "2rem", "margin-bottom": "1rem" }}
                    >
                        <Fa icon={faUser} size="2x" class="icon" color={"var(--color-secondary)"} />
                        <EmailContainer>
                            <Email>{props.user.email}</Email>
                        </EmailContainer>
                        <Button
                            active={true}
                            border={false}
                            icon={faArrowRightFromBracket}
                            onClick={handleLogout}
                        >
                            Logout
                        </Button>

                        {/* <Title>File caricati</Title> */}
                        <FileItemsContainer>
                            <Fa
                                icon={faFile}
                                size="2x"
                                class="icon"
                                color={"var(--color-secondary)"}
                            />
                            <div style={{ height: "1rem" }}></div>

                            {uploadedFiles()?.map((file) => (
                                <FileItem
                                    file={file}
                                    fileName={file.name}
                                    filePath={path + "/" + file.name}
                                    onFileDeleted={refreshFileList()}
                                />
                            ))}
                        </FileItemsContainer>
                    </FitHeightScrollable>

                    <UploadButton showIcon={!uploading()}>
                        {uploading() ? progress() + "%" : "Carica nuovo file"}
                        <input
                            type="file"
                            onChange={handleFileSelect}
                            style={{ display: "none" }}
                            accept=".glb, .gltf, .GLB, .GLTF"
                        />
                    </UploadButton>
                </FitHeightScrollable>
            ) : (
                <div />
            )}
        </Container>
    )
}

export default UserProfile
