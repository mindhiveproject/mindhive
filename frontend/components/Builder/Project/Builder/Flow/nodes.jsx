import { memo, useEffect, useRef, useState } from "react";
import { Handle, Position, useUpdateNodeInternals } from "@xyflow/react";
import { useQuery } from "@apollo/client";
import useTranslation from "next-translate/useTranslation";
import moment from "moment";

import { StyledNode } from "./nodeStyles";
import { TASK_TO_PARTICIPATE } from "../../../../Queries/Task";
import { STUDY_DATA_SOURCES } from "../../../../Queries/DataSourceBlock";
import { RecordDotIcon } from "../../../../DesignSystem/Icons";
import { IN_HANDLE, OUT_HANDLE } from "../../../../../lib/studyGraph";
import { useCanvasActions } from "./CanvasActions";
import { StyledFlowComment } from "./styles";

// Handles are drawn like the Storm ports: a 20px green dot centred on the
// top (input) or bottom (outputs) edge of the block.
function InHandle({ isLocked }) {
  return (
    <Handle
      type="target"
      position={Position.Top}
      id={IN_HANDLE}
      className="studyHandle"
      isConnectable={!isLocked}
    />
  );
}

function OutHandle({ id, isLocked, isFull, style }) {
  return (
    <Handle
      type="source"
      position={Position.Bottom}
      id={id}
      className="studyHandle"
      style={style}
      // a full output cannot start another link (one link per output)
      isConnectableStart={!isLocked && !isFull}
      isConnectableEnd={false}
    />
  );
}

const PencilIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" aria-hidden focusable="false">
    <path
      d="M3 17.25V21h3.75L17.81 9.94l-3.75-3.75L3 17.25zM20.71 7.04a1 1 0 0 0 0-1.41l-2.34-2.34a1 1 0 0 0-1.41 0l-1.83 1.83 3.75 3.75 1.83-1.83z"
      fill="currentColor"
    />
  </svg>
);

/**
 * A task block's subtitle, edited in place: double-click it or use the
 * pencil; Enter or leaving the field saves, Escape cancels. Not editable on a
 * locked study, nor while the block is open in the side panel (which edits
 * the same field and would save over it).
 */
function Subtitle({ id, subtitle, canEdit }) {
  const { t } = useTranslation("builder");
  const actions = useCanvasActions();
  const [isEditing, setIsEditing] = useState(false);
  const cancelledRef = useRef(false);

  useEffect(() => {
    if (!canEdit) setIsEditing(false);
  }, [canEdit]);

  const editLabel = t("canvas.editSubtitle", {}, { default: "Edit subtitle" });

  if (isEditing) {
    return (
      <input
        className="node-subtitle-input nodrag nowheel"
        aria-label={editLabel}
        defaultValue={subtitle || ""}
        maxLength={300}
        autoFocus
        onFocus={(event) => event.target.select()}
        onKeyDown={(event) => {
          event.stopPropagation();
          if (event.key === "Enter") {
            event.preventDefault();
            event.currentTarget.blur();
          } else if (event.key === "Escape") {
            cancelledRef.current = true;
            event.currentTarget.blur();
          }
        }}
        onBlur={(event) => {
          const value = event.target.value.trim();
          if (!cancelledRef.current && value !== (subtitle || "")) {
            actions.updateSubtitle?.(id, value);
          }
          cancelledRef.current = false;
          setIsEditing(false);
        }}
      />
    );
  }

  return (
    <div
      className="node-subtitle"
      onDoubleClick={
        canEdit
          ? (event) => {
              event.stopPropagation();
              setIsEditing(true);
            }
          : undefined
      }
    >
      <span className="node-subtitle-text" title={subtitle || undefined}>
        {subtitle}
      </span>
      {canEdit && (
        <button
          type="button"
          className="node-subtitle-edit nodrag"
          title={editLabel}
          aria-label={editLabel}
          onClick={(event) => {
            event.stopPropagation();
            setIsEditing(true);
          }}
        >
          <PencilIcon />
        </button>
      )}
    </div>
  );
}

