export function getSponsorOnboardingDismissKey(userId) {
  return `sponsor-onboarding-dismissed-${userId}`;
}

export function isSponsorOnboardingDismissed(userId) {
  if (!userId || typeof window === "undefined") return false;
  try {
    return window.localStorage.getItem(getSponsorOnboardingDismissKey(userId)) === "true";
  } catch {
    return false;
  }
}

export function setSponsorOnboardingDismissed(userId, dismissed) {
  if (!userId || typeof window === "undefined") return;
  try {
    const key = getSponsorOnboardingDismissKey(userId);
    if (dismissed) {
      window.localStorage.setItem(key, "true");
    } else {
      window.localStorage.removeItem(key);
    }
  } catch {
    // ignore storage errors
  }
}
