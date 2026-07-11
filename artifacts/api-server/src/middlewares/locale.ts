import type { Request, Response, NextFunction } from "express";
import { detectLocale, type Locale } from "../lib/i18n";

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      locale: Locale;
    }
  }
}

export function localeMiddleware(req: Request, _res: Response, next: NextFunction): void {
  req.locale = detectLocale(req.headers["accept-language"]);
  next();
}
