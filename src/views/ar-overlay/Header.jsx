import { onMount, createSignal } from 'solid-js';
import { styled } from 'solid-styled-components';
import ButtonCircle from '../../components/ButtonCircle';
import Fa from 'solid-fa';
import { faClose } from "@fortawesome/free-solid-svg-icons";
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

    return (
        <HeaderContainer>
            <Title
                color={"var(--color-secondary)"}
            >
                {props.children}
            </Title>
            <div>
                {
                    <RightButtonContainer >
                        <ButtonCircle
                            onClick={props.onClickBack}
                            border={false}
                        >
                            <Fa icon={faClose} size="1x" class="icon" />
                        </ButtonCircle>
                    </RightButtonContainer>
                }

            </div>
        </HeaderContainer>
    )
}

export default Header