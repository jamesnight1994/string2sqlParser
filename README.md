### Parser String Format Rules:

1. The input string should be enclosed in parentheses `( )`.

2. The input string consists of logical operators (AND and OR) and their associated conditions.

3. Logical operators are represented as follows:
   - `and` is represented as `(and = ...)`, where `...` is a comma-separated list of conditions.
   - `or` is represented as `(or = ...)`, where `...` is a comma-separated list of conditions.

4. Conditions within logical operators are comma-separated and should be enclosed in parentheses `( )`.

5. Conditions consist of a column name, an operator, and an optional value, all separated by periods `.`:
   - Column name: A string representing the name of the column or field.
   - Operator: A string representing the comparison operator. It can be one of the following:
     - `eq` for equal to (`=`).
     - `gt` for greater than (`>`).
     - `ls` for less than (`<`).
     - `gte` for greater than or equal to (`>=`).
     - `lte` for less than or equal to (`<=`).
     - `not.eq` for not equal to (`!=`).
     - `not.gt` for not greater than (`!>`).
     - `not.ls` for not less than (`!<`).
     - `not.gte` for not greater than or equal to (`!>=`).
     - `not.lte` for not less than or equal to (`!<=`).
     - `isTrue` for "IS TRUE" (boolean true).
     - `isFalse` for "IS FALSE" (boolean false).
   - Value (optional): A string representing the value to compare against. This part is optional for certain operators like `isTrue` and `isFalse`.

6. Conditions can be negated by prefixing the operator with `not`, e.g., `owe.not.gte` represents "not greater than or equal to."

7. Table prefixes can be added to the column name by using a period `.` separator, e.g., `table.column.operator.value`.

8. Multiple logical operators (AND and OR) can be combined within the input string to create complex conditions.

### Example Parser String:

An example of a valid parser string following these rules is:
```
(and=(owe.not.gte.788999, age.gt.18), or=(age.gt.18, name.eq.james))
```

This parser can parse and generate queries based on input strings adhering to the above rules.
