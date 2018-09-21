type SimpleEventHandler<T> = (data: T) => void;

export interface IBindSimpleEvent<T> {
    bind(handler: SimpleEventHandler<T>): number;
    unbind(id: number): void;
}

export interface IFireSimpleEvent<T> {
    fire(data: T);
}

export class SimpleEvent<T> implements IBindSimpleEvent<T>, IFireSimpleEvent<T> {

    private runningId: number = 0;
    private handlers: { [key: string]: SimpleEventHandler<T> } = {};

    public fire(data: T): void {
        Object.keys(this.handlers).forEach(idKey => this.handlers[idKey](data));
    }

    public bind(handler: SimpleEventHandler<T>): number {
        const id = this.runningId++;
        this.handlers[`${id}`] = handler;
        return id;
    }

    public unbind(id: number): void {
        delete this.handlers[`${id}`];
    }

}