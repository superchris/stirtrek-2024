import { signal } from '@preact/signals';
import { Signal } from 'signal-polyfill';
import LiveState from 'phx-live-state';
import subscript from 'subscript';

export const createPreactSignal = (liveState, initialValue, path) => {
  const updater = subscript(path);
  const preactSignal = signal(initialValue);
  liveState.eventTarget.addEventListener('livestate-change', ({detail: { state }}) => {
    console.log('updating signal value', updater(state));
    preactSignal.value = updater(state);
  });
  return preactSignal;
}

export const createPolyfillSignal = (liveStateOrOptions) => {
  const liveState = createLiveState(liveStateOrOptions);
  const polyfillSignal = new Signal.State({});
  liveState.eventTarget.addEventListener('livestate-change', ({detail: { state }}) => {
    polyfillSignal.set(state);
  });
  return polyfillSignal;
}

const createLiveState = (liveStateOrOptions) => {
  if (liveStateOrOptions instanceof LiveState) {
    return liveStateOrOptions;
  } else {
    const liveState = new LiveState(liveStateOrOptions);
    return liveState;
  }
}

