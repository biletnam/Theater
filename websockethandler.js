/**
 * Created by todd on 3/14/2016.
 */
exports.wsData =  function(data,id){
  if (data.type =="vanagtelowlevelserialcommand") {
      console.log("message :"+data.data);
      serial.write(data.data+'\r');

  } else if (data.type == "shower"){

          if (data.instruction == 'updateuser'){
              console.log('update record:'+data.id);
              var id = new  require('mongodb').ObjectID(data.id);
              db.collection('waterheater').update({_id: id},{$set :{showeruser: data.user}},function(err,rslt){
                  //console.log(err,rslt);
              });
          } else if (data.instruction == 'updateonminutes') {
              console.log('update record:' + data.id);
              var id = new require('mongodb').ObjectID(data.id);
              data.onminutes = Number(data.onminutes);
              db.collection('waterheater').update({_id: id}, {$set: {onminutes: data.onminutes,gascost: (data.onminutes*0.0250130322580645)}}, function (err, rslt) {
                  //console.log(err,rslt);
              });
          } else if (data.instruction == 'duplicate') {
              console.log('duplicate record:' + data.id);
              var id = new require('mongodb').ObjectID(data.id);
              db.collection('waterheater').find({_id: id}).toArray(function (err, rslt) {
                  console.log('find record');
                  delete rslt[0]._id;
                  db.collection('waterheater').insertOne(rslt[0],function(err,rslt){
                      console.log('rslt'+rslt,err);

                  });
              });
          }



  }else if (data.type=="executecommand" ){
      //      websocketsend("executecommand",{command:things[i].commands[0],object:things[i],value:level});
      ll.executecommand(data.data.object,data.data.command,data.data.value);
      console.log(data.data.object  )
  }

  else
  {
      console.log('unknown datatype '+data.type)

  }

}
