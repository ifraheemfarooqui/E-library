import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login   from "./pages/Login";
import SignUp  from "./pages/SignUp";
import Home    from "./pages/Home";
import MyBooks from "./pages/MyBooks";
import Profile from "./pages/Profile";
import Library from "./pages/Libaray";
import Admin from "./pages/Admin";
import ProtectedRoute from "./components/ProtectedRoute";
import Reader from "./pages/Reader";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/"       element={<Login />} />
        <Route path="/login"  element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
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
<Route path="/reader/:id" element={
  <ProtectedRoute><Reader /></ProtectedRoute>
}/>
      </Routes>
    </BrowserRouter>
  );
}