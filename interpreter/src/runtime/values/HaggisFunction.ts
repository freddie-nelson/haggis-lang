import { FunctionStmt, ProcedureStmt } from "../../ast/Stmt";
import { Type } from "../../ast/TypeExpr";
import Token from "../../scanning/Token";
import { TokenType } from "../../scanning/TokenType";
import Environment from "../Environment";
import Interpreter from "../Interpreter";
import ReturnError from "../ReturnError";
import HaggisBoolean from "./HaggisBoolean";
import HaggisCallable from "./HaggisCallable";
import HaggisClass from "./HaggisClass";
import HaggisClassInstance from "./HaggisClassInstance";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";
import HaggisVoid from "./HaggisVoid";

export default class HaggisFunction extends HaggisValue implements HaggisCallable {
  private readonly declaration: FunctionStmt | ProcedureStmt;
  private readonly closure: Environment;

  private readonly isInitializer: boolean;

  constructor(declaration: FunctionStmt | ProcedureStmt, closure: Environment, isInitializer = false) {
    super(declaration instanceof ProcedureStmt ? Type.PROCEDURE : Type.FUNCTION);

    this.declaration = declaration;
    this.closure = closure;

    this.isInitializer = isInitializer;
  }

  bind(instance: HaggisClassInstance) {
    const env = new Environment(this.closure);
    env.define("THIS", instance);

    return new HaggisFunction(this.declaration, env, this.isInitializer);
  }

  call(interpreter: Interpreter, args: HaggisValue[]): HaggisValue {
    const env = new Environment(this.closure);
    this.declaration.params.forEach((p, i) => {
      env.define(p.name.lexeme, args[i]);
    });

    try {
      interpreter.executeBlock(this.declaration.body, env);
    } catch (error) {
      if (error instanceof ReturnError) {
        if (this.isInitializer)
          return this.closure.get(new Token(TokenType.IDENTIFIER, "THIS", undefined, -1, -1));

        return error.value;
      } else {
        throw error;
      }
    }

    if (this.isInitializer)
      return this.closure.get(new Token(TokenType.IDENTIFIER, "THIS", undefined, -1, -1));

    return new HaggisVoid();
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisFunction)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    const type = Type[this.type];
    return new HaggisString(`<${type} ${this.declaration.name.lexeme}>`);
  }
}
