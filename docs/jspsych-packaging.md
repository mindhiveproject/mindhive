# Packaging a jsPsych experiment for MindHive

This guide is for whoever builds the zip that becomes a jsPsych block. An
upload that breaks a rule here is refused, and the upload screen lists every
problem it found, so you can fix them all in one go.

MindHive runs your experiment in a sandboxed frame and adds jsPsych for you.
Your zip holds only your own code, stimuli and an optional `mindhive.json`.

## The short version

1. Put an `index.html` at the top of the zip.
2. Don't include jsPsych or any of its plugins, and don't load them from a
   CDN. Use the globals MindHive provides (`initJsPsych`,
   `jsPsychHtmlKeyboardResponse`, …).
3. Build and run your timeline inside `MindHive.onInit(…)`, and read your
   settings from `MindHive.params`.
4. Return an object from `on_finish` to save summary results.
5. Declare your settings, if any, in `mindhive.json`.

## What MindHive provides

MindHive serves **jsPsych 8.3.0** and these official plugins, as browser
globals. Refer to a plugin by its global name in your HTML or JavaScript;
that's how upload finds which ones to load.

| Global | Plugin |
| --- | --- |
| `jsPsychAnimation` | animation |
| `jsPsychAudioButtonResponse` | audio-button-response |
| `jsPsychAudioKeyboardResponse` | audio-keyboard-response |
| `jsPsychAudioSliderResponse` | audio-slider-response |
| `jsPsychBrowserCheck` | browser-check |
| `jsPsychCallFunction` | call-function |
| `jsPsychCanvasButtonResponse` | canvas-button-response |
| `jsPsychCanvasKeyboardResponse` | canvas-keyboard-response |
| `jsPsychCanvasSliderResponse` | canvas-slider-response |
| `jsPsychCategorizeAnimation` | categorize-animation |
| `jsPsychCategorizeHtml` | categorize-html |
| `jsPsychCategorizeImage` | categorize-image |
| `jsPsychCloze` | cloze |
| `jsPsychExternalHtml` | external-html |
| `jsPsychFreeSort` | free-sort |
| `jsPsychFullscreen` | fullscreen |
| `jsPsychHtmlButtonResponse` | html-button-response |
| `jsPsychHtmlKeyboardResponse` | html-keyboard-response |
| `jsPsychHtmlSliderResponse` | html-slider-response |
| `jsPsychIatHtml` | iat-html |
| `jsPsychIatImage` | iat-image |
| `jsPsychImageButtonResponse` | image-button-response |
| `jsPsychImageKeyboardResponse` | image-keyboard-response |
| `jsPsychImageSliderResponse` | image-slider-response |
| `jsPsychInstructions` | instructions |
| `jsPsychMaxdiff` | maxdiff |
| `jsPsychPreload` | preload |
| `jsPsychReconstruction` | reconstruction |
| `jsPsychResize` | resize |
| `jsPsychSameDifferentHtml` | same-different-html |
| `jsPsychSameDifferentImage` | same-different-image |
| `jsPsychSerialReactionTime` | serial-reaction-time |
| `jsPsychSerialReactionTimeMouse` | serial-reaction-time-mouse |
| `jsPsychSketchpad` | sketchpad |
| `jsPsychSurvey` | survey (its stylesheet is added too) |
| `jsPsychSurveyHtmlForm` | survey-html-form |
| `jsPsychSurveyLikert` | survey-likert |
| `jsPsychSurveyMultiChoice` | survey-multi-choice |
| `jsPsychSurveyMultiSelect` | survey-multi-select |
| `jsPsychSurveyText` | survey-text |
| `jsPsychVideoButtonResponse` | video-button-response |
| `jsPsychVideoKeyboardResponse` | video-keyboard-response |
| `jsPsychVideoSliderResponse` | video-slider-response |
| `jsPsychVirtualChinrest` | virtual-chinrest |
| `jsPsychVisualSearchCircle` | visual-search-circle |

The exact plugin versions are in `frontend/lib/runtime/jspsychEnvelope.js`,
and the upload screen lists them too.

**Not available:** plugins that need a camera, a microphone or an eye
tracker, because the task frame gets none of them: html-audio-response,
html-video-response, initialize-camera, initialize-microphone, mirror-camera,
the tobii-* plugins and the webgazer-* plugins. An experiment that uses one is
refused.

A plugin is only loaded if its global name appears in your code. Reaching it
some other way, such as `window["jsPsych" + name]`, won't be detected, so
write the name out.

## What the zip may contain

- **An HTML entry point**, `index.html` by default. If you zipped a folder,
  that's fine: a single top-level folder is stripped. `__MACOSX/`,
  `.DS_Store` and `Thumbs.db` are ignored.
- **Your scripts, styles and stimuli**, referenced with relative paths
  (`js/task.js`, `img/cross.png`). A path starting with `/` won't resolve:
  every file is served from under the task's own address. ES modules
  (`<script type="module">`) work.
- **An optional `mindhive.json`** at the top (see Parameters below).

It may not contain:

- jsPsych or a plugin: files named like `jspsych.js`, `jspsych.min.js`,
  `plugin-html-keyboard-response.js`, `jspsych-html-keyboard-response.js`, or
  anything under `@jspsych/` or `jspsych/dist/`;
- a bundle that includes jsPsych. If you build with a bundler, mark
  `jspsych` and `@jspsych/*` as externals. Upload looks for jsPsych's own code
  (`class JsPsych`, `function initJsPsych(`, `jsPsychModule =`) to catch this;
- a `<script src>` that loads jsPsych from a CDN;
- unsafe paths (`..`, absolute paths, backslashes) or symbolic links.

Limits: 10,000 files, 50 MB per file, 200 MB in all. Production currently
accepts uploads up to 100 MB, so keep zips under that for now.

