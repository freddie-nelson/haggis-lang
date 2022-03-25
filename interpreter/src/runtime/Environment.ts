import Token from "../scanning/Token";
import RuntimeError from "./RuntimeError";

export default class Environment {
  readonly enclosing?: Environment;

  readonly values = new Map<string, Object>();

  /**
   * Map of variables in environment which have not been assigned a value yet.
   *
   * This means they had no initial value when defined (no initializer) and have not been assigned yet.
   *
   * This is used to issue a runtime error when a variable which has not been initialized or assigned to is accessed
   * in a variable expression.
   */
  private readonly nonAssignedVariables = new Map<string, boolean>();

  constructor(enclosing?: Environment) {
    this.enclosing = enclosing;
  }

  define(name: string, value: Object) {
    this.values.set(name, value);

    if (value === null) {
      this.nonAssignedVariables.set(name, true);
    }
  }

  get(name: Token): Object {
    if (this.nonAssignedVariables.has(name.lexeme))
      throw new RuntimeError(name, `Accessing uninitialized variable '${name.lexeme}'.`);

    if (this.values.has(name.lexeme)) return this.values.get(name.lexeme);

    if (this.enclosing) return this.enclosing.get(name);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  getAt(distance: number, name: Token) {
    return this.ancestor(distance).get(name);
  }

  assign(name: Token, value: Object): void {
    if (this.values.has(name.lexeme)) {
      if (this.nonAssignedVariables.has(name.lexeme)) this.nonAssignedVariables.delete(name.lexeme);

      this.values.set(name.lexeme, value);
      return;
    }

    if (this.enclosing) return this.enclosing.assign(name, value);

    throw new RuntimeError(name, `Undefined variable '${name.lexeme}'.`);
  }

  assignAt(distance: number, name: Token, value: Object) {
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
