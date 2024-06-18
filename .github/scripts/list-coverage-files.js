#!/usr/bin/env node
import { globby } from "globby";

const entries = await globby("coverage/**/lcov.info");
console.log(entries.join(" "));
