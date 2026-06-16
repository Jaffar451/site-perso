// src/application/services/case.service.ts

import { Transaction } from "sequelize";
import { sequelize } from "../../models";
import CaseModel, { CaseStage } from "../../models/case.model";
import Complaint from "../../models/complaint.model";
import User from "../../models/user.model";
import Assignment from "../../models/assignment.model";
import AuditLog from "../../models/auditLog.model";
import { ProceduralService } from "./procedural.service";

// ─── Machine d'états du Case ───────────────────────────────────────────────────

// ✅ Correction TS2353 : Utilisation des clés de l'énumération (Majuscules)
const STAGE_TRANSITIONS: Record<CaseStage, CaseStage[]> = {
  [CaseStage.PROSECUTION]: [CaseStage.INVESTIGATION, CaseStage.TRIAL, CaseStage.ARCHIVED],
  [CaseStage.INVESTIGATION]: [CaseStage.TRIAL, CaseStage.ARCHIVED],
  [CaseStage.TRIAL]: [CaseStage.CLOSED, CaseStage.ARCHIVED], // Ajouté pour la logique
  [CaseStage.CLOSED]: [CaseStage.ARCHIVED],
  [CaseStage.ARCHIVED]: [],
};

// Mappage des rôles autorisés par transition
const STAGE_TRANSITION_ROLES: Record<string, string[]> = {
  [`${CaseStage.PROSECUTION}→${CaseStage.INVESTIGATION}`]: ["prosecutor"],
  [`${CaseStage.PROSECUTION}→${CaseStage.TRIAL}`]: ["prosecutor"],
  [`${CaseStage.PROSECUTION}→${CaseStage.ARCHIVED}`]: ["prosecutor"],
  [`${CaseStage.INVESTIGATION}→${CaseStage.TRIAL}`]: ["judge_instruction"],
  [`${CaseStage.INVESTIGATION}→${CaseStage.ARCHIVED}`]: ["judge_instruction"],
  [`${CaseStage.TRIAL}→${CaseStage.CLOSED}`]: ["judge_trial"],
  [`${CaseStage.TRIAL}→${CaseStage.ARCHIVED}`]: ["judge_trial"],
  [`${CaseStage.CLOSED}→${CaseStage.ARCHIVED}`]: ["greffier"],
};

export class CaseService {
  /**
   * Crée un Case depuis une Complaint figée.
   */
  static async createFromComplaint(
    complaint: Complaint,
    actor: User,
    options?: { transaction?: Transaction },
  ): Promise<CaseModel> {
    const t = options?.transaction || (await sequelize.transaction());
    const isExternal = !!options?.transaction;

    try {
      const reference = await CaseService.generateReference();

      const newCase = await CaseModel.create(
        {
          caseNumber: reference, // ✅ Correction : 'caseNumber' au lieu de 'reference' selon le modèle
          type: "criminal",
          stage: CaseStage.PROSECUTION, // ✅ Utilisation de l'enum
          complaintId: complaint.id,
          openedAt: new Date(),
          filingDate: new Date(),
        },
        { transaction: t },
      );

      await Assignment.create(
        {
          caseId: newCase.id,
          userId: actor.id,
          role: "prosecutor",
          assignedAt: new Date(),
          isActive: true,
        },
        { transaction: t },
      );

      if (complaint.offenseCategoryId) {
        await ProceduralService.instantiateForCase(
          newCase,
          complaint.offenseCategoryId,
          newCase.type,
          { transaction: t },
        );
      }

      await AuditLog.create(
        {
          userId: actor.id,
          action: "CASE_CREATED",
          entity: "Case",
          entityId: newCase.id,
          details: JSON.stringify({
            reference,
            fromComplaint: complaint.id,
          }),
        },
        { transaction: t },
      );

      if (!isExternal) await t.commit();
      return newCase;
    } catch (error) {
      if (!isExternal) await t.rollback();
      throw error;
    }
  }

  /**
   * Transition de stage d'un dossier.
   */
  static async transition(
    caseId: number,
    newStage: CaseStage,
    actor: User,
    options?: { reason?: string; transaction?: Transaction },
  ): Promise<CaseModel> {
    const t = options?.transaction || (await sequelize.transaction());
    const isExternal = !!options?.transaction;

    try {
      const judicialCase = await CaseModel.findByPk(caseId, { transaction: t });
      if (!judicialCase) throw new Error(`Dossier #${caseId} introuvable`);

      const allowed = STAGE_TRANSITIONS[judicialCase.stage] || [];
      if (!allowed.includes(newStage)) {
        throw new Error(
          `Transition interdite : ${judicialCase.stage} → ${newStage}`,
        );
      }

      const assignment = await Assignment.findOne({
        where: { caseId, userId: actor.id, isActive: true },
        transaction: t,
      });
      if (!assignment)
        throw new Error(`Aucune assignation active pour cet acteur`);

      const key = `${judicialCase.stage}→${newStage}`;
      const allowedRoles = STAGE_TRANSITION_ROLES[key] || [];
      if (!allowedRoles.includes(assignment.role)) {
        throw new Error(`Rôle '${assignment.role}' non autorisé pour ${key}`);
      }

      // ✅ Correction TS2367 : Comparaison avec l'enum
      await judicialCase.update(
        {
          stage: newStage,
          ...(newStage === CaseStage.ARCHIVED ? { closedAt: new Date() } : {}),
        },
        { transaction: t },
      );

      await AuditLog.create(
        {
          userId: actor.id,
          action: "CASE_STAGE_TRANSITION",
          entity: "Case",
          entityId: judicialCase.id,
          details: JSON.stringify({
            from: judicialCase.stage,
            to: newStage,
            reason: options?.reason || null,
          }),
        },
        { transaction: t },
      );

      if (!isExternal) await t.commit();
      return judicialCase;
    } catch (error) {
      if (!isExternal) await t.rollback();
      throw error;
    }
  }

  private static async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await CaseModel.count();
    const seq = String(count + 1).padStart(6, "0");
    return `EJ-${year}-${seq}`;
  }

  static async getAvailableTransitions(
    judicialCase: CaseModel,
    actor: User,
  ): Promise<CaseStage[]> {
    const assignment = await Assignment.findOne({
      where: { caseId: judicialCase.id, userId: actor.id, isActive: true },
    });
    if (!assignment) return [];

    const possible = STAGE_TRANSITIONS[judicialCase.stage] || [];
    return possible.filter((to) => {
      const key = `${judicialCase.stage}→${to}`;
      return (STAGE_TRANSITION_ROLES[key] || []).includes(assignment.role);
    });
  }
}