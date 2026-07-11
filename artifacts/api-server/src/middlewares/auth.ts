import type { Request, Response, NextFunction, RequestHandler } from "express";
import { t } from "../lib/i18n";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    res.status(401).json({ error: t(req.locale, "auth.mustLogin") });
    return;
  }
  next();
}

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user) {
      res.status(401).json({ error: t(req.locale, "auth.mustLogin") });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: t(req.locale, "auth.forbidden") });
      return;
    }
    next();
  };
}
