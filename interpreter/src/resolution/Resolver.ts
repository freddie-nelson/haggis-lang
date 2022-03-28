import {
  Visitor as ExprVisitor,
  BinaryExpr,
  CallExpr,
  Expr,
  GetExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  SuperExpr,
  ThisExpr,
  UnaryExpr,
  VariableExpr,
  ArrayExpr,
  RecordExpr,
  IndexExpr,
} from "../ast/Expr";
import {
  Visitor as StmtVisitor,
  ExpressionStmt,
  ForEachStmt,
  ForStmt,
  FunctionStmt,
  IfStmt,
  ProcedureStmt,
  ReturnStmt,
  Stmt,
  UntilStmt,
  VarStmt,
  WhileStmt,
  ClassStmt,
  RecordStmt,
  RecieveVarStmt,
  SetStmt,
  CreateStmt,
  OpenStmt,
  CloseStmt,
  RecieveStmt,
  SendStmt,
} from "../ast/Stmt";
import { IdentifierTypeExpr, Type, TypeExpr } from "../ast/TypeExpr";
import Haggis from "../Haggis";
import Interpreter from "../runtime/Interpreter";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";

export enum VariableState {
  DECLARED,
  DEFINED,
  USED,
}

export enum FunctionType {
  NONE,
  PROCEDURE,
  FUNCTION,
  INITIALIZER,
  METHOD_PROCEDURE,
  METHOD_FUNCTION,
}

export enum ClassType {
  NONE,
  CLASS,
  DERIVED,
}

export enum LoopType {
  NONE,
  WHILE,
  UNTIL,
  FOR,
  FOR_EACH,
}

export default class Resolver implements ExprVisitor<void>, StmtVisitor<void> {
  private readonly interpreter: Interpreter;

  private readonly global: Map<string, VariableState> = new Map();

  /**
   * Local scopes stack.
   *
   * The value (true, false) associated with each key in a map represents
   * wether or not we have finished resolving that variable's initializer.
   */
  private readonly scopes: Map<string, VariableState>[] = [];

  private currentFunction: FunctionType = FunctionType.NONE;
  private currentClass: ClassType = ClassType.NONE;
  private currentLoop: LoopType = LoopType.NONE;

  private currentReturn = false;

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
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
      if (stmt.name.lexeme === stmt.superclass.identifier.lexeme)
        Haggis.error(stmt.superclass.identifier, "A class can't inherit from itself.");

      this.currentClass = ClassType.DERIVED;

      this.resolveLocal(stmt.superclass, stmt.superclass.identifier);

