import { prisma } from "../../lib/prisma";

export async function assertUserIsActive(
  userId: string
) {

  const user =
    await prisma.user.findUnique({
      where: { id: userId },
      select: {
        active: true,
        approved: true,
      },
    });

  if (!user?.approved) {
    throw new Error(
      "PENDING_APPROVAL"
    );
  }

  if (!user?.active) {
    throw new Error(
      "USER_INACTIVE"
    );
  }
}
