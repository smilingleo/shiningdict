/*
* Search dictionary
*/
function search(){
    var word = getCurrentWord();
    $.get('/lookup/'+word, function(data){
        
        $('#translated_content > p')[0].innerHTML = data.content; // $('xxx') return an array

        // Focus on the input and select original word
        $('#search_word')[0].focus();
        $('#search_word')[0].select();

        //check if the word has already been added or not
        if ($('#lb_user')[0].innerHTML)
            $.get('/checkNewWord/' + word, changeAddedFlag);
    });
}

/*
* Add the word in search_box to new word book.
*
*/
function remember(){
    var word = getCurrentWord();
    //alert(word + " was added to new book!");
    $.post('/addnew/' + word, changeAddedFlag);
}

/**
* Get username & password and post to server
*/
function signup(){
    var username = $('#username')[0].value,
        password = $('#password')[0].value;

    $('#loginForm')[0].action = "/signup";

    $('#loginForm')[0].submit();
}

////////////////////////////////////////////////////////////
// private function below
////////////////////////////////////////////////////////////

function getCurrentWord(){
    return $("#search_word")[0].value;
}

/*
* Change the flag of added sign
* TODO: change to an icon
*/
function changeAddedFlag(data){
    if (data.added)
        $('#added_flag')[0].innerHTML = 'Done';
    else
        $('#added_flag')[0].innerHTML = 'Add';

}

////////////////////////////////////////////////////////////
// register DOM event
////////////////////////////////////////////////////////////

$(document).ready(function() {
    $("#search_form").submit(function(){
        search();
        return false;
    });
    $("#search_word")[0].focus();
});
