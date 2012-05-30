var mysql = require('mysql'),
    client = mysql.createClient({
        host: 'localhost',
        user: 'root',
        password: ''
    });

var DB_SCHEMA = 'dict',
    T_USER = 't_user',
    T_NEW_WORD = 't_new_word',
    T_COMMENT = 't_comment';
/*
* Create database and tables if not exists, and then use that database
*/

exports.initDB = function (){

    client.query("CREATE DATABASE IF NOT EXISTS " + DB_SCHEMA, function(err) {
            if (err) {
                console.log("Can't create database, because: " + err);
                return;
            }
            console.log("\tDatabase " + DB_SCHEMA + " was created!");

            client.query("use " + DB_SCHEMA);
            client.database = DB_SCHEMA;

            // create user table if not exists
            client.query("CREATE TABLE IF NOT EXISTS " + T_USER + " ("
                + "id bigint not null primary key,"
                + "username varchar(100) not null,"
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

    });

}

/*
* add one new word
* @username 
* @new_word : new word to be added
* @callback : callback to execute if the word was added or not.
*/
exports.rememberNewWord = function(username, new_word, callback){
    console.log('going to add ' + username + ',' + new_word);
    client.query("INSERT INTO " + T_NEW_WORD + "(username, new_word, added_on) values(?,?,?)",
        [username, new_word, new Date()], callback
    );
}

/*
* check if this word is already added to username's book
* @username
* @new_word
* @callback : since nodejs is all async, we have to passed in a callback function from web layer.
*/
exports.checkAdded = function(username, new_word, callback){
    console.log('checking:' + new_word + ' for ' + username);
    client.query("SELECT new_word FROM " + T_NEW_WORD + " WHERE username=? AND new_word=?",
        [username, new_word], callback);
}
