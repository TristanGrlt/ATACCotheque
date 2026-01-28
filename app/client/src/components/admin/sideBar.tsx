import { Link, Outlet, useLocation } from "react-router-dom"
import { EllipsisVertical, Home, Inbox, LogOut, Monitor, Moon, Sun, User } from "lucide-react"
 
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar"

import logo from '/atacc_logo.png'
import { Separator } from "../ui/separator"
import { Button } from "../ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuGroup, 
  DropdownMenuItem, 
  DropdownMenuPortal, 
  DropdownMenuRadioGroup, 
  DropdownMenuRadioItem, 
  DropdownMenuSeparator, 
  DropdownMenuSub, 
  DropdownMenuSubContent, 
  DropdownMenuSubTrigger, 
  DropdownMenuTrigger 
} from "../ui/dropdown-menu"

import { useIsMobile } from "@/hooks/use-mobile"
import { useAuth } from "@/contexts/AuthContext"
import { useTheme } from "../theme-provider"
import type { Theme } from "../theme-provider"
import { Toaster } from "../ui/sonner"

const items = [
  {
    title: "Tableau de bord",
    url: "dashboard",
    icon: Home,
  },
  {
    title: "Annale en attente",
    url: "toto",
    icon: Inbox,
  },
  {
    title: "Utilisateurs",
    url: "users",
    icon: User,
  },
]

export function SideBar() {

  const isMobile = useIsMobile();
  const { logout, username } = useAuth();
  const { theme, setTheme } = useTheme();

  // Déduire le titre de la section depuis l'URL courante
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1] ?? '';
  const currentItem = items.find((i) => i.url === lastSegment || location.pathname.endsWith(`/${i.url}`));
  const sectionTitle = currentItem
    ? currentItem.title
    : 'error'

  return (
    <SidebarProvider 
    style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <Sidebar collapsible="offcanvas" variant="inset">
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
              asChild
              className="data-[slot=sidebar-menu-button]:p-1.5!"
            >
              <Link to="/">
                <img src={logo} alt="logo" width={25} />
                <span className="text-base font-semibold">Attacothèque.</span>
              </Link>
            </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Application</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {items.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton asChild>
                      <Link to={item.url}>
                        <item.icon />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <SidebarMenuButton 
                    size="lg"
                    className="data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground"
                  >
                    <Avatar className="h-8 w-8 rounded-lg">
                      <AvatarFallback className="h-8 w-8 rounded-lg">{username?.slice(0, 2).toUpperCase()}</AvatarFallback>
                    </Avatar>
                    <div className="grid flex-1 text-left text-sm leading-tight">
                      <p>{username}</p>
                    </div>
                    <EllipsisVertical />
                  </SidebarMenuButton>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  className="w-(--radix-dropdown-menu-trigger-width) min-w-56 rounded-lg"
                  side={isMobile ? "bottom" : "right"}
                  align="end"
                  sideOffset={4}
                >
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>Thème</DropdownMenuSubTrigger>
                    <DropdownMenuPortal>
                      <DropdownMenuSubContent>
                        <DropdownMenuGroup>
                          <DropdownMenuRadioGroup
                            value={theme}
                            onValueChange={(value) => setTheme(value as Theme)}
                          >
                            <DropdownMenuRadioItem value="light"><Sun /> Claire</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="dark"><Moon /> Sombre</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="system"><Monitor /> Système</DropdownMenuRadioItem>
                          </DropdownMenuRadioGroup>
                        </DropdownMenuGroup>
                      </DropdownMenuSubContent>
                    </DropdownMenuPortal>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onClick={logout}>
                    <LogOut />
                    Se déconnecter
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset className="px-2">
        <header className="flex h-(--header-height) shrink-0 items-center gap-2 border-b transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-(--header-height) bg-background">
          <div className="flex w-full items-center gap-1 lg:gap-2 px-2">
            <SidebarTrigger className="-ml-1" />
            <Separator
              orientation="vertical"
              className="mx-2 data-[orientation=vertical]:h-4"
            />
            <h1 className="text-base font-medium">{sectionTitle}</h1>
            <div className="ml-auto flex items-center gap-2">
              <Button variant="ghost" asChild size="sm" className="hidden sm:flex">
                <a
                  href="#"
                  rel="noopener noreferrer"
                  target="_blank"
                  className="dark:text-foreground"
                >
                  GitHub
                </a>
              </Button>
            </div>
          </div>
        </header>
          <div>
            <Toaster />
            <Outlet />
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}