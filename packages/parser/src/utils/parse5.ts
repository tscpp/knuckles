import type * as parse5TreeAdapter from "../../node_modules/parse5/dist/tree-adapters/default.js";
import { Range, Position } from "@knuckles/location";
import * as parse5 from "parse5";

export function parse5LocationToRange(location: parse5.Token.Location): Range {
  return new Range(
    new Position(
      location.startLine - 1,
      location.startCol - 1,
      location.startOffset,
    ),
    new Position(location.endLine - 1, location.endCol - 1, location.endOffset),
  );
}

export function parse5NodeToRange(node: parse5TreeAdapter.Node): Range {
  return parse5LocationToRange(node.sourceCodeLocation!);
}

export function parse5ErrorMessage(error: parse5.ParserError): string {
  switch (error.code) {
    case parse5.ErrorCodes.controlCharacterInInputStream:
      return "Control character in input stream";
    case parse5.ErrorCodes.noncharacterInInputStream:
      return "Noncharacter in input stream";
    case parse5.ErrorCodes.surrogateInInputStream:
      return "Surrogate in input stream";
    case parse5.ErrorCodes.nonVoidHtmlElementStartTagWithTrailingSolidus:
      return "Non-void HTML element tag cannot have a trailing solidus";
    case parse5.ErrorCodes.endTagWithAttributes:
      return "End tag cannot have attributes";
    case parse5.ErrorCodes.endTagWithTrailingSolidus:
      return "End tag cannot have a trailing solidus";
    case parse5.ErrorCodes.unexpectedSolidusInTag:
      return "Unexpected solidus in tag";
    case parse5.ErrorCodes.unexpectedNullCharacter:
      return "Unexpected null character in markup";
    case parse5.ErrorCodes.unexpectedQuestionMarkInsteadOfTagName:
      return "Unexpected question mark instead of a tag name";
    case parse5.ErrorCodes.invalidFirstCharacterOfTagName:
      return "Invalid first character in tag name";
    case parse5.ErrorCodes.unexpectedEqualsSignBeforeAttributeName:
      return "Unexpected equals sign before attribute name";
    case parse5.ErrorCodes.missingEndTagName:
      return "Missing end tag name";
    case parse5.ErrorCodes.unexpectedCharacterInAttributeName:
      return "Unexpected character in attribute name";
    case parse5.ErrorCodes.unknownNamedCharacterReference:
      return "Unknown named character reference";
    case parse5.ErrorCodes.missingSemicolonAfterCharacterReference:
      return "Missing semicolon after character reference";
    case parse5.ErrorCodes.unexpectedCharacterAfterDoctypeSystemIdentifier:
      return "Unexpected character after DOCTYPE system identifier";
    case parse5.ErrorCodes.unexpectedCharacterInUnquotedAttributeValue:
      return "Unexpected character in unquoted attribute value";
    case parse5.ErrorCodes.eofBeforeTagName:
      return "EOF before tag name could be determined";
    case parse5.ErrorCodes.eofInTag:
      return "EOF encountered within a tag";
    case parse5.ErrorCodes.missingAttributeValue:
      return "Missing attribute value";
    case parse5.ErrorCodes.missingWhitespaceBetweenAttributes:
      return "Missing whitespace between attributes";
    case parse5.ErrorCodes.missingWhitespaceAfterDoctypePublicKeyword:
      return "Missing whitespace after DOCTYPE public keyword";
    case parse5.ErrorCodes
      .missingWhitespaceBetweenDoctypePublicAndSystemIdentifiers:
      return "Missing whitespace between DOCTYPE public and system identifiers";
    case parse5.ErrorCodes.missingWhitespaceAfterDoctypeSystemKeyword:
      return "Missing whitespace after DOCTYPE system keyword";
    case parse5.ErrorCodes.missingQuoteBeforeDoctypePublicIdentifier:
      return "Missing quote before DOCTYPE public identifier";
    case parse5.ErrorCodes.missingQuoteBeforeDoctypeSystemIdentifier:
      return "Missing quote before DOCTYPE system identifier";
    case parse5.ErrorCodes.missingDoctypePublicIdentifier:
      return "Missing DOCTYPE public identifier";
    case parse5.ErrorCodes.missingDoctypeSystemIdentifier:
      return "Missing DOCTYPE system identifier";
    case parse5.ErrorCodes.abruptDoctypePublicIdentifier:
      return "Abrupt DOCTYPE public identifier";
    case parse5.ErrorCodes.abruptDoctypeSystemIdentifier:
      return "Abrupt DOCTYPE system identifier";
    case parse5.ErrorCodes.cdataInHtmlContent:
      return "CDATA sections are disallowed in HTML content";
    case parse5.ErrorCodes.incorrectlyOpenedComment:
      return "Incorrectly opened comment";
    case parse5.ErrorCodes.eofInScriptHtmlCommentLikeText:
      return "EOF in script HTML comment-like text";
    case parse5.ErrorCodes.eofInDoctype:
      return "EOF in DOCTYPE";
    case parse5.ErrorCodes.nestedComment:
      return "Nested comment encountered";
    case parse5.ErrorCodes.abruptClosingOfEmptyComment:
      return "Abrupt closing of empty comment";
    case parse5.ErrorCodes.eofInComment:
      return "EOF encountered in comment";
    case parse5.ErrorCodes.incorrectlyClosedComment:
      return "Incorrectly closed comment";
    case parse5.ErrorCodes.eofInCdata:
      return "EOF encountered in CDATA section";
    case parse5.ErrorCodes.absenceOfDigitsInNumericCharacterReference:
      return "Absence of digits in numeric character reference";
    case parse5.ErrorCodes.nullCharacterReference:
      return "Null character reference";
    case parse5.ErrorCodes.surrogateCharacterReference:
      return "Surrogate character reference";
    case parse5.ErrorCodes.characterReferenceOutsideUnicodeRange:
      return "Character reference outside Unicode range";
    case parse5.ErrorCodes.controlCharacterReference:
      return "Control character reference";
    case parse5.ErrorCodes.noncharacterCharacterReference:
      return "Noncharacter character reference";
    case parse5.ErrorCodes.missingWhitespaceBeforeDoctypeName:
      return "Missing whitespace before DOCTYPE name";
    case parse5.ErrorCodes.missingDoctypeName:
      return "Missing DOCTYPE name";
    case parse5.ErrorCodes.invalidCharacterSequenceAfterDoctypeName:
      return "Invalid character sequence after DOCTYPE name";
    case parse5.ErrorCodes.duplicateAttribute:
      return "Duplicate attribute";
    case parse5.ErrorCodes.nonConformingDoctype:
      return "Non-conforming DOCTYPE";
    case parse5.ErrorCodes.missingDoctype:
      return "Missing DOCTYPE";
    case parse5.ErrorCodes.misplacedDoctype:
      return "Misplaced DOCTYPE";
    case parse5.ErrorCodes.endTagWithoutMatchingOpenElement:
      return "End tag without matching open element";
    case parse5.ErrorCodes.closingOfElementWithOpenChildElements:
      return "Closing of element with open child elements";
    case parse5.ErrorCodes.disallowedContentInNoscriptInHead:
      return "Disallowed content in 'noscript' in 'head'";
    case parse5.ErrorCodes.openElementsLeftAfterEof:
      return "Open elements left after EOF";
    case parse5.ErrorCodes.abandonedHeadElementChild:
      return "Abandoned head element child";
    case parse5.ErrorCodes.misplacedStartTagForHeadElement:
      return "Misplaced start tag for head element";
    case parse5.ErrorCodes.nestedNoscriptInHead:
      return "Nested 'noscript' in 'head'";
    case parse5.ErrorCodes.eofInElementThatCanContainOnlyText:
      return "EOF in element that can contain only text";
  }
}

export function isParse5TextNode(
  node: parse5TreeAdapter.Node,
): node is parse5TreeAdapter.TextNode {
  return node.nodeName === "#text";
}

export function isParse5CommentNode(
  node: parse5TreeAdapter.Node,
): node is parse5TreeAdapter.CommentNode {
  return node.nodeName === "#comment";
}

export function isParse5Element(
  node: parse5TreeAdapter.Node,
): node is parse5TreeAdapter.Element {
  return node.nodeName !== "#text" && node.nodeName !== "#comment";
}

export { parse5, type parse5TreeAdapter };
