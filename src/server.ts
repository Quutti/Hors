import { Container } from 'inversify';
import * as express from 'express';
import { Server } from 'http';
import * as uuid from 'uuid';
import 'reflect-metadata';

import { Endpoint } from './endpoint';
import * as metadata from './metadata';
import { IBindSimpleEvent, SimpleEvent } from './simple-event';
import Transaction from './transaction/transaction';
import { EndpointHandler, EndpointErrorHandler, EndpointMiddleware, RequestWithTransaction } from './transaction/transaction-types';
import { createExpressHandler, createExpressMiddleware, createExpressErrorHandler } from './transaction/transaction-utils';
import { StoredEndpoint, ApiHttpMethod } from './decorators/api-endpoint';

type EndpointRegisterType = {
    method: ApiHttpMethod;
    url: string;
    isPublic: boolean;
};

export type ExpressConfigurationHandler = (app: express.Express, iocContainer: Container) => void;
export type IocContainerConfigurationHandler = (iocContainer: Container) => void;

export class HorsServer {

    private iocContainer: Container = new Container();
    private app: express.Express = express();
    private httpServerInstance: Server = null;
    private authenticationMiddleware: EndpointMiddleware = null;
    private errorHandler: EndpointErrorHandler = (transaction: Transaction) => transaction.send.internalServerError();
    private notFoundHandler: EndpointHandler = (transaction: Transaction) => transaction.send.notFound();
    private expressConfigurationHandler: ExpressConfigurationHandler = null;

    // Hooks
    public onTransactionStart: IBindSimpleEvent<Transaction> = new SimpleEvent<Transaction>();
    public onTransactionEnd: IBindSimpleEvent<Transaction> = new SimpleEvent<Transaction>();
    public onListen: IBindSimpleEvent<number> = new SimpleEvent<number>();
    public onRegisterEndpoint: IBindSimpleEvent<EndpointRegisterType> = new SimpleEvent<EndpointRegisterType>();

    public start(port: number): Promise<void> {

        // Run express configuration handler if any. This has to be done here so
        // iocContainer is configured and ready for use
        if (typeof this.expressConfigurationHandler === 'function') {
            this.expressConfigurationHandler(this.app, this.iocContainer);
        }

        // Register middleware to add transaction into request object
        this.app.use(this.createAddTransactionMiddleware());

        // Register own endpoints
        this.registerEndpoints();

        // Trigger a onListen hook when server starts listening the given port
        return new Promise(resolve => {
            this.httpServerInstance = this.app.listen(port, () => {
                (this.onListen as SimpleEvent<number>).fire(port);
                resolve();
            });
        });
    }

    public stop(): Promise<void> {
        return new Promise(resolve => {
            if (!this.httpServerInstance) {
                return resolve();
            }

            this.httpServerInstance.close(() => resolve());
        });
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

    public configureIocContainer(handler: IocContainerConfigurationHandler): HorsServer {
        handler(this.iocContainer);
        return this;
    }

    public configureExpressInstance(handler: ExpressConfigurationHandler): HorsServer {
        this.expressConfigurationHandler = handler;
        return this;
    }

    public getExpressInstance(): express.Express {
        return this.app;
    }

    /**
     * Hydrates the Express application with endpoints and authentication middleware
     */
    private registerEndpoints() {

        const prefixUrl = (url: string): string => (url.charAt(0) === '/') ? url : `/${url}`;

        // Convert auth middleware into express middlewares
        const authExpressMiddleware = (this.authenticationMiddleware) ?
            createExpressMiddleware(this.authenticationMiddleware, this.iocContainer)
            : null;

        // Get endpoints from the Reflect metadata
        const endpoints: StoredEndpoint[] = Reflect.getMetadata(
            metadata.ENDPOINTS_METADATA_SYMBOL,
            Reflect
        ) || [];

        endpoints.forEach(endpoint => {
            // Extract needed information from the endpoint object
            const { method, public: isPublic, target, middleware } = endpoint;
            const url = prefixUrl(endpoint.url);

            // Convert endpoint middlewares into express middlewares
            const expressMiddleware: express.RequestHandler[] = middleware.map(middleware =>
                createExpressMiddleware(middleware, this.iocContainer));

            // Add authentication middleware into beginning of the middleware array
            // if endpoint needs a auhenticaiton
            if (!isPublic && authExpressMiddleware) {
                expressMiddleware.unshift(authExpressMiddleware);
            }

            // Trigger a onRegisterEndpoint hook
            (this.onRegisterEndpoint as SimpleEvent<EndpointRegisterType>).fire({
                url,
                method,
                isPublic
            });

            // Register endpoint to Express app
            this.app[method](
                url,
                expressMiddleware,
                (req, res, next) => {
                    // Set target into iocContainer and retrieve it immediatly,
                    // by doing this we have now instance with dependencies injected
                    // by inversify
                    this.iocContainer.bind(target).toSelf();

                    const instance = this.iocContainer.get<Endpoint>(target);
                    const handler = instance.handle.bind(instance);

                    this.iocContainer.unbind(target);
                    createExpressHandler(handler)(req, res, next);
                }
            );
        });

        // Register not found and error handlers
        this.notFoundHandler && this.app.use(createExpressHandler(this.notFoundHandler));
        this.errorHandler && this.app.use(createExpressErrorHandler(this.errorHandler, this.iocContainer));
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