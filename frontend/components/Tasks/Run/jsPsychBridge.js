function isTrustedBridgeMessage({
  event,
  iframeWindow,
  expectedOrigin,
  channelToken,
}) {
  return (
    event.source === iframeWindow &&
    event.origin === expectedOrigin &&
    event.data?.protocol === 'mindhive-runtime-v1' &&
    event.data?.channelToken === channelToken
  );
}

function createShellDocument(channelToken) {
  const encodedToken = JSON.stringify(channelToken).replace(/</g, '\\u003c');
  return `<!doctype html>
<html><body><script>
(() => {
  const channelToken = ${encodedToken};
  const protocol = "mindhive-runtime-v1";
  window.addEventListener("message", (event) => {
    if (event.source !== window.parent || event.origin !== window.location.origin) return;
    if (event.data?.protocol !== protocol || event.data?.channelToken !== channelToken) return;
    if (event.data.type === "acknowledgement") {
      window.parent.postMessage({ protocol, channelToken, type: "acknowledged" }, window.location.origin);
    }
  });
  window.parent.postMessage({ protocol, channelToken, type: "handshake" }, window.location.origin);
})();
</script></body></html>`;
}

module.exports = { createShellDocument, isTrustedBridgeMessage };
