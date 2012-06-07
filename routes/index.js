var parser = require('../services/parser'),
    db = require('../services/db'),
    keys = require('../util/util').keys;

module.exports = function (app) {

    /**
    * working as a middleware, validate user session from cookies and set the request.user if:
    * 1. user already login ( usersession is set)
    * 2. cookies is not tampered
    * 3. not timeout
    */
    function validateUserSession(req, res, next){
        var userSession = req.cookies.get('ShiningSession');
        debugger;
        if (userSession){
            var tokens = userSession.split('##');
            if (tokens && tokens.length == 2){
                var username = tokens[0].split('::')[0],
                    signedUsername = tokens[0].split('::')[1],
                    lastLogin = tokens[1].split('::')[0],
                    signedLastLogin = tokens[1].split('::')[1];
                // the cookie is not tampered.
                if (keys.verify(username, signedUsername) && keys.verify(lastLogin, signedLastLogin)){
                    var intervalInMills = (new Date()).getTime() - Date.parse(lastLogin);
                    if (intervalInMills < 30*60*1000){
                        req.user = username;
                        // refresh client cookies' timestamp
                        res.cookies.set("ShiningSession", generateUserSession(username)); 
                    }else{
                        console.log('The userSession of ' + username + " was expired!!");
                    }
                }else{
                    console.log('The userSession of ' + username + " was tampered");
                }
            }
        }
        next(); 
    }

    // URL to redirect to login page.
    app.get('/login', function(req, res){
        res.render('login', { title: 'Sign up / in', errMsg: '' });
    });

    app.get('/logout', function(req, res){
        delete req.user;
        req.cookies.set('ShiningSession', undefined);
        res.render('index', {title: 'Shining Dict', results:'', login:req.user });
    });

    app.post('/login', function(req, res){
        var username = req.param('username'),
        password = req.param('password');

        db.checkLogin(username, keys.sign(password), function(err, results, fields){
            if (results.length > 0){
                res.cookies.set("ShiningSession", generateUserSession(username)); 
                req.user = username;
                res.redirect('/');
            }else{
                //TODO: Don't flash the page and fill the username.
                res.render('login', {title:'Sign up /in' , errMsg:'Unmatched username and password!'});
            }
        });
    });

    app.post('/signup', function(req, res){
        var username = req.param('username'),
        password = req.param('password');

        db.createUser(username, password, function(err){
            if (err){
                console.log(err.toString());
                res.render('login', {title:'Sign up /in' , errMsg:err.toString()});
                return;
            }

            // Automatically login
            res.cookies.set("ShiningSession", generateUserSession(username)); 
            res.render('index', {title: 'Shining Dict:::' + username, results:'', login: req.user });
        });
    });

    // ------------------------------------------------------------ 
    // Will check user session below
    app.get('/', validateUserSession, function (req, res){
        res.render('index', { title: 'Shining Dict', results: '', login: req.user })
    });
    

    app.get('/lookup', validateUserSession, function(req, res){
        search(req, res);
    });

    app.get('/lookup/:word', validateUserSession, function(req, res){
        search(req, res);
    });

    app.post('/addnew/:word', validateUserSession, function(req, res){
        var word = req.param('word'),
            username = req.user;    
        if (typeof username === undefined || null == username){
            res.render('login', {title: 'Sign in / up' });
        }
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

   app.get('/checkNewWord/:word', validateUserSession, function(req, res){
        var word = req.param('word'),
            username = req.user;    

        if (typeof username === undefined || null == username){
            res.render('login', {title: 'Sign in / up' });
            return;
        }

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
    res.send({
        "title": 'Shining Dict ::: ' + word,
        "content": content
    });
} 
/**
* user session format:
* <username::signed_username##last_login::signed_last_login>
*/
function generateUserSession(username){
    var now = (new Date()).toISOString();
    return username + "::" + keys.sign(username) + "##" + now + "::" + keys.sign(now);
}
