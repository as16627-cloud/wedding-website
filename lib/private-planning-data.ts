import { type Prisma } from "@/app/generated/prisma/client";
import prisma from "@/lib/prisma";

export const PRIVATE_PLANNING_DATA_ID = "sumaya-adi-private-planning";
export const MAX_PRIVATE_PLANNING_PAYLOAD_BYTES = 750_000;

export type PrivatePlanningDataPayload = Prisma.InputJsonObject & {
  vendors?: unknown;
};

export async function readPrivatePlanningDataPayload() {
  const record = await prisma.privatePlanningData.findUnique({
    where: { id: PRIVATE_PLANNING_DATA_ID },
  });

  return {
    record,
    payload:
      record?.payload && typeof record.payload === "object" && !Array.isArray(record.payload)
        ? (record.payload as PrivatePlanningDataPayload)
        : ({} as PrivatePlanningDataPayload),
  };
}

export async function savePrivatePlanningDataPayload(payload: Prisma.InputJsonObject) {
  return prisma.privatePlanningData.upsert({
    where: { id: PRIVATE_PLANNING_DATA_ID },
    create: {
      id: PRIVATE_PLANNING_DATA_ID,
      payload,
    },
    update: {
      payload,
    },
  });
}
