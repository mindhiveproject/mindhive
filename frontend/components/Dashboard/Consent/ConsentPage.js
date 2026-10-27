import { useMutation, useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import Link from "next/link";

import { GET_CONSENT, GET_MY_CONSENTS } from "../../Queries/Consent";
import {
  EDIT_CONSENT,
  SUBMIT_CONSENT_FOR_REVIEW,
} from "../../Mutations/Consent";
import ConsentPreview from "./ConsentPreview";
import useForm from "../../../lib/useForm";
import ConsentForm from "./ConsentForm";
import ConsentSettings from "./ConsentSettings";
import {
  finalizeInfo,
  normalizeInfo,
  consentTypesForGroups,
  normalizeSettings,
} from "./consentTypes";

export default function ConsentPage({ code, user, query }) {
  const { t } = useTranslation("dashboard");
  const { action } = query;

  const { data, loading, error } = useQuery(GET_CONSENT, {
    variables: { code },
  });
  const consent = data?.consent;

  if (loading && !data) {
    return (
      <p className="consentListLoading">
        {t("consentAdmin.loading", {}, { default: "Loading…" })}
      </p>
    );
  }

  if (error || !consent) {
    return (
      <div className="consentListEmpty">
        <h3>
          {t(
            "consentAdmin.notFound",
            {},
            {
              default: "This protocol could not be found.",
            }
          )}
        </h3>
        <p>
          <Link href="/dashboard/irb">
            {t(
              "consentAdmin.backToProtocols",
              {},
              {
                default: "Back to my protocols",
              }
            )}
          </Link>
        </p>
      </div>
    );
  }

  // class teacher or teaching team of the linked class
  const isReviewer =
    !!user?.id &&
    [consent?.class?.creator, ...(consent?.class?.teachingTeam || [])].some(
      (p) => p?.id === user.id
    );

  const canEdit =
    !!user?.id &&
    (consent?.author?.id === user?.id ||
      consent?.collaborators?.some((c) => c?.id === user?.id));

  if (action === "status" && canEdit) {
    // Status area: placeholder until the design is ready
    return <div className="consentStatus" />;
  }

  if (action === "settings" && canEdit) {
    return <ConsentSettings consent={consent} user={user} />;
  }

  if (action === "edit" && canEdit) {
    return (
      <EditConsent consent={consent} user={user} initialForm={query?.form} />
    );
  }

  return (
    <ConsentPreview
      consent={consent}
      user={user}
      canEdit={canEdit}
      isReviewer={isReviewer}
    />
  );
}

function EditConsent({ consent, user, initialForm }) {
  const { t } = useTranslation("dashboard");
  // The consent is already loaded, so the form never needs to re-sync.
  // Title, description and collaborators are edited on the settings page.
  const { inputs, handleChange } = useForm(
    { title: consent?.title || "", info: normalizeInfo(consent?.info) },
    { freezeInitialSync: true }
  );

  const [editConsent, { loading, error }] = useMutation(EDIT_CONSENT, {
    refetchQueries: [
      { query: GET_CONSENT, variables: { code: consent?.code } },
      { query: GET_MY_CONSENTS, variables: { userId: user?.id } },
    ],
    awaitRefetchQueries: true,
  });

  const [submitReview, { loading: submittingReview, error: submitError }] =
    useMutation(SUBMIT_CONSENT_FOR_REVIEW, {
      refetchQueries: [
        { query: GET_CONSENT, variables: { code: consent?.code } },
        { query: GET_MY_CONSENTS, variables: { userId: user?.id } },
      ],
      awaitRefetchQueries: true,
    });
  const teachers = [
    consent?.class?.creator,
    ...(consent?.class?.teachingTeam || []),
  ].filter(Boolean);
  const review = {
    status: consent?.settings?.review?.status,
    note: consent?.settings?.review?.note,
    reviewedBy: consent?.settings?.review?.reviewedBy?.username,
    hasClass: !!consent?.class?.id,
    reviewers: [...new Set(teachers.map((p) => p?.username))].filter(Boolean),
  };

  // saves the current forms and marks the protocol as submitted
  async function handleSubmitReview() {
    try {
      // the server saves the forms and notifies the teaching team
      await submitReview({
        variables: {
          consentId: consent?.id,
          info: finalizeInfo(inputs?.info),
        },
      });
    } catch (err) {
      // surfaced through error
    }
  }

  async function handleSave() {
    try {
      // stay on the current form; the editor confirms the save
      await editConsent({
        variables: { id: consent?.id, info: finalizeInfo(inputs?.info) },
      });
      return true;
    } catch (err) {
      // surfaced through error
      return false;
    }
  }

  return (
    <ConsentForm
      initialForm={initialForm}
      review={review}
      onSubmitReview={handleSubmitReview}
      submittingReview={submittingReview}
      groups={normalizeSettings(consent?.settings).eligibility.groups}
      user={user}
      inputs={inputs}
      handleChange={handleChange}
      handleSave={handleSave}
      submitBtnName={t("consentAdmin.save", {}, { default: "Save" })}
      loading={loading}
      error={error || submitError}
    />
  );
}
