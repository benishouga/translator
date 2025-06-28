import { useState } from "react";

function App() {
  const [page, setPage] = useState("home");

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100">
      <nav className="mb-4 space-x-4">
        <button
          className="px-4 py-2 bg-blue-500 text-white rounded"
          onClick={() => setPage("home")}
        >
          Home
        </button>
        <button
          className="px-4 py-2 bg-green-500 text-white rounded"
          onClick={() => setPage("about")}
        >
          About
        </button>
      </nav>
      <main className="p-8 bg-white rounded shadow text-center">
        {page === "home" && <h1 className="text-2xl font-bold">Home Page</h1>}
        {page === "about" && <h1 className="text-2xl font-bold">About Page</h1>}
      </main>
    </div>
  );
}

export default App;
