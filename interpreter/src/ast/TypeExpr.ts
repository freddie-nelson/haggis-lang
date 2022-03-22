export enum Type {
  INTEGER,
  REAL,
  CHARACTER,
  BOOLEAN,

  STRING,
  ARRAY,

  RECORD,
  CLASS,
}

export class TypeExpr {
  readonly type: Type | TypeExpr;

  constructor(type: Type | TypeExpr) {
    this.type = type;
  }
}

export class ArrayTypeExpr extends TypeExpr {
  readonly length: number;

  constructor(type: Type | TypeExpr, length: number) {
    super(type);

    this.length = length;
  }
}
