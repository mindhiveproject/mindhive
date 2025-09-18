# Documentation Language Support

This system allows documentation to be automatically filtered by language locale, similar to how the NotionData.js script handles language filtering.

## How It Works

The documentation system supports multiple languages through a file naming convention and API endpoint that automatically detects the user's locale and serves the appropriate language version.

### File Naming Convention

Documentation files should follow this naming pattern:
- Default (English): `documentation.md`
- Localized: `documentation.{language_code}.md`

Examples:
- `documentation.board.md` (English)
- `documentation.board.fr-fr.md` (French)
- `documentation.board.es-es.md` (Spanish)

### Supported Language Codes

The system supports the following language codes:
- `en-us` (English - default)
- `fr-fr` (French)
- `es-es` (Spanish ES)
- `es-la` (Spanish LA)
- `ar-ae` (Arabic)
- `zh-cn` (Chinese)
- `hi-in` (Hindi)
- `hi-ma` (Hindi - Marathi)
- `ru-ru` (Russian)
- `nl-nl` (Dutch)
- `pt-br` (Portuguese - Brazil)

## API Endpoint

### Language-Aware Endpoint
- **URL**: `/api/documentation/fetchDocsWithLanguage`
- **Parameters**:
  - `file`: Path to the documentation file
  - `language_code`: Language code (optional, defaults to user's locale)

## Usage in Components

### Using the Hook

```javascript
import { useDocumentationLanguage } from '../../../lib/useDocumentationLanguage';

function MyComponent() {
  const { currentLocale, fetchDocumentation, filterByLanguage } = useDocumentationLanguage();
  
  // Fetch documentation with automatic language detection
  const fetchDoc = async () => {
    try {
      const content = await fetchDocumentation('path/to/documentation.md');
      console.log(content);
    } catch (error) {
      console.error('Failed to fetch documentation:', error);
    }
  };
  
  // Filter data by language (similar to NotionData.js)
  const filteredData = filterByLanguage(dataArray, 'language');
}
```

### Direct API Call

```javascript
const fetchDoc = async (filePath) => {
  const url = `/api/documentation/fetchDocsWithLanguage?file=${encodeURIComponent(filePath)}&language_code=${currentLocale}`;
  const response = await fetch(url);
  return response.text();
};
```

## Language Detection Logic

The system follows this priority order:
1. **User's current locale** (from router.locale)
2. **Fallback to English** (en-us) if no localized version exists
3. **Error handling** if neither exists

This matches the logic used in NotionData.js:
```javascript
// Filter data by language column matching currentLocale
let filteredData = dataArray.filter((page) => {
  const props = page.properties;
  const pageLang = props?.language?.select?.name || 
                   props?.language?.rich_text?.[0]?.plain_text || 
                   props?.language?.title?.[0]?.plain_text;
  return pageLang === currentLocale;
});

// Fallback to 'en-us' if no data for currentLocale
if (filteredData.length === 0) {
  filteredData = dataArray.filter((page) => {
    const props = page.properties;
    const pageLang = props?.language?.select?.name || 
                     props?.language?.rich_text?.[0]?.plain_text || 
                     props?.language?.title?.[0]?.plain_text;
    return pageLang === 'en-us';
  });
}
```

## Creating Localized Documentation

1. **Create the base English file**: `documentation.board.md`
2. **Create localized versions**: 
   - `documentation.board.fr-fr.md` (French)
   - `documentation.board.es-es.md` (Spanish)
   - etc.
3. **The system will automatically serve the correct version** based on the user's locale

## Example Files

See the following files for examples:
- `documentation.board.md` (English)
- `documentation.board.fr-fr.md` (French)
- `documentation.board.es-es.md` (Spanish)

## Migration from Old System

The old documentation system has been removed. All documentation now uses the new language-aware system:
1. Keep existing `documentation.md` files as English defaults
2. Add localized versions with the `.{language_code}.md` suffix
3. Use the new `fetchDocumentation` function from the hook

The system will automatically fall back to English if no localized version exists. 