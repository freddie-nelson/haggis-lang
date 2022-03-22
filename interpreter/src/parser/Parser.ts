import {
  ArrayExpr,
  BinaryExpr,
  CallExpr,
  Expr,
  GetExpr,
  GroupingExpr,
  IndexExpr,
  LiteralExpr,
  LogicalExpr,
  RecordExpr,
  SuperExpr,
  ThisExpr,
  UnaryExpr,
  VariableExpr,
} from "../ast/Expr";
import {
  ClassStmt,
  CloseStmt,
  CreateStmt,
  ForEachStmt,
  ForStmt,
  FunctionStmt,
  IfStmt,
  OpenStmt,
  ProcedureStmt,
  RecieveStmt,
  RecieveVarStmt,
  RecordStmt,
  ReturnStmt,
  SendStmt,
  SetStmt,
  Stmt,
  UntilStmt,
  VarStmt,
  WhileStmt,
  ExpressionStmt,
} from "../ast/Stmt";
import { Type } from "../ast/TypeExpr";
import Haggis from "../Haggis";
import SyntaxError from "../scanning/SyntaxError";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";

export default class Parser {
  private readonly tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt[] {
    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      statements.push(this.globalDeclaration());
    }

    return statements;
  }

  private globalDeclaration(): Stmt {
    try {
      // if (this.match(TokenType.RECORD)) return this.recordDeclaration();
      // if (this.match(TokenType.CLASS)) return this.classDeclaration();
      // if (this.match(TokenType.FUNCTION)) return this.functionDeclaration();
      // if (this.match(TokenType.PROCEDURE)) return this.procedureDeclaration();

      return this.declaration();
    } catch (error) {
      if (!(error instanceof SyntaxError)) console.log(error);
      this.synchronize();
      return null;
    }
  }

  private declaration(): Stmt {
    // if (this.match(TokenType.DECLARE)) return this.varDeclaration();

    return this.statement();
  }

  private statement() {
    // if (this.match(TokenType.IF)) return this.ifStatement();
    // if (this.match(TokenType.WHILE)) return this.whileStatement();
    // if (this.match(TokenType.REPEAT)) return this.untilStatement();
    // if (this.matchTwo(TokenType.FOR, TokenType.EACH)) return this.forEachStatement();
    // if (this.match(TokenType.FOR)) return this.forStatement();
    // if (this.match(TokenType.SET)) return this.setStatement();
    // if (this.match(TokenType.CREATE)) return this.createStatement();
    // if (this.match(TokenType.OPEN)) return this.openStatement();
    // if (this.match(TokenType.CLOSE)) return this.closeStatement();
    // if (this.match(TokenType.SEND)) return this.sendStatement();
    // if (this.match(TokenType.RECIEVE)) return this.recieveStatement();
    // if (this.match(TokenType.RETURN)) return this.returnStatement();

    return this.expressionStatement();
  }

  // -------------------- GLOBAL DECLARATIONS --------------------

  // private recordDeclaration(): RecordStmt {}

  // private classDeclaration(): ClassStmt {}

  // private functionDeclaration(): FunctionStmt {}

  // private procedureDeclaration(): ProcedureStmt {}

  // // -------------------- DECLARATIONS --------------------

  // private varDeclaration(): VarStmt | RecieveVarStmt {}

  // // -------------------- STATEMENTS --------------------

  // private ifStatement(): IfStmt {}

  // private whileStatement(): WhileStmt {}

  // private untilStatement(): UntilStmt {}

  // private forEachStatement(): ForEachStmt {}

  // private forStatement(): ForStmt {}

  // private setStatement(): SetStmt {}

  // private createStatement(): CreateStmt {}

  // private openStatement(): OpenStmt {}

  // private closeStatement(): CloseStmt {}

  // private sendStatement(): SendStmt {}

  // private recieveStatement(): RecieveStmt {}

  // private returnStatement(): ReturnStmt {}

  private expressionStatement(): ExpressionStmt {
    const expr = this.expression();
    this.consume(TokenType.SEPERATOR, "Expect ';' or '\\n' after expression.");

    return new ExpressionStmt(expr);
  }

  // -------------------- EXPRESSIONS --------------------

  private expression(): Expr {
    return this.or();
  }

  private or(): Expr {
    let expr = this.and();

    while (this.match(TokenType.OR)) {
      const operator = this.previous();
      const right = this.and();

      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private and(): Expr {
    let expr = this.not();

    while (this.match(TokenType.AND)) {
      const operator = this.previous();
      const right = this.not();

      expr = new LogicalExpr(expr, operator, right);
    }

    return expr;
  }

  private not(): Expr {
    if (this.match(TokenType.NOT)) {
      const operator = this.previous();
      const right = this.not();
      return new UnaryExpr(operator, right);
    }

    return this.equality();
  }

  private equality(): Expr {
    let expr = this.comparison();

    while (this.match(TokenType.NOT_EQUAL, TokenType.EQUAL)) {
      const operator = this.previous();
      const right = this.comparison();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private comparison(): Expr {
    let expr = this.concatenation();

    while (this.match(TokenType.GREATER, TokenType.GREATER_EQUAL, TokenType.LESS, TokenType.LESS_EQUAL)) {
      const operator = this.previous();
      const right = this.concatenation();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private concatenation(): Expr {
    let expr = this.term();

    while (this.match(TokenType.AMPERSAND)) {
      const operator = this.previous();
      const right = this.term();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private term(): Expr {
    let expr = this.factor();

    while (this.match(TokenType.MINUS, TokenType.PLUS)) {
      const operator = this.previous();
      const right = this.factor();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private factor(): Expr {
    let expr = this.exponent();

    while (this.match(TokenType.SLASH, TokenType.STAR)) {
      const operator = this.previous();
      const right = this.exponent();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private exponent(): Expr {
    let expr = this.unary();

    while (this.match(TokenType.CARET)) {
      const operator = this.previous();
      const right = this.unary();
      expr = new BinaryExpr(expr, operator, right);
    }

    return expr;
  }

  private unary(): Expr {
    if (this.match(TokenType.MINUS)) {
      const operator = this.previous();
      const right = this.unary();
      return new UnaryExpr(operator, right);
    }

    return this.call();
  }

  private call(): Expr {
    let expr = this.primary();

    while (true) {
      if (this.match(TokenType.LEFT_PAREN)) {
        expr = this.finishCall(expr);
      } else if (this.match(TokenType.DOT)) {
        const name = this.consume(TokenType.IDENTIFIER, "Expect property name after '.'.");
        expr = new GetExpr(expr, name);
      } else if (this.match(TokenType.LEFT_BRACKET)) {
        const index = this.expression();
        const bracket = this.consume(TokenType.RIGHT_BRACKET, "Expect ']' after index expression.");

        expr = new IndexExpr(expr, bracket, index);
      } else {
        break;
      }
    }

    return expr;
  }

  private finishCall(callee: Expr): CallExpr {
    const args = this.expressionList(TokenType.RIGHT_PAREN, 255, "Can't have more than 255 arguments.");
    const paren = this.consume(TokenType.RIGHT_PAREN, "Expect ')' after arguments.");

    return new CallExpr(callee, paren, args);
  }

  private primary(): Expr {
    if (this.match(TokenType.FALSE)) return new LiteralExpr(false, Type.BOOLEAN);
    if (this.match(TokenType.TRUE)) return new LiteralExpr(true, Type.BOOLEAN);

    if (this.match(TokenType.INTEGER)) return new LiteralExpr(this.previous().literal, Type.INTEGER);
    if (this.match(TokenType.REAL)) return new LiteralExpr(this.previous().literal, Type.REAL);
    if (this.match(TokenType.CHARACTER)) return new LiteralExpr(this.previous().literal, Type.CHARACTER);
    if (this.match(TokenType.STRING)) return new LiteralExpr(this.previous().literal, Type.STRING);

    if (this.match(TokenType.SUPER)) {
      const keyword = this.previous();

      if (this.match(TokenType.DOT)) {
        this.consume(TokenType.IDENTIFIER, "Expect property name after 'super'.");

        return new SuperExpr(keyword, this.previous());
      }

      Haggis.error(keyword, "Expect method name after 'super'.");
    }

    if (this.match(TokenType.THIS)) return new ThisExpr(this.previous());

    if (this.match(TokenType.IDENTIFIER)) return new VariableExpr(this.previous());

    if (this.match(TokenType.LEFT_PAREN)) {
      const expr = this.expression();
      this.consume(TokenType.RIGHT_PAREN, "Expect ')' after expression.");
      return new GroupingExpr(expr);
    }

    if (this.match(TokenType.LEFT_BRACKET)) {
      const start = this.previous();
      const items = this.expressionList(TokenType.RIGHT_BRACKET);
      const end = this.consume(TokenType.RIGHT_BRACKET, "Expect ']' after array expression.");

      return new ArrayExpr(start, items, end);
    }

    if (this.match(TokenType.LEFT_BRACE)) {
      return this.recordExpression();
    }

    throw this.error(this.peek(), "Expect expression.");
  }

  private recordExpression(): RecordExpr {
    const start = this.previous();
    const fields: Token[] = [];
    const values: Expr[] = [];

    do {
      const name = this.consume(TokenType.IDENTIFIER, "Expect field name after '{'.");
      this.consume(TokenType.EQUAL, "Expect '=' after field name.");
      const value = this.expression();

      fields.push(name);
      values.push(value);
    } while (this.match(TokenType.COMMA));

    const end = this.consume(TokenType.RIGHT_BRACE, "Expect '}' after record expression.");

    return new RecordExpr(start, fields, values, end);
  }

  /**
   * Parses a comma seperated list of expressions.
   *
   * @returns The parsed list of expressions
   */
  private expressionList(terminator: TokenType, max = Infinity, maxMsg = "") {
    const expressions: Expr[] = [];

    if (!this.check(terminator)) {
      do {
        if (expressions.length >= max) this.error(this.peek(), maxMsg);

        expressions.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    return expressions;
  }

  /**
   * Checks if the current token matches any of the given types
   * and if so, consumes it.
   *
   * @param types An array of types to match for
   * @returns true when a token is matched, otherwise false.
   */
  private match(...types: TokenType[]): boolean {
    for (const type of types) {
      if (this.check(type)) {
        this.advance();
        return true;
      }
    }

    return false;
  }

  /**
   * Checks if the current and next token match the given types
   * and if so, consumes them.
   *
   * @returns true when both types match, otherwise false.
   */
  private matchTwo(current: TokenType, next: TokenType): boolean {
    if (this.check(current) && this.checkNext(next)) {
      this.advance();
      this.advance();
      return true;
    }

    return false;
  }

  /**
   * Consumes the current token if it's type matches the given type.
   *
   * @throws When the types don't match
   *
   * @param type The type to check for
   * @param msg The message to log on error
   * @returns The consumed token
   */
  private consume(type: TokenType, msg: string) {
    if (this.check(type)) return this.advance();
    throw this.error(this.peek(), msg);
  }

  /**
   * Checks to see if the current token matches the given type.
   *
   * Does not consume the current token.
   *
   * @param type The type to check for
   * @returns true if the type's match and this.isAtEnd() is false, otherwise false.
   */
  private check(type: TokenType): boolean {
    if (this.isAtEnd()) return false;
    return this.peek().type === type;
  }

  /**
   * Checks to see if the next token matches the given type.
   *
   * @param type The type to check for
   * @returns true if the type's match and the next token exists, otherwise false.
   */
  private checkNext(type: TokenType): boolean {
    const next = this.peekNext();
    if (!next || next.type === TokenType.EOF) return false;
    return next.type === type;
  }

  /**
   * Consumes the current token, incrementing this.current.
   *
   * @returns The consumed token.
   */
  private advance(): Token {
    if (!this.isAtEnd()) this.current++;
    return this.previous();
  }

  /**
   * Checks to see if the current token's type is {@link TokenType.EOF}
   *
   * @returns true if end of file is reached otherwise false.
   */
  private isAtEnd(): boolean {
    return this.peek().type === TokenType.EOF;
  }

  /**
   * Gets the current token without consuming it.
   *
   * @returns The current token
   */
  private peek(): Token {
    return this.tokens[this.current];
  }

  /**
   * Gets the next token without consuming it.
   *
   * @returns The next token
   */
  private peekNext(): Token {
    return this.tokens[this.current + 1];
  }

  /**
   * Gets the previous token.
   *
   * @returns The previous token
   */
  private previous(): Token {
    return this.tokens[this.current - 1];
  }

  private error(token: Token, msg: string): SyntaxError {
    Haggis.error(token, msg);
    return new SyntaxError(msg);
  }

  private synchronize() {
    this.advance();

    while (!this.isAtEnd()) {
      // if (this.previous().type === TokenType.SEPERATOR) return;

      switch (this.peek().type) {
        case TokenType.RECORD:
        case TokenType.CLASS:
        case TokenType.PROCEDURE:
        case TokenType.FUNCTION:
        case TokenType.DECLARE:
        case TokenType.IF:
        case TokenType.WHILE:
        case TokenType.REPEAT:
        case TokenType.FOR:
        case TokenType.SET:
        case TokenType.CREATE:
        case TokenType.OPEN:
        case TokenType.CLOSE:
        case TokenType.SEND:
        case TokenType.RECIEVE:
          return;
      }

      this.advance();
    }
  }
}
