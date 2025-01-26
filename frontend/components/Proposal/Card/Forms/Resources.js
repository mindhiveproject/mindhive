import { useQuery } from "@apollo/client";
import ReactHtmlParser from "react-html-parser";

import { GET_PUBLIC_AND_PROJECT_RESOURCES } from "../../../Queries/Resource";

import { Dropdown, Icon } from "semantic-ui-react";

export default function Resources({
  proposal,
  user,
  handleChange,
  selectedResources,
}) {
  const { data, error, loading } = useQuery(GET_PUBLIC_AND_PROJECT_RESOURCES, {
    variables: { projectId: proposal?.id },
  });

  const resources = data?.resources || [];

  const publicResources = resources.filter((resource) => resource?.isPublic);
  const projectResources = resources.filter((resource) => resource?.isCustom);

  const selectedResourcesMerged = selectedResources.map((selectedResource) => {
    if (
      projectResources.filter(
        (projectResource) =>
          projectResource?.parent?.id === selectedResource?.id
      ).length > 0
    ) {
      const projectResource = projectResources.filter(
        (projectResource) =>
          projectResource?.parent?.id === selectedResource?.id
      )[0];
      return projectResource;
    } else {
      return selectedResource;
    }
  });

  const resourceOptions = publicResources.map((resource) => ({
    key: resource.id,
    text:
      projectResources.filter((r) => r?.parent?.id === resource?.id).length > 0
        ? projectResources
            .filter((r) => r?.parent?.id === resource?.id)
            .map((r) => r?.title)[0]
        : resource?.title,
    value: resource.id,
  }));

  const onChange = (event, data) => {
    handleChange({
      target: {
        name: "resources",
        value: resources?.filter((r) => data.value.includes(r?.id)),
      },
    });
  };

  return (
    <div>
      <Dropdown
        placeholder="Type resource"
        fluid
        multiple
        search
        selection
        lazyLoad
        options={resourceOptions}
        onChange={onChange}
        value={selectedResources?.map((resource) => resource?.id)}
      />

      {selectedResourcesMerged && selectedResourcesMerged.length ? (
        <>
          <div className="cardHeader">Preview Linked Resources</div>
          <div className="resourcePreview">
            {selectedResourcesMerged.map((resource) => (
              <div className="resourceBlockPreview">
                <div className="titleIcons">
                  <div>
                    <h2>{resource?.title}</h2>
                  </div>
                  <div>
                    <a
                      href={`/dashboard/resources/view?id=${resource?.id}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      <Icon name="external alternate" />
                    </a>
                  </div>
                  <div>
                    {resource?.isCustom ? (
                      <a
                        href={`/dashboard/resources/edit?id=${resource?.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icon name="pencil alternate" />
                      </a>
                    ) : (
                      <a
                        href={`/dashboard/resources/copy?id=${resource?.id}&board=${proposal?.id}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        <Icon name="pencil alternate" />
                      </a>
                    )}
                  </div>
                </div>
                <div>
                  {ReactHtmlParser(truncateHtml(resource?.content?.main))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <></>
      )}
    </div>
  );
}

function truncateHtml(html, wordLimit = 10) {
  const div = document.createElement("div");
  div.innerHTML = html;

  // Get text content
  const text = div.textContent || div.innerText;
  const words = text.trim().split(/\s+/);

  if (words.length <= wordLimit) {
    return html;
  }

  let charCount = 0;
  for (let i = 0; i < wordLimit; i++) {
    charCount += words[i].length + 1; // +1 for space
  }

  // Create temporary element to handle HTML
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;

  let result = "";
  let currentLength = 0;

  function processNode(node) {
    if (node.nodeType === 3) {
      // Text node
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

    // Element node
    result += `<${node.tagName.toLowerCase()}`;

    // Add attributes
    Array.from(node.attributes).forEach((attr) => {
      result += ` ${attr.name}="${attr.value}"`;
    });

    result += ">";

    // Process child nodes
    Array.from(node.childNodes).every((child) => processNode(child));

    result += `</${node.tagName.toLowerCase()}>`;
    return true;
  }

  Array.from(tempDiv.childNodes).every((node) => processNode(node));

  return result + "...";
}
