import { Expr } from "../ast/Expr";
import { Stmt } from "../ast/Stmt";
import Haggis from "../Haggis";
import Environment from "./Environment";
import RuntimeError from "./RuntimeError";

export default class Interpreter {
  readonly globals = new Environment();
  private readonly locals: Map<Expr, number> = new Map();

  private environment = this.globals;

  interpret(statements: Stmt[]) {
    try {
      for (const s of statements) {
        this.execute(s);
      }
    } catch (error) {
      Haggis.runtimeError(<RuntimeError>error);
    }
  }

  execute(stmt: Stmt) {
    // return stmt.accept(this);
  }

  resolve(expr: Expr, depth: number) {
    this.locals.set(expr, depth);
  }
}
