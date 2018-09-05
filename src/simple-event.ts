type SimpleEventHandler<T> = (data: T) => void;

export interface IBindSimpleEvent<T> {
    bind(handler: SimpleEventHandler<T>);
}

export interface IFireSimpleEvent<T> {
    fire(data: T);
}

export class SimpleEvent<T> implements IBindSimpleEvent<T>, IFireSimpleEvent<T> {

    private handlers: Array<SimpleEventHandler<T>> = [];

    public fire(data: T): void {
        this.handlers.forEach(handler => {
            if (typeof data === 'object') {
                const tmp = (Array.isArray(data))
                    ? [...data]
                    : { ...data as { [key: string]: any } };
                handler(tmp as T);
            } else {
                handler(data);
            }
        });
    }

    public bind(handler: SimpleEventHandler<T>) {
        if (this.handlers.indexOf(handler) === -1) {
            this.handlers.push(handler);
        }
    }

}