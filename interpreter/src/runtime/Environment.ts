import Token from "../scanning/Token";
import RuntimeError from "./RuntimeError";
import HaggisValue from "./values/HaggisValue";

export default class Environment {
  readonly enclosing?: Environment;

  readonly values = new Map<string, HaggisValue>();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  define(name: string, value: HaggisValue) {
    this.values.set(name, value);
  }

  get(name: Token): HaggisValue {
    if (this.values.has(name.lexeme)) return this.values.get(name.lexeme);

    if (this.enclosing) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  getAt(distance: number, name: Token) {
    return this.ancestor(distance).get(name);
  }

  assign(name: Token, value: HaggisValue): void {
    if (this.values.has(name.lexeme)) {
      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) return this.enclosing.assign(name, value);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  assignAt(distance: number, name: Token, value: HaggisValue) {
    this.ancestor(distance).assign(name, value);
  }

  ancestor(distance: number) {
    let env: Environment = this;
    for (let i = 0; i < distance; i++) {
      env = env.enclosing;
    }

    return env;
  }
}
