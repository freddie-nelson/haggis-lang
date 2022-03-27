import Parameter from "../../ast/Parameter";
import { ClassStmt, FunctionStmt } from "../../ast/Stmt";
import { Type } from "../../ast/TypeExpr";
import Environment from "../Environment";
import Interpreter from "../Interpreter";
import HaggisBoolean from "./HaggisBoolean";
import HaggisCallable from "./HaggisCallable";
import HaggisClassInstance from "./HaggisClassInstance";
import HaggisFunction from "./HaggisFunction";
import HaggisString from "./HaggisString";
import HaggisValue from "./HaggisValue";

export default class HaggisClass extends HaggisValue implements HaggisCallable {
  readonly name: string;
  readonly superclass?: HaggisClass;

  readonly initializer?: HaggisFunction;
  readonly fieldsArr: Parameter[];
  readonly methods: Map<string, HaggisFunction> = new Map();

  constructor(klass: ClassStmt, closure: Environment, superclass?: HaggisClass) {
    super(Type.CLASS);

    this.name = klass.name.lexeme;
    this.superclass = superclass;

    this.fieldsArr = klass.fields;

    klass.methods.forEach((m) => {
      this.methods.set(m.name.lexeme, new HaggisFunction(m, closure));
    });

    if (klass.initializer) {
      this.initializer = new HaggisFunction(klass.initializer, closure);
    }
  }

  getMethod(name: string): HaggisFunction {
    return this.methods.get(name) ?? this.superclass?.getMethod(name);
  }

  call(interpreter: Interpreter, args: HaggisValue[]): HaggisClassInstance {
    const instance = new HaggisClassInstance(this);

    if (this.initializer) {
      this.initializer.bind(instance).call(interpreter, args);
    } else {
      this.fieldsArr.forEach((f, i) => {
        instance.set(f.name.lexeme, args[i]);
      });
    }

    return instance;
  }

  copy() {
    return this;
  }

  equals(value: HaggisValue): HaggisBoolean {
    if (!(value instanceof HaggisClass)) return new HaggisBoolean(false);

    return new HaggisBoolean(this === value);
  }

  toString() {
    return new HaggisString(`<CLASS ${this.name}>`);
  }
}
