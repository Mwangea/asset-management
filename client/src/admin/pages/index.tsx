
import { Outlet } from "react-router-dom";
import AdminLayout from "../Dashboard/AdminLayout";



export default function AdminDashboard() {
  return (
    <AdminLayout>
      <Outlet />
    </AdminLayout>
  );
}