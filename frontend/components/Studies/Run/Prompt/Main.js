import { useState } from "react";
import { useMutation } from "@apollo/client";

import { useRouter } from "next/dist/client/router";

import DataUsageForParticipant from "./DataUsage/Participant";
import DataUsageForStudent from "./DataUsage/Student";

import { UPDATE_DATASET } from "../../../Mutations/Dataset";

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

  const redirectPage =
    user.type === "GUEST"
      ? `/studies/${study?.slug}?guest=${user?.publicId}`
      : `/dashboard/discover/studies?name=${study?.slug}`;

  const [dataUse, setDataUse] = useState(undefined);

  // only present the data usage question to students and admins
  // and when it was explicitly chosen by the researcher
  const [askDataUsageQuestion, setAskDataUsageQuestion] = useState(
    (user?.permissions?.map((p) => p.name).includes("STUDENT") ||
      user?.permissions?.map((p) => p.name).includes("ADMIN")) &&
      currentStep?.askDataUsageQuestion
  );

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
