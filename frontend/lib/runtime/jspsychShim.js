// The script that connects a jsPsych experiment to MindHive (D5, W5). The
// task route puts it after the pinned jsPsych and before the experiment's own
// scripts, so the experiment's `initJsPsych` call goes through it:
//
//   on_data_update   each trial's data is saved as a row
//   on_trial_start   a "trial_start" marker; on_trial_finish a "trial_end"
//   on_finish        whatever the experiment's own on_finish returns (an
//                    object) becomes the aggregate, and every row is sent
//   jsPsych.run()    waits for MindHive's init, so MindHive.params is filled
//
// The experiment's own callbacks still run. MindHive.finish(aggregated) is
// the escape hatch for an experiment that ends some other way.
//
// Plain ES5, like frameClientSource: it is inlined into the task document.

function jsPsychShimSource() {
  return `
(function () {
  var MindHive = window.MindHive;
  var original = window.initJsPsych;
  if (!MindHive || typeof original !== "function") return;

  function isObject(value) {
    return value !== null && typeof value === "object" && !Array.isArray(value);
  }

  window.initJsPsych = function (options) {
    var settings = Object.assign({}, options || {});
    var own = {
      onDataUpdate: settings.on_data_update,
      onTrialStart: settings.on_trial_start,
      onTrialFinish: settings.on_trial_finish,
      onFinish: settings.on_finish,
    };
    var instance = null;

    settings.on_data_update = function (data) {
      MindHive.saveRow(data);
      if (own.onDataUpdate) return own.onDataUpdate.apply(this, arguments);
    };
    settings.on_trial_start = function (trial) {
      var name = null;
      try { name = trial && trial.type && trial.type.info ? trial.type.info.name : null; } catch (e) {}
      var index = null;
      try { index = instance ? instance.getProgress().current_trial_global : null; } catch (e) {}
      MindHive.marker("trial_start", { trial_type: name, trial_index: index });
      if (own.onTrialStart) return own.onTrialStart.apply(this, arguments);
    };
    settings.on_trial_finish = function (data) {
      MindHive.marker("trial_end", {
        trial_type: data ? data.trial_type : null,
        trial_index: data ? data.trial_index : null,
      });
      if (own.onTrialFinish) return own.onTrialFinish.apply(this, arguments);
    };
    settings.on_finish = function (data) {
      var rows = data && typeof data.values === "function" ? data.values() : undefined;
      var result;
      try {
        result = own.onFinish ? own.onFinish.apply(this, arguments) : undefined;
      } catch (error) {
        MindHive.fail(error && error.message, error && error.stack);
        return;
      }
      if (result && typeof result.then === "function") {
        return result.then(
          function (value) { MindHive.finish(isObject(value) ? value : {}, rows); },
          function (error) { MindHive.fail(error && error.message, error && error.stack); }
        );
      }
      MindHive.finish(isObject(result) ? result : {}, rows);
    };

    instance = original.call(this, settings);
    MindHive.ready();

    var run = instance.run;
    instance.run = function () {
      var self = this;
      var args = arguments;
      return new Promise(function (resolve, reject) {
        MindHive.onInit(function () {
          Promise.resolve(run.apply(self, args)).then(resolve, reject);
        });
      });
    };

    window.addEventListener("mindhive:abort", function () {
      try {
        if (typeof instance.abortExperiment === "function") instance.abortExperiment();
      } catch (e) {}
    });
    return instance;
  };
})();
`;
}

module.exports = { jsPsychShimSource };
