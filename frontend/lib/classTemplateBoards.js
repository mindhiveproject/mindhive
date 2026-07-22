export const DEFAULT_TEMPLATE_BOARD_SETTINGS = {
  visibleToStudentInClassIds: [],
};

export function getClassTemplateBoards(myclass) {
  const fromMany = myclass?.classTemplateBoards ?? [];
  const primary = myclass?.templateProposal;
  const merged = [...fromMany];

  if (primary?.id && !merged.some((board) => board.id === primary.id)) {
    merged.unshift(primary);
  }

  return merged;
}

export function getPrimaryTemplateBoardId(myclass) {
  return (
    myclass?.templateProposal?.id
    ?? myclass?.classTemplateBoards?.[0]?.id
    ?? null
  );
}

export function mergeTemplateBoardSettings(settings) {
  return {
    ...DEFAULT_TEMPLATE_BOARD_SETTINGS,
    ...(settings && typeof settings === "object" ? settings : {}),
  };
}

export function classHasExplicitTemplateVisibility(myclass) {
  const boards = getClassTemplateBoards(myclass);
  return boards.some((board) => {
    const settings = board?.settings;
    return (
      settings
      && typeof settings === "object"
      && "visibleToStudentInClassIds" in settings
    );
  });
}

export function isTemplateVisibleToStudents(board, classId, myclass) {
  if (!board?.id || !classId) return false;

  const settings = board?.settings;
  const hasOwnVisibility =
    settings
    && typeof settings === "object"
    && "visibleToStudentInClassIds" in settings;

  if (hasOwnVisibility) {
    const ids = settings.visibleToStudentInClassIds;
    return Array.isArray(ids) && ids.includes(classId);
  }

  if (!classHasExplicitTemplateVisibility(myclass)) {
    const boards = getClassTemplateBoards(myclass);
    return boards.some((b) => b.id === board.id);
  }

  return false;
}

export function getVisibleTemplateBoards(myclass) {
  const classId = myclass?.id;
  if (!classId) return [];
  const boards = getClassTemplateBoards(myclass);
  return boards.filter((board) =>
    isTemplateVisibleToStudents(board, classId, myclass)
  );
}

export function getTemplateOptionKey(board, myclass) {
  return `${myclass?.id}:${board?.id}`;
}

export function getVisibleTemplateOptionsForClasses(classes) {
  if (!Array.isArray(classes)) return [];
  const seen = new Set();
  const options = [];

  for (const myclass of classes) {
    if (!myclass?.id) continue;
    const boards = getVisibleTemplateBoards(myclass);
    for (const board of boards) {
      const key = getTemplateOptionKey(board, myclass);
      if (seen.has(key)) continue;
      seen.add(key);
      options.push({ board, class: myclass });
    }
  }

  return options;
}

export function setTemplateVisibilityForClass(settings, classId, visible) {
  const merged = mergeTemplateBoardSettings(settings);
  const ids = [...(merged.visibleToStudentInClassIds || [])];
  const index = ids.indexOf(classId);

  if (visible && index === -1) {
    ids.push(classId);
  } else if (!visible && index !== -1) {
    ids.splice(index, 1);
  }

  return { ...merged, visibleToStudentInClassIds: ids };
}
