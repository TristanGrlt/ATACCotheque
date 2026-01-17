import { Outlet } from "react-router-dom"

export function SideBar() {
  return (
    <div className="relative flex min-h-svh flex-col bg-background md:pl-20">
      side bar
      <main className="flex flex-1 flex-col px-0 pb-28 pt-6 md:px-8 md:pb-12">
        <Outlet />
      </main>
    </div>
  )
}