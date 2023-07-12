import { useMutation, useQuery } from "@apollo/client";
import { GET_REVIEW } from "../../../Queries/Review";
import { CREATE_REVIEW, UPDATE_REVIEW } from "../../../Mutations/Review";

import { individual, synthesis } from "./Template";

import Question from "./Question";
import useForm from "../../../../lib/useForm";

export default function Questions({ studyId, proposalId, authorId, stage }) {
  const { data, loading, error } = useQuery(GET_REVIEW, {
    variables: {
      proposalId,
      authorId,
      stage,
    },
  });
  const reviews = data?.reviews || [];
  const review = reviews.length ? reviews[0] : {};
  const content =
    review?.content || (stage === "INDIVIDUAL" ? individual : synthesis);

  const { inputs, handleChange } = useForm({
    content,
    studyId,
    proposalId,
    stage,
  });

  const handleItemChange = ({ className, name, value }) => {
    const updatedContent = [...inputs?.content];
    const content = updatedContent.map((item) => {
      if (item.name === name) {
        const updatedItem = { ...item };
        updatedItem[className] = value;
        return updatedItem;
      }
      return item;
    });
    handleChange({
      target: {
        name: "content",
        value: content,
      },
    });
  };

  const [
    createReview,
    { data: createData, loading: createLoading, error: createError },
  ] = useMutation(CREATE_REVIEW, {
    variables: inputs,
    refetchQueries: [
      {
        query: GET_REVIEW,
        variables: {
          proposalId,
          authorId,
          stage,
        },
      },
    ],
  });

  const [
    updateReview,
    { data: updateData, loading: updateLoading, error: updateError },
  ] = useMutation(UPDATE_REVIEW, {
    variables: inputs,
    refetchQueries: [
      {
        query: GET_REVIEW,
        variables: {
          proposalId,
          authorId,
          stage,
        },
      },
    ],
  });

  return (
    <div className="reviewQuestions">
      <h1>
        {stage === "INDIVIDUAL" ? "Review questions" : "Synthesis questions"}
      </h1>
      <div className="reviewItems">
        {inputs?.content.map((item, i) => (
          <Question
            stage={stage}
            item={item}
            handleItemChange={handleItemChange}
          />
        ))}
      </div>
      {inputs?.id ? (
        <button
          type="button"
          disabled={updateLoading}
          onClick={() => updateReview()}
        >
          Update
        </button>
      ) : (
        <button
          type="button"
          disabled={createLoading}
          onClick={async () => {
            const res = await createReview();
            const id = res?.data?.createReview?.id || null;
            handleChange({
              target: {
                name: "id",
                value: id,
              },
            });
          }}
        >
          Submit
        </button>
      )}
    </div>
  );
}
