export enum TokenType {
  // brackets
  LEFT_PAREN,
  RIGHT_PAREN,
  LEFT_BRACE,
  RIGHT_BRACE,
  LEFT_BRACKET,
  RIGHT_BRACKET,

  // mathematical operators
  MINUS,
  PLUS,
  SLASH,
  STAR,
  CARET,
  MOD,

  // additional operators
  AMPERSAND,

  // seperators
  COMMA,
  DOT,

  SEPERATOR,

  // comparison operators
  EQUAL,
  NOT_EQUAL,
  GREATER,
  GREATER_EQUAL,
  LESS,
  LESS_EQUAL,

  // literals
  IDENTIFIER,
  INTEGER,
  REAL,
  CHARACTER,
  STRING,

  // logic operators
  AND,
  OR,
  NOT,

  // system entities
  DISPLAY,
  KEYBOARD,

  // keywords
  TRUE,
  FALSE,

  THIS,
  SUPER,

  RECORD,
  IS,
  CLASS,
  INHERITS,
  WITH,
  METHODS,
  OVERRIDE,
  CONSTRUCTOR,
  PROCEDURE,
  FUNCTION,
  DECLARE,
  AS,
  INITIALLY,
  IF,
  THEN,
  ELSE,
  WHILE,
  DO,
  REPEAT,
  UNTIL,
  FOR,
  FROM,
  TO,
  STEP,
  EACH,
  SET,
  CREATE,
  OPEN,
  CLOSE,
  SEND,
  RECIEVE,
  RETURN,
  END,

  EOF,
}
