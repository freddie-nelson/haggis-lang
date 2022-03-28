import { writeFileSync } from "fs";
import { exit } from "process";

export default class GenerateAst {
  static main(args: string[]) {
    if (args.length !== 1) {
      console.log("Usage: generate_ast <output directory>");
      exit(64);
    }

    const outputDir = args[0];

    this.defineAst(outputDir, "Expr", [
      "Grouping :: expression: Expr",
      "Logical  :: left: Expr, operator: Token, right: Expr",
      "Binary   :: left: Expr, operator: Token, right: Expr",
      "Unary    :: operator: Token, right: Expr",

      "Call     :: callee: Expr, paren: Token, args: Expr[]",

      "This     :: keyword: Token",
      "Super    :: keyword: Token, method: Token",

      "Literal  :: value: any, type: Type",

      "Variable :: name: Token",
      "Array    :: startBracket: Token, items: Expr[], endBracket: Token",
      "Record   :: startBrace: Token, fields: Token[], values: Expr[], endBrace: Token",

      "Get      :: object: Expr, name: Token",
      "Index    :: object: Expr, bracket: Token, index: Expr",
    ]);

    this.defineAst(outputDir, "Stmt", [
      "Record     :: name: Token, fields: Parameter[]",
      "Class      :: name: Token, superclass: IdentifierTypeExpr | undefined, fields: Parameter[], initializer: ProcedureStmt | undefined, methods: (FunctionStmt | ProcedureStmt)[], overrides: Map<ProcedureStmt | FunctionStmt\\, true>",

      "Procedure  :: name: Token, params: Parameter[], body: Stmt[]",
      "Function   :: name: Token, params: Parameter[], returnType: TypeExpr, body: Stmt[]",

      "Var        :: name: Token | GetExpr, type: TypeExpr | undefined, initializer: Expr",
      "RecieveVar :: name: Token | GetExpr, type: TypeExpr | undefined, sender: Token | Expr",

      "If         :: keyword: Token, condition: Expr, thenBranch: Stmt[], elseBranch: Stmt[] | undefined",

      "While      :: keyword: Token, condition: Expr, body: Stmt[]",
      "Until      :: keyword: Token, body: Stmt[], condition: Expr",

      "For        :: keyword: Token, counter: Token, lower: Expr, upper: Expr, step: Expr, body: Stmt[]",
      "ForEach    :: keyword: Token, iterator: Token, object: Expr, body: Stmt[]",

      "Set        :: keyword: Token, object: Expr, value: Expr",

      "Create     :: keyword: Token, file: Expr",
      "Open       :: keyword: Token, file: Expr",
      "Close      :: keyword: Token, file: Expr",

      "Send       :: keyword: Token, value: Expr, dest: Token | Expr",
      "Recieve    :: keyword: Token, object: Expr, sender: Token | Expr",

      "Return     :: keyword: Token, value: Expr | undefined",

      "Expression :: expression: Expr",
    ]);
  }

  private static defineAst(outputDir: string, baseName: string, types: string[]) {
    const path = `${outputDir}/${baseName}.ts`;
    const data = `
    import Parameter from "./Parameter"
    import Token from "../scanning/Token";
    import { Type, TypeExpr, IdentifierTypeExpr } from "./TypeExpr";
    ${baseName !== "Expr" ? 'import { Expr, VariableExpr, GetExpr } from "./Expr"' : ""};
    ${baseName !== "Stmt" ? 'import { Stmt } from "./Stmt"' : ""};

    export abstract class ${baseName} {
      abstract accept<T>(visitor: Visitor<T>): T;
    }

    ${this.defineVisitor(baseName, types)}

    ${types.reduce((acc, t) => {
      const className = t.split("::")[0].trim();
      const fields = t.split("::")[1].trim();

      return acc + this.defineType(baseName, className, fields);
    }, "")}
    `;

    writeFileSync(path, data);
  }

  private static defineVisitor(baseName: string, types: string[]): string {
    let data = `
    export interface Visitor<T> {
      ${types.reduce((acc, t) => {
        const typeName = t.split(":")[0].trim();
        return acc + `visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}${baseName}): T;\n`;
      }, "")}
    }
    `;

    return data;
  }

  private static defineType(baseName: string, className: string, fields: string): string {
    const fieldsArr = fields.split(",").map((f) => f.trim());

    for (let i = 0; i < fieldsArr.length; i++) {
      let f = fieldsArr[i];
      const slash = f.indexOf("\\");

      if (slash !== -1) {
        f = f.replace("\\", ",");
        f += fieldsArr[i + 1];

        fieldsArr[i] = f;
        fieldsArr.splice(i + 1, 1);
      }
    }

    let args: string[] = [];
    let props: string[] = [];

    if (fields) {
      const names = fieldsArr.map((f) => f.split(":")[0].trim());
      const types = fieldsArr.map((f) => f.split(":")[1].split("=")[0].trim());
      const defaults = fieldsArr.map((f) => {
        let typeAndDefault = f.split(":")[1].split("=");
        if (typeAndDefault.length === 2) return typeAndDefault[1];
        return "";
      });

      args = names.map((n, i) => `${n}${defaults[i] ? " = " + defaults[i] : ": " + types[i]}`);
      props = names.map((n, i) => `readonly ${n}: ${types[i]};`);
    }

    let data = `
      export class ${className}${baseName} extends ${baseName} {
        ${props.join("\n")}

        constructor(${args.join(",")}) {
          super();
          ${props.reduce(
            (acc, p) =>
              `${acc}this.${p.split(":")[0].slice("readonly ".length)} = ${p
                .split(":")[0]
                .slice("readonly ".length)};\n`,
            ""
          )}
        }

        accept<T>(visitor: Visitor<T>): T {
          return visitor.visit${className}${baseName}(this);
        }
      }
    `;

    return data;
  }
}

GenerateAst.main(process.argv.slice(2));
