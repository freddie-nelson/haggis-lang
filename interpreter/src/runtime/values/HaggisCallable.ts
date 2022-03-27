import Interpreter from "../Interpreter";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default interface HaggisCallable {
  call(interpreter: Interpreter, args: HaggisValue[]): HaggisValue;
  toString(): HaggisString;
}

export function isHaggisCallable(obj: any): obj is HaggisCallable {
  return obj instanceof HaggisValue && "call" in obj;
}
