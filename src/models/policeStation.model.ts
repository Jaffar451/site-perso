import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
} from "sequelize-typescript";
import User from "./user.model";
import Complaint from "./complaint.model";
import SosAlert from "./sosAlert.model";

@Table({ 
  tableName: "police_stations", 
  timestamps: true, // Active createdAt et updatedAt automatiquement
  underscored: true // Indique à Sequelize d'utiliser le format snake_case (created_at, updated_at)
})
export default class PoliceStation extends Model {
  @Column({ 
    type: DataType.INTEGER, 
    primaryKey: true, 
    autoIncrement: true 
  })
  id!: number;

  @Column({ 
    type: DataType.STRING, 
    allowNull: false 
  })
  name!: string;

  // Puisque votre BDD utilise un type ENUM spécifique, 
  // on utilise DataType.ENUM pour garantir la validation.
  @Column({
    type: DataType.ENUM("POLICE", "GENDARMERIE"), // Remplacez par vos valeurs exactes si besoin
    defaultValue: "POLICE",
  })
  type!: string;

  @Column({ 
    type: DataType.STRING, 
    defaultValue: "Niamey" 
  })
  city!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  district?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  address?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  phone?: string;

  // --- RELATIONS ---
  // Le foreignKey doit correspondre au nom de la colonne dans les tables cibles (ex: users)
  @HasMany(() => User, { foreignKey: "police_station_id" })
  agents!: User[];

  @HasMany(() => Complaint, { foreignKey: "police_station_id" })
  receivedComplaints!: Complaint[];

  @HasMany(() => SosAlert, { foreignKey: "police_station_id" })
  receivedAlerts!: SosAlert[];
}