var submit=document.getElementById("login_button");
var user=document.getElementById("username_input");
var password=document.getElementById("password_input");
submit.addEventListener('click',function(){
  if(user.innerHTML=="")
  {
    alert("Incomplete Field");
  }
  console.log(1);
});
