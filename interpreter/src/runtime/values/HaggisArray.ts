import { Type } from "../../ast/TypeExpr";
import RuntimeError from "../RuntimeError";
import HaggisBoolean from "./HaggisBoolean";
import HaggisInteger from "./HaggisInteger";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisArray extends HaggisValue {
  protected readonly items: HaggisValue[];

  constructor(items: HaggisValue[]) {
    super(Type.ARRAY);

    this.items = items;
  }

  length(): HaggisInteger {
    return new HaggisInteger(this.items.length);
  }

  get(index: HaggisInteger) {
    return this.items[index.value];
  }

  set(index: HaggisInteger, value: HaggisValue) {
    this.items[index.value] = value;
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisArray)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(`[ ${this.items.map((i) => i.toString()).join(", ")} ]`);
  }
}
