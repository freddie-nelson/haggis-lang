import keywords from "@interpreter/scanning/keywords";
import Scanner from "@interpreter/scanning/Scanner";
import { TokenType } from "@interpreter/scanning/TokenType";

const scanner = new Scanner("");

export default function syntaxHighlighting(code: string) {
  scanner.source = code;

  const tokens = scanner.scanTokens();

  for (let i = tokens.length - 1; i >= 0; i--) {
    const token = tokens[i];
    const next = tokens[i + 1];
    const tokenName = TokenType[token.type];

    const before = code.slice(0, token.index);
    const after = code.slice(token.index + token.lexeme.length);

    let klass = "";
    if (keywords[token.lexeme] && token.lexeme.search(/MOD|DISPLAY|KEYBOARD|true|false/) === -1) {
      klass = "text-primary-500";
    } else if (tokenName.search(/LITERAL|TRUE|FALSE/) !== -1) {
      klass = "text-pink-500";
    } else if (tokenName.includes("LEFT") || tokenName.includes("RIGHT")) {
      klass = "text-rose-700";
    } else if (tokenName.search(/MINUS|PLUS|SLASH|STAR|CARET|MOD|AMPERSAND|EQUAL|LESS|GREATER|MOD/) !== -1) {
      klass = "text-accent-500";
    } else if (
      (token.type === TokenType.IDENTIFIER && next?.type === TokenType.LEFT_PAREN) ||
      tokenName.search(/DISPLAY|KEYBOARD/) !== -1
    ) {
      klass = "text-emerald-500";
    }

    code = `${before}<span class="${klass}">${token.lexeme}</span>${after}`;
  }

  return code;
}
