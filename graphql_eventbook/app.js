const express = require("express");

const bodyParser = require("body-parser");

const { Sequelize, DataTypes, Op } = require("sequelize");

const { graphqlHTTP } = require("express-graphql");

const { buildSchema } = require("graphql");

const cors = require("cors");

const app = express();

app.use(cors());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.get("/", (req, res) => {
  res.send("hello");
});

const sequelize = new Sequelize("eventsdb", "root", "akshaymurari", {
    host: "localhost",
    dialect: "mysql",
});

sequelize
.authenticate()
.then(() => {
    app.listen(8000, (error) => {
        console.log(error ? error : "listnening to port 8000");
    });
})
.catch((error) => {
    console.log("db not authenticated");
});

const db = {};

const events = require("./models/events")(sequelize,DataTypes);

const users = require("./models/users")(sequelize,DataTypes);

users.hasMany(events);

events.belongsTo(users);

db.users = users;

db.events = events;

sequelize.sync().then(()=>{
    console.log("sync table ");
}).catch(()=>{
    console.log("sync failed");
});

app.use(
  "/graphql",
  graphqlHTTP({
    schema: buildSchema(`
        type Event {
            id:ID!
            userUsername:String!
            title:String!
            description:String!
            price:Float!
            date:String!
        }
        type User{
          username:String!
        }
        input UserInput{
          username:String!,
          password:String!
        }
        input InputEvent{
            title:String!
            description:String!
            price:Float!
            date:String!
            userUsername:String!
        }
        type query{
            event : [Event!]!
            user : [User!]!
        }
        type create{
            create(event:InputEvent):Event
            createUser(user:UserInput):User
        }
        schema {
            query:query,
            mutation:create
        }
        `),
    rootValue: {
      user : async (args) => {
        const data = await db.users.findAll({
        });
        console.log(data);
        return data;
      },
      event: async () => {
        // console.log(events);
        const data = await db.events.findAll({});
        console.log(data);
        return data;
      },
      create: async (args) => {
          const data = await db.events.create({
            ...args.event 
          });
          console.log(data.dataValues);

        // console.log({ ...args.event });
        // events.push({ ...args.event });
        return data.dataValues;
      },
      createUser: async (args) => {
        const data = await db.users.create({
          ...args.user
        });
        console.log(data);
        return data;
      }
    },
    graphiql: true,
  })
);