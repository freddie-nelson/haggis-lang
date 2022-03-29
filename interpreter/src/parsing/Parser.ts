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
import Parameter from "../ast/Parameter";
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
  ReceiveStmt,
  ReceiveVarStmt,
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
import { ArrayTypeExpr, IdentifierTypeExpr, Type, TypeExpr } from "../ast/TypeExpr";
import Haggis from "../Haggis";
import SyntaxError from "../scanning/SyntaxError";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";
import ImplementationError from "./ImplementationError";

export default class Parser {
  private readonly tokens: Token[];
  private current = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  parse(): Stmt[] {
    this.match(TokenType.SEPARATOR);

    const statements: Stmt[] = [];
    while (!this.isAtEnd()) {
      statements.push(this.globalDeclaration());
    }

    return statements;
  }

  private globalDeclaration(): Stmt {
    try {
      if (this.match(TokenType.RECORD)) return this.recordDeclaration();
      if (this.match(TokenType.CLASS)) return this.classDeclaration();
      if (this.match(TokenType.FUNCTION)) return this.functionDeclaration();
      if (this.match(TokenType.PROCEDURE)) return this.procedureDeclaration();

      return this.declaration();
    } catch (error) {
      if (!(error instanceof SyntaxError)) throw new ImplementationError(error.message);
      this.synchronize();
      return null;
    }
  }

  private declaration(): Stmt {
    if (this.match(TokenType.DECLARE)) return this.varDeclaration();

    return this.statement();
  }

  private statement() {
    if (this.match(TokenType.IF)) return this.ifStatement();
    if (this.match(TokenType.WHILE)) return this.whileStatement();
    if (this.match(TokenType.REPEAT)) return this.untilStatement();
    if (this.matchTwo(TokenType.FOR, TokenType.EACH)) return this.forEachStatement();
    if (this.match(TokenType.FOR)) return this.forStatement();
    if (this.match(TokenType.SET)) return this.setStatement();
    if (this.match(TokenType.CREATE)) return this.createStatement();
    if (this.match(TokenType.OPEN)) return this.openStatement();
    if (this.match(TokenType.CLOSE)) return this.closeStatement();
    if (this.match(TokenType.SEND)) return this.sendStatement();
    if (this.match(TokenType.RECEIVE)) return this.receiveStatement();
    if (this.match(TokenType.RETURN)) return this.returnStatement();

    return this.expressionStatement();
  }

  // -------------------- GLOBAL DECLARATIONS --------------------

  private recordDeclaration(): RecordStmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect record name.");
    this.consume(TokenType.IS, "Expect 'IS' after record name.");

    this.consume(TokenType.LEFT_BRACE, "Expect '{' before record fields.");
    const fields = this.parameters(TokenType.RIGHT_BRACE, true);
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after record fields.");

    this.match(TokenType.SEPARATOR);

