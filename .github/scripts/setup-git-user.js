import { $ } from "execa";

const email = "41898282+github-actions[bot]@users.noreply.github.com";
const name = "GitHub Actions";

await $`git config --global user.email ${email}`;
await $`git config --global user.name ${name}`;
