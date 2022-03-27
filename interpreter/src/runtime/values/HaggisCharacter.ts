import { Type } from "../../ast/TypeExpr";
import ImplementationError from "../../parsing/ImplementationError";
import HaggisBoolean from "./HaggisBoolean";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisCharacter extends HaggisValue {
  readonly value: string;

  constructor(value: string) {
    super(Type.CHARACTER);

    if (value.length !== 1)
      throw new ImplementationError("HaggisCharacter instantiated with a string of non 1 length.");

    this.value = value;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisCharacter) && !(value instanceof HaggisString))
      return new HaggisBoolean(false);

    return new HaggisBoolean(this.jsString() === value.jsString());
  }

  copy() {
    return new HaggisCharacter(this.value);
  }

  toString() {
    return new HaggisString(this.value);
  }

  jsString() {
    return this.value;
  }
}
