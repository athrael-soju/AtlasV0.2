'use client';
import { DashboardNav } from '@/components/dashboard-nav';
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
  SheetDescription
} from '@/components/ui/sheet'; // import SheetTitle
import { NavItem } from '@/types';
import { MenuIcon } from 'lucide-react';
import { useState } from 'react';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  navItems: NavItem[];
}

export function MobileSidebar({ navItems }: SidebarProps) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <MenuIcon />
        </SheetTrigger>
        <SheetContent side="left" className="!px-0">
          <VisuallyHidden>
            <SheetTitle />
            <SheetDescription />
          </VisuallyHidden>
          <div className="space-y-4 py-4">
            <div className="px-3 py-2">
              <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                Overview
              </h2>
              <div className="space-y-1">
                <DashboardNav
                  items={navItems}
                  sidebarExpanded={true}
                  isMobileNav={true}
                  setOpen={setOpen}
                />
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
