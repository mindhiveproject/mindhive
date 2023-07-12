import lz from "lzutf8";

const deserialize = (serializedJavascript) => {
  return eval(`(${serializedJavascript})`);
};

export const convert = (scriptIn) => {
  let script;

  try {
    script = deserialize(scriptIn);
  } catch (error) {
    const decompressedScript = lz.decompress(lz.decodeBase64(scriptIn));
    script = deserialize(decompressedScript);
  }

  return script;
};

export const decompress = (script) => {
  return lz.decompress(lz.decodeBase64(script));
};