## The `MindHive` API

MindHive defines `window.MindHive` before any of your code runs, and wraps
`initJsPsych` so the common cases need no extra code.

| You write | MindHive does |
| --- | --- |
| `initJsPsych({...})` | Saves each trial's data as a row (`on_data_update`), records `trial_start` and `trial_end` markers, and finishes the run from `on_finish`. Your own callbacks still run. |
| `jsPsych.run(timeline)` | Waits until the task's settings have arrived, then runs. |
| `on_finish: (data) => ({ ... })` | The object you return becomes the run's summary results. Returning nothing saves `{}`. A Promise that resolves to an object works too. |
| `MindHive.params` | The task's parameter values, filled in when the task starts. |
| `MindHive.mode` | `"persist"` in a study, `"preview"` when previewing (nothing is saved). |
| `MindHive.onInit(callback)` | Runs `callback` once the settings have arrived. |
| `MindHive.marker(label, value, time)` | Records a marker row; `time` defaults to now (ms since epoch). |
| `MindHive.saveRow(row)` | Saves one extra row. |
| `MindHive.finish(aggregated)` | Ends the run yourself, if your experiment doesn't end through `on_finish`. Only the first finish counts. |
| `MindHive.fail(message)` | Ends the run as a failure. Uncaught errors do this automatically. |

Build your timeline inside `MindHive.onInit`. Code at the top level of a
script runs before the settings arrive, so `MindHive.params` is still empty
there.

Values are saved as JSON: typed arrays become arrays, dates become ISO
strings, and `NaN` becomes `null`.

## Parameters: `mindhive.json`

Settings a researcher can change per block go in `mindhive.json`, in the same
format Lab.js templates use, so the Study Builder's parameter editor works
for them:

```json
{
  "parameters": [
    { "name": "trials", "type": "number", "value": 20, "help": "Number of trials" },
    { "name": "hand", "type": "select", "value": "left", "options": ["left", "right"] },
    { "name": "instructions", "type": "textarea", "value": "Press F or J." }
  ]
}
```

- Every parameter needs a unique `name`; `value` is its default.
- The file must be valid JSON holding an object; problems are listed at
  upload.
- At run time the block's values arrive as `MindHive.params.trials`,
  `MindHive.params.hand`, and so on.

## What gets saved

Each run is saved like a Lab.js run, so Collect and the raw downloads read it
the same way:

- every trial's data as a row, with jsPsych's own end-of-run data replacing
  the rows sent along the way;
- marker rows, `{ "mh_kind": "marker", "label", "value", "time" }`, after the
  trial rows;
- the summary object from `on_finish`, which also goes to the Data Journal.

Survey plugins that return objects (such as a survey `response`) are saved as
nested objects. In CSV downloads they become one column per answer
(`response.Q0`), and a field you named like one of MindHive's run columns
(`task`, `id`, `type`, `study`, …) appears as `data.task` and so on.

## What the frame allows

- Network access: your experiment may fetch from or load files from other
  sites.
- Forms, keyboard input (the frame is focused when it opens) and fullscreen.
- No access to the MindHive page around it, its cookies or its storage.
  `localStorage` and `sessionStorage` aren't available.
- No camera, microphone or eye tracker.

## A minimal example

`index.html`:

```html
<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <script src="js/task.js"></script>
  </head>
  <body></body>
</html>
```

`js/task.js`:

```js
var jsPsych = initJsPsych({
  on_finish: function (data) {
    var responses = data.filter({ task: 'response' });
    return { trials: responses.count(), mean_rt: responses.select('rt').mean() };
  },
});

MindHive.onInit(function () {
  var timeline = [];
  for (var i = 0; i < Number(MindHive.params.trials || 3); i += 1) {
    timeline.push({
      type: jsPsychHtmlKeyboardResponse,
      stimulus: '<p style="font-size: 48px">+</p>',
      choices: ['f', 'j'],
      data: { task: 'response' },
    });
  }
  jsPsych.run(timeline);
});
```

`mindhive.json`:

```json
{ "parameters": [{ "name": "trials", "type": "number", "value": 3 }] }
```

Zip the three files (or their folder) and upload them.

## Trying it locally

Outside MindHive there's no `MindHive` object. To open `index.html` in a
browser while you work, put this before your scripts and remove it before
zipping (or keep it in a file you leave out of the zip):

```html
<script src="https://unpkg.com/jspsych@8.3.0"></script>
<script src="https://unpkg.com/@jspsych/plugin-html-keyboard-response@2.2.0"></script>
<script>
  window.MindHive = {
    params: { trials: 3 },
    mode: 'preview',
    onInit: function (callback) { callback(window.MindHive); },
    ready: function () {},
    saveRow: function (row) { console.log('row', row); },
    marker: function (label, value) { console.log('marker', label, value); },
    finish: function (aggregated) { console.log('finish', aggregated); },
    fail: function (message) { console.error('fail', message); },
  };
</script>
```

Remove it before uploading: a CDN script for jsPsych gets the archive
refused.

## Versions and updates

- Each upload is a new, unchangeable version. To change an experiment,
  upload a new version from the block's **Template** tab ("Upload a new
  version"). Only the experiment's authors and collaborators can.
- Blocks keep the version they were added with. When a newer one exists,
  the block shows "A newer version is available". "Update to the latest
  version" lists which parameters will be added, removed or reset before you
  confirm. Values you set are kept where they still fit.
- A block can't be updated while a study that uses it is collecting data.
  Duplicate the study or the block to use the new version.

## Checking your block

Use **Preview** on the block: it runs the experiment without saving anything.
The built-in browser in the Claude desktop app can't run task frames, so
preview in Chrome.
