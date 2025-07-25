import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { file } = req.query;

  if (!file) {
    return res.status(400).send('Missing file parameter');
  }

  // Decode file path
  const decodedFilePath = decodeURIComponent(file);

  // Absolute path inside the components folder
  const docsRoot = path.join(process.cwd(), 'components');
  const targetPath = path.join(docsRoot, decodedFilePath.replace(/^frontend\/components\//, ''));

  // Security check: ensure targetPath starts with docsRoot
  if (!targetPath.startsWith(docsRoot)) {
    return res.status(400).send('Invalid file path');
  }

  if (!fs.existsSync(targetPath)) {
    return res.status(404).send('File not found');
  }

  const content = fs.readFileSync(targetPath, 'utf-8');
  res.setHeader('Content-Type', 'text/markdown');
  return res.status(200).send(content);
}
