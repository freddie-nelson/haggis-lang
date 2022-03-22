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
      "Assign       :: name: Token, value: Expr",
      "Logical      :: left: Expr, operator: Token, right: Expr",
      "Binary       :: left: Expr, operator: Token, right: Expr",
      "Call         :: callee: Expr, paren: Token, args: Expr[]",
      "Get          :: object: Expr, name: Token",
      "Set          :: object: Expr, name: Token, value: Expr",
      "This         :: keyword: Token",
      "Super        :: keyword: Token, property: Token",
      "SuperCall    :: keyword: Token, args: Expr[]",
      "Grouping     :: expression: Expr",
      "Literal      :: value: any",
      "Unary        :: operator: Token, right: Expr",
      "Variable     :: name: Token",
      "FunctionExpr :: params: Token[], body: Stmt[]",
    ]);

    this.defineAst(outputDir, "Stmt", [
      "Block      :: statements: Stmt[]",
      "Expression :: expression: Expr",
      "Function   :: name: Token, params: Token[], body: Stmt[]",
      "Return     :: keyword: Token, value: Expr | undefined",
      "If         :: condition: Expr, thenBranch: Stmt, elseBranch: Stmt | undefined",
      "Print      :: expression: Expr",
      "Var        :: name: Token, initializer: Expr | undefined",
      "While      :: condition: Expr, body: Stmt, isFor: boolean = false, hasIncrement: boolean = false",
      "Class      :: name: Token, superclass: Variable | undefined, properties: ClassProperties, staticProperties: ClassProperties",
      "Break      :: keyword: Token",
      "Continue   :: keyword: Token",
    ]);
  }

  private static defineAst(outputDir: string, baseName: string, types: string[]) {
    const path = `${outputDir}/${baseName}.ts`;
    const data = `
    import Token from "./Token";
    import { ClassProperties } from "./LoxClass";
    ${baseName !== "Expr" ? 'import { Expr, Variable } from "./Expr"' : ""};
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
        return acc + `visit${typeName}${baseName}(${baseName.toLowerCase()}: ${typeName}): T;\n`;
      }, "")}
    }
    `;

    return data;
  }

  private static defineType(baseName: string, className: string, fields: string): string {
    const fieldsArr = fields.split(",").map((f) => f.trim());

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
      export class ${className} extends ${baseName} {
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
