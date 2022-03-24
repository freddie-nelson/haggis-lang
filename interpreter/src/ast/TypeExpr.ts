export enum Type {
  INTEGER,
  REAL,
  CHARACTER,
  BOOLEAN,

  STRING,
  ARRAY,

  IDENTIFER,
}

export class TypeExpr {
  readonly type: Type;

  constructor(type: Type) {
    this.type = type;
  }
}

export class ArrayTypeExpr extends TypeExpr {
  readonly itemType: TypeExpr;
  readonly length: number;

  constructor(type: Type, itemType: TypeExpr) {
    super(type);

    this.itemType = itemType;
  }
}
