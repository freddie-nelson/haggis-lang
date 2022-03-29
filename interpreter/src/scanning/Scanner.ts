import Haggis from "../Haggis";
import Token from "./Token";
import { TokenType } from "./TokenType";
import keywords from "./keywords";

export default class Scanner {
  private readonly source: string;
  private readonly tokens: Token[] = [];

  /** The start index of the current lexeme */
  private start = 0;

  /** The index of the character we are at in the source */
  private current = 0;

  /** The line number we are on in the source */
  private line = 1;

  private startColumn = 0;
  private column = 0;

  constructor(source: string) {
    this.source = source;
  }

  scanTokens(): Token[] {
    while (!this.isAtEnd()) {
      // we are at the beginning of the next lexeme
      this.start = this.current;
      this.startColumn = this.column;
      this.scanToken();
    }

    this.start = this.current;
    this.startColumn = this.column;
    this.addToken(TokenType.EOF);

    return this.tokens;
  }

  private scanToken() {
    const c = this.advance();

    switch (c) {
      // brackets
      case "(":
        this.addToken(TokenType.LEFT_PAREN);
        break;
      case ")":
        this.addToken(TokenType.RIGHT_PAREN);
        break;
      case "{":
        this.addToken(TokenType.LEFT_BRACE);
        break;
      case "}":
        this.addToken(TokenType.RIGHT_BRACE);
        break;
      case "[":
        this.addToken(TokenType.LEFT_BRACKET);
        break;
      case "]":
        this.addToken(TokenType.RIGHT_BRACKET);
        break;

      // mathematical operators
      case "-":
        this.addToken(TokenType.MINUS);
        break;
      case "+":
        this.addToken(TokenType.PLUS);
        break;
      case "/":
        this.addToken(TokenType.SLASH);
        break;
      case "*":
        this.addToken(TokenType.STAR);
        break;
      case "^":
        this.addToken(TokenType.CARET);
        break;

      // additional operators
      case "&":
        this.addToken(TokenType.AMPERSAND);
        break;

      // seperators
      case ",":
        this.addToken(TokenType.COMMA);
        break;
      case ".":
        this.addToken(TokenType.DOT);
        break;

      // case ";":
      case "\n":
        if (this.tokens.length === 0 || this.tokens[this.tokens.length - 1].type !== TokenType.SEPARATOR)
          this.addToken(TokenType.SEPARATOR);

        if (c === "\n") {
          this.line++;
          this.column = 0;
        }
        break;

      // comparision operators
      case "=":
        this.addToken(TokenType.EQUAL);
        break;
      case "≠":
        this.addToken(TokenType.NOT_EQUAL);
        break;
      case ">":
        this.addToken(TokenType.GREATER);
        break;
      case "≥":
        this.addToken(TokenType.GREATER_EQUAL);
        break;
      case "<":
        this.addToken(TokenType.LESS);
        break;
      case "≤":
        this.addToken(TokenType.LESS_EQUAL);
        break;

      // single line comment
      case "#":
        while (this.peek() !== "\n" && !this.isAtEnd()) this.advance();
        break;

      // whitespace
      case " ":
      case "\r":
      case "\t":
        break;

      case "'":
        this.string("'");

        if (!Haggis.hadError) {
          const token = this.tokens.pop();
          const char = new Token(
            TokenType.CHARACTER_LITERAL,
            token.lexeme,
            token.literal,
            token.line,
            token.column
          );

          if (token.literal.length > 1) {
            Haggis.error(char, "More than one character in character literal.");
          } else {
            this.tokens.push(char);
          }
        }

        break;
      case '"':
        this.string('"');
        break;

      default:
        if (this.isDigit(c)) {
          this.number();
        } else if (this.isAlpha(c)) {
          this.identifier();
        } else {
          Haggis.error(new Token(-1, c, undefined, this.line, this.start), `Unexpected character: ${c}.`);
        }
        break;
    }
  }

  private string(terminator: '"' | "'") {
    while (this.peek() !== terminator && !this.isAtEnd()) {
      if (this.peek() === "\n") this.line++;
      this.advance();
    }

    if (this.isAtEnd()) {
      Haggis.error(new Token(TokenType.EOF, "", undefined, this.line, this.start), "Unterminated string.");
      return;
    }

    // the closing terminator
    this.advance();

    // trim surrounding quotes to get literal
    const value = this.source.substring(this.start + 1, this.current - 1);
    this.addToken(TokenType.STRING_LITERAL, value);
  }

  private number() {
    while (this.isDigit(this.peek())) this.advance();

    // look for fractional part (ie 1.234)
    if (this.peek() === "." && this.isDigit(this.peekNext())) {
      // consume the .
      this.advance();

      while (this.isDigit(this.peek())) this.advance();

      this.addToken(
        TokenType.REAL_LITERAL,
        Number.parseFloat(this.source.substring(this.start, this.current))
      );
    } else {
      this.addToken(
        TokenType.INTEGER_LITERAL,
        Number.parseInt(this.source.substring(this.start, this.current))
      );
    }
  }

  private identifier() {
    while (this.isAlphaNumeric(this.peek())) this.advance();

    const text = this.source.substring(this.start, this.current);
    let type = keywords[text];
    if (type === undefined) type = TokenType.IDENTIFIER;

    this.addToken(type);
  }

  private match(expected: string): boolean {
    if (this.isAtEnd()) return false;
    if (this.source.charAt(this.current) !== expected) return false;

    this.current++;
    return true;
  }

  private peek(): string {
    if (this.isAtEnd()) return "";
    return this.source.charAt(this.current);
  }

  private peekNext(): string {
    if (this.current + 1 >= this.source.length) return "";
    return this.source.charAt(this.current + 1);
  }

  private isAlpha(c: string): boolean {
    const code = c.charCodeAt(0);
    return (
      (code >= "a".charCodeAt(0) && code <= "z".charCodeAt(0)) ||
      (code >= "A".charCodeAt(0) && code <= "Z".charCodeAt(0)) ||
      c === "_"
    );
  }

  private isAlphaNumeric(c: string): boolean {
    return this.isAlpha(c) || this.isDigit(c);
  }

  private isDigit(c: string): boolean {
    const code = c.charCodeAt(0);
    return code >= "0".charCodeAt(0) && code <= "9".charCodeAt(0);
  }

  private isAtEnd(): boolean {
    return this.current >= this.source.length;
  }

  private advance(): string {
    this.column++;
    return this.source.charAt(this.current++);
  }

  private addToken(type: TokenType, literal?: any) {
    const text = this.source.substring(this.start, this.current);
    this.tokens.push(new Token(type, text, literal, this.line, this.startColumn));
  }
}
