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

  SEPARATOR,

  // comparison operators
  EQUAL,
  NOT_EQUAL,
  GREATER,
  GREATER_EQUAL,
  LESS,
  LESS_EQUAL,

  // literals
  IDENTIFIER,
  INTEGER_LITERAL,
  REAL_LITERAL,
  CHARACTER_LITERAL,
  STRING_LITERAL,

  // logic operators
  AND,
  OR,
  NOT,

  // system entities
  DISPLAY,
  KEYBOARD,

  // keywords
  INTEGER,
  REAL,
  BOOLEAN,
  CHARACTER,
  STRING,
  ARRAY,
  OF,

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
  RETURNS,
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
  RECEIVE,
  RETURN,
  END,

  EOF,
}
