// src/models/custody.model.ts

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
import User from "./user.model";
import Complaint from "./complaint.model";
import Person from "./person.model";

export type CustodyStatus = "en_cours" | "levée" | "prolongée" | "convertie";

@Table({ tableName: "Custodies", timestamps: true, underscored: true })
export default class Custody extends Model {
  // ─── Suspect ───────────────────────────────────────────────────

  @ForeignKey(() => Person)
  @Column({ type: DataType.INTEGER, allowNull: false })
  suspectId!: number;

  @BelongsTo(() => Person, { as: "suspect" })
  suspect!: Person;

  // ─── Garde à vue ───────────────────────────────────────────────

  @Column({ type: DataType.DATE, allowNull: false })
  startedAt!: Date;

  @Column({ type: DataType.DATE, allowNull: true })
  endedAt?: Date;

  @Column({ type: DataType.TEXT, allowNull: false })
  reason!: string;

  @Column({ type: DataType.STRING, allowNull: false })
  location!: string;

  @Column({
    type: DataType.ENUM("en_cours", "levée", "prolongée", "convertie"),
    defaultValue: "en_cours",
  })
  status!: CustodyStatus;

  // ─── Prolongation ──────────────────────────────────────────────

  /**
   * Durée légale maximale en heures.
   * Niger : 48h de base, prolongeable sur autorisation.
   */
  @Column({ type: DataType.INTEGER, defaultValue: 48 })
  maxDurationHours!: number;

  // ─── Responsables ──────────────────────────────────────────────

  @ForeignKey(() => User)
  @Column({ type: DataType.INTEGER, allowNull: false })
  orderedBy!: number;

  @BelongsTo(() => User, { as: "orderedByUser" })
  orderedByUser!: User;

  // ─── Dossier lié ───────────────────────────────────────────────

  @ForeignKey(() => Complaint)
  @Column({ type: DataType.INTEGER, allowNull: true })
  relatedComplaintId?: number;

  @BelongsTo(() => Complaint, { as: "complaint" })
  complaint?: Complaint;

  @CreatedAt createdAt!: Date;
  @UpdatedAt updatedAt!: Date;
}