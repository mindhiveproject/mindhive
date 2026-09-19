// Runs a study's linked data sources and reduces their output to aggregates.
//
// Nothing here ever keeps a sample. Each packet is folded into running
// accumulators and discarded, so the most this holds for a stream is a handful
// of numbers per channel — that is the whole point: raw physiological data
// never leaves the participant's browser, and only mean/sd/min/max/n reach the
// server. It aggregates whatever the graph's recorded nodes emit, processed or
// not (band power in, band power aggregated).
//
// Two windows are accumulated from the same packets: one per study step, reset
// at every step boundary, and one for the whole session. Which sources are fed
// at a given moment is decided by each source's `scope`, so several sources can
// run in sequence across a study rather than all at once.
//
// yq-data is browser-only (Web Bluetooth, AudioWorklet, getUserMedia), so it is
// imported dynamically and this module must only be reached from the client.
//
// Each row's study-builder settings (StudyDataSource.settings) are honored
// here too: `recordParticipantData: false` drops the source before a
// pipeline is even built, and `excludedChannels` keeps specific channels out
// of the aggregate entirely (see `foldPacket`). `viewSignal` and
// `streamToNextBlock` aren't this module's concern — the former gates the
// participant-facing preview UI, the latter has no wiring yet (see
// Studies/Run/DataSources/Main.js).

import { channelKey, findOutput } from "./yqOutputs";

// Welford's online algorithm, rather than summing squares: a session can run
// for an hour at 256 Hz and this stays stable across that many updates.
function newStat() {
  return { n: 0, mean: 0, m2: 0, min: Infinity, max: -Infinity };
}

function pushValue(stat, x) {
  if (!Number.isFinite(x)) return;
  stat.n += 1;
  const delta = x - stat.mean;
  stat.mean += delta / stat.n;
  stat.m2 += delta * (x - stat.mean);
  if (x < stat.min) stat.min = x;
  if (x > stat.max) stat.max = x;
}

function readStat(stat) {
  return {
    n: stat.n,
    mean: stat.n ? stat.mean : null,
    // Sample standard deviation: these are samples of a signal, not a
    // population, and n is large enough that the correction never matters.
    sd: stat.n > 1 ? Math.sqrt(stat.m2 / (stat.n - 1)) : null,
    min: stat.n ? stat.min : null,
    max: stat.n ? stat.max : null,
  };
}

// One window = one set of per-stream, per-channel accumulators, plus a tally
// of the event markers seen while it was open.
function newWindow(stepId) {
  return {
    stepId,
    startedAt: null,
    endedAt: null,
    streams: new Map(),
    markers: new Map(),
  };
}

// Markers are counted, not averaged. Their numeric payload is a per-label code
// assigned by the receiver, so a mean of it is meaningless — but how many times
// each event fired is exactly what makes the numeric aggregates readable
// ("40 stimulus_onset in this step"), and a count is still an aggregate.
function foldMarkers(window, packet) {
  const labels = packet.labels || [];
  for (let i = 0; i < labels.length; i += 1) {
    const label = labels[i];
    if (!label) continue;
    let tally = window.markers.get(label);
    if (!tally) {
      tally = { count: 0, firstAt: packet.timestamp, lastAt: packet.timestamp };
      window.markers.set(label, tally);
    }
    tally.count += 1;
    tally.lastAt = packet.timestamp;
  }
  if (window.startedAt === null) window.startedAt = packet.timestamp;
  window.endedAt = packet.timestamp;
}

// `excludedChannels` holds `channelKey()` keys from the study builder's Outputs
// section, per linked source, so they only apply to a packet that matches one
// of the block's declared outputs (`declared`). An excluded channel is still
// read off the packet (so sample indices stay correct) but never folded into
// a stat and never appears in the stream's channel list, so it's simply
// absent from what reaches the server.
function foldPacket(window, packet, channelCount, excludedChannels, declared) {
  let stream = window.streams.get(packet.streamID);
  if (!stream) {
    const info = packet.metadata?.channelInfo;
    const channels = [];
    for (let i = 0; i < channelCount; i += 1) {
      if (declared && excludedChannels?.has(channelKey(declared, i))) continue;
      channels.push({
        index: i,
        label: info?.[i]?.label ?? `channel ${i + 1}`,
        unit: info?.[i]?.unit ?? null,
        stat: newStat(),
      });
    }
    stream = {
      modality: packet.metadata?.modality ?? null,
      samplingRate: packet.metadata?.samplingRate ?? null,
      channels,
    };
    window.streams.set(packet.streamID, stream);
  }

  if (stream.channels.length > 0) {
    const samples = Math.floor(packet.data.length / channelCount);
    for (let i = 0; i < samples; i += 1) {
      for (const channel of stream.channels) {
        pushValue(channel.stat, packet.data[i * channelCount + channel.index]);
      }
    }
  }

  if (window.startedAt === null) window.startedAt = packet.timestamp;
  window.endedAt = packet.timestamp;
}

function readWindow(window) {
  return {
    stepId: window.stepId,
    startedAt: window.startedAt,
    endedAt: window.endedAt,
    markers: Array.from(window.markers.entries()).map(([label, tally]) => ({
      label,
      ...tally,
    })),
    streams: Array.from(window.streams.entries()).map(([streamID, stream]) => ({
      streamID,
      modality: stream.modality,
      samplingRate: stream.samplingRate,
      channels: stream.channels.map(({ index, label, unit, stat }) => ({
        index,
        label,
        unit,
        ...readStat(stat),
      })),
    })),
  };
}

// A source with scope "study" records for the whole participation; one scoped
// to steps records only while the participant is on one of them.
function isInScope(scope, stepId) {
  if (!scope || scope === "study") return true;
  if (Array.isArray(scope?.steps)) return scope.steps.includes(stepId);
  return true;
}

