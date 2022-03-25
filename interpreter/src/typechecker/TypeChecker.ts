import {
  Visitor as ExprVisitor,
  Expr,
  UnaryExpr,
  LogicalExpr,
  LiteralExpr,
  GroupingExpr,
  SuperExpr,
  ThisExpr,
  GetExpr,
  RecordExpr,
  CallExpr,
  BinaryExpr,
  IndexExpr,
  ArrayExpr,
  VariableExpr,
} from "../ast/Expr";
import Parameter from "../ast/Parameter";
import { ReturnStmt, Stmt, VarStmt, Visitor as StmtVisitor } from "../ast/Stmt";
import {
  ArrayTypeExpr,
  ClassInstanceTypeExpr,
  ClassTypeExpr,
  FunctionTypeExpr,
  matchTypeExpr,
  RecordInstanceTypeExpr,
  RecordTypeExpr,
  Type,
  TypeExpr,
} from "../ast/TypeExpr";
import Haggis from "../Haggis";
import ImplementationError from "../parsing/ImplementationError";
import Interpreter from "../runtime/Interpreter";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";

export default class TypeChecker implements ExprVisitor<TypeExpr>, StmtVisitor<void> {
  private readonly interpreter: Interpreter;
  private readonly locals: Map<Expr, number>;

  private readonly global: Map<string, TypeExpr> = new Map();

