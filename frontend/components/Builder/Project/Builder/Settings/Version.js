import { useEffect, useMemo, useState } from "react";
import { useApolloClient, useMutation, useQuery } from "@apollo/client";
import moment from "moment";
import useTranslation from "next-translate/useTranslation";
import { Modal } from "semantic-ui-react";

import Button from "../../../../DesignSystem/Button";
import Chip from "../../../../DesignSystem/Chip";
import DropdownMenu from "../../../../DesignSystem/DropdownMenu";
import { StyledForm } from "../../../../styles/StyledForm";

import {
  DATASETS_USING_STUDY_VERSION,
  STUDY_VERSION_DIAGRAM,
  STUDY_VERSIONS,
} from "../../../../Queries/StudyVersion";
import {
  DELETE_STUDY_VERSION,
  UPDATE_STUDY_VERSION,
} from "../../../../Mutations/StudyVersion";
import { UPDATE_STUDY } from "../../../../Mutations/Study";

const VERSION_ACTIONS_ICON = (
  <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="M12 8c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm0 2c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2zm0 6c-1.1 0-2 .9-2 2s.9 2 2 2 2-.9 2-2-.9-2-2-2z"
      fill="currentColor"
    />
  </svg>
);

// same star assets as the favorite blocks in the selector
const StarIcon = ({ filled }) => {
  const src = filled
    ? "/assets/icons/builder/medium-star-filled.svg"
    : "/assets/icons/builder/medium-star.svg";
  return (
    <span
      aria-hidden
      style={{
        display: "block",
        width: 16,
        height: 16,
        backgroundColor: "currentColor",
        WebkitMaskImage: `url(${src})`,
        WebkitMaskSize: "contain",
        WebkitMaskRepeat: "no-repeat",
        WebkitMaskPosition: "center",
        maskImage: `url(${src})`,
        maskSize: "contain",
        maskRepeat: "no-repeat",
        maskPosition: "center",
      }}
    />
  );
};

