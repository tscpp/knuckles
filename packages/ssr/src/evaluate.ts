import { escapeJs } from "./helpers.js";
import * as acorn from "acorn";
import MagicString from "magic-string";

/**
 * Transform an knockout binding expression to a valid javascript expression.
 */
export function transform(source: string, quote = '"'): string {
  const magic = new MagicString(source);
  const expression = acorn.parseExpressionAt(source, 0, {
    ecmaVersion: "latest",
    ranges: true,
  });
  const prefix: string[] = [];
  const suffix: string[] = [];

  const toAccess = (node: acorn.Identifier) => {
    const q = (s: string) => quote + escapeJs(s) + quote;
    const prefix2 = prefix.pop() ?? "";
    const suffix2 = suffix.pop() ?? "";
    const wrap = (access: string) => prefix2 + access + suffix2;

    let result = "";
    result += "(";
    // $context
    result += `${q(node.name)} in $context`;
    result += " ? ";
    result += `${wrap(`$context[${q(node.name)}`)}]`;
    result += " : ";
    // $data
    result += "$data !== null";
    result += " && ";
    result += `typeof $data === ${q("object")}`;
    result += " && ";
    result += `${q(node.name)} in $data`;
    result += " ? ";
    result += wrap(`$data[${q(node.name)}]`);
    result += " : ";
    // global
    result += wrap(node.name);
    result += ")";

    magic.overwrite(node.start!, node.end!, result);
  };

  const checkPattern = (pattern: acorn.Pattern) => {
    switch (pattern.type) {
      case "ArrayPattern":
        for (const element of pattern.elements) {
          if (element === null) continue;
          checkPattern(element);
        }
        break;

      case "AssignmentPattern":
        checkPattern(pattern.left);
        checkExpression(pattern.right);
        break;

      case "Identifier":
        toAccess(pattern);
        break;

      case "ObjectPattern":
        for (const property of pattern.properties) {
          if (property.type === "RestElement") {
            checkPattern(property.argument);
          } else {
            checkPattern(property.value);
          }
        }
        break;
    }
  };

  const checkExpression = (expression: acorn.Expression) => {
    switch (expression.type) {
      case "ArrayExpression":
        for (const element of expression.elements) {
          if (element === null) continue;
          if (element.type === "SpreadElement") {
            checkExpression(element.argument);
          } else {
            checkExpression(element);
          }
        }
        break;

      case "ArrowFunctionExpression":
        for (const param of expression.params) {
          checkPattern(param);
        }
        if (expression.body.type === "BlockStatement") {
          for (const statement of expression.body.body) {
            if (statement.type === "ExpressionStatement") {
              checkExpression(statement.expression);
            }
          }
        } else {
          checkExpression(expression.body);
        }
        break;

      case "AssignmentExpression":
        if ((expression.left.type as string) !== "PrivateIdentifier") {
          checkPattern(expression.left);
        }
        checkExpression(expression.right);
        break;

      case "BinaryExpression":
        if (expression.left.type !== "PrivateIdentifier") {
          checkExpression(expression.left);
        }
        checkExpression(expression.right);
        break;

      case "AwaitExpression":
        checkExpression(expression.argument);
        break;

      case "CallExpression":
        if (expression.callee.type !== "Super") {
          checkExpression(expression.callee);
        }
        for (const arg of expression.arguments) {
          if (arg.type === "SpreadElement") {
            checkExpression(arg.argument);
          } else {
            checkExpression(arg);
          }
        }
        break;

      case "ChainExpression":
        checkExpression(expression.expression);
        break;

      case "ClassExpression":
        if (expression.superClass) {
          checkExpression(expression.superClass);
        }
        break;

      case "ConditionalExpression":
        checkExpression(expression.test);
        checkExpression(expression.consequent);
        checkExpression(expression.alternate);
        break;

      case "FunctionExpression":
        for (const param of expression.params) {
          checkPattern(param);
        }
        for (const statement of expression.body.body) {
          if (statement.type === "ExpressionStatement") {
            checkExpression(statement.expression);
          }
        }
        break;

      case "Identifier":
        toAccess(expression);
        break;

      case "ImportExpression":
        break;

      case "Literal":
        break;

      case "LogicalExpression":
        checkExpression(expression.left);
        checkExpression(expression.right);
        break;

      case "MemberExpression":
        if (expression.object.type !== "Super") {
          checkExpression(expression.object);
        }
        if (
          expression.computed &&
          expression.property.type !== "PrivateIdentifier"
        ) {
          checkExpression(expression.property);
        }
        break;

      case "MetaProperty":
        break;

      case "NewExpression":
        checkExpression(expression.callee);
        for (const arg of expression.arguments) {
          if (arg.type === "SpreadElement") {
            checkExpression(arg.argument);
          } else {
            checkExpression(arg);
          }
        }
        break;

      case "ObjectExpression":
        for (const property of expression.properties) {
          if (property.type === "SpreadElement") {
            checkExpression(property.argument);
          } else {
            checkExpression(property.value);
          }
        }
        break;

      case "ParenthesizedExpression":
        checkExpression(expression.expression);
        break;

      case "SequenceExpression":
        for (const expr of expression.expressions) {
          checkExpression(expr);
        }
        break;

      case "TaggedTemplateExpression":
        checkExpression(expression.tag);
        checkExpression(expression.quasi);
        break;

      case "TemplateLiteral":
        for (const expr of expression.expressions) {
          checkExpression(expr);
        }
        break;

      case "ThisExpression":
        break;

      case "UnaryExpression":
        prefix.push(magic.slice(expression.start!, expression.argument.start!));
        magic.remove(expression.start!, expression.argument.start!);
        checkExpression(expression.argument);
        break;

      case "UpdateExpression":
        if (expression.prefix) {
          prefix.push(
            magic.slice(expression.start!, expression.argument.start!),
          );
          magic.remove(expression.start!, expression.argument.start!);
        } else {
          suffix.push(magic.slice(expression.argument.end!, expression.end!));
          magic.remove(expression.argument.end!, expression.end!);
        }
        checkExpression(expression.argument);
        break;

      case "YieldExpression":
        if (expression.argument) {
          checkExpression(expression.argument);
        }
        break;
    }
  };

  checkExpression(expression);
  return magic.toString();
}

/**
 * Evaluates an expression with the provided binding context.
 */
export function evaluate(expression: string, context: object) {
  expression = transform(expression);
  context = {
    $context: context,
    ...context,
  };
  try {
    return new Function(...Object.keys(context), `return ${expression}`)(
      ...Object.values(context),
    );
  } catch (error) {
    throw new Error(`Failed to evaluate expression: ${expression}`, {
      cause: error,
    });
  }
}
