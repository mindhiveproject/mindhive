import { useEffect, useMemo, useRef } from "react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";

import Chip from "../../../../DesignSystem/Chip";
import { GET_USER_CLASSES } from "../../../../Queries/User";

const NO_CLASS_VALUE = null;

function dedupeClasses(classes) {
  const seen = new Set();
  return (classes || []).filter((cl) => {
    if (!cl?.id || seen.has(cl.id)) return false;
    seen.add(cl.id);
    return true;
  });
}

/** Most recently created class first ("youngest"). */
function sortYoungestFirst(classes) {
  return [...classes].sort((a, b) => {
    const aTime = a?.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bTime = b?.createdAt ? new Date(b.createdAt).getTime() : 0;
    return bTime - aTime;
  });
}

export default function LinkClass({ study, handleChange }) {
  const { t } = useTranslation("builder");
  const { data, loading } = useQuery(GET_USER_CLASSES);
  const didApplyDefault = useRef(false);

  const myClasses = useMemo(() => {
    const user = data?.authenticatedItem || {
      studentIn: [],
      teacherIn: [],
      teachingTeamIn: [],
      mentorIn: [],
    };
    return sortYoungestFirst(
      dedupeClasses([
        ...(user.studentIn || []),
        ...(user.teacherIn || []),
        ...(user.teachingTeamIn || []),
        ...(user.mentorIn || []),
      ])
    );
  }, [data]);

  const isExistingStudy = Boolean(study?.id);
  const connectedClasses = Array.isArray(study?.classes) ? study.classes : [];
  const isDisconnected =
    study?.classes === NO_CLASS_VALUE ||
    (isExistingStudy && connectedClasses.length === 0);
  const selectedId = isDisconnected ? null : (connectedClasses[0]?.id ?? null);
  const hasValidClassSelection =
    Boolean(selectedId) && myClasses.some((cl) => cl.id === selectedId);

  useEffect(() => {
    if (loading || data === undefined) return;

    // Existing studies keep the saved class (or none). Do not invent a selection.
    if (isExistingStudy) {
      didApplyDefault.current = true;
      return;
    }

    // Already have a real selection (class or explicit disconnect).
    if (isDisconnected || hasValidClassSelection) {
      didApplyDefault.current = true;
      return;
    }

    // Parent may have wiped state back to []; allow re-applying the default.
    if (didApplyDefault.current && connectedClasses.length > 0) {
      return;
    }

    if (myClasses.length > 0) {
      didApplyDefault.current = true;
      handleChange({
        target: {
          name: "classes",
          value: [{ id: myClasses[0].id }],
        },
      });
      return;
    }

    didApplyDefault.current = true;
    handleChange({
      target: {
        name: "classes",
        value: NO_CLASS_VALUE,
      },
    });
  }, [
    loading,
    data,
    myClasses,
    hasValidClassSelection,
    isDisconnected,
    isExistingStudy,
    connectedClasses.length,
  ]);

  const onSelectClass = (cl) => {
    didApplyDefault.current = true;
    handleChange({
      target: {
        name: "classes",
        value: [{ id: cl.id }],
      },
    });
  };

  const onSelectNoClass = () => {
    didApplyDefault.current = true;
    handleChange({
      target: {
        name: "classes",
        value: NO_CLASS_VALUE,
      },
    });
  };

  const noClassLabel = t("linkClass.doNotConnectClass", {}, {
    default: "Do not connect to class",
  });

  const displaySelectedId =
    selectedId
    || (!isExistingStudy && !isDisconnected && myClasses[0]?.id)
    || null;
  const displayDisconnected =
    isDisconnected
    || (isExistingStudy && !displaySelectedId)
    || (!loading && data !== undefined && myClasses.length === 0);

  return (
    <div
      className="classChipRow"
      role="radiogroup"
      aria-label={t("newProject.selectClass", {}, {
        default: "Select the class",
      })}
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "8px",
        margin: "4px 0 0",
      }}
    >
      {myClasses.map((cl) => (
        <Chip
          key={cl.id}
          label={cl.title}
          selected={displaySelectedId === cl.id && !displayDisconnected}
          onClick={() => onSelectClass(cl)}
        />
      ))}
      <Chip
        label={noClassLabel}
        selected={displayDisconnected}
        onClick={onSelectNoClass}
      />
    </div>
  );
}
