"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
require("graphql-import-node");
const app_module_1 = require("./modules/app.module");
const apollo_server_1 = require("apollo-server");
const PORT = 4444;
//console.log(AppModule.typeDefs);
const server = new apollo_server_1.ApolloServer({
    modules: [app_module_1.AppModule]
});
server.listen(PORT).then(({ url }) => {
    console.log(`server ready at ${url}`);
});
//# sourceMappingURL=server.js.map