import type { Request, Response, NextFunction, RequestHandler } from "express";

/**
 * Wraps an async route handler so unhandled promise rejections
 * are forwarded to Express's error middleware automatically.
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
): RequestHandler {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}