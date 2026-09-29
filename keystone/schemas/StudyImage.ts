import { list } from "@keystone-6/core";
import { text, relationship, image } from "@keystone-6/core/fields";

import { cloudinaryImage } from "@keystone-6/cloudinary";
import { signedInWrites, studyEditorFilter } from "../access";
// import { rules, permissions } from "../access";

const cloudinary = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_KEY,
  apiSecret: process.env.CLOUDINARY_SECRET,
  folder: "mindhive-studies",
};

export const StudyImage = list({
  access: {
    // Anyone may read (participants need studies/tasks); changes need a
    // signed-in owner.
    operation: signedInWrites,
    filter: {
      update: studyEditorFilter,
      delete: studyEditorFilter,
    },
  },
  fields: {
    /** Legacy Cloudinary asset; prefer `keystoneImage` for new uploads. */
    image: cloudinaryImage({
      cloudinary,
      label: "Source (legacy)",
    }),
    keystoneImage: image({
      storage: "study_images",
      label: "Image (Keystone)",
    }),
    altText: text(),
    study: relationship({ ref: "Study.image" }),
  },
});
