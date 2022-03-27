import { Type } from "../../ast/TypeExpr";
import HaggisBoolean from "./HaggisBoolean";
import HaggisInteger from "./HaggisInteger";
import HaggisRecord from "./HaggisRecord";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisReal extends HaggisValue {
  readonly value: number;

  constructor(value: number) {
    super(Type.REAL);

    this.value = value;
  }

  copy() {
    return new HaggisReal(this.value);
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisReal) && !(value instanceof HaggisInteger)) return new HaggisBoolean(false);

    return new HaggisBoolean(this.value === value.value);
  }

  toString() {
    let s = String(this.value);
    if (!s.includes(".")) s += ".0";

    return new HaggisString(s);
  }
}
