
    import Parameter from "./Parameter"
    import Token from "../scanning/Token";
    import { Type, TypeExpr, IdentifierTypeExpr } from "./TypeExpr";
    import { Expr, VariableExpr } from "./Expr";
    ;

    export abstract class Stmt {
      abstract accept<T>(visitor: Visitor<T>): T;
    }

    
    export interface Visitor<T> {
      visitRecordStmt(stmt: RecordStmt): T;
visitClassStmt(stmt: ClassStmt): T;
visitProcedureStmt(stmt: ProcedureStmt): T;
visitFunctionStmt(stmt: FunctionStmt): T;
visitVarStmt(stmt: VarStmt): T;
visitRecieveVarStmt(stmt: RecieveVarStmt): T;
visitIfStmt(stmt: IfStmt): T;
visitWhileStmt(stmt: WhileStmt): T;
visitUntilStmt(stmt: UntilStmt): T;
visitForStmt(stmt: ForStmt): T;
visitForEachStmt(stmt: ForEachStmt): T;
visitSetStmt(stmt: SetStmt): T;
visitCreateStmt(stmt: CreateStmt): T;
visitOpenStmt(stmt: OpenStmt): T;
visitCloseStmt(stmt: CloseStmt): T;
visitSendStmt(stmt: SendStmt): T;
visitRecieveStmt(stmt: RecieveStmt): T;
visitReturnStmt(stmt: ReturnStmt): T;
visitExpressionStmt(stmt: ExpressionStmt): T;

    }
    

    
      export class RecordStmt extends Stmt {
        readonly name: Token;
readonly fields: Parameter[];

        constructor(name: Token,fields: Parameter[]) {
          super();
          this.name = name;
this.fields = fields;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitRecordStmt(this);
        }
      }
    
      export class ClassStmt extends Stmt {
        readonly name: Token;
readonly superclass: IdentifierTypeExpr | undefined;
readonly fields: Parameter[];
readonly initializer: ProcedureStmt | undefined;
readonly methods: (FunctionStmt | ProcedureStmt)[];
readonly overrides: Map<ProcedureStmt | FunctionStmt,true>;

        constructor(name: Token,superclass: IdentifierTypeExpr | undefined,fields: Parameter[],initializer: ProcedureStmt | undefined,methods: (FunctionStmt | ProcedureStmt)[],overrides: Map<ProcedureStmt | FunctionStmt,true>) {
          super();
          this.name = name;
this.superclass = superclass;
this.fields = fields;
this.initializer = initializer;
this.methods = methods;
this.overrides = overrides;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitClassStmt(this);
        }
      }
    
      export class ProcedureStmt extends Stmt {
        readonly name: Token;
readonly params: Parameter[];
readonly body: Stmt[];

        constructor(name: Token,params: Parameter[],body: Stmt[]) {
          super();
          this.name = name;
this.params = params;
this.body = body;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitProcedureStmt(this);
        }
      }
    
      export class FunctionStmt extends Stmt {
        readonly name: Token;
readonly params: Parameter[];
readonly returnType: TypeExpr;
readonly body: Stmt[];

        constructor(name: Token,params: Parameter[],returnType: TypeExpr,body: Stmt[]) {
          super();
          this.name = name;
this.params = params;
this.returnType = returnType;
this.body = body;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitFunctionStmt(this);
        }
      }
    
      export class VarStmt extends Stmt {
        readonly name: Token;
readonly type: TypeExpr | undefined;
readonly initializer: Expr;

        constructor(name: Token,type: TypeExpr | undefined,initializer: Expr) {
          super();
          this.name = name;
this.type = type;
this.initializer = initializer;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitVarStmt(this);
        }
      }
    
      export class RecieveVarStmt extends Stmt {
        readonly name: Token;
readonly type: TypeExpr | undefined;
readonly sender: Token | Expr;

        constructor(name: Token,type: TypeExpr | undefined,sender: Token | Expr) {
          super();
          this.name = name;
this.type = type;
this.sender = sender;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitRecieveVarStmt(this);
        }
      }
    
      export class IfStmt extends Stmt {
        readonly keyword: Token;
readonly condition: Expr;
readonly thenBranch: Stmt[];
readonly elseBranch: Stmt[] | undefined;

        constructor(keyword: Token,condition: Expr,thenBranch: Stmt[],elseBranch: Stmt[] | undefined) {
          super();
          this.keyword = keyword;
this.condition = condition;
this.thenBranch = thenBranch;
this.elseBranch = elseBranch;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitIfStmt(this);
        }
      }
    
      export class WhileStmt extends Stmt {
        readonly keyword: Token;
readonly condition: Expr;
readonly body: Stmt[];

        constructor(keyword: Token,condition: Expr,body: Stmt[]) {
          super();
          this.keyword = keyword;
this.condition = condition;
this.body = body;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitWhileStmt(this);
        }
      }
    
      export class UntilStmt extends Stmt {
        readonly keyword: Token;
readonly body: Stmt[];
readonly condition: Expr;

        constructor(keyword: Token,body: Stmt[],condition: Expr) {
          super();
          this.keyword = keyword;
this.body = body;
this.condition = condition;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitUntilStmt(this);
        }
      }
    
      export class ForStmt extends Stmt {
        readonly keyword: Token;
readonly counter: Token;
readonly lower: Expr;
readonly upper: Expr;
readonly step: Expr;
readonly body: Stmt[];

        constructor(keyword: Token,counter: Token,lower: Expr,upper: Expr,step: Expr,body: Stmt[]) {
          super();
          this.keyword = keyword;
this.counter = counter;
this.lower = lower;
this.upper = upper;
this.step = step;
this.body = body;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitForStmt(this);
        }
      }
    
      export class ForEachStmt extends Stmt {
        readonly keyword: Token;
readonly iterator: Token;
readonly object: Expr;
readonly body: Stmt[];

        constructor(keyword: Token,iterator: Token,object: Expr,body: Stmt[]) {
          super();
          this.keyword = keyword;
this.iterator = iterator;
this.object = object;
this.body = body;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitForEachStmt(this);
        }
      }
    
      export class SetStmt extends Stmt {
        readonly keyword: Token;
readonly object: Expr;
readonly value: Expr;

        constructor(keyword: Token,object: Expr,value: Expr) {
          super();
          this.keyword = keyword;
this.object = object;
this.value = value;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitSetStmt(this);
        }
      }
    
      export class CreateStmt extends Stmt {
        readonly keyword: Token;
readonly file: Expr;

        constructor(keyword: Token,file: Expr) {
          super();
          this.keyword = keyword;
this.file = file;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitCreateStmt(this);
        }
      }
    
      export class OpenStmt extends Stmt {
        readonly keyword: Token;
readonly file: Expr;

        constructor(keyword: Token,file: Expr) {
          super();
          this.keyword = keyword;
this.file = file;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitOpenStmt(this);
        }
      }
    
      export class CloseStmt extends Stmt {
        readonly keyword: Token;
readonly file: Expr;

        constructor(keyword: Token,file: Expr) {
          super();
          this.keyword = keyword;
this.file = file;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitCloseStmt(this);
        }
      }
    
      export class SendStmt extends Stmt {
        readonly keyword: Token;
readonly value: Expr;
readonly dest: Token | Expr;

        constructor(keyword: Token,value: Expr,dest: Token | Expr) {
          super();
          this.keyword = keyword;
this.value = value;
this.dest = dest;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitSendStmt(this);
        }
      }
    
      export class RecieveStmt extends Stmt {
        readonly keyword: Token;
readonly object: Expr;
readonly sender: Token | Expr;

        constructor(keyword: Token,object: Expr,sender: Token | Expr) {
          super();
          this.keyword = keyword;
this.object = object;
this.sender = sender;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitRecieveStmt(this);
        }
      }
    
      export class ReturnStmt extends Stmt {
        readonly keyword: Token;
readonly value: Expr | undefined;

        constructor(keyword: Token,value: Expr | undefined) {
          super();
          this.keyword = keyword;
this.value = value;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitReturnStmt(this);
        }
      }
    
      export class ExpressionStmt extends Stmt {
        readonly expression: Expr;

        constructor(expression: Expr) {
          super();
          this.expression = expression;

        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visitExpressionStmt(this);
        }
      }
    
    