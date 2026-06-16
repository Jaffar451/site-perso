import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  HasMany,
  PrimaryKey,
  AutoIncrement,
  AllowNull,
  Default,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import Court from "./court.model";
import Complaint from "./complaint.model";
import User from "./user.model";
import Hearing from "./hearing.model";
import Decision from "./decision.model";

// ✅ AJOUT : L'énumération CaseStage exportée (pour TS2614)
export enum CaseStage {
  PROSECUTION = "PROSECUTION",
  INVESTIGATION = "INVESTIGATION",
  TRIAL = "TRIAL",
  CLOSED = "CLOSED",
  ARCHIVED = "ARCHIVED"
}

@Table({
  tableName: "Cases",
  timestamps: true,
  underscored: true,
})
export default class CaseModel extends Model {
  @PrimaryKey
  @AutoIncrement
  @Column(DataType.INTEGER)
  declare id: number; // ✅ 'declare' pour éviter TS2612

  @AllowNull(false)
  @Column({ type: DataType.STRING, unique: true })
  caseNumber!: string;

  @Column(DataType.STRING)
  title?: string;

  @Column(DataType.TEXT)
  description?: string;

  // ✅ AJOUT : Propriété 'type' (pour TS2339 dans case.service ligne 85)
  @Column(DataType.STRING)
  type!: string;

  // ✅ CORRECTION : Remplacement/Ajout de 'stage' pour le workflow (Niger e-Justice)
  @Default(CaseStage.PROSECUTION)
  @Column(DataType.ENUM(...Object.values(CaseStage)))
  stage!: CaseStage;

  @Default("pending")
  @Column(DataType.ENUM("pending", "active", "closed", "archived", "suspended"))
  status!: string;

  @Column(DataType.DATE)
  filingDate!: Date;

  // ✅ AJOUT : 'openedAt' (pour TS2339 dans procedural.service ligne 44)
  @Column(DataType.DATE)
  openedAt!: Date;

  // --- CLÉS ÉTRANGÈRES ET RELATIONS ---

  @ForeignKey(() => Court)
  @Column(DataType.INTEGER)
  courtId!: number;

  @BelongsTo(() => Court, { foreignKey: "courtId", as: "court" })
  court!: Court;

  @ForeignKey(() => Complaint)
  @Column(DataType.INTEGER)
  complaintId!: number;

  @BelongsTo(() => Complaint, { foreignKey: "complaintId", as: "complaint" })
  complaint!: Complaint;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  assignedJudgeId?: number;

  @BelongsTo(() => User, { foreignKey: "assignedJudgeId", as: "assignedJudge" })
  assignedJudge?: User;

  @ForeignKey(() => User)
  @Column(DataType.INTEGER)
  assignedProsecutorId?: number;

  @BelongsTo(() => User, { foreignKey: "assignedProsecutorId", as: "assignedProsecutor" })
  assignedProsecutor?: User;

  // --- RELATIONS HAS MANY ---

  @HasMany(() => Hearing, { foreignKey: "caseId", as: "hearings" })
  hearings!: Hearing[];

  @HasMany(() => Decision, { foreignKey: "caseId", as: "decisions" })
  decisions!: Decision[];

  @CreatedAt
  declare createdAt: Date; // ✅ 'declare' pour éviter TS2612

  @UpdatedAt
  declare updatedAt: Date; // ✅ 'declare' pour éviter TS2612
}