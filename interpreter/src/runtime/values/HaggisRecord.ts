import Parameter from "../../ast/Parameter";
import { Type, TypeExpr } from "../../ast/TypeExpr";
import Interpreter from "../Interpreter";
import HaggisBoolean from "./HaggisBoolean";
import HaggisCallable from "./HaggisCallable";
import HaggisRecordInstance from "./HaggisRecordInstance";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisRecord extends HaggisValue implements HaggisCallable {
  readonly name: string;
  private readonly fieldsArr: Parameter[];

  constructor(name: string, fields: Parameter[]) {
    super(Type.RECORD);

    this.name = name;
    this.fieldsArr = fields;
  }

  async call(interpreter: Interpreter, args: HaggisValue[]): Promise<HaggisRecordInstance> {
    const fields: Map<string, HaggisValue> = new Map();
    this.fieldsArr.forEach(({ name }, i) => {
      fields.set(name.lexeme, args[i]);
    });

    return new HaggisRecordInstance(fields, this);
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisRecord)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(`<RECORD ${this.name}>`);
  }
}
