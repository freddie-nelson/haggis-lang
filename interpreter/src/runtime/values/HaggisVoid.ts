import { Type } from "../../ast/TypeExpr";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisVoid extends HaggisValue {
  constructor() {
    super(Type.VOID);
  }

  toString() {
    return new HaggisString("<VOID>");
  }
}
