import { TokenType } from "./TokenType";

export default class Token {
  readonly type: TokenType;
  readonly lexeme: string;
  readonly literal: any;
  readonly line: number;
  readonly pos: number;

  /**
   * Creates an {@link Token} instance.
   *
   * @param type The token's {@link TokenType}
   * @param lexeme The raw string of the token in the source code
   * @param literal The literal value of the token
   * @param line The line the token was on in the source code
   * @param pos The start position of the token in the source line
   */
  constructor(type: TokenType, lexeme: string, literal: any, line: number, pos: number) {
    this.type = type;
    this.lexeme = lexeme;
    this.literal = literal;
    this.line = line;
    this.pos = pos;
  }

  toString(): string {
    return `${this.type} ${this.lexeme} ${this.literal}`;
  }
}
