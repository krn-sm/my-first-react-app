import React, { useEffect, useState } from "react";

const API_BASE_URL = "https://api.themoviedb.org/3";
const API_KEY = import.meta.env.VITE_TMDB_API_KEY;

const API_OPTIONS = {
  method: "GET",
  headers: {
    accept: "application/json",
    Authorization: `Bearer ${API_KEY}`,
  },
};

const MovieCard = ({
  movie: {
    title,
    vote_average,
    poster_path,
    release_date,
    original_language,
    id,
  },
}) => {
  const [watchProviders, setWatchProviders] = useState([]);
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailerKey, setTrailerKey] = useState(null);
  const [trailerError, setTrailerError] = useState(""); // fallback message
  const [trailerLoading, setTrailerLoading] = useState(false); // loading state

  useEffect(() => {
    const fetchWatchProviders = async () => {
      try {
        const response = await fetch(
          `${API_BASE_URL}/movie/${id}/watch/providers`,
          API_OPTIONS
        );
        const data = await response.json();
        const providers = data.results?.IN?.flatrate || [];
        setWatchProviders(providers);
      } catch (error) {
        console.error("Error fetching watch providers", error);
      }
    };

    fetchWatchProviders();
  }, [id]);

  const fetchTrailer = async () => {
    setTrailerLoading(true);
    setTrailerError("");
    try {
      const res = await fetch(
        `${API_BASE_URL}/movie/${id}/videos`,
        API_OPTIONS
      );
      const data = await res.json();
      const trailer = data.results.find(
        (vid) => vid.type === "Trailer" && vid.site === "YouTube"
      );

      if (trailer) {
        setTrailerKey(trailer.key);
      } else {
        setTrailerError("No trailer available for this movie.");
      }
      setShowTrailer(true);
    } catch (err) {
      console.error("Trailer fetch failed:", err);
      setTrailerError("Failed to fetch trailer.");
      setShowTrailer(true);
    } finally {
      setTrailerLoading(false);
    }
  };

  return (
    <div className="movie-card relative">
      <img
        src={
          poster_path
            ? `https://image.tmdb.org/t/p/w500/${poster_path}`
            : "/no-movie.png"
        }
        alt={title}
      />
      <div className="mt-4">
        <h3>{title}</h3>
        <div className="content">
          <div className="rating">
            <img src="star.svg" alt="Star icon" />
            <p>{vote_average ? vote_average.toFixed(1) : "NIL"}</p>
          </div>
          <span>•</span>
          <p className="lang">{original_language}</p>
          <span>•</span>
          <p className="year">
            {release_date ? release_date.split("-")[0] : "N/A"}
          </p>
          <button
            onClick={fetchTrailer}
            className="mt-2 px-3 py-1 bg-gray-900 text-white rounded hover:bg-blue-950"
          >
            🎬 Watch Trailer
          </button>
        </div>

        {watchProviders.length > 0 && (
          <div className="watch-providers mt-2">
            <p className="text-white">Streaming on:</p>
            <div className="flex gap-2 mt-1">
              {watchProviders.map((provider) => (
                <img
                  key={provider.provider_id}
                  src={`https://image.tmdb.org/t/p/w92${provider.logo_path}`}
                  alt={provider.provider_name}
                  className="h-10 w-auto"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Trailer Modal */}
      {showTrailer && (
        <div className="fixed inset-0 bg-black bg-opacity-80 flex justify-center items-center z-50">
          <div className="bg-black p-4 rounded relative w-[90%] max-w-2xl">
            <button
              onClick={() => {
                setShowTrailer(false);
                setTrailerKey(null);
                setTrailerError("");
              }}
              className="absolute top-2 right-2 text-white text-xl"
            >
              ✖
            </button>

            {trailerLoading ? (
              <div className="text-white text-center p-10">⏳ Loading...</div>
            ) : trailerError ? (
              <div className="text-white text-center p-10">{trailerError}</div>
            ) : (
              <iframe
                width="100%"
                height="400"
                src={`https://www.youtube.com/embed/${trailerKey}`}
                title="Trailer"
                allow="autoplay; encrypted-media"
                allowFullScreen
              ></iframe>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default MovieCard;
