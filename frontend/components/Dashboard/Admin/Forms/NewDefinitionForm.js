// Inline "+ New form definition" form. Picks org/network targets
// inline when scope is set to organization or class_network.
import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@apollo/client";
import { useRouter } from "next/router";
import { Dropdown } from "semantic-ui-react";
import styled from "styled-components";

import { CREATE_FORM_DEFINITION } from "../../../Mutations/FormDefinition";
import { ADMIN_FORM_DEFINITIONS } from "../../../Queries/FormDefinition";
import { ALL_ORGANIZATIONS_LITE } from "../../../Queries/Organization";
import { GET_ALL_NETWORKS } from "../../../Queries/ClassNetwork";
import {
  FieldRow,
  PrimaryButton,
  SecondaryButton,
} from "./EditorPanelStyles";

const Shell = styled.div`
  display: ${({ $open }) => ($open ? "flex" : "none")};
  flex-direction: column;
  gap: 16px;
  background: #ffffff;
  border-radius: 16px;
  padding: 20px 24px;
  box-shadow: 0px 4px 24px rgba(0, 0, 0, 0.05);
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;

  h2 {
    margin: 0;
    font-family: "Lato", sans-serif;
    font-size: 18px;
    color: #171717;
  }
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 16px;
`;

export default function NewDefinitionForm({ open, onClose }) {
  const router = useRouter();
  const [key, setKey] = useState("");
  const [title, setTitle] = useState("");
  const [scope, setScope] = useState("global");
  const [organizationId, setOrganizationId] = useState(null);
  const [classNetworkId, setClassNetworkId] = useState(null);
  const [error, setError] = useState(null);

  // Load pickers on demand — they're harmless to fire even if scope is
  // global since the queries are lightweight (id + name only).
  const { data: orgsData, loading: orgsLoading } = useQuery(
    ALL_ORGANIZATIONS_LITE,
    { skip: !open || scope !== "organization" }
  );
  const { data: netsData, loading: netsLoading } = useQuery(
    GET_ALL_NETWORKS,
    { skip: !open || scope !== "class_network" }
  );

  const orgOptions = useMemo(() => {
    const list = orgsData?.organizations || [];
    return list.map((o) => ({ key: o.id, value: o.id, text: o.name }));
  }, [orgsData]);
  const netOptions = useMemo(() => {
    const list = netsData?.classNetworks || [];
    return list.map((n) => ({ key: n.id, value: n.id, text: n.title }));
  }, [netsData]);

  const [createDefinition, { loading }] = useMutation(
    CREATE_FORM_DEFINITION,
    {
      refetchQueries: [{ query: ADMIN_FORM_DEFINITIONS }],
      awaitRefetchQueries: true,
    }
  );

  const handleCreate = async () => {
    setError(null);
    const trimmedKey = key.trim();
    const trimmedTitle = title.trim();
    if (!trimmedKey) {
      setError("Key is required.");
      return;
    }
    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    if (scope === "organization" && !organizationId) {
      setError("Pick an organization for this scope.");
      return;
    }
    if (scope === "class_network" && !classNetworkId) {
      setError("Pick a class network for this scope.");
      return;
    }
    const input = {
      key: trimmedKey,
      title: trimmedTitle,
      scope,
      status: "draft",
      version: 1,
    };
    if (scope === "organization" && organizationId) {
      input.organization = { connect: { id: organizationId } };
    }
    if (scope === "class_network" && classNetworkId) {
      input.classNetwork = { connect: { id: classNetworkId } };
    }
    try {
      const res = await createDefinition({ variables: { input } });
      const id = res?.data?.createFormDefinition?.id;
      if (id) {
        router.push({
          pathname: "/dashboard/admin-forms",
          query: { id },
        });
      }
    } catch (e) {
      setError(e?.message || "Failed to create.");
    }
  };

  return (
    <Shell $open={open}>
      <Header>
        <h2>New form definition</h2>
        <SecondaryButton type="button" onClick={onClose}>
          Cancel
        </SecondaryButton>
      </Header>
      <Grid>
        <FieldRow>
          <span className="label-text">Key</span>
          <span className="hint">
            Identifier used by the renderer. Use one of{" "}
            <code>opportunity</code>, <code>profile_individual</code>,{" "}
            <code>profile_organization</code> (override an existing form),
            or pick a new key for a brand-new form surface.
          </span>
          <input
            type="text"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            placeholder="opportunity"
          />
        </FieldRow>
        <FieldRow>
          <span className="label-text">Title</span>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Admin-facing name"
          />
        </FieldRow>
        <FieldRow>
          <span className="label-text">Scope</span>
          <select
            value={scope}
            onChange={(e) => {
              setScope(e.target.value);
              setOrganizationId(null);
              setClassNetworkId(null);
            }}
          >
            <option value="global">Global</option>
            <option value="organization">Organization</option>
            <option value="class_network">Class network</option>
          </select>
          <span className="hint">
            class_network &gt; organization &gt; global at resolve time.
          </span>
        </FieldRow>
        {scope === "organization" ? (
          <FieldRow>
            <span className="label-text">Organization</span>
            <Dropdown
              selection
              search
              loading={orgsLoading}
              placeholder="Pick an organization…"
              options={orgOptions}
              value={organizationId}
              onChange={(_, { value }) => setOrganizationId(value || null)}
            />
          </FieldRow>
        ) : null}
        {scope === "class_network" ? (
          <FieldRow>
            <span className="label-text">Class network</span>
            <Dropdown
              selection
              search
              loading={netsLoading}
              placeholder="Pick a class network…"
              options={netOptions}
              value={classNetworkId}
              onChange={(_, { value }) => setClassNetworkId(value || null)}
            />
          </FieldRow>
        ) : null}
      </Grid>
      {error ? (
        <div style={{ color: "#871b16", fontSize: 13 }}>{error}</div>
      ) : null}
      <div>
        <PrimaryButton
          type="button"
          onClick={handleCreate}
          disabled={loading}
        >
          {loading ? "Creating…" : "Create draft"}
        </PrimaryButton>
      </div>
    </Shell>
  );
}
