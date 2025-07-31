import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import ReactMarkdown from 'react-markdown';
import styled from 'styled-components';
import { useDocumentationLanguage } from '../../../lib/useDocumentationLanguage';

const SUPPORTED_LOCALES = [
  'en-us',
  'fr-fr',
  'es-es',
  'ar-ae',
  'zh-cn',
  'hi-in',
  'hi-ma',
  'ru-ru',
  'nl-nl',
  'pt-br'
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
  font-family: 'Inter',
 sans-serif;
  color: #222;
  line-height: 1.7;
  background:rgba(255, 255, 255, 0);
  padding: 2rem;
  border-radius: 8px;
`;

const Heading1 = styled.h1`  
  color:rgb(0, 0, 0);
  font-size: 22px;
  color: ${props => props.theme.primaryCalyspo};
  font-weight: 600;
  margin-top: 1.5em;
  `;
  
const Heading2 = styled.h2`
  color: ${props => props.theme.secondaryCalyspo};
  font-size: 18px;
  margin-top: 1.5em;
`;

const Heading3 = styled.h3`
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
  const { fetchDocumentation } = useDocumentationLanguage();

  useEffect(() => {
    // Remove query string from asPath for path parsing
    const pathOnly = router.asPath.split('?')[0];
    const relativePath = getRelativePath(pathOnly);
    const filePath = getDocsFilePath(relativePath);

    // Get the tab from the query string
    const tab = router.query.tab;
    const validTabs = ['board',
                       'builder',
                       'page',
                       'review',
                       'collect',
                       'journal'];

    if (filePath) {
      // If tab is valid, try tab-specific doc first
      if (tab && validTabs.includes(tab)) {
        const tabFilePath = filePath.replace(/\.md$/, `.${tab}.md`);
        fetchDocumentation(tabFilePath)
          .then(setMarkdown)
          .catch(() => {
            // Fallback to default doc if tab-specific not found
            fetchDocumentation(filePath)
              .then(setMarkdown)
              .catch(() => setMarkdown(`No page-specific documentation available here.`));
          });
      } else {
        // No tab or invalid tab, just fetch the default doc
        fetchDocumentation(filePath)
          .then(setMarkdown)
          .catch(() => setMarkdown(`Oops!\nNo page-specific documentation available here.`));
      }
    } else {
      setMarkdown('Oops!\nNo page-specific documentation available here.');
    }
  }, [router.asPath, router.query.tab, fetchDocumentation]);

  return (
    <StyledMarkdown>
      <ReactMarkdown
        components={{
          h1: ({node, ...props}) => <Heading1 {...props} />,
          h2: ({node, ...props}) => <Heading2 {...props} />,
          h3: ({node, ...props}) => <Heading3 {...props} />,
          p: ({node, ...props}) => <Paragraph {...props} />,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </StyledMarkdown>
  );
}
