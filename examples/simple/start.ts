import { HorsServer, Container, Express } from '../../src';

import * as types from './types';
import HorseRepository from './repositories/horse-repository';

import './endpoints';

/**
 * Custom configuration for Express instance
 */
const expressAppConfigurer = (expressApp: Express) => {
    // Here you can add custom configuration directly to the Express instance
    expressApp.use((request, response, next) => {
        next();
    });
}

/**
 * Composition root for injecting stuff into IOC container
 */
const iocContainerConfigurer = (iocContainer: Container) => {
    const horseRepository = new HorseRepository();

    // Add couple of horses into repository
    horseRepository.insert({ color: 'brown', name: 'Cookiecharm', legCount: 4, weight: 421 });
    horseRepository.insert({ color: 'white', name: 'Three-leg-hevone', legCount: 3, weight: 678 })

    iocContainer
        .bind<types.IRepository<types.HorseEntity>>(types.SymbolHorseRepository)
        .toConstantValue(horseRepository);
}

// Create instance of HorsServer and configure express app and IOC container with
// configurer functions
const server = new HorsServer()
    .configureExpressInstance(expressAppConfigurer)
    .configureIocContainer(iocContainerConfigurer);

// Bind event listeners to log stuff on startup
server.onListen.bind(port => console.log(`Listening on port ${port}`));
// ... and when endpoint is registered
server.onRegisterEndpoint.bind(endpoint =>
    console.log(endpoint.method.toLocaleUpperCase(), endpoint.url, (endpoint.isPublic) ? '[PUBLIC]' : ''));

// ... and when new request is made
server.onTransactionStart.bind(transaction =>
    console.log(`[Start transaction] ${transaction.getRequestInfo().correlationId}`));
// ... and when the request is done
server.onTransactionEnd.bind(transaction =>
    console.log(`[End transaction] ${transaction.getRequestInfo().correlationId}`));

// Start server
server.start(8080);