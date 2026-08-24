import { useEffect } from 'react';
import useTranslation from 'next-translate/useTranslation';
import { createShellLifecycle } from './shellLifecycle';

export default function P5Shell({ task, onLifecycle }) {
  const { t } = useTranslation('common');

  useEffect(() => {
    const lifecycle = createShellLifecycle('P5', task.visual.id, onLifecycle);
    lifecycle.mount();
    return () => lifecycle.cleanup();
  }, [onLifecycle, task.visual.id]);

  return (
    <div data-runtime-shell="P5" role="status">
      {t(
        'runtime.p5Shell',
        {},
        {
          default:
            'This p5.js task is configured, but execution is not enabled yet.',
        }
      )}
    </div>
  );
}
