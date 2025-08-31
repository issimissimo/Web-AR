import { createEffect, createSignal } from 'solid-js';
import { useFirebase } from '@hooks/useFirebase';
import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';

import Header from '@components/Header';
import { Container, FitHeightScrollable, Title } from '@components/smallElements'
import Button from '@components/button';
import Message from '@components/Message';
import Loader from '@components/Loader';

import Fa from 'solid-fa';
import { faPlus, faEdit, faEye, faThumbsUp } from "@fortawesome/free-solid-svg-icons";




//
// STATISTICS
//

const StatisticsContainer = styled('div')`
    box-sizing: border-box;
    display: flex;
    width: 20%;
    border: none;
    background: #458dfa28;
    border-color: var(--color-secondary);
    color: var(--color-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 20px;
    font-size: 0.7rem;
    font-weight: 500;
    padding: 0.5rem;
  `;


const Statistic = (props) => {
  return (
    <StatisticsContainer>
      <Fa icon={props.icon} size="1x" translateX={-0.5} class="icon" />
      {props.children}
    </StatisticsContainer>
  )
}




//
// MARKER
//

const MarkerContainer = styled(Motion.div)`
    margin-top: 2rem;
  `;

const TimestampContainer = styled('div')`
  `;

const Timestamp = styled('p')`
    font-size: 0.7rem;
    color: var(--color-grey);
    margin: 0;
    font-weight: 500;
  `;

const NameContainer = styled('div')`
    box-sizing: border-box;
    color: var(--color-white);
    width: fit-content;
  `;

const Name = styled('p')`
    font-weight: 400;
    margin: 0;
    margin-top: 0.3rem;
  `;

const BottomContainer = styled('div')`
    box-sizing: border-box;
    display: flex;
    justify-content: space-between;
    width: 100%;
    margin-top: 0.5rem;
  `;

const EditButtonContainer = styled('div')`
    box-sizing: border-box;
    display: flex;
    width: 50%;
  `;


const Marker = (props) => {

  return (
    <MarkerContainer
      animate={{ opacity: [0, 1] }}
      transition={{ duration: 0.5, easing: "ease-in-out", delay: props.delay }}
    >

      <TimestampContainer>
        <Timestamp>{`${props.marker.created.toDate().toLocaleDateString()} ${props.marker.created.toDate().toLocaleTimeString()}`}</Timestamp>
      </TimestampContainer>

      <NameContainer class='glass'>
        <Name>{props.marker.name}</Name>
      </NameContainer>

      <BottomContainer>
        <Statistic icon={faEye}>10</Statistic>
        <Statistic icon={faThumbsUp}>2</Statistic>
        <EditButtonContainer>
          <Button
            active={true}
            small={true}
            onClick={props.onClick}
          >Modifica
            <Fa icon={faEdit} size="1x" translateX={1} class="icon" />
          </Button>
        </EditButtonContainer>
      </BottomContainer>

    </MarkerContainer>
  )
};






//
// MARKERLIST
//


const MarkersListContainer = styled('div')`
    width: 100%;
    flex: 1;
    overflow-y: auto;
    margin-bottom: 2rem;
  `;


const MarkersList = (props) => {

  const firebase = useFirebase();
  const [markers, setMarkers] = createSignal([]);
  const [loading, setLoading] = createSignal(false);


  createEffect(() => {
    if (firebase.auth.authLoading() || !firebase.auth.user()) return;

    setLoading(() => true);
    loadMarkers();
  });


  /**
  * Load all markers from Firestore
  */
  const loadMarkers = async () => {
    const data = await firebase.firestore.fetchMarkers(firebase.auth.user().uid);
    setMarkers(data);

    // hide the spinner
    setLoading(() => false);
  };


  return (
    <Container>

      {/* HEADER */}
      <Header
        showBack={false}
        onClickUser={props.goToUserProfile}
      />

      {/* TITLE */}
      <Title
        animate={{ opacity: [0, 1] }}
        transition={{ duration: 0.5, easing: "ease-in-out", delay: 0 }}
      >
        <span style={{ color: 'var(--color-secondary)' }}>I tuoi </span>
        <span style={{ color: 'var(--color-white)' }}>ambienti AR</span>
      </Title>

      {/* CONTENT */}
      {loading() ?

        <Loader/>

        :

        <FitHeightScrollable id="FitHeight"
          animate={{ opacity: [0, 1] }}
          transition={{ duration: 0.5, easing: "ease-in-out", delay: 0.25 }}
        >
          {markers().length === 0 ?

            <Message>
              Non hai ancora nessun ambiente.<br></br> Inizia creandone uno<br></br><br></br>
              Un ambiente AR è uno spazio fisico intorno a te in cui inserirai oggetti virtuali in realtà aumentata,<br></br>
              per essere visualizzati da altri nello stesso luogo.
            </Message>

            :

            <MarkersListContainer>
              {
                markers().map(marker => (
                  <Marker
                    marker={marker}
                    onClick={() => props.onMarkerClicked(marker)}
                  />
                ))
              }
            </MarkersListContainer>
          }

          {/* CREATE BUTTON */}
          <Button
            active={true}
            icon={faPlus}
            border={markers().length === 0 ? true : false}
            onClick={() => props.onCreateNewMarker()}
          >Crea nuovo
          </Button>
        </FitHeightScrollable>

      }
    </Container>
  );
};

export default MarkersList