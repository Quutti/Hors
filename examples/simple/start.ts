import { HorsServer, Container, Express } from '../../src';

import * as types from './types';
import HorseRepository from './repositories/horse-repository';

import './endpoints';

/**
 * Function for adding custom configuration for Express instance
 */
const expressAppConfigurer = (expressApp: Express) => {

    // Here you can add custom configuration directly to the Express instance
    expressApp.use((request, response, next) => {
        next();
    });

}

/**
 * Configurer function to inject stuff into IOC container
 */
const iocContainerConfigurer = (iocContainer: Container) => {

    iocContainer
        .bind<types.IRepository<types.HorseEntity>>(types.SymbolHorseRepository)
        .to(HorseRepository);

}

// Create instance of HorsServer and configure express app and IOC container with
// configurer functions
const server = new HorsServer()
    .configureExpressInstance(expressAppConfigurer)
    .configureIocContainer(iocContainerConfigurer);

// Bind event listeners to log stuff on startup
server.onListen.bind(port => console.log(`Listening on port ${port}`));
server.onRegisterEndpoint.bind(endpoint => {
    console.log(endpoint.method.toLocaleUpperCase(), endpoint.url, (endpoint.isPublic) ? '[PUBLIC]' : '')
});

// Start server
server.start(8080);