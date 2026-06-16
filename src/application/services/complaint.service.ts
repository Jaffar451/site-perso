import { Transaction } from "sequelize";
import { sequelize } from "../../models";
import Complaint, { ComplaintStatus } from "../../models/complaint.model";
import CaseModel from "../../models/case.model";
import User from "../../models/user.model";
import { UserRole } from "../../models/user.model";
import { CaseService } from "./case.service";
import AuditLog from "../../models/auditLog.model";

// ======================================================
// 🧠 WORKFLOW STABLE (VERSION PRODUCTION)
// ======================================================

const TRANSITIONS: Record<ComplaintStatus, ComplaintStatus[]> = {
  soumise: ["en_cours_OPJ"],
  en_cours_OPJ: ["attente_validation", "classée_sans_suite_par_OPJ"],
  attente_validation: ["transmise_parquet", "classée_sans_suite_par_OPJ"],
  transmise_parquet: ["figée", "classée_sans_suite_par_procureur"],
  figée: [],
  classée_sans_suite_par_OPJ: [],
  classée_sans_suite_par_procureur: [],
  saisi_juge: [],
  audience_programmée: [],
  jugée: [],
  
  // Ajoute ces deux-là pour satisfaire TypeScript :
  instruction: [], 
  non_lieu: [],
};

// ======================================================
// 🔐 RÔLES AUTORISÉS
// ======================================================

const TRANSITION_ROLES: Record<string, UserRole[]> = {
  "soumise→en_cours_OPJ": [
    UserRole.OPJ_GENDARME,
    UserRole.INSPECTEUR,
    UserRole.OFFICIER_POLICE,
  ],

  "en_cours_OPJ→attente_validation": [
    UserRole.OPJ_GENDARME,
    UserRole.INSPECTEUR,
    UserRole.OFFICIER_POLICE,
  ],

  "en_cours_OPJ→classée_sans_suite_par_OPJ": [
    UserRole.OPJ_GENDARME,
    UserRole.INSPECTEUR,
    UserRole.OFFICIER_POLICE,
  ],

  "attente_validation→transmise_parquet": [UserRole.COMMISSAIRE],

  "attente_validation→classée_sans_suite_par_OPJ": [UserRole.COMMISSAIRE],

  "transmise_parquet→figée": [UserRole.PROSECUTOR],

  "transmise_parquet→classée_sans_suite_par_procureur": [UserRole.PROSECUTOR],
};

// ======================================================
// ❌ ERREURS
// ======================================================

export class ComplaintNotFoundError extends Error {}
export class InvalidTransitionError extends Error {}
export class UnauthorizedTransitionError extends Error {}
export class WrongInstitutionError extends Error {}

// ======================================================
// ⚙️ SERVICE
// ======================================================

export class ComplaintService {
  static async transition(
    complaintId: number,
    newStatus: ComplaintStatus,
    actor: User,
    options?: { reason?: string; transaction?: Transaction },
  ) {
    const t = options?.transaction || (await sequelize.transaction());
    const external = !!options?.transaction;

    try {
      const complaint = await Complaint.findByPk(complaintId, {
        transaction: t,
      });
      if (!complaint) throw new ComplaintNotFoundError();

      // 1. validation transition
      const allowed = TRANSITIONS[complaint.status] || [];
      if (!allowed.includes(newStatus)) {
        throw new InvalidTransitionError(`${complaint.status} → ${newStatus}`);
      }

      // 2. validation rôle
      const key = `${complaint.status}→${newStatus}`;
      const roles = TRANSITION_ROLES[key] || [];

      if (!roles.includes(actor.role as UserRole)) {
        throw new UnauthorizedTransitionError(
          `Rôle ${actor.role} non autorisé pour ${key}`,
        );
      }

      // 3. institution
      await this.checkInstitution(complaint, actor);

      const previousStatus = complaint.status;

      // 4. update
      await complaint.update({ status: newStatus }, { transaction: t });

      // 5. audit
      await AuditLog.create(
        {
          userId: actor.id,
          action: "COMPLAINT_TRANSITION",
          entity: "Complaint",
          entityId: complaint.id,
          details: JSON.stringify({
            from: previousStatus,
            to: newStatus,
            reason: options?.reason || null,
          }),
        },
        { transaction: t },
      );

      // 6. case auto
      let caseEntity: CaseModel | undefined;

      if (newStatus === "figée") {
        caseEntity = await CaseService.createFromComplaint(complaint, actor, {
          transaction: t,
        });
      }

      if (!external) await t.commit();

      return { complaint, case: caseEntity };
    } catch (err) {
      if (!external) await t.rollback();
      throw err;
    }
  }

  // ======================================================
  // 🏛️ INSTITUTION
  // ======================================================

  private static async checkInstitution(complaint: Complaint, actor: User) {
    const restricted = [
      UserRole.OPJ_GENDARME,
      UserRole.INSPECTEUR,
      UserRole.OFFICIER_POLICE,
      UserRole.COMMISSAIRE,
    ];

    if (restricted.includes(actor.role as UserRole)) {
      if (
        complaint.policeStationId &&
        actor.policeStationId !== complaint.policeStationId
      ) {
        throw new WrongInstitutionError();
      }
    }
  }

  // ======================================================
  // 📊 TRANSITIONS DISPONIBLES
  // ======================================================

  static getAvailableTransitions(
    complaint: Complaint,
    actor: User,
  ): ComplaintStatus[] {
    const possible = TRANSITIONS[complaint.status] || [];

    return possible.filter((to) => {
      const key = `${complaint.status}→${to}`;
      const roles = TRANSITION_ROLES[key] || [];
      return roles.includes(actor.role as UserRole);
    });
  }
}
