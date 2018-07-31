var app = require('express')();
var http = require('http').Server(app);
var io = require('socket.io')(http);

var chatHistory = [];
var onlineUsers = [];

app.get('/', function(req, res){
  res.sendFile(__dirname + '/index.html');
});

// Broadcast a message to connected users when someone connects or disconnects
// - Add support for nicknames ✓
// - Don’t send the same message to the user that sent it himself. Instead, append the message directly as soon as he presses enter. ✓
// - Add “{user} is typing” functionality
// - Show who’s online
io.on('connection', function(socket){
  // Alerts console that an unnamed user has connected and displays their ID
  console.log(`An unnamed User (ID ${socket.id}) has connected.`);

  // sends an update of the onlineUser list to the client
  function listUpdate(){
    var userList = [];
    onlineUsers.forEach(function(user){
      userList.push(user.username);
    });
    io.emit('userList update', userList);
  }

  // When the User creates a user name it is passed here with their unique ID
  socket.on('new user', function(newUser){
    var onlineUser = {
      username: newUser,
      id: socket.id,
    };
    onlineUsers.push(onlineUser);
    // Alerts the chat and the server console of the Username chosen by the user
    console.log(newUser + " joined the chat!");
    io.emit('user connected', `${newUser} joined the chat!`);
    listUpdate();
  });

  // Tells all non sending clients another user is typing
  socket.on('userTyping', function(){
    socket.broadcast.emit('userTyping');
  });

  socket.broadcast.emit('hi');
  // Receives then Sends chat messages sent from one client back to client side
  socket.on('chat message', function(received){
    var msg = JSON.parse(received);
    var time = new Date(msg.date)
    var serverTime = time.toLocaleTimeString('en-US');
    msg.date = serverTime;
    var text = msg.text;
    console.log( serverTime + ': message: ' + text);
    msg = JSON.stringify(msg);
    io.emit('chat message', msg);
  });
  // Alerts console and client chat that a user has disconnected
  socket.on('disconnect', function(){
    // loops through onlineUsers to find the name of the user disconnecting
    for (var i = 0; i < onlineUsers.length; i++) {
      if (onlineUsers[i].id == socket.id) {
        var dcUser = onlineUsers[i].username;
        // removes the user from the Online user list
        onlineUsers.splice(i, 1);
      }
    }
    // tells the console the user and id of who left then tells client who left
    console.log(`User ${dcUser} (ID ${socket.id}) has left the chat!`);
    io.emit('user disconnected', `${dcUser} has left the chat!`);
    listUpdate();
  });
  io.emit('some event', { for: 'everyone' });
});

http.listen(3000, function(){
  console.log('listening on *:3000');
});
