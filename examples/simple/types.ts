
export const SymbolHorseRepository = Symbol.for('Demo:Simple:SymbolHorseRepository');

export interface IRepository<T> {
    getOne(id: number): Promise<T>;
    getAll(): Promise<T[]>;
    insert(item: T): Promise<number>;
    delete(id: number): Promise<boolean>;
}
