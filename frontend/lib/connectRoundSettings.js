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
    enforcesPreferenceWindow: true,
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

/** IANA zone used when teachers pin ranking open/close to one shared instant. */
export const DEFAULT_PREFERENCE_WINDOW_TIMEZONE = "America/Los_Angeles";

export const PREFERENCE_WINDOW_TIMEZONE_OPTIONS = [
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "UTC", label: "UTC" },
];

export const DEFAULT_PREFERENCE_WINDOW_OPEN_TIME = "00:00";
export const DEFAULT_PREFERENCE_WINDOW_CLOSE_TIME = "23:59";

function isPlainObject(value) {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export function readPreferenceWindowTimeZone(settings) {
  if (!isPlainObject(settings)) return DEFAULT_PREFERENCE_WINDOW_TIMEZONE;
  const raw = settings.preferenceWindowTimeZone;
  if (typeof raw !== "string" || !raw.trim()) {
    return DEFAULT_PREFERENCE_WINDOW_TIMEZONE;
  }
  return raw.trim();
}

function parseTimeParts(timeStr) {
  const match = String(timeStr || "").match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;
  const hour = Number(match[1]);
  const minute = Number(match[2]);
  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59
  ) {
    return null;
  }
  return { hour, minute };
}

function getZonedParts(utcMs, timeZone) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(utcMs));
  const get = (type) => {
    const part = parts.find((entry) => entry.type === type);
    return part ? Number(part.value) : NaN;
  };
  let hour = get("hour");
  // Some engines report midnight as 24 under hourCycle h23.
  if (hour === 24) hour = 0;
  return {
    year: get("year"),
    month: get("month"),
    day: get("day"),
    hour,
    minute: get("minute"),
    second: get("second"),
  };
}

/**
 * Convert a wall-clock date+time in `timeZone` to a UTC ISO string.
 * Uses Intl only (no date libraries).
 */
export function zonedWallTimeToUtcIso(
  dateStr,
  timeStr,
  timeZone = DEFAULT_PREFERENCE_WINDOW_TIMEZONE,
) {
  const day = toDateOnly(dateStr);
  const time = parseTimeParts(timeStr);
  if (!day || !time) return null;
  const [year, month, date] = day.split("-").map(Number);
  if (!year || !month || !date) return null;

  const zone =
    typeof timeZone === "string" && timeZone.trim()
      ? timeZone.trim()
      : DEFAULT_PREFERENCE_WINDOW_TIMEZONE;

  let utcMs = Date.UTC(year, month - 1, date, time.hour, time.minute, 0, 0);
  for (let i = 0; i < 3; i += 1) {
    const parts = getZonedParts(utcMs, zone);
    const asUtc = Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
      0,
    );
    const desiredAsUtc = Date.UTC(
      year,
      month - 1,
      date,
      time.hour,
      time.minute,
      0,
      0,
    );
    const delta = desiredAsUtc - asUtc;
    if (delta === 0) break;
    utcMs += delta;
  }

  return new Date(utcMs).toISOString();
}

function isExactUtcMidnight(date) {
  return (
    date instanceof Date &&
    !Number.isNaN(date.getTime()) &&
    date.getUTCHours() === 0 &&
    date.getUTCMinutes() === 0 &&
    date.getUTCSeconds() === 0 &&
    date.getUTCMilliseconds() === 0
  );
}

/**
 * Hydrate teacher date/time inputs from a stored openAt/closeAt.
 * Legacy date-only saves are UTC midnight of the ISO calendar day — do not
 * shift those through the browser timezone.
 */
