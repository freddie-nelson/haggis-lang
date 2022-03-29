import { Type } from "../../ast/TypeExpr";
import HaggisValue from "./HaggisValue";
import HaggisBoolean from "./HaggisBoolean";
import HaggisString from "./HaggisString";
import HaggisArrayBase from "./HaggisArrayBase";

export default class HaggisArray extends HaggisArrayBase implements HaggisValue {
  readonly type: Type;

  constructor(items: HaggisValue[]) {
    super(items);

    this.type = Type.ARRAY;
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisArray)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(`[ ${this.items.map((i) => i.toString().jsString(true)).join(", ")} ]`);
  }
}
