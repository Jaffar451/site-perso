import {
  Table,
  Column,
  Model,
  DataType,
  HasMany,
  HasOne,
  ForeignKey,
  BelongsTo,
  CreatedAt,
  UpdatedAt,
} from "sequelize-typescript";
import PoliceStation from "./policeStation.model";
import Court from "./court.model";
import Prison from "./prison.model";
import RefreshToken from "./refreshToken.model";
import AuditLog from "./auditLog.model";
import Complaint from "./complaint.model";
import Detainee from "./detainee.model";
import SosAlert from "./sosAlert.model";
import Person from "./person.model";
import ProfessionalProfile from "./professionnalProfile.model";

export enum UserRole {
  ADMIN = "admin",
  PROSECUTOR = "prosecutor",
  JUDGE = "judge",
  CLERK = "greffier",
  COMMISSAIRE = "commissaire",
  OFFICIER_POLICE = "officier_police",
  INSPECTEUR = "inspecteur",
  OPJ_GENDARME = "opj_gendarme",
  GENDARME = "gendarme",
  PRISON_GUARD = "prison_guard",
  PRISON_DIRECTOR = "prison_director",
  CITIZEN = "citizen",
  LAWYER = "lawyer",
}

@Table({ 
  tableName: "users", 
  timestamps: true, 
  underscored: true 
})
export default class User extends Model {
  @Column({ type: DataType.INTEGER, primaryKey: true, autoIncrement: true })
  id!: number;

  @Column({ type: DataType.STRING, allowNull: false, field: "firstname" })
  firstname!: string;

  @Column({ type: DataType.STRING, allowNull: false, field: "lastname" })
  lastname!: string;

  @Column({ type: DataType.STRING, allowNull: false, unique: true })
  email!: string;

  @Column({ type: DataType.STRING, allowNull: true, unique: true })
  matricule?: string;

  @Column({ type: DataType.STRING, allowNull: false })
  password!: string;

  @Column({ type: DataType.STRING, allowNull: true })
  telephone?: string;

  @Column({
    type: DataType.ENUM(...Object.values(UserRole)),
    defaultValue: UserRole.CITIZEN,
  })
  role!: UserRole;

  @Column({ type: DataType.STRING, allowNull: true })
  organization?: string;

  @Column({ type: DataType.STRING, allowNull: true })
  district?: string;

  @Column({ type: DataType.STRING, allowNull: true, field: "push_token" })
  pushToken?: string;

  @Column({ type: DataType.INTEGER, defaultValue: 0, field: "failed_attempts" })
  failedAttempts!: number;

  @Column({ type: DataType.DATE, allowNull: true, field: "lock_until" })
  lockUntil?: Date | null;

  // ─── Relations ──────────────────────────────────────────────

  @HasOne(() => Person, { foreignKey: "userId" })
  personProfile?: Person;

  @HasOne(() => ProfessionalProfile, { foreignKey: "userId" })
  professionalProfile?: ProfessionalProfile;

  // --- Foreign Keys (Mapping explicite requis pour correspondre à la BDD) ---

  @ForeignKey(() => PoliceStation)
  @Column({ type: DataType.INTEGER, allowNull: true, field: "police_station_id" })
  policeStationId?: number;

  @BelongsTo(() => PoliceStation)
  station?: PoliceStation;

  @ForeignKey(() => Court)
  @Column({ type: DataType.INTEGER, allowNull: true, field: "court_id" })
  courtId?: number;

  @BelongsTo(() => Court)
  court?: Court;

  @ForeignKey(() => Prison)
  @Column({ type: DataType.INTEGER, allowNull: true, field: "prison_id" })
  prisonId?: number;

  @BelongsTo(() => Prison)
  prison?: Prison;

  // --- Autres Relations ---

  @HasMany(() => AuditLog)
  auditLogs!: AuditLog[];

  @HasOne(() => RefreshToken)
  authSession?: RefreshToken;

  @HasMany(() => Complaint)
  filedComplaints!: Complaint[];

  @HasMany(() => SosAlert)
  sentAlerts!: SosAlert[];

  @HasOne(() => Detainee)
  detaineeProfile?: Detainee;

  @CreatedAt 
  @Column({ type: DataType.DATE, field: "created_at" }) 
  createdAt!: Date;

  @UpdatedAt 
  @Column({ type: DataType.DATE, field: "updated_at" }) 
  updatedAt!: Date;
}