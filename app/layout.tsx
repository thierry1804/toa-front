import { Outlet } from "react-router-dom";

export default function RootLayout() {
  return (
    <div className="flex min-h-dvh flex-1 flex-col font-sans">
      <Outlet />
    </div>
  );
}
