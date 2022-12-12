require("dotenv").config();
const express = require("express");
const _ = require("lodash");
const mongoose = require("mongoose");
const date = require(__dirname + "/date.js");
const app = express();

app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect(
  `mongodb+srv://admin-scott:${process.env.PASSWD}@cluster0.5mytelb.mongodb.net/todolistDB`
);

// define schema
const itemsSchema = new mongoose.Schema({
  name: String,
});
const listSchema = new mongoose.Schema({
  name: String,
  items: [itemsSchema],
});
// compile schema to model
const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", listSchema);

app.get("/favicon.ico", function (req, res) {
  res.status(204).end();
});

// main todo list page
app.get("/", function (req, res) {
  Item.find({}, function (err, foundItems) {
    if (err) {
      console.log("Error:", err);
    } else {
      let day = date();

      // find all of the custom list names and the items associated with each name
      List.find({}, function (err, foundLists) {
        if (err) {
          console.log("Error:", err);
        } else {
          res.render("list", {
            listTitle: day,
            allLists: foundLists,
            newListItems: foundItems,
            deleteRoute: "/deleteItem",
            route: "/",
          });
        }
      });
    }
  });
});

app.post("/", function (req, res) {
  const itemName = req.body.newItem;

  const newItem = new Item({
    name: itemName,
  });

  // save model to database
  newItem.save();
  res.redirect("/");
});

app.post("/deleteItem", function (req, res) {
  const itemId = req.body.button;

  Item.findByIdAndRemove(itemId, function (err) {
    if (err) {
      console.log("Error:", err);
    } else {
      console.log("Successfully deleted the item.");
      res.redirect("/");
    }
  });
});

// custom todo list page
app.get("/:anyToDoList", function (req, res) {
  const customListName = _.capitalize(req.params.anyToDoList);

  List.findOne({ name: customListName }, function (err, foundList) {
    if (err) {
      console.log("Error:", err);
    } else {
      if (!foundList) {
        // create a new list
        const list = new List({
          name: customListName,
          items: [],
        });

        list.save();
        res.redirect("/" + customListName);
      } else {
        List.find({}, function (err, foundLists) {
          if (err) {
            console.log("Error:", err);
          } else {
            // show an existing list
            res.render("list", {
              listTitle: foundList.name,
              allLists: foundLists,
              newListItems: foundList.items,
              deleteRoute: "/delete/" + foundList.name,
              route: "/" + foundList.name,
            });
          }
        });
      }
    }
  });
});

app.post("/:anyToDoList", function (req, res) {
  const listName = req.params.anyToDoList;

  const itemName = req.body.newItem;
  const newItem = new Item({
    name: itemName,
  });

  List.findOne({ name: listName }, function (err, foundList) {
    foundList.items.push(newItem);
    foundList.save();
    res.redirect("/" + listName);
  });
});

app.post("/delete/:anyToDoList", function (req, res) {
  const listName = req.params.anyToDoList;
  const itemId = req.body.button;

  List.findOne({ name: listName }, function (err, foundList) {
    if (err) {
      console.log("Error:", err);
    } else {
      foundList.items.pull({ _id: itemId });
      foundList.save();
      console.log("Successfully deleted the item.");
      res.redirect("/" + listName);
    }
  });
});

app.get("/:listName/delete", function (req, res) {
  const listName = _.capitalize(req.params.listName);

  List.deleteOne({ name: listName }, function (err, foundName) {
    if (!err) {
      console.log("Successfully deleted the todo list.");
      res.redirect("/");
    }
  });
});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
  console.log("Server has started successfully.");
});
