// Flattens a participation's physiological aggregates into plain CSV columns,
// one set of columns per (participant, task), so they ride along with the
// task's own rows in every Collect download instead of living in a separate
// export.
//
// The aggregates are written by AggregateRecorder (lib/yqAggregateRecorder.js)
// into StudyDataSourceRecord.steps: one window per
// (segmentId, sourceId, stepId), where `stepId` is the study flow node the
// participant was on while it was open. Everything in the Collect tables is
// keyed by `testVersion` instead — the same flow node's `testId` — so the
// study flow is what bridges the two, which is why this takes the `components`
// list Collect/Main.js already walks out of `study.flow`.
//
// A participation spans several recorder segments (the runner reloads the page
// between tasks) and a participant may retake a task, so one (source, step)
// can hold several windows. They are pooled rather than overwritten: n, mean,
// sd, min and max are enough to combine two windows exactly.

// Column names end up as CSV headers and as R/Python variable names after
// import, so anything that isn't a word character becomes an underscore. Case
// is kept — channel labels like "TP9" or "AF7" read badly lowercased.
function safeName(value) {
  return String(value ?? "")
    .replace(/[^A-Za-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
}

// Welford's M2, recovered from the sample sd the recorder stored.
function sumOfSquares(stat) {
  if (!stat || stat.n < 2 || !Number.isFinite(stat.sd)) return 0;
  return stat.sd * stat.sd * (stat.n - 1);
}

// Chan's parallel variance update — the exact statistics of the two windows
// concatenated, not an approximation.
function poolStats(a, b) {
  if (!a) return b;
  if (!b) return a;
  const n = (a.n || 0) + (b.n || 0);
  if (!n) return { n: 0, mean: null, sd: null, min: null, max: null };
  if (!a.n) return b;
  if (!b.n) return a;
  const delta = b.mean - a.mean;
  const mean = a.mean + (delta * b.n) / n;
  const m2 =
    sumOfSquares(a) + sumOfSquares(b) + delta * delta * ((a.n * b.n) / n);
  return {
    n,
    mean,
    sd: n > 1 ? Math.sqrt(m2 / (n - 1)) : null,
    min: Math.min(a.min, b.min),
    max: Math.max(a.max, b.max),
  };
}

// Streams are ordered by what they contain rather than by `streamID`, which
// starts with the connected device's runtime id and so differs between two
// participants running the same study. Without this the same channel could
// land in a different column per participant.
function streamOrder(stream) {
  return [
    stream?.modality ?? "",
    String(stream?.samplingRate ?? ""),
    (stream?.channels || []).map((channel) => channel?.label ?? "").join("|"),
  ].join("~");
}

// One prefix per linked data source ("Muse_Band_Power"). A study can link the
// same block twice, which gives two sources the same label, so a collision is
// broken by the source's own id — stable across participants, unlike its
// position within any one participation.
function sourcePrefixes(entries) {
  const labels = new Map();
  entries.forEach((entry) => {
    if (!labels.has(entry?.sourceId)) {
      labels.set(entry?.sourceId, entry?.label || entry?.blockSlug || "source");
    }
  });

  const byName = new Map();
  Array.from(labels.entries())
    .sort(([a], [b]) => String(a).localeCompare(String(b)))
    .forEach(([sourceId, label]) => {
      const name = safeName(label) || "source";
      byName.set(name, [...(byName.get(name) || []), sourceId]);
    });

  const prefixes = new Map();
  byName.forEach((sourceIds, name) => {
    sourceIds.forEach((sourceId, index) => {
      prefixes.set(sourceId, index === 0 ? name : `${name}_${index + 1}`);
    });
  });
  return prefixes;
}

// Folds every window of one (participant, task) into columns. Channels are
// pooled per source across segments first, then named
// "<source>_<channel>_<stat>"; a channel label repeated inside one source gets
// a numeric suffix so nothing silently overwrites.
function columnsForWindows(entries, prefixes) {
  const bySource = new Map();
  entries.forEach((entry) => {
    bySource.set(entry?.sourceId, [...(bySource.get(entry?.sourceId) || []), entry]);
  });

  const columns = {};
  bySource.forEach((windows, sourceId) => {
    const prefix = prefixes.get(sourceId) || "source";
    const channels = new Map();
    const markers = new Map();

    windows.forEach((window) => {
      (window?.streams || [])
        .slice()
        .sort((a, b) => streamOrder(a).localeCompare(streamOrder(b)))
        .forEach((stream, streamIndex) => {
          (stream?.channels || []).forEach((channel) => {
            // Keyed by position as well as label so two streams carrying the
            // same channel names stay apart while pooling across segments.
            const key = `${streamIndex}|${channel?.index}|${channel?.label}`;
            channels.set(key, {
              label: channel?.label,
              stat: poolStats(channels.get(key)?.stat, channel),
            });
          });
        });
      (window?.markers || []).forEach((marker) => {
        markers.set(
          marker?.label,
          (markers.get(marker?.label) || 0) + (marker?.count || 0)
        );
      });
    });

    const used = new Map();
    channels.forEach(({ label, stat }) => {
      const base = `${prefix}_${safeName(label) || "channel"}`;
      const seen = used.get(base) || 0;
      used.set(base, seen + 1);
      const name = seen === 0 ? base : `${base}_${seen + 1}`;
      columns[`${name}_n`] = stat.n;
      columns[`${name}_mean`] = stat.mean;
      columns[`${name}_sd`] = stat.sd;
      columns[`${name}_min`] = stat.min;
      columns[`${name}_max`] = stat.max;
    });

    // Markers are counted, not averaged — see the note in yqAggregateRecorder.
    markers.forEach((count, label) => {
      columns[`${prefix}_marker_${safeName(label) || "marker"}_count`] = count;
    });
  });

  return columns;
}

/**
 * Builds the (participant, task) -> columns lookup the Collect downloads use.
 *
 * `records` are `study.dataSourceRecords` (one per participant) and
 * `components` is the flow walk Collect/Main.js already does, whose entries
 * carry both the flow node `id` the recorder keyed its windows on and the
 * `testId` every result row is stamped with.
 *
 * Returns a function taking `{ publicId, testVersion }` and giving back a flat
 * object of columns to spread into a row — `{}` when that participant had no
 * data source running on that task, which simply leaves those cells blank.
 */
export default function buildAggregateColumns({ records, components }) {
  const testVersionByStep = new Map(
    (components || [])
      .filter((component) => component?.id && component?.testId)
      .map((component) => [component.id, component.testId])
  );

  const byParticipantAndTask = new Map();
  (records || []).forEach((record) => {
    const publicId = record?.profile?.publicId || record?.guest?.publicId;
    if (!publicId) return;
    const entries = Array.isArray(record?.steps) ? record.steps : [];
    const prefixes = sourcePrefixes(entries);

    const byTask = new Map();
    entries.forEach((entry) => {
      const testVersion = testVersionByStep.get(entry?.stepId);
      if (!testVersion) return;
      byTask.set(testVersion, [...(byTask.get(testVersion) || []), entry]);
    });

    byTask.forEach((windows, testVersion) => {
      byParticipantAndTask.set(
        `${publicId}::${testVersion}`,
        columnsForWindows(windows, prefixes)
      );
    });
  });

  return ({ publicId, testVersion }) =>
    byParticipantAndTask.get(`${publicId}::${testVersion}`) || {};
}
