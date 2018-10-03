import { Request, Response, CookieOptions } from 'express';

export type TransactionRequestInfo = {
    correlationId: string;
    url: string;
    ipAddress: string;
}

type OnTransactionEndCallback = () => void;

export class Transaction<UserType = any> {

    public send: Send = null;

    private correlationId: string = null;
    private request: Request = null;
    private response: Response = null;
    private user: UserType = null;

    constructor(request: Request, response: Response, correlationId: string, onEndCallback: OnTransactionEndCallback) {
        this.request = request;
        this.response = response;
        this.correlationId = correlationId;

        this.send = new Send(this.response, onEndCallback);
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

    public getUser(): UserType {
        return this.user;
    }

    public redirect(url: string): void {
        this.response.redirect(url);
    }

    public setCookie(name: string, value: string, options?: CookieOptions) {
        this.response.cookie(name, value, options);
    }

    public setUser(user: UserType) {
        this.user = user;
    }

}

type SendData = string | Buffer | { [key: string]: any } | Array<{ [key: string]: any }>;

class Send {
    private response: Response = null;
    private onEndCallback: OnTransactionEndCallback = null;

    constructor(response: Response, onEndCallback: OnTransactionEndCallback) {
        this.response = response;
        this.onEndCallback = onEndCallback;
    }

    public ok(payload?: SendData) {
        this.send(200, payload);
    }

    public created(payload?: SendData) {
        this.send(201, payload);
    }

    public noContent() {
        this.send(204);
    }

    public badRequest(payload?: SendData) {
        this.send(400, payload);
    }

    public unauthorized(payload?: SendData) {
        this.send(401, payload);
    }

    public forbidden(payload?: SendData) {
        this.send(403, payload);
    }

    public notFound(payload?: SendData) {
        this.send(404, payload);
    }

    public methodNotAllowed(payload?: SendData) {
        this.send(405, payload);
    }

    public internalServerError(payload?: SendData) {
        this.send(500, payload);
    }

    private send(statusCode: number, payload?: SendData) {
        this.response
            .status(statusCode)
            // Send automatically sets the correct Content-Type if
            // data is Buffer, string or an normal object (...or array)
            .send(payload);

        this.onEndCallback();
    }

}

export default Transaction;