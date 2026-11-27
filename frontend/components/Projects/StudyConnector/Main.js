import { useMutation, useQuery } from "@apollo/client";
import { useMemo, useState } from "react";
import styled from "styled-components";
import useTranslation from "next-translate/useTranslation";
import { Message, MessageHeader } from "semantic-ui-react";

import Button from "../../DesignSystem/Button";
import Chip from "../../DesignSystem/Chip";
import DropdownSelect from "../../DesignSystem/DropdownSelect";

import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal";
import { UPDATE_STUDY } from "../../Mutations/Study";
import { GET_PROJECT_STUDY } from "../../Queries/Proposal";
import { STUDY_CONNECTOR_OPTIONS } from "../../Queries/Study";

export default function StudyConnector({ user, project }) {
  const { t } = useTranslation("builder");
  const [studyId, setStudyId] = useState("");
  const [studyName, setStudyName] = useState("");

  const classId = project?.usedInClass?.id;
  const hasClassLink = Boolean(classId);

  const [updateStudy] = useMutation(UPDATE_STUDY);
  const [updateProject, { loading }] = useMutation(UPDATE_PROJECT_BOARD, {
    refetchQueries: [
      {
        query: GET_PROJECT_STUDY,
        variables: { id: project?.id },
      },
    ],
  });

  // The viewer's own studies, plus every study linked to the board's class so
  // a teacher can pick a student study they are not a collaborator on.
  const studyWhere = useMemo(
    () => ({
      isHidden: { equals: false },
      OR: [
        { author: { id: { equals: user?.id } } },
        { collaborators: { some: { id: { equals: user?.id } } } },
        ...(classId ? [{ classes: { some: { id: { equals: classId } } } }] : []),
      ],
    }),
    [user?.id, classId]
  );

  const { data } = useQuery(STUDY_CONNECTOR_OPTIONS, {
    variables: { studyWhere, projectId: project?.id },
    skip: !user?.id || !project?.id,
  });

  // Each study row carries chips for its classes and for everyone on the study
  // (author and collaborators, minus the viewer), so the viewer knows who they
  // would connect this board with. Studies shared with the board's members are
  // listed first.
  const studyOptions = useMemo(() => {
    const board = data?.proposalBoard;
    const boardMemberIds = new Set(
      [board?.author, ...(board?.collaborators || [])]
        .map((member) => member?.id)
        .filter((id) => id && id !== user?.id)
    );

    const rows = (data?.studies || []).map((study, index) => {
      const people = [study?.author, ...(study?.collaborators || [])].filter(
        (person, i, all) =>
          person?.id && all.findIndex((p) => p?.id === person.id) === i
      );
      const otherPeople = people.filter((person) => person.id !== user?.id);
      const sharedPeople = otherPeople.filter((person) =>
        boardMemberIds.has(person.id)
      );
      const classes = (study?.classes || []).filter((c) => c?.id);
      const title = study?.title || "";

      return {
        index,
        shared: sharedPeople.length,
        option: {
          value: study?.id,
          labelText: title,
          searchText: [
            ...classes.map((c) => c?.title),
            ...people.map((person) => person?.username),
          ]
            .filter(Boolean)
            .join(" "),
          label: (
            <OptionContent>
              <OptionTitle>{title}</OptionTitle>
              {(classes.length > 0 || otherPeople.length > 0) && (
                <OptionChips>
                  {classes.map((c) => (
                    <Chip
                      key={`class-${c.id}`}
                      variant="static"
                      tone="neutral"
                      label={c?.title}
                      style={CHIP_STYLE}
                    />
                  ))}
                  {otherPeople.map((person) => (
                    <Chip
                      key={`person-${person.id}`}
                      variant="static"
                      tone={
                        boardMemberIds.has(person.id) ? "default" : "neutral"
                      }
                      label={person?.username}
                      style={CHIP_STYLE}
                    />
                  ))}
                </OptionChips>
              )}
            </OptionContent>
          ),
        },
      };
    });

    rows.sort((a, b) => (b.shared > 0) - (a.shared > 0) || a.index - b.index);
    return rows.map((row) => row.option);
  }, [data, user?.id]);

  const assignToStudy = async () => {
    if (!studyId) {
      return alert(
        t("project.selectStudyFirst", {}, {
          default: "Select the study first",
        })
      );
    }
    // The study joins the board's class (as when linking one from the links
    // panel).
    const picked = (data?.studies || []).find((s) => s?.id === studyId);
    const inClass = (picked?.classes || []).some((c) => c?.id === classId);
    if (hasClassLink && !inClass) {
      await updateStudy({
        variables: {
          id: studyId,
          input: { classes: { connect: [{ id: classId }] } },
        },
      });
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
            searchPlaceholder={t("project.searchStudyOptions", {}, {
              default: "Search by study, class or username",
            })}
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

const CHIP_STYLE = { height: 24, padding: "2px 8px", maxWidth: 200 };

const OptionContent = styled.span`
  display: flex;
  flex-direction: column;
  gap: 6px;
`;

const OptionTitle = styled.span`
  display: block;
`;

const OptionChips = styled.span`
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  font-weight: 400;
`;

const StyledStudyConnector = styled.div`
  padding: 24px;
  max-width: 800px;
  margin: 20px auto;
  background: var(--MH-Theme-Neutrals-White, #ffffff);
  border: 1px solid var(--MH-Theme-Neutrals-Light, #e6e6e6);
  border-radius: 12px;
  box-sizing: border-box;

  .ui.warning.message {
    margin: 0 0 20px;
  }

  .ui.warning.message .header {
    font: var(--MH-Type-Title-Small);
    letter-spacing: 0;
  }

  .ui.warning.message p {
    margin: 0;
    font: var(--MH-Type-Body-Base);
    letter-spacing: 0;
    color: var(--MH-Theme-Neutrals-Dark, #6a6a6a);
  }
`;

const Header = styled.h2`
  font: var(--MH-Type-Heading-Small);
  letter-spacing: 0;
  color: var(--MH-Theme-Neutrals-Black, #171717);
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  font: var(--MH-Type-Body-Base);
  letter-spacing: 0;
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
  font: var(--MH-Type-Title-Base);
  letter-spacing: 0;
  color: var(--MH-Theme-Primary-Dark, #336f8a);
  margin: 0;
`;

const Input = styled.input`
  width: 100%;
  box-sizing: border-box;
  font: var(--MH-Type-Label-Base);
  letter-spacing: 0;
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
