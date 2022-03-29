import Interpreter from "../Interpreter";
import HaggisValue from "./HaggisValue";

export default abstract class HaggisCallable extends HaggisValue {
  abstract call(interpreter: Interpreter, args: HaggisValue[]): Promise<HaggisValue>;
}
