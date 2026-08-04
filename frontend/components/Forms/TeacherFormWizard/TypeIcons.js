/** Small currentColor glyphs for the question-type picker. */

function IconBox({ children, ...props }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export function OpenAnswerIcon(props) {
  return (
    <IconBox {...props}>
      <path
        d="M4.5 4.5h7.25L15.5 8.25V15.5H4.5V4.5Zm6.5 0v3.75H15"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M7 10.25h6M7 12.75h4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </IconBox>
  );
}

export function PickOneIcon(props) {
  return (
    <IconBox {...props}>
      <circle cx="10" cy="10" r="6.25" stroke="currentColor" strokeWidth="1.4" />
      <circle cx="10" cy="10" r="3" fill="currentColor" />
    </IconBox>
  );
}

export function PickManyIcon(props) {
  return (
    <IconBox {...props}>
      <rect
        x="3.75"
        y="3.75"
        width="12.5"
        height="12.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.75 10.1l2.1 2.1 4.4-4.5"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBox>
  );
}

export function TasksIcon(props) {
  return (
    <IconBox {...props}>
      <rect
        x="3.5"
        y="3.5"
        width="13"
        height="13"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M6.5 7.25h7M6.5 10h7M6.5 12.75h4.5"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
      />
    </IconBox>
  );
}

export const TYPE_ICONS = {
  text: OpenAnswerIcon,
  select: PickOneIcon,
  multiselect: PickManyIcon,
  task_selector: TasksIcon,
};
