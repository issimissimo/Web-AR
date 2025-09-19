import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';
import Fa from 'solid-fa';

const StyledButton = styled(Motion.button)`
  position: relative;
  display: ${props => props.visible ? 'block' : 'none'};
  width: 40px;
  height: 40px;
  padding: ${props => props.small ? "0" : "0.7rem"};
  border-radius: 50%;
  background: var(--color-background-transparent);
  border: ${props => props.border ? "1px solid" : "none"};
  border-color: var(--color-white);
  pointer-events: ${props => props.active ? 'auto' : 'none'};
  color: var(--color-white);
  box-shadow: none;
  outline: none;
  z-index: 1;
  -webkit-tap-highlight-color: transparent;
  transition: background 0.05s, color 0.05s;
  &:focus {
    outline: none;
    border-color: var(--color-white);
    /* background: transparent; */
  }
  &:active {
    background: var(--color-grey-dark);
    color: var(--color-background);
    border-color: var(--color-white);
  }
  `;


const ButtonCircle = (props) => {

  const handleOnClick = () => {
    setTimeout(() => {
      if (typeof props.onClick === "function") {
        props.onClick();
      }
    }, 250);
  }

  const Icon = () => (
    <Fa icon={props.icon} size="1x" class="icon" />
  );

  return (
    <StyledButton
      onClick={handleOnClick}
      active={props.active ?? true}
      visible={props.visible ?? true}
      border={props.border ?? true}
      class="glass"
      style={props.style}
      animate={{ opacity: props.active || props.active === undefined ? 1 : 0.25 }}
      transition={{ duration: 0.25 }}
      initial={false}
    >
      {props.children}
      {props.icon && <Icon />}
    </StyledButton>
  );
};

export default ButtonCircle