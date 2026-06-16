import bcrypt from "bcryptjs";
import { sequelize } from "../src/config/database";
import User from "../src/models/user.model";

async function main() {
  await sequelize.authenticate();
  const hash = await bcrypt.hash("password123", 10);
  const [updated] = await User.update(
    { password: hash, status: "active", isActive: true },
    { where: { email: "admin@justice.ne" } }
  );
  console.log("Lignes mises a jour :", updated);
  console.log("Mot de passe reinitialise pour admin@justice.ne");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