      this.beginScope();
      this.scopes[this.scopes.length - 1].set("SUPER", VariableState.USED);
    }

    this.beginScope();
    this.scopes[this.scopes.length - 1].set("THIS", VariableState.USED);

    if (stmt.initializer) {
      this.resolveFunction(stmt.initializer, FunctionType.INITIALIZER);
    }

    stmt.methods.forEach((m) => {
      let type = FunctionType.METHOD_PROCEDURE;
      if (m instanceof FunctionStmt) type = FunctionType.METHOD_FUNCTION;

      this.resolveFunction(m, type);
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
    this.declare(stmt.name);
    this.resolve(stmt.initializer);

    if (stmt.type?.type === Type.IDENTIFER) {
      this.resolveLocal(stmt.type, (<IdentifierTypeExpr>stmt.type).identifier);
    }

    this.define(stmt.name);
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
    if (this.currentFunction === FunctionType.NONE)
      Haggis.error(stmt.keyword, "Can't return from top-level code.");

    if (stmt.value) {
      if (this.currentFunction === FunctionType.INITIALIZER)
        Haggis.error(stmt.keyword, "Can't return a value from an initializer.");

      if (
        this.currentFunction === FunctionType.PROCEDURE ||
        this.currentFunction === FunctionType.METHOD_PROCEDURE
      )
        Haggis.error(stmt.keyword, "Can't return a value from a procedure.");

      this.resolve(stmt.value);
    }

    this.currentReturn = true;
  }

  visitVariableExpr(expr: VariableExpr) {
    if (
      this.scopes.length !== 0 &&
      this.scopes[this.scopes.length - 1].get(expr.name.lexeme) === VariableState.DECLARED
    )
      Haggis.error(expr.name, "Can't read local variable in it's own initializer.");

    this.resolveLocal(expr, expr.name);
  }

  visitArrayExpr(expr: ArrayExpr) {
    expr.items.forEach((i) => {
      this.resolve(i);
    });
  }

  visitRecordExpr(expr: RecordExpr) {
    expr.values.forEach((v) => {
      this.resolve(v);
    });
  }

  visitBinaryExpr(expr: BinaryExpr) {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitCallExpr(expr: CallExpr) {
    this.resolve(expr.callee);
    expr.args.forEach((a) => this.resolve(a));
  }

  visitGetExpr(expr: GetExpr) {
    this.resolve(expr.object);
  }

  visitIndexExpr(expr: IndexExpr) {
    this.resolve(expr.object);
    this.resolve(expr.index);
  }

  visitThisExpr(expr: ThisExpr) {
    if (this.currentClass === ClassType.NONE)
      Haggis.error(expr.keyword, "Can't use 'this' outside of a class.");

    this.resolveLocal(expr, expr.keyword);
  }

  visitSuperExpr(expr: SuperExpr) {
    if (this.currentClass !== ClassType.DERIVED)
      Haggis.error(expr.keyword, "Can't use 'super' outside of a derived class.");

    this.resolveLocal(expr, expr.keyword);
  }

  visitGroupingExpr(expr: GroupingExpr) {
    this.resolve(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr) {}

  visitLogicalExpr(expr: LogicalExpr) {
    this.resolve(expr.left);
    this.resolve(expr.right);
  }

  visitUnaryExpr(expr: UnaryExpr) {
    this.resolve(expr.right);
  }

  resolve(statements: Stmt[]): void;

  resolve(statement: Stmt): void;

  resolve(expr: Expr): void;

  resolve(s: Expr | Stmt | Stmt[]): void {
    if (Array.isArray(s)) {
      s.forEach((s) => this.resolve(s));
    } else {
      s.accept(this);
    }
  }

  private resolveFunction(func: FunctionStmt | ProcedureStmt, type: FunctionType) {
    if (
      this.scopes.length > 0 &&
      !(
        type === FunctionType.INITIALIZER ||
        type === FunctionType.METHOD_FUNCTION ||
        type === FunctionType.METHOD_PROCEDURE
      )
    )
      Haggis.error(func.name, `Function/Procedure declared in local scope.`);

    const enclosingFunction = this.currentFunction;
    this.currentFunction = type;

    const enclosingLoop = this.currentLoop;
    this.currentLoop = LoopType.NONE;

    this.currentReturn = false;

    this.beginScope();
    func.params.forEach((p) => {
      this.declare(p.name);
      this.define(p.name);
    });
    this.resolve(func.body);
    this.endScope();

    if (
      (this.currentFunction === FunctionType.FUNCTION ||
        this.currentFunction === FunctionType.METHOD_FUNCTION) &&
      !this.currentReturn
    )
      Haggis.error(func.name, "Must return a value from a function.");

    this.currentReturn = false;
    this.currentFunction = enclosingFunction;
    this.currentLoop = enclosingLoop;
  }

  private beginScope() {
    this.scopes.push(new Map());
  }

  private endScope() {
    const old = this.scopes.pop();
    this.checkUnusedVariables(old);
  }

  private checkUnusedVariables(scope: Map<string, VariableState>) {
    for (const [name, state] of scope.entries()) {
      if (state !== VariableState.USED)
        Haggis.error(
          new Token(TokenType.IDENTIFIER, name, undefined, 0, 0),
          `Unused local variable ${name}.`
        );
    }
  }

  private declare(name: Token) {
    let scope = this.scopes[this.scopes.length - 1];
    if (!scope) scope = this.global;

    if (scope.has(name.lexeme)) Haggis.error(name, "Already a variable with that name in this scope.");

    scope.set(name.lexeme, VariableState.DECLARED);
  }

  private define(name: Token) {
    let scope = this.scopes[this.scopes.length - 1];
    if (!scope) scope = this.global;

    scope.set(name.lexeme, VariableState.DEFINED);
  }

  private resolveLocal(expr: Expr | TypeExpr, name: Token) {
    for (let i = this.scopes.length - 1; i >= 0; i--) {
      if (this.scopes[i].has(name.lexeme)) {
        this.scopes[i].set(name.lexeme, VariableState.USED);
        this.interpreter.resolve(expr, this.scopes.length - 1 - i);
        return;
      }
    }

    if (this.global.has(name.lexeme)) {
      this.global.set(name.lexeme, VariableState.USED);
      // this.interpreter.resolve(expr, -1);
      return;
    }

    Haggis.error(name, `Undefined variable '${name.lexeme}'.`);
  }
}
