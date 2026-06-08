// src/models/http-exception.model.ts
export default class HttpException extends Error {
  status: number;
  errors: any;

  constructor(status: number, errors: any) {
    super();
    this.status = status;
    this.errors = errors;
  }
}
//what is this file and why ? it extend the error
//teach me the httpException