import { Router } from "express";
import { getAuditLogs } from "../db/audit.js";

const router = Router();

router.get("/audit-logs", (_req, res) => {
  const logs = getAuditLogs(100);
  res.json({ logs });
});

export default router;
