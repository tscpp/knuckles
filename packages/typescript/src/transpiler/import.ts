export function parseImportDeclaration(string: string) {
  const chars = Array.from(string);
  let i = 0;
  let char = chars[i];
  const advance = () => (char = chars[++i]);

  let clause: string;

  if (char === "*") {
    clause = char;
    advance();
  } else if (char && /[a-z$_]/i.test(char)) {
    clause = char;
    advance();

    while (char && /[a-z0-9$_]/i.test(char)) {
      clause += char;
      advance();
    }
  } else {
    return;
  }

  if (char && /\s/.test(char)) {
    advance();

    while (char && /\s/.test(char)) {
      advance();
    }
  } else {
    return;
  }

  if (string.slice(i, i + "from".length) === "from") {
    i += "from".length;
    char = chars[i];
  } else {
    return;
  }

  if (char && /\s/.test(char)) {
    advance();

    while (char && /\s/.test(char)) {
      advance();
    }
  } else {
    return;
  }

  const quote = char;
  if (!(quote === '"' || quote === "'")) {
    return;
  }
  advance();

  let module = "";
  while (char !== quote) {
    if (char === "\\") {
      advance();
      if (!char) return;
    }
    module += char;
    advance();
  }

  if (char !== quote) {
    return;
  }

  return {
    clause,
    module,
  };
}
