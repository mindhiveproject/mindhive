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
      mentorIn: [],
    };
    return sortYoungestFirst(
      dedupeClasses([
        ...(user.studentIn || []),
        ...(user.teacherIn || []),
        ...(user.mentorIn || []),
      ])
    );
  }, [data]);

  const isDisconnected = study?.classes === NO_CLASS_VALUE;
  const selectedId = isDisconnected ? null : (study?.classes?.[0]?.id ?? null);
  const hasValidClassSelection =
    Boolean(selectedId) && myClasses.some((cl) => cl.id === selectedId);

  useEffect(() => {
    if (loading || data === undefined) return;

    // Already have a real selection (class or explicit disconnect).
    if (isDisconnected || hasValidClassSelection) {
      didApplyDefault.current = true;
      return;
    }

    // Parent may have wiped state back to []; allow re-applying the default.
    if (didApplyDefault.current && Array.isArray(study?.classes) && study.classes.length > 0) {
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
  }, [loading, data, myClasses, hasValidClassSelection, isDisconnected, study?.classes]);

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

  // Show youngest as selected while form state is still empty / settling.
  const displaySelectedId =
    selectedId
    || (!isDisconnected && myClasses[0]?.id)
    || null;
  const displayDisconnected =
    isDisconnected || (!loading && data !== undefined && myClasses.length === 0);

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
          shape="square"
          label={cl.title}
          selected={displaySelectedId === cl.id && !displayDisconnected}
          onClick={() => onSelectClass(cl)}
        />
      ))}
      <Chip
        shape="square"
        label={noClassLabel}
        selected={displayDisconnected}
        onClick={onSelectNoClass}
      />
    </div>
  );
}
