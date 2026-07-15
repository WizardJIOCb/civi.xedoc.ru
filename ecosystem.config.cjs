/* global module, __dirname */
module.exports = {
  apps: [{
    name: 'civi-xedoc',
    script: 'apps/server/dist/index.js',
    cwd: __dirname,
    instances: 1,
    exec_mode: 'fork',
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production',
      HOST: '127.0.0.1',
      PORT: 4100,
      PUBLIC_ORIGIN: 'https://civi.xedoc.ru',
      SIMULATION_AUTOSTART: 'true',
    },
  }],
};
