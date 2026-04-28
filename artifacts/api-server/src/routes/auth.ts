import { Router } from "express";

const router = Router();

router.post("/auth", (req, res) => {
  const { password } = req.body as { password?: string };

  if (!password) {
    res.status(400).json({ success: false, error: "パスワードを入力してください" });
    return;
  }

  if (password === process.env.APP_PASSWORD) {
    res.json({ success: true });
  } else {
    res.status(401).json({ success: false, error: "パスワードが違います" });
  }
});

export default router;
