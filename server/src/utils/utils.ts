import { Request, Response, NextFunction } from 'express';

export const initPayload = (req: Request, res: Response, next: NextFunction) => {
  req.payload = req.payload || { ...req.params } || {};
  next();
};