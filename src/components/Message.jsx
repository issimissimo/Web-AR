import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';
import Fa from 'solid-fa';
import { faExclamation, faChevronRight } from "@fortawesome/free-solid-svg-icons";
import Button from '@components/Button';
import ButtonSecondary from './ButtonSecondary';
import { faCheck } from "@fortawesome/free-solid-svg-icons";
import SvgIcon from './SvgIcon';



const MessageContainer = styled(Motion.div)`
    width: 100%;
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
    flex-direction: column;
  `;


const MessageBLock = styled('div')`
    box-sizing: border-box;
    width: 100%;
    display: flex;
    justify-content: center;
    color: var(--color-white-smoke);
    font-size: small;
    gap: 1rem;
    padding: 2rem;
    padding-top: 0;
    line-height: 180%;
  `;

const Message = (props) => {


  const handleGoToInstructions = () => {
    console.log("OPEN INSTRUCTIONS")
  }

  const Icon = () => (
    <Fa icon={props.icon} color={"var(--color-secondary)"} translateY={-0.5} size="3x" class="icon" />
  );

  const transitionDuration = props.fadeIn === false ? 0 : 0.5;
  const transitionDelay = props.fadeIn === false ? 0 : 0.5;

  return (
    <MessageContainer
      class={props.class}
      style={props.style}
      animate={{ opacity: [0, 1] }}
      transition={{ duration: transitionDuration, easing: "ease-in-out", delay: transitionDelay }}
    >
      {props.icon && <Icon />}
      {props.svgIcon && <SvgIcon src={props.svgIcon} color={'var(--color-secondary)'} size={65} translateY={-2} />}

      <MessageBLock>
        <Fa icon={faExclamation} color={"var(--color-secondary)"} size="2.5x" translateY={0.2} class="icon" />
        {props.children}
      </MessageBLock>

      {props.showReadMore === true && (
        <ButtonSecondary onClick={handleGoToInstructions}>
          Scopri di più
          <Fa icon={faChevronRight} size="1x" translateX={0.8} class="icon" />
        </ButtonSecondary>
      )}

      {props.showDoneButton && (
        <Button
          onClick={props.onDone}
          small={true}
          active={true}
          icon={faCheck}
          width={"65%"}
        >
          Ho capito
        </Button>
      )}

    </MessageContainer>
  )
}

export default Message