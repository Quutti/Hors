import { Request, Response } from 'express';

export type TransactionRequestInfo = {
    correlationId: string;
    url: string;
    ipAddress: string;
}

export class Transaction {

    public send: Send = null;

    private correlationId: string = null;
    private request: Request = null;
    private response: Response = null;

    constructor(request: Request, response: Response, correlationId: string) {
        this.request = request;
        this.response = response;
        this.correlationId = correlationId;

        this.send = new Send(this.response);
    }

    public getBody(): { [key: string]: any } {
        return this.request.body;
    }

    public getCookies(): { [key: string]: any } {
        return this.request.cookies || {};
    }

    public getParams(): { [key: string]: any } {
        return this.request.params;
    }

    public getQuery(): { [key: string]: any } {
        return this.request.query;
    }

    public getRequestInfo(): TransactionRequestInfo {
        return {
            correlationId: this.correlationId,
            url: this.request.url,
            ipAddress: this.request.ip
        }
    }

    public setCookie(name: string, value: string) {
        this.response.cookie(name, value);
    }
}

type SendPayload = { [key: string]: any } | Array<{ [key: string]: any }>;
type SendError = { [key: string]: any };

type SendEnvelope = {
    statusCode: number;
    payload?: SendPayload;
    errors?: SendError[];
}

class Send {
    private response: Response = null;

    constructor(response: Response) {
        this.response = response;
    }

    public ok(payload?: SendPayload) {
        this.send(200, payload);
    }

    public created(payload?: SendPayload) {
        this.send(201, payload);
    }

    public badRequest(messages: string[]) {
        const errors: SendError[] = messages.map(message => ({ message }));
        this.sendError(400, errors);
    }

    public unauthorized() {
        this.sendError(401);
    }

    public forbidden() {
        this.sendError(403);
    }

    public notFound() {
        this.sendError(404);
    }

    public internalServerError() {
        this.sendError(500);
    }

    private send(statusCode: number, payload?: SendPayload) {
        const envelope: SendEnvelope = { statusCode };

        if (payload) {
            envelope.payload = payload;
        }

        this.finalizeSend(statusCode, envelope);
    }

    private sendError(statusCode: number, errors?: Array<SendPayload>) {
        const envelope: SendEnvelope = { statusCode };

        if (errors) {
            envelope.errors = errors;
        }

        this.finalizeSend(statusCode, envelope);
    }

    private finalizeSend(statusCode: number, envelope: SendEnvelope) {
        this.response
            .status(statusCode)
            .json(envelope);
    }
}

export default Transaction;