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
import {
  ClassStmt,
  CloseStmt,
  CreateStmt,
  ExpressionStmt,
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
  Visitor as StmtVisitor,
  WhileStmt,
} from "../ast/Stmt";
import {
  ArrayTypeExpr,
  ClassInstanceTypeExpr,
  ClassTypeExpr,
  FunctionTypeExpr,
  IdentifierTypeExpr,
  matchTypeExpr,
  RecordInstanceTypeExpr,
  RecordTypeExpr,
  TypeExpr,
  Type,
} from "../ast/TypeExpr";
import Haggis from "Haggis";
import { NativeFunction } from "../natives/NativeFunction";
import { NATIVE_FUNCTIONS } from "../natives/natives";
import ImplementationError from "../parsing/ImplementationError";
import Interpreter from "../runtime/Interpreter";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";
import { canCast } from "./casting";
import { InputEntities, OutputEntities } from "./SystemEntities";
import TypeError from "./TypeError";

export default class TypeChecker implements ExprVisitor<TypeExpr>, StmtVisitor<void> {
  private readonly casts: Map<Stmt, NativeFunction>;
  private readonly locals: Map<Expr | TypeExpr, number>;

  private readonly global: Map<string, TypeExpr> = new Map();
  private readonly scopes: Map<string, TypeExpr>[] = [];

  private currentClass: ClassTypeExpr;
  private declaredFields: Map<string, true>;

  private currentFunction: FunctionTypeExpr;

  constructor(interpreter: Interpreter) {
    this.casts = interpreter.casts;
    this.locals = interpreter.locals;

    NATIVE_FUNCTIONS.forEach((f) => this.global.set(f.name, f.type));
  }

  typecheck(statements: Stmt[]) {
    try {
      this.check(statements);
    } catch (error) {
      if (error instanceof TypeError) {
        return;
      }

      throw error;
    }
  }

  visitRecordStmt(stmt: RecordStmt) {
    const type = new RecordTypeExpr(stmt.name.lexeme, stmt.fields);
    this.declare(stmt.name, type);
  }

  visitClassStmt(stmt: ClassStmt) {
    let superclass: ClassTypeExpr;
    if (stmt.superclass) {
      superclass = <ClassTypeExpr>this.resolveVariable(stmt.superclass.identifier, stmt.superclass);
      if (!(superclass instanceof ClassTypeExpr))
        this.error(
          stmt.superclass.identifier,
          `Superclass identifier '${stmt.superclass.identifier}' does not refer to a class.`
        );
    }

    const klass = new ClassTypeExpr(stmt, superclass);
    this.declare(stmt.name, klass);
    this.currentClass = klass;
    this.declaredFields = new Map();

    stmt.fields.forEach((f) => {
      if (superclass && superclass.hasField(f.name.lexeme))
        this.error(f.name, `Sub and super class have duplicate fields '${f.name.lexeme}'.`);
    });

    if (superclass) {
      this.beginScope();
      this.scopes[this.scopes.length - 1].set("SUPER", superclass);
    }

    this.beginScope();
    this.scopes[this.scopes.length - 1].set("THIS", new ClassInstanceTypeExpr(klass));

    const allFields: Parameter[] = [...klass.fieldsArr];
    let curr: ClassTypeExpr = klass.superclass;
    while (curr) {
      allFields.push(...curr.fieldsArr);
      curr = curr.superclass;
    }

    if (stmt.initializer) {
      this.check(stmt.initializer);
    } else {
      allFields.forEach((f) => {
        this.declaredFields.set(f.name.lexeme, true);
      });
    }

    stmt.methods.forEach((m) => {
      if (m instanceof ProcedureStmt) {
        const type = new FunctionTypeExpr(m.name.lexeme, Type.PROCEDURE, m.params);
        this.checkFunction(m, type);
      } else {
        const type = new FunctionTypeExpr(m.name.lexeme, Type.FUNCTION, m.params, m.returnType);
        this.checkFunction(m, type);
      }
    });

    stmt.methods.forEach((m) => {
      if (!superclass) return;

      const isOverride = superclass.hasMethod(m.name.lexeme);

      if (!isOverride && stmt.overrides.has(m))
        this.error(m.name, `Method '${m.name.lexeme}' has no super method to override.`);

      if (!isOverride) return;

      const method = superclass.getMethod(m.name.lexeme);

      if (!stmt.overrides.has(m))
        this.error(m.name, `Method '${m.name.lexeme}' needs to be specified as an override method.`);

      if (!method.matchSignatures(klass.getMethod(m.name.lexeme)))
        this.error(m.name, `Method '${m.name.lexeme}' in sub and super do not have matching signatures.`);
    });

    this.endScope();
    if (stmt.superclass) this.endScope();

    allFields.forEach((f) => {
      if (!this.declaredFields.has(f.name.lexeme))
        this.error(f.name, "Class constructor must declare all class fields.");
    });

    this.currentClass = undefined;
    this.declaredFields = undefined;
  }

