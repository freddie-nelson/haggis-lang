import { matchTypeExpr, Type, TypeExpr } from "../ast/TypeExpr";
import CBool from "../natives/CBool";
import CChar from "../natives/CChar";
import CInt from "../natives/CInt";
import CReal from "../natives/CReal";
import CStr from "../natives/CStr";
import { NativeFunction } from "../natives/NativeFunction";

export function canCast(toCast: TypeExpr, type: TypeExpr): NativeFunction | undefined {
  switch (type.type) {
    case Type.STRING:
      return CStr;
    case Type.CHARACTER:
      return CChar;
    case Type.BOOLEAN:
      if (matchTypeExpr(toCast, CBool.type.params[0])) return CBool;
    case Type.INTEGER:
      if (matchTypeExpr(toCast, CInt.type.params[0])) return CInt;
    case Type.REAL:
      if (matchTypeExpr(toCast, CReal.type.params[0])) return CReal;
  }

  return undefined;
}
