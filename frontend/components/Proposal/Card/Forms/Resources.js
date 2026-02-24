import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";
import {
  GET_PUBLIC_RESOURCES,
  GET_MY_RESOURCES,
} from "../../../Queries/Resource";
import { Button, Icon, Modal, Tab } from "semantic-ui-react";
import React, { useState } from "react";
import useTranslation from "next-translate/useTranslation";
import { stripHtml } from "./utils";

export default function Resources({
  proposal,
  user,
  handleChange,
  selectedResources,
}) {
  const { t } = useTranslation("classes");

  // Query for public resources
  const {
    data: publicData,
    error: publicError,
    loading: publicLoading,
  } = useQuery(GET_PUBLIC_RESOURCES);

  // Query for user's own resources
  const {
    data: myData,
    error: myError,
    loading: myLoading,
  } = useQuery(GET_MY_RESOURCES, {
    variables: { id: user?.id },
  });

  const publicResources = publicData?.resources || [];
  const myResources = myData?.resources || [];

  // Filter out resources with a parent to avoid duplicates in "My Resources" tab
  const myResourcesNoParent = myResources.filter((r) => !r?.parent);

  // Merge selected resources, prioritizing custom versions
  const selectedResourcesMerged = selectedResources.map((selectedResource) => {
    const customResource = myResources.find(
      (myResource) => myResource?.parent?.id === selectedResource?.id
    );
    return customResource || selectedResource;
  });

  const [open, setOpen] = useState(false);

  const connect = (resource) => {
    if (!selectedResources.some((s) => s.id === resource.id)) {
      const newSelected = [...selectedResources, resource];
      handleChange({ target: { name: "resources", value: newSelected } });
    }
  };

  const disconnect = (resource) => {
    const newSelected = selectedResources.filter((s) => s.id !== resource.id);
    handleChange({ target: { name: "resources", value: newSelected } });
  };

  const panes = [
    {
      menuItem: t("board.expendedCard.publicResources"),
      render: () => (
        <ResourcesTab
          resources={publicResources}
          isPublic={true}
          selectedResources={selectedResources}
          connect={connect}
          disconnect={disconnect}
          myResources={myResources}
          proposal={proposal}
        />
      ),
    },
    {
      menuItem: t("board.expendedCard.myResources"),
      render: () => (
        <ResourcesTab
          resources={myResourcesNoParent}
          isPublic={false}
          selectedResources={selectedResources}
          connect={connect}
          disconnect={disconnect}
          myResources={myResources}
          proposal={proposal}
        />
      ),
    },
  ];

  return (
    <>
      <Button
        onClick={() => setOpen(true)}
        style={{
          background: "#f0f4f8",
          color: "#007c70",
          border: "1px solid #e0e0e0",
          borderRadius: "8px",
        }}
      >
        {t("board.expendedCard.selectResources")} (
        {selectedResources.length})
      </Button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        size="large"
        style={{ borderRadius: "12px", overflow: "hidden" }}
      >
        <Modal.Header
          style={{
            background: "#f9fafb",
            borderBottom: "1px solid #e0e0e0",
            fontFamily: "Nunito",
            fontWeight: 600,
          }}
        >
          {t("board.expendedCard.selectResourcesToConnect")}
        </Modal.Header>
        <Modal.Content scrolling style={{ background: "#ffffff", padding: 0 }}>
          <Tab panes={panes} style={{ fontFamily: "Nunito" }} />
        </Modal.Content>
        <Modal.Actions
          style={{ background: "#f9fafb", borderTop: "1px solid #e0e0e0" }}
        >
          <Button
            onClick={() => setOpen(false)}
            style={{
              background: "#007c70",
              color: "#ffffff",
              borderRadius: "8px",
            }}
          >
            {t("board.expendedCard.done")}
          </Button>
        </Modal.Actions>
      </Modal>

      {selectedResourcesMerged && selectedResourcesMerged.length ? (
        <>
          <div
            className="cardHeader"
            style={{
              fontFamily: "Nunito",
              fontSize: "20px",
              fontWeight: 600,
              color: "#333",
              marginTop: "20px",
            }}
          >
            {t("board.expendedCard.previewLinkedResources")}
          </div>
          <div
            className="resourcePreview"
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
              gap: "20px",
              marginTop: "10px",
            }}
          >
            {selectedResourcesMerged.map((resource) => (
              <div
                className="resourceBlockPreview"
                key={resource.id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "12px",
                  padding: "16px",
                  background: "#ffffff",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
                }}
              >
                <div
                  className="titleIcons"
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "12px",
                  }}
                >
                  <h2
                    style={{
                      fontSize: "18px",
                      fontWeight: 600,
                      color: "#333",
                      margin: 0,
                    }}
                  >
                    {stripHtml(resource?.title)}
                  </h2>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <a
                      href={`/dashboard/resources/view?id=${resource?.id}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{ color: "#007c70" }}
                    >
                      <Icon name="external alternate" />
                    </a>
                    {resource?.isCustom ? (
                      <a
                        href={`/dashboard/resources/edit?id=${resource?.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#007c70" }}
                      >
                        <Icon name="pencil alternate" />
                      </a>
                    ) : (
                      <a
                        href={`/dashboard/resources/copy?id=${resource?.id}&p=${proposal?.id}`}
                        target="_blank"
                        rel="noreferrer"
                        style={{ color: "#007c70" }}
                      >
                        <Icon name="pencil alternate" />
                      </a>
                    )}
                  </div>
                </div>
                <div
                  style={{ fontSize: "14px", color: "#666", lineHeight: "1.5" }}
                >
                  {ReactHtmlParser(truncateHtml(resource?.content?.main, 50))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <></>
      )}
    </>
  );
}

