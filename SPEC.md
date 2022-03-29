# SQALang Language Specification

# Grammar

Check grammar.bnf file.

# Types

## Primitive types

```
INTEGER     # 64 bit signed integer
REAL        # 64 bit signed floating point number
BOOLEAN     # boolean (true/false)
CHARACTER   # 8 bit unsigned integer
```

## Complex types

```
ARRAY       # list of elements of one type with set length
STRING      # string of CHARACTER
```

## Null type

Any type of variable can also take or be compared to the value `EMPTY` which is equivalent to other languages `null` or `nil` values.

# Variable declarations

## Identifers

Variable identifiers cannot include . or -, and should not be all uppercase, to avoid confusion with reserved words.

Examples of valid identifiers are:

- myvalue
- My_Value
- counter2

## Primitives

```
DECLARE foo AS STRING                         # explicit type declaration
DECLARE bar INITIALLY 10                      # implicit type declaration using initial value
DECLARE foobar AS REAL INITIALLY 1.2          # explicit type and initial value
```

## Arrays

```
DECLARE myArr AS ARRAY OF INTEGER INITIALLY [] * 9                  # declare array of type explicit with length of 9
DECLARE myArrImplicit INITIALLY [ 1, 2 ]                            # declare array of type implicitly with length of 2
DECLARE grid AS ARRAY OF ARRAY OF INTEGER INITIALLY [] * 4 * 3      # declare 2D array with length 4 and inner arrays with length 3

SET myArr[0] TO 10           # sets the first element in the array to 10
SET grid[0][0] TO 13         # sets the first element's first element to 13
SET myArr TO [1] * 9         # sets myArr to an array of length 9 with each element set to 1
                             # * can be used in place of repeated concatenation
```

**NOTE: when reassigning an array you can only set it to an array of the same type and length**

## Assignment

```
SET add TO 1 + 2
SET a TO b
SET counter TO counter + 1
SET myArr TO [ 1, 2 ]
```

**NOTE: using SET on a variable which hasn't been declared results in an error**

# Operators

## Arithmetic

### INTEGER and REAL

```
-    # unary minus
+    # add
-    # subtract
*    # multiple
/    # divide
^    # exponent
```

##### In addition, INTEGER has:

```
MOD  # modulo
```

**NOTE: order of arithmetic operations follows PEDMAS**

**NOTE: Division, /, is integer division if both arguments are of type INTEGER.**

### STRING

```
&    # concatenate
```

### ARRAY

```
&    # join two arrays of same type
```

## Comparison

```
=    # equality
≠    # inequality
<    # less than
≤    # less than or equal to
>    # greater than
≥    # greater than or equal to
```

## Logical

```
AND    # conjunction
OR     # disjunction
NOT    # negation
```

**NOTE: Expressions may be bracketed by (...)**

## Precedence

The precedence rules are as follows:

1. Unary minus
2. ^
3. \*, /, MOD
4. +, -
5. comparison operators
6. NOT
7. AND
8. OR

Where operators are of the same precedence, they are evaluated left-to-right.

# System Entities

## Available Entites

```
DISPLAY       # outputs data to stdout
KEYBOARD      # reads input from user/stdin as STRING
```

## Usage

```
# syntax : SEND expression TO DISPLAY
SEND "Hello World!" TO DISPLAY
SEND myVar TO DISPLAY

# syntax : RECEIVE id FROM KEYBOARD
RECEIVE name FROM KEYBOARD      # name is declared and given the value from stdin
                                # if variable is already declared then that variables value is overwritten
RECEIVE age FROM KEYBOARD
```

# Conditional Statements

```
IF expression THEN command END IF
IF expression THEN command ELSE command END IF
IF expression THEN command ELSE IF expression THEN command ELSE command END IF
```

### Examples

#### Simple Condition

```
IF myInt > 3 THEN
    SEND "more than three" TO DISPLAY
END IF
```

#### Complex Condition

```
IF myInt > 3 AND myInt < 10 THEN
    SEND "more than three and less than ten" TO DISPLAY
END IF
```

#### Multiple Conditions

```
IF myInt > 8 THEN
    SEND "more than eight" TO DISPLAY
ELSE IF myInt < 3 THEN
    SEND "less than three" TO DISPLAY
ELSE
    SEND "anything inbetween" TO DISPLAY
END IF
```

# Repetition

## Conditional Repetition

```
WHILE expression DO command END WHILE

REPEAT command UNTIL expression
```

### Examples

#### While Loop

```
WHILE !isPasswordCorrect DO
    RECEIVE password FROM KEYBOARD
    IF password == "epicpassword" THEN
        SET isPasswordCorrect TO true
    END IF
END WHILE
```

#### Until Loop

```
DECLARE myStr AS STRING INITIALLY "w"
REPEAT
    SET myStr TO myStr & "o"
UNTIL length(myStr) == 10
```

## Fixed repetition

```
# Repeat Loop
REPEAT expression TIMES command END REPEAT

# For Loops
FOR i FROM expr TO expr DO command END FOR
FOR i FROM expr TO expr STEP expr DO command END FOR

# For Each loop
FOR EACH element FROM expression DO command END FOR EACH          # expression must be ARRAY or STRING
                                                                  # order of value extraction is first to last
```

