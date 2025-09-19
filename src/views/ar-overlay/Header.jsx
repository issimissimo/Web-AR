import { onMount, createSignal } from 'solid-js';
import { styled } from 'solid-styled-components';
import ButtonCircle from '../../components/ButtonCircle';
import Fa from 'solid-fa';
import { faClose } from "@fortawesome/free-solid-svg-icons";



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

    // const [showUser, setShowUser] = createSignal(props.showUser ?? true);

    return (
        <HeaderContainer>
            <div>
                {
                    <LeftButtonContainer >
                        <ButtonCircle
                            onClick={props.onClickBack}
                            border={false}
                        >
                            <Fa icon={faClose} size="1x" class="icon" />
                        </ButtonCircle>
                    </LeftButtonContainer>
                }

            </div>
        </HeaderContainer>
    )
}

export default Header