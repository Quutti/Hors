import { apiEndpoint, Endpoint, Transaction, inject } from '../../../src';

import { IRepository, SymbolHorseRepository, HorseEntity } from '../types';

@apiEndpoint({
    method: 'get',
    url: '/api/v1/horses/:horseId',
    public: true
})
export class HorsesGetOneEndpoint extends Endpoint {

    constructor(
        @inject(SymbolHorseRepository) private horseRepository: IRepository<HorseEntity>
    ) {
        super();
    }

    public async handle(transaction: Transaction) {
        const horseId = parseInt(transaction.getParams().horseId, 10);
        if (!horseId) {
            return transaction.send.badRequest([{
                message: `Invalid horse id ${transaction.getParams().horseId}`
            }]);
        }

        const horse = await this.horseRepository.getOne(horseId);
        if (!horse) {
            return transaction.send.notFound();
        }

        return transaction.send.ok(horse);
    }

}

export default HorsesGetOneEndpoint;