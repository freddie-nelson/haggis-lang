import { Type } from "../../ast/TypeExpr";
import HaggisValue from "./HaggisValue";
import HaggisBoolean from "./HaggisBoolean";
import HaggisCharacter from "./HaggisCharacter";
import HaggisArrayBase from "./HaggisArrayBase";

export default class HaggisString extends HaggisArrayBase implements HaggisValue {
  readonly type: Type;
  protected declare readonly items: HaggisCharacter[];

  constructor(value: string) {
    super(value.split("").map((c) => new HaggisCharacter(c)));

    this.type = Type.STRING;
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisString) && !(value instanceof HaggisCharacter))
      return new HaggisBoolean(false);

    return new HaggisBoolean(this.jsString() === value.jsString());
  }

  toString(): HaggisString {
    return new HaggisString(this.jsString());
  }

  jsString(wrap = false): string {
    const s = this.items.map((i) => i.value).join("");

    if (wrap) return `"${s}"`;
    else return s;
  }
}
