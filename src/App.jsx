import { BrowserRouter, Routes, Route } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import Login   from "./pages/Login";
import SignUp  from "./pages/SignUp";
import Home    from "./pages/Home";
import MyBooks from "./pages/MyBooks";
import Profile from "./pages/Profile";
import Library from "./pages/Libaray";
import Admin from "./pages/Admin";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/"       element={<Login />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<SignUp />} />

        {/* Protected routes — must be logged in */}
        <Route path="/home" element={
          <ProtectedRoute><Home /></ProtectedRoute>
        }/>
        <Route path="/library" element={
          <ProtectedRoute><Library /></ProtectedRoute>
        }/>
        <Route path="/my-books" element={
          <ProtectedRoute><MyBooks /></ProtectedRoute>
        }/>
        <Route path="/profile" element={
          <ProtectedRoute><Profile /></ProtectedRoute>
        }/>
        <Route path="/admin" element={
  <ProtectedRoute><Admin/></ProtectedRoute>
}/>
      </Routes>
    </BrowserRouter>
  );
}