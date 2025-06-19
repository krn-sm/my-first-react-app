import React, { useEffect, useState } from "react";
import { useDebounce } from "react-use";
import Search from "./components/Search.jsx";
import Spinner from "./components/Spinner.jsx";
import MovieCard from "./components/MovieCard.jsx";
import { updateSearchCount, getTrendingMovies } from "./appwrite.js";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const App = () => {
  const [searchTerm, setsearchTerm] = useState("");
  const [errorMessage, seterrorMessage] = useState("");
  const [movieList, setmovieList] = useState([]);
  const [isLoading, setisLoading] = useState(false);
  const [debouncedSearchTerm, setdebouncedSearchTerm] = useState("");
  const [trendingMovies, settrendingMovies] = useState([]);
  const [genres, setGenres] = useState([]);
  const [selectedGenre, setSelectedGenre] = useState("");
  const [minRating, setMinRating] = useState("0");

  useDebounce(() => setdebouncedSearchTerm(searchTerm), 500, [searchTerm]);

  const fetchGenres = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/genre/movie/list`,
        API_OPTIONS
      );
      const data = await response.json();
      setGenres(data.genres);
    } catch (error) {
      console.error("Failed to fetch genres", error);
    }
  };

  const fetchMovies = async (query = "") => {
    setisLoading(true);
    seterrorMessage("");
    try {
      let endpoint = query
        ? `${API_BASE_URL}/search/movie?query=${encodeURIComponent(query)}`
        : `${API_BASE_URL}/discover/movie?sort_by=popularity.desc`;

      const response = await fetch(endpoint, API_OPTIONS);
      const data = await response.json();

      const filtered = (data.results || []).filter((movie) => {
        const matchesRating = movie.vote_average >= parseFloat(minRating);
        const matchesGenre = selectedGenre
          ? movie.genre_ids?.includes(parseInt(selectedGenre))
          : true;
        return matchesRating && matchesGenre;
      });

      setmovieList(filtered);

      if (query && filtered.length > 0) {
        updateSearchCount(query, filtered[0]);
      }
    } catch (error) {
      console.error(`Error fetching movies: ${error}`);
      seterrorMessage("Error fetching movies. Please try again later.");
    } finally {
      setisLoading(false);
    }
  };

  const loadTrendingMovies = async () => {
    try {
      const movies = await getTrendingMovies();
      settrendingMovies(movies);
    } catch (error) {
      console.error(`Error fetching trending movies: ${error}`);
    }
  };

  useEffect(() => {
    fetchMovies(debouncedSearchTerm);
  }, [debouncedSearchTerm, selectedGenre, minRating]);

  useEffect(() => {
    loadTrendingMovies();
    fetchGenres();
  }, []);

  return (
    <main>
      <div className="pattern" />
      <div className="wrapper">
        <header>
          <img src="./hero.png" alt="Hero Banner" />
          <h1>
            Find <span className="text-gradient">Movies</span> You All Enjoy
            Without The Hassle
          </h1>
          <Search searchTerm={searchTerm} setsearchTerm={setsearchTerm} />

          {/* Filters */}
          <div className="filters flex flex-col sm:flex-row justify-between gap-4 mt-4">
            <select
              value={selectedGenre}
              onChange={(e) => setSelectedGenre(e.target.value)}
              className="p-2 border border-gray-600 rounded bg-blue-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-950 hover:bg-gray-700"
            >
              <option value="">All Genres</option>
              {genres.map((genre) => (
                <option key={genre.id} value={genre.id}>
                  {genre.name}
                </option>
              ))}
            </select>

            <select
              value={minRating}
              onChange={(e) => setMinRating(e.target.value)}
              className="p-2 border border-gray-600 rounded bg-blue-950 text-white focus:outline-none focus:ring-2 focus:ring-blue-950 hover:bg-gray-700"
            >
              <option value="0">All Ratings</option>
              <option value="5">5+</option>
              <option value="6">6+</option>
              <option value="7">7+</option>
              <option value="8">8+</option>
            </select>
          </div>
        </header>

        {trendingMovies.length > 0 && (
          <section className="trending">
            <h2>Trending Movies</h2>
            <ul>
              {trendingMovies.map((movie, index) => (
                <li key={movie.$id}>
                  <p>{index + 1}</p>
                  <img src={movie.poster_url} alt={movie.title} />
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="all-movies">
          <h2>All Movies</h2>
          {isLoading ? (
            <Spinner />
          ) : errorMessage ? (
            <p className="text-red-500">{errorMessage}</p>
          ) : (
            <ul>
              {movieList.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </ul>
          )}
        </section>

        <h1 className="text-white">{searchTerm}</h1>
      </div>
    </main>
  );
};

export default App;
