// src/models/http-exception.model.ts
export default class HttpException extends Error {
    status;
    errors;
    constructor(status, errors) {
        super();
        this.status = status;
        this.errors = errors;
    }
}
//# sourceMappingURL=http-exception.model.js.map