export default function StudyVersion({
  study,
  handleMultipleUpdate,
  addFunctions,
  hasStudyChanged,
}) {
  const { t } = useTranslation("builder");
  const apolloClient = useApolloClient();

  const [versionToRename, setVersionToRename] = useState(null);
  const [busyVersionId, setBusyVersionId] = useState(null);
  const [isOpen, setIsOpen] = useState(true);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  // the version that has been put on the canvas and is not saved yet
  const [loadedVersion, setLoadedVersion] = useState(null);

  useEffect(() => {
    // the study has been saved, so the loaded version is the study design now
    if (!hasStudyChanged) setLoadedVersion(null);
  }, [hasStudyChanged]);

  const studyId = study?.id;

  const { data, loading, refetch } = useQuery(STUDY_VERSIONS, {
    variables: { studyId },
    skip: !studyId,
  });

  // the versions marked as important stay on top, the rest keeps the newest
  // first order returned by the query
  const versions = useMemo(() => {
    const list = data?.studyVersions || [];
    return [...list].sort(
      (a, b) => (b?.isFavorite ? 1 : 0) - (a?.isFavorite ? 1 : 0)
    );
  }, [data]);

  const favoriteCount = versions.filter((version) => version?.isFavorite).length;
  // the filter turns itself off when the last important version loses its star,
  // so the list can never end up empty with no way back
  const showFavoritesOnly = favoritesOnly && favoriteCount > 0;
  const visibleVersions = showFavoritesOnly
    ? versions.filter((version) => version?.isFavorite)
    : versions;

  // the version stamped on the collected data, which does not follow every save
  const collectionVersionId = study?.currentVersion;
  const isCollecting = study?.dataCollectionStatus !== "NOT_STARTED";

  // the mutation returns currentVersion, so the cached study is updated in
  // whichever builder is showing this panel
  const [updateStudy] = useMutation(UPDATE_STUDY, {
    variables: { id: studyId },
  });

  const [deleteStudyVersion] = useMutation(DELETE_STUDY_VERSION);

  // the mutation returns isFavorite, so the cached version is updated in place
  // and the list reorders without a refetch
  const [updateStudyVersion] = useMutation(UPDATE_STUDY_VERSION);

  const toggleFavorite = (version) =>
    updateStudyVersion({
      variables: {
        id: version?.id,
        input: { isFavorite: !version?.isFavorite },
      },
    }).catch((error) => alert(error?.message));

  // Put an older snapshot back on the canvas. The snapshot itself is never
  // rewritten: saving afterwards stores the restored design as a new version.
  const loadVersion = async (version) => {
    if (hasStudyChanged) {
      const shouldLoad = confirm(
        t(
          "version.confirmLoadUnsaved",
          {},
          {
            default:
              "You have unsaved changes on the canvas. They will be replaced by this version. Save the study first if you want to keep them. Load this version anyway?",
          }
        )
      );
      if (!shouldLoad) return;
    }

    setBusyVersionId(version?.id);
    try {
      const { data: versionData } = await apolloClient.query({
        query: STUDY_VERSION_DIAGRAM,
        variables: { id: version?.id },
        fetchPolicy: "network-only",
      });

      const { diagram, flow } = versionData?.studyVersion || {};
      if (!diagram) {
        alert(
          t(
            "version.missingDiagram",
            {},
            { default: "This version has no saved diagram to load." }
          )
        );
        return;
      }

      const result = addFunctions.addStudyTemplateToCanvas({
        study: { diagram },
      });
      if (!result) return;

      // The canvas connects the links of a loaded diagram asynchronously, so
      // reading the study flow back from it right now would return the starting
      // point only. The version carries the flow as it was when it was saved,
      // which is what the study state gets. Both updates also mark the study as
      // changed, so the restored design is stored as a new version on save.
      setLoadedVersion(version);

      if (flow) {
        handleMultipleUpdate({ diagram, flow });
      } else {
        // versions migrated from the old versionHistory have no stored flow,
        // so the canvas is read once it has finished connecting its links
        handleMultipleUpdate({ diagram });
        setTimeout(() => {
          const settled = addFunctions?.getDiagramState?.();
          if (settled?.flow) {
            handleMultipleUpdate({
              diagram: settled.diagram,
              flow: settled.flow,
            });
          }
        }, 0);
      }
    } finally {
      setBusyVersionId(null);
    }
  };

  const deleteVersion = async (version) => {
    if (version?.isFavorite) {
      alert(
        t(
          "version.cannotDeleteFavorite",
          {},
          {
            default:
              "This version is marked as important and cannot be deleted. Remove the star first.",
          }
        )
      );
      return;
    }

    if (version?.id === collectionVersionId) {
      alert(
        t(
          "version.cannotDeleteCollectionVersion",
          {},
          {
            default:
              "This version is used for data collection and cannot be deleted. Choose another version for data collection first.",
          }
        )
      );
      return;
    }

    setBusyVersionId(version?.id);
    try {
      // keep the version labels of the already collected data resolvable
      const { data: usage } = await apolloClient.query({
        query: DATASETS_USING_STUDY_VERSION,
        variables: {
          studyId,
          versionIds: [version?.id, version?.legacyId].filter(Boolean),
        },
        fetchPolicy: "network-only",
      });

      if (usage?.datasetsCount > 0) {
        alert(
          t(
            "version.cannotDeleteWithData",
            { count: usage?.datasetsCount },
            {
              default:
                "This version cannot be deleted because {{count}} collected records refer to it.",
            }
          )
        );
        return;
      }

      const confirmed = confirm(
        t(
          "version.confirmDelete",
          { versionName: version?.name || "" },
          { default: "Are you sure you want to delete {{versionName}}?" }
        )
      );
      if (!confirmed) return;

      await deleteStudyVersion({ variables: { id: version?.id } });
      await refetch();
    } finally {
      setBusyVersionId(null);
    }
  };

  const useForDataCollection = async (version) => {
    if (isCollecting) {
      const confirmed = confirm(
        t(
          "version.confirmChangeCollectionVersion",
          {},
          {
            default:
              "Data collection has already started. If you change the data collection version, the records collected from now on are labelled with this version. Continue?",
          }
        )
      );
      if (!confirmed) return;
    }

    setBusyVersionId(version?.id);
    try {
      await updateStudy({
        variables: { input: { currentVersion: version?.id } },
      });
    } finally {
      setBusyVersionId(null);
    }
  };

  const collectionVersion = versions.find(
    (version) => version?.id === collectionVersionId
  );

  return (
    <div className="settingsSection" id="studyVersion">
      <button
        type="button"
        className="settingsSectionToggle"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
      >
        <h2>
          {t("version.title", {}, { default: "Study versions" })}
          {versions.length > 0 && (
            <span className="versionCount">{versions.length}</span>
          )}
        </h2>
        <span className={isOpen ? "versionChevron open" : "versionChevron"} />
      </button>

      {isOpen && (
        <>
          <p className="settingsSectionNote">
            {t(
              "version.headerNote",
              {},
              {
                default:
                  "Every time you save a changed study design, it is stored here as a version.",
              }
            )}
          </p>

          {collectionVersionId && (
            <p className="versionCollectionNote">
              {t(
                "version.dataCollectionVersion",
                {},
                { default: "Data collection version" }
              )}
              {": "}
              <strong>
                {collectionVersion?.name ||
                  t(
                    "version.unknownVersion",
                    {},
                    { default: "A version that is no longer available" }
                  )}
              </strong>
            </p>
          )}

          {loadedVersion && hasStudyChanged && (
            <p className="versionLoadedNote">
              {t(
                "version.loadedNote",
                { versionName: loadedVersion?.name || "" },
                {
                  default:
                    "{{versionName}} is on the canvas but not saved yet. Save the study to keep it.",
                }
              )}
            </p>
          )}

          {favoriteCount > 0 && (
            <div className="versionFilterRow">
              <Chip
                label={t(
                  "version.onlyImportant",
                  { count: favoriteCount },
                  { default: "Only important ({{count}})" }
                )}
                selected={showFavoritesOnly}
                onClick={() => setFavoritesOnly(!showFavoritesOnly)}
                leading={<StarIcon filled={showFavoritesOnly} />}
                shape="pill"
              />
            </div>
          )}

          {loading && (
            <p className="settingsEmptyNote">
              {t("version.loading", {}, { default: "Loading versions..." })}
            </p>
          )}

          {!loading && !versions.length && (
            <p className="settingsEmptyNote">
              {t(
                "version.noVersionSaved",
                {},
                {
                  default:
                    "No version has been saved yet. Save the study to store the first version of your design.",
                }
              )}
            </p>
          )}

          {!loading && versions.length > 0 && (
            <ul className="versionList">
              {visibleVersions.map((version) => {
                const isCollectionVersion =
                  version?.id === collectionVersionId;
                const isBusy = busyVersionId === version?.id;
                return (
                  <li className="versionListItem" key={version?.id}>
                    <button
                      type="button"
                      className={
                        version?.isFavorite
                          ? "versionStarBtn isFavorite"
                          : "versionStarBtn"
                      }
                      onClick={() => toggleFavorite(version)}
                      aria-pressed={!!version?.isFavorite}
                      title={
                        version?.isFavorite
                          ? t(
                              "version.removeFromImportant",
                              {},
                              { default: "Remove from important versions" }
                            )
                          : t(
                              "version.markAsImportant",
                              {},
                              { default: "Mark as important" }
                            )
                      }
                    >
                      <StarIcon filled={!!version?.isFavorite} />
                    </button>

                    <div className="versionListItemText">
                      <span className="versionListItemNameRow">
                        <span
                          className="versionListItemName"
                          title={version?.description || version?.name}
                        >
                          {version?.name}
                        </span>
                        {isCollectionVersion && (
                          <span className="versionListItemBadge">
                            {t(
                              "version.dataCollectionBadge",
                              {},
                              { default: "Data collection" }
                            )}
                          </span>
                        )}
                      </span>
                      <span className="versionListItemDate">
                        {moment(version?.createdAt).format("MMM D, HH:mm")}
                        {version?.createdBy?.username
                          ? ` · ${version?.createdBy?.username}`
                          : ""}
                      </span>
                    </div>

                    <DropdownMenu
                      ariaLabel={t(
                        "version.actionsFor",
                        { versionName: version?.name || "" },
                        { default: "Actions for {{versionName}}" }
                      )}
                      trigger={VERSION_ACTIONS_ICON}
                      triggerStyle={{ minWidth: "28px", minHeight: "28px" }}
                      items={[
                        {
                          key: "load",
                          label: t("version.load", {}, { default: "Load" }),
                          onClick: () => !isBusy && loadVersion(version),
                        },
                        {
                          key: "rename",
                          label: t("version.rename", {}, { default: "Rename" }),
                          onClick: () => !isBusy && setVersionToRename(version),
                        },
                        ...(isCollectionVersion
                          ? []
                          : [
                              {
                                key: "collect",
                                label: t(
                                  "version.useForDataCollection",
                                  {},
                                  { default: "Use for data collection" }
                                ),
                                onClick: () =>
                                  !isBusy && useForDataCollection(version),
                              },
                              {
                                key: "delete",
                                label: t(
                                  "version.delete",
                                  {},
                                  { default: "Delete" }
                                ),
                                danger: true,
                                onClick: () => !isBusy && deleteVersion(version),
                              },
                            ]),
                      ]}
                    />
                  </li>
                );
              })}
            </ul>
          )}
        </>
      )}

      {versionToRename && (
        <RenameVersionModal
          version={versionToRename}
          onClose={() => setVersionToRename(null)}
          onRenamed={refetch}
        />
      )}
    </div>
  );
}

