$(function() {
  // Button will be disabled until we type anything inside the input field
  const autoCompleteInput = document.getElementById('autoComplete');
  const inputHandler = function(e) {
    if(e.target.value == "") {
      $('.movie-button').attr('disabled', true);
    } else {
      $('.movie-button').attr('disabled', false);
    }
  }
  autoCompleteInput.addEventListener('input', inputHandler);

  $('.movie-button').on('click',function(){
    var myApiKey = 'YOUR_API_KEY';
    var title = $('.movie').val();
    if (title == "") {
      $('.results').css('display', 'none');
      $('.fail').css('display', 'block');
    } else {
      loadDetails(myApiKey, title);
    }
  });
});

// will be invoked when clicking on the recommended movies
function recommendCard(e){
  var myApiKey = 'YOUR_API_KEY';
  var title = e.getAttribute('title'); 
  loadDetails(myApiKey, title);
}

// get the basic details of the movie from the API (based on the name of the movie)
function loadDetails(myApiKey, title){
  $.ajax({
    type: 'GET',
    url: 'https://api.themoviedb.org/3/search/movie?api_key=' + myApiKey + '&query=' + title,

    success: function(movie){
      if(movie.results.length < 1){
        $('.fail').css('display', 'block');
        $('.results').css('display', 'none');
        $("#loader").delay(500).fadeOut();
      } else {
        $("#loader").fadeIn();
        $('.fail').css('display', 'none');
        $('.results').delay(1000).css('display', 'block');
        var movieId = movie.results[0].id;
        var movieTitle = movie.results[0].original_title;
        movieRecs(movieTitle, movieId, myApiKey);
      }
    },
    error: function(){
      alert('Invalid Request');
      $("#loader").delay(500).fadeOut();
    },
  });
}

// passing the movie name to get the similar movies from Python's Flask
function movieRecs(movieTitle, movieId, myApiKey){
  $.ajax({
    type: 'POST',
    url: "/similarity",
    data: {'name': movieTitle},
    success: function(recs){
      if(recs == "Sorry! The movie you requested is not in our database. Please check the spelling or try with some other movies"){
        $('.fail').css('display', 'block');
        $('.results').css('display', 'none');
        $("#loader").delay(500).fadeOut();
      } else {
        $('.fail').css('display', 'none');
        $('.results').css('display', 'block');
        var movieArr = recs.split('---');
        var arr = [];
        for(const movie in movieArr){
          arr.push(movieArr[movie]);
        }
        getMovieDetails(movieId, myApiKey, arr, movieTitle);
      }
    },
    error: function(){
      alert("error recs");
      $("#loader").delay(500).fadeOut();
    },
  }); 
}

// get all the details of the movie using the movie id.
function getMovieDetails(movieId, myApiKey, arr, movieTitle) {
  $.ajax({
    type: 'GET',
    url: 'https://api.themoviedb.org/3/movie/' + movieId + '?api_key=' + myApiKey,
    success: function(movieDetails){
      showDetails(movieDetails, arr, movieTitle, myApiKey, movieId);
    },
    error: function(){
      alert("API Error!");
      $("#loader").delay(500).fadeOut();
    },
  });
}

