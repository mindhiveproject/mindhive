// Stops a lab.js experiment the run page no longer shows. Plain CommonJS so
// it runs under `node --test`; the caller passes in lab.plugins.Transmit.

/**
 * Detaches the experiment's Transmit plugins, then ends it if it is far
 * enough along to end. Transmit goes first and always: an experiment still
 * preparing cannot be ended yet (lab.js fills `timeline.items` only after its
 * asynchronous prepare), and a run left going with its Transmit attached
 * posts its own `full` result for the same run token.
 */
function stopExperiment(experiment, Transmit) {
  const plugins = experiment?.plugins;
  if (plugins && Array.isArray(plugins.plugins)) {
    plugins.plugins
      .filter((plugin) => plugin instanceof Transmit)
      .forEach((plugin) => plugins.remove(plugin));
  }
  const timelineItems = experiment?.internals?.timeline?.items;
  const canEnd =
    typeof experiment?.end === 'function' && Array.isArray(timelineItems);
  if (!canEnd) return;
  // Ending runs lab.js's epilogue, where Transmit would store whatever was
  // collected so far as the run's final result. An abandoned run has none.
  Promise.resolve(experiment.end()).catch(() => {});
}

module.exports = { stopExperiment };
