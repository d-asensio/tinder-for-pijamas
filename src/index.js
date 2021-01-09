const path = require('path')

const app = require('express')();
const http = require('http').Server(app);
const io = require('socket.io')(http);
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
    const htmlFilePath = path.join(__dirname, '../public/index.html')
    res.sendFile(htmlFilePath);
});

const socketsById = new Map()
const movieLikesByMovieId = new Map()

io.on('connection', (socket) => {
  socketsById.set(socket.id, socket)

  socket.on('movie.like', movieId => {
    const movieLikes = getMovieLikes(movieId) 
    
    movieLikes.add(socket.id)

    setMovieLikes(movieId, movieLikes)

    const [matchedMovieId] = getMatches()

    if (matchedMovieId) {
      broadcastMatch(matchedMovieId)
    }
  });
});

io.on('disconnect', (socket) => {
  deleteUserIdFromLikes(socket.id)
});

function deleteUserIdFromLikes(userId) {
  socketsById.delete(userId)

  for (const usersIdLiked of movieLikesByMovieId.values()) {
    usersIdLiked.delete(userId)
  }
}

function getMatches() {
  return ['la cenicienta']
}

function getMovieLikes(movieId) {
  if (!movieLikesByMovieId.has(movieId)) return new Set()

  return movieLikesByMovieId.get(movieId)
}

function setMovieLikes(movieId, movieLikes) {
  movieLikesByMovieId.set(movieId, movieLikes)
}

function broadcastMatch (movieId) {
  for (const targetSocket of socketsById.values()) {    
    targetSocket.emit('movie.match', movieId);
  }
}

http.listen(port, () => {
  console.log(`Socket.IO server running at http://localhost:${port}/`);
});
