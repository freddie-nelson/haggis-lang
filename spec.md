# SQA Reference Language Spec (JS)

# Types

```
SQA TYPE // go equivalent
```

## Primative types

```
INTEGER     // int64
REAL        // float64
BOOLEAN     // bool
CHARACTER   // rune
```

## Complex types

```
ARRAY       // [length]type
STRING      // string
RECORD      // struct
CLASS       // struct with associated methods/functions
```

# Variable declarations

## Identifers

Variable identifiers cannot include . or -, and should not be all uppercase, to avoid confusion with reserved words.

Examples of valid identifiers are:

- myvalue
- My_Value
- counter2

## Primatives

```
DECLARE foo AS STRING                         // explicit type declaration
DECLARE bar INITIALLY 10                      // implicity type declaration using inital value
DECLARE foobar AS REAL INITIALLY 1.2          // explicit type and initial value
```

## Arrays

```
DECLARE myArr AS ARRAY OF INTEGER INITIALLY [] * 9                   // declare array of type explicit with length of 9
DECLARE myArrImplicit INITIALLY [ 1, 2 ]                            // declare array of type implicitly with length of 2
DECLARE grid AS ARRAY OF ARRAY OF INTEGER INITIALLY [] * 4 * 3      // declare 2D array with length 4 and each element with length 3

SET myArr[0] TO 10           // sets the first element in the array to 10
SET grid[0][0] TO 13         // sets the first element's first element to 13
SET myArr TO [ 1 ] * 9       // sets my array to an array of length 9 with each element set to 1
                             // * can be used in place of repeated concatenation
```

**NOTE: when reassigning an array you can only set it to an array of the same type and length**

## Records

```
RECORD Person IS { STRING name, INTEGER, age }

DECLARE john AS Person                                   // creates empty record of type Person
DECLARE jane AS Person( "Jane Doe", 23 )                 // creates record with inital values
DECLARE stranger INITIALLY { name = "Fred", age = 42 }   // creates a record type inline

// accessing fields
john.name            // returns ""
jane.name            // returns "Jane Doe"
stranger.age         // returns 42
```

## Classes

```
// not implemented
```

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
-    // unary minus : -
+    // add : +
-    // subtract : -
*    // multiple : *
/    // divide : /
^    // exponent : math.pow
```

##### In addition, INTEGER has:

```
MOD  // modulo : %
```

**NOTE: order of arithmetic operations follows PEDMAS**

**NOTE: Division, /, is integer division if both arguments are of type INTEGER.**

### STRING

```
&    // concatenate : +
```

### ARRAY

```
&    // concatenate : append(arr1[:], arr2[:]) - must be assigned to new variable with type inferred (:=)
```

## Comparison

```
=    // equality : ==
≠    // inequality : !=
<    // less than : <
≤    // less than or equal to : <=
>    // greater than : >
≥    // greater than or equal to : >=
```

## Logical

```
AND    // conjunction : &&
OR     // disjunction : ||
NOT    // negation : !
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
DISPLAY       // outputs data to stdout : fmt.Println / fmt.Printf
KEYBOARD      // reads input from user/stdin : fmt.Scanf
```

## Usage

```
// syntax : SEND expression TO DISPLAY
SEND "Hello World!" TO DISPLAY
SEND myVar TO DISPLAY

// syntax : RECIEVE id FROM KEYBOARD
RECIEVE name FROM KEYBOARD      // name is declared and given the value from stdin
                                // if variable is already declared then that variables value is overwritten
RECIEVE age FROM KEYBOARD
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
    RECIEVE password FROM KEYBOARD
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
// Repeat Loop
REPEAT expression TIMES command END REPEAT

// For Loops
FOR id FROM expr TO expr DO command END FOR
FOR id FROM expr TO expr STEP expr DO command END FOR

// For Each loop
FOR EACH id FROM expression DO command END FOR EACH          // expression must be ARRAY or STRING
                                                             // order of value extraction is first to last
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
// no STEP
DECLARE myArr INITIALLY [ 1, 2, 3, 4, 5 ]

FOR i FROM 0 TO length(myArr) DO
    SET total TO total + myArr[i]
END FOR

// with STEP
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

## Procedure (No return value)

```
PROCEDURE id(...)
    command(s)
END PROCEDURE
```

## Function (always returns a value)

```
Function id(...) RETURNS type
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
// or
FUNCTION id(type id, type id, ...) RETURNS type
```
