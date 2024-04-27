import { h, render } from 'preact';
import htm from 'htm';
import { createPreactSignal } from './live-signals.js';

const [commentSignal, dispatchEvent] = createPreactSignal({ 
  url: 'ws://localhost:4000/live_state',
  topic: 'comments:all',
  initialValue: [],
  path: 'comments'
});
const html = htm.bind(h);

function Comments(props) {
  let comment = '';
  const onInput = event => (comment = event.currentTarget.value);
  const onClick = () => dispatchEvent(new CustomEvent('add-comment', { detail: {comment }}));
  return html`<div>
    <ul>
      ${commentSignal.value.map(comment => html`<li>${comment}</li>`)}
    </ul>
    <input onInput=${onInput} value=${comment} />
    <button onClick=${onClick}>Add!</button>
  </div>`;
}

render(html`<${Comments} />`, document.body);

