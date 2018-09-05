import { injectable } from 'inversify';

import Transaction from './transaction/transaction';

@injectable()
export abstract class Endpoint {
    /**
     * Transaction handler for this endpoint
     */
    public abstract handle(transaction: Transaction);
}