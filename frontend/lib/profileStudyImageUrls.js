/**
 * Resolve display URL for Profile.image (ProfileImage): Keystone first, then legacy Cloudinary.
 * @param {import("@apollo/client").ApolloClient | unknown} profile - Profile with nested image
 * @returns {string}
 */
export function getProfileImageUrl(profile) {
  const row = profile?.image;
  if (!row) return "";
  const keystone = row.keystoneImage?.url;
  if (typeof keystone === "string" && keystone.trim()) return keystone.trim();
  const legacy = row.image?.publicUrlTransformed;
  if (typeof legacy === "string" && legacy.trim()) return legacy.trim();
  return "";
}

/**
 * Resolve display URL for Study.image (StudyImage): Keystone first, then legacy Cloudinary.
 * @param {unknown} study
 * @returns {string}
 */
export function getStudyImageUrl(study) {
  const row = study?.image;
  if (!row) return "";
  const keystone = row.keystoneImage?.url;
  if (typeof keystone === "string" && keystone.trim()) return keystone.trim();
  const legacy = row.image?.publicUrlTransformed;
  if (typeof legacy === "string" && legacy.trim()) return legacy.trim();
  return "";
}
