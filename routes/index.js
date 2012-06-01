var parser = require('../services/parser'),
    db = require('../services/db');

module.exports = function (app) {
    app.get('/', function (req, res){
        res.render('index', { title: 'Shining Dict', results: '' })
    });
    
    app.get('/lookup', function(req, res){
            search(req, res);
    });

    app.get('/lookup/:word', function(req, res){
        search(req, res);
    });

    app.post('/addnew/:word', function(req, res){
        var word = req.param('word'),
            username = req.param('username');    
        username = (typeof username === undefined || null == username) ? "test" : username;
        db.rememberNewWord(username, word, function(err){
            var succeeded = true;
            if (err){
                console.log("Error happens when trying to insert new word:" + word + ", for " + username + ". Err:" + err);
                succeeded = false;
            }
            res.send({
                "added": succeeded
            });
        });
    });

    // handle parames <username>
    // TODO: add logic to do authentication:
    // 1. if (username is null) or (user name is not null, but not logon), redirect to login page with original url
    // 2. 
    app.param('username', function(req, res, next, username){
        console.log('handling parameter of username .....');
        res.cookies.set("username", username);
        next();
    });

    app.get('/checkNewWord/:username/:word', function(req, res){
        console.log("cookies in req:" + req.cookies.get('username'));
        var word = req.param('word'),
            username = req.param('username');    
        username = (typeof username === undefined || null == username) ? "test" : username;

        db.checkAdded(username, word, function(err, results){
            if (err){
                console.log('ERROR happens when checking word in book or not:' + word + ", Error message:" + err);
                return;
            }
            if (results){
                console.log('this word:' + word + ' added ? ' + JSON.stringify(results));
                res.send({
                    "added": (results.length > 0) ? true : false
                });
            }

        }); 
    });
};

//////////////////////////////////////////////////
// private methods
//////////////////////////////////////////////////

function search(req, res){
    var word = req.param('word'),
        content = (typeof word === undefined || null == word) ? "" : parser.lookup(word, 'zh', 'en');
    //res.render('index', { 
    //    title: 'Shining Dict ::: ' + word,
    //    results: content
    //});
    res.send({
        "title": 'Shining Dict ::: ' + word,
        "content": content
    });
} 

