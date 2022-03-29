import Parameter from "../ast/Parameter";
import { FunctionTypeExpr, GenericAllTypeExpr, Type, TypeExpr } from "../ast/TypeExpr";
import Interpreter from "../runtime/Interpreter";
import RuntimeError from "../runtime/RuntimeError";
import HaggisBoolean from "../runtime/values/HaggisBoolean";
import HaggisCallable from "../runtime/values/HaggisCallable";
import HaggisCharacter from "../runtime/values/HaggisCharacter";
import HaggisString from "../runtime/values/HaggisString";
import HaggisValue from "../runtime/values/HaggisValue";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";
import { NativeFunction } from "./NativeFunction";

class CStrCallable extends HaggisCallable {
  constructor() {
    super(Type.FUNCTION);
  }

  async call(interpreter: Interpreter, args: HaggisValue[]) {
    const char = args[0].toString().jsString()[0];

    if (!char)
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, "CChar", undefined, -1, -1),
        `Could not convert '${args[0].toString().jsString()}' to a CHARACTER.`
      );

    return new HaggisCharacter(char);
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisCallable)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(`<NATIVE_FUNCTION CChar>`);
  }
}

export default new NativeFunction(
  "CChar",
  new CStrCallable(),
  new FunctionTypeExpr(
    "CChar",
    Type.FUNCTION,
    [new Parameter(new Token(TokenType.IDENTIFIER, "object", undefined, -1, -1), new GenericAllTypeExpr())],
    new TypeExpr(Type.CHARACTER)
  )
);
