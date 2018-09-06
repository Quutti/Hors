import { apiEndpoint, Endpoint, Transaction, inject } from '../../../src';

import { IRepository, SymbolHorseRepository } from '../types';
import { HorseEntity } from '../entities';

@apiEndpoint('get', '/api/v1/horses', true)
export class HorsesGetAllEndpoint extends Endpoint {

    constructor(
        @inject(SymbolHorseRepository) private horseRepository: IRepository<HorseEntity>
    ) {
        super();
    }

    public async handle(transaction: Transaction) {
        const horses = await this.horseRepository.getAll();
        return transaction.send.ok(horses);
    }

}

export default HorsesGetAllEndpoint;