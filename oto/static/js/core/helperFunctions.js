
/**********************************
 *
 * Helper functions
 *
 ********************************/
/*
function makeid() {
   //in python: os.urandom(16).encode('hex')
   var text = "";
   var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

   for (var i = 0; i < 16; i++)
      text += possible.charAt(Math.floor(Math.random() * possible.length));

   return a2hex(text);
}

function a2hex(str) {
   var arr = [];
   for (var i = 0, l = str.length; i < l; i++) {
      var hex = Number(str.charCodeAt(i)).toString(16);
      arr.push(hex);
   }
   return arr.join('');
}
*/

function getdate(date) {
   if (!date) {
      var d = new Date();
   } else {
      var d = date;
   }
   var curr_date = d.getDate();
   var curr_month = d.getMonth() + 1;
   var curr_year = d.getFullYear();
   var curr_hour = d.getHours();
   var curr_min = d.getMinutes();

   if (curr_date < 10)
      curr_date = "0" + curr_date;
   if (curr_month < 10)
      curr_month = "0" + curr_month;
   if (curr_hour < 10)
      curr_hour = "0" + curr_hour;
   if (curr_min < 10)
      curr_min = "0" + curr_min;

   return curr_year + "-" + curr_month + "-" + curr_date + " " + curr_hour + ":" + curr_min + ":00";
}

/*Array.prototype.getUnique = function() {
   var u = {}, a = [];
   for (var i = 0, l = this.length; i < l; ++i) {
      if (u.hasOwnProperty(this[i])) {
         continue;
      }
      a.push(this[i]);
      u[this[i]] = 1;
   }
   return a;
};*/