import {
  Table,
  Column,
  Model,
  DataType,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import Custody from "./custody.model";
import User from "./user.model";
import Person from "./person.model";

@Table({ tableName: "CustodyExtensions", timestamps: true, underscored: true })
export default class CustodyExtension extends Model {
  // ─── Relation avec la Garde à Vue initiale ─────────────────────
  @ForeignKey(() => Custody)
  @Column({ type: DataType.INTEGER, allowNull: false })
  custodyId!: number;

  @BelongsTo(() => Custody)
  custody!: Custody;

  // ─── Relation avec le Suspect ──────────────────────────────────
  @ForeignKey(() => Person)
  @Column({ type: DataType.INTEGER, allowNull: false })
  suspectId!: number;

  @BelongsTo(() => Person)
  suspect!: Person;

  // ─── Relation avec l'Officier qui demande ──────────────────────
  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  requestedBy!: number;

  @BelongsTo(() => User)
  requester!: User;

  // ─── Détails de la prolongation ────────────────────────────────
  @Column({ type: DataType.TEXT, allowNull: false })
  reason!: string;

  @Column({ type: DataType.DATE, allowNull: false })
  newEndDate!: Date;

  @Column({
    type: DataType.ENUM("en_attente", "accordée", "refusée"),
    defaultValue: "en_attente",
  })
  decisionStatus!: string;

  @CreatedAt createdAt!: Date;
  @UpdatedAt updatedAt!: Date;
}