import { Router } from "express";
import { authenticate } from "../middleware/auth.middleware";
import {
  getParties,
  addParty,
  removeParty,
} from "../controllers/caseParty.controller";

const router = Router({ mergeParams: true });
router.use(authenticate);

router.get("/", getParties);
router.post("/", addParty);
router.delete("/:partyId", removeParty);

export default router;