  visitProcedureStmt(stmt: ProcedureStmt) {
    const type = new FunctionTypeExpr(stmt.name.lexeme, Type.PROCEDURE, stmt.params);

    this.declare(stmt.name, type);
    this.checkFunction(stmt, type);
  }

  visitFunctionStmt(stmt: FunctionStmt) {
    const type = new FunctionTypeExpr(stmt.name.lexeme, Type.FUNCTION, stmt.params, stmt.returnType);

    this.declare(stmt.name, type);
    this.checkFunction(stmt, type);
  }

  visitVarStmt(stmt: VarStmt) {
    const initializer = this.type(stmt.initializer);
    const type = this.variableType(stmt, initializer);

    if (stmt.name instanceof Token) {
      this.declare(stmt.name, type);
    }
  }

  visitReceiveVarStmt(stmt: ReceiveVarStmt) {
    const token = stmt.name instanceof GetExpr ? stmt.name.name : stmt.name;

    let initializer: TypeExpr;
    if (stmt.sender instanceof Expr) {
      const sender = this.type(stmt.sender);
      if (!this.isString(sender)) this.error(token, "Sender expression must be a string.");

      initializer = new TypeExpr(Type.STRING);
    } else {
      const entity = InputEntities[stmt.sender.lexeme];
      if (!entity) this.error(stmt.sender, `No input device by the name of '${stmt.sender.lexeme}' exists.`);

      initializer = entity.type;
    }

    const type = this.variableType(stmt, initializer);
    if (stmt.name instanceof Token) {
      this.declare(stmt.name, type);
    }
  }

  private variableType(stmt: VarStmt | ReceiveVarStmt, initializer: TypeExpr) {
    let type = stmt.type;
    if (!stmt.type) type = initializer;

    if (stmt.name instanceof GetExpr) {
      type = this.type(stmt.name);
      this.declaredFields.set(stmt.name.name.lexeme, true);
    }

    if (type.type === Type.IDENTIFER) {
      const klassOrRecord = this.resolveVariable((<IdentifierTypeExpr>type).identifier, type);
      if (!this.isObject(klassOrRecord))
        this.error((<IdentifierTypeExpr>type).identifier, `Referenced user type is not a record or class.`);

      if (klassOrRecord instanceof ClassTypeExpr) {
        type = new ClassInstanceTypeExpr(klassOrRecord);
      } else if (klassOrRecord instanceof RecordTypeExpr) {
        type = new RecordInstanceTypeExpr(klassOrRecord);
      } else {
        // Unreachable
        throw new ImplementationError("Referenced user type was not a ClassTypeExpr or RecordTypeExpr.");
      }
    }

    const token = stmt.name instanceof GetExpr ? stmt.name.name : stmt.name;

    if (!matchTypeExpr(type, initializer)) {
      const cast = canCast(initializer, type);
      if (cast) {
        this.cast(stmt, cast);
      } else {
        this.error(token, "Variable type and initializer type do not match.");
      }
    }

    if (type.type === Type.FUNCTION || type.type === Type.PROCEDURE)
      this.error(token, "Functions and procedures cannot be assigned to variables.");

    if (type.type === Type.CLASS || type.type === Type.RECORD || type.type === Type.IDENTIFER)
      this.error(token, "Record and class declarations cannot be assigned to variables.");

    if (type.type === Type.VOID) this.error(token, "VOID cannot be assigned to a variable.");

    return type;
  }

  visitExpressionStmt(stmt: ExpressionStmt) {
    this.type(stmt.expression);
  }

  visitIfStmt(stmt: IfStmt) {
    const condition = this.type(stmt.condition);
    if (!this.isBoolean(condition)) this.error(stmt.keyword, "If condition is not a boolean.");

    this.check(stmt.thenBranch);
    if (stmt.elseBranch) this.check(stmt.elseBranch);
  }

