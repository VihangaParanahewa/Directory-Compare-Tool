const express = require('express');
var bodyParser = require('body-parser');
const path = require('path');
const app = express();
const hbs  = require('express-handlebars');
const port = process.env.PORT || 3000;

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname, "public")));

app.engine('hbs', hbs( { extname: 'hbs', defaultLayout: 'layout', layoutsDir: __dirname + '/views/layouts/'}));
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');


app.use('/', require('./controllers'));


app.listen(port, ()=> {
    console.log("Listing to port 3000");
});
