import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';

const SUPPORTED_LOCALES = [
  'en-us', 'fr-fr', 'es-es', 'ar-ae', 'zh-cn', 'hi-in', 'hi-ma', 'ru-ru', 'nl-nl', 'pt-br'
];

function getRelativePath(pathname) {
  const segments = pathname.split('/').filter(Boolean);
  if (segments.length && SUPPORTED_LOCALES.includes(segments[0].toLowerCase())) {
    return '/' + segments.slice(1).join('/');
  }
  return '/' + segments.join('/');
}

function getDocsFilePath(relativePath) {
  const parts = relativePath.split('/').filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0].toUpperCase() + parts[0].slice(1)}/${parts[1][0].toUpperCase() + parts[1].slice(1)}/documentation.md`;
  }
  return null;
}

// Example styled components
const StyledMarkdown = styled.div`
  font-family: 'Inter', sans-serif;
  color: #222;
  line-height: 1.7;
  background:rgba(255, 255, 255, 0);
  padding: 2rem;
  border-radius: 8px;
`;

const Heading1 = styled.h1`
  color:rgb(0, 0, 0);
  font-size: 22px;
  margin-top: 1.5em;
`;

const Heading2 = styled.h2`
  color:rgb(0, 0, 0);
  font-size: 18px;
  margin-top: 1.5em;
`;

const Heading3 = styled.h3`
  color:rgb(0, 0, 0);
  font-size: 16px;
  margin-top: 1.5em;
`;

const Paragraph = styled.p`
  margin: 0.5em 0;
  font-size: 14px;
`;


export default function Documentation() {
  const router = useRouter();
  const [markdown, setMarkdown] = useState('');
  useEffect(() => {
    const relativePath = getRelativePath(router.asPath);
    const filePath = getDocsFilePath(relativePath);
    if (filePath) {
      fetch(`/api/documentation/fetchDocs?file=${encodeURIComponent(filePath)}`)
        .then(res => res.ok ? res.text() : Promise.reject('Not found'))
        .then(setMarkdown)
        .catch(() => setMarkdown(`No page-specific documentation available here.`));
    } else {
      setMarkdown('### Error: No page-specific documentation available here.');
    }
  }, [router.asPath]);
  return (
    <StyledMarkdown>
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <Heading1 {...props} />,
          h2: ({node, ...props}) => <Heading2 {...props} />,
          h3: ({node, ...props}) => <Heading3 {...props} />,
          p: ({node, ...props}) => <Paragraph {...props} />,
          // Add more overrides as needed
        }}
      >
        {markdown}
      </ReactMarkdown>
    </StyledMarkdown>
  );
}