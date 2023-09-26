interface ParsedObject {
    column: string;
    operator: string;
    value: string | null;
}
export default class Parser {
    getOperator(key: string): string | null {
        const data = [
            { key: 'eq', value: '=' },
            { key: 'gt', value: '>' },
            { key: 'ls', value: '<' },
            { key: 'gte', value: '>=' },
            { key: 'lte', value: '<=' },
            { key: 'not.eq', value: '!=' },
            { key: 'not.gt', value: '!>' },
            { key: 'not.ls', value: '!<' },
            { key: 'not.gte', value: '!>=' },
            { key: 'not.lte', value: '!<=' },
            { key: 'isTrue', value: 'IS TRUE' },
            { key: 'isFalse', value: 'IS FALSE' },
        ];

        for (const item of data) {
            if (item.key === key) {
                return item.value;
            }
        }

        return null; // Return null if the key is not found
    }

    /**
     *  example input  "(and=(owe.not.gte.788999,age.gt.18),or=(age.gt.18,name.eq.james))"
     *  */
    getLogicalOperators(input: string): object[] {
        // Remove the outermost parentheses
        const strippedInput = input.slice(1, -1);

        // Split the string into key-value pairs using regular expressions
        const pairsRegex = /(\w+)=\(([^)]+)\)/g;
        const pairs: { and?: string[]; or?: string[] }[] = [];

        let match;
        while ((match = pairsRegex.exec(strippedInput)) !== null) {
            const key = match[1];
            const values = match[2].split(',');
            const obj: { and?: string[]; or?: string[] } = {};

            if (key === 'and') {
                obj.and = values;
            } else if (key === 'or') {
                obj.or = values;
            }

            pairs.push(obj);
        }

        return pairs;
    }

    /**
     * Input example  ['age.gt.18','users.age.gt.18',  'users.owe.not.gte.788999','owe.not.gte.788999']
     *
     *
     */
    getComparisonOperators(input: string[]): ParsedObject[] {
        const parsedObjects: ParsedObject[] = [];

        for (const str of input) {
            const parts = str.split('.');
            if (parts.length === 2) {
                // if (column.directComparison)
                const [column, operator] = parts;
                parsedObjects.push({ column, operator, value: null });
            } else if (parts.length === 3) {
                // if parts of the condition are (column.condition.value)
                const [column, operator, value] = parts;
                parsedObjects.push({ column, operator, value });
            } else if (parts.length === 4) {
                // if parts of the condition are either (column.not.condition.value) or (table.column.condition.value)
                const [column, notOperator, comparison, value] = parts;
                const operator = `${notOperator}.${comparison}`;

                // Check if the operator is valid
                if (!this.getOperator(operator)) {
                    // cases of (table.column.condition.value)
                    const [table, column, operator, value] = parts;
                    parsedObjects.push({
                        column: `${table}.${column}`,
                        operator,
                        value,
                    });
                } else {
                    // cases of (column.not.condition.value)
                    parsedObjects.push({ column, operator, value });
                }
            } else if (parts.length === 5) {
                // if parts of the condition are either (table.column.not.condition.value)
                const [table, column, notOperator, operator, value] = parts;
                parsedObjects.push({
                    column: `${table}.${column}`,
                    operator: `${notOperator}.${operator}`,
                    value,
                });
            }
        }
        return parsedObjects;
    }

    generateQuery(inputString: string) {
        // const inputString = "(and=(owe.not.gte.788999,age.gt.18),or=(age.gt.18,name.eq.james))";
        const parser = new Parser();
        // get AND and OR operators
        const operators: object[] = parser.getLogicalOperators(inputString);
        console.log('Operators: ', operators);

        // query
        const conditions: string[] = ['WHERE '];

        // for each operator get conditions
        operators.forEach((obj: any, index) => {
            const operator = Object.keys(obj)[0];

            if (operator == 'and') {
                const comparisonOperators = parser.getComparisonOperators(
                    obj.and,
                );
                const andConditionsQuery = this.getConditionsQuery(
                    operator,
                    comparisonOperators,
                );

                // if there is an next 'and' or 'or' condition
                if (operators[index + 1] != undefined) {
                    conditions.push(
                        ` ${andConditionsQuery} ${operator.toUpperCase()} `,
                    );
                } else {
                    conditions.push(andConditionsQuery);
                }
            } else if (operator == 'or') {
                const comparisonOperators = parser.getComparisonOperators(
                    obj.or,
                );
                const orConditionsQuery = this.getConditionsQuery(
                    operator,
                    comparisonOperators,
                );

                // if there is an next 'and' or 'or' condition
                if (operators[index + 1] != undefined) {
                    conditions.push(
                        ` ${orConditionsQuery} ${operator.toUpperCase()} `,
                    );
                } else {
                    conditions.push(orConditionsQuery);
                }
            } else {
                throw Error(`Unknown join operator ${operator}`);
            }
        });

        return conditions.join('');
    }
    getConditionsQuery(
        operator: string,
        comparisonOperators: ParsedObject[],
    ): string {
        const conditionsQuery: string[] = [];
        comparisonOperators.forEach((comparisonOperator) => {
            const comparison = this.translateOperator(
                comparisonOperator.operator,
            );
            const condition = `${comparisonOperator.column} ${comparison} ${
                comparisonOperator.value ?? ''
            }`;
            conditionsQuery.push(condition);
        });
        return conditionsQuery.join(` ${operator.toLocaleUpperCase()} `);
    }
    translateOperator(key: string) {
        const data = [
            { key: 'eq', value: '=' },
            { key: 'gt', value: '>' },
            { key: 'ls', value: '<' },
            { key: 'gte', value: '>=' },
            { key: 'lte', value: '<=' },
            { key: 'not.eq', value: '!=' },
            { key: 'not.gt', value: '!>' },
            { key: 'not.ls', value: '!<' },
            { key: 'not.gte', value: '!>=' },
            { key: 'not.lte', value: '!<=' },
            { key: 'isTrue', value: 'IS TRUE' },
            { key: 'isFalse', value: 'IS FALSE' },
        ];

        for (const item of data) {
            if (item.key === key) {
                return item.value;
            }
        }

        return null; // Return null if the key is not found
    }
}