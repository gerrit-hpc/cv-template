import bcrypt from "bcryptjs";
import readline from "node:readline/promises";

async function main() {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const pw = await rl.question("Password: ");
  rl.close();
  if (!pw) {
    console.error("Empty password");
    process.exit(1);
  }
  const hash = await bcrypt.hash(pw, 12);
  console.log("\nPaste this into your .env as ADMIN_PASSWORD_HASH:");
  console.log(hash);
}

main();
