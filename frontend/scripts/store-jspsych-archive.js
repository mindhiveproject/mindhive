/**
 * Unpacks a jsPsych archive for one JsPsychExperiment row, until the upload
 * flow (W14) does it at upload time.
 *
 * It runs the same checks as upload (lib/runtime/jspsychArchive.js), stores
 * the files under runtime-assets/jspsych/<version id>/, and prints the
 * manifest and entry point to set on the row. From the frontend directory:
 *
 *   node scripts/store-jspsych-archive.js <version id> <archive.zip> [entry.html]
 *
 * A version that is already stored is left alone: versions never change.
 */

const fs = require('fs');
const path = require('path');
const {
  ArchiveError,
  storeUnpackedArchive,
  unpackJsPsychArchive,
} = require('../lib/runtime/jspsychArchive');

async function main() {
  const [versionId, archive, entryPoint = 'index.html'] = process.argv.slice(2);
  if (!versionId || !archive) {
    console.error(
      'Usage: node scripts/store-jspsych-archive.js <version id> <archive.zip> [entry.html]'
    );
    process.exit(1);
  }
  const unpacked = await unpackJsPsychArchive(fs.readFileSync(archive), {
    entryPoint,
  });
  const dir = await storeUnpackedArchive(
    path.resolve(__dirname, '..', 'runtime-assets', 'jspsych'),
    versionId,
    unpacked
  );
  console.log(`Stored ${unpacked.files.length} files in ${dir}`);
  console.log('Set these on the JsPsychExperiment row:');
  console.log(
    JSON.stringify(
      {
        entryPoint: unpacked.manifest.entryPoint,
        manifest: unpacked.manifest,
      },
      null,
      2
    )
  );
}

main().catch((error) => {
  if (error instanceof ArchiveError) {
    console.error('The archive was refused:');
    error.problems.forEach((problem) => console.error(`- ${problem}`));
  } else {
    console.error(error.message);
  }
  process.exit(1);
});
