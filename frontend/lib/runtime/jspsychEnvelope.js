// The jsPsych envelope: the one jsPsych release and plugin set MindHive serves
// to every jsPsych task (D4). Archives use these as globals and must not
// bring their own copy; the upload screen shows this list so researchers can
// check their package first.
//
// Versions match frontend/package.json exactly; jspsychEnvelope.test.js fails
// if node_modules disagrees.

const JSPSYCH_VERSION = '8.3.0';

const PLUGINS = {
  animation: { version: '2.1.0', global: 'jsPsychAnimation' },
  'audio-button-response': {
    version: '2.1.1',
    global: 'jsPsychAudioButtonResponse',
  },
  'audio-keyboard-response': {
    version: '2.2.0',
    global: 'jsPsychAudioKeyboardResponse',
  },
  'audio-slider-response': {
    version: '2.1.1',
    global: 'jsPsychAudioSliderResponse',
  },
  'browser-check': { version: '2.1.0', global: 'jsPsychBrowserCheck' },
  'call-function': { version: '2.1.0', global: 'jsPsychCallFunction' },
  'canvas-button-response': {
    version: '2.1.0',
    global: 'jsPsychCanvasButtonResponse',
  },
  'canvas-keyboard-response': {
    version: '2.2.0',
    global: 'jsPsychCanvasKeyboardResponse',
  },
  'canvas-slider-response': {
    version: '2.1.0',
    global: 'jsPsychCanvasSliderResponse',
  },
  'categorize-animation': {
    version: '2.1.0',
    global: 'jsPsychCategorizeAnimation',
  },
  'categorize-html': { version: '2.1.0', global: 'jsPsychCategorizeHtml' },
  'categorize-image': { version: '2.1.0', global: 'jsPsychCategorizeImage' },
  cloze: { version: '2.2.0', global: 'jsPsychCloze' },
  'external-html': { version: '2.1.0', global: 'jsPsychExternalHtml' },
  'free-sort': { version: '2.1.0', global: 'jsPsychFreeSort' },
  fullscreen: { version: '2.1.0', global: 'jsPsychFullscreen' },
  'html-button-response': {
    version: '2.1.0',
    global: 'jsPsychHtmlButtonResponse',
  },
  'html-keyboard-response': {
    version: '2.2.0',
    global: 'jsPsychHtmlKeyboardResponse',
  },
  'html-slider-response': {
    version: '2.1.0',
    global: 'jsPsychHtmlSliderResponse',
  },
  'iat-html': { version: '2.1.0', global: 'jsPsychIatHtml' },
  'iat-image': { version: '2.1.0', global: 'jsPsychIatImage' },
  'image-button-response': {
    version: '2.2.0',
    global: 'jsPsychImageButtonResponse',
  },
  'image-keyboard-response': {
    version: '2.2.0',
    global: 'jsPsychImageKeyboardResponse',
  },
  'image-slider-response': {
    version: '2.1.0',
    global: 'jsPsychImageSliderResponse',
  },
  instructions: { version: '2.1.0', global: 'jsPsychInstructions' },
  maxdiff: { version: '2.1.0', global: 'jsPsychMaxdiff' },
  preload: { version: '2.1.0', global: 'jsPsychPreload' },
  reconstruction: { version: '2.1.0', global: 'jsPsychReconstruction' },
  resize: { version: '2.1.0', global: 'jsPsychResize' },
  'same-different-html': {
    version: '2.1.0',
    global: 'jsPsychSameDifferentHtml',
  },
  'same-different-image': {
    version: '2.1.0',
    global: 'jsPsychSameDifferentImage',
  },
  'serial-reaction-time': {
    version: '2.1.0',
    global: 'jsPsychSerialReactionTime',
  },
  'serial-reaction-time-mouse': {
    version: '2.2.0',
    global: 'jsPsychSerialReactionTimeMouse',
  },
  sketchpad: { version: '2.1.0', global: 'jsPsychSketchpad' },
  survey: { version: '4.0.0', global: 'jsPsychSurvey' },
  'survey-html-form': { version: '2.1.0', global: 'jsPsychSurveyHtmlForm' },
  'survey-likert': { version: '2.2.0', global: 'jsPsychSurveyLikert' },
  'survey-multi-choice': {
    version: '2.2.1',
    global: 'jsPsychSurveyMultiChoice',
  },
  'survey-multi-select': {
    version: '2.1.1',
    global: 'jsPsychSurveyMultiSelect',
  },
  'survey-text': { version: '2.1.1', global: 'jsPsychSurveyText' },
  'video-button-response': {
    version: '2.1.1',
    global: 'jsPsychVideoButtonResponse',
  },
  'video-keyboard-response': {
    version: '2.2.0',
    global: 'jsPsychVideoKeyboardResponse',
  },
  'video-slider-response': {
    version: '2.1.1',
    global: 'jsPsychVideoSliderResponse',
  },
  'virtual-chinrest': { version: '3.1.0', global: 'jsPsychVirtualChinrest' },
  'visual-search-circle': {
    version: '2.2.0',
    global: 'jsPsychVisualSearchCircle',
  },
};

// Official plugins left out: they need a camera, a microphone or an eye
// tracker, which the sandboxed task frame doesn't get (C8).
const EXCLUDED_PLUGINS = [
  'html-audio-response',
  'html-video-response',
  'initialize-camera',
  'initialize-microphone',
  'mirror-camera',
  'tobii-calibration',
  'tobii-user-position',
  'tobii-validation',
  'webgazer-calibrate',
  'webgazer-init-camera',
  'webgazer-validate',
];

// Stylesheets a plugin needs beside jspsych.css, as files in its package.
const PLUGIN_STYLES = {
  survey: 'css/survey.min.css',
};

/** The script path inside node_modules for jsPsych (`name === "jspsych"`) or a plugin. */
function packageScript(name) {
  if (name === 'jspsych') return 'jspsych/dist/index.browser.min.js';
  if (!PLUGINS[name]) return null;
  return `@jspsych/plugin-${name}/dist/index.browser.min.js`;
}

function packageStyle(name) {
  if (name === 'jspsych') return 'jspsych/css/jspsych.css';
  return PLUGIN_STYLES[name]
    ? `@jspsych/plugin-${name}/${PLUGIN_STYLES[name]}`
    : null;
}

/** Plugins an experiment refers to, found by their global names in its code. */
function pluginsUsedIn(sources) {
  const text = sources.join('\n');
  return Object.entries(PLUGINS)
    .filter(([, { global }]) => new RegExp(`\\b${global}\\b`).test(text))
    .map(([name]) => name);
}

/** What the upload screen lists for researchers. */
function describeEnvelope() {
  return {
    jsPsychVersion: JSPSYCH_VERSION,
    plugins: Object.entries(PLUGINS).map(([name, { version, global }]) => ({
      name: `@jspsych/plugin-${name}`,
      version,
      global,
    })),
    excluded: EXCLUDED_PLUGINS.map((name) => `@jspsych/plugin-${name}`),
  };
}

module.exports = {
  EXCLUDED_PLUGINS,
  JSPSYCH_VERSION,
  PLUGINS,
  describeEnvelope,
  packageScript,
  packageStyle,
  pluginsUsedIn,
};
