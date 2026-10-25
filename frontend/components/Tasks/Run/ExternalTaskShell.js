import useTranslation from 'next-translate/useTranslation';
import { useRouter } from 'next/router';

import Button from '../../DesignSystem/Button';
import { getLocalizedField } from "../../../lib/i18nContent";

// Only web links open: a stored `javascript:` or `data:` URL never does.
function safeLink(link) {
  try {
    const url = new URL(String(link || ''));
    return ['http:', 'https:'].includes(url.protocol) ? url.href : null;
  } catch {
    return null;
  }
}

/**
 * A study step that lives on another site (W22). MindHive saves nothing for
 * it: the participant opens the link in a new tab, comes back, and moves on.
 */
export default function ExternalTaskShell({
  task,
  onFinish,
  currentStep,
  isTaskRetaken,
}) {
  const { t } = useTranslation('common');
  const { locale } = useRouter();
  const title = getLocalizedField(task, "title", locale);
  const description =
    getLocalizedField(task, "descriptionForParticipants", locale);
  const link = safeLink(task?.link);

  return (
    <div data-runtime-shell="EXTERNAL" role="region" aria-label={title}>
      <h2>{title}</h2>
      {description && <p>{description}</p>}
      {link ? (
        <>
          <p>
            {t(
              'runtime.externalTaskIntro',
              {},
              {
                default:
                  'This step happens on another website. Open it, complete it there, then come back to continue.',
              }
            )}
          </p>
          <Button
            variant="outline"
            onClick={() => window.open(link, '_blank', 'noopener,noreferrer')}
          >
            {t('runtime.externalTaskOpen', {}, { default: 'Open the task' })}
          </Button>
        </>
      ) : (
        <p role="alert">
          {t(
            'runtime.externalTaskNoLink',
            {},
            { default: "This step's link is missing or invalid." }
          )}
        </p>
      )}
      <Button
        variant="filled"
        onClick={() => onFinish?.({ currentStep, isTaskRetaken })}
      >
        {t('runtime.externalTaskDone', {}, { default: "I've finished" })}
      </Button>
    </div>
  );
}
