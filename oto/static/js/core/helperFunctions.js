
/**********************************
 *
 * Helper functions
 *
 ********************************/


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

function getDateNoTime(date) {
   if (!date) {
      var d = new Date();
   } else {
      var d = new Date(date);
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

   return curr_year + "-" + curr_month + "-" + curr_date;// + " " + curr_hour + ":" + curr_min + ":00";
}


function getDateWithTime(date) {
   if (!date) {
      var d = new Date();
   } else {
      var d = new Date(date);
   }
   var curr_date = d.getDate();
   var curr_month = d.getMonth() + 1;
   var curr_year = d.getFullYear();
   var curr_hour = d.getHours();
   var curr_min = d.getMinutes();
   var curr_sec= d.getSeconds();

   if (curr_date < 10)
      curr_date = "0" + curr_date;
   if (curr_month < 10)
      curr_month = "0" + curr_month;
   if (curr_hour < 10)
      curr_hour = "0" + curr_hour;
   if (curr_min < 10)
      curr_min = "0" + curr_min;

   return curr_year + "-" + curr_month + "-" + curr_date + "T" + curr_hour + ":" + curr_min + ":" + curr_sec;
}
/*
function dynamicSort(property) {
    var sortOrder = 1;
    if(property[0] === "-") {
        sortOrder = -1;
        property = property.substr(1);
    }
    return function (a,b) {
        var result = (a[property] < b[property]) ? -1 : (a[property] > b[property]) ? 1 : 0;
        return result * sortOrder;
    };
}*/

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