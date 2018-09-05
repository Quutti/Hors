import { Request, RequestHandler, ErrorRequestHandler, NextFunction } from 'express';
import * as uuid from 'uuid';

import Transaction from './transaction';

export type EndpointTransactionHandler = (transaction: Transaction) => void;
export type EndpointTransactionErrorHandler = (transaction: Transaction, error: any) => void;
export type EndpointTransactionMiddleware = (transaction: Transaction, next: NextFunction) => void;

export interface RequestWithTransaction extends Request {
    transaction: Transaction;
}

/**
 * Converts a transaction based endpoint handler into Express endpoint handler
 */
export const createExpressHandler = (handler: EndpointTransactionHandler): RequestHandler => {
    return (request: RequestWithTransaction) => {
        const { transaction } = request;
        handler(transaction);
    }
}

/**
 * Converts a transaction error handler into Express error handler
 */
export const createExpressErrorHandler = (handler: EndpointTransactionErrorHandler): ErrorRequestHandler => {
    return (error, request: RequestWithTransaction) => {
        const { transaction } = request;
        handler(transaction, error);
    }
}

/**
 * Converts a transaction based middleware into Express middleware
 */
export const createExpressMiddleware = (middleware: EndpointTransactionMiddleware): RequestHandler => {
    return (request: RequestWithTransaction, response, next) => {
        const { transaction } = request;
        middleware(transaction, next);
    }
}

/**
 * Middleware for adding a transaction into request object for later retrieval
 */
export const addTransactionMiddleware: RequestHandler = (request: RequestWithTransaction, response, next) => {
    const correlationId = uuid.v4();

    request.transaction = new Transaction(request, response, correlationId);

    next();
}