  visitWhileStmt(stmt: WhileStmt) {
    const condition = this.type(stmt.condition);
    if (!this.isBoolean(condition)) this.error(stmt.keyword, "Loop condition is not a boolean.");

    this.beginScope();
    this.check(stmt.body);
    this.endScope();
  }

  visitUntilStmt(stmt: UntilStmt) {
    this.beginScope();
    this.check(stmt.body);
    this.endScope();

    const condition = this.type(stmt.condition);
    if (!this.isBoolean(condition)) this.error(stmt.keyword, "Loop condition is not a boolean.");
  }

  visitForStmt(stmt: ForStmt) {
    const lower = this.type(stmt.lower);
    const upper = this.type(stmt.upper);
    const step = this.type(stmt.step);

    if (!this.isNumber(lower)) this.error(stmt.keyword, "Expression for lower bound is not a number.");
    if (!this.isNumber(upper)) this.error(stmt.keyword, "Expression for upper bound is not a number.");
    if (!this.isNumber(step)) this.error(stmt.keyword, "Expression for step is not a number.");

    this.beginScope();

    let counterType = new TypeExpr(Type.INTEGER);
    if (this.isReal(lower) || this.isReal(upper) || this.isReal(step)) counterType = new TypeExpr(Type.REAL);

    this.declare(stmt.counter, counterType);

    this.check(stmt.body);

    this.endScope();
  }

  visitForEachStmt(stmt: ForEachStmt) {
    const object = <ArrayTypeExpr>this.type(stmt.object);
    if (!this.isArray(object) && !this.isString(object))
      this.error(stmt.keyword, "Object is not an array or string.");

    this.beginScope();

    this.declare(stmt.iterator, object.itemType);

    this.check(stmt.body);

    this.endScope();
  }

  visitSetStmt(stmt: SetStmt) {
    const object = this.type(stmt.object);
    const value = this.type(stmt.value);

    if (object.type === Type.CLASS || object.type === Type.RECORD)
      this.error(stmt.keyword, "Cannot assign to a record or class declaration.");

    if (
      this.currentClass &&
      object.type === Type.CLASS_INSTANCE &&
      object === this.resolveVariable(new Token(TokenType.IDENTIFIER, "THIS", undefined, -1, -1), stmt.object)
    )
      this.error(stmt.keyword, "Cannot assign to 'THIS'.");

    if (!matchTypeExpr(object, value)) {
      const cast = canCast(value, object);
      if (cast) {
        this.cast(stmt, cast);
      } else {
        this.error(stmt.keyword, "Assignment target and value type do not match.");
      }
    }
  }

  visitReceiveStmt(stmt: ReceiveStmt) {
    const object = this.type(stmt.object);

    if (object.type === Type.CLASS || object.type === Type.RECORD)
      this.error(stmt.keyword, "Cannot assign to a record or class declaration.");

    if (
      this.currentClass &&
      object.type === Type.CLASS_INSTANCE &&
      object === this.resolveVariable(new Token(TokenType.IDENTIFIER, "THIS", undefined, -1, -1), stmt.object)
    )
      this.error(stmt.keyword, "Cannot assign to 'THIS'.");

    if (stmt.sender instanceof Expr) {
      const sender = this.type(stmt.sender);
      if (!this.isString(sender)) this.error(stmt.keyword, "Sender expression must be a string.");
    } else {
      const entity = InputEntities[stmt.sender.lexeme];
      if (!entity) this.error(stmt.sender, `No input device by the name of '${stmt.sender.lexeme}' exists.`);
      if (!matchTypeExpr(entity.type, object)) {
        const cast = canCast(entity.type, object);
        if (cast) {
          this.cast(stmt, cast);
        } else {
          this.error(stmt.sender, "The sender's output type and the receiving object's type do not match.");
        }
      }
    }
  }

  visitSendStmt(stmt: SendStmt) {
    const value = this.type(stmt.value);

    if (stmt.dest instanceof Expr) {
      const dest = this.type(stmt.dest);
      if (!this.isString(dest)) this.error(stmt.keyword, "Destination expression must be a string.");
    } else {
      const entity = OutputEntities[stmt.dest.lexeme];
      if (!entity) this.error(stmt.dest, `No output device by the name of '${stmt.dest.lexeme}' exists.`);
      if (!matchTypeExpr(entity.type, value))
        this.error(stmt.dest, "The output device's input type and the value's type do not match.");
    }
  }

  visitCreateStmt(stmt: CreateStmt) {
    const file = this.type(stmt.file);
    if (!this.isString(file)) this.error(stmt.keyword, "File expression must be a string.");
  }

