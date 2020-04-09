import 'reflect-metadata';
import 'graphql-import-node';
import './lib/env';
import { AppModule } from './modules/app.module';
import { ApolloServer } from 'apollo-server';
import mongoose from 'mongoose';

//TODO: apollo-server-express for middleware?? https://www.robinwieruch.de/graphql-apollo-server-tutorial

const APOLLO_PORT = 4444;

// Wiring up mongodb
const MONGO_URI = process.env.MONGO_URI;

if (MONGO_URI) {
  mongoose
    .connect(MONGO_URI, {
      useUnifiedTopology: true,
      useNewUrlParser: true,
    })
    .catch((error) => {
      console.log('Mongodb connection error: ', error);
    });
}

// The AppModule is just an aggregation of all other modules to
// abstract them away from the server file.
const server = new ApolloServer({
  modules: [AppModule],
  context: (session) => session,
});

server.listen(APOLLO_PORT).then(({ url }) => {
  console.log(`server ready at ${url}`);
});
