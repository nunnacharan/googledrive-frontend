import { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import API from "../services/api";
import toast from "react-hot-toast";

import {
  FaFolder,
  FaFileAlt,
  FaTrash,
  FaDownload,
  FaEdit,
  FaUserCircle,
  FaHome
} from "react-icons/fa";

export default function Dashboard() {
  const nav = useNavigate();

  /* ================= STATES ================= */
  const [files, setFiles] = useState([]);
  const [folders, setFolders] = useState([]);

  const [currentFolder, setCurrentFolder] = useState(null);
  const [currentName, setCurrentName] = useState("Home");

  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("date");
  const [open, setOpen] = useState(false);

  // 👉 Tour states
  const [showTour, setShowTour] = useState(false);
  const [tourStep, setTourStep] = useState(0);

  /* ================= FETCH ================= */
  const fetchFiles = useCallback(async () => {
    const res = await API.get("/files", {
      params: { parent: currentFolder }
    });
    setFiles(res.data);
  }, [currentFolder]);

  const fetchFolders = useCallback(async () => {
    const res = await API.get("/files/folders");
    setFolders(res.data);
  }, []);

  useEffect(() => {
    fetchFiles();
    fetchFolders();

    // 👉 Show tour only once
    const tourDone = localStorage.getItem("dashboardTourDone");
    if (!tourDone) {
      setShowTour(true);
    }
  }, [fetchFiles, fetchFolders]);

  /* ================= ACTIONS ================= */
  const logout = () => {
    localStorage.clear();
    nav("/", { replace: true });
  };

  const upload = async (file) => {
    const form = new FormData();
    form.append("file", file);
    if (currentFolder) form.append("parentId", currentFolder);

    await API.post("/files/upload", form);
    toast.success(`Uploaded to ${currentName}`);
    fetchFiles();
  };

  const createFolder = async () => {
    const name = prompt("Folder name");
    if (!name) return;

    await API.post("/files/folder", { name, parentId: currentFolder });
    toast.success("Folder created");
    fetchFolders();
  };

  const remove = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    await API.delete(`/files/${id}`);
    toast.success("Deleted");
    fetchFiles();
  };

  const rename = async (id, old) => {
    const name = prompt("Rename", old);
    if (!name) return;
    await API.put(`/files/${id}`, { name });
    toast.success("Renamed");
    fetchFiles();
  };

  /* ================= FILE OPEN / DOWNLOAD ================= */
  const openFileInNewTab = async (fileId) => {
    try {
      const res = await API.get(`/files/open/${fileId}`);
      window.open(res.data.url, "_blank");
    } catch {
      toast.error("Unable to open file");
    }
  };

  const downloadFile = async (fileId) => {
    try {
      const res = await API.get(`/files/open/${fileId}`);
      window.location.href = res.data.url;
    } catch {
      toast.error("Download failed");
    }
  };

  /* ================= TOUR CONTROLS ================= */
  const nextTourStep = () => {
    if (tourStep === 2) {
      endTour();
    } else {
      setTourStep((s) => s + 1);
    }
  };

  const endTour = () => {
    localStorage.setItem("dashboardTourDone", "true");
    setShowTour(false);
    setTourStep(0);
  };

  /* ================= HELPERS ================= */
  const sortedFiles = [...files]
    .filter((f) =>
      f.name.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) =>
      sort === "name"
        ? a.name.localeCompare(b.name)
        : new Date(b.createdAt) - new Date(a.createdAt)
    );

  const recentFiles = sortedFiles.filter((f) => !f.isFolder).slice(0, 4);

  /* ================= UI ================= */
  return (
    <div className="flex flex-col md:flex-row h-screen bg-gray-100">

      {/* ================= SIDEBAR ================= */}
      <div className="w-full md:w-64 bg-white shadow-md p-4 md:p-6">
        <h2 className="text-xl font-bold text-blue-600 mb-4">
          ☁ Cloud Drive
        </h2>

        <div
          onClick={() => {
            setCurrentFolder(null);
            setCurrentName("Home");
          }}
          className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100"
        >
          <FaHome /> Home
        </div>

        <p className="text-gray-400 text-xs mt-4 mb-2">FOLDERS</p>

        {folders.map((f) => (
          <div
            key={f._id}
            onClick={() => {
              setCurrentFolder(f._id);
              setCurrentName(f.name);
            }}
            className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-gray-100"
          >
            <FaFolder className="text-yellow-400" />
            <span className="truncate">{f.name}</span>
          </div>
        ))}

        <button
          onClick={createFolder}
          className="bg-blue-600 text-white py-2 rounded-lg mt-4 w-full"
        >
          + New Folder
        </button>
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 p-4 md:p-8 overflow-auto">

        {/* HEADER */}
        <div className="flex justify-between mb-6">
          <h3 className="font-semibold text-lg">{currentName}</h3>

          <div className="flex items-center gap-3">
            <input
              placeholder="Search files..."
              className="border px-3 py-2 rounded-lg"
              onChange={(e) => setSearch(e.target.value)}
            />

            <FaUserCircle
              size={26}
              className="cursor-pointer"
              onClick={() => setOpen(!open)}
            />

            {open && (
              <button
                onClick={logout}
                className="text-sm text-red-600"
              >
                Logout
              </button>
            )}
          </div>
        </div>

        {/* ================= RECENT FILES ================= */}
        {recentFiles.length > 0 && (
          <>
            <h4 className="font-semibold mb-3">Recent files</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {recentFiles.map((f) => (
                <div
                  key={f._id}
                  onClick={() => openFileInNewTab(f._id)}
                  className="bg-white p-4 rounded-lg shadow cursor-pointer hover:shadow-md"
                >
                  <FaFileAlt className="text-blue-500 mb-2" />
                  <p className="text-sm truncate">{f.name}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* ================= FILE GRID ================= */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {sortedFiles.map((f) => (
            <div
              key={f._id}
              onClick={() => {
                if (!f.isFolder) openFileInNewTab(f._id);
              }}
              className={`group bg-white p-5 rounded-xl border hover:shadow-lg relative ${
                !f.isFolder ? "cursor-pointer" : ""
              }`}
            >
              <div className="flex items-center gap-2 mb-2">
                {f.isFolder ? (
                  <FaFolder className="text-yellow-400" />
                ) : (
                  <FaFileAlt className="text-blue-500" />
                )}
                <span className="truncate font-medium">{f.name}</span>
              </div>

              <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-5 opacity-0 group-hover:opacity-100">
                {!f.isFolder && (
                  <FaDownload
                    className="hover:text-blue-600"
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadFile(f._id);
                    }}
                  />
                )}
                <FaEdit
                  className="hover:text-green-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    rename(f._id, f.name);
                  }}
                />
                <FaTrash
                  className="hover:text-red-600"
                  onClick={(e) => {
                    e.stopPropagation();
                    remove(f._id, f.name);
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ================= TOUR ================= */}
      {showTour && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-xl w-80 text-center">
            {tourStep === 0 && (
              <>
                <h3 className="font-semibold mb-2">Welcome 👋</h3>
                <p className="text-sm text-gray-600">
                  Use the sidebar to navigate folders.
                </p>
              </>
            )}
            {tourStep === 1 && (
              <>
                <h3 className="font-semibold mb-2">Upload Files 📤</h3>
                <p className="text-sm text-gray-600">
                  Drag & drop or upload files easily.
                </p>
              </>
            )}
            {tourStep === 2 && (
              <>
                <h3 className="font-semibold mb-2">Manage Files 📁</h3>
                <p className="text-sm text-gray-600">
                  Click any file to open it instantly.
                </p>
              </>
            )}

            <div className="flex justify-between mt-4">
              <button
                onClick={endTour}
                className="text-sm text-gray-500"
              >
                Skip
              </button>
              <button
                onClick={nextTourStep}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm"
              >
                {tourStep === 2 ? "Finish" : "Next"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
