import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";
import { pathToFileURL } from "node:url";
import { db, usersTable, organizationsTable, professionalsTable } from "@workspace/db";

export async function seedUsers(): Promise<void> {
  const existing = await db.select().from(usersTable);
  if (existing.length > 0) {
    process.stdout.write("Users already seeded, skipping.\n");
    return;
  }

  const [org] = await db
    .select()
    .from(organizationsTable)
    .where(eq(organizationsTable.name, "Globant"));
  if (!org) {
    throw new Error("Organization 'Globant' not found. Run the main seed first.");
  }

  const [professional] = await db
    .select()
    .from(professionalsTable)
    .where(eq(professionalsTable.id, 1));
  if (!professional) {
    throw new Error("Professional with id 1 not found. Run the main seed first.");
  }

  const users = [
    {
      email: "admin@sember.com",
      password: "Admin123!",
      role: "admin",
      name: "Administrador SEMBER",
      professionalId: null,
      organizationId: null,
    },
    {
      email: "empresa@sember.com",
      password: "Empresa123!",
      role: "empresa",
      name: org.name,
      professionalId: null,
      organizationId: org.id,
    },
    {
      email: "postulante@sember.com",
      password: "Postulante123!",
      role: "postulante",
      name: professional.name,
      professionalId: professional.id,
      organizationId: null,
    },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    await db.insert(usersTable).values({
      email: u.email,
      passwordHash,
      role: u.role,
      name: u.name,
      professionalId: u.professionalId,
      organizationId: u.organizationId,
    });
    process.stdout.write(`Created user ${u.email} (${u.role})\n`);
  }
}

const isDirectRun =
  process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;

if (isDirectRun) {
  seedUsers()
    .then(() => {
      process.stdout.write("User seed complete.\n");
      process.exit(0);
    })
    .catch((err) => {
      process.stderr.write(`User seed failed: ${String(err)}\n`);
      process.exit(1);
    });
}
