import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";

function dispatchImageNode(view, src, mediaAssetId = null) {
  const { schema } = view.state;
  const attrs = { src };
  if (mediaAssetId) {
    attrs.mediaAssetId = mediaAssetId;
  }
  const node = schema.nodes.image.create(attrs);
  const tr = view.state.tr.replaceSelectionWith(node);
  view.dispatch(tr);
}

async function dataUriToFile(dataUri, filename = "pasted-image.jpg") {
  const res = await fetch(dataUri);
  const blob = await res.blob();
  const type =
    blob.type && blob.type.startsWith("image/") ? blob.type : "image/jpeg";
  return new File([blob], filename, { type });
}

/**
 * TipTap extension: paste image files or data-URI / &lt;img src="data:..."&gt; text.
 * When `getPasteContext().mediaScopeId` and `uploadPastedImage` are set, uploads to
 * Cloudinary + MediaAsset and inserts HTTPS src + mediaAssetId.
 * Without a media scope, image pastes are blocked (URL-only via toolbar).
 */
export const PasteImageExtension = Extension.create({
  name: "pasteImage",

  addOptions() {
    return {
      getPasteContext: () => ({}),
    };
  },

  addProseMirrorPlugins() {
    const extension = this;
    const uploadInFlightRef = { current: false };

    return [
      new Plugin({
        key: new PluginKey("pasteImage"),
        props: {
          handlePaste(view, event) {
            const clipboardData = event.clipboardData;
            if (!clipboardData) return false;

            const { getPasteContext } = extension.options;
            const ctx = getPasteContext?.() || {};
            const useMediaUpload =
              Boolean(ctx.mediaScopeId) &&
              typeof ctx.uploadPastedImage === "function";

            const warnNoMediaScope = () => {
              ctx.onPasteImageNoMediaScope?.();
            };

            const runUploadFile = (file) => {
              if (!file) return;
              void (async () => {
                if (uploadInFlightRef.current) return;
                uploadInFlightRef.current = true;
                try {
                  const result = await ctx.uploadPastedImage(file);
                  if (result?.url && result?.id) {
                    dispatchImageNode(view, result.url, result.id);
                  } else {
                    ctx.onPasteImageUploadFailed?.();
                  }
                } catch (err) {
                  console.error("Paste image upload failed", err);
                  ctx.onPasteImageUploadFailed?.();
                } finally {
                  uploadInFlightRef.current = false;
                }
              })();
            };

            const runUploadDataUri = (dataUri) => {
              if (!dataUri || !dataUri.startsWith("data:image/")) return;
              void (async () => {
                if (uploadInFlightRef.current) return;
                uploadInFlightRef.current = true;
                try {
                  const file = await dataUriToFile(dataUri, "pasted-image.jpg");
                  const result = await ctx.uploadPastedImage(file);
                  if (result?.url && result?.id) {
                    dispatchImageNode(view, result.url, result.id);
                  } else {
                    ctx.onPasteImageUploadFailed?.();
                  }
                } catch (err) {
                  console.error("Paste image upload failed", err);
                  ctx.onPasteImageUploadFailed?.();
                } finally {
                  uploadInFlightRef.current = false;
                }
              })();
            };

            if (clipboardData.items?.length) {
              for (let i = 0; i < clipboardData.items.length; i++) {
                const item = clipboardData.items[i];
                if (item.kind === "file" && item.type?.startsWith?.("image/")) {
                  const file = item.getAsFile();
                  if (file) {
                    if (useMediaUpload) {
                      runUploadFile(file);
                    } else {
                      warnNoMediaScope();
                    }
                    return true;
                  }
                }
              }
            }

            if (clipboardData.files?.length) {
              for (let i = 0; i < clipboardData.files.length; i++) {
                const file = clipboardData.files[i];
                if (file.type?.startsWith("image/")) {
                  if (useMediaUpload) {
                    runUploadFile(file);
                  } else {
                    warnNoMediaScope();
                  }
                  return true;
                }
              }
            }

            const text = clipboardData.getData("text/plain");
            if (text) {
              const trimmedText = text.trim();

              if (trimmedText.startsWith("data:image/")) {
                if (useMediaUpload) {
                  runUploadDataUri(trimmedText);
                } else {
                  warnNoMediaScope();
                }
                return true;
              }

              const imgTagStart = trimmedText.indexOf("<img");
              if (imgTagStart !== -1) {
                const srcMatch = trimmedText.match(
                  /<img[^>]+src=['"]([^'"]+)['"]/i,
                );
                if (
                  srcMatch &&
                  srcMatch[1] &&
                  srcMatch[1].startsWith("data:image/")
                ) {
                  if (useMediaUpload) {
                    runUploadDataUri(srcMatch[1]);
                  } else {
                    warnNoMediaScope();
                  }
                  return true;
                }
              }
            }

            return false;
          },
        },
      }),
    ];
  },
});
