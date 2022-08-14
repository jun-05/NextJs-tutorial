import CustomServerError from './custom_serverError';

export default class BadReqError extends CustomServerError {
  constructor(message: string) {
    super({ message, statusCode: 400 });
  }
}
