import {Request, Response, NextFunction, RequestHandler } from "express";

const extractFileFromReq = (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({message:"Successfully called extract data"})
}

export const extractPdf = ():RequestHandler[] => [extractFileFromReq]