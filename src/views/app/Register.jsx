import { createSignal } from "solid-js"
import { useFirebase } from "@hooks/useFirebase"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"

import Header from "./Header"

import { Title, SubTitle } from "@components/smallElements"
import InputField from "@components/inputField"
import Button from "@components/button"

import { faChevronRight } from "@fortawesome/free-solid-svg-icons"

const Register = (props) => {
    const firebase = useFirebase()
    const [email, setEmail] = createSignal("")
    const [password, setPassword] = createSignal("")
    const [confirmPassword, setConfirmPassword] = createSignal("")
    const [error, setError] = createSignal("")
    const [loading, setLoading] = createSignal(false)

    // Funzione di validazione email
    const isValidEmail = (value) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }

    // Funzione per validare il form
    const isFormValid = () => {
        return (
            isValidEmail(email()) &&
            password().length >= 6 &&
            password() === confirmPassword()
        )
    }

    // Logica di registrazione Firebase
    const handleSubmit = async (e) => {
        e.preventDefault()

        setError("")

        if (!email() || !password() || !confirmPassword()) {
            setError("Tutti i campi sono obbligatori")
            return
        }
        if (!isValidEmail(email())) {
            setError("Indirizzo email non valido")
            return
        }
        if (password() !== confirmPassword()) {
            setError("Le password non corrispondono")
            return
        }
        if (password().length < 6) {
            setError("La password deve essere di almeno 6 caratteri")
            return
        }

        setLoading(true)
        try {
            await firebase.auth.register({
                email: email(),
                password: password(),
            })
            setError("")
            props.onSuccess()
        } catch (error) {
            let errorMessage = error.message
            if (errorMessage.includes("email-already-in-use")) {
                errorMessage = "Questo indirizzo email è già registrato"
            } else if (errorMessage.includes("invalid-email")) {
                errorMessage = "Indirizzo email non valido"
            } else if (errorMessage.includes("weak-password")) {
                errorMessage = "La password è troppo debole"
            }
            setError(errorMessage)
            setLoading(false)
        }
        setLoading(false)
    }

    // Clear error on any input focus
    const handleInputFocus = () => setError("")

    const Container = styled(Motion.div)`
        box-sizing: border-box;
        max-width: 500px;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        z-index: 1;
    `

    const Form = styled(Motion.Form)`
        width: 100%;
        margin: 2rem auto;
        text-align: center;
    `

    const SubTitleStyled = styled(SubTitle)`
        text-align: center;
    `

    return (
        <Container>
            <Title>BeeAr</Title>
            <SubTitleStyled>Registrazione</SubTitleStyled>

            {/* Messaggio di errore */}
            {error() && (
                <div style={{ color: "var(--color-error)", margin: "1em 0" }}>
                    {error()}
                </div>
            )}

            <Form onSubmit={handleSubmit}>
                <InputField
                    style={{ "margin-top": "1rem" }}
                    type="email"
                    name="email"
                    label="Email"
                    value={email()}
                    onInput={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    required
                    error={error()}
                    data-error={!!error()}
                    onFocus={handleInputFocus}
                />
                <InputField
                    style={{ "margin-top": "1rem" }}
                    type="password"
                    name="password"
                    label="Password"
                    value={password()}
                    onInput={(e) => setPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    error={error()}
                    data-error={!!error()}
                    onFocus={handleInputFocus}
                />
                <InputField
                    style={{ "margin-top": "1rem" }}
                    type="password"
                    name="confirmPassword"
                    label="Ripeti password"
                    value={confirmPassword()}
                    onInput={(e) => setConfirmPassword(e.target.value)}
                    autoComplete="new-password"
                    required
                    error={error()}
                    data-error={!!error()}
                    onFocus={handleInputFocus}
                />

                <Button
                    // style={{ "margin-top": "2em" }}
                    active={isFormValid()}
                    disabled={loading()}
                    type="submit"
                    onClick={() => {}}
                >
                    {loading() ? "Registrazione in corso..." : "Registrati"}
                </Button>

                <p
                    style={{
                        "margin-top": "50px",
                        "font-size": "var(--font-size-medium)",
                        "font-family": "SebinoSoftLight",
                    }}
                >
                    Sei già registrato?
                </p>

                <Button
                    onClick={props.onGoToLogin}
                    icon={faChevronRight}
                    border={false}
                >
                    Accedi
                </Button>
            </Form>
            {/* <Button
                // style={{ "margin-top": "2em" }}
                active={isFormValid()}
                disabled={loading()}
                type="submit"
                onClick={() => {}}
            >
                {loading() ? "Registrazione in corso..." : "Registrati"}
            </Button>

            <p
                style={{
                    "margin-top": "50px",
                    "font-size": "var(--font-size-medium)",
                    "font-family": "SebinoSoftLight",
                }}
            >
                Sei già registrato?
            </p>

            <Button
                onClick={props.onGoToLogin}
                icon={faChevronRight}
                border={false}
            >
                Accedi
            </Button> */}
        </Container>
    )
}
export default Register
