import 'reflect-metadata';

import { ENDPOINTS_METADATA_SYMBOL } from '../metadata';

export type ApiHttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

export interface StoredEndpoint {
    url: string;
    method: ApiHttpMethod;
    publicEndpoint: boolean;
    target: any;
}

export const apiEndpoint = (method: ApiHttpMethod, url: string, publicEndpoint: boolean = false) => {
    return (target: any) => {
        const endpoints: StoredEndpoint[] = Reflect.getMetadata(ENDPOINTS_METADATA_SYMBOL, Reflect) || [];

        endpoints.forEach(endpoint => {
            if (endpoint.method === method && endpoint.url === url) {
                throw new Error(`Duplicate endpoint registered (${method.toLocaleUpperCase()} ${url})`);
            }
        });

        endpoints.push({ url, method, publicEndpoint, target });

        Reflect.defineMetadata(ENDPOINTS_METADATA_SYMBOL, endpoints, Reflect);
    }
}