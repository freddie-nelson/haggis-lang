import RuntimeError from "./runtime/RuntimeError";
import Token from "./scanning/Token";
import { TokenType } from "./scanning/TokenType";

export default class Haggis {
  private static errorListeners: ((token: Token, message: string) => void)[] = [];

  static hadError = false;
  static hadRuntimeError = false;

  static error(token: Token, message: string) {
    this.errorListeners.forEach((l) => l(token, message));
  }

  static addErrorListener(callback: (token: Token, message: string) => void) {
    this.errorListeners.push(callback);
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
