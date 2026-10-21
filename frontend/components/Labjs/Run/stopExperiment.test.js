const test = require('node:test');
const assert = require('node:assert/strict');
const { stopExperiment } = require('./stopExperiment');

class Transmit {}
class Debug {}

// The parts of a lab.js experiment stopExperiment touches.
function fakeExperiment({ prepared }) {
  const calls = { end: 0 };
  const experiment = {
    plugins: {
      plugins: [new Transmit(), new Debug()],
      remove(plugin) {
        this.plugins = this.plugins.filter((item) => item !== plugin);
      },
    },
    // lab.js creates the timeline at the start of prepare and fills its
    // items only when the asynchronous prepare finishes.
    internals: { timeline: prepared ? { items: [] } : {} },
    end() {
      calls.end += 1;
      return Promise.resolve();
    },
  };
  return { experiment, calls };
}

test('a prepared experiment loses its Transmit and is ended', () => {
  const { experiment, calls } = fakeExperiment({ prepared: true });
  stopExperiment(experiment, Transmit);
  assert.equal(calls.end, 1);
  assert.deepEqual(
    experiment.plugins.plugins.map((plugin) => plugin.constructor),
    [Debug]
  );
});

// The 2026-10-21 409: StrictMode cleaned up an experiment still preparing,
// the old guard returned before touching its plugins, and that experiment
// went on to post its own `full` result for the same run token.
test('an experiment still preparing loses its Transmit too', () => {
  const { experiment, calls } = fakeExperiment({ prepared: false });
  stopExperiment(experiment, Transmit);
  assert.equal(calls.end, 0);
  assert.deepEqual(
    experiment.plugins.plugins.map((plugin) => plugin.constructor),
    [Debug]
  );
});

test('a missing experiment is ignored', () => {
  assert.doesNotThrow(() => stopExperiment(undefined, Transmit));
  assert.doesNotThrow(() => stopExperiment(null, Transmit));
});
