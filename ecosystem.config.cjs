module.exports = {
  apps: [
    {
      name: "mohasby",
      script: "node_modules/next/dist/bin/next",
      args: "start -p 3088",
      cwd: __dirname,
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      max_memory_restart: "1G",
      env: { NODE_ENV: "production" },
    },
  ],
};
