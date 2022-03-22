import Token from "../scanning/Token";

export default class RuntimeError extends Error {
  readonly token: Token;

  constructor(token: Token, msg: string) {
    super(msg);

    this.token = token;
  }
}
