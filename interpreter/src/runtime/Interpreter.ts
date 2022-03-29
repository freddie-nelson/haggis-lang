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
import {
  Visitor as StmtVisitor,
  Stmt,
  RecordStmt,
  ClassStmt,
  ProcedureStmt,
  FunctionStmt,
  VarStmt,
  ReceiveVarStmt,
  ExpressionStmt,
  IfStmt,
  WhileStmt,
  UntilStmt,
  ForStmt,
  ForEachStmt,
  SetStmt,
  ReceiveStmt,
  SendStmt,
  CreateStmt,
  OpenStmt,
  CloseStmt,
  ReturnStmt,
} from "../ast/Stmt";
import { Type, TypeExpr } from "../ast/TypeExpr";
import Haggis from "../Haggis";
import { NATIVE_FUNCTIONS } from "../natives/natives";
import ImplementationError from "../parsing/ImplementationError";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";
import Environment from "./Environment";
import { InputDevice, IODevices, OutputDevice } from "./IO/IODevices";
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

export default class Interpreter implements ExprVisitor<Promise<HaggisValue>>, StmtVisitor<void> {
  readonly globals = new Environment();
  readonly locals: Map<Expr | TypeExpr, number> = new Map();

  private environment = this.globals;
  private io: IODevices;

  constructor(io: IODevices) {
    this.io = io;

    NATIVE_FUNCTIONS.forEach((f) => this.globals.define(f.name, f.func));
  }

