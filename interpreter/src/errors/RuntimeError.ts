import Token from "../Token";

export default class RuntimeError extends Error {
  readonly token: Token;

  constructor(token: Token, msg: string) {
    super(msg);

    this.token = token;
  }
}
