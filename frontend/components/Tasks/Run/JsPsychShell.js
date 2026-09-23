import { useEffect, useMemo, useRef, useState } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { createShellDocument, isTrustedBridgeMessage } from './jsPsychBridge';

export default function JsPsychShell({ runContext, onLifecycle }) {
  const { t } = useTranslation('common');
  const iframeRef = useRef(null);
  const [handshakeComplete, setHandshakeComplete] = useState(false);
  const channelToken = useMemo(
    () =>
      typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    []
  );
  const shellDocument = useMemo(
    () => createShellDocument(channelToken),
    [channelToken]
  );

  useEffect(() => {
    const expectedOrigin = window.location.origin;
    function onMessage(event) {
      if (
        !isTrustedBridgeMessage({
          event,
          iframeWindow: iframeRef.current?.contentWindow,
          expectedOrigin,
          channelToken,
        })
      ) {
        onLifecycle?.('message-rejected');
        return;
      }
      if (event.data.type === 'handshake') {
        iframeRef.current?.contentWindow?.postMessage(
          {
            protocol: 'mindhive-runtime-v1',
            channelToken,
            type: 'acknowledgement',
            ...(runContext?.runToken ? { runToken: runContext.runToken } : {}),
          },
          expectedOrigin
        );
      }
      if (event.data.type === 'acknowledged') {
        setHandshakeComplete(true);
        onLifecycle?.('acknowledged');
      }
    }
    window.addEventListener('message', onMessage);
    onLifecycle?.('mounted');
    return () => {
      window.removeEventListener('message', onMessage);
      onLifecycle?.('cleanup');
    };
  }, [channelToken, onLifecycle, runContext?.runToken]);

  return (
    <div data-runtime-shell="JSPSYCH" role="status">
      <iframe
        ref={iframeRef}
        title={t(
          'runtime.jsPsychFrameTitle',
          {},
          {
            default: 'jsPsych runtime shell',
          }
        )}
        sandbox="allow-scripts allow-same-origin"
        srcDoc={shellDocument}
        style={{ display: 'none' }}
      />
      {handshakeComplete
        ? t(
            'runtime.jsPsychShellReady',
            {},
            {
              default:
                'The jsPsych bridge is ready, but experiment execution is not enabled yet.',
            }
          )
        : t(
            'runtime.jsPsychShellLoading',
            {},
            {
              default: 'Preparing the jsPsych runtime bridge…',
            }
          )}
    </div>
  );
}
