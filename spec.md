# SQA Reference Language Spec (JS)

# Types

```
SQA TYPE // js equivalent
```

## Primative types

```
INTEGER     // Number
REAL        // Number
BOOLEAN     // Boolean
CHARACTER   // String
```

## Complex types

```
ARRAY       // Array
STRING      // String
RECORD      // class
CLASS       // class
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
DECLARE myArr AS ARRAY OF INTEGER             // declare array of type explicit
DECLARE myArrImplicit INITIALLY [ 1, 2 ]      // declare array of type implicit
DECLARE grid AS ARRAY OF ARRAY OF INTEGER     // declare 2D array
```

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
^    // exponent : **
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
&    // concatenate : Array.concat
```

## Comparison

```
=    // equality : ===
≠    // inequality : !==
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

**NOTE: Expressions may be brackted by (...)**

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

```
DISPLAY       // console.log / stdout
KEYBOARD      // stdin
```
