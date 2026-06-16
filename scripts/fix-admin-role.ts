import { sequelize } from "../src/config/database";
import User from "../src/models/user.model";

async function main() {
  await sequelize.authenticate();
  const [updated] = await User.update(
    { role: "admin", status: "active", isActive: true },
    { where: { email: "admin@justice.ne" } }
  );
  console.log("Role corrige :", updated, "ligne(s) mise(s) a jour");
  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