export const AnchorNode = memo(function AnchorNode({ data }) {
  const { t } = useTranslation("builder");
  const actions = useCanvasActions();
  return (
    <StyledNode taskType="ANCHOR">
      <div className="anchoredArea">
        <div className="node-header-container" style={{ backgroundColor: "white" }}>
          <div className="node-header-text">
            {t("canvas.participantRegistration", {}, { default: "Participant registration" })}
          </div>
          <div
            className="icon nodrag"
            role="button"
            title={t("canvas.previewStudy", {}, { default: "Preview the study" })}
            onClick={() => actions.openStudyPreview?.()}
          >
            <img src="/assets/icons/builder/play.svg" alt="" />
          </div>
        </div>
        <div className="node-content">
          {t("canvas.startHere", {}, { default: "Start building your study from here" })}
        </div>
      </div>
      <OutHandle
        id={OUT_HANDLE}
        isLocked={actions.isLocked}
        isFull={data.usedHandles?.includes(OUT_HANDLE)}
      />
    </StyledNode>
  );
});

export const TaskNode = memo(function TaskNode({ id, data }) {
  const { t } = useTranslation("builder");
  const actions = useCanvasActions();
  const [isDuplicating, setIsDuplicating] = useState(false);

  const { data: taskData } = useQuery(TASK_TO_PARTICIPATE, {
    variables: { id: data.componentID },
    skip: !data.componentID,
  });

  // Data sources that run during this block: a source's `scope` is "study"
  // (every block) or { steps: [...] } (only those block ids).
  const { data: sourcesData } = useQuery(STUDY_DATA_SOURCES, {
    variables: { studyId: actions.studyId },
    skip: !actions.studyId,
  });
  const recordingSources = (sourcesData?.studyDataSources || []).filter(
    (source) =>
      !Array.isArray(source.scope?.steps) || source.scope.steps.includes(id)
  );

  const open = (panel) =>
    actions.openComponentModal?.({
      nodeId: id,
      isEditorOpen: panel === "editor",
      isInfoOpen: panel === "info",
      isPreviewOpen: panel === "preview",
    });

  return (
    <StyledNode taskType={data.taskType}>
      <div className="node-header-container" id="block">
        <div className="node-header-text">{taskData?.task?.title || data.name}</div>
        <div className="node-header-icons nodrag">
          <div className="icon" role="button" id="blockSettings" onClick={() => open("editor")}>
            <img src="/assets/icons/builder/settings.svg" alt="" />
          </div>
          {actions.duplicateNode && !actions.isLocked && (
            <div
              className="icon"
              role="button"
              id="blockDuplicate"
              title={t("engine.duplicate", {}, { default: "Duplicate block" })}
              aria-label={t("engine.duplicate", {}, { default: "Duplicate block" })}
              style={{ opacity: isDuplicating ? 0.5 : 1 }}
              onClick={async () => {
                if (isDuplicating) return;
                setIsDuplicating(true);
                try {
                  await actions.duplicateNode(id);
                } finally {
                  setIsDuplicating(false);
                }
              }}
            >
              <img src="/assets/icons/builder/duplicate.svg" alt="" />
            </div>
          )}
          <div className="icon" role="button" id="blockInfo" onClick={() => open("info")}>
            <img src="/assets/icons/builder/info.svg" alt="" />
          </div>
          <div className="icon" role="button" id="blockPlay" onClick={() => open("preview")}>
            <img src="/assets/icons/builder/play.svg" alt="" />
          </div>
        </div>
      </div>

      <InHandle isLocked={actions.isLocked} />

      <div className="node-content">
        <Subtitle
          id={id}
          subtitle={data.subtitle}
          canEdit={!actions.isLocked && actions.panelNodeId !== id}
        />
        {recordingSources.length > 0 && (
          <div className="node-recording">
            <RecordDotIcon width={16} height={16} className="node-recording-dot" />
            <span className="node-recording-text">
              {recordingSources.length === 1
                ? t(
                    "dataSources.canvas.recordingOne",
                    { name: recordingSources[0].label || recordingSources[0].block?.title },
                    { default: "Recording · {{name}}" }
                  )
                : t(
                    "dataSources.canvas.recordingMany",
                    { count: recordingSources.length },
                    { default: "Recording · {{count}} devices" }
                  )}
            </span>
          </div>
        )}
      </div>

      <OutHandle
        id={OUT_HANDLE}
        isLocked={actions.isLocked}
        isFull={data.usedHandles?.includes(OUT_HANDLE)}
      />
    </StyledNode>
  );
});

