import { injectable } from '../../../src';
import { IRepository, HorseEntity } from '../types';

@injectable()
export class HorseRepository implements IRepository<HorseEntity> {

    private horses: HorseEntity[] = [];
    private runningId: number = 0;

    public getOne(id: number): Promise<HorseEntity> {
        const horse = this.horses.filter(h => h.id === id)[0] || null;
        return Promise.resolve(horse);
    }

    public getAll(): Promise<HorseEntity[]> {
        return Promise.resolve([...this.horses])
    }

    public insert(item: HorseEntity): Promise<number> {
        const id = this.runningId++;
        this.horses.push({ ...item, id });
        return Promise.resolve(id);
    }

    public delete(id: number): Promise<boolean> {
        const index = this.horses.map(h => h.id).indexOf(id);
        if (index > -1) {
            this.horses.splice(index, 1);
            return Promise.resolve(true);
        }
        return Promise.resolve(false);
    }

}

export default HorseRepository;