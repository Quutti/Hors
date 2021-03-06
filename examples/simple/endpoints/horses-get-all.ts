import { apiEndpoint, Endpoint, Transaction, inject } from '../../../src';

import { IRepository, SymbolHorseRepository, HorseEntity } from '../types';

@apiEndpoint({
    method: 'get',
    url: '/api/v1/horses',
    public: true
})
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