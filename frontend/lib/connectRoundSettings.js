/** Date-only keys persisted on ConnectRound.settings.schedule (YYYY-MM-DD). */
export const SCHEDULE_SETTING_KEYS = [
  "introductionAt",
  "matchingStartAt",
  "matchingEndAt",
  "reviewStartAt",
  "reviewEndAt",
  "sponsorIntroAt",
];

export const EMPTY_SCHEDULE_FORM = {
  introductionAt: "",
  matchingStartAt: "",
  matchingEndAt: "",
  reviewStartAt: "",
  reviewEndAt: "",
  sponsorIntroAt: "",
};

/**
 * Fixed matching-round timeline. Labels live in i18n
 * (`opportunities.matchingRound.schedule.{key}`); only dates are saved.
 * `selection` maps to ConnectRound.openAt / closeAt (preference window).
 */
export const SCHEDULE_PHASE_COPY_DEFAULTS = {
  introduction: {
    title: "Introduction",
    description:
      "Students are introduced to the projects and begin reviewing sponsor materials.",
  },
  selection: {
    title: "Project selection",
    description:
      "Students review projects, discuss opportunities, and submit ranked preferences.",
  },
  matching: {
    title: "Team matching",
    description:
      "Student preferences, skills, and project needs are used to develop team assignments.",
  },
  review: {
    title: "Review period",
    description:
      "Students can review their project match and request a change.",
  },
  sponsorIntro: {
    title: "Sponsor introductions",
    description:
      "Once teams are confirmed, each sponsor is connected with their student team to begin the project kickoff.",
  },
};

/**
 * Object + status applied when a schedule date is reached.
 * `connectRound` uses ConnectRound.status; `connectMatch` uses ConnectMatch.status.
 */
export const ROUND_SCHEDULE_PHASES = [
  {
    key: "introduction",
    kind: "single",
    at: "introductionAt",
    object: "connectRound",
    status: "preferences_open",
  },
  {
    key: "selection",
    kind: "range",
    startAt: "openAt",
    endAt: "closeAt",
    storedOnRound: true,
    object: "connectRound",
    startStatus: "preferences_open",
    endStatus: "preferences_closed",
  },
  {
    key: "matching",
    kind: "range",
    startAt: "matchingStartAt",
    endAt: "matchingEndAt",
    object: "connectRound",
    startStatus: "matching",
    endStatus: null,
  },
  {
    key: "review",
    kind: "range",
    startAt: "reviewStartAt",
    endAt: "reviewEndAt",
    object: "connectRound",
    startStatus: "published",
    endStatus: null,
  },
  {
    key: "sponsorIntro",
    kind: "single",
    at: "sponsorIntroAt",
    object: "connectMatch",
    status: "active",
  },
];

export const SCHEDULE_OBJECT_LABEL_DEFAULTS = {
  connectRound: "Matching round",
  connectMatch: "Match",
  opportunity: "Opportunity",
};

export const SCHEDULE_MATCH_STATUS_DEFAULTS = {
  proposed: "Proposed",
  active: "Active",
  completed: "Completed",
  declined: "Declined",
  cancelled: "Cancelled",
};

export const ROUND_STATUS_I18N_KEYS = {
  draft: "draft",
  preferences_open: "preferencesOpen",
  preferences_closed: "preferencesClosed",
  matching: "matching",
  published: "published",
  archived: "archived",
};

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

/** Keep calendar dates timezone-stable (store/read YYYY-MM-DD only). */
export function toDateOnly(value) {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.match(/^(\d{4}-\d{2}-\d{2})/);
    return match ? match[1] : "";
  }
  try {
    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return "";
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  } catch {
    return "";
  }
}

export function parseDateOnly(value) {
  const day = toDateOnly(value);
  if (!day) return null;
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return null;
  return new Date(year, month - 1, date);
}

export function readSponsorFormsVisible(settings) {
  if (!isPlainObject(settings)) return false;
  return Boolean(settings.sponsorFormsVisible);
}