### Examples

#### Repeat Loop

```
DECLARE counter AS INTEGER INITIALLY 0
REPEAT 5 TIMES
    SET counter TO counter + 1
END REPEAT
```

#### For Loop

```
# no STEP
DECLARE myArr INITIALLY [ 1, 2, 3, 4, 5 ]

FOR i FROM 0 TO length(myArr) DO
    SET total TO total + myArr[i]
END FOR

# with STEP
FOR counter FROM 0 TO 200 STEP 5 DO
    SEND counter TO DISPLAY
END FOR
```

#### For Each Loop

```
DECLARE myArray INITIALLY [ "The", "sun", "is", "shining" ]
DECLARE sentence INITIALLY ""

FOR EACH word FROM myArray DO
    SET sentence TO sentence & word & " "
END FOR EACH
```

# Subprograms

Procedures and Functions in haggis are not first class citizens, this means they cannot be assigned to variables or passed as parameters to functions.

For example the following code would not work:

```
PROCEDURE myProcedure(STRING name)
    SEND "Hello " & name & " from myProcedure!" TO DISPLAY
END PROCEDURE

DECLARE myProc INITIALLY myProcedure        # results in error
```

Similarly, this will also not compile:

```
PROCEDURE myProcedure(PROCEDURE prod)
    prod()
END PROCEDURE

PROCEDURE inner(PROCEDURE prod)
    SEND "You will never see me!" TO DISPLAY
END PROCEDURE

myProcedure(inner)
```

## Procedure (No return value)

```
PROCEDURE id(...)
    command(s)
END PROCEDURE
```

## Function (always returns a value)

```
FUNCTION id(...) RETURNS type
    command(s)
    RETURN expression
END FUNCTION
```

**Note: expression must be same as defined return type**

**Note: RETURN expression may be used anywhere inside the function, one or more times, and when executed causes:**

- the expression to be evaluated
- the execution of the function to be terminated
- the result of the expression to be returned as the result of calling the function

## Parameters

In the above definitions ... is a comma separated list of arguments/parameters,
possibly empty. Formal parameters are preceded by their types:

```
PROCEDURE id(type id, type id, ...)
# or
FUNCTION id(type id, type id, ...) RETURNS type
```

## Invocation

When invoking a function all parameters must be supplied.

```
PROCEDURE myProcedure(STRING name)
    SEND "Hello " & name & " from myProcedure!" TO DISPLAY
END PROCEDURE

myProcedure("john") # invoking function
```

# Scope

The language is statically scoped and the scoping rules are as follows:

- The language uses block-level scoping. On entering each block, a new scope level is created, which is destroyed on exit from the block.
- A variable is in scope, that is, available for use, from the DECLARE statement introducing it to the end of the block containing that declaration.
- A single scope level may only contain one declaration for a given variable name; but that same name may be declared in many scope levels.

- On encountering the use of a variable in an expression, the sequence of nested scopes, from the scope immediately containing the variable use outward, is scanned for the most recent declaration of this variable — and it is this variable instance that is used in the expression

# Comments

These operate in the same way as in most other languages, with an initial comment character (in this case #), followed by text up to the end of the line. Comments are ignored by the transpiler and thus have no effect on the resulting output of the program, they should be used to clarify, query or explain to a human read the purpose of nearby code.

```
# This is a comment
# This is also a comment
```

**Note: Unlike in other langauges the SQA reference language does not include any character or character combination to create multi-line comments.**

# File Handling

Similar to python the keywords OPEN, CLOSE AND CREATE can be used to perform simple file handling.

When working with files that have already been created, they must be opened
and closed, for example:

```
OPEN "myNumbers.txt"
CLOSE "myNumbers.txt"
```

When a file does not exist for output, it can be created using:

```
CREATE "myUpdatedNumbers.txt"
```

**Note: when a relative path is used it is found relative to the directory the source code is executed**

## Example

The following is a complete sequence opening and reading two lines from one file and creating and writing the lines to a second file, and finally closing both files:

```
DECLARE numbersData INITIALLY "myNumbers.txt"              # set file path to variable
OPEN numbersData                                           # opens myNumbers.txt
DECLARE data AS STRING INITIALLY FROM numbersData          # reads text from line 1 of myNumbers.txt and places it in data

CREATE "outputFile.txt"                                    # creates the file outputFile.txt
SEND data TO "outputFile.txt"                              # writes the value of data to line 1 of outputFile.txt
RECEIVE data FROM numbersData                              # reads text from line 2 of myNumbers.txt and places it in data
SEND data TO "outputFile.txt"                              # writes value of data to the line 2 of outputFile.txt

CLOSE "outputFile.txt"                                     # closes files
CLOSE numbersData
```

# Object Oriented Programming

## Records

Records can contain any amount of fields with arbritrary data type. Once a record has been declared its identifier can be called like a constructor function.

```
RECORD Person IS { STRING name, INTEGER, age }

DECLARE john AS Person                                   # creates empty record of type Person
DECLARE jane AS Person("Jane Doe", 23)                   # creates record with inital values

# accessing fields
john.name            # ""
jane.name            # "Jane Doe"
```

## Classes

```
# not implemented
```
