import { Type } from "../../ast/TypeExpr";
import HaggisBoolean from "./HaggisBoolean";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisVoid extends HaggisValue {
  constructor() {
    super(Type.VOID);
  }

  copy() {
    return new HaggisVoid();
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisVoid)) return new HaggisBoolean(false);

    return new HaggisBoolean(true);
  }

  toString() {
    return new HaggisString("<VOID>");
  }
}
