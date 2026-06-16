import bcrypt from "bcryptjs";
import { sequelize } from "../src/config/database";
import User from "../src/models/user.model";

async function main() {
  await sequelize.authenticate();
  console.log("Connecte a la base de donnees...");

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

  console.log("Admin recree !");
  console.log("   Email    : admin@justice.ne");
  console.log("   Password : password123");
  console.log("   ID       :", admin.id);
  process.exit(0);
}

main().catch(e => {
  console.error("Erreur :", e);
  process.exit(1);
});
