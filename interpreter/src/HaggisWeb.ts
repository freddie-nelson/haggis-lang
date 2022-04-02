import Parser from "./parsing/Parser";
import Resolver from "./resolution/Resolver";
import Interpreter from "./runtime/Interpreter";
import devices from "./runtime/IO/web/devices";
import RuntimeError from "./runtime/RuntimeError";
import Scanner from "./scanning/Scanner";
import Token from "./scanning/Token";
import TypeChecker from "./typechecker/TypeChecker";

export interface WebReader {
  readline(): Promise<string>;
}

export default class Haggis {
  private static interpreter = new Interpreter(devices);

  private static errorListeners: ((token: Token, message: string) => void)[] = [];
  private static logListeners: ((message: string) => void)[] = [];
  static reader: WebReader;

  static running = false;
  static hadError = false;
  static hadRuntimeError = false;

  static async run(source: string) {
    this.hadError = false;
    this.hadRuntimeError = false;

    if (this.running) return;

    try {
      this.running = true;
      await this.runSource(source);
    } catch (error) {
      console.log(error);
    } finally {
      this.running = false;
    }
  }

  private static async runSource(source: string) {
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
    this.errorListeners.forEach((l) => l(token, message));
  }

  static runtimeError(error: RuntimeError) {
    this.errorListeners.forEach((l) => l(error.token, error.message));
    this.hadRuntimeError = true;
  }

  static addErrorListener(callback: (token: Token, message: string) => void) {
    this.errorListeners.push(callback);
  }

  static log(message: string) {
    this.logListeners.forEach((l) => l(message));
  }

  static addLogListener(callback: (message: string) => void) {
    this.logListeners.push(callback);
  }

  static readline() {
    return this.reader.readline();
  }
}
