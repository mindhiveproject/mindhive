const {
  connectMessage,
  initMessage,
  isHelloMessage,
  validateFrameMessage,
} = require('./runtimeProtocol');

async function defaultCreateTransport(port) {
  const { PostMessageTransport } = await import('yq-data');
  return new PostMessageTransport({ target: port, source: port });
}

/**
 * The parent side of the mindhive-runtime/2 handshake, kept apart from React
 * so it can be driven by a fake frame in tests. It is the `P5Frame` pattern:
 * the first `hello` from the expected frame with this nonce gets a private
 * `MessagePort`, and everything after travels on it through yq-data's
 * `PostMessageTransport`.
 *
 * Once the frame has sent `finish` or `failure`, later messages are refused,
 * so a frame can't append rows to a result that is already being saved.
 *
 * @param {object} options
 * @param {string} options.nonce - Per-frame secret built into its document.
 * @param {() => object | null} options.getFrameWindow - The frame's `contentWindow`.
 * @param {{runtime: string, mode: string, params?: object}} options.init
 * @param {object} options.handlers - `onReady`, `onRows`, `onMarker`,
 *   `onFinish`, `onFailure`, `onRejected`; read on every message,
 *   so the caller may swap them.
 * @param {object} [options.host=window] - Where the frame's `hello` arrives.
 * @param {() => MessageChannel} [options.createChannel]
 * @param {(port: MessagePort) => Promise<object>} [options.createTransport]
 */
function createRuntimeFrameConnection({
  nonce,
  getFrameWindow,
  init,
  handlers,
  host = typeof window === 'undefined' ? null : window,
  createChannel = () => new MessageChannel(),
  createTransport = defaultCreateTransport,
}) {
  // Built up front so a bad mode fails at mount, not after the handshake.
  const firstMessage = initMessage(init);
  let state = 'idle';
  let transport = null;
  let port = null;
  let done = false;

  function handler(name) {
    return handlers?.[name];
  }

  function onFrameMessage(data) {
    const result = validateFrameMessage(data);
    if (!result.ok) {
      handler('onRejected')?.(result.reason);
      return;
    }
    const { message } = result;
    if (done) {
      handler('onRejected')?.(`${message.type} after the run ended`);
      return;
    }
    if (message.type === 'ready') handler('onReady')?.();
    else if (message.type === 'rows') handler('onRows')?.(message.rows);
    else if (message.type === 'marker') {
      handler('onMarker')?.({
        label: message.label,
        value: message.value,
        time: message.time,
      });
    } else if (message.type === 'finish') {
      done = true;
      handler('onFinish')?.({
        aggregated: message.aggregated,
        rows: message.rows,
      });
    } else if (message.type === 'failure') {
      done = true;
      handler('onFailure')?.({
        message: message.message,
        stack: message.stack,
      });
    }
  }

  async function connect(frameWindow) {
    const channel = createChannel();
    port = channel.port1;
    const opened = await createTransport(channel.port1);
    if (state === 'closed') {
      opened.close();
      channel.port1.close();
      return;
    }
    transport = opened;
    // A port listened to through addEventListener stays shut until started.
    channel.port1.start();
    transport.onMessage(onFrameMessage);
    frameWindow.postMessage(connectMessage(nonce), '*', [channel.port2]);
    transport.send(firstMessage);
    state = 'connected';
  }

  // The frame keeps saying hello until it is answered, so only the first one
  // from this frame, with this nonce, gets a port.
  function onHello(event) {
    if (state !== 'listening') return;
    const frameWindow = getFrameWindow();
    if (!frameWindow || event.source !== frameWindow) return;
    if (!isHelloMessage(event.data, nonce)) return;
    state = 'connecting';
    connect(frameWindow).catch((error) => {
      if (state === 'closed') return;
      state = 'listening';
      handler('onRejected')?.(`connection failed: ${error?.message || error}`);
    });
  }

  return {
    start() {
      if (state !== 'idle') return;
      state = 'listening';
      host.addEventListener('message', onHello);
    },
    isConnected() {
      return state === 'connected';
    },
    close() {
      if (state === 'closed') return;
      state = 'closed';
      host?.removeEventListener('message', onHello);
      transport?.close();
      port?.close();
      transport = null;
      port = null;
    },
  };
}

module.exports = { createRuntimeFrameConnection };
