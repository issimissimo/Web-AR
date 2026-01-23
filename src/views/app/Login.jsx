import { createSignal } from "solid-js"
import { useFirebase } from "@hooks/useFirebase"
import { styled } from "solid-styled-components"
import { Motion } from "solid-motionone"

import InputField from "@components/inputField"
import Button from "@components/button"
import { Title, SubTitle } from "@components/smallElements"

import { faChevronRight } from "@fortawesome/free-solid-svg-icons"
import { config } from "@js/config"

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
const SubTitleStyled = styled(SubTitle)`
    text-align: center;
    width: 90%;
    margin-top: 0.5rem;
    font-family: 'SebinoSoftLight';
    color: var(--color-primary);
`

const Login = (props) => {
    const { auth } = useFirebase()
    const [email, setEmail] = createSignal("")
    const [password, setPassword] = createSignal("")
    const [error, setError] = createSignal("")
    const [loading, setLoading] = createSignal(false)

    // Funzione di validazione email
    const isValidEmail = (value) => {
        return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
    }

    // Funzione per validare il form
    const isFormValid = () => {
        return isValidEmail(email()) && password().length > 0
    }

    const handleLogin = async (e) => {
        // e.preventDefault();
        if (!email() || !password()) {
            setError("Email e/o password non validi.")
            return
        }
        setError("")
        setLoading(true)

        try {
            await auth.login({ email: email(), password: password() })
            setLoading(false)
            props.onSuccess()
        } catch (error) {
            let errorMessage = error.message
            if (errorMessage.includes("invalid-credential")) {
                errorMessage = "Email o password non validi"
            } else if (errorMessage.includes("wrong-password")) {
                errorMessage = "Password errata"
            } else if (errorMessage.includes("too-many-requests")) {
                errorMessage = "Troppi tentativi falliti. Riprova più tardi"
            } else if (errorMessage.includes("invalid-email")) {
                errorMessage = "Formato email non valido"
            } else if (errorMessage.includes("user-disabled")) {
                errorMessage = "Account disabilitato"
            }
            setError(errorMessage)
            setLoading(false)
        }
    }

    const Form = styled(Motion.Form)`
        width: 100%;
        margin: 2rem auto;
        margin-bottom: 1rem;
    `

    const ButtonsContainer = styled(Motion.div)`
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        width: 100%;
    `

    // Clear error on any input focus
    const handleInputFocus = () => setError("")

    return (
        <Container>
            <Title
                animate={{ opacity: [0, 1] }}
                transition={{
                    duration: config.ui.enterDuration,
                    easing: "ease-in-out",
                    delay: 0,
                }}
            >
                <span style={{"color": "var(--color-secondary)"}}>Bee</span><span>Ar</span>
            </Title>
            <SubTitleStyled
                animate={{ opacity: [0, 1] }}
                transition={{
                    duration: config.ui.enterDuration,
                    easing: "ease-in-out",
                    delay: config.ui.enterDelay,
                }}
            >
                Le tue idee<br></br>in <span style={{"color": "var(--color-secondary)"}}>AR</span> 
            </SubTitleStyled>
            <Form
                onSubmit={handleLogin}
                animate={{ opacity: [0, 1] }}
                transition={{
                    duration: config.ui.enterDuration,
                    easing: "ease-in-out",
                    delay: config.ui.enterDelay * 2,
                }}
            >
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
                    style={{ "margin-top": "2rem" }}
                    type="password"
                    name="password"
                    label="Password"
                    value={password()}
                    onInput={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    required
                    error={error()}
                    data-error={!!error()}
                    onFocus={handleInputFocus}
                />
            </Form>

            <ButtonsContainer
                animate={{ opacity: [0, 1] }}
                transition={{
                    duration: config.ui.enterDuration,
                    easing: "ease-in-out",
                    delay: config.ui.enterDelay * 3,
                }}
            >
                <Button
                    onClick={handleLogin}
                    // style={{ "margin-top": "2em" }}
                    active={isFormValid()}
                >
                    {loading() ? "Accesso in corso..." : "Accedi"}
                </Button>

                <p
                    style={{
                        "margin-top": "50px",
                        "font-size": "var(--font-size-medium)",
                        "font-family": "SebinoSoftLight",
                        // "color": "var(--color-secondary)"
                    }}
                >
                    Non sei registrato?
                </p>

                <Button
                    onClick={props.onGoToRegister}
                    icon={faChevronRight}
                    border={false}
                >
                    Registrati
                </Button>
            </ButtonsContainer>
        </Container>
    )
}
export default Login