    return new RecordStmt(name, fields);
  }

  private classDeclaration(): ClassStmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect class name.");

    let superclass: Token | undefined;
    let fields: Parameter[] = [];

    if (this.match(TokenType.INHERITS)) {
      superclass = this.consume(TokenType.IDENTIFIER, "Expect superclass name.");

      if (this.match(TokenType.WITH)) fields = this.classFields();
    } else if (this.match(TokenType.IS)) {
      fields = this.classFields();
    }

    this.match(TokenType.SEPARATOR);

    let initializer: ProcedureStmt;
    const methods: (ProcedureStmt | FunctionStmt)[] = [];
    const overrides: Map<ProcedureStmt | FunctionStmt, true> = new Map();

    if (this.match(TokenType.METHODS)) {
      this.match(TokenType.SEPARATOR);

      while (!this.check(TokenType.END) && !this.checkNext(TokenType.CLASS) && !this.isAtEnd()) {
        if (this.match(TokenType.OVERRIDE)) {
          const sub = this.subDeclaration();
          overrides.set(sub, true);
          methods.push(sub);
        } else if (this.match(TokenType.CONSTRUCTOR)) {
          initializer = this.classConstructor();
        } else {
          methods.push(this.subDeclaration());
        }
      }
    }

    if (!this.matchTwo(TokenType.END, TokenType.CLASS)) {
      throw this.error(this.previous(), "Expect 'END CLASS' after class declaration.");
    }

    methods.forEach((m) => {
      if (methods.find((method) => method !== m && method.name.lexeme === m.name.lexeme))
        this.error(m.name, `Duplicate methods '${m.name.lexeme}' in class '${name.lexeme}'.`);
    });

    if (overrides.size > 0 && !superclass)
      this.error(name, `Can only have override methods in a derived class.`);

    this.match(TokenType.SEPARATOR);

    return new ClassStmt(
      name,
      superclass ? new IdentifierTypeExpr(Type.IDENTIFER, superclass) : undefined,
      fields,
      initializer,
      methods,
      overrides
    );
  }

  private classFields(): Parameter[] {
    this.consume(TokenType.LEFT_BRACE, "Expect class fields.");
    const fields = this.parameters(TokenType.RIGHT_BRACE, true);
    this.consume(TokenType.RIGHT_BRACE, "Expect '}' after class fields.");

    return fields;
  }

  private classConstructor(): ProcedureStmt {
    const name = this.previous();
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after 'CONSTRUCTOR'.");

    const params = this.parameters(TokenType.RIGHT_PAREN, false, 255, "Can't have more than 255 parameters.");
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters list.");

    const body = this.body(
      "Expect 'END CONSTRUCTOR' after constructor body.",
      TokenType.END,
      TokenType.CONSTRUCTOR
    );

    this.match(TokenType.SEPARATOR);

    return new ProcedureStmt(name, params, body);
  }

  private subDeclaration(): ProcedureStmt | FunctionStmt {
    if (!this.match(TokenType.PROCEDURE, TokenType.FUNCTION))
      throw this.error(this.previous(), "Expect procedure or function declaration.");

    if (this.previous().type === TokenType.PROCEDURE) return this.procedureDeclaration();
    else return this.functionDeclaration();
  }

  private functionDeclaration(): FunctionStmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect function name.");
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after function name.");

    const params = this.parameters(TokenType.RIGHT_PAREN, false, 255, "Can't have more than 255 parameters.");
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters list.");

    this.consume(TokenType.RETURNS, "Expect return type after parameter list.");
    const returnType = this.typeExpression();

    const body = this.body("Expect 'END FUNCTION' after function body.", TokenType.END, TokenType.FUNCTION);

    this.match(TokenType.SEPARATOR);

    return new FunctionStmt(name, params, returnType, body);
  }

  private procedureDeclaration(): ProcedureStmt {
    const name = this.consume(TokenType.IDENTIFIER, "Expect procedure name.");
    this.consume(TokenType.LEFT_PAREN, "Expect '(' after procedure name.");

    const params = this.parameters(TokenType.RIGHT_PAREN, false, 255, "Can't have more than 255 parameters.");
    this.consume(TokenType.RIGHT_PAREN, "Expect ')' after parameters list.");

    const body = this.body(
      "Expect 'END PROCEDURE' after procedure body.",
      TokenType.END,
      TokenType.PROCEDURE
    );

    this.match(TokenType.SEPARATOR);

    return new ProcedureStmt(name, params, body);
  }

  // -------------------- DECLARATIONS --------------------

  private varDeclaration(): VarStmt | ReceiveVarStmt {
    let name: Token | GetExpr;
    if (this.match(TokenType.THIS)) {
      const object = this.previous();
      this.consume(TokenType.DOT, "Expect '.' after 'THIS'.");
      name = new GetExpr(new ThisExpr(object), this.consume(TokenType.IDENTIFIER, "Expect field name."));
    } else {
      name = this.consume(TokenType.IDENTIFIER, "Expect variable name after 'DECLARE'.");
    }

    let type: TypeExpr;
    if (this.match(TokenType.AS)) {
      type = this.typeExpression();
    }

    this.consume(TokenType.INITIALLY, "Expect variable initializer.");

    if (this.match(TokenType.FROM)) {
      const entity = this.systemEntity();
      this.consume(TokenType.SEPARATOR, "Expect '\\n' after system entity.");

      return new ReceiveVarStmt(name, type, entity);
    } else {
      const initializer = this.expression();
      this.consume(TokenType.SEPARATOR, "Expect '\\n' after variable initializer.");

      return new VarStmt(name, type, initializer);
    }
  }

  // -------------------- STATEMENTS --------------------

  private ifStatement(): IfStmt {
    const keyword = this.previous();

    const condition = this.expression();
    this.consume(TokenType.THEN, "Expect 'THEN' after if condition.");

    this.match(TokenType.SEPARATOR);

    const thenBranch: Stmt[] = [];
    while (
      !this.check(TokenType.ELSE) &&
      !(this.check(TokenType.END) && this.checkNext(TokenType.IF)) &&
      !this.isAtEnd()
    ) {
      thenBranch.push(this.declaration());
    }

    let elseBranch: Stmt[];
    if (this.match(TokenType.ELSE)) {
      elseBranch = this.body("Expect 'END IF' after else body.", TokenType.END, TokenType.IF);
    } else {
      this.advance();
      this.consume(TokenType.IF, "Expect 'END IF' after if body.");
    }

    this.match(TokenType.SEPARATOR);

    return new IfStmt(keyword, condition, thenBranch, elseBranch);
  }

  private whileStatement(): WhileStmt {
    const keyword = this.previous();

    const condition = this.expression();
    this.consume(TokenType.DO, "Expect 'DO' after loop condition.");

    const body = this.body("Expect 'END WHILE' after while body.", TokenType.END, TokenType.WHILE);

    this.match(TokenType.SEPARATOR);

    return new WhileStmt(keyword, condition, body);
  }

  private untilStatement(): UntilStmt {
    const keyword = this.previous();

    // allow separators before loop body
    this.match(TokenType.SEPARATOR);

    const body = this.body("Expect 'UNTIL' after until body.", TokenType.UNTIL);

    const condition = this.expression();
    this.consume(TokenType.SEPARATOR, "Expect separator after until condition.");

    return new UntilStmt(keyword, body, condition);
  }

  private forEachStatement(): ForEachStmt {
    const keyword = this.previous();

    const iterator = this.consume(TokenType.IDENTIFIER, "Expect identifier after 'FOR EACH'");

    this.consume(TokenType.FROM, "Expect 'FROM' after iterator identifer.");
    const object = this.expression();
    this.consume(TokenType.DO, "Expect 'DO' after iterating object.");

    const body = this.body(
      "Expect 'END FOR EACH' after for each body.",
      TokenType.END,
      TokenType.FOR,
      TokenType.EACH
    );
    this.match(TokenType.SEPARATOR);

    return new ForEachStmt(keyword, iterator, object, body);
  }

  private forStatement(): ForStmt {
    const keyword = this.previous();

    const counter = this.consume(TokenType.IDENTIFIER, "Expect identifer after 'FOR'.");

    this.consume(TokenType.FROM, "Expect 'FROM' after counter identifer.");
    const lower = this.expression();

    this.consume(TokenType.TO, "Expect 'TO' after lower bound.");
    const upper = this.expression();

    let step: Expr = new LiteralExpr(1, Type.INTEGER);
    if (this.match(TokenType.STEP)) {
      step = this.expression();
      this.consume(TokenType.DO, "Expect 'DO' after step expression.");
    } else {
      this.consume(TokenType.DO, "Expect 'DO' after upper bound.");
    }

    const body = this.body("Expect 'END FOR' after for body.", TokenType.END, TokenType.FOR);
    this.match(TokenType.SEPARATOR);

    return new ForStmt(keyword, counter, lower, upper, step, body);
  }

  private setStatement(): SetStmt {
    const keyword = this.previous();

    const object = this.expression();
    this.consume(TokenType.TO, "Expect 'TO' after object.");

    const value = this.expression();
    this.consume(TokenType.SEPARATOR, "Expect '\\n' after assignment value.");

    if (!(object instanceof VariableExpr) && !(object instanceof GetExpr) && !(object instanceof IndexExpr)) {
      this.error(keyword, "Invalid assignment target.");
    }

    return new SetStmt(keyword, object, value);
  }

  private createStatement(): CreateStmt {
    const keyword = this.previous();

    const file = this.expression();
    this.consume(TokenType.SEPARATOR, "Expect '\\n' after file expression.");

    return new CreateStmt(keyword, file);
  }

  private openStatement(): OpenStmt {
    const keyword = this.previous();

    const file = this.expression();
    this.consume(TokenType.SEPARATOR, "Expect '\\n' after file expression.");

    return new OpenStmt(keyword, file);
  }

  private closeStatement(): CloseStmt {
    const keyword = this.previous();

    const file = this.expression();
    this.consume(TokenType.SEPARATOR, "Expect '\\n' after file expression.");

    return new CloseStmt(keyword, file);
  }

  private sendStatement(): SendStmt {
    const keyword = this.previous();

    const value = this.expression();
    this.consume(TokenType.TO, "Expect 'TO' after send value.");

    const receiver = this.systemEntity();
    this.consume(TokenType.SEPARATOR, "Expect '\\n' after receiver.");

    return new SendStmt(keyword, value, receiver);
  }

  private receiveStatement(): ReceiveStmt {
    const keyword = this.previous();

    const object = this.expression();
    this.consume(TokenType.FROM, "Expect 'FROM' after recieving object.");

    const sender = this.systemEntity();
    this.consume(TokenType.SEPARATOR, "Expect '\\n' after sender.");

    if (!(object instanceof VariableExpr) && !(object instanceof GetExpr) && !(object instanceof IndexExpr)) {
      this.error(keyword, "Invalid assignment target.");
    }

    return new ReceiveStmt(keyword, object, sender);
  }

  private returnStatement(): ReturnStmt {
    const keyword = this.previous();

    let value: Expr | undefined;
    if (!this.check(TokenType.SEPARATOR)) {
      value = this.expression();
    }

    this.consume(TokenType.SEPARATOR, "Expect '\\n' after return value.");

    return new ReturnStmt(keyword, value);
  }

  private expressionStatement(): ExpressionStmt {
    const expr = this.expression();
    this.consume(TokenType.SEPARATOR, "Expect '\\n' after expression.");

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

    if (this.match(TokenType.INTEGER_LITERAL)) return new LiteralExpr(this.previous().literal, Type.INTEGER);
    if (this.match(TokenType.REAL_LITERAL)) return new LiteralExpr(this.previous().literal, Type.REAL);
    if (this.match(TokenType.CHARACTER_LITERAL))
      return new LiteralExpr(this.previous().literal, Type.CHARACTER);
    if (this.match(TokenType.STRING_LITERAL)) return new LiteralExpr(this.previous().literal, Type.STRING);

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

    fields.forEach((f) => {
      if (fields.find((field) => field !== f && field.lexeme === f.lexeme))
        this.error(f, `Duplicate fields '${f.lexeme}'.`);
    });

    return new RecordExpr(start, fields, values, end);
  }

  // -------------------- TYPE EXPRESSION --------------------

  private typeExpression(): TypeExpr {
    if (
      !this.match(
        TokenType.INTEGER,
        TokenType.REAL,
        TokenType.BOOLEAN,
        TokenType.CHARACTER,
        TokenType.STRING,
        TokenType.ARRAY,
        TokenType.IDENTIFIER
      )
    ) {
      throw this.error(this.peek(), "Expect type expression.");
    }

    const token = this.previous();
    if (token.type === TokenType.ARRAY) {
      this.consume(TokenType.OF, "Expect 'OF' after array type expression.");
      return new ArrayTypeExpr(Type.ARRAY, this.typeExpression());
    } else if (token.type === TokenType.IDENTIFIER) {
      return new IdentifierTypeExpr(Type.IDENTIFER, token);
    } else {
      const tokenName = TokenType[token.type];
      const type: Type = Type[tokenName as unknown as number] as any as Type;

      return new TypeExpr(type);
    }
  }

  // -------------------- HELPERS --------------------

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

        this.match(TokenType.SEPARATOR);

        expressions.push(this.expression());
      } while (this.match(TokenType.COMMA));
    }

    this.match(TokenType.SEPARATOR);

    return expressions;
  }

  private parameters(terminator: TokenType, required = false, max = Infinity, maxMsg = ""): Parameter[] {
    const parameters: Parameter[] = [];

    if (!this.check(terminator)) {
      do {
        if (parameters.length >= max) this.error(this.peek(), maxMsg);

        this.match(TokenType.SEPARATOR);

        const type = this.typeExpression();
        const name = this.consume(TokenType.IDENTIFIER, "Expect parameter name after type.");

        parameters.push(new Parameter(name, type));
      } while (this.match(TokenType.COMMA));
    }

    if (required && parameters.length === 0) this.error(this.previous(), "Parameter list cannot be empty.");

    parameters.forEach((p) => {
      if (parameters.find((para) => para !== p && para.name.lexeme === p.name.lexeme))
        this.error(p.name, `Duplicate parameters '${p.name.lexeme}'.`);
    });

    this.match(TokenType.SEPARATOR);

    return parameters;
  }

  private systemEntity(): Token | Expr {
    if (this.match(TokenType.DISPLAY) || this.match(TokenType.KEYBOARD)) return this.previous();

    return this.expression();
  }

  private body(msg: string, curr: TokenType, next?: TokenType, nextNext?: TokenType): Stmt[] {
    const body: Stmt[] = [];

    this.match(TokenType.SEPARATOR);

    if (nextNext) {
      while (!this.check(curr) && !this.checkNext(next) && !this.checkNextNext(nextNext) && !this.isAtEnd()) {
        body.push(this.declaration());
      }

      this.advance();
      this.advance();
      this.consume(nextNext, msg);
    } else if (next) {
      while (!this.check(curr) && !this.checkNext(next) && !this.isAtEnd()) {
        body.push(this.declaration());
      }

      this.advance();
      this.consume(next, msg);
    } else {
      while (!this.check(curr) && !this.isAtEnd()) {
        body.push(this.declaration());
      }

      this.consume(curr, msg);
    }

    return body;
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
   * Checks if the current, next and next token match the given types
   * and if so, consumes them.
   *
   * @returns true when all types match, otherwise false.
   */
  private matchThree(current: TokenType, next: TokenType, nextNext: TokenType): boolean {
    if (this.check(current) && this.checkNext(next) && this.checkNextNext(nextNext)) {
      this.advance();
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
   * Checks to see if the next next token matches the given type.
   *
   * @param type The type to check for
   * @returns true if the type's match and the next next token exists, otherwise false.
   */
  private checkNextNext(type: TokenType): boolean {
    const next = this.peekNextNext();
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
   * Gets the next next token without consuming it.
   *
   * @returns The next next token
   */
  private peekNextNext(): Token {
    return this.tokens[this.current + 2];
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
      // if (this.previous().type === TokenType.SEPARATOR) return;

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
        case TokenType.RECEIVE:
          return;
      }

      this.advance();
    }
  }
}
