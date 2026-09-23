// A block's declared output is `{ node, stream?, channels, ... }`: a graph node
// id, plus a stream name when that node emits more than one stream (the face
// landmarker node emits both "blendshapes" and "head_pose"). Outputs are matched
// this way rather than by full stream ID because a stream ID starts with the
// connected device's own runtime ID ("Muse-1A2B:eeg:raw"), which a block author
// cannot know when writing the block.

export function outputKey(output) {
  return output.stream ? `${output.node}/${output.stream}` : output.node;
}

export function channelKey(output, channelIndex) {
  return `${outputKey(output)}::${channelIndex}`;
}

// `nodeId` comes from the key of `pipeline.recordTargets()`; a packet carries
// its stream name in `metadata.name`.
export function findOutput(outputs, nodeId, packet) {
  return (outputs || []).find(
    (output) =>
      output.node === nodeId &&
      (!output.stream || output.stream === packet.metadata?.name)
  );
}
