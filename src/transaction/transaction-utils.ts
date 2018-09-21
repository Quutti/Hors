import { Request, RequestHandler, ErrorRequestHandler, NextFunction } from 'express';

import Transaction from './transaction';

export type EndpointHandler = (transaction: Transaction) => void;
export type EndpointErrorHandler = (transaction: Transaction, error: any) => void;
export type EndpointMiddleware = (transaction: Transaction, next: NextFunction) => void;

export interface RequestWithTransaction extends Request {
    transaction: Transaction;
}

/**
 * Converts a transaction based endpoint handler into Express endpoint handler
 */
export const createExpressHandler = (handler: EndpointHandler): RequestHandler => {
    return (request: RequestWithTransaction) => {
        const { transaction } = request;
        handler(transaction);
    }
}

/**
 * Converts a transaction error handler into Express error handler
 */
export const createExpressErrorHandler = (handler: EndpointErrorHandler): ErrorRequestHandler => {
    return (error, request: RequestWithTransaction) => {
        const { transaction } = request;
        handler(transaction, error);
    }
}

/**
 * Converts a transaction based middleware into Express middleware
 */
export const createExpressMiddleware = (middleware: EndpointMiddleware): RequestHandler => {
    return (request: RequestWithTransaction, response, next) => {
        const { transaction } = request;
        middleware(transaction, next);
    }
}