import Image from "@tiptap/extension-image";

/**
 * Image node with optional `data-media-asset-id` for MediaAsset linkage.
 * `src` is expected to be an HTTPS URL (e.g. Cloudinary).
 */
export const MindHiveImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      mediaAssetId: {
        default: null,
        parseHTML: (element) => element.getAttribute("data-media-asset-id"),
        renderHTML: (attributes) => {
          if (!attributes.mediaAssetId) {
            return {};
          }
          return {
            "data-media-asset-id": attributes.mediaAssetId,
          };
        },
      },
    };
  },
});
