Hooks.once('devModeReady', () => {
  // Only add this script for livereload if we're using Developer Mode
  // (https://github.com/League-of-Foundry-Developers/foundryvtt-devMode)
  const src = `http://${(location.host || 'localhost').split(':')[0]}:35729/livereload.js?snipver=1`
  const script = document.createElement('script');
  script.src = src;

  document.body.appendChild(script);
})

/* -------------------------------------------- */
/*  Init Hook                                   */
/* -------------------------------------------- */
import './hooks/init'

/* -------------------------------------------- */
/*  Ready Hooks                                 */
/* -------------------------------------------- */
import './hooks/hotbarDrop';
import './hooks/createToken';
import './hooks/renderChatMessage';
