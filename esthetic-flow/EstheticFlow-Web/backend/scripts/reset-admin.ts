import bcrypt from "bcryptjs";

import { prisma } from "../src/lib/prisma";

const email =
  "admin@estheticflow.local";

const password = "admin123";

async function main() {

  const hash = await bcrypt.hash(
    password,
    10
  );

  const user =
    await prisma.user.update({
      where: { email },
      data: {
        passwordHash: hash,
        role: "admin",
      },
    });

  console.log(
    `Admin resetado: ${user.email} / ${password}`
  );
}

main()
  .catch(console.error)
  .finally(() =>
    prisma.$disconnect()
  );
