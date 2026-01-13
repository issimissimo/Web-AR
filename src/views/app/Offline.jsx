import { faLinkSlash } from '@fortawesome/free-solid-svg-icons';
import { Centered } from '@components/smallElements'
import Message from '@components/Message';

export default function Offline() {

  return (
    <Centered>
      <div>
        <Message
          icon={faLinkSlash}
        >
          Sembra che tu sia offline. Controlla la tua connessione Internet.
        </Message>
      </div>
    </Centered>
  );
}