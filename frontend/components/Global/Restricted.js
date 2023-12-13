// wrapper to provide restricted access to specific parts of the platform

export default function RestrictedAccess({
  children,
  userCanAccess,
  whatToAccess,
}) {
  // if the user cannot access the content, show empty page
  if (!userCanAccess.includes(whatToAccess)) {
    return <></>;
  }
  return <>{children}</>;
}
