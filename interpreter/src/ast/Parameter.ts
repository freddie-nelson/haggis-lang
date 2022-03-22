import Token from "../scanning/Token";
import { TypeExpr } from "./TypeExpr";

export default class Parameter {
  readonly name: Token;
  readonly type: TypeExpr;

  constructor(name: Token, type: TypeExpr) {
    this.name = name;
    this.type = type;
  }
}
