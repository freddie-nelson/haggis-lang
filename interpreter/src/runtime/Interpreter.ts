import { INSPECT_MAX_BYTES } from "buffer";
import {
  Visitor as ExprVisitor,
  Expr,
  VariableExpr,
  ArrayExpr,
  RecordExpr,
  IndexExpr,
  CallExpr,
  GetExpr,
  ThisExpr,
  SuperExpr,
  GroupingExpr,
  LiteralExpr,
  LogicalExpr,
  BinaryExpr,
  UnaryExpr,
} from "../ast/Expr";
import Parameter from "../ast/Parameter";
import {
  Visitor as StmtVisitor,
  Stmt,
  RecordStmt,
  ClassStmt,
  ProcedureStmt,
  FunctionStmt,
  VarStmt,
  RecieveVarStmt,
  ExpressionStmt,
  IfStmt,
  WhileStmt,
  UntilStmt,
  ForStmt,
  ForEachStmt,
  SetStmt,
  RecieveStmt,
  SendStmt,
  CreateStmt,
  OpenStmt,
  CloseStmt,
  ReturnStmt,
} from "../ast/Stmt";
import { Type, TypeExpr } from "../ast/TypeExpr";
import Haggis from "../Haggis";
import ImplementationError from "../parsing/ImplementationError";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";
import Environment from "./Environment";
import ReturnError from "./ReturnError";
import RuntimeError from "./RuntimeError";
import HaggisArray from "./values/HaggisArray";
import HaggisBoolean from "./values/HaggisBoolean";
import HaggisCallable from "./values/HaggisCallable";
import HaggisCharacter from "./values/HaggisCharacter";
import HaggisClass from "./values/HaggisClass";
import HaggisClassInstance from "./values/HaggisClassInstance";
import HaggisFunction from "./values/HaggisFunction";
import HaggisInteger from "./values/HaggisInteger";
import HaggisNumber from "./values/HaggisNumber";
import { HaggisInstance } from "./values/HaggisObject";
import HaggisReal from "./values/HaggisReal";
import HaggisRecord from "./values/HaggisRecord";
import HaggisRecordInstance from "./values/HaggisRecordInstance";
import HaggisString from "./values/HaggisString";
import HaggisValue from "./values/HaggisValue";
import HaggisVoid from "./values/HaggisVoid";

export default class Interpreter implements ExprVisitor<HaggisValue>, StmtVisitor<void> {
  readonly globals = new Environment();
  readonly locals: Map<Expr | TypeExpr, number> = new Map();

  private environment = this.globals;

  interpret(statements: Stmt[]) {
    try {
      for (const s of statements) {
        this.execute(s);
      }
    } catch (error) {
      Haggis.runtimeError(<RuntimeError>error);
    }
  }

  visitRecordStmt(stmt: RecordStmt) {
    const record = new HaggisRecord(stmt.name.lexeme, stmt.fields);
    this.environment.define(stmt.name.lexeme, record);
  }

  visitClassStmt(stmt: ClassStmt) {
    let superclass = stmt.superclass
      ? <HaggisClass>this.lookUpVariable(stmt.superclass.identifier, stmt.superclass)
      : undefined;

    this.environment.define(stmt.name.lexeme, new HaggisVoid());

    if (superclass) {
      this.environment = new Environment(this.environment);
      this.environment.define("SUPER", superclass);
    }

    const klass = new HaggisClass(stmt, this.environment, superclass);

    if (superclass) this.environment = this.environment.enclosing;

    this.environment.assign(stmt.name, klass);
  }

