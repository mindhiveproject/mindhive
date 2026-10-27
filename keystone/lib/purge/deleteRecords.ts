// Deletes records by list and id, with what hangs off them. Lists that store
// files are deleted through Keystone (sudo), whose file fields remove the
// stored file with the record; everything else goes through Prisma.

import cloudinary from "cloudinary";

import { accessor } from "./profileRelations";

/** Lists with a Keystone file or image field. */
const FILE_LISTS = new Set([
  "ProfileImage",
  "StudyImage",
  "MediaAsset",
  "Visual",
  "DataSourceBlock",
  "JsPsychExperiment",
  "Ticket",
  "TicketAnnotation",
  "Opportunity",
  "Organization",
]);

const CHUNK = 1000;

function chunks(ids: string[]): string[][] {
  const out: string[][] = [];
  for (let i = 0; i < ids.length; i += CHUNK) out.push(ids.slice(i, i + CHUNK));
  return out;
}

let cloudinaryConfigured = false;

/** Removes legacy Cloudinary images; Keystone's Cloudinary field never does. */
export async function destroyCloudinaryImages(publicIds: string[]) {
  const ids = publicIds.filter(Boolean);
  if (!ids.length || !process.env.CLOUDINARY_CLOUD_NAME) return 0;
  if (!cloudinaryConfigured) {
    cloudinary.v2.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_KEY,
      api_secret: process.env.CLOUDINARY_SECRET,
    });
    cloudinaryConfigured = true;
  }
  for (const id of ids) await cloudinary.v2.uploader.destroy(id);
  return ids.length;
}

/** The Cloudinary public id inside a legacy image column, if any. */
export function cloudinaryIdOf(value: unknown): string | null {
  const parsed = typeof value === "string" ? safeParse(value) : value;
  const id = (parsed as { id?: unknown } | null)?.id;
  return typeof id === "string" ? id : null;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** Deletes records of one list; returns how many existed. */
export async function deleteRecords(
  context: any,
  listKey: string,
  ids: string[],
  dryRun: boolean
): Promise<number> {
  const prisma = context.prisma;
  const requested = [...new Set(ids.filter(Boolean))];
  const unique: string[] = [];
  for (const part of chunks(requested)) {
    const rows = await prisma[accessor(listKey)].findMany({
      where: { id: { in: part } },
      select: { id: true },
    });
    unique.push(...rows.map((r: any) => r.id));
  }
  if (!unique.length || dryRun) return unique.length;

  for (const part of chunks(unique)) {
    if (listKey === "ProposalBoard") {
      // a board's sections and cards go with it (as in deleteProposal)
      const sections = await prisma.proposalSection.findMany({
        where: { boardId: { in: part } },
        select: { id: true },
      });
      const sectionIds = sections.map((s: any) => s.id);
      if (sectionIds.length) {
        await prisma.proposalCard.deleteMany({
          where: { sectionId: { in: sectionIds } },
        });
        await prisma.proposalSection.deleteMany({
          where: { id: { in: sectionIds } },
        });
      }
    }
    if (listKey === "Study") {
      // a study's versions, data-source links and cover image go with it
      const studies = await prisma.study.findMany({
        where: { id: { in: part } },
        select: { imageId: true },
      });
      await prisma.studyVersion.deleteMany({ where: { studyId: { in: part } } });
      await prisma.studyDataSource.deleteMany({ where: { studyId: { in: part } } });
      await deleteRecords(
        context,
        "StudyImage",
        studies.map((s: any) => s.imageId),
        false
      );
    }
    if (listKey === "ProfileImage" || listKey === "StudyImage") {
      const images = await prisma[accessor(listKey)].findMany({
        where: { id: { in: part } },
        select: { image: true },
      });
      await destroyCloudinaryImages(
        images.map((i: any) => cloudinaryIdOf(i.image)).filter(Boolean)
      );
    }
    if (FILE_LISTS.has(listKey)) {
      await context
        .sudo()
        .db[listKey].deleteMany({ where: part.map((id) => ({ id })) });
    } else {
      await prisma[accessor(listKey)].deleteMany({ where: { id: { in: part } } });
    }
  }
  return unique.length;
}
