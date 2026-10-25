import { useCallback, useMemo } from 'react';
import useTranslation from 'next-translate/useTranslation';
import RuntimeTaskShell, { parameterValues } from './RuntimeTaskShell';

// A sketch draws on a canvas; it needs scripts and nothing more.
const SANDBOX = 'allow-scripts';

/**
 * Runs a p5 task: the visual's code comes from the visual task route, built
 * into a document with the pinned p5 (see RuntimeTaskShell for saving and
 * finishing). The visual itself may be private: the route gets its code from
 * Keystone with the asset token, so this page never reads it.
 *
 * @param {object} task - From TASK_TO_PARTICIPATE.
 * @param {string} assetToken - A p5 asset token for this task's visual.
 */
export default function P5Shell({ task, assetToken, ...run }) {
  const { t } = useTranslation('common');
  // Defaults the task doesn't set come from the sketch's declareParameters.
  const params = useMemo(() => parameterValues(task?.parameters), [task]);
  const buildSrc = useCallback(
    (nonce) =>
      `/api/runtime/visual/${encodeURIComponent(
        assetToken
      )}?n=${encodeURIComponent(nonce)}`,
    [assetToken]
  );
  return (
    <RuntimeTaskShell
      {...run}
      runtime="P5"
      buildSrc={buildSrc}
      sandbox={SANDBOX}
      params={params}
      title={t('runtime.p5FrameTitle', {}, { default: 'p5 task' })}
    />
  );
}
