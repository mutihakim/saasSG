module.exports = {
    apps: [{
        name: "family2-docs",
        script: "npx",
        args: "http-server docs/.vitepress/dist -p 8016",
        cwd: __dirname
    }]
};