  async interpret(statements: Stmt[]) {
    try {
      const timer = performance.now();

      for (const s of statements) {
        await this.execute(s);
      }

      this.io.DISPLAY.send(new HaggisString(""), "DISPLAY");
      this.io.DISPLAY.send(
        new HaggisString(
          `Finished executing in ${String((performance.now() - timer) / 1000).substr(0, 6)}s.`
        ),
        "DISPLAY"
      );
    } catch (error) {
      if (error instanceof RuntimeError) Haggis.runtimeError(error);
      else throw error;
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

  async visitVarStmt(stmt: VarStmt) {
    if (stmt.name instanceof GetExpr) {
      const set = new SetStmt(stmt.name.name, stmt.name, stmt.initializer);
      await this.execute(set);
    } else {
      const value = await this.evaluate(stmt.initializer);
      this.environment.define(stmt.name.lexeme, value);
    }
  }

  async visitReceiveVarStmt(stmt: ReceiveVarStmt) {
    if (stmt.name instanceof GetExpr) {
      const set = new ReceiveStmt(stmt.name.name, stmt.name, stmt.sender);
      await this.execute(set);
    } else {
      let value: HaggisValue;

      if (stmt.sender instanceof Expr) {
        const sender = <HaggisString>await this.evaluate(stmt.sender);
        value = await this.io.fileHandler.receive(sender.jsString());
      } else {
        const device = <InputDevice<HaggisValue>>this.io[stmt.sender.lexeme];
        value = await device.receive(stmt.sender.lexeme);
      }

      this.environment.define(stmt.name.lexeme, value);
    }
  }

  async visitExpressionStmt(stmt: ExpressionStmt) {
    await this.evaluate(stmt.expression);
  }

  async visitIfStmt(stmt: IfStmt) {
    const enter = <HaggisBoolean>await this.evaluate(stmt.condition);

    if (enter.value) {
      await this.executeBlock(stmt.thenBranch, new Environment(this.environment));
    } else if (stmt.elseBranch) {
      await this.executeBlock(stmt.elseBranch, new Environment(this.environment));
    }
  }

  async visitWhileStmt(stmt: WhileStmt) {
    while ((<HaggisBoolean>await this.evaluate(stmt.condition)).value) {
      await this.executeBlock(stmt.body, new Environment(this.environment));
    }
  }

  async visitUntilStmt(stmt: UntilStmt) {
    do {
      await this.executeBlock(stmt.body, new Environment(this.environment));
    } while (!(<HaggisBoolean>await this.evaluate(stmt.condition)).value);
  }

  async visitForStmt(stmt: ForStmt) {
    const lower = <HaggisNumber>await this.evaluate(stmt.lower);
    const upper = <HaggisNumber>await this.evaluate(stmt.upper);
    const step = <HaggisNumber>await this.evaluate(stmt.step);

    let counter: HaggisNumber;
    if (lower.type === Type.REAL || upper.type === Type.REAL || step.type === Type.REAL)
      counter = new HaggisReal(lower.value);
    else counter = new HaggisInteger(lower.value);

    this.environment = new Environment(this.environment);
    this.environment.define(stmt.counter.lexeme, counter);

    while (true) {
      counter = <HaggisNumber>this.environment.get(stmt.counter);

      if (step.value >= 0) {
        if (counter.value > upper.value) break;
      } else {
        if (counter.value < upper.value) break;
      }

      await this.executeBlock(stmt.body, this.environment);

      this.environment.assign(
        stmt.counter,
        counter.type === Type.REAL
          ? new HaggisReal(counter.value + step.value)
          : new HaggisInteger(counter.value + step.value)
      );
    }

    this.environment = this.environment.enclosing;
  }

  async visitForEachStmt(stmt: ForEachStmt) {
    const object = <HaggisArray>await this.evaluate(stmt.object);

    this.environment = new Environment(this.environment);
    this.environment.define(stmt.iterator.lexeme, new HaggisVoid());

    const len = object.length().value;
    for (let i = 0; i < len; i++) {
      this.environment.assign(stmt.iterator, object.get(new HaggisInteger(i), stmt.iterator).copy());

      await this.executeBlock(stmt.body, this.environment);
    }

    this.environment = this.environment.enclosing;
  }

  async visitSetStmt(stmt: SetStmt) {
    const value = await this.evaluate(stmt.value);
    this.setObject(stmt.object, value);
  }

  async visitReceiveStmt(stmt: ReceiveStmt) {
    if (stmt.sender instanceof Expr) {
      const sender = <HaggisString>await this.evaluate(stmt.sender);
      const value = await this.io.fileHandler.receive(sender.jsString());
      await this.setObject(stmt.object, value.copy());
    } else {
      const device = <InputDevice<HaggisValue>>this.io[stmt.sender.lexeme];
      const value = await device.receive(stmt.sender.lexeme);
      await this.setObject(stmt.object, value.copy());
    }
  }

  private async setObject(object: Expr, value: HaggisValue) {
    if (object instanceof GetExpr) {
      const instance = <HaggisInstance>await this.evaluate(object.object);
      instance.set(object.name.lexeme, value);
      return;
    } else if (object instanceof IndexExpr) {
      const array = <HaggisArray>await this.evaluate(object.object);
      const index = <HaggisInteger>await this.evaluate(object.index);
      array.set(index, value, object.bracket);
      return;
    } else if (object instanceof VariableExpr) {
      const distance = this.locals.get(object);
      if (distance !== undefined) {
        this.environment.assignAt(distance, object.name, value);
      } else {
        this.globals.assign(object.name, value);
      }
      return;
    }

    throw new ImplementationError("Invalid assignment target during runtime.");
  }

  async visitSendStmt(stmt: SendStmt) {
    const value = await this.evaluate(stmt.value);

    if (stmt.dest instanceof Expr) {
      const dest = <HaggisString>await this.evaluate(stmt.dest);
      await this.io.fileHandler.send(<HaggisString>value, dest.jsString());
    } else {
      const dest = <OutputDevice<HaggisValue>>this.io[stmt.dest.lexeme];
      await dest.send(value, stmt.dest.lexeme);
    }
  }

  async visitCreateStmt(stmt: CreateStmt) {
    const file = <HaggisString>await this.evaluate(stmt.file);
    this.io.fileHandler.create(file);
  }

  async visitOpenStmt(stmt: OpenStmt) {
    const file = <HaggisString>await this.evaluate(stmt.file);
    this.io.fileHandler.open(file);
  }

  async visitCloseStmt(stmt: CloseStmt) {
    const file = <HaggisString>await this.evaluate(stmt.file);
    this.io.fileHandler.close(file);
  }

  async visitReturnStmt(stmt: ReturnStmt) {
    const value = stmt.value ? await this.evaluate(stmt.value) : new HaggisVoid();
    throw new ReturnError(value);
  }

  async visitVariableExpr(expr: VariableExpr) {
    return this.lookUpVariable(expr.name, expr);
  }

  async visitArrayExpr(expr: ArrayExpr) {
    const items = await Promise.all(expr.items.map((item) => this.evaluate(item)));
    return new HaggisArray(items);
  }

  async visitRecordExpr(expr: RecordExpr) {
    const fields: Map<string, HaggisValue> = new Map();

    for (let i = 0; i < expr.fields.length; i++) {
      const f = expr.fields[i];
      const value = await this.evaluate(expr.values[i]);
      fields.set(f.lexeme, value);
    }

    return new HaggisRecordInstance(fields);
  }

  async visitIndexExpr(expr: IndexExpr) {
    const object = <HaggisArray>await this.evaluate(expr.object);
    const index = <HaggisInteger>await this.evaluate(expr.index);

    return object.get(index, expr.bracket);
  }

  async visitCallExpr(expr: CallExpr) {
    const func = <HaggisCallable>(<any>await this.evaluate(expr.callee));
    const args = await Promise.all(expr.args.map((a) => this.evaluate(a)));

    return await func.call(this, args);
  }

  async visitGetExpr(expr: GetExpr) {
    const object = <HaggisClassInstance | HaggisRecordInstance>await this.evaluate(expr.object);
    return object.get(expr.name.lexeme);
  }

  async visitThisExpr(expr: ThisExpr) {
    return this.lookUpVariable(expr.keyword, expr);
  }

  async visitSuperExpr(expr: SuperExpr) {
    const distance = this.locals.get(expr);

    const superclass = <HaggisClass>this.environment.getAt(distance, expr.keyword);
    const instance = <HaggisClassInstance>(
      this.environment.getAt(distance - 1, new Token(TokenType.IDENTIFIER, "THIS", undefined, -1, -1))
    );

    return superclass.getMethod(expr.method.lexeme).bind(instance);
  }

  async visitGroupingExpr(expr: GroupingExpr) {
    return await this.evaluate(expr.expression);
  }

  async visitLiteralExpr(expr: LiteralExpr) {
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

  async visitLogicalExpr(expr: LogicalExpr) {
    const left = <HaggisBoolean>await this.evaluate(expr.left);

    if (expr.operator.type === TokenType.OR) {
      if (left.value) return left;
    } else {
      if (!left.value) return left;
    }

    return await this.evaluate(expr.right);
  }

  async visitBinaryExpr(expr: BinaryExpr) {
    const left = await this.evaluate(expr.left);
    const right = await this.evaluate(expr.right);

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
          const leftIsArray = left instanceof HaggisArray;

          let array = leftIsArray ? <HaggisArray>left : <HaggisArray>right;
          const integer = leftIsArray ? <HaggisInteger>right : <HaggisInteger>left;

          const len = array.length().value;
          const newLen = len * integer.value;
          const items: HaggisValue[] = [];

          for (let i = 0; i < newLen; i++) {
            const index = i % len;
            const item = array.get(new HaggisInteger(index), expr.operator);

            items.push(item.copy());

            if (index === len - 1) {
              array = leftIsArray
                ? <HaggisArray>await this.evaluate(expr.left)
                : <HaggisArray>await this.evaluate(expr.right);
            }
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
            const item = leftArr.get(new HaggisInteger(i), expr.operator);
            items.push(item.copy());
          }

          len = rightArr.length().value;
          for (let i = 0; i < len; i++) {
            const item = rightArr.get(new HaggisInteger(i), expr.operator);
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

  async visitUnaryExpr(expr: UnaryExpr) {
    const right = await this.evaluate(expr.right);

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

  async executeBlock(statements: Stmt[], env: Environment) {
    const previous = this.environment;

    try {
      this.environment = env;

      for (const s of statements) {
        await this.execute(s);
      }
    } catch (error) {
      throw error;
    } finally {
      this.environment = previous;
    }
  }

  async evaluate(expression: Expr): Promise<HaggisValue> {
    const val = await expression.accept(this);
    return val.copy();
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
