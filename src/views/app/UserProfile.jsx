import { onMount, createSignal } from 'solid-js';
import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';
import { useFirebase } from '@hooks/useFirebase';

import Header from '@components/Header';
import Button from '@components/Button';
import { Container, FitHeight, Title } from '@components/smallElements'

import Fa from 'solid-fa';
import { faUser, faArrowRightFromBracket } from "@fortawesome/free-solid-svg-icons";




const EmailContainer = styled('div')`
    width: 100%;
    display: flex;
    justify-content: center;
  `;

const Email = styled('p')`
    font-size: 1rem;
  `;


const UserProfile = (props) => {

    const firebase = useFirebase();

    onMount(() => {
        console.log(props.user)
    })


    const handleLogout = async () => {
        await firebase.auth.logout();
        props.onLogout();
    };


    return (
        <Container>

            {/* HEADER */}
            <Header
                showUser={false}
                showBack={true}
                onClickBack={props.onBack}
            >
                <span style={{ color: 'var(--color-secondary)' }}>Il tuo </span>
                <span style={{ color: 'var(--color-white)' }}>account</span>
            </Header>

           
            {/* <Title
                animate={{ opacity: [0, 1] }}
                transition={{ duration: 0.5, easing: "ease-in-out", delay: 0 }}
            >
                <span style={{ color: 'var(--color-secondary)' }}>Il tuo </span>
                <span style={{ color: 'var(--color-white)' }}>account</span>
            </Title> */}

            {props.user ?
                <FitHeight>
                    <FitHeight style={{ "margin-top": "2rem", "margin-bottom": "1rem" }}>
                        <Fa icon={faUser} size="2x" class="icon" />
                        <EmailContainer>
                            <Email>{props.user.email}</Email>
                        </EmailContainer>
                    </FitHeight>

                    <Button
                        active={true}
                        border={false}
                        icon={faArrowRightFromBracket}
                        onClick={handleLogout}
                    >Logout</Button>
                </FitHeight>

                :

                <div />
            }

        </Container>
    )
}

export default UserProfile