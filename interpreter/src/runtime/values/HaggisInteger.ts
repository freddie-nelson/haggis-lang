import { Type } from "../../ast/TypeExpr";
import HaggisBoolean from "./HaggisBoolean";
import HaggisReal from "./HaggisReal";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisInteger extends HaggisValue {
  readonly value: number;

  constructor(value: number) {
    super(Type.INTEGER);

    this.value = Math.floor(value);
  }

  copy() {
    return new HaggisInteger(this.value);
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisReal) && !(value instanceof HaggisInteger)) return new HaggisBoolean(false);

    return new HaggisBoolean(this.value === value.value);
  }

  toString() {
    return new HaggisString(String(this.value));
  }
}
