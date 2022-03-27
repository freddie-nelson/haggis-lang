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
import { Visitor as StmtVisitor, Stmt, RecordStmt, ClassStmt, ProcedureStmt } from "../ast/Stmt";
import { Type, TypeExpr } from "../ast/TypeExpr";
import Haggis from "../Haggis";
import ImplementationError from "../parsing/ImplementationError";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";
import Environment from "./Environment";
import RuntimeError from "./RuntimeError";
import HaggisArray from "./values/HaggisArray";
import HaggisBoolean from "./values/HaggisBoolean";
import HaggisCallable from "./values/HaggisCallable";
import HaggisCharacter from "./values/HaggisCharacter";
import HaggisClass from "./values/HaggisClass";
import HaggisClassInstance from "./values/HaggisClassInstance";
import HaggisInteger from "./values/HaggisInteger";
import HaggisNumber from "./values/HaggisNumber";
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
