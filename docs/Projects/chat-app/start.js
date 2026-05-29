require("dotenv").config();
const { spawn } = require("child_process");
const path = require("path");

const args = process.argv.slice(2);
for (let i = 0; i < args.length; i++) {
  if (args[i] === "--host" && args[i + 1]) process.env.HOST = args[++i];
  else if (args[i] === "--port" && args[i + 1]) process.env.PORT = args[++i];
}

const memoryMB = parseInt(process.env.MEMORY_MB) || 256;
const serverPath = path.join(__dirname, "server.js");

const child = spawn(process.execPath, [`--max-old-space-size=${memoryMB}`, serverPath], {
  stdio: "inherit",
  cwd: __dirname,
  env: process.env,
});

child.on("exit", (code) => process.exit(code ?? 0));
