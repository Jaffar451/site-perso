import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
  HasMany,
} from "sequelize-typescript";
import CaseModel from "./case.model";
import Court from "./court.model";
import User from "./user.model";
import Sentence from "./sentence.model";

export type DecisionType =
  | "judgment_first_instance"
  | "judgment_appeal"
  | "order_instruction"
  | "order_provisional"
  | "other";

@Table({ tableName: "Decisions", timestamps: true, underscored: true })
export default class Decision extends Model {
  @ForeignKey(() => CaseModel)
  @Column({ type: DataType.INTEGER, allowNull: false })
  caseId!: number;

  @BelongsTo(() => CaseModel, { as: "case" })
  case!: CaseModel;

  @ForeignKey(() => Court)
  @Column({ type: DataType.INTEGER, allowNull: false })
  courtId!: number;

  @BelongsTo(() => Court, { as: "court" })
  court!: Court;

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: true })
  judgeId?: number;

  @BelongsTo(() => User, { as: "judge" })
  judge?: User;

  @Column({
    type: DataType.ENUM(
      "judgment_first_instance",
      "judgment_appeal",
      "order_instruction",
      "order_provisional",
      "other",
    ),
    defaultValue: "judgment_first_instance",
  })
  type!: DecisionType;

  @Column({ type: DataType.TEXT, allowNull: false })
  verdict!: string;

  @Column({ type: DataType.TEXT, allowNull: true })
  legalBasis?: string;

  @Column({ type: DataType.DATE, defaultValue: DataType.NOW })
  date!: Date;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  decisionNumber!: string;

  @Column({
    type: DataType.ENUM("draft", "issued", "signed", "revoked"),
    defaultValue: "draft",
  })
  status!: string;

  @Column({ type: DataType.DATE, allowNull: true })
  signedAt?: Date;

  @HasMany(() => Sentence, { as: "sentences" })
  sentences!: Sentence[];

  @CreatedAt createdAt!: Date;
  @UpdatedAt updatedAt!: Date;
}
