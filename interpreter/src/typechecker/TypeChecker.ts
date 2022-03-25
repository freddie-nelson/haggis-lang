import { Expr } from "../ast/Expr";
import { TypeExpr } from "../ast/TypeExpr";
import { VariableState } from "../resolution/Resolver";
import Interpreter from "../runtime/Interpreter";
import Token from "../scanning/Token";

export default class TypeChecker {
  private readonly interpreter: Interpreter;
  private readonly locals: Map<Expr, number>;

  private readonly global: Map<string, TypeExpr> = new Map();

  /**
   * Local scopes stack.
   *
   * The value (true, false) associated with each key in a map represents
   * wether or not we have finished resolving that variable's initializer.
   */
  private readonly scopes: Map<string, TypeExpr>[] = [];

  constructor(interpreter: Interpreter) {
    this.interpreter = interpreter;
    this.locals = interpreter.locals;
  }

  private beginScope() {
    this.scopes.push(new Map());
  }

  private endScope() {
    this.scopes.pop();
  }

  private declare(name: Token, type: TypeExpr) {
    let scope = this.scopes[this.scopes.length - 1];
    if (!scope) scope = this.global;

    scope.set(name.lexeme, type);
  }

  private resolveVariable(name: Token, expr: Expr): TypeExpr {
    if (this.locals.has(expr)) {
      const distance = this.locals.get(expr);
      const scope = this.scopes[this.scopes.length - 1 - distance];

      return scope.get(name.lexeme);
    } else {
      return this.global.get(name.lexeme);
    }
  }
}
