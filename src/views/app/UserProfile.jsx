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
} from "@fortawesome/free-solid-svg-icons"

const EmailContainer = styled("div")`
    width: 100%;
    display: flex;
    justify-content: center;
`

const Email = styled("p")`
    font-size: 1rem;
`

//region FILE ITEM
const FileItem = (props) => {
    const firebase = useFirebase()

    const handleDeleteFile = async () => {
        console.log("cancello:", props.filePath)
        await firebase.storage.deleteFile(props.filePath);
        props.onFileDeleted;
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
    `

    const FileName = styled("p")`
        font-size: small;
        padding-left: 1rem;
        margin: 0;
        /* color: ${(props) =>
            props.enabled ? "var(--color-white)" : "var(--color-grey-dark)"}; */
        flex: 1;
    `

    return (
        <FileItemContainer class="glass">
            <ButtonSecondary onClick={() => handleDeleteFile(props.fileName)}>
                <Fa icon={faTrash} size="1x" class="icon" />
            </ButtonSecondary>
            <FileName>{props.fileName}</FileName>
        </FileItemContainer>
    )
}

//region USER PROFILE
const UserProfile = (props) => {
    const firebase = useFirebase()
    const [uploadedFiles, setUploadedFiles] = createSignal([])
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

    const handleLogout = async () => {
        await firebase.auth.logout()
        props.onLogout()
    }

    return (
        <Container>
            {/* HEADER */}
            <Header showUser={false} showBack={true} onClickBack={props.onBack}>
                <span style={{ color: "var(--color-secondary)" }}>I tuoi </span>
                <span style={{ color: "var(--color-white)" }}>dati</span>
            </Header>

            {props.user ? (
                <FitHeight>
                    <FitHeightScrollable style={{ "margin-top": "2rem", "margin-bottom": "1rem" }}>
                        <Fa icon={faUser} size="2x" class="icon" />
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

                        <Title>File caricati</Title>

                        {uploadedFiles()?.map((file) => (
                            <FileItem
                                fileName={file.name}
                                filePath={path + "/" + file.name}
                                onFileDeleted={refreshFileList()}
                            />
                        ))}
                    </FitHeightScrollable>

                    <Button active={true} border={false} icon={faUpload} onClick={handleLogout}>
                        Carica file
                    </Button>
                </FitHeight>
            ) : (
                <div />
            )}
        </Container>
    )
}

export default UserProfile
