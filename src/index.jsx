import { loadConfig } from './js/config';
import { render } from 'solid-js/web'
import App from './app.jsx'


loadConfig().then(() => {
  render(() => <App />, document.getElementById('app'))
})