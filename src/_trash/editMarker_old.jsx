import { createSignal, createEffect, onMount } from 'solid-js';
import { useFirebase } from '@hooks/useFirebase';
import { generateQRCodeForForMarker } from '@hooks/useQRCode';
import { styled } from 'solid-styled-components';

//UI
import { Button, BUTTON_MODE, ArButtonContainer, BackButton } from '@/ui';
import { faTrashAlt, faSave } from '@fortawesome/free-solid-svg-icons';

// Games
import { PLUGINS_LISTING } from '@games/common';


export default function EditMarker(props) {


  //#region [constants]
  const firebase = useFirebase();
  const [markerId, setMarkerId] = createSignal(props.marker.id)
  const [markerName, setMarkerName] = createSignal(props.marker?.name || '');
  const [oldMarkerName, setOldMarkerName] = createSignal(props.marker?.name || '');
  const [canSave, setCanSave] = createSignal(false);
  const [empty, setEmpty] = createSignal(false);



  //#region [lifeCycle]
  onMount(() => {
    if (props.marker.id) {
      if (props.marker.games.length > 0) {
        generateQRCodeForForMarker(props.userId, props.marker.id);



        console.log("--------------")
        console.log("Questo marker ha i seguenti games:")

        props.marker.games.forEach((el) => {

          console.log(el)

          const created = el.created;
          const createdDate = created.toDate();
          const formattedDate = `${createdDate.toLocaleDateString()} ${createdDate.toLocaleTimeString()}`;
          console.log("CREATED AT:", formattedDate);

          const fileName = el.name;

          const game = PLUGINS_LISTING.find(g => g.fileName === fileName);
          const title = game?.title || '';
          const description = game?.description || '';
          const allowed = game?.allowed;

          console.log("TITLE:", title, "DESCRIPTION:", description, "ALLOWED:", allowed)
          

        })

        console.log("--------------")





        return;
      }
    }
    setEmpty(() => true);
  })

  createEffect(() => {
    // Enable save button only if the name change
    setCanSave(() => markerName() !== "" && markerName() !== oldMarkerName() ? true : false);
  })


  createEffect(() => {
    // Create AR Button
    // only if it's not a new marker
    if (markerId() !== null) props.initScene();
  })




  //#region [functions]
  /**
  * Create a new empty marker, only in firebase
  * (games should be created later on)
  */
  const createMarker = async () => {
    const newMarkerId = await firebase.firestore.addMarker(props.userId, markerName());
    setMarkerId(() => newMarkerId);
    props.onNewMarkerCreated(newMarkerId, markerName);
    setOldMarkerName(() => markerName());
    console.log('Creato in Firestore il marker con ID:', newMarkerId)
  };


  /**
  * Update marker name
  */
  const updateMarkerName = async () => {
    await firebase.firestore.updateMarker(props.userId, props.marker.id,
      markerName());
    setOldMarkerName(() => markerName());
  }


  /**
  * Delete a marker,
  * both from firebase and its JSON from RealTime DB,
  * and go back to Home
  */
  const deleteMarker = async () => {
    await firebase.firestore.deleteMarker(props.userId, props.marker.id);
    if (!empty()) {
      const path = `${props.userId}/${props.marker.id}`;
      await firebase.realtimeDb.deleteData(path);
      goBack();
    }
    else goBack();
  };


  /**
  * Return to marker list
  */
  const goBack = () => {
    props.onBack();
  }




  //#region [style]
  const Container = styled('div')`
        max-width: 28rem;
        margin: 0 auto;
        padding: 1.5rem;
        display: flex;
        /* flex-direction: column; */
        /* max-width: 28rem; */
        margin: 0 auto;
        /* padding: 1.5rem; */
        
        border-radius: 0.5rem;
        
        min-height: 500px;
        margin-top: 50px;
        justify-content: center;
    `

  const Form = styled('form')`
        display: flex;
        flex-direction: column;
        width: 100%;
        align-items: center;
    `

  const Title = styled('input')`
        width: 90%;
        padding: 0.75rem;
        margin-bottom: 1rem;
        border-radius: 12px;
        font-size: 1rem;
        text-align: center;
    `

  const QrCodeContainer = styled('div')`
        width: 60%;
        display: flex;
    `

  const QrCodeImg = styled('img')`
        text-align: center;
    `

  const GameNameContainer = styled('div')`
        padding: 20px;
    `


  //#region [return]
  return (
    <Container id="editMarker">

      <BackButton onClick={() => goBack()} />

      <Form>
        <Title id="title"
          type="text"
          value={markerName()}
          onInput={(e) => setMarkerName(() => e.target.value)}
          placeholder="Nome"
          required
        />

        {/* <div>
          {Interactables.map(el => (
            <button
            >
              {el.name.charAt(0).toUpperCase() + el.name.slice(1)}
            </button>
          ))}
        </div> */}

        <div>
          {props.marker.games && props.marker.games.map(el => (
            <GameNameContainer
            >
              {el.name}
            </GameNameContainer>
          ))}
        </div>



        <QrCodeContainer>
          {empty() ?
            <p>No games here!</p>
            :
            <QrCodeImg id="qr-code" />
          }
        </QrCodeContainer>

        <Button
          type="button"
          onClick={props.marker.id ? updateMarkerName : createMarker}
          active={canSave()}
          mode={BUTTON_MODE.HIGHLIGHT}
          icon={faSave}
        >
          Salva
        </Button>

        {markerId() && (
          <Button
            onClick={deleteMarker}
            active={true}
            mode={BUTTON_MODE.DANGER}
            icon={faTrashAlt}
          >
            Elimina
          </Button>
        )}
      </Form>

      <ArButtonContainer id="ArButtonContainer" />
    </Container>
  );
}