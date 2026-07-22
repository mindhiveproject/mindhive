// Review FormDefinition seeds — one form per (stage × curriculum) tuple.
export {
  buildReviewFormSeed,
  reviewFormKey,
  reviewI18nKey,
  type FormSeed,
  type ReviewCurriculum,
  type ReviewFormKind,
} from "./buildReviewFormSeed";

export { MINDHIVE_REVIEW_FORM_SEEDS } from "./mindhive";
export { YOUQUANTIFIED_REVIEW_FORM_SEEDS } from "./youquantified";
export { NYU_CUSP_REVIEW_FORM_SEEDS } from "./nyu_cusp";

import { MINDHIVE_REVIEW_FORM_SEEDS } from "./mindhive";
import { YOUQUANTIFIED_REVIEW_FORM_SEEDS } from "./youquantified";
import { NYU_CUSP_REVIEW_FORM_SEEDS } from "./nyu_cusp";

export const ALL_REVIEW_FORM_SEEDS = [
  ...MINDHIVE_REVIEW_FORM_SEEDS,
  ...YOUQUANTIFIED_REVIEW_FORM_SEEDS,
  ...NYU_CUSP_REVIEW_FORM_SEEDS,
];
