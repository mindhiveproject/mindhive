Key Features of TipTapEditor.js

Props:

content: Initial HTML content for the editor.
onUpdate: Callback function triggered when the editor content changes, passing the new HTML content.
isEditable: Boolean to control whether the editor is editable (default: true).
toolbarVisible: Boolean to control whether the toolbar is displayed (default: true).

Toolbar:

Includes only styling controls (bold, italic, underline, heading).
Maintains the same styling and accessibility features (e.g., aria-label for buttons).

Editor:

Uses @tiptap/react with StarterKit and Underline extensions.
Configurable via props for flexibility in different contexts.
Applies consistent styling (border, padding, minHeight)

How to Use TipTapEditor Elsewhere

You can reuse TipTapEditor in other parts of the MindHive platform by importing it and passing the appropriate props. For example:

import TipTapEditor from "./TipTapEditor";

function AnotherComponent() {
const [content, setContent] = useState("<p>Initial content</p>");

return (

<div>
<TipTapEditor
        content={content}
        onUpdate={setContent}
        isEditable={true}
        toolbarVisible={true}
      />
<button onClick={() => console.log(content)}>Save</button>
</div>
);
}
