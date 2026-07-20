import { useState } from "react";
import uniqid from "uniqid";
import useTranslation from "next-translate/useTranslation";

import { NodesTypesContainer } from "../../Diagram/nodes-types-container/NodesTypesContainer";
import { NodeTypeLabel } from "../../Diagram/node-type-label/NodeTypeLabel";

import IconButton from "../../../../../DesignSystem/IconButton";
import TaskModal from "../Task/Modal";
import ManageFavorite from "../../../../../User/ManageFavorite";

const TASK_TYPE_COLORS = {
  BLOCK: "#CF6D6A",
  TASK: "#3D85B0",
  SURVEY: "#3D85B0",
  DESIGN: "#007C70",
};

const SECONDARY_ICON_STYLE = {
  background: "#F3F3F3",
  backgroundColor: "#F3F3F3",
  color: "#171717",
};

const ICON_MASK = (src) => ({
  display: "block",
  width: 24,
  height: 24,
  backgroundColor: "currentColor",
  WebkitMaskImage: `url(${src})`,
  WebkitMaskSize: "contain",
  WebkitMaskRepeat: "no-repeat",
  WebkitMaskPosition: "center",
  maskImage: `url(${src})`,
  maskSize: "contain",
  maskRepeat: "no-repeat",
  maskPosition: "center",
});

function MediumIcon({ src }) {
  return <span aria-hidden style={ICON_MASK(src)} />;
}

export default function Card({
  user,
  component,
  addFunctions,
  search,
  componentType,
  isSurveyBuilder = false,
}) {
  const { t } = useTranslation("builder");
  const [showModal, setShowModal] = useState(false);
  const accent =
    TASK_TYPE_COLORS[component?.taskType] || TASK_TYPE_COLORS.BLOCK;

  const toggleModal = () => {
    setShowModal(!showModal);
  };

  const handleAdd = () => {
    addFunctions?.addComponentToCanvas({
      name: component?.title,
      details: component?.description,
      componentID: component?.id,
      testId: uniqid.time(),
      taskType: component?.taskType,
      subtitle: component?.subtitle,
      descriptionForParticipants: component?.descriptionForParticipants,
      settings: component?.settings,
      resources: component?.resources,
      aggregateVariables: component?.aggregateVariables,
      addInfo: component?.addInfo,
      parameters: component?.parameters,
    });
  };

  const previewHref = component.link
    ? component.link
    : `/preview/${component?.taskType?.toLowerCase()}/${component?.id}`;

  return (
    <>
      <div className="blockCard" style={{ "--block-accent": accent }}>
        <div className="blockCardAccent" />
        <div className="blockCardBody">
          <div className="blockCardTitle movableCard">
            <NodesTypesContainer>
              <NodeTypeLabel
                model={{
                  type: "component",
                  ports: "in",
                  name: component?.title,
                  details: component?.description,
                  componentID: component.id,
                  taskType: component?.taskType,
                  subtitle: component?.subtitle,
                  descriptionForParticipants:
                    component?.descriptionForParticipants,
                  settings: component?.settings,
                  resources: component?.resources,
                  aggregateVariables: component?.aggregateVariables,
                  addInfo: component?.addInfo,
                  parameters: component?.parameters,
                }}
                name={component?.title}
              />
            </NodesTypesContainer>
          </div>
          <div className="blockCardActions">
            {!isSurveyBuilder && (
              <>
                <ManageFavorite
                  user={user}
                  search={search}
                  componentType={componentType}
                  id={component?.id}
                  render={({ isFavorite, onToggle }) => (
                    <IconButton
                      variant="filled"
                      style={SECONDARY_ICON_STYLE}
                      ariaLabel={
                        isFavorite
                          ? t("selector.removeFavoriteAria", {}, {
                              default: "Remove from favorites",
                            })
                          : t("selector.addFavoriteAria", {}, {
                              default: "Add to favorites",
                            })
                      }
                      icon={
                        <MediumIcon
                          src={
                            isFavorite
                              ? "/assets/icons/builder/medium-star-filled.svg"
                              : "/assets/icons/builder/medium-star.svg"
                          }
                        />
                      }
                      onClick={onToggle}
                    />
                  )}
                />
                <IconButton
                  variant="filled"
                  style={SECONDARY_ICON_STYLE}
                  ariaLabel={t("selector.infoAria", {}, {
                    default: "Block information",
                  })}
                  icon={
                    <MediumIcon src="/assets/icons/builder/medium-info.svg" />
                  }
                  onClick={toggleModal}
                />
                <IconButton
                  variant="filled"
                  style={SECONDARY_ICON_STYLE}
                  ariaLabel={t("selector.previewAria", {}, {
                    default: "Preview block",
                  })}
                  icon={
                    <MediumIcon src="/assets/icons/builder/review.svg" />
                  }
                  onClick={() => {
                    window.open(previewHref, "_blank", "noopener,noreferrer");
                  }}
                />
              </>
            )}
            <IconButton
              variant="filled"
              ariaLabel={t("selector.addBlockAria", {}, {
                default: "Add block",
              })}
              style={{
                background: accent,
                backgroundColor: accent,
                color: "#FFFFFF",
              }}
              icon={<MediumIcon src="/assets/icons/builder/medium-add.svg" />}
              onClick={handleAdd}
            />
          </div>
        </div>
      </div>

      {showModal && (
        <TaskModal
          user={user}
          component={component}
          addFunctions={addFunctions}
          onModalClose={toggleModal}
        />
      )}
    </>
  );
}
