import fs from 'fs';
import path from 'path';

export default function handler(req, res) {
  const { file, language_code } = req.query;

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

  // If language_code is provided, try to find localized version first
  let content = null;
  if (language_code && language_code !== 'en-us') {
    // Try to find localized version: filename.{language_code}.md
    const localizedPath = targetPath.replace(/\.md$/, `.${language_code}.md`);
    if (fs.existsSync(localizedPath)) {
      content = fs.readFileSync(localizedPath, 'utf-8');
    }
  }

  // Fallback to default file if no localized version found or no language specified
  if (!content && fs.existsSync(targetPath)) {
    content = fs.readFileSync(targetPath, 'utf-8');
  }

  if (!content) {
    return res.status(404).send('File not found');
  }

  res.setHeader('Content-Type', 'text/markdown');
  return res.status(200).send(content);
} 