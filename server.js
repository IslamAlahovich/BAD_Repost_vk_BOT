"use strict";

var http = require("http"),
    express = require("express"),
    bodyParser = require("body-parser"),
    app = express(),
    port = process.env.PORT || 3000,
    access_token = process.env.TOKEN;

const VK = require("vk-io"),
      vk = new VK({token: access_token}),
      chain = vk.chain();

app.listen(port);//port!!!!i

app.get("/", function(req, res){
   res.send("Welcome");
});


var old_post_date = [0, 0],
    post_date,
    post_text,
    post_id,
    owner_group_id,
    group_id,
    white_list = ["репост", "вступить", "лайк"],
    white_list_check = function(slovo){
       for(var i = 0; i < white_list.length; i++){
          if(white_list[i] === slovo) return true;
       }
    };

var repost_and_join = function(wall, index){
   if(wall.items[0].copy_history){ 
      post_date = wall.items[0].copy_history[0].date;   
      post_text = wall.items[0].copy_history[0].text.replace(/[^А-Яа-яA-Za-z\s]/g, ' ').toLowerCase().split(/\s+/);
      post_id = wall.items[0].copy_history[0].id;
      owner_group_id = wall.items[0].copy_history[0].owner_id;
   }else{
      post_date = wall.items[0].date;   
      post_text = wall.items[0].text.replace(/[^А-Яа-яA-Za-z\s]/g, ' ').toLowerCase().split(/\s+/);
      post_id = wall.items[0].id;
      owner_group_id = wall.items[0].owner_id;
   }
   console.log("POST_DATE_"+index+" : "+post_date+" POST_TEXT_"+index+" : "+post_text);

   if((old_post_date[index] !== post_date) && (post_text.some(white_list_check))){
      old_post_date[index] = post_date;
      
      vk.api.wall.repost({object: "wall"+owner_group_id+"_"+post_id})
      .then((response) => {console.log("REPOST_SUCCESS! REPOST "+post_id+" FROM "+owner_group_id);})
      .catch((error) => {console.log("WALL_REPOST_ERROR: "+error);});

      for(var i = 1; i < wall.groups.length; i++){
         group_id = wall.groups[i].id;
         vk.api.groups.join({group_id: group_id})
         .then((response) => {console.log("JOIN_SUCCESS: "+response+". JOIN TO "+group_id)})
         .catch((error) => {console.log("GROUPS_JOIN_ERROR: "+error);});
      }
   }else{console.log("NO_POINT_REPOSTING");}
};

vk.api.execute();

var timerID = setTimeout( function reposting() {
   if(timerID === 4) clearTimeout(timerID);
   else{
      vk.executes("wall.get", [
         {owner_id: -97758272, count: 1, extended: true},
         {owner_id: -109933725, offset: 1, count:1, extended: true}
      ])
      .then((wall_list) => {
         wall_list.forEach(function(wall, index) {
            repost_and_join(wall, index);
         });
      })
      .catch((error) => {
         console.log("WALL_GET_ERROR: "+error);
      });
      
      return timerID = setTimeout( reposting, 3600000);
   }
}, 3600000);