function RenameVersionModal({ version, onClose, onRenamed }) {
  const { t } = useTranslation("builder");
  const [name, setName] = useState(version?.name || "");
  const [description, setDescription] = useState(version?.description || "");

  const [updateStudyVersion, { loading }] = useMutation(UPDATE_STUDY_VERSION);

  const save = async () => {
    if (!name) {
      alert(
        t(
          "version.enterVersionName",
          {},
          { default: "Please enter the version name" }
        )
      );
      return;
    }
    await updateStudyVersion({
      variables: { id: version?.id, input: { name, description } },
    });
    await onRenamed();
    onClose();
  };

  return (
    <Modal onClose={onClose} open dimmer="blurring" size="small" closeIcon>
      <Modal.Header>
        <h2>{t("version.renameVersion", {}, { default: "Rename version" })}</h2>
      </Modal.Header>

      <Modal.Content>
        <StyledForm>
          <label htmlFor="name">
            {t("version.name", {}, { default: "Name" })}
            <input
              type="text"
              name="name"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          <label htmlFor="description">
            {t("version.description", {}, { default: "Description" })}
            <input
              type="text"
              name="description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
        </StyledForm>
      </Modal.Content>

      <Modal.Actions>
        <div className="versionModalActions">
          <Button variant="text" onClick={onClose}>
            {t("version.cancel", {}, { default: "Cancel" })}
          </Button>
          <Button variant="filled" disabled={loading} onClick={save}>
            {t("version.save", {}, { default: "Save" })}
          </Button>
        </div>
      </Modal.Actions>
    </Modal>
  );
}
