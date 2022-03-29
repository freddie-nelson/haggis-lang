import Parameter from "../ast/Parameter";
import { FunctionTypeExpr, GenericPrimitiveTypeExpr, Type, TypeExpr } from "../ast/TypeExpr";
import Interpreter from "../runtime/Interpreter";
import HaggisBoolean from "../runtime/values/HaggisBoolean";
import HaggisCallable from "../runtime/values/HaggisCallable";
import HaggisCharacter from "../runtime/values/HaggisCharacter";
import HaggisNumber from "../runtime/values/HaggisNumber";
import HaggisString from "../runtime/values/HaggisString";
import HaggisValue from "../runtime/values/HaggisValue";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";
import { NativeFunction } from "./NativeFunction";

class CBoolCallable extends HaggisCallable {
  constructor() {
    super(Type.FUNCTION);
  }

  call(interpreter: Interpreter, args: HaggisValue[]) {
    const object = <HaggisBoolean | HaggisString | HaggisNumber | HaggisCharacter>args[0];

    let boolean: boolean;
    if (object instanceof HaggisString) {
      const s = object.jsString();
      if (s === "true") boolean = true;
      else if (s === "false") boolean = false;
      else boolean = true;
    } else {
      boolean = !!object.value;
    }

    return new HaggisBoolean(boolean);
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisCallable)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(`<NATIVE_FUNCTION CBool>`);
  }
}

export default new NativeFunction(
  "CBool",
  new CBoolCallable(),
  new FunctionTypeExpr(
    "CBool",
    Type.FUNCTION,
    [
      new Parameter(
        new Token(TokenType.IDENTIFIER, "object", undefined, -1, -1),
        new GenericPrimitiveTypeExpr()
      ),
    ],
    new TypeExpr(Type.BOOLEAN)
  )
);
