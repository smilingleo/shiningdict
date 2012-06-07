
/**
 * Module dependencies.
 */

var express = require('express'),
    routes = require('./routes'),
    parser = require('./services/parser'),
    fs = require('fs'),
    cookies = require('cookies'),
    keys = require('./util/util').keys,
    db = require('./services/db');

var dictPath = process.cwd() + '/dicts',
    dirs = fs.readdirSync(dictPath);

function findFile(dir, files, ext){
    return files.filter(function(file){
            var pattern = new RegExp('^.*\.'+ext+'$');
            return fs.statSync(dir + '/' + file).isFile() && pattern.test(file);
            });
}

console.log('Start loading dictionary......');
// Load dicts
dirs.forEach(function(dir){
        // only handle dir under '/dicts'
        var subdir = dictPath + '/' + dir;
        if (fs.statSync(subdir).isDirectory()){
            var files = fs.readdirSync(subdir);
            var infoFile = findFile(subdir, files, 'ifo');
            // a valid dict dir
            if (infoFile){
                var idxFile = findFile(subdir, files, 'idx'),
                dictFile = findFile(subdir, files, 'dict');
                // TODO: how to automatically determine the language?
                parser.loadDictSync(subdir + '/' + infoFile, subdir + '/' + idxFile, subdir + '/' + dictFile, 'zh', 'en');
                console.log('\t' + idxFile + ' loaded!');
            }
        }
});

// Initialize Database
console.log('Start initializing Database....');
db.initDB();




var app = module.exports = express.createServer();

// Configuration

app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.logger('short'));
  app.use(express.bodyParser());
  //app.use(express.cookieParser('rourou_liu K3C'));
  //app.use(express.cookieSession({ cookie: { maxAge: 60*1000*1000 } });
  app.use(cookies.express(keys));
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true }));
});

app.configure('production', function(){
  app.use(express.errorHandler());
});

// Routes

//app.get('/', routes.index);
routes(app);


app.listen(3000);
console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
