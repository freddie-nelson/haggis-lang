import HaggisArray from "./HaggisArray";
import HaggisBoolean from "./HaggisBoolean";
import HaggisCharacter from "./HaggisCharacter";
import HaggisValue from "./HaggisValue";

export default class HaggisString extends HaggisArray {
  protected readonly items: HaggisCharacter[];

  constructor(value: string) {
    super(value.split("").map((c) => new HaggisCharacter(c)));
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

  jsString(): string {
    return this.items.map((i) => i.value).join("");
  }
}
