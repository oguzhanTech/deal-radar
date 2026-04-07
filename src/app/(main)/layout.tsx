import MainLayoutClient from "./main-layout-client";

export default async function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <MainLayoutClient initialUser={null} initialProfile={null}>
      {children}
    </MainLayoutClient>
  );
}
