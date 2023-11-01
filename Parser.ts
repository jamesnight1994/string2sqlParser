interface ParsedObject {
    column: string;
    operator: string;
    value: string | null;
}
export class Parser {
    /**
     *  example input  "(and=(owe.not||gte||788999,age||gt||18),or=(age||gt||18,name||eq||james))"
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
     * Input example  ['age||gt||18','users.age||gt||18', 'users.owe.not.gte.788999', 'owe.not.gte.788999']
     *
     *
     */
    getComparisonOperators(input: string[]): ParsedObject[] {
        const parsedObjects: ParsedObject[] = [];
        for (const str of input) {
            const parts = str.split('||');
            if (parts.length === 2) {
                // isNull, isTrue
                const [column, operator] = parts;
                parsedObjects.push({ column, operator, value: null });
            } else {
                //(column||operator||value)
                const [column, operator, value] = parts;
                parsedObjects.push({ column, operator, value });
            }
        }
        return parsedObjects;
    }

    generateQuery(
        inputString: string,
        condition = 'WHERE ',
        settings = {
            caseSensitive: false,
        },
    ) {
        const operators: object[] = this.getLogicalOperators(inputString);
        console.log('Operators: ', operators);

        const conditions: string[] = [condition];

        // for each operator get conditions
        operators.forEach((obj: any, index) => {
            const operator = Object.keys(obj)[0];

            if (operator == 'and') {
                const comparisonOperators = this.getComparisonOperators(
                    obj.and,
                );
                const andConditionsQuery = this.getConditionsQuery(
                    operator,
                    comparisonOperators,
                    settings.caseSensitive,
                );

                // if there is an next 'and' or 'or' condition
                if (operators[index + 1] != undefined) {
                    conditions.push(` ${andConditionsQuery} AND `);
                } else {
                    conditions.push(andConditionsQuery);
                }
            } else if (operator == 'or') {
                const comparisonOperators = this.getComparisonOperators(obj.or);
                const orConditionsQuery = this.getConditionsQuery(
                    operator,
                    comparisonOperators,
                    settings.caseSensitive,
                );

                // if there is an next 'and' or 'or' condition
                if (operators[index + 1] != undefined) {
                    conditions.push(` ( ${orConditionsQuery} ) AND `);
                } else {
                    conditions.push(` ( ${orConditionsQuery} ) `);
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
        caseSensitive: boolean,
    ): string {
        const conditionsQuery: string[] = [];
        comparisonOperators.forEach((comparisonOperator) => {
            const comparison = this.translateOperator(
                comparisonOperator.operator,
            );
            let column = comparisonOperator.column;
            let value = comparisonOperator.value;

            // if case sensitive is true and is string and is not a timestamp or date
            if (
                !caseSensitive &&
                typeof value == 'string' &&
                !this.isDateOrTimeStamp(value)
            ) {
                column = `LOWER (${comparisonOperator.column})`;
                value = `LOWER (${comparisonOperator.value})`;
            }

            const condition = `${column} ${comparison} ${value ?? ''}`;
            conditionsQuery.push(condition);
        });
        return conditionsQuery.join(` ${operator.toLocaleUpperCase()} `);
    }

    isDateOrTimeStamp(value: string): boolean {
        const date = new Date(value);

        if (isNaN(date.getTime()) || date.toString() === 'Invalid Date') {
            return false;
        }

        return true;
    }

    translateOperator(key: string) {
        const data = [
            { key: 'eq', value: '=' },
            { key: 'gt', value: '>' },
            { key: 'lt', value: '<' },
            { key: 'gte', value: '>=' },
            { key: 'lte', value: '<=' },
            { key: 'notEq', value: '!=' },
            { key: 'notGt', value: '!>' },
            { key: 'notLs', value: '!<' },
            { key: 'notGte', value: '!>=' },
            { key: 'notLte', value: '!<=' },
            { key: 'isTrue', value: 'IS TRUE' },
            { key: 'isFalse', value: 'IS FALSE' },
            { key: 'isNull', value: 'IS NULL' },
            { key: 'notNull', value: 'IS NOT NULL' },
            { key: 'cont', value: 'LIKE' },
        ];

        for (const item of data) {
            if (item.key === key) {
                return item.value;
            }
        }

        return null; // Return null if the key is not found
    }
}

export default new Parser();

//  Example usage
// const parser = new Parser().generateQuery(
//     `(and=(date||gte||'2023-05-01',insurance_provider.name||eq||'Corporate Insurance'),or=(name||notEq||'Motor Comprehensive for Optin',insurance_provider.name||eq||'Corporate Insurance',insurance_provider.name||cont||'%Corporate%'))`,
// );
