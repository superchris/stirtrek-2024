import { signal } from '@preact/signals';
import { Signal } from 'signal-polyfill';
import LiveState from 'phx-live-state';
import subscript from 'subscript';

export const createPreactSignal = (liveStateOrOptions) => {
  const { path, initialValue } = liveStateOrOptions;
  const liveState = createLiveState(liveStateOrOptions);
  const updater = path? subscript(path) : (state) => state;
  const preactSignal = signal(initialValue ? initialValue : {});
  liveState.eventTarget.addEventListener('livestate-change', ({detail: { state }}) => {
    preactSignal.value = updater(state);
  });
  const dispatchEvent = (event) => liveState.dispatchEvent(event);
  liveState.connect();
  return [preactSignal, dispatchEvent];
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