// passing all the details to Python's Flask for displaying and scraping the movie reviews using IMDb id
function showDetails(movieDetails, arr, movieTitle, myApiKey, movieId){
  var imdbId = movieDetails.imdb_id;
  var poster = 'https://image.tmdb.org/t/p/original' + movieDetails.poster_path;
  var overview = movieDetails.overview;
  var genres = movieDetails.genres;
  var rating = movieDetails.vote_average;
  var voteCount = movieDetails.vote_count;
  var releaseDate = new Date(movieDetails.release_date);
  var runtime = parseInt(movieDetails.runtime);
  var status = movieDetails.status;
  var genreList = []
  for (var genre in genres){
    genreList.push(genres[genre].name);
  }
  var myGenre = genreList.join(", ");
  if(runtime % 60 == 0){
    runtime = Math.floor(runtime / 60) + " hour(s)"
  } else {
    runtime = Math.floor(runtime / 60) + " hour(s) " + (runtime % 60) + " min(s)"
  }
  arrPoster = getMoviePosters(arr, myApiKey);
  
  movieCast = getMovieCast(movieId, myApiKey);
  
  indCast = getIndividualCast(movieCast, myApiKey);
  
  details = {
    'title': movieTitle,
    'castIds': JSON.stringify(movieCast.castIds),
    'castNames': JSON.stringify(movieCast.castNames),
    'castChars': JSON.stringify(movieCast.castChars),
    'castProfiles': JSON.stringify(movieCast.castProfiles),
    'castBdays': JSON.stringify(indCast.castBdays),
    'castBios': JSON.stringify(indCast.castBios),
    'castPlaces': JSON.stringify(indCast.castPlaces),
    'imdbId': imdbId,
    'poster': poster,
    'genres': myGenre,
    'overview': overview,
    'rating': rating,
    'voteCount': voteCount.toLocaleString(),
    'releaseDate': releaseDate.toDateString().split(' ').slice(1).join(' '),
    'runtime': runtime,
    'status': status,
    'recMovies': JSON.stringify(arr),
    'recPosters': JSON.stringify(arrPoster),
  }

  $.ajax({
    type: 'POST',
    data: details,
    url: "/recommend",
    dataType: 'html',
    complete: function(){
      $("#loader").delay(500).fadeOut();
    },
    success: function(response) {
      $('.results').html(response);
      $('#autoComplete').val('');
      $(window).scrollTop(0);
    }
  });
}

// get the details of individual cast
function getIndividualCast(movieCast, myApiKey) {
    castBdays = [];
    castBios = [];
    castPlaces = [];
    for(var castId in movieCast.castIds){
      $.ajax({
        type: 'GET',
        url: 'https://api.themoviedb.org/3/person/' + movieCast.castIds[castId] + '?api_key=' + myApiKey,
        async: false,
        success: function(castDetails){
          castBdays.push((new Date(castDetails.birthday)).toDateString().split(' ').slice(1).join(' '));
          castBios.push(castDetails.biography);
          castPlaces.push(castDetails.place_of_birth);
        }
      });
    }
    return {castBdays: castBdays, castBios: castBios, castPlaces: castPlaces};
  }

// getting the details of the cast for the requested movie
function getMovieCast(movieId, myApiKey){
    castIds = [];
    castNames = [];
    castChars = [];
    castProfiles = [];

    top10 = [0,1,2,3,4,5,6,7,8,9];
    $.ajax({
      type: 'GET',
      url: "https://api.themoviedb.org/3/movie/" + movieId + "/credits?api_key=" + myApiKey,
      async: false,
      success: function(myMovie){
        if(myMovie.cast.length >= 10){
          topCast = [0,1,2,3,4,5,6,7,8,9];
        } else {
          topCast = [0,1,2,3,4];
        }
        for(var myCast in topCast){
          castIds.push(myMovie.cast[myCast].id)
          castNames.push(myMovie.cast[myCast].name);
          castChars.push(myMovie.cast[myCast].character);
          castProfiles.push("https://image.tmdb.org/t/p/original" + myMovie.cast[myCast].profile_path);
        }
      },
      error: function(){
        alert("Invalid Request!");
        $("#loader").delay(500).fadeOut();
      }
    });

    return {castIds: castIds, castNames: castNames, castChars: castChars, castProfiles: castProfiles};
  }

// getting posters for all the recommended movies
function getMoviePosters(arr, myApiKey){
  var arrPosterList = []
  for(var m in arr) {
    $.ajax({
      type: 'GET',
      url: 'https://api.themoviedb.org/3/search/movie?api_key=' + myApiKey + '&query=' + arr[m],
      async: false,
      success: function(mData){
        arrPosterList.push('https://image.tmdb.org/t/p/original' + mData.results[0].poster_path);
      },
      error: function(){
        alert("Invalid Request!");
        $("#loader").delay(500).fadeOut();
      },
    })
  }
  return arrPosterList;
}