const ResourcesTab = ({
  resources,
  isPublic,
  selectedResources,
  connect,
  disconnect,
  myResources,
  proposal,
}) => {
  const { t } = useTranslation();

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
        gap: "24px",
        padding: "24px",
        background: "#f9fafb",
      }}
    >
      {resources.map((r) => {
        let displayR = r;
        if (isPublic) {
          const custom = myResources.find((p) => p.parent?.id === r.id);
          if (custom) displayR = custom;
        }

        const isSelected = selectedResources.some((s) => s.id === r.id);

        return (
          <div
            key={r.id}
            style={{
              border: "1px solid #e0e0e0",
              borderRadius: "12px",
              padding: "16px",
              background: "#ffffff",
              boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
              transition: "box-shadow 0.3s ease",
            }}
            onMouseEnter={(e) =>
              (e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)")
            }
            onMouseLeave={(e) =>
              (e.currentTarget.style.boxShadow = "0 2px 8px rgba(0,0,0,0.05)")
            }
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h2
                style={{
                  fontSize: "18px",
                  fontWeight: 600,
                  color: "#333",
                  margin: 0,
                }}
              >
                {stripHtml(displayR.title)}
              </h2>
              <div style={{ display: "flex", gap: "12px" }}>
                <a
                  href={`/dashboard/resources/view?id=${displayR.id}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: "#007c70" }}
                >
                  <Icon name="external alternate" />
                </a>
                {displayR.isCustom ? (
                  <a
                    href={`/dashboard/resources/edit?id=${displayR.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#007c70" }}
                  >
                    <Icon name="pencil alternate" />
                  </a>
                ) : (
                  <a
                    href={`/dashboard/resources/copy?id=${displayR.id}&p=${proposal.id}`}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#007c70" }}
                  >
                    <Icon name="pencil alternate" />
                  </a>
                )}
              </div>
            </div>
            <div
              style={{
                fontSize: "14px",
                color: "#666",
                lineHeight: "1.5",
                marginBottom: "16px",
              }}
            >
              {ReactHtmlParser(truncateHtml(displayR?.content?.main, 100))}
            </div>
            <Button
              fluid
              onClick={() => (isSelected ? disconnect(r) : connect(r))}
              style={{
                background: isSelected ? "#ff4d4f" : "#52c41a",
                color: "#ffffff",
                borderRadius: "8px",
                fontWeight: 500,
              }}
            >
              {isSelected
                ? t("board.expendedCard.disconnect")
                : t("board.expendedCard.connect")}
            </Button>
          </div>
        );
      })}
    </div>
  );
};

function truncateHtml(html, wordLimit = 10) {
  const div = document.createElement("div");
  div.innerHTML = html;

  const text = div.textContent || div.innerText;
  const words = text.trim().split(/\s+/);

  if (words.length <= wordLimit) {
    return html;
  }

  let charCount = 0;
  for (let i = 0; i < wordLimit; i++) {
    charCount += words[i].length + 1;
  }

  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  let result = "";
  let currentLength = 0;

  function processNode(node) {
    if (node.nodeType === 3) {
      const text = node.textContent;
      const remaining = charCount - currentLength;

      if (currentLength >= charCount) {
        return false;
      }

      if (currentLength + text.length > charCount) {
        const truncated = text.substr(0, remaining).trim();
        result += truncated;
        currentLength += truncated.length;
        return false;
      }

      result += text;
      currentLength += text.length;
      return true;
    }

    result += `<${node.tagName.toLowerCase()}`;

    Array.from(node.attributes).forEach((attr) => {
      result += ` ${attr.name}="${attr.value}"`;
    });

    result += ">";

    Array.from(node.childNodes).every((child) => processNode(child));

    result += `</${node.tagName.toLowerCase()}>`;
    return true;
  }

  Array.from(tempDiv.childNodes).every((node) => processNode(node));

  return result + "...";
}