export function readRoundSchedule(settings) {
  const raw = isPlainObject(settings) && isPlainObject(settings.schedule)
    ? settings.schedule
    : {};
  const schedule = { ...EMPTY_SCHEDULE_FORM };
  for (const key of SCHEDULE_SETTING_KEYS) {
    schedule[key] = toDateOnly(raw[key]);
  }
  return schedule;
}

export function scheduleFromInputs(inputs) {
  const schedule = { ...EMPTY_SCHEDULE_FORM };
  for (const key of SCHEDULE_SETTING_KEYS) {
    schedule[key] = toDateOnly(inputs?.[key]);
  }
  return schedule;
}

export function serializeSchedule(schedule) {
  const next = {};
  for (const key of SCHEDULE_SETTING_KEYS) {
    const day = toDateOnly(schedule?.[key]);
    if (day) next[key] = day;
  }
  return next;
}

export function mergeRoundSettings(
  existing,
  { sponsorFormsVisible, schedule } = {},
) {
  const base = isPlainObject(existing) ? { ...existing } : {};
  if (sponsorFormsVisible !== undefined) {
    base.sponsorFormsVisible = Boolean(sponsorFormsVisible);
  }
  if (schedule !== undefined) {
    base.schedule = serializeSchedule(schedule);
  }
  return base;
}

function formatDay(date, { month = "long", includeYear = true } = {}) {
  const options = { month, day: "numeric" };
  if (includeYear) options.year = "numeric";
  return date.toLocaleDateString(undefined, options);
}

export function formatScheduleDate(value) {
  const date = parseDateOnly(value) || (value ? new Date(value) : null);
  if (!date || Number.isNaN(date.getTime())) return "";
  return formatDay(date);
}

export function formatScheduleRange(startValue, endValue) {
  const start = parseDateOnly(startValue) || (startValue ? new Date(startValue) : null);
  const end = parseDateOnly(endValue) || (endValue ? new Date(endValue) : null);
  const startOk = start && !Number.isNaN(start.getTime());
  const endOk = end && !Number.isNaN(end.getTime());

  if (startOk && endOk) {
    const startDay = toDateOnly(start);
    const endDay = toDateOnly(end);
    if (startDay === endDay) return formatDay(start);

    const sameYear = start.getFullYear() === end.getFullYear();
    const sameMonth = sameYear && start.getMonth() === end.getMonth();
    if (sameMonth) {
      return `${formatDay(start, { includeYear: false })}–${end.getDate()}`;
    }
    if (sameYear) {
      return `${formatDay(start, { includeYear: false })} – ${formatDay(end)}`;
    }
    return `${formatDay(start)} – ${formatDay(end)}`;
  }
  if (startOk) return formatDay(start);
  if (endOk) return formatDay(end);
  return "";
}

export function collectSchedulePhases(roundLike) {
  const schedule = readRoundSchedule(roundLike?.settings);
  const values = {
    ...schedule,
    openAt: roundLike?.openAt || "",
    closeAt: roundLike?.closeAt || "",
  };

  return ROUND_SCHEDULE_PHASES.map((phase) => {
    if (phase.kind === "single") {
      const at = values[phase.at] || "";
      const dateLabel = formatScheduleDate(at);
      return {
        key: phase.key,
        kind: phase.kind,
        at,
        dateLabel,
        hasDates: Boolean(dateLabel),
      };
    }

    const startAt = values[phase.startAt] || "";
    const endAt = values[phase.endAt] || "";
    const dateLabel = formatScheduleRange(startAt, endAt);
    return {
      key: phase.key,
      kind: phase.kind,
      startAt,
      endAt,
      dateLabel,
      hasDates: Boolean(dateLabel),
    };
  });
}

export function visibleSchedulePhases(roundLike) {
  return collectSchedulePhases(roundLike).filter((phase) => phase.hasDates);
}
