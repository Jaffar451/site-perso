// scripts/create-admin.ts
import bcrypt from "bcryptjs";
import { sequelize } from "../config/database";
import User from "../models/user.model";

async function main() {
  await sequelize.authenticate();
  console.log("✅ Connecté à la base de données...");

  const hash = await bcrypt.hash("password123", 10);

  const admin = await User.create({
    firstname: "Moussa",
    lastname: "Administrateur",
    email: "admin@justice.ne",
    password: hash,
    role: "admin",
    organization: "ADMIN",
    matricule: "ADM-001",
    isActive: true,
    status: "active",
  } as any);

  console.log("✅ Admin recréé avec succès !");
  console.log("   Email    : admin@justice.ne");
  console.log("   Password : password123");
  console.log("   ID       :", admin.id);
  process.exit(0);
}

main().catch(e => {
  console.error("❌ Erreur :", e);
  process.exit(1);
});