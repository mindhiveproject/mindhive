Key Features of TipTapEditor.js

Props:

content: Initial HTML content for the editor.
onUpdate: Callback function triggered when the editor content changes, passing the new HTML content.
isEditable: Boolean to control whether the editor is editable (default: true).
toolbarVisible: Boolean to control whether the toolbar is displayed (default: true).

Toolbar:

Includes only styling controls (bold, italic, underline, heading).
Maintains the same styling and accessibility features (e.g., aria-label for buttons).
Sits inside the top of the editor box as a slim strip rather than floating above it.
Its height is always reserved (padding-top on .ProseMirror, sized from the measured
toolbar via --tiptap-toolbar-height), and it only fades in while the editor is focused
and editable, so clicking into the editor never shifts the layout.
The strip is position: sticky, so it stays pinned to the top of the scrolling area
while a long editor is scrolled (set --tiptap-toolbar-sticky-top to clear a fixed header).
Use toolbarVisible={false} to drop the strip and its reserved space entirely.

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
