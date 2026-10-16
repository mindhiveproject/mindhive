// Add/simulationModeCopy.js
import useTranslation from "next-translate/useTranslation";

const PREFIX = "dataJournal.datasetForm.simulated";

/** Translated labels for the simulation modes, their parameters and validation errors. */
export function useSimulationModeCopy() {
  const { t } = useTranslation("builder");
  return {
    modes: {
      normal: {
        label: t(`${PREFIX}.modes.normal.label`, {}, { default: "Normal distribution" }),
        shortLabel: t(`${PREFIX}.modes.normal.shortLabel`, {}, { default: "Normal" }),
        description: t(`${PREFIX}.modes.normal.description`, {}, {
          default:
            "Values cluster around the mean; about 68% fall within one standard deviation. Draws outside the minimum and maximum are redrawn.",
        }),
      },
      uniform: {
        label: t(`${PREFIX}.modes.uniform.label`, {}, { default: "Uniform" }),
        shortLabel: t(`${PREFIX}.modes.uniform.shortLabel`, {}, { default: "Uniform" }),
        description: t(`${PREFIX}.modes.uniform.description`, {}, {
          default: "Every decimal value between the minimum and maximum is equally likely.",
        }),
      },
      integer: {
        label: t(`${PREFIX}.modes.integer.label`, {}, {
          default: "Integer range (Likert, counts)",
        }),
        shortLabel: t(`${PREFIX}.modes.integer.shortLabel`, {}, {
          default: "Integer range",
        }),
        description: t(`${PREFIX}.modes.integer.description`, {}, {
          default:
            "Whole numbers between the minimum and maximum, each equally likely — e.g. a 1–7 Likert item.",
        }),
      },
    },
    params: {
      mean: t(`${PREFIX}.params.mean`, {}, { default: "Mean (μ)" }),
      sd: t(`${PREFIX}.params.sd`, {}, { default: "SD (σ)" }),
      min: t(`${PREFIX}.params.min`, {}, { default: "Minimum" }),
      max: t(`${PREFIX}.params.max`, {}, { default: "Maximum" }),
    },
    errors: {
      notNumber: t(`${PREFIX}.errors.notNumber`, {}, {
        default: "Every value must be a number.",
      }),
      negativeSd: t(`${PREFIX}.errors.negativeSd`, {}, {
        default: "The standard deviation cannot be negative.",
      }),
      maxBelowMin: t(`${PREFIX}.errors.maxBelowMin`, {}, {
        default: "The maximum must be greater than or equal to the minimum.",
      }),
      meanOutsideRange: t(`${PREFIX}.errors.meanOutsideRange`, {}, {
        default: "The mean must be between the minimum and the maximum.",
      }),
      noIntegerInRange: t(`${PREFIX}.errors.noIntegerInRange`, {}, {
        default: "There is no whole number between the minimum and the maximum.",
      }),
    },
  };
}