  /**
   * Local scopes stack.
   *
   * The value (true, false) associated with each key in a map represents
   * wether or not we have finished resolving that variable's initializer.
   */
  private readonly scopes: Map<string, TypeExpr>[] = [];

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
    this.locals = interpreter.locals;
  }

  visitRecordStmt(stmt: RecordStmt) {
    if (this.scopes.length > 0) Haggis.error(stmt.name, "Record declared in local scope.");

    this.declare(stmt.name);
    this.define(stmt.name);
  }

  visitClassStmt(stmt: ClassStmt) {
    if (this.scopes.length > 0) Haggis.error(stmt.name, "Class declared in local scope.");

    this.declare(stmt.name);
    this.define(stmt.name);

    const enclosingClass = this.currentClass;
    this.currentClass = ClassType.CLASS;

    if (stmt.superclass) {
      if (stmt.name.lexeme === stmt.superclass.lexeme)
        Haggis.error(stmt.superclass, "A class can't inherit from itself.");

      this.currentClass = ClassType.DERIVED;

      this.resolve(new VariableExpr(stmt.superclass));

      this.beginScope();
      this.scopes[this.scopes.length - 1].set("SUPER", VariableState.USED);
    }

    this.beginScope();
    this.scopes[this.scopes.length - 1].set("THIS", VariableState.USED);

    if (stmt.initializer) {
      this.resolveFunction(stmt.initializer, FunctionType.INITIALIZER);
    }

    stmt.methods.forEach((m) => {
      this.resolveFunction(m, FunctionType.METHOD);
    });

    this.endScope();

    if (stmt.superclass) this.endScope();

    this.currentClass = enclosingClass;
  }

  visitProcedureStmt(stmt: ProcedureStmt) {
    this.declare(stmt.name);
    this.define(stmt.name);

    this.resolveFunction(stmt, FunctionType.PROCEDURE);
  }

  visitFunctionStmt(stmt: FunctionStmt) {
    this.declare(stmt.name);
    this.define(stmt.name);

    this.resolveFunction(stmt, FunctionType.FUNCTION);
  }

  visitVarStmt(stmt: VarStmt) {
    this.declare(stmt.name, stmt.type);
    const type = this.type(stmt.initializer);

    if (!this.match(stmt.type, type)) Haggis.error(stmt.name, "Variable and initializer type do not match.");
  }

  visitRecieveVarStmt(stmt: RecieveVarStmt) {
    this.declare(stmt.name);
    if (stmt.sender instanceof Expr) this.resolve(stmt.sender);
    this.define(stmt.name);
  }

  visitExpressionStmt(stmt: ExpressionStmt) {
    this.resolve(stmt.expression);
  }

  visitIfStmt(stmt: IfStmt) {
    this.resolve(stmt.condition);
    this.resolve(stmt.thenBranch);
    if (stmt.elseBranch) this.resolve(stmt.elseBranch);
  }

  visitWhileStmt(stmt: WhileStmt) {
    this.resolve(stmt.condition);

    const enclosingLoop = this.currentLoop;
    this.currentLoop = LoopType.WHILE;

    this.beginScope();
    this.resolve(stmt.body);
    this.endScope();

    this.currentLoop = enclosingLoop;
  }

  visitUntilStmt(stmt: UntilStmt) {
    const enclosingLoop = this.currentLoop;
    this.currentLoop = LoopType.UNTIL;

    this.beginScope();
    this.resolve(stmt.body);
    this.endScope();

    this.currentLoop = enclosingLoop;

    this.resolve(stmt.condition);
  }

  visitForStmt(stmt: ForStmt) {
    this.resolve(stmt.lower);
    this.resolve(stmt.upper);
    this.resolve(stmt.step);

    this.beginScope();

    this.declare(stmt.counter);
    this.define(stmt.counter);

    const enclosingLoop = this.currentLoop;
    this.currentLoop = LoopType.FOR;

    this.resolve(stmt.body);
    this.endScope();

    this.currentLoop = enclosingLoop;
  }

  visitForEachStmt(stmt: ForEachStmt) {
    this.resolve(stmt.object);

    this.beginScope();

    this.declare(stmt.iterator);
    this.define(stmt.iterator);

    const enclosingLoop = this.currentLoop;
    this.currentLoop = LoopType.FOR_EACH;

    this.resolve(stmt.body);
    this.endScope();

    this.currentLoop = enclosingLoop;
  }

  visitSetStmt(stmt: SetStmt) {
    this.resolve(stmt.object);
    this.resolve(stmt.value);
  }

  visitRecieveStmt(stmt: RecieveStmt) {
    this.resolve(stmt.object);
    if (stmt.sender instanceof Expr) this.resolve(stmt.sender);
  }

  visitSendStmt(stmt: SendStmt) {
    this.resolve(stmt.value);
    if (stmt.dest instanceof Expr) this.resolve(stmt.dest);
  }

  visitCreateStmt(stmt: CreateStmt) {
    this.resolve(stmt.file);
  }

  visitOpenStmt(stmt: OpenStmt) {
    this.resolve(stmt.file);
  }

  visitCloseStmt(stmt: CloseStmt) {
    this.resolve(stmt.file);
  }

  visitReturnStmt(stmt: ReturnStmt) {
    const type = this.type(stmt.value);
  }

  visitVariableExpr(expr: VariableExpr) {
    return this.resolveVariable(expr.name, expr);
  }

  visitArrayExpr(expr: ArrayExpr) {
    const types = expr.items.map((v) => this.type(v));
    types.forEach((t) => {
      if (!matchTypeExpr(t, types[0])) this.error(expr.startBracket, "Array item types do not match.");
    });

    return new ArrayTypeExpr(Type.ARRAY, types[0]);
  }

  visitRecordExpr(expr: RecordExpr) {
    const types = expr.values.map((v) => this.type(v));

    const fields: Parameter[] = [];
    for (let i = 0; i < expr.fields.length; i++) {
      fields.push(new Parameter(expr.fields[i], types[i]));
    }

    const record = new RecordTypeExpr("RecordExpr", fields);

    return new RecordInstanceTypeExpr(record);
  }

  visitIndexExpr(expr: IndexExpr) {
    const type = this.type(expr.object);
    if (!this.isArray(type)) this.error(expr.bracket, "Object cannot be indexed.");

    const index = this.type(expr.index);
    if (!this.isInteger(index)) this.error(expr.bracket, "Index expression must be an integer.");

    if (type instanceof ArrayTypeExpr) {
      return type.itemType;
    }

    // Unreachable
    throw new ImplementationError("Object was not array in IndexExpr.");
  }

  visitBinaryExpr(expr: BinaryExpr) {
    const left = this.type(expr.left);
    const right = this.type(expr.right);

    switch (expr.operator.type) {
      case TokenType.EQUAL:
      case TokenType.NOT_EQUAL:
        if (matchTypeExpr(left, right) || (this.isNumber(left) && this.isNumber(right)))
          return new TypeExpr(Type.BOOLEAN);
        else this.error(expr.operator, "Left and right expressions types do not match.");
        break;
      case TokenType.LESS:
      case TokenType.LESS_EQUAL:
      case TokenType.GREATER:
      case TokenType.GREATER_EQUAL:
        if (!this.isNumber(left) || !this.isNumber(right))
          this.error(expr.operator, "Left and right expressions are not numbers.");

        return new TypeExpr(Type.BOOLEAN);
      case TokenType.STAR:
        if (this.isArray(left) || this.isArray(right)) {
          const array = this.isArray(left) ? left : right;
          const integer = this.isInteger(left) ? left : right;
          if (!this.isInteger(integer))
            this.error(expr.operator, "Array may only be multiplied by an integer.");

          return array;
        }
      case TokenType.PLUS:
      case TokenType.MINUS:
      case TokenType.SLASH:
      case TokenType.CARET:
        if (!this.isNumber(left) || !this.isNumber(right))
          this.error(expr.operator, "Left and right expressions are not numbers.");

        if (this.isReal(left) || this.isReal(right)) return new TypeExpr(Type.REAL);
        else return new TypeExpr(Type.INTEGER);
      case TokenType.MOD:
        if (!this.isInteger(left) || !this.isInteger(right))
          this.error(expr.operator, "Left and right expressions are not integers.");

        return new TypeExpr(Type.INTEGER);
      default:
        throw new ImplementationError("Binary operator not implemented in type checker.");
    }
  }

  visitCallExpr(expr: CallExpr) {
    const type = this.type(expr.callee);
    if (!this.isCallable(type)) this.error(expr.paren, `Object is not callable.`);

    const args = expr.args.map((a) => this.type(a));

    if (type instanceof FunctionTypeExpr) {
      if (!type.matchParams(args))
        this.error(expr.paren, "Provided arguments do not match callee's parameters.");

      return type.returnType;
    } else if (type instanceof RecordTypeExpr) {
      if (!type.initializer.matchParams(args))
        this.error(expr.paren, "Provided arguments do not match record's fields.");

      return new RecordInstanceTypeExpr(type);
    } else if (type instanceof ClassTypeExpr) {
      if (!type.initializer.matchParams(args))
        this.error(expr.paren, "Provided arguments do not match class constructor's parameters.");

      return new ClassInstanceTypeExpr(type);
    }

    // Unreachable
    throw new ImplementationError("Object in call expression was not callable.");
  }

  visitGetExpr(expr: GetExpr) {
    const type = this.type(expr.object);
    if (!this.isInstance(type)) this.error(expr.name, "Object is not an instance of a record or class.");

    if (type instanceof RecordInstanceTypeExpr) {
      if (!type.record.hasField(expr.name.lexeme))
        this.error(expr.name, `Record instance does not contain the field '${expr.name.lexeme}'.`);

      return type.record.getField(expr.name.lexeme);
    } else if (type instanceof ClassInstanceTypeExpr) {
      if (!type.klass.hasProperty(expr.name.lexeme))
        this.error(expr.name, `Class instance does not contain the property '${expr.name.lexeme}'.`);

      return type.klass.getProperty(expr.name.lexeme);
    }

    // Unreachable
    throw new ImplementationError("Object in get expression was not a record or class.");
  }

  visitThisExpr(expr: ThisExpr) {
    return this.resolveVariable(expr.keyword, expr);
  }

  visitSuperExpr(expr: SuperExpr) {
    const superclass = this.resolveVariable(expr.keyword, expr);
    if (!(superclass instanceof ClassTypeExpr))
      throw new ImplementationError("Super is not an instance of ClassTypeExpr.");

    if (!superclass.hasMethod(expr.method.lexeme))
      this.error(expr.method, `Method '${expr.method.lexeme}' does not exist '${superclass.name}'.`);

    return superclass.getMethod(expr.method.lexeme);
  }

  visitGroupingExpr(expr: GroupingExpr) {
    return this.type(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr) {
    return new TypeExpr(expr.type);
  }

  visitLogicalExpr(expr: LogicalExpr) {
    const left = this.type(expr.left);
    const right = this.type(expr.right);

    if (!this.isBoolean(left)) this.error(expr.operator, "Left hand expression is not a boolean.");
    if (!this.isBoolean(right)) this.error(expr.operator, "Right hand expression is not a boolean.");

    return new TypeExpr(Type.BOOLEAN);
  }

  visitUnaryExpr(expr: UnaryExpr) {
    const type = this.type(expr.right);

    switch (expr.operator.type) {
      case TokenType.NOT:
        if (!this.isBoolean(type)) this.error(expr.operator, "Unary NOT requires boolean expression.");
        break;
      case TokenType.MINUS:
        if (!this.isNumber(type)) this.error(expr.operator, "Unary '-' requires a number.");
        break;
      default:
        throw new ImplementationError("Unary operator not implemented in type checker.");
    }

    return type;
  }

  check(statements: Stmt[]): void;

  check(statement: Stmt): void;

  check(s: Stmt | Stmt[]): void {
    if (Array.isArray(s)) {
      s.forEach((s) => this.check(s));
    } else {
      s.accept(this);
    }
  }

  type(e: Expr): TypeExpr {
    return e.accept(this);
  }

  private beginScope() {
    this.scopes.push(new Map());
  }

  private endScope() {
    this.scopes.pop();
  }

  private declare(name: Token, type: TypeExpr) {
    let scope = this.scopes[this.scopes.length - 1];
    if (!scope) scope = this.global;

    scope.set(name.lexeme, type);
  }

  private resolveVariable(name: Token, expr: Expr): TypeExpr {
    if (this.locals.has(expr)) {
      const distance = this.locals.get(expr);
      const scope = this.scopes[this.scopes.length - 1 - distance];

      return scope.get(name.lexeme);
    } else {
      return this.global.get(name.lexeme);
    }
  }

  private isBoolean(type: TypeExpr): boolean {
    return type.type === Type.BOOLEAN;
  }

  private isNumber(type: TypeExpr): boolean {
    return this.isInteger(type) || this.isReal(type);
  }

  private isInteger(type: TypeExpr): boolean {
    return type.type === Type.INTEGER;
  }

  private isReal(type: TypeExpr): boolean {
    return type.type === Type.REAL;
  }

  private isCharacter(type: TypeExpr): boolean {
    return type.type === Type.CHARACTER;
  }

  private isString(type: TypeExpr): boolean {
    return type.type === Type.STRING;
  }

  private isArray(type: TypeExpr): boolean {
    return type.type === Type.ARRAY;
  }

  private isObject(type: TypeExpr): boolean {
    return type.type === Type.CLASS || type.type === Type.RECORD;
  }

  private isInstance(type: TypeExpr): boolean {
    return type.type === Type.CLASS_INSTANCE || type.type === Type.RECORD_INSTANCE;
  }

  private isCallable(type: TypeExpr): boolean {
    return (
      type.type === Type.CLASS ||
      type.type === Type.RECORD ||
      type.type === Type.FUNCTION ||
      type.type === Type.PROCEDURE
    );
  }

  private error(token: Token, msg: string) {
    Haggis.error(token, msg);
    throw new TypeError(msg);
  }
}
