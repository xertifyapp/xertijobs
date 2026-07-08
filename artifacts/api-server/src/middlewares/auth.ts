import type { Request, Response, NextFunction, RequestHandler } from "express";

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  if (!req.session.user) {
    res.status(401).json({ error: "Debes iniciar sesión" });
    return;
  }
  next();
}

export function requireRole(...roles: string[]): RequestHandler {
  return (req, res, next) => {
    const user = req.session.user;
    if (!user) {
      res.status(401).json({ error: "Debes iniciar sesión" });
      return;
    }
    if (!roles.includes(user.role)) {
      res.status(403).json({ error: "No tienes permisos para realizar esta acción" });
      return;
    }
    next();
  };
}
