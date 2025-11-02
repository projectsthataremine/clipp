import Header from "@/components/Header/Header";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header showLogoOnly={true} />
      <main>{children}</main>
    </>
  );
}