  visitOpenStmt(stmt: OpenStmt) {
    const file = this.type(stmt.file);
    if (!this.isString(file)) this.error(stmt.keyword, "File expression must be a string.");
  }

  visitCloseStmt(stmt: CloseStmt) {
    const file = this.type(stmt.file);
    if (!this.isString(file)) this.error(stmt.keyword, "File expression must be a string.");
  }

  visitReturnStmt(stmt: ReturnStmt) {
    let type = new TypeExpr(Type.VOID);
    if (stmt.value) type = this.type(stmt.value);

    if (!matchTypeExpr(this.currentFunction.returnType, type))
      this.error(stmt.keyword, "Return value does not match function's return type.");
  }

  visitVariableExpr(expr: VariableExpr) {
    return this.resolveVariable(expr.name, expr);
  }

  visitArrayExpr(expr: ArrayExpr) {
    const types = expr.items.map((v) => this.type(v));
    types.forEach((t) => {
      if (!matchTypeExpr(types[0], t)) this.error(expr.startBracket, "Array item types do not match.");
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
    if (!this.isArray(type) && !this.isString(type)) this.error(expr.bracket, "Object cannot be indexed.");

    const index = this.type(expr.index);
    if (!this.isInteger(index)) this.error(expr.bracket, "Index expression must be an integer.");

    if (type instanceof ArrayTypeExpr) {
      return type.itemType;
    } else if (this.isString(type)) {
      return new TypeExpr(Type.CHARACTER);
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
        if (
          matchTypeExpr(left, right) ||
          matchTypeExpr(right, left) ||
          (this.isNumber(left) && this.isNumber(right))
        )
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
          this.error(expr.operator, "Left and right expressions must be numbers.");

        if (this.isReal(left) || this.isReal(right)) return new TypeExpr(Type.REAL);
        else return new TypeExpr(Type.INTEGER);
      case TokenType.MOD:
        if (!this.isInteger(left) || !this.isInteger(right))
          this.error(expr.operator, "Left and right expressions must be integers.");

        return new TypeExpr(Type.INTEGER);
      case TokenType.AMPERSAND:
        if (this.isArray(left) && this.isArray(right)) {
          if (!matchTypeExpr(left, right))
            this.error(expr.operator, "Arrays must have matching types for concatenation.");

          return left;
        }

        return new TypeExpr(Type.STRING);
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
      const klass = type.klass;
      const prop = expr.name.lexeme;

      if (!klass.hasProperty(prop))
        this.error(expr.name, `Class instance does not contain the property '${prop}'.`);

      if (this.currentClass) {
        if (klass.isSuperOf(this.currentClass) || klass === this.currentClass) {
          return klass.getProperty(prop);
        }
      }

      if (klass.hasField(prop))
        this.error(expr.name, `Field '${prop}' cannot be accessed from the current scope.`);

      return klass.getMethod(prop);
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
      this.error(expr.method, `Method '${expr.method.lexeme}' does not exist on '${superclass.name}'.`);

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

  private check(statements: Stmt[]): void;

  private check(statement: Stmt): void;

  private check(s: Stmt | Stmt[]): void {
    if (Array.isArray(s)) {
      s.forEach((s) => this.check(s));
    } else {
      s.accept(this);
    }
  }

  private type(e: Expr): TypeExpr {
    return e.accept(this);
  }

  private checkFunction(stmt: FunctionStmt | ProcedureStmt, type: FunctionTypeExpr) {
    this.currentFunction = type;
    this.beginScope();

    stmt.params.forEach((p) => this.declare(p.name, p.type));
    this.check(stmt.body);

    this.endScope();
    this.currentFunction = undefined;
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

  private resolveVariable(name: Token, expr: Expr | TypeExpr): TypeExpr {
    if (this.locals.has(expr)) {
      const distance = this.locals.get(expr);
      const scope = this.scopes[this.scopes.length - 1 - distance];

      return scope.get(name.lexeme);
    } else if (this.global.has(name.lexeme)) {
      return this.global.get(name.lexeme);
    }

    // Unreachable
    throw new ImplementationError(`Unresolved variable '${name.lexeme}' in type checker.`);
  }

  private cast(stmt: Stmt, cast: NativeFunction) {
    this.casts.set(stmt, cast);
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

  private isPrimitive(type: TypeExpr): boolean {
    return this.isString(type) || this.isCharacter(type) || this.isNumber(type) || this.isBoolean(type);
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
