import { onMount, createSignal } from 'solid-js';
import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';
import ButtonCircle from './ButtonCircle';
import Fa from 'solid-fa';
import { faUser, faChevronLeft } from "@fortawesome/free-solid-svg-icons";
import { Title } from '@components/smallElements'


const HeaderContainer = styled('div')`
    margin-top: 0;
    margin-bottom: 0;
    display: flex;
    justify-content: space-between;
    align-items: center;
    height: 40px;
  `;



const LeftButtonContainer = styled('div')`
    display: flex;
    justify-content: flex-start;
  `;

const RightButtonContainer = styled('div')`
    display: flex;
    justify-content: flex-end;
  `;


const Header = (props) => {

    const [showUser, setShowUser] = createSignal(props.showUser ?? true);
    const [showBack, setShowBack] = createSignal(props.showBack ?? true);

    return (
        <HeaderContainer>

            <div style="">
                {
                    showBack() &&
                    <LeftButtonContainer >
                        <ButtonCircle
                            onClick={props.onClickBack}
                            border={false}
                        >
                            <Fa icon={faChevronLeft} size="1x" class="icon" />
                        </ButtonCircle>
                    </LeftButtonContainer>
                }

            </div>
            <Title>{props.children}</Title>

            <div style="flex: 1;">
                {
                    showUser() &&
                    <RightButtonContainer>
                        <ButtonCircle
                            onClick={props.onClickUser}
                            border={false}
                        >
                            <Fa icon={faUser} size="1x" class="icon" />
                        </ButtonCircle>
                    </RightButtonContainer>
                }

            </div>

        </HeaderContainer>
    )
}

export default Header