import { useRouter } from 'next/router';

/**
 * Hook to handle documentation language locale parsing
 * Similar to the language filtering logic in NotionData.js
 */
export function useDocumentationLanguage() {
  const router = useRouter();
  const currentLocale = router.locale || 'en-us';

  /**
   * Parse and filter documentation data by language
   * @param {Array} dataArray - Array of documentation items
   * @param {string} languageField - Field name containing language information
   * @returns {Array} Filtered data for current locale
   */
  const filterByLanguage = (dataArray, languageField = 'language') => {
    if (!Array.isArray(dataArray)) {
      return [];
    }

    // Filter data by language column matching currentLocale
    let filteredData = dataArray.filter((item) => {
      const languageValue = item[languageField];
      if (!languageValue) return false;
      
      // Handle different language field formats (similar to NotionData.js)
      const pageLang = languageValue.select?.name || 
                      languageValue.rich_text?.[0]?.plain_text || 
                      languageValue.title?.[0]?.plain_text ||
                      languageValue;
      
      return pageLang === currentLocale;
    });

    // Fallback to 'en-us' if no data for currentLocale
    if (filteredData.length === 0) {
      filteredData = dataArray.filter((item) => {
        const languageValue = item[languageField];
        if (!languageValue) return false;
        
        const pageLang = languageValue.select?.name || 
                        languageValue.rich_text?.[0]?.plain_text || 
                        languageValue.title?.[0]?.plain_text ||
                        languageValue;
        
        return pageLang === 'en-us';
      });
    }

    return filteredData;
  };

  /**
   * Get the appropriate file path for localized documentation
   * @param {string} basePath - Base file path
   * @param {string} extension - File extension (default: '.md')
   * @returns {string} Localized file path
   */
  const getLocalizedFilePath = (basePath, extension = '.md') => {
    if (currentLocale === 'en-us') {
      return basePath;
    }
    
    // Insert locale before the extension
    const pathWithoutExt = basePath.replace(extension, '');
    return `${pathWithoutExt}.${currentLocale}${extension}`;
  };

  /**
   * Fetch documentation with language support
   * @param {string} filePath - Path to the documentation file
   * @returns {Promise<string>} Documentation content
   */
  const fetchDocumentation = async (filePath) => {
    const url = `/api/documentation/fetchDocsWithLanguage?file=${encodeURIComponent(filePath)}&language_code=${currentLocale}`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch documentation: ${response.statusText}`);
    }
    
    return response.text();
  };

  return {
    currentLocale,
    filterByLanguage,
    getLocalizedFilePath,
    fetchDocumentation
  };
} 