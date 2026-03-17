export class ServiceError extends Error {
    status;
    constructor(status, message) {
        super(message);
        this.status = status;
        this.name = "ServiceError";
    }
}
