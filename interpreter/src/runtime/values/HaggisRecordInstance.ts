import Parameter from "../../ast/Parameter";
import { Type, TypeExpr } from "../../ast/TypeExpr";
import HaggisBoolean from "./HaggisBoolean";
import HaggisRecord from "./HaggisRecord";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisRecordInstance extends HaggisValue {
  readonly fields: Map<string, HaggisValue>;
  readonly record?: HaggisRecord;

  constructor(fields: Map<string, HaggisValue>, record?: HaggisRecord) {
    super(Type.RECORD_INSTANCE);

    this.fields = fields;
    this.record = record;
  }

  get(name: string): HaggisValue {
    return this.fields.get(name);
  }

  set(name: string, value: HaggisValue) {
    this.fields.set(name, value);
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisRecordInstance)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(
      `${this.record.name || "RECORD"} { 
        ${Array.from(this.fields).map(([f, v]) => `${f} = ${v.toString().jsString()}`)} 
      }`
    );
  }
}
