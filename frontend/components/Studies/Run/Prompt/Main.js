import { useState } from "react";
import { useMutation } from "@apollo/client";

// import Link from "next/link";
import { useRouter } from "next/dist/client/router";

import DataUsageForParticipant from "./DataUsage/Participant";
import DataUsageForStudent from "./DataUsage/Student";

import { UPDATE_DATASET } from "../../../Mutations/Dataset";
import { UPDATE_USER_STUDY_INFO } from "../../../Mutations/User";
import { GET_USER_STUDIES } from "../../../Queries/User";

export default function Prompt({
  user,
  study,
  studiesInfo,
  info,
  nextStep,
  closePrompt,
  token,
}) {
  const router = useRouter();

  const [dataUse, setDataUse] = useState(undefined);
  const [askDataUsageQuestion, setAskDataUsageQuestion] = useState(
    user?.permissions?.map((p) => p.name).includes("STUDENT") ||
      user?.permissions?.map((p) => p.name).includes("ADMIN")
  );

  const [updateDataset] = useMutation(UPDATE_DATASET, {
    ignoreResults: true,
  });

  const [updateUserStudyInfo] = useMutation(UPDATE_USER_STUDY_INFO, {
    variables: { id: user?.id },
    refetchQueries: [{ query: GET_USER_STUDIES }],
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
    debugger;
    // save responses
    await updateDataset({ variables: { token: token, dataPolicy: dataUse } });
    // TODO save user information
    info.path.push(nextStep);
    const updatedStudiesInfo = {
      ...studiesInfo,
      [study?.id]: {
        ...studiesInfo[study?.id],
        info,
      },
    };
    await updateUserStudyInfo({
      variables: { studiesInfo: updatedStudiesInfo },
    });
    // proceed
    if (proceedToNextTask) {
      closePrompt();
    } else {
      router.push({
        pathname: `/dashboard/discover/studies`,
        query: {
          name: study?.slug,
        },
      });
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
