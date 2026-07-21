import { useMemo, useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import Link from "next/link";
import styled from "styled-components";
import { Icon, Label, Dropdown } from "semantic-ui-react";

import { QUESTION_LIBRARY } from "../../../Queries/ConnectQuestion";
import { DELETE_QUESTION } from "../../../Mutations/ConnectQuestion";
import FilterBar from "../FilterBar";
import Button from "../../../DesignSystem/Button";

const Shell = styled.div`
  display: flex;
  flex-direction: column;
  gap: 32px;
  padding: 32px clamp(16px, 6vw, 64px);
  padding-top: 0px;
  background-color: #f7f9f8;
  min-height: 100vh;
  border-radius: 32px 0 0 32px;
`;

const TopBar = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  gap: 16px;

  h1 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: clamp(28px, 4vw, 40px);
    font-weight: 600;
    color: #171717;
  }

  p {
    margin: 4px 0 0;
    color: #5f6871;
    font-size: 14px;
    max-width: 640px;
  }
`;

const Grid = styled.div`
  display: grid;
  gap: 16px;
  grid-template-columns: 1fr;
`;

const Row = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 16px 20px;
  border-radius: 16px;
  background: #ffffff;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);

  h3 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 16px;
    color: #171717;
    font-weight: 600;
  }

  .helper {
    color: #5f6871;
    font-size: 13px;
  }
`;

const TopMeta = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  flex-wrap: wrap;
`;

const ChipRow = styled.div`
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  font-size: 12px;
  color: #888;
`;

const Actions = styled.div`
  display: flex;
  gap: 8px;

  a,
  button {
    padding: 6px 14px;
    border-radius: 100px;
    border: 1px solid #d3dae0;
    background: #ffffff;
    color: #336f8a;
    font-family: "Inter", sans-serif;
    font-weight: 600;
    font-size: 12px;
    cursor: pointer;
    text-decoration: none;
  }

  button.danger {
    border-color: #e8c4c4;
    color: #b3261e;
  }
`;

const Empty = styled.div`
  padding: 48px 24px;
  text-align: center;
  background: #ffffff;
  border-radius: 16px;
  color: #5f6871;
`;


const STATUS_COLORS = {
  draft: "grey",
  proposed: "yellow",
  approved: "green",
  rejected: "red",
  archived: "black",
};

const TYPE_LABELS = {
  short_text: "Short text",
  long_text: "Long text",
  single_select: "Single select",
  multi_select: "Multi select",
  scale_1_5: "1-5 scale",
  scale_1_10: "1-10 scale",
  yes_no: "Yes / no",
};

export default function QuestionsList() {
  const { data, loading, refetch } = useQuery(QUESTION_LIBRARY, {
    fetchPolicy: "cache-and-network",
  });
  const [deleteQuestion] = useMutation(DELETE_QUESTION);

  const questions = data?.connectQuestions || [];

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState(null);
  const [typeFilter, setTypeFilter] = useState(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return questions.filter((qn) => {
      if (q && !(qn.prompt || "").toLowerCase().includes(q)) return false;
      if (statusFilter && qn.status !== statusFilter) return false;
      if (typeFilter && qn.questionType !== typeFilter) return false;
      return true;
    });
  }, [questions, search, statusFilter, typeFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this question? This cannot be undone.")) {
      return;
    }
    await deleteQuestion({ variables: { id } });
    refetch();
  };

  return (
    <Shell>
      <TopBar>
        <div>
          <h1>Question library</h1>
          <p>
            Master library of questions admins and teachers can attach to a
            matching round. Mentor-proposed questions show up here for review.
          </p>
        </div>
        <Link
          href={{
            pathname: "/dashboard/connect/questions",
            query: { q: "new" },
          }}
        >
          <Button type="button" variant="filled">
            New question
          </Button>
        </Link>
      </TopBar>

      {questions.length > 0 && (
        <FilterBar>
          <input
            className="search"
            placeholder="Search by prompt…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Dropdown
            selection
            clearable
            placeholder="All statuses"
            options={[
              { key: "draft", text: "Draft", value: "draft" },
              { key: "proposed", text: "Proposed", value: "proposed" },
              { key: "approved", text: "Approved", value: "approved" },
              { key: "rejected", text: "Rejected", value: "rejected" },
              { key: "archived", text: "Archived", value: "archived" },
            ]}
            value={statusFilter}
            onChange={(_, { value }) => setStatusFilter(value || null)}
          />
          <Dropdown
            selection
            clearable
            placeholder="All types"
            options={Object.entries(TYPE_LABELS).map(([value, text]) => ({
              key: value,
              text,
              value,
            }))}
            value={typeFilter}
            onChange={(_, { value }) => setTypeFilter(value || null)}
          />
        </FilterBar>
      )}

      {loading && questions.length === 0 && <Empty>Loading…</Empty>}

      {!loading && questions.length === 0 && (
        <Empty>
          The library is empty. Click <strong>New question</strong> to add the
          first reusable question.
        </Empty>
      )}

      {!loading && questions.length > 0 && filtered.length === 0 && (
        <Empty>No questions match the current filters.</Empty>
      )}

      <Grid>
        {filtered.map((question) => {
          const optionCount = Array.isArray(question.options)
            ? question.options.length
            : 0;
          return (
            <Row key={question.id}>
              <TopMeta>
                <div style={{ flex: 1 }}>
                  <h3>{question.prompt}</h3>
                  {question.helperText && (
                    <div className="helper">{question.helperText}</div>
                  )}
                </div>
                <Label
                  color={STATUS_COLORS[question.status] || "grey"}
                  size="tiny"
                >
                  {question.status}
                </Label>
              </TopMeta>
              <ChipRow>
                <span>
                  <Icon name="question circle outline" />
                  {TYPE_LABELS[question.questionType] || question.questionType}
                </span>
                {optionCount > 0 && (
                  <span>
                    <Icon name="list" />
                    {optionCount} options
                  </span>
                )}
                <span>
                  <Icon name="balance" />
                  weight {question.weight ?? 1}
                </span>
                {question.isRequired && (
                  <span>
                    <Icon name="asterisk" />
                    required
                  </span>
                )}
                {question.proposedBy && (
                  <span>
                    <Icon name="user" />
                    by{" "}
                    {question.proposedBy.firstName ||
                      question.proposedBy.username}
                  </span>
                )}
              </ChipRow>
              <Actions>
                <Link
                  href={{
                    pathname: "/dashboard/connect/questions",
                    query: { q: question.id },
                  }}
                >
                  Edit
                </Link>
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDelete(question.id)}
                >
                  Delete
                </button>
              </Actions>
            </Row>
          );
        })}
      </Grid>
    </Shell>
  );
}
