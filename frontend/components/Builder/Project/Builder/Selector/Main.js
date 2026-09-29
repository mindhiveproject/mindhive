import { useState } from "react";
import debounce from "lodash.debounce";
import ReactHtmlParser from "react-html-parser";
import useTranslation from "next-translate/useTranslation";

import ButtonGroup from "../../../../DesignSystem/ButtonGroup";
import IconButton from "../../../../DesignSystem/IconButton";
import ToggleSwitch from "../../../../DesignSystem/ToggleSwitch";
import { TASK_TYPE_COLORS } from "../../../../../lib/taskTypeColors";
import { NodesTypesContainer } from "../Diagram/nodes-types-container/NodesTypesContainer";
import { NodeTypeLabel } from "../Diagram/node-type-label/NodeTypeLabel";

import Blocks from "./Blocks/Main";
import StudyTemplates from "./Templates/Main";

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

export default function ComponentSelector({ engine, user, addFunctions }) {
  const { t } = useTranslation("builder");
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [keyword, setKeyword] = useState("");
  const [search, setSearch] = useState("");
  const [activeSection, setActiveSection] = useState("SURVEY");

  const debouncedSearch = debounce((value) => {
    setSearch(value);
  }, 1000);

  const saveToState = (e) => {
    setKeyword(e?.target?.value);
    debouncedSearch(e?.target?.value);
  };

  const createdBy = favoritesOnly ? "favorite" : "anyone";

  const favoritesToggle = (
    <ToggleSwitch
      id="favoritesOnly"
      checked={favoritesOnly}
      onChange={setFavoritesOnly}
      label={
        favoritesOnly
          ? t("selector.filter.favorite", {}, { default: "Favorite" })
          : t("selector.filter.all", {}, { default: "All" })
      }
    />
  );

  const components = [
    {
      index: 0,
      componentType: "SURVEY",
      title: t("selector.surveys.title", {}, { default: "Surveys" }),
      description: t(
        "selector.surveys.description",
        {},
        {
          default:
            "Want to <strong>measure participants' attitudes, experiences, or opinions</strong> through <strong>self-report</strong>? Choose from this bank of validated surveys",
        }
      ),
    },
    {
      index: 1,
      componentType: "TASK",
      title: t("selector.tasks.title", {}, { default: "Tasks" }),
      description: t(
        "selector.tasks.description",
        {},
        {
          default:
            "Want to <strong>measure a construct or variable</strong> by having participants <strong>complete an activity</strong>? Choose from this bank of validated tasks",
        }
      ),
    },
    {
      index: 2,
      componentType: "BLOCK",
      title: t("selector.basicBlocks.title", {}, { default: "Basic Blocks" }),
      description: t(
        "selector.basicBlocks.description",
        {},
        {
          default:
            "Want to include <strong>custom instructions</strong> to your participants or <strong>embed a link and/or video</strong> in your study's procedure? Select and edit a basic block",
        }
      ),
    },
  ];

  const designAccent = TASK_TYPE_COLORS.DESIGN;
  const betweenSubjectsName = t(
    "selector.studyDesign.betweenSubjects",
    {},
    { default: "Between-subjects design" }
  );

  return (
    <div className="editPane">
      <div className="addBlockFilters">
        <div className="addBlockSearch" id="search">
          <input
            type="text"
            name="keyword"
            value={keyword}
            onChange={saveToState}
            placeholder={t("selector.searchPlaceholder", {}, {
              default: "Search for blocks",
            })}
            onFocus={() => {
              engine.getModel().setLocked(true);
            }}
            onBlur={() => {
              engine.getModel().setLocked(false);
            }}
          />
        </div>
        <div className="addBlockFavorite">{favoritesToggle}</div>
      </div>

      <div className="blocksMenu" id="blocksMenu">
        <div className="blocksMenuTabs">
          <ButtonGroup
            type="Round"
            size="XSmall"
            aria-label={t("selector.sectionTabs", {}, { default: "Block types" })}
            items={[
              ...components.map((item) => ({
                value: item.componentType,
                label: item.title,
              })),
              {
                value: "DESIGN",
                label: t("selector.studyDesign.title", {}, {
                  default: "Study design",
                }),
              },
              {
                value: "TEMPLATES",
                label: t("selector.templates.title", {}, { default: "Templates" }),
              },
            ]}
            value={activeSection}
            onChange={(value) => setActiveSection(value)}
          />
        </div>

        {components.map((item) => {
          if (activeSection !== item.componentType) return null;
          return (
            <div key={item.componentType} className="blocksMenuContent">
              <p className="blocksMenuDescription">
                {ReactHtmlParser(item.description)}
              </p>
              <Blocks
                user={user}
                createdBy={createdBy}
                search={search}
                componentType={item.componentType}
                addFunctions={addFunctions}
              />
              {item.componentType === "SURVEY" &&
                (!search?.trim() ||
                  "survey builder".includes(search.trim().toLowerCase()) ||
                  "survey-builder".includes(search.trim().toLowerCase())) && (
                <div className="blocksMenuSurveyBuilder">
                  <p className="blocksMenuSurveyBuilderHint">
                    {t(
                      "selector.surveys.buildOwnLine1",
                      {},
                      {
                        default:
                          "Cannot find a tool to measure one of your study constructs?",
                      }
                    )}
                  </p>
                  <p className="blocksMenuSurveyBuilderHintStrong">
                    {t(
                      "selector.surveys.buildOwnLine2",
                      {},
                      {
                        default:
                          "Build your own with the Survey builder and teacher's help",
                      }
                    )}
                  </p>
                  <Blocks
                    user={user}
                    createdBy="anyone"
                    search=""
                    componentType="SURVEY"
                    addFunctions={addFunctions}
                    isSurveyBuilder
                  />
                </div>
              )}
            </div>
          );
        })}

        {activeSection === "DESIGN" && (
          <div className="blocksMenuContent">
            <p className="blocksMenuDescription">
              {t(
                "selector.studyDesign.description",
                {},
                {
                  default:
                    "Add block to create a difference to the design in your study",
                }
              )}
            </p>
            <div
              className="blockCard"
              style={{ "--block-accent": designAccent }}
            >
              <div className="blockCardAccent" />
              <div className="blockCardBody">
                <div className="blockCardTitle movableCard">
                  <NodesTypesContainer>
                    <NodeTypeLabel
                      model={{
                        type: "design",
                        name: betweenSubjectsName,
                      }}
                      name={betweenSubjectsName}
                    />
                  </NodesTypesContainer>
                </div>
                <div className="blockCardActions">
                  <IconButton
                    variant="filled"
                    ariaLabel={t("selector.addBlockAria", {}, {
                      default: "Add block",
                    })}
                    style={{
                      background: designAccent,
                      backgroundColor: designAccent,
                      color: "#FFFFFF",
                    }}
                    icon={
                      <MediumIcon src="/assets/icons/builder/medium-add.svg" />
                    }
                    onClick={() => {
                      addFunctions.addDesignToCanvas({
                        name: betweenSubjectsName,
                      });
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {activeSection === "TEMPLATES" && (
          <div className="blocksMenuContent">
            <p className="blocksMenuDescription">
              {ReactHtmlParser(
                t(
                  "selector.templates.description",
                  {},
                  {
                    default: "Use the flows from MindHive featured studies",
                  }
                )
              )}
            </p>
            <StudyTemplates
              user={user}
              addFunctions={addFunctions}
              createdBy={createdBy}
              search={search}
            />
          </div>
        )}
      </div>
    </div>
  );
}
