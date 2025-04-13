import { useMutation, useQuery } from "@apollo/client";
import { useState } from "react";
import { Dropdown } from "semantic-ui-react";
import styled from "styled-components";

import { UPDATE_PROJECT_BOARD } from "../../Mutations/Proposal";
import { GET_PROJECT_STUDY } from "../../Queries/Proposal";
import { MY_STUDIES } from "../../Queries/Study";

export default function StudyConnector({ user, project }) {
  const [studyId, setStudyId] = useState("");
  const [studyName, setStudyName] = useState("");

  const [updateProject] = useMutation(UPDATE_PROJECT_BOARD, {
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
      key: study?.id,
      text: study?.title,
      value: study?.id,
    })) || [];

  const assignToStudy = async () => {
    if (!studyId) {
      return alert("Select the study first");
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
      return alert("Give the project a name first");
    }
    await updateProject({
      variables: {
        id: project?.id,
        input: {
          study: {
            create: {
              title: studyName,
              classes: { connect: { id: project?.usedInClass?.id } },
              collaborators: {
                connect: project?.collaborators.map((c) => ({ id: c?.id })),
              },
            },
          },
        },
      },
    });
  };

  return (
    <StyledStudyConnector>
      <Header>Connect to a Study</Header>
      <Description>
        Link this project to an existing study or create a new one
      </Description>

      <ContentGrid>
        <Section>
          <SectionTitle>Select Existing Study</SectionTitle>
          <DropdownWrapper>
            <Dropdown
              selection
              search
              fluid
              options={studyOptions}
              value={studyId}
              onChange={(e, data) => setStudyId(data?.value)}
              placeholder="Choose a study..."
            />
          </DropdownWrapper>
          <Button primary onClick={assignToStudy}>
            Connect Study
          </Button>
        </Section>

        <Section>
          <SectionTitle>Create New Study</SectionTitle>
          <Input
            type="text"
            name="studyName"
            placeholder="Enter study name"
            value={studyName}
            onChange={(e) => setStudyName(e?.target?.value)}
          />
          <Button secondary onClick={createNewStudy}>
            Create & Connect
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
  background: #ffffff;
  border-radius: 8px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
`;

const Header = styled.h2`
  font-family: Nunito, sans-serif;
  font-size: 24px;
  font-weight: 700;
  color: #333333;
  margin: 0 0 8px 0;
`;

const Description = styled.p`
  font-family: Nunito, sans-serif;
  font-size: 16px;
  color: #666666;
  margin: 0 0 24px 0;
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 32px;
  align-items: start;
`;

const Section = styled.div`
  display: flex;
  flex-direction: column;
  gap: 16px;
`;

const SectionTitle = styled.h3`
  font-family: Nunito, sans-serif;
  font-size: 18px;
  font-weight: 600;
  color: #3d85b0;
  margin: 0;
`;

const DropdownWrapper = styled.div`
  .ui.dropdown {
    font-family: Nunito, sans-serif;
    border: 1px solid #e0e0e0;
    border-radius: 4px;
    padding: 10px 12px;

    &:hover {
      border-color: #3d85b0;
    }
  }
`;

const Input = styled.input`
  font-family: Nunito, sans-serif;
  font-size: 16px;
  padding: 10px 12px;
  border: 1px solid #e0e0e0;
  border-radius: 4px;
  outline: none;

  &:focus {
    border-color: #3d85b0;
    box-shadow: 0 0 0 2px rgba(61, 133, 176, 0.2);
  }
`;

const Button = styled.button`
  font-family: Nunito, sans-serif;
  font-size: 16px;
  font-weight: 600;
  padding: 10px 20px;
  border-radius: 4px;
  border: none;
  cursor: pointer;
  transition: all 0.2s ease;

  ${(props) =>
    props.primary
      ? `
    background: #3d85b0;
    color: white;
    
    &:hover {
      background: #326d91;
    }
  `
      : `
    background: #ffffff;
    color: #3d85b0;
    border: 1px solid #3d85b0;
    
    &:hover {
      background: #f3f5f6;
    }
  `}

  &:disabled {
    opacity: 0.6;
    cursor: not-allowed;
  }
`;
