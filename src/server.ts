import 'reflect-metadata';
import 'graphql-import-node';
import './lib/env';
import { AppModule } from './modules/app.module';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import mongoose from 'mongoose';
import cors from 'cors';
import compression from 'compression';

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

const app = express();

app.use('*', cors());

app.use(compression());

// The AppModule is just an aggregation of all other modules to
// abstract them away from the server file.
const server = new ApolloServer({
  modules: [AppModule],
  context: (session) => {
    // console.log(session.req.headers.host);

    return session;
  },
});

server.applyMiddleware({ app, path: '/graphql' });

server.applyMiddleware({ app });

app.listen({ port: APOLLO_PORT }, () => {
  console.log(`server ready at http://localhost:${APOLLO_PORT}/graphql`);
});
