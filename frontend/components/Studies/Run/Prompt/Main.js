import { useState } from "react";
import { useMutation } from "@apollo/client";

import { useRouter } from "next/dist/client/router";

import DataUsageForParticipant from "./DataUsage/Participant";
import DataUsageForStudent from "./DataUsage/Student";

import { UPDATE_DATASET } from "../../../Mutations/Dataset";
import { UPDATE_GUEST_STUDY_INFO } from "../../../Mutations/Guest";
import { UPDATE_USER_STUDY_INFO } from "../../../Mutations/User";

import { CURRENT_USER_QUERY } from "../../../Queries/User";
import { GET_GUEST } from "../../../Queries/Guest";

export default function Prompt({
  user,
  study,
  studiesInfo,
  info,
  currentStep,
  nextStep,
  closePrompt,
  token,
}) {
  const router = useRouter();

  // ToDo: find whether the user already gave data usage consent to this study
  // If the study changed the consent should be given again
  const dataUsageConsentWasGiven =
    !!studiesInfo[study?.id]?.dataPolicy?.[study?.currentVersion];

  const redirectPage =
    user.type === "GUEST"
      ? `/studies/${study?.slug}?guest=${user?.publicId}`
      : `/dashboard/discover/studies?name=${study?.slug}`;

  // by default, use the user response given at the first time to a task in the current version of the study
  const [dataUse, setDataUse] = useState(
    studiesInfo[study?.id]?.dataPolicy?.[study?.currentVersion]
  );

  // only present the data usage question to students and admins
  // and when the consent was not given to the specific version of the study
  const [askDataUsageQuestion, setAskDataUsageQuestion] = useState(
    (user?.permissions?.map((p) => p.name).includes("STUDENT") ||
      user?.permissions?.map((p) => p.name).includes("ADMIN")) &&
      !dataUsageConsentWasGiven
  );

  const [updateUserStudyInfo] = useMutation(UPDATE_USER_STUDY_INFO, {
    variables: { id: user?.id },
    refetchQueries: [{ query: CURRENT_USER_QUERY }],
  });

  const [updateGuestStudyInfo] = useMutation(UPDATE_GUEST_STUDY_INFO, {
    variables: { id: user?.id },
    refetchQueries: [
      { query: GET_GUEST, variables: { publicId: user?.publicId } },
    ],
  });

  const [updateDataset] = useMutation(UPDATE_DATASET, {
    ignoreResults: true,
  });

  const closeDataUseQuestion = () => {
    if (!dataUse) {
      alert("Please answer the question first");
    } else {
      setAskDataUsageQuestion(false);
    }
  };

  const isStudent = user?.permissions?.map((p) => p.name).includes("STUDENT");

  const saveResponsesAndProceed = async ({ proceedToNextTask }) => {
    // save the data usage consent response given by user
    if (!dataUsageConsentWasGiven && dataUse) {
      const updatedStudiesInfo = {
        ...studiesInfo,
        [study?.id]: {
          ...studiesInfo[study?.id],
          dataPolicy: {
            ...studiesInfo[study?.id]?.dataPolicy,
            [study?.currentVersion]: dataUse,
          },
        },
      };

      if (user.type === "GUEST") {
        await updateGuestStudyInfo({
          variables: { studiesInfo: updatedStudiesInfo },
        });
      } else {
        await updateUserStudyInfo({
          variables: { studiesInfo: updatedStudiesInfo },
        });
      }
    }

    // save responses by updating the dataset
    await updateDataset({ variables: { token: token, dataPolicy: dataUse } });

    // proceed to the next task or to the main page
    if (proceedToNextTask) {
      router.reload();
    } else {
      window.location = redirectPage;
    }
  };

  if (askDataUsageQuestion) {
    return (
      <div className="prompt">
        <div>
          <h1>Thank you for participating in this task!</h1>
          {isStudent ? (
            <DataUsageForStudent dataUse={dataUse} setDataUse={setDataUse} />
          ) : (
            <DataUsageForParticipant
              dataUse={dataUse}
              setDataUse={setDataUse}
            />
          )}
          <button onClick={() => closeDataUseQuestion()}>Next</button>
        </div>
      </div>
    );
  }

  return (
    <div className="prompt">
      <div className="buttonsHolder">
        {nextStep && (
          <button
            onClick={() => saveResponsesAndProceed({ proceedToNextTask: true })}
          >
            Proceed to the next task
          </button>
        )}
      </div>

      <p
        style={{ textDecoration: "underline", cursor: "pointer" }}
        onClick={() => saveResponsesAndProceed({ proceedToNextTask: false })}
      >
        Go back to the main study page
      </p>
    </div>
  );
}
