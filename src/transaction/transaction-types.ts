import { Container } from 'inversify';
import { Request, NextFunction } from 'express';

import Transaction from './transaction';

export type EndpointHandler = (transaction: Transaction) => void;
export type EndpointErrorHandler = (transaction: Transaction, iocContainer: Container, error: any) => void;
export type EndpointMiddleware = (transaction: Transaction, iocContainer: Container, next: NextFunction) => void;

export interface RequestWithTransaction extends Request {
    transaction: Transaction;
}
