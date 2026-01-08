import { styled } from "solid-styled-components"
import ButtonCircle from "../../components/ButtonCircle"
import Fa from "solid-fa"
import { faClose } from "@fortawesome/free-solid-svg-icons"


const HeaderContainer = styled("div")`
    margin-top: 0;
    margin-bottom: 0;
    display: flex;
    justify-content: space-between;
    height: 40px;
    padding: 1rem;
`

const Header = (props) => {
    return (
        <HeaderContainer>
            <ButtonCircle onClick={props.onClickBack} border={false}>
                <Fa icon={faClose} size="1x" class="icon" />
            </ButtonCircle>
        </HeaderContainer>
    )
}

export default Header
