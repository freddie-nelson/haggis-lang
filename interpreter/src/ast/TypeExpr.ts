import CBool from "../natives/CBool";
import CChar from "../natives/CChar";
import CInt from "../natives/CInt";
import CReal from "../natives/CReal";
import CStr from "../natives/CStr";
import { NativeFunction } from "../natives/NativeFunction";
import ImplementationError from "../parsing/ImplementationError";
import Token from "../scanning/Token";
import Parameter from "./Parameter";
import { ClassStmt, FunctionStmt } from "./Stmt";

export enum Type {
  INTEGER,
  REAL,
  CHARACTER,
  BOOLEAN,

  STRING,
  ARRAY,

  IDENTIFER,

  RECORD,
  CLASS,

  RECORD_INSTANCE,
  CLASS_INSTANCE,

  FUNCTION,
  PROCEDURE,

  VOID,
}

export class TypeExpr {
  readonly type: Type;

  constructor(type: Type) {
    this.type = type;
  }
}

export class IdentifierTypeExpr extends TypeExpr {
  readonly identifier: Token;

  constructor(type: Type, identifier: Token) {
    super(type);

    this.identifier = identifier;
  }
}

export class ArrayTypeExpr extends TypeExpr {
  readonly itemType: TypeExpr;

  constructor(type: Type, itemType: TypeExpr) {
    super(type);

    this.itemType = itemType;
  }
}

export class RecordTypeExpr extends TypeExpr {
  readonly name: string;

  readonly initializer: FunctionTypeExpr;
  readonly fields: Map<string, TypeExpr> = new Map();

  constructor(name: string, fields: Parameter[]) {
    super(Type.RECORD);

    this.name = name;
    this.initializer = new FunctionTypeExpr(name, Type.PROCEDURE, fields);

    fields.forEach((f) => {
      this.fields.set(f.name.lexeme, f.type);
    });
  }

  hasField(name: string) {
    return this.fields.has(name);
  }

  getField(name: string): TypeExpr {
    return this.fields.get(name);
  }
}

export class ClassTypeExpr extends TypeExpr {
  readonly name: string;
  readonly fieldsArr: Parameter[];

  readonly fields: Map<string, TypeExpr> = new Map();
  readonly methods: Map<string, FunctionTypeExpr> = new Map();

  readonly initializer: FunctionTypeExpr;
  readonly superclass?: ClassTypeExpr;

  constructor(klass: ClassStmt, superclass?: ClassTypeExpr) {
    super(Type.CLASS);

    this.name = klass.name.lexeme;
    this.superclass = superclass;

    this.fieldsArr = klass.fields;
    klass.fields.forEach((f) => {
      this.fields.set(f.name.lexeme, f.type);
    });

    klass.methods.forEach((m) => {
      if (m instanceof FunctionStmt) {
        this.methods.set(
          m.name.lexeme,
          new FunctionTypeExpr(m.name.lexeme, Type.FUNCTION, m.params, m.returnType)
        );
      } else {
        this.methods.set(m.name.lexeme, new FunctionTypeExpr(m.name.lexeme, Type.PROCEDURE, m.params));
      }
    });

    if (klass.initializer) {
      this.initializer = new FunctionTypeExpr(
        klass.initializer.name.lexeme,
        Type.PROCEDURE,
        klass.initializer.params
      );
    } else {
      const chain = [];
      let curr = superclass;

      while (curr) {
        chain.push(curr);
        curr = curr.superclass;
      }

      const params: Parameter[] = [];
      while ((curr = chain.pop())) {
        params.push(...curr.fieldsArr);
      }

      params.push(...klass.fields);

      this.initializer = new FunctionTypeExpr("CONSTRUCTOR", Type.PROCEDURE, params);
    }
  }

  isSuperOf(t: ClassTypeExpr): boolean {
    let superclass = t.superclass;
    while (superclass) {
      if (this === superclass) return true;
      superclass = superclass.superclass;
    }

    return false;
  }

  hasField(name: string): boolean {
    return this.fields.has(name) || this.superclass?.hasField(name);
  }

  getField(name: string): TypeExpr {
    return this.fields.get(name) ?? this.superclass?.getField(name);
  }

  hasMethod(name: string): boolean {
    return this.methods.has(name) || this.superclass?.hasMethod(name);
  }

  getMethod(name: string): FunctionTypeExpr {
    return this.methods.get(name) ?? this.superclass?.getMethod(name);
  }

  hasProperty(name: string): boolean {
    return this.hasField(name) || this.hasMethod(name);
  }

  getProperty(name: string): TypeExpr {
    return this.getField(name) ?? this.getMethod(name);
  }
}

