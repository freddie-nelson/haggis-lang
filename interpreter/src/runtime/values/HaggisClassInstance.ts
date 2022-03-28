import { Type } from "../../ast/TypeExpr";
import HaggisBoolean from "./HaggisBoolean";
import HaggisClass from "./HaggisClass";
import HaggisFunction from "./HaggisFunction";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisClassInstance extends HaggisValue {
  readonly klass: HaggisClass;
  private readonly fields: Map<string, HaggisValue> = new Map();

  constructor(klass: HaggisClass) {
    super(Type.CLASS_INSTANCE);

    this.klass = klass;
  }

  get(name: string): HaggisValue {
    return this.getField(name) ?? this.getMethod(name);
  }

  set(name: string, value: HaggisValue) {
    this.setField(name, value);
  }

  private getField(name: string): HaggisValue {
    return this.fields.get(name);
  }

  private setField(name: string, value: HaggisValue) {
    this.fields.set(name, value);
  }

  private getMethod(name: string): HaggisFunction {
    return this.klass.getMethod(name).bind(this);
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisClassInstance)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(
      `${this.klass.name}{ ${Array.from(this.fields)
        .map(([f, v]) => `${f} = ${v.toString().jsString()}`)
        .join(", ")} }`
    );
  }
}
