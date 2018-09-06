import { apiEndpoint, Endpoint, Transaction, inject } from '../../../src';

import { IRepository, SymbolHorseRepository } from '../types';
import { HorseEntity } from '../entities';

@apiEndpoint('get', '/api/v1/horse/:horseId', true)
export class HorsesGetOneEndpoint extends Endpoint {

    constructor(
        @inject(SymbolHorseRepository) private horseRepository: IRepository<HorseEntity>
    ) {
        super();
    }

    public async handle(transaction: Transaction) {
        const horseId = parseInt(transaction.getParams().horseId, 10);
        if (!horseId) {
            return transaction.send.badRequest([`Horse with id ${horseId} not found.`]);
        }

        const horse = await this.horseRepository.getOne(horseId);
        if (!horse) {
            return transaction.send.notFound();
        }

        return transaction.send.ok(horse);
    }

}

export default HorsesGetOneEndpoint;