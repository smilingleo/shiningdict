if(process.env.VCAP_SERVICES){
    var env = JSON.parse(process.env.VCAP_SERVICES);
    var sql_options = env['mysql-5.1'][0]['credentials'];
    var schema = sql_options.name;
}else{
    var sql_options = {
        host: 'localhost',
        user: 'root',
        password: ''
    }, schema = 'dict';
    
}
var mysql = require('mysql'),
    client = mysql.createClient(sql_options),
    keys = require('../util/util').keys;

var DB_SCHEMA = schema,
    T_USER = 't_user',
    T_NEW_WORD = 't_new_word',
    T_COMMENT = 't_comment';

var DAO = {
    /*
    * Create database and tables if not exists, and then use that database
    */
    initDB : function (){
        function createTables() {
            // create user table if not exists
            client.query("CREATE TABLE IF NOT EXISTS " + T_USER + " ("
                + "username varchar(50) not null primary key,"
                + "passwd varchar(100) not null,"
                + "last_login datetime not null"
            + ")", function(err) {
                if (err) {
                    console.log("Can't create table " + T_USER + ", because: " + err);
                    return;
                }
                console.log("\tTable " + T_USER + " was created!");
            });

            // create new word table if not exists
            client.query("CREATE TABLE IF NOT EXISTS " + T_NEW_WORD + " ("
                + "username varchar(100) not null,"
                + "new_word varchar(200) not null,"
                + "added_on datetime not null,"
                + "primary key (username, new_word)"
            + ")", function(err) {
                if (err) {
                    console.log("Can't create table " + T_NEW_WORD + ", because: " + err);
                    return;
                }
                console.log("\tTable " + T_NEW_WORD + " was created!");
            });
        }

        client.query("CREATE DATABASE IF NOT EXISTS " + DB_SCHEMA, function(err) {
            if (err) {
                console.log("Can't create database, because: " + err);
                return;
            }
            console.log("\tDatabase " + DB_SCHEMA + " was created!");

            client.query("use " + DB_SCHEMA);
            client.database = DB_SCHEMA;

            createTables();

        });
    },

    /*
    * add one new word
    * @param username 
    * @param new_word : new word to be added
    * @param callback : callback to execute if the word was added or not.
    */
    rememberNewWord : function(username, new_word, callback){
        console.log('going to add ' + username + ',' + new_word);
        client.query("INSERT INTO " + T_NEW_WORD + "(username, new_word, added_on) values(?,?,?)",
            [username, new_word, (new Date()).toISOString()], callback
        );
    },

    /*
    * check if this word is already added to username's book
    * @param username
    * @param new_word
    * @param callback : since nodejs is all async, we have to passed in a callback function from web layer.
    */
    checkAdded : function(username, new_word, callback){
        console.log('checking:' + new_word + ' for ' + username);
        client.query("SELECT new_word FROM " + T_NEW_WORD + " WHERE username=? AND new_word=?",
            [username, new_word], callback);
    },

    /*
    * login to system 
    * @param username
    * @param password signed password
    * @param callback(err, results, fields)
    * @return true: if succeed, false: if not
    */
    checkLogin : function(username, password, callback){
        client.query("select * from " + T_USER + " where username=? and passwd=?", [username, password], callback);
    },

    /**
    * Create an user, aka, sign up a new user
    * If the user with same username has already existed, throw an error
    * @param username
    * @param password
    * @param callback
    */
    createUser : function(username, password, callback){
        client.query("insert into " + T_USER + " values(?,?,?)", [username, keys.sign(password), (new Date()).toISOString()], callback);
    }
}

module.exports = DAO;
