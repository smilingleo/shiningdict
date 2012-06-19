/*
* Search dictionary
* if word_in_book != null, it's used in book case, otherwise, in search page.
*/
function search(word_in_book){
    var word = word_in_book || getCurrentWord();
    $.get('/lookup/'+word, function(data){
        var pattern = new RegExp(word_in_book, "gi");
        var translated = (word_in_book ? data.content.replace(pattern, '~') : data.content);
        $('#translated_content > p')[0].innerHTML = translated; // $('xxx') return an array

        // refocus to search box if on search page.
        if ($("#search_form").length > 0 ){
            // Focus on the input and select original word
            $('#search_word')[0].focus();
            $('#search_word')[0].select();

            //check if the word has already been added or not
            if ($('#lb_user').length){
                $.get('/checkNewWord/' + word, changeAddedFlag);
            }
        }

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
*/
function changeAddedFlag(data){
    if (data.added)
        $('#added_flag')[0].className ='icon-minus';
    else
        $('#added_flag')[0].className ='icon-plus';

}

////////////////////////////////////////////////////////////
// register DOM event
////////////////////////////////////////////////////////////

$(document).ready(function() {
    if ($("#search_form").length > 0 ){
        $("#search_form").submit(function(){
            search();
            return false;
        });
        $("#search_word")[0].focus();
    }
});
