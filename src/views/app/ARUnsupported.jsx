import { onMount } from 'solid-js';
import { styled } from 'solid-styled-components';
import { Motion } from 'solid-motionone';
import { faSadCry } from '@fortawesome/free-solid-svg-icons';
import { init } from '@hooks/useQRCode';

import { Centered } from '@components/smallElements'
import Message from '@components/Message';

const QrCodeContainer = styled(Motion.div)`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 1rem;
`;

const QrCodeImg = styled('img')`
        text-align: center;
        z-index: 99;
        width: 150px;
    `


export default function ARUnsupported() {

  onMount(() => {
    // create Qr Code
    init();
  });

  return (
    <Centered>

      <div>
        <Message
          icon={faSadCry}
        >
          Purtroppo questo dispositivo non è compatibile per questa app! <br></br>
          Scansiona il Qr Code con un dispositivo compatibile Android con Chrome, o iOS con Safari, per vivere
          l'esperienza di realtà aumentata.
        </Message>
      </div>

      <div>
        <QrCodeContainer
          animate={{ opacity: [0, 1] }}
          transition={{ duration: 1, easing: "ease-in-out", delay: 0.5 }}>
          <QrCodeImg id="qr-code" />
        </QrCodeContainer>
      </div>

    </Centered>
  );
}