export function parseWithDirective(string: string):
  | {
      import: {
        specifier: string;
        module: string;
      };
      inline: undefined;
    }
  | {
      import: undefined;
      inline: string;
    } {
  const importInfo = parseImport(string);
  if (importInfo) {
    return {
      import: importInfo,
      inline: undefined,
    };
  } else {
    return {
      import: undefined,
      inline: string,
    };
  }
}

function parseImport(string: string):
  | {
      specifier: string;
      module: string;
    }
  | undefined {
  const chars = Array.from(string);
  let i = 0;
  let char = chars[i];
  const advance = () => (char = chars[++i]);

  let specifier: string;

  if (char === "*") {
    specifier = char;
    advance();
  } else if (char && /[a-z$_]/i.test(char)) {
    specifier = char;
    advance();

    while (char && /[a-z0-9$_]/i.test(char)) {
      specifier += char;
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
    specifier,
    module,
  };
}
