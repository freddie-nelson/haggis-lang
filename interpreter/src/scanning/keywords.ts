import { TokenType } from "./TokenType";

const keywords: { [index: string]: TokenType } = {
  MOD: TokenType.MOD,
  AND: TokenType.AND,
  OR: TokenType.OR,
  NOT: TokenType.NOT,
  DISPLAY: TokenType.DISPLAY,
  KEYBOARD: TokenType.KEYBOARD,
  true: TokenType.TRUE,
  false: TokenType.FALSE,
  RECORD: TokenType.RECORD,
  IS: TokenType.IS,
  CLASS: TokenType.CLASS,
  INHERITS: TokenType.INHERITS,
  WITH: TokenType.WITH,
  METHODS: TokenType.METHODS,
  OVERRIDE: TokenType.OVERRIDE,
  CONSTRUCTOR: TokenType.CONSTRUCTOR,
  PROCEDURE: TokenType.PROCEDURE,
  FUNCTION: TokenType.FUNCTION,
  DECLARE: TokenType.DECLARE,
  AS: TokenType.AS,
  INITIALLY: TokenType.INITIALLY,
  IF: TokenType.IF,
  THEN: TokenType.THEN,
  ELSE: TokenType.ELSE,
  WHILE: TokenType.WHILE,
  DO: TokenType.DO,
  REPEAT: TokenType.REPEAT,
  UNTIL: TokenType.UNTIL,
  FOR: TokenType.FOR,
  FROM: TokenType.FROM,
  TO: TokenType.TO,
  STEP: TokenType.STEP,
  EACH: TokenType.EACH,
  SET: TokenType.SET,
  CREATE: TokenType.CREATE,
  OPEN: TokenType.OPEN,
  CLOSE: TokenType.CLOSE,
  SEND: TokenType.SEND,
  RECIEVE: TokenType.RECIEVE,
  RETURN: TokenType.RETURN,
  END: TokenType.END,
};

export default keywords;