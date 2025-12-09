import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShieldCheck, Menu, X, FileText, User } from "lucide-react";
import { useState } from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function Navbar() {
  const [location] = useLocation();
  const [isOpen, setIsOpen] = useState(false);
  const isAuth = location !== "/" && location !== "/auth";

  return (
    <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link href="/">
          <a className="flex items-center gap-2 font-serif font-bold text-xl text-primary tracking-tight">
            <ShieldCheck className="h-6 w-6" />
            PayMyValue
          </a>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-6">
          <Link href="/"><a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">How it Works</a></Link>
          <Link href="/"><a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Pricing</a></Link>
          <Link href="/"><a className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">FAQ</a></Link>
          
          <div className="h-6 w-px bg-border mx-2" />

          {isAuth ? (
            <div className="flex items-center gap-4">
               <Link href="/dashboard">
                <Button variant="ghost" size="sm">Dashboard</Button>
              </Link>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="rounded-full">
                    <User className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem>Profile</DropdownMenuItem>
                  <DropdownMenuItem>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => window.location.href = '/'}>Log out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          ) : (
            <div className="flex items-center gap-4">
              <Link href="/auth">
                <Button variant="ghost" size="sm">Log In</Button>
              </Link>
              <Link href="/dashboard">
                <Button size="sm">Start Appraisal</Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Toggle */}
        <button className="md:hidden" onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Nav */}
      {isOpen && (
        <div className="md:hidden border-t p-4 bg-background">
          <div className="flex flex-col space-y-4">
             <Link href="/"><a className="text-sm font-medium">How it Works</a></Link>
             <Link href="/"><a className="text-sm font-medium">Pricing</a></Link>
             <Link href="/auth">
                <Button variant="outline" className="w-full justify-start">Log In</Button>
             </Link>
             <Link href="/dashboard">
                <Button className="w-full justify-start">Start Appraisal</Button>
             </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
