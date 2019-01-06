var Metalsmith  = require('metalsmith');
var markdown    = require('metalsmith-markdown');
var layouts     = require('metalsmith-layouts');
var permalinks  = require('metalsmith-permalinks');
var data = require('metalsmith-data')
var inplace = require('metalsmith-in-place')
var SpotifyWebApi = require('spotify-web-api-node')
var _ = require('underscore');
var browserSync = require('browser-sync')
var argv = require('minimist')(process.argv)
var asset = require('metalsmith-assets')
var gallery = require('./gallery.js')

var spotifyApi = new SpotifyWebApi({
    clientId: process.env.SPOTIFY_CLIENTID,
    clientSecret:  process.env.SPOTIFY_CLIENTSECRET
});

if (!argv.prod) {
  browserSync({
      server: 'build',
      files: ['src/*.*', 'layouts/*.*', 'assets/*.css', 'build.js'],
      middleware: function (req, res, next) {
          build(next);
      }
  })
} 

else {
  build(function () {
      console.log('Done building.');
  })
}


function build (callback) {
apiData( ).then(function(apidata) {

Metalsmith(__dirname)
  .metadata({
    title: 'Olli-Pekka Lehtinen',
    generator: "Metalsmith",
    url: "https://op.lehtinen.xyz/"
  })
  .use(data({
    links: {
      src: './data/data.json',
      property: 'links'
    },
    spotify: function() {
      return apidata
    },
  
  }))
  .use(gallery({
    
  }))
  .source('./src')
  .destination('./build')
  .clean(true)
  .use(markdown())
  .use(permalinks({
    relative:false
  }))
  .use(layouts({
    engine: 'nunjucks' },
  ))
  .use(inplace({
    "suppressNoFilesError":true
  }))
  .use(asset({
    source : "./static",
    destination : "./"
  }))


  .build(function(err, files) {
    if (err) { throw err }
    // console.log(files)
    callback()
  });
})
}

async function apiData() {
  const playlist = await spotifyDetailsData()
  const genres = await getGenredata()
    for (var i = 0; i < genres.length; i++) {
      playlist[i].genres = genres[i].slice(0,10)
    }
  return playlist
}


async function spotifyData() {
  const creds = await spotifyApi.clientCredentialsGrant()
  spotifyApi.setAccessToken(creds.body['access_token']);
  const playlists = await spotifyApi.getUserPlaylists('dimits')
  return playlists;
}

async function spotifyDetailsData() {
  const playlists = await spotifyData()
  detailsArr = []
  const promises = playlists.body.items.map(async(value) => {
    const details = await spotifyApi.getPlaylist(value.id)
    return details.body;
   })
  return Promise.all(promises)
}

async function spotifyGenres() {
  const playlists = await spotifyData()
  const artists = await playlists.body.items.map(async (value) => {
    const details = await spotifyApi.getPlaylist(value.id)
    return Promise.all( details.body.tracks.items.map(async (item) => {
      const result = await item.track.artists[0].id
      return result
      }))
  })
  return Promise.all(artists)
}

async function getGenredata () {
  const genredata = await spotifyGenres()
  const genrelist = await genredata.map(async (list) => {
    const query = list.splice(0,50)
    const genres = await spotifyApi.getArtists(query)
    return genres.body.artists
  })
  return Promise.all(genrelist.map(async (genre) => {
    const data = await genre
    var arr = []
    data.forEach(function(e) {
      if (e.genres != undefined && e.genres[0] != undefined) {
        arr.push(e.genres[0])
      }
    })
    return await _.uniq(arr)
  }))
}
