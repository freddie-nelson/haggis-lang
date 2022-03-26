import { Type, TypeExpr } from "../ast/TypeExpr";

export abstract class SystemEntity {
  readonly type: TypeExpr;

  constructor(type: TypeExpr) {
    this.type = type;
  }
}

export class InputEntity extends SystemEntity {}

export class OutputEntity extends SystemEntity {}

export const InputEntities: { [index: string]: InputEntity } = {
  KEYBOARD: new InputEntity(new TypeExpr(Type.STRING)),
};

export const OutputEntities: { [index: string]: OutputEntity } = {
  DISPLAY: new OutputEntity(new TypeExpr(Type.STRING)),
};
