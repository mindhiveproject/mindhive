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

export function IntroVideoIcon(props) {
  return (
    <IconBox {...props}>
      <rect
        x="2.75"
        y="4.5"
        width="14.5"
        height="11"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M8.25 7.75v4.5L12.75 10 8.25 7.75Z"
        fill="currentColor"
      />
    </IconBox>
  );
}

export function LinksIcon(props) {
  return (
    <IconBox {...props}>
      <path
        d="M8.25 11.75l3.5-3.5M7.4 9.1a2.6 2.6 0 010-3.7l.9-.9a2.6 2.6 0 013.7 0l.55.55M12.6 10.9a2.6 2.6 0 010 3.7l-.9.9a2.6 2.6 0 01-3.7 0l-.55-.55"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </IconBox>
  );
}

export function MediaListIcon(props) {
  return (
    <IconBox {...props}>
      <rect
        x="3.25"
        y="4.25"
        width="13.5"
        height="11.5"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M5.5 13.25l3.1-3.4 2.2 2.1 2.4-2.9 1.3 1.6"
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="7.4" cy="7.6" r="1.15" fill="currentColor" />
    </IconBox>
  );
}

export const TYPE_ICONS = {
  text: OpenAnswerIcon,
  select: PickOneIcon,
  multiselect: PickManyIcon,
  task_selector: TasksIcon,
  file: IntroVideoIcon,
  link_list: LinksIcon,
  media_asset_list: MediaListIcon,
};
