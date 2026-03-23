import { list } from "@keystone-6/core";
import { text, relationship } from "@keystone-6/core/fields";
import { cloudinaryImage } from "@keystone-6/cloudinary";
import { isSignedIn, isAdmin } from "../access";

const cloudinary = {
  cloudName: process.env.CLOUDINARY_CLOUD_NAME,
  apiKey: process.env.CLOUDINARY_KEY,
  apiSecret: process.env.CLOUDINARY_SECRET,
  folder: "mindhive-studies",
};

export const StudyImage = list({
  access: {
    operation: {
      query: isSignedIn,
      create: isSignedIn,
      update: isSignedIn,
      delete: isSignedIn,
    },
    filter: {
      // Admins: all; others: images for studies they can access
      query: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              study: {
                OR: [
                  { public: { equals: true } },
                  { author: { id: { equals: session?.itemId } } },
                  {
                    collaborators: {
                      some: { id: { equals: session?.itemId } },
                    },
                  },
                ],
              },
            },
      update: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              study: {
                OR: [
                  { author: { id: { equals: session?.itemId } } },
                  {
                    collaborators: {
                      some: { id: { equals: session?.itemId } },
                    },
                  },
                ],
              },
            },
      delete: ({ session }) =>
        isAdmin({ session })
          ? true
          : {
              study: {
                author: { id: { equals: session?.itemId } },
              },
            },
    },
  },
  fields: {
    image: cloudinaryImage({
      cloudinary,
      label: "Source",
    }),
    altText: text(),
    study: relationship({ ref: "Study.image" }),
  },
});
