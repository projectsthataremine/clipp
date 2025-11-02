import Header from "@/components/Header/Header";

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header hideTabs={true} />
      <main>{children}</main>
    </>
  );
}
