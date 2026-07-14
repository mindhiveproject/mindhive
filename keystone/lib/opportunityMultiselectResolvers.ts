import { normalizeMultiselectValue } from "./normalizeMultiselect";

export const opportunityMultiselectResolvers = {
  preferGradeLevels(source: Record<string, unknown>) {
    return normalizeMultiselectValue(source.preferGradeLevels);
  },
  preferClassType(source: Record<string, unknown>) {
    return normalizeMultiselectValue(source.preferClassType);
  },
};
