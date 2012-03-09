var parser = require('../parser');

module.exports = function (app) {
    app.get('/', function (req, res){
        res.render('index', { title: 'Shining Dict', results: '' })
    });
    
    app.get('/lookup/:word', function(req, res){
        search(req, res);
    });
    app.post('/lookup', function(req, res){
        search(req, res);
    });
};

function search(req, res){
    var word = req.param('word'),
        content = (typeof word === undefined || null == word) ? "" : parser.lookup(word, 'zh', 'en');
    res.render('index', { 
        title: 'Shining Dict ::: ' + word,
        results: content
    });
} 
