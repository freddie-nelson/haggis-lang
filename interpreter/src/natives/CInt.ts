import Parameter from "../ast/Parameter";
import { FunctionTypeExpr, GenericPrimitiveTypeExpr, GenericTypeExpr, Type, TypeExpr } from "../ast/TypeExpr";
import Interpreter from "../runtime/Interpreter";
import RuntimeError from "../runtime/RuntimeError";
import HaggisArray from "../runtime/values/HaggisArray";
import HaggisBoolean from "../runtime/values/HaggisBoolean";
import HaggisCallable from "../runtime/values/HaggisCallable";
import HaggisCharacter from "../runtime/values/HaggisCharacter";
import HaggisInteger from "../runtime/values/HaggisInteger";
import HaggisNumber from "../runtime/values/HaggisNumber";
import HaggisString from "../runtime/values/HaggisString";
import HaggisValue from "../runtime/values/HaggisValue";
import Token from "../scanning/Token";
import { TokenType } from "../scanning/TokenType";
import { NativeFunction } from "./NativeFunction";

class CIntCallable extends HaggisCallable {
  constructor() {
    super(Type.FUNCTION);
  }

  async call(interpreter: Interpreter, args: HaggisValue[]) {
    const object = <HaggisBoolean | HaggisString | HaggisNumber | HaggisCharacter>args[0];

    let number: number;
    if (object instanceof HaggisString) {
      number = Number(object.jsString());
    } else {
      number = Number(object.value);
    }

    if (isNaN(number))
      throw new RuntimeError(
        new Token(TokenType.IDENTIFIER, "CInt", undefined, -1, -1),
        `Could not convert '${object.toString().jsString()}' to an INTEGER.`
      );

    return new HaggisInteger(number);
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisCallable)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(`<NATIVE_FUNCTION CInt>`);
  }
}

export default new NativeFunction(
  "CInt",
  new CIntCallable(),
  new FunctionTypeExpr(
    "CInt",
    Type.FUNCTION,
    [
      new Parameter(
        new Token(TokenType.IDENTIFIER, "object", undefined, -1, -1),
        new GenericPrimitiveTypeExpr()
      ),
    ],
    new TypeExpr(Type.INTEGER)
  )
);
