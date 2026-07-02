import { syncClassTemplateBoards as syncClassTemplateBoardsUtil } from "./utils/classTemplateBoards";

async function syncClassTemplateBoards(
  _root: unknown,
  { classId }: { classId: string },
  context: any
) {
  const sesh = context.session;
  if (!sesh.itemId) {
    throw new Error("You must be logged in to do this!");
  }

  await syncClassTemplateBoardsUtil(context, classId);

  return context.query.Class.findOne({
    where: { id: classId },
    query: "id",
  });
}

export default syncClassTemplateBoards;
