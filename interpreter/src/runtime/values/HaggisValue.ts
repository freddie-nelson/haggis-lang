import { Type } from "../../ast/TypeExpr";
import HaggisBoolean from "./HaggisBoolean";
import HaggisString from "./HaggisString";

export default abstract class HaggisValue {
  readonly type: Type;

  constructor(type: Type) {
    this.type = type;
  }

  abstract copy(): HaggisValue;

  abstract equals(value: HaggisValue): HaggisBoolean;

  abstract toString(): HaggisString;
}