export function hydratePreferenceWindowBound(
  iso,
  boundary,
  timeZone = DEFAULT_PREFERENCE_WINDOW_TIMEZONE,
) {
  const defaultTime =
    boundary === "close"
      ? DEFAULT_PREFERENCE_WINDOW_CLOSE_TIME
      : DEFAULT_PREFERENCE_WINDOW_OPEN_TIME;
  if (!iso) return { date: "", time: defaultTime };

  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return { date: "", time: defaultTime };

  if (isExactUtcMidnight(date)) {
    return {
      date: date.toISOString().slice(0, 10),
      time: defaultTime,
    };
  }

  const zone =
    typeof timeZone === "string" && timeZone.trim()
      ? timeZone.trim()
      : DEFAULT_PREFERENCE_WINDOW_TIMEZONE;
  const parts = getZonedParts(date.getTime(), zone);
  return {
    date: `${String(parts.year).padStart(4, "0")}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
    time: `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`,
  };
}

/**
 * Resolve openAt/closeAt to an epoch ms instant.
 * Legacy UTC-midnight values expand to 00:00 / 23:59 in the round timezone.
 */
export function resolvePreferenceWindowInstantMs(
  iso,
  boundary,
  timeZone = DEFAULT_PREFERENCE_WINDOW_TIMEZONE,
) {
  if (!iso) return null;
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return null;

  if (isExactUtcMidnight(date)) {
    const dateOnly = date.toISOString().slice(0, 10);
    const time =
      boundary === "close"
        ? DEFAULT_PREFERENCE_WINDOW_CLOSE_TIME
        : DEFAULT_PREFERENCE_WINDOW_OPEN_TIME;
    const resolved = zonedWallTimeToUtcIso(dateOnly, time, timeZone);
    return resolved ? new Date(resolved).getTime() : null;
  }

  return date.getTime();
}

/** Format a pinned preference-window instant in the round timezone. */
export function formatPreferenceWindowInstant(
  iso,
  timeZone = DEFAULT_PREFERENCE_WINDOW_TIMEZONE,
) {
  if (!iso) return "";
  const date = iso instanceof Date ? iso : new Date(iso);
  if (Number.isNaN(date.getTime())) return "";

  const zone =
    typeof timeZone === "string" && timeZone.trim()
      ? timeZone.trim()
      : DEFAULT_PREFERENCE_WINDOW_TIMEZONE;

  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: zone,
      month: "long",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZoneName: "short",
    }).format(date);
  } catch {
    return date.toLocaleString();
  }
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

/**
 * Instant bounds for openAt / closeAt (shared deadline for all students).
 * Legacy UTC-midnight values expand to 00:00 / 23:59 in the round timezone.
 */
export function getPreferenceTimeWindowState(roundLike, now = Date.now()) {
  const timeZone = readPreferenceWindowTimeZone(roundLike?.settings);
  const openAtMs = resolvePreferenceWindowInstantMs(
    roundLike?.openAt,
    "open",
    timeZone,
  );
  const closeAtMs = resolvePreferenceWindowInstantMs(
    roundLike?.closeAt,
    "close",
    timeZone,
  );
  const beforeOpen = openAtMs != null && now < openAtMs;
  const afterClose = closeAtMs != null && now > closeAtMs;
  return {
    beforeOpen,
    afterClose,
    isOpen: !beforeOpen && !afterClose,
  };
}

export function isPreferenceTimeWindowOpen(roundLike, now = Date.now()) {
  return getPreferenceTimeWindowState(roundLike, now).isOpen;
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
  { sponsorFormsVisible, schedule, preferenceWindowTimeZone } = {},
) {
  const base = isPlainObject(existing) ? { ...existing } : {};
  if (sponsorFormsVisible !== undefined) {
    base.sponsorFormsVisible = Boolean(sponsorFormsVisible);
  }
  if (schedule !== undefined) {
    base.schedule = serializeSchedule(schedule);
  }
  if (preferenceWindowTimeZone !== undefined) {
    const zone =
      typeof preferenceWindowTimeZone === "string" &&
      preferenceWindowTimeZone.trim()
        ? preferenceWindowTimeZone.trim()
        : DEFAULT_PREFERENCE_WINDOW_TIMEZONE;
    base.preferenceWindowTimeZone = zone;
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
  const timeZone = readPreferenceWindowTimeZone(roundLike?.settings);
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
    let dateLabel = "";
    if (phase.enforcesPreferenceWindow) {
      const openMs = resolvePreferenceWindowInstantMs(startAt, "open", timeZone);
      const closeMs = resolvePreferenceWindowInstantMs(
        endAt,
        "close",
        timeZone,
      );
      const openLabel = openMs
        ? formatPreferenceWindowInstant(new Date(openMs).toISOString(), timeZone)
        : "";
      const closeLabel = closeMs
        ? formatPreferenceWindowInstant(
            new Date(closeMs).toISOString(),
            timeZone,
          )
        : "";
      if (openLabel && closeLabel) dateLabel = `${openLabel} – ${closeLabel}`;
      else dateLabel = openLabel || closeLabel;
    } else {
      dateLabel = formatScheduleRange(startAt, endAt);
    }
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
