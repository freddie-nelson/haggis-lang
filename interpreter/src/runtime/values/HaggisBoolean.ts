import { Type } from "../../ast/TypeExpr";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisBoolean extends HaggisValue {
  readonly value: boolean;

  constructor(value: boolean) {
    super(Type.BOOLEAN);

    this.value = value;
  }

  copy() {
    return new HaggisBoolean(this.value);
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisBoolean)) return new HaggisBoolean(false);

    return new HaggisBoolean(this.value === value.value);
  }

  toString() {
    return new HaggisString(String(this.value));
  }
}