export const DesignNode = memo(function DesignNode({ id, data }) {
  const actions = useCanvasActions();
  const conditions = data.conditions || [];

  // React Flow measures a block's handles once; when conditions (outputs)
  // are added, removed or reordered it has to measure them again, or the
  // new ones cannot start a link.
  const updateNodeInternals = useUpdateNodeInternals();
  const handleKey = conditions.map((c) => c.name).join("|");
  useEffect(() => {
    updateNodeInternals(id);
  }, [id, handleKey, updateNodeInternals]);
  return (
    <StyledNode taskType="DESIGN">
      <div className="node-header-container" style={{ backgroundColor: "white" }}>
        <div className="node-header-text">{data.name}</div>
        <div className="node-header-icons nodrag">
          <div
            className="icon"
            role="button"
            onClick={() => actions.openDesignSettings?.({ nodeId: id })}
          >
            <img src="/assets/icons/builder/settings.svg" alt="" />
          </div>
        </div>
      </div>

      <InHandle isLocked={actions.isLocked} />

      <div className="node-content">{data.details}</div>

      {conditions.map((condition, index) => {
        const left = `${((index + 1) * 100) / (conditions.length + 1)}%`;
        return (
          <div key={condition.name}>
            <div className="conditionLabel" style={{ left }}>
              {condition.label}
            </div>
            <OutHandle
              id={condition.name}
              isLocked={actions.isLocked}
              isFull={data.usedHandles?.includes(condition.name)}
              style={{ left }}
            />
          </div>
        );
      })}
    </StyledNode>
  );
});

export const CommentNode = memo(function CommentNode({ id, data }) {
  const actions = useCanvasActions();
  const ref = useRef(null);

  const fitHeight = () => {
    if (!ref.current) return;
    ref.current.style.height = "auto";
    ref.current.style.height = `${ref.current.scrollHeight + 10}px`;
  };
  // Text saved by someone else replaces the note's text, unless this person
  // is typing in it (their own text is saved when they leave the note)
  useEffect(() => {
    const el = ref.current;
    if (el && document.activeElement !== el && el.value !== (data.content || "")) {
      el.value = data.content || "";
    }
    fitHeight();
  }, [data.content]);

  return (
    <StyledFlowComment>
      <div className="comment-header-container">
        <div className="comment-header-text">{data.author}</div>
        <div className="comment-header-text">
          {data.time ? moment(data.time).fromNow() : ""}
        </div>
      </div>
      <div className="comment-content">
        <textarea
          // typing, selecting text and scrolling stay in the note
          className="nodrag nowheel"
          ref={ref}
          rows={1}
          placeholder="Enter text here..."
          disabled={actions.isLocked}
          onInput={fitHeight}
          onBlur={(event) => {
            const content = event.target.value;
            if (content !== (data.content || "")) {
              actions.updateComment?.(id, { content, time: Date.now() });
            }
          }}
          defaultValue={data.content}
        />
      </div>
    </StyledFlowComment>
  );
});

export const nodeTypes = {
  anchor: AnchorNode,
  task: TaskNode,
  design: DesignNode,
  comment: CommentNode,
};
