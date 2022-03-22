import Interpreter from "../runtime/Interpreter";

export default interface Callable {
  arity(): number;
  call(interpreter: Interpreter, args: Object[]): Object;
}

export function isCallable(obj: any): obj is Callable {
  return typeof obj === "object" && "arity" in obj && "call" in obj;
}
