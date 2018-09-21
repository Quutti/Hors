import 'reflect-metadata';

import { ENDPOINTS_METADATA_SYMBOL } from '../metadata';
import { EndpointMiddleware } from '../transaction/transaction-types';

export type ApiHttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface StoredEndpoint {
    url: string;
    method: ApiHttpMethod;
    public: boolean;
    middleware: EndpointMiddleware[];
    target: any;
}

export interface ApiEndpointSettings {
    method: ApiHttpMethod;
    url: string;
    public?: boolean;
    middleware?: EndpointMiddleware[];
}

export const apiEndpoint = (settings: ApiEndpointSettings) => {
    return (target: any) => {
        const { method, url, public: isPublic } = settings;
        const middleware = settings.middleware || [];
        const endpoints: StoredEndpoint[] = Reflect.getMetadata(ENDPOINTS_METADATA_SYMBOL, Reflect) || [];

        // Protect against duplicate endpoints
        endpoints.forEach(endpoint => {
            if (endpoint.method === method && endpoint.url === url) {
                throw new Error(`Duplicate endpoint registered (${method.toLocaleUpperCase()} ${url})`);
            }
        });

        endpoints.push({
            url,
            method,
            target,
            middleware,
            public: isPublic
        });

        Reflect.defineMetadata(ENDPOINTS_METADATA_SYMBOL, endpoints, Reflect);
    }
}