import RuntimeError from "./runtime/RuntimeError";
import Token from "./scanning/Token";
import { TokenType } from "./scanning/TokenType";

export default class Haggis {
  static hadError = false;
  static hadRuntimeError = false;

  static error(token: Token, message: string) {
    if (token.type === TokenType.EOF) {
      this.report(token.line, "at end", message);
    } else {
      this.report(token.line, `at '${token.lexeme.replace("\n", "\\n")}'`, message);
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
