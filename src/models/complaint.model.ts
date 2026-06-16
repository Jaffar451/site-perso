import {
  Table,
  Column,
  Model,
  DataType,
  BelongsTo,
  ForeignKey,
  HasOne,
  HasMany,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import User from "./user.model";
import PoliceStation from "./policeStation.model";
import CaseModel from "./case.model";
import ComplaintFile from "./complaintFile.model";
import OffenseCategory from "./offenseCategory.model";
import Attachment from "./attachment.model";

export type ComplaintStatus =
  | "soumise"
  | "en_cours_OPJ"
  | "attente_validation"
  | "transmise_parquet"
  | "classée_sans_suite_par_OPJ"
  | "classée_sans_suite_par_procureur"
  | "saisi_juge"
  | "instruction"
  | "audience_programmée"
  | "jugée"
  | "non_lieu"
  | "figée";

@Table({ tableName: "Complaints", timestamps: true, underscored: true })
export default class Complaint extends Model {
  @Column({ type: DataType.STRING, defaultValue: "Plainte sans titre" })
  title!: string;

  @Column({ type: DataType.TEXT, allowNull: false })
  description!: string;

  @Column({ type: DataType.STRING, defaultValue: "general" })
  category!: string;

  @Column({
    type: DataType.ENUM(
      "soumise",
      "en_cours_OPJ",
      "attente_validation",
      "transmise_parquet",
      "classée_sans_suite_par_OPJ",
      "classée_sans_suite_par_procureur",
      "saisi_juge",
      "instruction",
      "audience_programmée",
      "jugée",
      "non_lieu",
      "figée",
    ),
    defaultValue: "soumise",
  })
  status!: ComplaintStatus;

  // ✅ Synthèse OPJ — rédigée par l'OPJ, affichée au Commissaire
  @Column({ type: DataType.TEXT, allowNull: true })
  pvDetails?: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  filedAt!: Date;

  @Column({ type: DataType.STRING, allowNull: true })
  location?: string;

  @Column({ type: DataType.DECIMAL(10, 8), allowNull: true })
  latitude?: number;

  @Column({ type: DataType.DECIMAL(11, 8), allowNull: true })
  longitude?: number;

  @Column({ type: DataType.BOOLEAN, defaultValue: false })
  validatedByCommissaire!: boolean;

  @Column({ type: DataType.STRING, allowNull: true })
  caseNumber?: string;

  @Column({ type: DataType.STRING, unique: true })
  trackingCode!: string;

  @Column({ type: DataType.UUID, defaultValue: DataType.UUIDV4, unique: true })
  verification_token!: string;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false, field: "citizen_id" })
  citizenId!: number;

  @BelongsTo(() => User, { as: "complainant", foreignKey: "citizenId" })
  complainant!: User;

  @ForeignKey(() => PoliceStation)
  @Column({ type: DataType.INTEGER, allowNull: true, field: "police_station_id" })
  policeStationId?: number;

  @BelongsTo(() => PoliceStation, { as: "originStation", foreignKey: "policeStationId" })
  originStation?: PoliceStation;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true, field: "assigned_opj_id" })
  assignedOpjId?: number;

  @BelongsTo(() => User, { as: "assignedOPJ", foreignKey: "assignedOpjId" })
  assignedOPJ?: User;

  @ForeignKey(() => OffenseCategory)
  @Column({ type: DataType.INTEGER, allowNull: true, field: "offense_category_id" })
  offenseCategoryId?: number;

  @BelongsTo(() => OffenseCategory, { as: "offenseCategory", foreignKey: "offenseCategoryId" })
  offenseCategory?: OffenseCategory;

  @HasOne(() => CaseModel, { as: "judicialCase" })
  judicialCase?: CaseModel;

  @HasMany(() => ComplaintFile, { as: "attachedFiles" })
  attachedFiles!: ComplaintFile[];

  @HasMany(() => Attachment, { as: "attachments" })
  attachments!: Attachment[];

  @CreatedAt createdAt!: Date;
  @UpdatedAt updatedAt!: Date;
}