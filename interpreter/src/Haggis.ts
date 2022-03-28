import { readFileSync } from "fs";
import { createInterface } from "readline";
import Parser from "./parsing/Parser";
import Resolver from "./resolution/Resolver";
import Interpreter from "./runtime/Interpreter";
import ioDevicesNode from "./runtime/IO/node/devices";
import RuntimeError from "./runtime/RuntimeError";
import Scanner from "./scanning/Scanner";
import Token from "./scanning/Token";
import { TokenType } from "./scanning/TokenType";
import TypeChecker from "./typechecker/TypeChecker";

export default class Haggis {
  static readonly interpreter = new Interpreter(ioDevicesNode);

  static hadError = false;
  static hadRuntimeError = false;

  static async main(args: string[]) {
    if (args.length > 1) {
      console.log("Usage: haggis [script]");
      process.exit(64);
    } else if (args.length == 1) {
      await this.runFile(args[0]);
    } else {
      await this.runPrompt();
    }

    process.exit(0);
  }

  private static async runFile(path: string) {
    const file = readFileSync(path).toString();
    await this.run(file);

    // indicate an error in the exit code
    if (this.hadError) process.exit(65);
    if (this.hadRuntimeError) process.exit(70);
  }

  private static async runPrompt() {
    const reader = createInterface({
      input: process.stdin,
    });

    while (true) {
      process.stdout.write("> ");

      const proceed = await new Promise((resolve) => {
        reader.on("line", async (line) => {
          if (line === null) {
            reader.close();
            resolve(false);
          }

          // hacky way to print result if only expression is typed (not bulletproof)
          // if (!line.endsWith(";")) {
          //   line = `print ${line};`;
          // }

          await this.run(line);
          this.hadError = false;
          resolve(true);
        });
      });

      reader.removeAllListeners("line");

      if (!proceed) break;
    }
  }

  private static async run(source: string) {
    source += "\n";

    const scanner = new Scanner(source);
    const tokens: Token[] = scanner.scanTokens();

    const parser = new Parser(tokens);
    const statements = parser.parse();

    // stop if there was a syntax error
    if (this.hadError) return;

    const resolver = new Resolver(this.interpreter);
    resolver.resolve(statements);

    // stop if there was a resolution error
    if (this.hadError) return;

    const typechecker = new TypeChecker(this.interpreter);
    typechecker.typecheck(statements);

    // stop if there was a type error
    if (this.hadError) return;

    await this.interpreter.interpret(statements);
  }

  static error(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      this.report(token.line, "at end", message);
    } else {
      this.report(token.line, `at '${token.lexeme}'`, message);
    }
  }

  static runtimeError(error: RuntimeError) {
    console.error(`[line ${error.token.line}] RuntimeError: ${error.message}`);
    this.hadRuntimeError = true;
  }

  private static report(line: number, where: string, message: string) {
    console.error(`[line ${line}] Error ${where}: ${message}`);
    this.hadError = true;
  }
}

Haggis.main(process.argv.slice(2));
