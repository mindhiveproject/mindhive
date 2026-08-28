import {
  DEFAULT_CURRICULUM_TYPE,
  normalizeCurriculumType,
  normalizeCurriculumTypes,
} from "./curriculumTypes";

export function mergeBoardSettings(existingSettings, patch) {
  const base =
    existingSettings && typeof existingSettings === "object"
      ? existingSettings
      : {};
  return { ...base, ...patch };
}

function getClassContext(classContext) {
  if (!classContext) return null;
  if (classContext.settings) return classContext;
  return classContext.usedInClass || null;
}

export function getBoardSetting(board, classContext, key, defaultValue) {
  const boardSettings =
    board?.settings && typeof board.settings === "object" ? board.settings : {};

  if (key in boardSettings && boardSettings[key] !== undefined) {
    return boardSettings[key];
  }

  const classSettings = getClassContext(classContext)?.settings;
  if (
    classSettings
    && typeof classSettings === "object"
    && key in classSettings
    && classSettings[key] !== undefined
  ) {
    return classSettings[key];
  }

  return defaultValue;
}

export function getBoardCurriculumType(board, classContext) {
  const raw = getBoardSetting(
    board,
    classContext,
    "curriculumType",
    DEFAULT_CURRICULUM_TYPE
  );
  if (Array.isArray(raw)) {
    return normalizeCurriculumTypes(raw)[0];
  }
  return normalizeCurriculumType(raw);
}

export function getBoardAssignableToStudents(board, classContext) {
  return getBoardSetting(board, classContext, "assignableToStudents", false) === true;
}

export function getBoardStudentsCanAssignToCards(board, classContext) {
  return (
    getBoardSetting(board, classContext, "studentsCanAssignToCards", false) === true
  );
}
