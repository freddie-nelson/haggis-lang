import { FunctionTypeExpr } from "../ast/TypeExpr";
import HaggisCallable from "../runtime/values/HaggisCallable";

export class NativeFunction {
  readonly name: string;
  readonly func: HaggisCallable;
  readonly type: FunctionTypeExpr;

  constructor(name: string, func: HaggisCallable, type: FunctionTypeExpr) {
    this.name = name;
    this.func = func;
    this.type = type;
  }
}
