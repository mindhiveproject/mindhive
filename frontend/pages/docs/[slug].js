import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { marked } from "marked";

import Site from "../../components/Global/Site";
import Page from "../../components/Global/Page";
import Document from "../../components/Documents/Main";

export const getStaticPaths = async ({ locales }) => {
  const files = fs
    .readdirSync("content/docs")
    .filter((file) => file.endsWith(".md"));

  // Get unique slugs (strip .md and .{locale}.md)
  const slugs = Array.from(
    new Set(
      files.map((filename) => filename.split('.')[0])
    )
  );

  // Generate a path for each slug/locale combination
  const paths = [];
  for (const slug of slugs) {
    for (const locale of locales) {
      // For default locale, only add if {slug}.md exists
      // For other locales, add if {slug}.{locale}.md exists, else fallback to {slug}.md
      const localizedFile = path.join('content', 'docs', `${slug}.${locale}.md`);
      const defaultFile = path.join('content', 'docs', `${slug}.md`);
      if (locale === 'en-us' && fs.existsSync(defaultFile)) {
        paths.push({ params: { slug }, locale });
      } else if (locale !== 'en-us' && (fs.existsSync(localizedFile) || fs.existsSync(defaultFile))) {
        paths.push({ params: { slug }, locale });
      }
    }
  }

  return {
    paths,
    fallback: false,
  };
};

export const getStaticProps = async (context) => {
  const { params: { slug }, locale } = context;
  const defaultLocale = 'en-us'; // Set your default locale here
  let filePath;

  if (locale && locale !== defaultLocale) {
    // Try to load the localized file first
    filePath = path.join('content', 'docs', `${slug}.${locale}.md`);
    if (!fs.existsSync(filePath)) {
      // Fallback to default
      filePath = path.join('content', 'docs', `${slug}.md`);
    }
  } else {
    // Default locale
    filePath = path.join('content', 'docs', `${slug}.md`);
  }

  const markdownWithMetadata = fs.readFileSync(filePath).toString();
  const parsedMarkdown = matter(markdownWithMetadata);
  const htmlString = marked(parsedMarkdown.content);
  return {
    props: {
      content: htmlString,
      title: parsedMarkdown.data.title,
      date: parsedMarkdown.data.date.toString(),
    },
  };
};

const DocumentPage = ({ content, title, date }) => (
  <Site>
    <Page>
      <Document content={content} title={title} date={date} />
    </Page>
  </Site>
);

export default DocumentPage;
