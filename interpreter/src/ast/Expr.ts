
    import Parameter from "./Parameter"
    import Token from "../scanning/Token";
    import { Type, TypeExpr, IdentifierTypeExpr } from "./TypeExpr";
    ;
    import { Stmt } from "./Stmt";

    export abstract class Expr {
      abstract accept<T>(visitor: Visitor<T>): T;
    }

    
    export interface Visitor<T> {
      visitGroupingExpr(expr: GroupingExpr): T;
visitLogicalExpr(expr: LogicalExpr): T;
visitBinaryExpr(expr: BinaryExpr): T;
visitUnaryExpr(expr: UnaryExpr): T;
visitCallExpr(expr: CallExpr): T;
visitThisExpr(expr: ThisExpr): T;
visitSuperExpr(expr: SuperExpr): T;
visitLiteralExpr(expr: LiteralExpr): T;
visitVariableExpr(expr: VariableExpr): T;
visitArrayExpr(expr: ArrayExpr): T;
visitRecordExpr(expr: RecordExpr): T;
visitGetExpr(expr: GetExpr): T;
visitIndexExpr(expr: IndexExpr): T;

    }
    

    
      export class GroupingExpr extends Expr {
        readonly expression: Expr;

        constructor(expression: Expr) {
          super();
          this.expression = expression;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitGroupingExpr(this);
        }
      }
    
      export class LogicalExpr extends Expr {
        readonly left: Expr;
readonly operator: Token;
readonly right: Expr;

        constructor(left: Expr,operator: Token,right: Expr) {
          super();
          this.left = left;
this.operator = operator;
this.right = right;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitLogicalExpr(this);
        }
      }
    
      export class BinaryExpr extends Expr {
        readonly left: Expr;
readonly operator: Token;
readonly right: Expr;

        constructor(left: Expr,operator: Token,right: Expr) {
          super();
          this.left = left;
this.operator = operator;
this.right = right;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitBinaryExpr(this);
        }
      }
    
      export class UnaryExpr extends Expr {
        readonly operator: Token;
readonly right: Expr;

        constructor(operator: Token,right: Expr) {
          super();
          this.operator = operator;
this.right = right;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitUnaryExpr(this);
        }
      }
    
      export class CallExpr extends Expr {
        readonly callee: Expr;
readonly paren: Token;
readonly args: Expr[];

        constructor(callee: Expr,paren: Token,args: Expr[]) {
          super();
          this.callee = callee;
this.paren = paren;
this.args = args;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitCallExpr(this);
        }
      }
    
      export class ThisExpr extends Expr {
        readonly keyword: Token;

        constructor(keyword: Token) {
          super();
          this.keyword = keyword;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitThisExpr(this);
        }
      }
    
      export class SuperExpr extends Expr {
        readonly keyword: Token;
readonly method: Token;

        constructor(keyword: Token,method: Token) {
          super();
          this.keyword = keyword;
this.method = method;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitSuperExpr(this);
        }
      }
    
      export class LiteralExpr extends Expr {
        readonly value: any;
readonly type: Type;

        constructor(value: any,type: Type) {
          super();
          this.value = value;
this.type = type;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitLiteralExpr(this);
        }
      }
    
      export class VariableExpr extends Expr {
        readonly name: Token;

        constructor(name: Token) {
          super();
          this.name = name;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitVariableExpr(this);
        }
      }
    
      export class ArrayExpr extends Expr {
        readonly startBracket: Token;
readonly items: Expr[];
readonly endBracket: Token;

        constructor(startBracket: Token,items: Expr[],endBracket: Token) {
          super();
          this.startBracket = startBracket;
this.items = items;
this.endBracket = endBracket;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitArrayExpr(this);
        }
      }
    
      export class RecordExpr extends Expr {
        readonly startBrace: Token;
readonly fields: Token[];
readonly values: Expr[];
readonly endBrace: Token;

        constructor(startBrace: Token,fields: Token[],values: Expr[],endBrace: Token) {
          super();
          this.startBrace = startBrace;
this.fields = fields;
this.values = values;
this.endBrace = endBrace;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitRecordExpr(this);
        }
      }
    
      export class GetExpr extends Expr {
        readonly object: Expr;
readonly name: Token;

        constructor(object: Expr,name: Token) {
          super();
          this.object = object;
this.name = name;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitGetExpr(this);
        }
      }
    
      export class IndexExpr extends Expr {
        readonly object: Expr;
readonly bracket: Token;
readonly index: Expr;

        constructor(object: Expr,bracket: Token,index: Expr) {
          super();
          this.object = object;
this.bracket = bracket;
this.index = index;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitIndexExpr(this);
        }
      }
    
    