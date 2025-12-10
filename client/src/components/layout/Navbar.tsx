import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Menu, X, User } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 font-serif font-bold text-xl text-primary tracking-tight" data-testid="link-logo">
          <ShieldCheck className="h-6 w-6" />
          PayMyValue
        </Link>

        <div className="hidden md:flex items-center gap-6">
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How it Works</Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</Link>
          <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</Link>
          
          <div className="h-6 w-px bg-border mx-2" />

          {isAuthenticated ? (
            <div className="flex items-center gap-4">
               <Link href="/dashboard">
                <Button variant="ghost" size="sm" data-testid="button-dashboard">Dashboard</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full" data-testid="button-user-menu">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem data-testid="menu-profile">
                    {user?.name || user?.email || "Profile"}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => logout()} data-testid="menu-logout">
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/auth">
                <Button variant="ghost" size="sm" data-testid="button-login">Log In</Button>
              </Link>
              <Link href="/auth">
                <Button size="sm" data-testid="button-start">Start Appraisal</Button>
              </Link>
            </div>
          )}
        </div>

        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)} data-testid="button-mobile-menu">
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {isOpen && (
        <div className="md:hidden border-t p-4 bg-background">
          <div className="flex flex-col space-y-4">
             <Link href="/" className="text-sm font-medium">How it Works</Link>
             <Link href="/" className="text-sm font-medium">Pricing</Link>
             {isAuthenticated ? (
               <>
                 <Link href="/dashboard">
                    <Button variant="outline" className="w-full justify-start">Dashboard</Button>
                 </Link>
                 <Button variant="ghost" className="w-full justify-start" onClick={() => logout()}>
                   Log out
                 </Button>
               </>
             ) : (
               <>
                 <Link href="/auth">
                    <Button variant="outline" className="w-full justify-start">Log In</Button>
                 </Link>
                 <Link href="/auth">
                    <Button className="w-full justify-start">Start Appraisal</Button>
                 </Link>
               </>
             )}
          </div>
        </div>
      )}
    </nav>
  );
}
