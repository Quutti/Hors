import { Request, NextFunction } from 'express';

import Transaction from './transaction';

export type EndpointHandler = (transaction: Transaction) => void;
export type EndpointErrorHandler = (transaction: Transaction, error: any) => void;
export type EndpointMiddleware = (transaction: Transaction, next: NextFunction) => void;

export interface RequestWithTransaction extends Request {
    transaction: Transaction;
}
