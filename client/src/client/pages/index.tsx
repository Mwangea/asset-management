
import { Outlet } from "react-router-dom";
import Layout from "../Dashboard/Layout";


export default function UserDashboard() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}