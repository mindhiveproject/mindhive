import { useMutation } from "@apollo/client";
import { UPDATE_VIZSECTION } from "../../../../Mutations/VizSection";
import { GET_VIZJOURNALS } from "../../../../Queries/VizJournal";
import Button from "../../../../DesignSystem/Button";
import useTranslation from "next-translate/useTranslation";

export default function SaveSection({ projectId, studyId, sectionId, inputs }) {
  const { t } = useTranslation("builder");
  const [updateSection, { data, loading, error }] = useMutation(
    UPDATE_VIZSECTION,
    {
      variables: {
        id: sectionId,
        input: {
          description: inputs?.description,
          content: { ...inputs.content },
        },
      },
      refetchQueries: [
        {
          query: GET_VIZJOURNALS,
          variables: {
            where:
              projectId && studyId
                ? {
                    OR: [
                      { project: { id: { equals: projectId } } },
                      { study: { id: { equals: studyId } } },
                    ],
                  }
                : projectId
                ? { project: { id: { equals: projectId } } }
                : studyId
                ? { study: { id: { equals: studyId } } }
                : null,
          },
        },
      ],
    }
  );

  return (
    <div>
      <Button variant="filled" type="button" onClick={updateSection}>
        {t("header.save", {}, { default: "Save" })}
      </Button>
    </div>
  );
}
