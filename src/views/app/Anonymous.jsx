import { createSignal, onMount } from 'solid-js';
import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';

import { Container, Centered, BigTitle, FitHeight } from '@components/smallElements'
import Message from '@components/Message';

import { faSadCry } from '@fortawesome/free-solid-svg-icons';




//#region [Welcome]
const Welcome = (props) => {

  const ArButtonContainer = styled(Motion.div)`
    z-index: 1000;
  `;

  return (
    <Container>
      <BigTitle
        animate={{ opacity: [0, 1] }}
        transition={{ duration: 0.5, easing: "ease-in-out", delay: 0 }}
      >
        <span style={{ color: 'var(--color-secondary)' }}>Benvenuto</span>
      </BigTitle>
      <BigTitle
        animate={{ opacity: [0, 1] }}
        transition={{ duration: 0.5, easing: "ease-in-out", delay: 0.25 }}
      >
        <span style={{ color: 'var(--color-secondary)' }}>nella </span>
        <span style={{ color: 'var(--color-white)' }}>tua esperienza di</span>
      </BigTitle>
      <BigTitle
        color={'var(--color-primary)'}
        animate={{ opacity: [0, 1] }}
        transition={{ duration: 0.5, easing: "ease-in-out", delay: 0.5 }}
      >
        <span style={{ color: 'var(--color-primary)' }}>Realtà Aumentata</span>
      </BigTitle>


      <FitHeight>

      </FitHeight>


      <ArButtonContainer
        id="ArButtonContainer"
        animate={{ opacity: [0, 1] }}
        transition={{ duration: 1, easing: "ease-in-out", delay: 1 }}
      />
    </Container>
  )
}



//#region [Unavailable]
const Unavailable = () => {
  return (
    <Message
      icon={faSadCry}
      showReadMore={false}
    >
      Spiacenti, l'esperienza AR che stai cercando
      non è più disponibile.<br></br><br></br>
      Verifica il link o contatta chi ti ha condiviso
      questa esperienza per ottenere un nuovo collegamento.
    </Message>
  )
}



//#region [Main]
export default function Main(props) {
  const [markerValid, setMarkerValid] = createSignal(false)

  onMount(() => {

    if (props.marker.games != null) {


      if (props.marker.games.length > 0) {
        setMarkerValid(() => true);

        setTimeout(() => {
          props.initScene();
        }, 50)
      }
    }
  })

  return (
    <Centered>
      {
        markerValid() ?
          <Welcome />
          :
          <Unavailable />
      }
    </Centered>
  );
}