// Read and change the DOE retention switches (schemas/RetentionSetting.ts).
// canRunRetention only, like running the job itself.

const KEY = "default";

export async function getRetentionSettings(prisma: any) {
  const row = await prisma.retentionSetting.findUnique({ where: { key: KEY } });
  return {
    autoDeidentify: !!row?.autoDeidentify,
    updatedAt: row?.updatedAt || null,
    updatedBy: row?.updatedBy || null,
  };
}

export function canRunRetention(context: any): boolean {
  return (context.session?.data?.permissions || []).some(
    (p: any) => p?.canRunRetention
  );
}

export async function retentionSettings(root: any, args: any, context: any) {
  if (!canRunRetention(context)) {
    throw new Error("Forbidden: canRunRetention required.");
  }
  return getRetentionSettings(context.prisma);
}

export async function setAutoDeidentify(
  root: any,
  { enabled }: { enabled: boolean },
  context: any
) {
  if (!canRunRetention(context)) {
    throw new Error("Forbidden: canRunRetention required.");
  }
  const data = {
    autoDeidentify: !!enabled,
    updatedAt: new Date(),
    updatedBy: context.session?.data?.username || null,
  };
  await context.prisma.retentionSetting.upsert({
    where: { key: KEY },
    create: { key: KEY, ...data },
    update: data,
  });
  console.log(`[retentionSettings] autoDeidentify set to ${!!enabled}`);
  return getRetentionSettings(context.prisma);
}
