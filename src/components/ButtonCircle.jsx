import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';
import Fa from 'solid-fa';

const StyledButton = styled(Motion.button)`
  position: relative;
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  width: ${props => props.size ?? '40px'};
  height: ${props => props.size ?? '40px'};
  padding: ${props => props.small ? "0" : "0.7rem"};
  border-radius: 50%;
  background: ${props => 
    props.highlight 
      ? 'var(--color-primary)'
      : props.theme === "light"
        ? 'var(--color-background-transparent)'
        : props.theme === "dark"
          ? 'var(--color-dark-transparent)'
          : 'var(--color-background-transparent)'
  };
  border: ${props => props.border ? "1px solid" : "none"};
  border-color: var(--color-white);
  pointer-events: ${props => props.active ? 'auto' : 'none'};
  opacity: ${props => props.active ? 1 : 0.25};
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
      size={props.size}
      highlight={props.highlight}
      theme={props.theme ?? "light"}
      // danger={props.danger ?? false}
      class="glass"
      style={props.style}
    >
      {props.children}
      {props.icon && <Icon />}
    </StyledButton>
  );
};

export default ButtonCircle