export default class AggregateRecorder {
  constructor() {
    this.sources = [];
    this.stepId = null;
    this.running = false;
    // Finalized per-step windows, in the order they closed.
    this.steps = [];
    // Identifies the windows this recorder instance produced. The study runner
    // reloads the page between tasks (Prompt's router.reload), so one
    // participation spans several recorders, each of which only ever knows its
    // own windows — the server keys on this to merge them instead of letting a
    // fresh instance's short list replace everything saved before the reload.
    this.segmentId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }

  /**
   * Builds a pipeline per linked data source and starts them.
   *
   * `studyDataSources` are the rows from STUDY_DATA_SOURCES, already ordered.
   * A row whose settings turn off "Record participant data" is skipped
   * entirely — no pipeline is even built for it, since its purpose here is
   * exclusively to produce data that reaches the server.
   * `receivers` maps a StudyDataSource row id to that row's own map of block
   * input id -> live, connected yq-data receiver — keyed per row rather than
   * globally by input id, since the same catalog block (and so the same
   * input ids) can be linked into a study more than once. The connect UI
   * owns pairing, this owns recording. A receiver that connects after
   * `start()` (an optional input, paired post-gate) is attached later
   * through `attachReceiver`.
   */
  async start(studyDataSources, receivers = {}) {
    if (this.running) return;
    const { Pipeline, getChannelCount, isCategorical } = await import("yq-data");
    this.getChannelCount = getChannelCount;
    this.isCategorical = isCategorical;

    this.sources = studyDataSources
      .filter((row) => row.settings?.recordParticipantData !== false)
      .map((row) => {
        const pipeline = new Pipeline(row.block.graph);
        const blockInputs = row.block.inputs || [];
        const rowReceivers = receivers[row.id] || {};

        blockInputs.forEach((input) => {
          const receiver = rowReceivers[input.id];
          // Keyed by the input's own id, not its receiver type — see the
          // matching note in useSourceRuntime.js's connect().
          if (receiver) pipeline.attachReceiver(input.id, receiver);
        });

        return {
          id: row.id,
          blockSlug: row.block.slug,
          label: row.label || row.block.title,
          scope: row.scope,
          blockInputs,
          outputs: row.block.outputs || [],
          excludedChannels: new Set(row.settings?.excludedChannels || []),
          pipeline,
          session: newWindow(null),
          step: newWindow(this.stepId),
          subscriptions: [],
        };
      });

    this.sources.forEach((source) => {
      source.pipeline.start();
      // recordTargets() resolves the graph's own `record` selection to
      // observables — the nodes the block author marked as captured. Anything
      // not named there is processed and shown but never aggregated.
      for (const [nodeId, output] of source.pipeline.recordTargets()) {
        source.subscriptions.push(
          output.subscribe((packet) => this.capture(source, packet, nodeId))
        );
      }
    });

    this.running = true;
  }

  /**
   * Attaches a receiver that connected after `start()` — an optional input
   * paired once the participant is already past the connect gate. A no-op
   * for a source that either isn't running or was excluded from recording.
   */
  attachReceiver(sourceId, inputId, receiver) {
    const source = this.sources.find((s) => s.id === sourceId);
    if (!source || !receiver) return;
    const input = source.blockInputs.find((i) => i.id === inputId);
    if (!input) return;
    source.pipeline.attachReceiver(input.id, receiver);
  }

  capture(source, packet, nodeId) {
    if (!isInScope(source.scope, this.stepId)) return;
    // Markers reach the graph from the task layer (MarkerReceiver, or an LSL
    // Markers stream) and are tallied per label rather than averaged.
    if (this.isCategorical(packet.metadata)) {
      foldMarkers(source.session, packet);
      foldMarkers(source.step, packet);
      return;
    }
    const channelCount = this.getChannelCount(packet);
    const declared = findOutput(source.outputs, nodeId, packet);
    foldPacket(source.session, packet, channelCount, source.excludedChannels, declared);
    foldPacket(source.step, packet, channelCount, source.excludedChannels, declared);
  }

  /**
   * Moves to a study step, closing the window that was open on the previous
   * one. Call with null at the end of the last step.
   */
  setStep(stepId) {
    if (stepId === this.stepId) return;
    this.closeStep();
    this.stepId = stepId;
    this.sources.forEach((source) => {
      source.step = newWindow(stepId);
    });
  }

  closeStep() {
    if (this.stepId === null) return;
    this.sources.forEach((source) => {
      if (source.step.startedAt === null) return;
      this.steps.push({
        segmentId: this.segmentId,
        sourceId: source.id,
        blockSlug: source.blockSlug,
        label: source.label,
        ...readWindow(source.step),
      });
    });
  }

  /**
   * A read-only snapshot of everything aggregated so far, without touching
   * any running pipeline — safe to call after every step close to save
   * progress incrementally, so a participant leaving mid-study doesn't lose
   * everything collected up to that point.
   */
  snapshot() {
    return {
      steps: this.steps,
      session: this.sources
        .filter((source) => source.session.startedAt !== null)
        .map((source) => ({
          segmentId: this.segmentId,
          sourceId: source.id,
          blockSlug: source.blockSlug,
          label: source.label,
          ...readWindow(source.session),
        })),
    };
  }

  /** Stops every pipeline and returns the final aggregates to hand to the server. */
  stop() {
    this.closeStep();
    this.stepId = null;
    const result = this.snapshot();
    this.sources.forEach((source) => {
      source.subscriptions.forEach((s) => s.unsubscribe());
      source.subscriptions = [];
      source.pipeline.stop();
    });
    this.running = false;
    return result;
  }
}
