import * as express from 'express';

import 'reflect-metadata';

import {
    createExpressHandler,
    createExpressMiddleware,
    createExpressErrorHandler,
    EndpointHandler,
    EndpointErrorHandler,
    EndpointMiddleware,
    addTransactionMiddleware
} from './transaction/transaction-utils';
import { Endpoint } from './endpoint';
import { StoredEndpoint, ApiHttpMethod } from './decorators/api-endpoint';
import * as metadata from './metadata';
import { IBindSimpleEvent, SimpleEvent } from './simple-event';
import { Container } from 'inversify';

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
    public onListen: IBindSimpleEvent<number> = new SimpleEvent<number>();
    public onRegisterEndpoint: IBindSimpleEvent<EndpointRegisterType> = new SimpleEvent<EndpointRegisterType>();

    public start(port: number): HorsServer {
        // Register middleware to add transaction into request object
        this.app.use(addTransactionMiddleware);

        // Register own endpoints
        this.registerEndpoints();

        this.app.listen(port, () => {
            (this.onListen as SimpleEvent<number>).fire(port);
        });

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

        const prefixUrl = (url: string): string => (url[0] === '/') ? url : `/${url}`;

        const authCheckingMiddleware = (this.authenticationMiddleware) ?
            createExpressMiddleware(this.authenticationMiddleware)
            : null;

        const endpoints: StoredEndpoint[] = Reflect.getMetadata(
            metadata.ENDPOINTS_METADATA_SYMBOL,
            Reflect
        ) || [];

        endpoints.forEach(endpoint => {
            // Extract needed information from the endpoint object
            const { url, method, publicEndpoint, target } = endpoint;

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

            const prefixedUrl = prefixUrl(url);

            (this.onRegisterEndpoint as SimpleEvent<EndpointRegisterType>).fire({
                method,
                isPublic: publicEndpoint,
                url: prefixedUrl
            });

            // Register endpoint to Express app
            this.app[method](
                prefixedUrl,
                middleware,
                createExpressHandler(handler)
            );
        });

        // Register not found and error handlers
        this.notFoundHandler && this.app.use(createExpressHandler(this.notFoundHandler));
        this.errorHandler && this.app.use(createExpressErrorHandler(this.errorHandler));
    }

}