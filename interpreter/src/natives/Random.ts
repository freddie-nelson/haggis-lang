import { FunctionTypeExpr, Type, TypeExpr } from "../ast/TypeExpr";
import Interpreter from "../runtime/Interpreter";
import HaggisBoolean from "../runtime/values/HaggisBoolean";
import HaggisCallable from "../runtime/values/HaggisCallable";
import HaggisReal from "../runtime/values/HaggisReal";
import HaggisString from "../runtime/values/HaggisString";
import HaggisValue from "../runtime/values/HaggisValue";
import { NativeFunction } from "./NativeFunction";

class RandomCallable extends HaggisCallable {
  constructor() {
    super(Type.FUNCTION);
  }

  async call(interpreter: Interpreter, args: HaggisValue[]) {
    return new HaggisReal(Math.random());
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisCallable)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(`<NATIVE_FUNCTION Random>`);
  }
}

export default new NativeFunction(
  "Random",
  new RandomCallable(),
  new FunctionTypeExpr("Random", Type.FUNCTION, [], new TypeExpr(Type.REAL))
);
