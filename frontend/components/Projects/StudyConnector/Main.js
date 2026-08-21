import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";
import { Message, MessageHeader } from "semantic-ui-react";

import Button from "../../DesignSystem/Button";
import DropdownSelect from "../../DesignSystem/DropdownSelect";

import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal";
import { GET_PROJECT_STUDY } from "../../Queries/Proposal";
import { MY_STUDIES } from "../../Queries/Study";

export default function StudyConnector({ user, project }) {
  const { t } = useTranslation("builder");
  const [studyId, setStudyId] = useState("");
  const [studyName, setStudyName] = useState("");

  const classId = project?.usedInClass?.id;
  const hasClassLink = Boolean(classId);

  const [updateProject, { loading }] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: GET_PROJECT_STUDY,
        variables: { id: project?.id },
      },
    ],
  });

  const { data } = useQuery(MY_STUDIES, {
    variables: { id: user?.id },
  });

  const studies = data?.studies || [];
  const studyOptions =
    studies?.map((study) => ({
      value: study?.id,
      label: study?.title,
    })) || [];

  const assignToStudy = async () => {
    if (!studyId) {
      return alert(
        t("project.selectStudyFirst", {}, {
          default: "Select the study first",
        })
      );
    }
    await updateProject({
      variables: {
        id: project?.id,
        input: {
          study: { connect: { id: studyId } },
        },
      },
    });
  };

  const createNewStudy = async () => {
    if (!studyName) {
      return alert(
        t("project.giveProjectNameFirst", {}, {
          default: "Give the project a name first",
        })
      );
    }

    const collaboratorIds = (project?.collaborators || [])
      .map((c) => c?.id)
      .filter(Boolean);

    await updateProject({
      variables: {
        id: project?.id,
        input: {
          study: {
            create: {
              title: studyName,
              ...(hasClassLink
                ? { classes: { connect: { id: classId } } }
                : {}),
              ...(collaboratorIds.length
                ? {
                    collaborators: {
                      connect: collaboratorIds.map((id) => ({ id })),
                    },
                  }
                : {}),
            },
          },
        },
      },
    });
  };

  return (
    <StyledStudyConnector>
      <Header>
        {t("project.connectToStudy", {}, {
          default: "Connect to a Study",
        })}
      </Header>
      <Description>
        {t("project.connectToStudyDescription", {}, {
          default:
            "Link this project to an existing study or create a new one",
        })}
      </Description>

      {!hasClassLink && (
        <Message warning>
          <MessageHeader>
            {t("project.studyNotLinkedToClassTitle", {}, {
              default: "Not connected to a class",
            })}
          </MessageHeader>
          <p>
            {t("project.studyNotLinkedToClassBody", {}, {
              default:
                "This project board is not connected to a class. The study you create will not be linked to a class either. You can still create and connect a study.",
            })}
          </p>
        </Message>
      )}

      <ContentGrid>
        <Section>
          <SectionTitle>
            {t("project.selectExistingStudy", {}, {
              default: "Select Existing Study",
            })}
          </SectionTitle>
          <DropdownSelect
            value={studyId}
            onChange={setStudyId}
            options={studyOptions}
            searchableSingle
            placeholder={t("project.chooseStudy", {}, {
              default: "Choose a study...",
            })}
            ariaLabel={t("project.selectExistingStudy", {}, {
              default: "Select Existing Study",
            })}
            disabled={!studyOptions.length}
          />
          <Button
            variant="filled"
            onClick={assignToStudy}
            disabled={loading || !studyId}
          >
            {t("project.connectStudy", {}, {
              default: "Connect Study",
            })}
          </Button>
        </Section>

        <Section>
          <SectionTitle>
            {t("project.createNewStudy", {}, {
              default: "Create New Study",
            })}
          </SectionTitle>
          <Input
            type="text"
            name="studyName"
            placeholder={t("project.enterStudyName", {}, {
              default: "Enter study name",
            })}
            value={studyName}
            onChange={(e) => setStudyName(e?.target?.value)}
          />
          <Button
            variant="outline"
            onClick={createNewStudy}
            disabled={loading || !studyName}
          >
            {t("project.createAndConnect", {}, {
              default: "Create & Connect",
            })}
          </Button>
        </Section>
      </ContentGrid>
    </StyledStudyConnector>
  );
}

const StyledStudyConnector = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 20px auto;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  font-family: Inter, sans-serif;
  box-sizing: border-box;

  .ui.warning.message {
    margin: 0 0 20px;
    font-family: Inter, sans-serif;
  }

  .ui.warning.message .header {
    font-family: Inter, sans-serif;
    font-size: 14px;
    font-weight: 600;
    line-height: 20px;
  }

  .ui.warning.message p {
    margin: 0;
    font-size: 14px;
    line-height: 20px;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const Header = styled.h2`
  font-family: Inter, sans-serif;
  font-size: 24px;
  font-weight: 700;
  line-height: 32px;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 400;
  line-height: 20px;
  color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  margin: 0 0 24px 0;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;

  @media (max-width: 720px) {
    grid-template-columns: 1fr;
  }
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
  align-items: flex-start;
`;

const SectionTitle = styled.h3`
  font-family: Inter, sans-serif;
  font-size: 16px;
  font-weight: 600;
  line-height: 24px;
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  margin: 0;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  font-family: Inter, sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 20px;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  padding: 8px 12px;
  border: 1px solid var(--MH-Theme-Neutrals-Medium, #a1a1a1);
  border-radius: 8px;
  outline: none;
  background: transparent;

  &::placeholder {
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }

  &:focus {
    border-color: var(--MH-Theme-Primary-Dark, #336f8a);
    box-shadow: 0 0 0 2px rgba(51, 111, 138, 0.15);
  }
`;
