import Parameter from "../ast/Parameter";
import { FunctionTypeExpr, GenericTypeExpr, Type, TypeExpr } from "../ast/TypeExpr";
import Interpreter from "../runtime/Interpreter";
import HaggisArray from "../runtime/values/HaggisArray";
import HaggisBoolean from "../runtime/values/HaggisBoolean";
import HaggisCallable from "../runtime/values/HaggisCallable";
import HaggisString from "../runtime/values/HaggisString";
import HaggisValue from "../runtime/values/HaggisValue";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";
import { NativeFunction } from "./NativeFunction";

class LengthCallable extends HaggisCallable {
  constructor() {
    super(Type.FUNCTION);
  }

  call(interpreter: Interpreter, args: HaggisValue[]) {
    const object = <HaggisArray | HaggisString>args[0];
    return object.length();
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisCallable)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(`<FUNCTION Length>`);
  }
}

export default new NativeFunction(
  "Length",
  new LengthCallable(),
  new FunctionTypeExpr(
    "Length",
    Type.FUNCTION,
    [
      new Parameter(
        new Token(TokenType.IDENTIFIER, "object", undefined, -1, -1),
        new GenericTypeExpr(Type.STRING, Type.ARRAY)
      ),
    ],
    new TypeExpr(Type.INTEGER)
  )
);
