import Parameter from "../ast/Parameter";
import { FunctionTypeExpr, GenericAllTypeExpr, Type, TypeExpr } from "../ast/TypeExpr";
import Interpreter from "../runtime/Interpreter";
import HaggisBoolean from "../runtime/values/HaggisBoolean";
import HaggisCallable from "../runtime/values/HaggisCallable";
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
    return args[0].toString();
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisCallable)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(`<NATIVE_FUNCTION CStr>`);
  }
}

export default new NativeFunction(
  "CStr",
  new CStrCallable(),
  new FunctionTypeExpr(
    "CStr",
    Type.FUNCTION,
    [new Parameter(new Token(TokenType.IDENTIFIER, "object", undefined, -1, -1), new GenericAllTypeExpr())],
    new TypeExpr(Type.STRING)
  )
);
