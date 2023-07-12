import { list } from "@keystone-6/core";
import { text, relationship } from "@keystone-6/core/fields";

import { cloudinaryImage } from "@keystone-6/cloudinary";
// import { rules, permissions } from "../access";

const cloudinary = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_KEY,
  apiSecret: process.env.CLOUDINARY_SECRET,
  folder: "mindhive-users",
};

export const ProfileImage = list({
  access: {
    operation: {
      query: () => true,
      create: () => true,
      update: () => true,
      delete: () => true,
    },
  },
  fields: {
    image: cloudinaryImage({
      cloudinary,
      label: "Source",
    }),
    altText: text(),
    profile: relationship({ ref: "Profile.image" }),
  },
});