export class RecordInstanceTypeExpr extends TypeExpr {
  readonly record: RecordTypeExpr;

  constructor(record: RecordTypeExpr) {
    super(Type.RECORD_INSTANCE);

    this.record = record;
  }
}

export class ClassInstanceTypeExpr extends TypeExpr {
  readonly klass: ClassTypeExpr;

  constructor(klass: ClassTypeExpr) {
    super(Type.CLASS_INSTANCE);

    this.klass = klass;
  }
}

export class FunctionTypeExpr extends TypeExpr {
  readonly name: string;
  readonly params: TypeExpr[];
  readonly returnType: TypeExpr;

  constructor(
    name: string,
    type: Type.FUNCTION | Type.PROCEDURE,
    params: Parameter[],
    returnType?: TypeExpr
  ) {
    super(type);

    this.name = name;

    if (type === Type.FUNCTION && !returnType)
      throw new ImplementationError("No return type provided to FunctionTypeExpr but is a Type.FUNCTION.");
    else if (type === Type.PROCEDURE && returnType)
      throw new ImplementationError("Return type provided to FunctionTypeExpr but is a Type.PROCEDURE.");

    if (!returnType) returnType = new TypeExpr(Type.VOID);

    this.params = params.map((p) => p.type);
    this.returnType = returnType;
  }

  matchSignatures(type: FunctionTypeExpr) {
    let returnTypesMatch = this.returnType === type.returnType;
    if (this.returnType && type.returnType)
      returnTypesMatch = matchTypeExpr(this.returnType, type.returnType);

    return this.type === type.type && returnTypesMatch && this.matchParams(type.params);
  }

  matchParams(params: TypeExpr[]) {
    if (this.params.length !== params.length) return false;

    for (let i = 0; i < this.params.length; i++) {
      if (!matchTypeExpr(this.params[i], params[i])) return false;
    }

    return true;
  }
}

export class GenericTypeExpr extends TypeExpr {
  readonly types: Type[];

  constructor(...types: Type[]) {
    super(Type.VOID);

    this.types = types;
  }

  match(type: Type) {
    return this.types.includes(type);
  }
}

export class GenericPrimitiveTypeExpr extends GenericTypeExpr {
  constructor() {
    super(Type.INTEGER, Type.REAL, Type.CHARACTER, Type.BOOLEAN, Type.STRING);
  }
}

export class GenericAllTypeExpr extends GenericTypeExpr {
  constructor() {
    super(
      Type.INTEGER,
      Type.REAL,
      Type.CHARACTER,
      Type.BOOLEAN,
      Type.STRING,
      Type.ARRAY,
      Type.RECORD,
      Type.CLASS,
      Type.RECORD_INSTANCE,
      Type.CLASS_INSTANCE,
      Type.FUNCTION,
      Type.PROCEDURE,
      Type.VOID
    );
  }
}

/**
 * Determines wether or not two {@link TypeExpr} match.
 *
 * @param t1 The first type (the object being set/declared)
 * @param t2 The second type (the type of the value)
 * @returns true or false
 */
export function matchTypeExpr(t1: TypeExpr, t2: TypeExpr): boolean {
  if (t1 instanceof GenericTypeExpr) return t1.match(t2.type);
  if (t2 instanceof GenericTypeExpr) return t2.match(t1.type);

  if (t1 instanceof ArrayTypeExpr) {
    if (!(t2 instanceof ArrayTypeExpr)) return false;

    return matchTypeExpr(t1.itemType, t2.itemType);
  }

  if (t1 instanceof RecordTypeExpr) {
    return t1 === t2;
  }

  if (t1 instanceof RecordInstanceTypeExpr) {
    if (!(t2 instanceof RecordInstanceTypeExpr)) return false;

    if (t1.record === t2.record) return true;

    if (t1.record.fields.size === t2.record.fields.size) {
      for (const f of t1.record.fields) {
        if (!t2.record.hasField(f[0]) || !matchTypeExpr(f[1], t2.record.getField(f[0]))) return false;
      }

      return true;
    }

    return false;
  }

  if (t1 instanceof ClassTypeExpr) {
    return t1 === t2;
  }

  if (t1 instanceof ClassInstanceTypeExpr) {
    if (!(t2 instanceof ClassInstanceTypeExpr)) return false;

    if (t1.klass === t2.klass) return true;

    return t1.klass.isSuperOf(t2.klass);
  }

  if (t1 instanceof FunctionTypeExpr) {
    if (!(t2 instanceof FunctionTypeExpr)) return false;

    return t1.matchSignatures(t2);
  }

  return t1.type === t2.type;
}
