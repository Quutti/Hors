import { Container } from 'inversify';
import * as express from 'express';
import * as uuid from 'uuid';
import 'reflect-metadata';

import { Endpoint } from './endpoint';
import * as metadata from './metadata';
import { IBindSimpleEvent, SimpleEvent } from './simple-event';
import {
    createExpressHandler,
    createExpressMiddleware,
    createExpressErrorHandler,
    EndpointHandler,
    EndpointErrorHandler,
    EndpointMiddleware,
    RequestWithTransaction
} from './transaction/transaction-utils';
import { Transaction } from './transaction/transaction';
import { StoredEndpoint, ApiHttpMethod } from './decorators/api-endpoint';

type EndpointRegisterType = {
    method: ApiHttpMethod;
    url: string;
    isPublic: boolean;
};

export class HorsServer {

    private iocContainer: Container = new Container();
    private app: express.Express = express();
    private authenticationMiddleware: EndpointMiddleware = null;
    private errorHandler: EndpointErrorHandler = null;
    private notFoundHandler: EndpointHandler = null;

    // Hooks
    public onTransactionStart: IBindSimpleEvent<Transaction> = new SimpleEvent<Transaction>();
    public onTransactionEnd: IBindSimpleEvent<Transaction> = new SimpleEvent<Transaction>();
    public onListen: IBindSimpleEvent<number> = new SimpleEvent<number>();
    public onRegisterEndpoint: IBindSimpleEvent<EndpointRegisterType> = new SimpleEvent<EndpointRegisterType>();

    public start(port: number): HorsServer {
        // Register middleware to add transaction into request object
        this.app.use(this.createAddTransactionMiddleware());

        // Register own endpoints
        this.registerEndpoints();

        // Trigger a onListen hook when server starts listening the given port
        this.app.listen(port, () => (this.onListen as SimpleEvent<number>).fire(port));

        return this;
    }

    public setAuthenticationMiddleware(middleware: EndpointMiddleware): HorsServer {
        this.authenticationMiddleware = middleware;
        return this;
    }

    public setErrorHandler(handler: EndpointErrorHandler): HorsServer {
        this.errorHandler = handler;
        return this;
    }

    public setNotFoundHandler(handler: EndpointHandler): HorsServer {
        this.notFoundHandler = handler;
        return this;
    }

    public configureIocContainer(handler: (container: Container) => void): HorsServer {
        handler(this.iocContainer);
        return this;
    }

    public configureExpressInstance(handler: (app: express.Express) => void): HorsServer {
        handler(this.app);
        return this;
    }

    /**
     * Hydrates the Express application with endpoints and authentication middleware
     */
    private registerEndpoints() {

        const prefixUrl = (url: string): string => (url.charAt(0) === '/') ? url : `/${url}`;

        const authCheckingMiddleware = (this.authenticationMiddleware) ?
            createExpressMiddleware(this.authenticationMiddleware)
            : null;

        const endpoints: StoredEndpoint[] = Reflect.getMetadata(
            metadata.ENDPOINTS_METADATA_SYMBOL,
            Reflect
        ) || [];

        endpoints.forEach(endpoint => {
            // Extract needed information from the endpoint object
            const { method, publicEndpoint, target } = endpoint;
            const url = prefixUrl(endpoint.url);

            // Set target into iocContainer and retrieve it immediatly,
            // by doing this we have now instance with dependencies injected
            // by inversify
            this.iocContainer.bind(target).toSelf();
            const instance = this.iocContainer.get<Endpoint>(target);
            const handler = instance.handle.bind(instance);

            const middleware: express.RequestHandler[] = [];

            // Add authentication middleware into chain if endpoint
            // needs a auhenticaiton
            if (!publicEndpoint && authCheckingMiddleware) {
                middleware.unshift(authCheckingMiddleware);
            }

            (this.onRegisterEndpoint as SimpleEvent<EndpointRegisterType>).fire({
                url,
                method,
                isPublic: publicEndpoint
            });

            // Register endpoint to Express app
            this.app[method](
                url,
                middleware,
                createExpressHandler(handler)
            );
        });

        // Register not found and error handlers
        this.notFoundHandler && this.app.use(createExpressHandler(this.notFoundHandler));
        this.errorHandler && this.app.use(createExpressErrorHandler(this.errorHandler));
    }

    /**
     * Creates a middleware for constracting the Transaction and injecting it into express request
     */
    private createAddTransactionMiddleware(): express.RequestHandler {
        return (request: RequestWithTransaction, response, next) => {
            const correlationId = uuid.v4();
            const transaction = new Transaction(
                request,
                response,
                correlationId,
                () => (this.onTransactionEnd as SimpleEvent<Transaction>).fire(transaction)
            );

            // Trigger a onTransactionStart -hook
            (this.onTransactionStart as SimpleEvent<Transaction>).fire(transaction);

            // Set transaction into request
            request.transaction = transaction;

            next();
        }
    }

}