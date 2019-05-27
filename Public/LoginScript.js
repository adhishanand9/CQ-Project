var loginBtn=document.getElementById("login_button");
var userName=document.getElementById("username_input");
var passWord=document.getElementById("password_input");
loginBtn.addEventListener('click',function(event){
    if(userName.value == ""|| passWord.value == ""){
        alert("All Fields are required");
    } else {
        var userdata = new Object();
        userdata.userName = userName.value;
        userdata.passWord = passWord.value;
        console.log(userdata);
        var request = new XMLHttpRequest();
        request.open("POST",'/Login');
        request.setRequestHeader("Content-Type","application/json");
        request.send(JSON.stringify(userdata));
        request.onload = function(){
            var dataReturned = JSON.parse(request.responseText);
            if(dataReturned.length==""){
                alert('User Does Not Exist.');
                userName.value="";
                passWord.value="";
            } else {
                console.log(dataReturned);
                window.location ="/profile";
            }
        }
    }
});
