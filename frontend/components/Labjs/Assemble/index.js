import { pickBy, cloneDeep, fromPairs, mapValues } from 'lodash';
import axios from 'axios';
import { embeddedFiles } from './files';
import { embedPlugins } from './plugins';
import { makeDataURI, readDataURI } from './dataURI';
import { makeStudyTree } from './script.js';
import { makeHTML } from './html.js';

const assemble = async (
  state,
  folder,
  stateModifier = state => state,
  { additionalFiles = {}, headerOptions = {} } = {}
) => {
  // Apply modification function to copy of current state
  let updatedState = stateModifier(cloneDeep(state));

  // extract parameters
  const main_sequence_number = Object.values(updatedState.components)
    .filter(el => el.id == 'root')
    .map(e => e.children[0]);

  const parameters = Object.values(updatedState.components)
    .filter(el => el.id == main_sequence_number)
    .filter(e => e.parameters)
    .map(e => e.parameters)
    .reduce((flat, next) => flat.concat(next), [])
    .reduce((flat, next) => flat.concat(next), [])
    .filter(p => typeof p !== 'undefined' && p.name != '');

  // Filter files that are not embedded in components
  const filesInUse = embeddedFiles(updatedState.components);

  const files = pickBy(
    updatedState.files.files,
    (file, filename) =>
      file.source !== 'embedded' || filesInUse.includes(filename)
  );

  // save files in Cloudinary
  const uploadFile = async item => {
    const name = item[0].split(
      `${item[1].source === 'embedded' ? 'embedded' : 'static'}/`
    )[1];
    let string;
    if (item[1].content.startsWith('data:image/svg+xml')) {
      string = item[1].content.replace('data:image/svg+xml', 'data:image/svg');
    } else {
      string = item[1].content;
    }
    const truncatedName = name.split('.')[0];
    const location = `${folder}/${truncatedName}`;

    const formData = new FormData();
    formData.append('file', string);
    formData.append('public_id', location);
    formData.append('upload_preset', 'mindhive');
    const url = 'https://api.cloudinary.com/v1_1/mindhive-science/upload';
    const result = await axios.post(url, formData);
    if (result.statusText === 'OK') {
      const url = result.data && result.data.secure_url;
      if (item[1].source === 'embedded') {
        for (const [key, value] of Object.entries(updatedState.components)) {
          if (value.files && value.files.length) {
            value.files.map(e => {
              if (e.poolPath == item[0]) {
                e.poolPath = url;
              }
            });
          }
        }
      }
      // for static files replace the address with the string replace method
      if (item[1].source === 'embedded-global') {
        const stringifiedState = JSON.stringify(updatedState);
        const updatedStringifiedState = stringifiedState.replace(item[0], url);
        const updatedWithImageState = JSON.parse(updatedStringifiedState);
        updatedState = updatedWithImageState;
      }
    }
  };

  const arr = Object.entries(files).filter(
    i =>
      i &&
      i[1] &&
      (i[1].source == 'embedded' || i[1].source == 'embedded-global')
  );

  await Promise.all(arr.map(item => uploadFile(item)));

  // Collect plugin data
  const { pluginFiles, pluginHeaders, pluginPaths } = embedPlugins(
    updatedState
  );

  // Extract the urls of plugins to inject them in the header in Open Lab
  const plugins = pluginHeaders
    .reduce((a, b) => a.concat(b), [])
    .filter(item => item.src)
    .map(item => ({
      name: item.src,
      url: item.src,
    }));

  // Inject plugin headers
  const updatedHeaderOptions = {
    ...headerOptions,
    beforeHeader: [...(headerOptions.beforeHeader || []), ...pluginHeaders],
  };

  // Inject plugin paths, where available
  updatedState.components = mapValues(updatedState.components, c => ({
    ...c,
    plugins: c.plugins
      ? c.plugins.map(p => ({
          ...p,
          path: Object.keys(pluginPaths).includes(p.type)
            ? pluginPaths[p.type]
            : p.path,
        }))
      : c.plugins,
  }));

  // Reassemble state object that now includes the generated script,
  // as well as any additional files required for the deployment target
  return {
    files: {
      // Static files stored in state
      ...files,
      // Files required by plugins
      ...pluginFiles,
      // Additional files injected by the export modifier
      ...additionalFiles,
      // Generated experiment files
      'script.js': {
        content: makeStudyTree(updatedState),
      },
      'index.html': {
        content: makeDataURI(
          makeHTML(updatedState, updatedHeaderOptions, true),
          'text/html'
        ),
      },
      header: makeDataURI(
        makeHTML(updatedState, updatedHeaderOptions, false),
        'text/html'
      ),
      parameters,
      plugins,
    },
    bundledFiles: fromPairs(
      Object.entries(updatedState.files.bundledFiles).map(
        // Add source path to data, so that bundled files can be moved
        ([path, data]) => [path, { source: path, ...data }]
      )
    ),
  };
};

export default assemble;
