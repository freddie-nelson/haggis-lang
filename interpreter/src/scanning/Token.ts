import { TokenType } from "./TokenType";

export default class Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: any;
  readonly line: number;
  readonly index: number;

  /**
   * Creates an {@link Token} instance.
   *
   * @param type The token's {@link TokenType}
   * @param lexeme The raw string of the token in the source code
   * @param literal The literal value of the token
   * @param line The line the token was on in the source code
   * @param index The index of the tokens starting character in the source string
   */
  constructor(type: TokenType, lexeme: string, literal: any, line: number, index: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
    this.index = index;
  }

  toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}