  visitProcedureStmt(stmt: ProcedureStmt) {
    const func = new HaggisFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, func);
  }

  visitFunctionStmt(stmt: FunctionStmt) {
    const func = new HaggisFunction(stmt, this.environment);
    this.environment.define(stmt.name.lexeme, func);
  }

  visitVarStmt(stmt: VarStmt) {
    const value = this.evaluate(stmt.initializer);
    this.environment.define(stmt.name.lexeme, value);
  }

  visitRecieveVarStmt(stmt: RecieveVarStmt) {}

  visitExpressionStmt(stmt: ExpressionStmt) {
    this.evaluate(stmt.expression);
  }

  visitIfStmt(stmt: IfStmt) {
    const enter = <HaggisBoolean>this.evaluate(stmt.condition);

    if (enter.value) {
      this.executeBlock(stmt.thenBranch, new Environment(this.environment));
    } else {
      this.executeBlock(stmt.elseBranch, new Environment(this.environment));
    }
  }

  visitWhileStmt(stmt: WhileStmt) {
    while ((<HaggisBoolean>this.evaluate(stmt.condition)).value) {
      this.executeBlock(stmt.body, new Environment(this.environment));
    }
  }

  visitUntilStmt(stmt: UntilStmt) {
    do {
      this.executeBlock(stmt.body, new Environment(this.environment));
    } while (!(<HaggisBoolean>this.evaluate(stmt.condition)).value);
  }

  visitForStmt(stmt: ForStmt) {
    const lower = <HaggisNumber>this.evaluate(stmt.lower);
    const upper = <HaggisNumber>this.evaluate(stmt.upper);
    const step = <HaggisNumber>this.evaluate(stmt.step);

    let counter: HaggisNumber;
    if (lower.type === Type.REAL || upper.type === Type.REAL || step.type === Type.REAL)
      counter = new HaggisReal(lower.value);
    else counter = new HaggisInteger(lower.value);

    this.environment = new Environment(this.environment);
    this.environment.define(stmt.counter.lexeme, counter);

    while (true) {
      if (step.value >= 0) {
        if (counter.value > upper.value) break;
      } else {
        if (counter.value < upper.value) break;
      }

      this.executeBlock(stmt.body, this.environment);

      this.environment.assign(
        stmt.counter,
        counter.type === Type.REAL
          ? new HaggisReal(counter.value + step.value)
          : new HaggisInteger(counter.value + step.value)
      );
    }

    this.environment = this.environment.enclosing;
  }

  visitForEachStmt(stmt: ForEachStmt) {
    const object = <HaggisArray>this.evaluate(stmt.object);

    this.environment = new Environment(this.environment);
    this.environment.define(stmt.iterator.lexeme, new HaggisVoid());

    const len = object.length().value;
    for (let i = 0; i < len; i++) {
      this.environment.assign(stmt.iterator, object.get(new HaggisInteger(i)));

      this.executeBlock(stmt.body, this.environment);
    }

    this.environment = this.environment.enclosing;
  }

  visitSetStmt(stmt: SetStmt) {
    const value = this.evaluate(stmt.value);

    if (stmt.object instanceof GetExpr) {
      const object = <HaggisInstance>this.evaluate(stmt.object.object);
      object.set(stmt.object.name.lexeme, value);
    } else if (stmt.object instanceof IndexExpr) {
      const object = <HaggisArray>this.evaluate(stmt.object.object);
      const index = <HaggisInteger>this.evaluate(stmt.object.index);
      object.set(index, value);
    } else {
      const variable = <VariableExpr>stmt.object;

      const distance = this.locals.get(stmt.object);
      if (distance !== undefined) {
        this.environment.assignAt(distance, variable.name, value);
      } else {
        this.globals.assign(variable.name, value);
      }
    }
  }

  visitRecieveStmt(stmt: RecieveStmt) {}

  visitSendStmt(stmt: SendStmt) {}

  visitCreateStmt(stmt: CreateStmt) {}

  visitOpenStmt(stmt: OpenStmt) {}

  visitCloseStmt(stmt: CloseStmt) {}

  visitReturnStmt(stmt: ReturnStmt) {
    const value = stmt.value ? this.evaluate(stmt.value) : new HaggisVoid();
    throw new ReturnError(value);
  }

  visitVariableExpr(expr: VariableExpr) {
    return this.lookUpVariable(expr.name, expr);
  }

  visitArrayExpr(expr: ArrayExpr) {
    const items = expr.items.map((item) => this.evaluate(item));
    return new HaggisArray(items);
  }

  visitRecordExpr(expr: RecordExpr) {
    const fields: Map<string, HaggisValue> = new Map();
    expr.fields.forEach((f, i) => {
      const value = this.evaluate(expr.values[i]);
      fields.set(f.lexeme, value);
    });

    return new HaggisRecordInstance(fields);
  }

  visitIndexExpr(expr: IndexExpr) {
    const object = <HaggisArray>this.evaluate(expr.object);
    const index = <HaggisInteger>this.evaluate(expr.index);

    return object.get(index);
  }

  visitCallExpr(expr: CallExpr) {
    const func = <HaggisCallable>(<any>this.evaluate(expr.callee));
    const args = expr.args.map((a) => this.evaluate(a));

    return func.call(this, args);
  }

  visitGetExpr(expr: GetExpr) {
    const object = <HaggisClassInstance | HaggisRecordInstance>this.evaluate(expr.object);
    return object.get(expr.name.lexeme);
  }

  visitThisExpr(expr: ThisExpr) {
    return this.lookUpVariable(expr.keyword, expr);
  }

  visitSuperExpr(expr: SuperExpr) {
    const distance = this.locals.get(expr);

    const superclass = <HaggisClass>this.environment.getAt(distance, expr.keyword);
    const instance = <HaggisClassInstance>(
      this.environment.getAt(distance - 1, new Token(TokenType.IDENTIFIER, "THIS", undefined, -1, -1))
    );

    return superclass.getMethod(expr.method.lexeme).bind(instance);
  }

  visitGroupingExpr(expr: GroupingExpr) {
    return this.evaluate(expr.expression);
  }

  visitLiteralExpr(expr: LiteralExpr) {
    switch (expr.type) {
      case Type.INTEGER:
        return new HaggisInteger(expr.value);
      case Type.REAL:
        return new HaggisReal(expr.value);
      case Type.BOOLEAN:
        return new HaggisBoolean(expr.value);
      case Type.CHARACTER:
        return new HaggisCharacter(expr.value);
      case Type.STRING:
        return new HaggisString(expr.value);
      default:
        throw new ImplementationError(`Unmatched literal type during runtime, '${Type[expr.type]}'.`);
    }
  }

  visitLogicalExpr(expr: LogicalExpr) {
    const left = <HaggisBoolean>this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (left.value) return left;
    } else {
      if (!left.value) return left;
    }

    return this.evaluate(expr.right);
  }

  visitBinaryExpr(expr: BinaryExpr) {
    const left = this.evaluate(expr.left);
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.EQUAL:
        return left.equals(right);
      case TokenType.NOT_EQUAL:
        return new HaggisBoolean(!left.equals(right).value);

      case TokenType.LESS:
        return new HaggisBoolean((<HaggisNumber>left).value < (<HaggisNumber>right).value);
      case TokenType.LESS_EQUAL:
        return new HaggisBoolean((<HaggisNumber>left).value <= (<HaggisNumber>right).value);
      case TokenType.GREATER:
        return new HaggisBoolean((<HaggisNumber>left).value > (<HaggisNumber>right).value);
      case TokenType.GREATER_EQUAL:
        return new HaggisBoolean((<HaggisNumber>left).value >= (<HaggisNumber>right).value);

      case TokenType.STAR:
        if (left.type === Type.ARRAY || right.type === Type.ARRAY) {
          const array = left instanceof HaggisArray ? <HaggisArray>left : <HaggisArray>right;
          const integer = array === left ? <HaggisInteger>right : <HaggisInteger>left;

          const len = array.length().value;
          const newLen = len * integer.value;
          const items: HaggisValue[] = [];

          for (let i = 0; i < newLen; i++) {
            const index = i % len;
            const item = array.get(new HaggisInteger(index));

            items.push(item.copy());
          }

          return new HaggisArray(items);
        }

        if (left.type === Type.REAL || right.type === Type.REAL)
          return new HaggisReal((<HaggisNumber>left).value * (<HaggisNumber>right).value);
        else return new HaggisInteger((<HaggisInteger>left).value * (<HaggisInteger>right).value);
      case TokenType.PLUS:
        if (left.type === Type.REAL || right.type === Type.REAL)
          return new HaggisReal((<HaggisNumber>left).value + (<HaggisNumber>right).value);
        else return new HaggisInteger((<HaggisInteger>left).value + (<HaggisInteger>right).value);
      case TokenType.MINUS:
        if (left.type === Type.REAL || right.type === Type.REAL)
          return new HaggisReal((<HaggisNumber>left).value - (<HaggisNumber>right).value);
        else return new HaggisInteger((<HaggisInteger>left).value - (<HaggisInteger>right).value);
      case TokenType.SLASH:
        if (left.type === Type.REAL || right.type === Type.REAL)
          return new HaggisReal((<HaggisNumber>left).value / (<HaggisNumber>right).value);
        else return new HaggisInteger((<HaggisInteger>left).value / (<HaggisInteger>right).value);
      case TokenType.CARET:
        if (left.type === Type.REAL || right.type === Type.REAL)
          return new HaggisReal((<HaggisNumber>left).value ** (<HaggisNumber>right).value);
        else return new HaggisInteger((<HaggisInteger>left).value ** (<HaggisInteger>right).value);
      case TokenType.MOD:
        return new HaggisInteger((<HaggisInteger>left).value % (<HaggisInteger>right).value);

      case TokenType.AMPERSAND:
        if (left.type === Type.ARRAY && right.type === Type.ARRAY) {
          const leftArr = <HaggisArray>left;
          const rightArr = <HaggisArray>right;

          const items: HaggisValue[] = [];

          let len = leftArr.length().value;
          for (let i = 0; i < len; i++) {
            const item = leftArr.get(new HaggisInteger(i));
            items.push(item.copy());
          }

          len = rightArr.length().value;
          for (let i = 0; i < len; i++) {
            const item = rightArr.get(new HaggisInteger(i));
            items.push(item.copy());
          }

          return new HaggisArray(items);
        }

        return new HaggisString(left.toString().jsString() + right.toString().jsString());
      default:
        throw new ImplementationError(
          `Binary operator not matched at runtime, '${TokenType[expr.operator.type]}'.`
        );
    }
  }

  visitUnaryExpr(expr: UnaryExpr) {
    const right = this.evaluate(expr.right);

    switch (expr.operator.type) {
      case TokenType.NOT:
        return new HaggisBoolean(!(<HaggisBoolean>right).value);
      case TokenType.MINUS:
        if (right.type === Type.REAL) return new HaggisReal(-(<HaggisReal>right).value);
        else return new HaggisInteger(-(<HaggisInteger>right).value);
      default:
        throw new ImplementationError(
          `Unary operator not matched at runtime, '${TokenType[expr.operator.type]}'.`
        );
    }
  }

  execute(stmt: Stmt) {
    return stmt.accept(this);
  }

  executeBlock(statements: Stmt[], env: Environment) {
    const previous = this.environment;

    try {
      this.environment = env;

      statements.forEach((s) => {
        this.execute(s);
      });
    } catch (error) {
      throw error;
    } finally {
      this.environment = previous;
    }
  }

  evaluate(expression: Expr): HaggisValue {
    return expression.accept(this);
  }

  resolve(expr: Expr | TypeExpr, depth: number) {
    this.locals.set(expr, depth);
  }

  private lookUpVariable(name: Token, expr: Expr | TypeExpr): HaggisValue {
    if (this.locals.has(expr)) {
      const distance = this.locals.get(expr);
      return this.environment.getAt(distance, name);
    } else if (this.globals.get(name)) {
      return this.globals.get(name);
    }

    // Unreachable
    throw new ImplementationError(`Unresolved variable '${name.lexeme}' during runtime.`);
  }
}
