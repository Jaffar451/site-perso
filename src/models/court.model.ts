import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
} from "sequelize-typescript";
import User from "./user.model";
import CaseModel from "./case.model";
import Hearing from "./hearing.model";
import Decision from "./decision.model";

@Table({ 
  tableName: "Courts", 
  timestamps: true, 
  underscored: true  // Convertit automatiquement courtId → court_id en BDD
})
export default class Court extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  id!: number;

  @AllowNull(false)
  @Column(DataType.STRING)
  name!: string;

  @Default("Niamey")
  @Column(DataType.STRING)
  city!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  jurisdiction!: string;

  @AllowNull(false)
  @Column(DataType.STRING)
  type!: string;

  @Default("active")
  @Column({
    type: DataType.ENUM("active", "inactive"),
  })
  status!: string;

  // --- RELATIONS ---
  
  // CORRECTION : utiliser courtId (camelCase) pour matcher les propriétés TypeScript
  // dans les modèles enfants. underscored: true gère la conversion en BDD.
  
  @HasMany(() => User, { foreignKey: "courtId", as: "personnelCourt" })
  personnelCourt!: User[];

  @HasMany(() => CaseModel, { foreignKey: "courtId", as: "courtCases" })
  courtCases!: CaseModel[];

  @HasMany(() => Hearing, { foreignKey: "courtId", as: "hearings" })
  hearings!: Hearing[];

  @HasMany(() => Decision, { foreignKey: "courtId", as: "decisions" })
  decisions!: Decision[];
}