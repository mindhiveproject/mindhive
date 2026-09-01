import dynamic from 'next/dynamic';
import useTranslation from 'next-translate/useTranslation';

const importLabjs = () => import('./index');

const DynamicLabjs = dynamic(importLabjs, {
  ssr: false,
});

export default function DynamicExperimentWindow(props) {
  const { t } = useTranslation('common');
  return (
    <>
      <DynamicLabjs {...props} />
      <div className="container fullscreen" data-labjs-section="main">
        <main className="content-vertical-center content-horizontal-center">
          <div>
            <h2>
              {t(
                'runtime.loadingLabJs',
                {},
                {
                  default: 'Loading experiment…',
                }
              )}
            </h2>
            <p>
              {t(
                'runtime.loadingLabJsDescription',
                {},
                {
                  default:
                    'The experiment is loading and should start in a few seconds.',
                }
              )}
            </p>
          </div>
        </main>
      </div>
    </>
  );
}
