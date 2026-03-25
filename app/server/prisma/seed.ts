import prisma from "../lib/prisma.js";
import { AppPermission } from "@prisma/client";
import bcrypt from "bcryptjs";
import "dotenv/config";

const IS_DEV = process.env.NODE_ENV !== "production";
const FORCE_SEED = process.env.FORCE_SEED === "true";

async function isFirstStartup() {
  try {
    const userCount = await prisma.user.count();
    return userCount === 0;
  } catch (error) {
    return true;
  }
}

async function seedDefaultRoles() {
  const defaultRoles = [
    {
      name: "Admin",
      permissions: ["MANAGE_USERS", "MANAGE_EXAMS"] as AppPermission[],
    },
    {
      name: "User",
      permissions: [] as AppPermission[],
    },
  ];

  for (const role of defaultRoles) {
    const existingRole = await prisma.role.findUnique({
      where: { name: role.name },
    });

    if (!existingRole) {
      await prisma.role.create({ data: role });
      console.log(`✅ Role created: ${role.name}`);
    } else {
      await prisma.role.update({
        where: { name: role.name },
        data: { permissions: role.permissions },
      });
    }
  }
}

async function seedAdminUser() {
  const existingAdmin = await prisma.user.findUnique({
    where: { username: "admin" },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash("admin", 10);

    const admin = await prisma.user.create({
      data: {
        username: "admin",
        password: hashedPassword,
      },
    });

    const adminRole = await prisma.role.findUnique({
      where: { name: "Admin" },
    });

    if (adminRole) {
      await prisma.userRole.create({
        data: {
          userId: admin.id,
          roleId: adminRole.id,
        },
      });
    }

    console.log("✅ Admin user created:", admin.username);
  } else {
    console.log("ℹ️  Admin user already exists");
  }
}

async function main() {
  const firstStartup = await isFirstStartup();

  console.log("🌱 Starting database seed...");
  console.log(`📊 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔄 First startup detected: ${firstStartup}`);
  console.log(`⚙️  Force seed: ${FORCE_SEED}`);

  if (firstStartup || (IS_DEV && FORCE_SEED)) {
    console.log("▶️  Applying seed configuration...\n");

    await seedDefaultRoles();
    await seedAdminUser();
    await seedMajor();
    await seedLevel();
    await seedParcours();
    await seedExamType();
    await seedCourse();

    console.log("\n✨ Seed completed successfully!");
  } else {
    console.log(
      "⏭️  Skipping seed - database already initialized (use FORCE_SEED=true in dev)",
    );
  }
}

main()
  .catch((e) => {
    console.error("❌ Error during seed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

async function seedMajor() {
  const defaultMajor = [{ name: "Mathématiques" }, { name: "Informatique" }];

  for (const major of defaultMajor) {
    const exist = await prisma.major.findUnique({
      where: { name: major.name },
    });
    if (!exist) {
      await prisma.major.create({ data: major });
    }
  }
  console.log("✅ Majors seeded");
}

async function seedLevel() {
  const defaultLevel = [
    { name: "L1" },
    { name: "L2" },
    { name: "L3" },
    { name: "M1" },
    { name: "M2" },
  ];

  // Les niveaux sont maintenant uniques et globaux, on ne boucle plus sur les majors.
  for (const level of defaultLevel) {
    const exist = await prisma.level.findUnique({
      where: { name: level.name },
    });
    if (!exist) {
      await prisma.level.create({ data: level });
    }
  }
  console.log("✅ Levels seeded");
}

async function seedParcours() {
  const infoMajor = await prisma.major.findUnique({
    where: { name: "Informatique" },
  });
  const mathsMajor = await prisma.major.findUnique({
    where: { name: "Mathématiques" },
  });

  if (infoMajor) {
    // Parcours : Informatique
    await prisma.parcours.upsert({
      where: { name: "Informatique" },
      update: {},
      create: {
        name: "Informatique",
        majors: { connect: [{ id: infoMajor.id }] },
      },
    });
  }

  if (infoMajor && mathsMajor) {
    // Parcours : Science des Données (lié à l'Info et aux Maths)
    await prisma.parcours.upsert({
      where: { name: "Science des Données" },
      update: {},
      create: {
        name: "Science des Données",
        majors: {
          connect: [{ id: infoMajor.id }, { id: mathsMajor.id }],
        },
      },
    });
  }

  console.log("✅ Parcours seeded");
}

async function seedExamType() {
  const defaultType = [
    { name: "CC1" },
    { name: "CC2" },
    { name: "CC3" },
    { name: "CCTP" },
    { name: "SC" },
    { name: "Examen" },
  ];

  for (const examType of defaultType) {
    const exist = await prisma.examType.findUnique({
      where: { name: examType.name },
    });
    if (!exist) {
      await prisma.examType.create({ data: examType });
    }
  }
  console.log("✅ ExamTypes seeded");
}

async function seedCourse() {
  // Récupération dynamique des identifiants (au lieu de coder "9" en dur)
  const levelL3 = await prisma.level.findUnique({ where: { name: "L3" } });
  const parcoursInfo = await prisma.parcours.findUnique({
    where: { name: "Informatique" },
  });
  const parcoursData = await prisma.parcours.findUnique({
    where: { name: "Science des Données" },
  });

  if (levelL3 && parcoursInfo && parcoursData) {
    // On vérifie si le cours existe déjà pour ce niveau spécifique
    const exist = await prisma.course.findFirst({
      where: {
        name: "POO2",
        levelId: levelL3.id,
      },
    });

    if (!exist) {
      await prisma.course.create({
        data: {
          name: "POO2",
          semestre: 5, // C'est un entier selon ton schéma ! (5 pour S5)
          levelId: levelL3.id,
          // Relation N:M - Le cours appartient aux DEUX parcours
          parcours: {
            connect: [{ id: parcoursInfo.id }, { id: parcoursData.id }],
          },
          // Relation N:M - Le cours possède deux types d'examens
          examTypes: {
            connect: [{ name: "CC1" }, { name: "CC2" }],
          },
        },
      });
    }
  }

  console.log("✅ Courses seeded");
}
